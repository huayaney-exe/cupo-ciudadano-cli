import { approveGate } from "../cli/agent/trust-ladder.js";
import { beginAudit } from "../cli/foundation/audit-lifecycle.js";
import { getKillswitchState } from "../cli/safety/killswitch.js";
import { bold, danger, dim, muted, ok, strong, warn } from "../cli/platform/style.js";
import { positional, requireStr, str } from "../core/args.js";
import { AppError, fail } from "../core/errors.js";
import { appHome, paths, profileName } from "../core/paths.js";
import {
  gymMembershipActive, gymMembershipAvailability, gymMembershipPurchase, gymMembershipQuote, gymMembershipStatus, me, membershipReservations, transferBank,
} from "../idrd/api.js";
import { accessToken } from "../idrd/auth.js";
import { membershipPaymentPayload, publicIp, RECEIPT_BASE } from "../idrd/payment.js";
import type { Ctx } from "./context.js";
import { courtId } from "./read.js";

/**
 * Gyms (the CEFE "OTRO(MÓDULO)" endowments) can be used by the hour like any
 * other space (`booking create`) or through a monthly membership. The
 * membership is paid through the same PSE gateway as a booking, then
 * activated with the payment code. None of the membership writes has been
 * exercised live: the payloads mirror the portal's own screen.
 */

function cop(n: unknown): string {
  const v = Number(n ?? 0);
  return Number.isFinite(v) ? v.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }) : String(n);
}

export async function gymStatus(ctx: Ctx) {
  const id = courtId(positional(ctx.args, 0, "id"));
  const { token } = await accessToken(ctx.flags.profile);
  const st = await gymMembershipStatus(token, id);
  const active = Boolean(st.active);
  let reservations: Record<string, unknown> | null = null;
  if (active && st.id !== undefined) reservations = await membershipReservations(token, String(st.id)).catch(() => null);
  const data = { gymId: id, active, status: st, reservations };
  return {
    data,
    human: () =>
      active
        ? `${ok("●")} Mensualidad activa en el gimnasio ${bold(String(id))}${st.ends_at ? ` hasta ${st.ends_at}` : ""}${reservations ? `\n  ${muted(`Reservas con la mensualidad: ${Array.isArray(reservations.items) ? reservations.items.length : "?"} · cambios esta semana: ${String(reservations.changes_this_week ?? 0)}`)}` : ""}`
        : `${warn("○")} Sin mensualidad activa en el gimnasio ${bold(String(id))}.`,
    nextSteps: active
      ? [{ command: `idrd gym availability ${id}`, description: "cupos por día para usar la mensualidad" }]
      : [{ command: `idrd gym quote ${id}`, description: "cuánto cuesta y qué vigencia tendría" }],
  };
}

export async function gymQuote(ctx: Ctx) {
  const id = courtId(positional(ctx.args, 0, "id"));
  const { token } = await accessToken(ctx.flags.profile);
  const q = await gymMembershipQuote(token, id);
  const data = { gymId: id, amount: Number(q.amount ?? 0), validFrom: q.valid_from ?? null, validTo: q.valid_to ?? null, concept: q.concept ?? null, quote: q };
  return {
    data,
    human: () =>
      [
        bold(`Mensualidad · gimnasio ${id}`),
        `${muted("Valor")}     ${cop(data.amount)}`,
        `${muted("Vigencia")}  ${data.validFrom ?? "?"} → ${data.validTo ?? "?"}`,
        data.concept ? `${muted("Concepto")}  ${String(data.concept)}` : "",
      ].filter(Boolean).join("\n"),
    nextSteps: [{ command: `idrd gym buy ${id} --bank <código>`, description: "vista previa de la compra (no cobra nada)" }],
  };
}

export async function gymAvailability(ctx: Ctx) {
  const id = courtId(positional(ctx.args, 0, "id"));
  const { token } = await accessToken(ctx.flags.profile);
  const av = await gymMembershipAvailability(token, id);
  const days = Array.isArray(av.availability) ? (av.availability as Array<Record<string, unknown>>) : [];
  return {
    data: { gymId: id, days },
    human: () =>
      days.length === 0
        ? "El portal no publicó disponibilidad para la mensualidad."
        : days
            .map((d) => {
              const slots = Array.isArray(d.slots) ? (d.slots as Array<Record<string, unknown>>) : [];
              return `${bold(String(d.date))}\n${slots.map((s) => `  ${Number(s.used ?? 0) >= Number(s.quota ?? 0) ? muted("○") : ok("●")} ${String(s.start_hour ?? s.start ?? "")} ${muted(`${String(s.used ?? 0)}/${String(s.quota ?? "?")}`)}`).join("\n")}`;
            })
            .join("\n"),
  };
}

export async function gymActive(ctx: Ctx) {
  const { token } = await accessToken(ctx.flags.profile);
  const list = await gymMembershipActive(token);
  return { data: list, human: () => JSON.stringify(list, null, 2) };
}

/** Buy a membership: create it (`init`), then get the PSE link. Activation happens after paying. */
export async function gymBuy(ctx: Ctx) {
  const id = courtId(positional(ctx.args, 0, "id"));
  const bank = str(ctx.args, "bank");
  const live = ctx.args.yes === true && !ctx.flags.dryRun;
  const intent = `gym${id}@membership`;
  const { token } = await accessToken(ctx.flags.profile);
  const [u, quote, status] = await Promise.all([me(token), gymMembershipQuote(token, id), gymMembershipStatus(token, id).catch(() => ({}) as Record<string, unknown>)]);
  const amount = Number(quote.amount ?? 0);
  const k = getKillswitchState(appHome());
  const checks = [
    { name: "killswitch", ok: !k.active, detail: k.active ? `activo: ${k.reason}` : "apagado" },
    { name: "sesion", ok: u.hasProfile, detail: u.hasProfile ? u.email : `${u.email}: completa tu perfil en el portal` },
    { name: "mensualidad", ok: !status.active, detail: status.active ? `ya tienes una activa hasta ${String(status.ends_at ?? "?")}` : "sin mensualidad activa" },
    { name: "banco", ok: amount === 0 || Boolean(bank), detail: amount === 0 ? "gratis, no hace falta banco" : bank ? `PSE banco ${bank}` : "falta --bank <código> (idrd pay banks)" },
  ];
  const ready = checks.every((c) => c.ok);
  const summary = `Mensualidad gimnasio ${id} · ${cop(amount)} · ${String(quote.valid_from ?? "?")} → ${String(quote.valid_to ?? "?")}`;

  if (!live) {
    beginAudit(paths.audit(), { kind: "gym.membership.buy", command: "gym buy", tier: "T3", profile: profileName(ctx.flags.profile), meta: { gymId: id, amount, ready } }).dryRun();
    return {
      data: { dryRun: true, intent, ready, summary, amount, quote, checks, warning: "La compra crea una mensualidad y una orden de pago; el portal no permite cancelarla desde la API." },
      human: () =>
        [
          bold("Vista previa — no se compró nada"),
          `${muted("Qué")}  ${summary}`,
          "",
          ...checks.map((c) => `${c.ok ? ok("✓") : danger("✗")} ${c.name.padEnd(13)} ${muted(c.detail)}`),
          "",
          ready ? `${dim("Para comprar de verdad:")}\n  idrd gym buy ${id}${bank ? ` --bank ${bank}` : ""} --yes --confirm ${strong(intent)}` : danger("No se puede comprar mientras haya checks en rojo."),
        ].join("\n"),
      nextSteps: ready ? [{ command: `idrd gym buy ${id}${bank ? ` --bank ${bank}` : ""} --yes --confirm ${intent}`, description: "COMPRA REAL: crea la mensualidad y el link de pago" }] : [],
    };
  }

  if (k.active) fail("safety/killswitch", "Killswitch activo: escrituras bloqueadas.", "Desactívalo con `idrd killswitch off`.");
  const failed = checks.find((c) => !c.ok);
  if (failed) fail("safety/precheck", `No compro: ${failed.name} — ${failed.detail}`);
  await approveGate(
    { cliName: "idrd", flags: { json: ctx.flags.json, noInput: ctx.flags.noInput } },
    { title: "Compra de mensualidad", summary },
    { trust: "T3", yes: true, confirm: str(ctx.args, "confirm"), confirmAgainst: intent },
  );

  const a = beginAudit(paths.audit(), { kind: "gym.membership.buy", command: "gym buy", tier: "T3", profile: profileName(ctx.flags.profile), meta: { gymId: id, amount, bank: bank ?? null } });
  let membershipId: string | null = null;
  let payment: Record<string, unknown> | null = null;
  try {
    const created = await gymMembershipPurchase(token, id, { init: true });
    membershipId = created.membership_id === undefined || created.membership_id === null ? null : String(created.membership_id);
    const ip = await publicIp();
    const payload = membershipPaymentPayload(quote, u.profile, { membershipId, bankCode: amount === 0 ? "0" : bank!, ip, email: u.email });
    const res = await transferBank(token, payload, amount === 0);
    const code = typeof res.payment === "string" ? res.payment : null;
    payment = { paymentCode: code, bankUrl: typeof res.bank_url === "string" ? res.bank_url : null, receiptUrl: code ? `${RECEIPT_BASE}${code}` : null };
    if (amount > 0 && !payment.bankUrl) fail("upstream/pse-unavailable", "PSE no devolvió link de pago.", "Intenta más tarde; la mensualidad quedó creada sin pagar.");
    a.complete({ membershipId, paymentCode: code });
  } catch (e) {
    a.fail({ error: e instanceof AppError ? e.code : String(e), membershipId });
    if (membershipId) {
      // The membership exists even if the payment step failed: never hide it.
      const err = e instanceof AppError ? e : new AppError("unknown", { name: "Unknown", human: String(e) });
      payment = { ok: false, error: { code: err.code, message: err.human } };
    } else throw e;
  }
  const data = { gymId: id, membershipId, amount, payment };
  return {
    data,
    human: () =>
      [
        `${ok("✓")} Mensualidad creada${membershipId ? `: ${bold(membershipId)}` : ""} · ${summary}`,
        payment?.bankUrl ? `  ${bold("Link de pago PSE:")} ${String(payment.bankUrl)}` : "",
        payment && payment.ok === false ? danger(`  ✗ La mensualidad existe pero falló el pago: ${(payment.error as { message: string }).message}`) : "",
        payment?.paymentCode ? dim(`  Cuando pagues: idrd gym activate ${id} --code ${String(payment.paymentCode)}`) : "",
      ].filter(Boolean).join("\n"),
    nextSteps: payment?.paymentCode
      ? [
          { command: `idrd pay status ${String(payment.paymentCode)}`, description: "ver si el pago quedó aprobado" },
          { command: `idrd gym activate ${id} --code ${String(payment.paymentCode)}`, description: "activar la mensualidad con el pago aprobado" },
        ]
      : [],
  };
}

/** After PSE approves, the SPA posts the payment code back to activate the membership. */
export async function gymActivate(ctx: Ctx) {
  const id = courtId(positional(ctx.args, 0, "id"));
  const code = requireStr(ctx.args, "code");
  const { token } = await accessToken(ctx.flags.profile);
  await approveGate({ cliName: "idrd", flags: { json: ctx.flags.json, noInput: ctx.flags.noInput } }, { title: "Activar mensualidad", summary: `gimnasio ${id} · pago ${code}` }, { trust: "T2", yes: ctx.args.yes === true });
  const a = beginAudit(paths.audit(), { kind: "gym.membership.activate", command: "gym activate", tier: "T2", profile: profileName(ctx.flags.profile), meta: { gymId: id, code } });
  try {
    await gymMembershipPurchase(token, id, { payment_code: code });
    a.complete({});
  } catch (e) {
    a.fail({ error: e instanceof AppError ? e.code : String(e) });
    throw e;
  }
  const st = await gymMembershipStatus(token, id).catch(() => ({}) as Record<string, unknown>);
  return {
    data: { gymId: id, active: Boolean(st.active), status: st },
    human: () => (st.active ? `${ok("✓")} Mensualidad activada${st.ends_at ? ` hasta ${String(st.ends_at)}` : ""}.` : `${warn("!")} El portal aceptó el código pero aún no reporta la mensualidad activa.`),
    nextSteps: [{ command: `idrd gym status ${id}`, description: "confirmar estado" }],
  };
}
