import { approveGate } from "../cli/agent/trust-ladder.js";
import { beginAudit } from "../cli/foundation/audit-lifecycle.js";
import { openUrl } from "../cli/platform/open-url.js";
import { getKillswitchState } from "../cli/safety/killswitch.js";
import { bold, danger, dim, muted, ok, strong, warn } from "../cli/platform/style.js";
import { int, positional, requireStr, str } from "../core/args.js";
import { AppError, fail } from "../core/errors.js";
import { HOSTS } from "../core/http.js";
import { appHome, paths, profileName } from "../core/paths.js";
import { createBooking, getSchedule, listBanks, me, paymentStatus, transferBank, type BookingRequest } from "../idrd/api.js";
import { accessToken } from "../idrd/auth.js";
import { datesIn, hourSlots } from "../idrd/availability.js";
import {
  loadBooking, normalizeBooking, paymentPayload, publicIp, RECEIPT_BASE, saveBooking, type BookingRecord,
} from "../idrd/payment.js";
import { checkBookingRules } from "../idrd/rules.js";
import { hh, hourLabel, parseDate, parseHour } from "../idrd/time.js";
import type { Ctx } from "./context.js";

type Check = { name: string; ok: boolean; detail: string };

function assertWritable(): void {
  const k = getKillswitchState(appHome());
  if (k.active) fail("safety/killswitch", `Killswitch activo${k.reason ? ` (${k.reason})` : ""}: escrituras bloqueadas.`, "Desactívalo con `idrd killswitch off`.");
}

function audit(ctx: Ctx, kind: string, command: string, tier: string, meta: Record<string, unknown>) {
  return beginAudit(paths.audit(), { kind, command, tier, profile: profileName(ctx.flags.profile), meta });
}

export async function bookingCreate(ctx: Ctx) {
  const courtId = Number(positional(ctx.args, 0, "id"));
  if (!Number.isInteger(courtId) || courtId <= 0) fail("usage/bad-id", "Id de cancha inválido.");
  const date = parseDate(requireStr(ctx.args, "date"));
  const startHour = parseHour(requireStr(ctx.args, "hour"));
  const hours = int(ctx.args, "hours", 1)!;
  const bank = str(ctx.args, "bank");
  const intent = `${courtId}@${date}T${String(startHour).padStart(2, "0")}x${hours}`;
  const live = ctx.args.yes === true && !ctx.flags.dryRun;

  // ---- checks run on the real path in both preview and live mode
  const checks: Check[] = [];
  const k = getKillswitchState(appHome());
  checks.push({ name: "killswitch", ok: !k.active, detail: k.active ? `activo: ${k.reason}` : "apagado" });

  const sched = await getSchedule(courtId, date);
  const weekDates = datesIn(sched.entries);
  const violations = checkBookingRules({ date, startHour, hours, weekDates });
  checks.push({ name: "reglas", ok: violations.length === 0, detail: violations.map((v) => v.message).join(" ") || "cumple las reglas del portal" });

  const slots = hourSlots(sched.entries, date);
  const wanted = Array.from({ length: hours }, (_, i) => startHour + i);
  const missing = wanted.filter((h) => !slots.find((s) => s.hour === h && s.available));
  checks.push({
    name: "disponibilidad",
    ok: missing.length === 0,
    detail: missing.length ? `ocupado o no reservable: ${missing.map(hh).join(", ")}` : `libre ${hh(startHour)}–${hh(startHour + hours)} (verificado en vivo)`,
  });

  let document: string | undefined;
  let who = "";
  try {
    const { token } = await accessToken(ctx.flags.profile);
    const u = await me(token);
    document = u.document ?? undefined;
    who = `${u.email}${u.hasProfile ? "" : " (perfil incompleto)"}`;
    checks.push({ name: "sesion", ok: u.hasProfile, detail: u.hasProfile ? who : `${who}: completa tu perfil en el portal` });
  } catch (e) {
    checks.push({ name: "sesion", ok: false, detail: e instanceof AppError ? e.human : String(e) });
  }

  const body: BookingRequest = {
    date,
    start_hour: hourLabel(startHour),
    final_hour: hourLabel(startHour + hours),
    sport_id: null,
    lane: null,
    document,
    is_a_responsible_adult_required: false,
  };
  const ready = checks.every((c) => c.ok);
  const where = `${sched.endowment.description || `Cancha ${courtId}`} · ${sched.park.name}`;

  if (!live) {
    audit(ctx, "booking.create", "booking create", "T3", { courtId, date, startHour, hours, ready }).dryRun();
    const preview = {
      dryRun: true,
      intent,
      ready,
      where,
      when: `${date} ${hourLabel(startHour)}–${hourLabel(startHour + hours)}`,
      request: { method: "POST", url: `${HOSTS.api}/api/parks/schedules/${courtId}/payment`, body: { ...body, document: body.document ? "<de tu perfil>" : undefined } },
      checks,
      warning: "Las reservas del portal IDRD no se pueden cancelar desde la app ni la API.",
    };
    return {
      data: preview,
      human: () =>
        [
          bold("Vista previa — no se reservó nada"),
          `${muted("Dónde")}   ${where}`,
          `${muted("Cuándo")}  ${preview.when}`,
          "",
          ...checks.map((c) => `${c.ok ? ok("✓") : danger("✗")} ${c.name.padEnd(15)} ${muted(c.detail)}`),
          "",
          warn(`! ${preview.warning}`),
          ready ? `\n${dim("Para reservar de verdad:")}\n  idrd booking create ${courtId} --date ${date} --hour ${startHour}${hours > 1 ? ` --hours ${hours}` : ""} --yes --confirm ${strong(intent)}` : danger("\nNo se puede reservar mientras haya checks en rojo."),
        ].join("\n"),
      nextSteps: ready
        ? [{ command: `idrd booking create ${courtId} --date ${date} --hour ${startHour}${hours > 1 ? ` --hours ${hours}` : ""} --yes --confirm ${intent}`, description: "RESERVA REAL e irreversible" }]
        : checks.find((c) => c.name === "sesion" && !c.ok)
          ? [{ command: "idrd auth login --email <correo>", description: "iniciar sesión y volver a previsualizar" }]
          : checks.find((c) => c.name === "disponibilidad" && !c.ok)
            ? [{ command: `idrd slot list ${courtId} --date ${date} --free`, description: "ver horas libres de esa cancha" }]
            : [],
    };
  }

  // ---- live path
  assertWritable();
  const failed = checks.find((c) => !c.ok);
  if (failed) {
    const code = failed.name === "disponibilidad" ? "slot/unavailable" : failed.name === "reglas" ? "rule/violation" : failed.name === "sesion" ? "auth/required" : "safety/precheck";
    fail(code, `No reservo: ${failed.name} — ${failed.detail}`);
  }
  await approveGate(
    { cliName: "idrd", flags: { json: ctx.flags.json, noInput: ctx.flags.noInput } },
    { title: "Reserva irreversible", summary: `${where} · ${date} ${hourLabel(startHour)}–${hourLabel(startHour + hours)}` },
    { trust: "T3", yes: true, confirm: str(ctx.args, "confirm"), confirmAgainst: intent },
  );

  const { token } = await accessToken(ctx.flags.profile);
  const a = audit(ctx, "booking.create", "booking create", "T3", { courtId, date, startHour, hours, intent });
  let booking: BookingRecord;
  try {
    const raw = await createBooking(token, courtId, body);
    booking = normalizeBooking(raw, { courtId, date, startHour: body.start_hour, finalHour: body.final_hour });
    saveBooking(ctx.flags.profile, booking);
    a.complete({ bookingId: booking.bookingId, amount: booking.amount, free: booking.free });
  } catch (e) {
    a.fail({ error: e instanceof AppError ? e.code : String(e) });
    throw e;
  }

  // The booking now exists and cannot be undone. A failure in the payment
  // step must never hide its id: report it alongside the booking.
  let payment: Record<string, unknown> | null = null;
  if (booking.free || bank) {
    try {
      payment = { ok: true, ...(await settle(ctx, token, booking, booking.free ? "0" : bank!)) };
    } catch (e) {
      const err = e instanceof AppError ? e : new AppError("unknown", { name: "Unknown", human: String(e) });
      payment = { ok: false, error: { code: err.code, message: err.human, ...(err.hint ? { hint: err.hint } : {}) } };
    }
  }
  const { raw: _raw, ...summary } = booking;
  const data = { booking: summary, payment };
  return {
    data,
    human: () =>
      [
        `${ok("✓")} Reserva creada: ${bold(booking.bookingId)} · ${where} · ${date} ${booking.startHour}–${booking.finalHour}`,
        booking.free ? `  ${ok("Gratis.")} ${payment?.receiptUrl ? `Comprobante: ${payment.receiptUrl}` : ""}` : `  Valor: ${bold(`$${booking.amount}`)} ${muted(booking.concept)}`,
        payment?.bankUrl ? `  ${bold("Link de pago PSE:")} ${payment.bankUrl}` : "",
        payment && payment.ok === false ? danger(`  ✗ La reserva existe, pero falló el paso de ${booking.free ? "confirmación" : "pago"}: ${(payment.error as { message: string }).message}`) : "",
      ].filter(Boolean).join("\n"),
    nextSteps:
      payment && payment.ok === false
        ? [{ command: `idrd pay pse ${booking.bookingId}${booking.free ? "" : ` --bank ${bank}`} --yes`, description: booking.free ? "reintentar la confirmación gratuita" : "reintentar el link de pago" }]
        : !booking.free && !payment
        ? [
            { command: "idrd pay banks", description: "elegir banco" },
            { command: `idrd pay pse ${booking.bookingId} --bank <código> --yes`, description: "generar link de pago PSE" },
          ]
        : [],
  };
}

/** Free bookings are confirmed through transferBankFree; paid ones get a PSE bank_url. */
async function settle(ctx: Ctx, token: string, b: BookingRecord, bankCode: string): Promise<Record<string, unknown>> {
  assertWritable();
  if (!b.free && b.holdUntil && Date.parse(b.holdUntil) < Date.now()) {
    fail("slot/hold-expired", "El tiempo para pagar esta reserva ya venció.", "Crea una reserva nueva.");
  }
  const ip = await publicIp();
  const payload = paymentPayload(b, { bankCode, ip });
  const a = audit(ctx, b.free ? "payment.free" : "payment.pse", "pay", b.free ? "T1" : "T2", { bookingId: b.bookingId, amount: b.amount, bank: b.free ? null : bankCode });
  try {
    const res = await transferBank(token, payload, b.free);
    const code = (res.payment as string | undefined) ?? null;
    const out = {
      bookingId: b.bookingId,
      amount: b.amount,
      free: b.free,
      paymentCode: code,
      bankUrl: typeof res.bank_url === "string" ? res.bank_url : null,
      receiptUrl: code ? `${RECEIPT_BASE}${code}` : null,
    };
    if (!b.free && !out.bankUrl) fail("upstream/pse-unavailable", "PSE no devolvió link de pago.", "El portal dice que PSE no está disponible; intenta más tarde.");
    a.complete({ paymentCode: code, hasBankUrl: Boolean(out.bankUrl) });
    return out;
  } catch (e) {
    a.fail({ error: e instanceof AppError ? e.code : String(e) });
    throw e;
  }
}

export async function payBanks() {
  const banks = await listBanks();
  return {
    data: banks,
    human: () => banks.map((b) => `  ${b.code.padEnd(6)} ${b.name}`).join("\n"),
  };
}

export async function payPse(ctx: Ctx) {
  const bookingId = positional(ctx.args, 0, "bookingId");
  const b = loadBooking(ctx.flags.profile, bookingId);
  const bank = b.free ? "0" : requireStr(ctx.args, "bank");
  assertWritable();
  if (ctx.flags.dryRun) {
    return {
      data: { dryRun: true, bookingId: b.bookingId, amount: b.amount, free: b.free, bank },
      human: () => `Vista previa: se crearía ${b.free ? "la confirmación gratuita" : `la orden PSE por $${b.amount} con el banco ${bank}`}.`,
    };
  }
  await approveGate(
    { cliName: "idrd", flags: { json: ctx.flags.json, noInput: ctx.flags.noInput } },
    { title: b.free ? "Confirmar reserva gratuita" : "Crear orden de pago PSE", summary: `Reserva ${b.bookingId} · $${b.amount}` },
    { trust: "T2", yes: ctx.args.yes === true },
  );
  const { token } = await accessToken(ctx.flags.profile);
  const out = await settle(ctx, token, b, bank);
  let opened = false;
  const url = (out.bankUrl ?? out.receiptUrl) as string | null;
  if (ctx.args.open && url) opened = (await openUrl(url)).opened;
  return {
    data: { ...out, opened },
    human: () =>
      out.bankUrl
        ? `${bold("Link de pago PSE:")} ${out.bankUrl}\n${muted("Ábrelo y paga en tu banco. Nadie más debe usarlo.")}`
        : `${ok("✓")} Reserva gratuita confirmada.${out.receiptUrl ? ` Comprobante: ${out.receiptUrl}` : ""}`,
    nextSteps: out.paymentCode ? [{ command: `idrd pay status ${out.paymentCode}`, description: "ver si el pago quedó aprobado" }] : [],
  };
}

export async function payStatus(ctx: Ctx) {
  const code = positional(ctx.args, 0, "code");
  const { token } = await accessToken(ctx.flags.profile);
  const st = await paymentStatus(token, code);
  return { data: st, human: () => JSON.stringify(st, null, 2) };
}
