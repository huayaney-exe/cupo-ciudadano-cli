import { approveGate } from "../cli/agent/trust-ladder.js";
import { beginAudit } from "../cli/foundation/audit-lifecycle.js";
import { openUrl } from "../cli/platform/open-url.js";
import { getKillswitchState } from "../cli/safety/killswitch.js";
import { bold, danger, dim, info, muted, ok, strong, warn } from "../cli/platform/style.js";
import { int, positional, requireStr, str } from "../core/args.js";
import { AppError, fail } from "../core/errors.js";
import { HOSTS } from "../core/http.js";
import { appHome, paths, profileName } from "../core/paths.js";
import { createBooking, getSchedule, listBanks, me, paymentStatus, transferBank, type BookingRequest } from "../idrd/api.js";
import { accessToken } from "../idrd/auth.js";
import { blocks, datesIn, hourSlots } from "../idrd/availability.js";
import { CEFE_POOL_IDS, SPORTS } from "../idrd/sports.js";
import { calendarOptions } from "./read.js";
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
  if (!Number.isInteger(courtId) || courtId <= 0) fail("usage/bad-id", "Id de espacio inválido.");
  const date = parseDate(requireStr(ctx.args, "date"));
  const bank = str(ctx.args, "bank");
  const live = ctx.args.yes === true && !ctx.flags.dryRun;

  // ---- what kind of space is this? The calendar tells (same signal the portal's screen uses).
  const probe = await getSchedule(courtId, date, { lane: int(ctx.args, "lane"), sportId: int(ctx.args, "sportId"), document: str(ctx.args, "document") });
  const sport = probe.endowment.sport;
  const spec = SPORTS[sport];
  const cal = await calendarOptions(ctx, courtId, probe);
  const sched = probe;
  const weekDates = datesIn(sched.entries);
  const dayBlocks = blocks(sched.entries, date);

  // ---- hours: courts by the hour; grills take the whole published block; others inside a block.
  let startHour: number;
  let hours: number;
  if (spec.block) {
    const block = str(ctx.args, "hour") ? dayBlocks.find((b) => b.from === parseHour(str(ctx.args, "hour")!)) : dayBlocks.find((b) => b.available) ?? dayBlocks[0];
    if (!block) fail("slot/unavailable", `No hay bloques publicados para ${date}.`, `Mira otros días con \`idrd slot list ${courtId} --date <día>\`.`);
    startHour = block.from;
    hours = int(ctx.args, "hours", block.to - block.from)!;
  } else {
    startHour = parseHour(requireStr(ctx.args, "hour"));
    hours = int(ctx.args, "hours", 1)!;
  }
  const intent = `${courtId}@${date}T${String(startHour).padStart(2, "0")}x${hours}${cal.lane ? `L${cal.lane}` : ""}${cal.sportId ? `S${cal.sportId}` : ""}`;

  // ---- checks run on the real path in both preview and live mode
  const checks: Check[] = [];
  const k = getKillswitchState(appHome());
  checks.push({ name: "killswitch", ok: !k.active, detail: k.active ? `activo: ${k.reason}` : "apagado" });

  const containing = dayBlocks.find((b) => b.from <= startHour && b.to >= startHour + hours);
  const violations = checkBookingRules({
    date, startHour, hours, weekDates,
    court: spec.capacity === "exclusive" && !spec.block && !spec.needs,
    maxHours: containing ? containing.to - containing.from : undefined,
  });
  if (!containing && !(spec.capacity === "exclusive" && !spec.block && !spec.needs)) {
    violations.push({ rule: "within-block", message: `${hh(startHour)}–${hh(startHour + hours)} no cabe en un bloque publicado (${dayBlocks.map((b) => `${hh(b.from)}–${hh(b.to)}`).join(", ") || "ninguno"}).` });
  }
  checks.push({ name: "reglas", ok: violations.length === 0, detail: violations.map((v) => v.message).join(" ") || (spec.block ? "bloque completo, como lo publica el portal" : "cumple las reglas del portal") });

  const slots = hourSlots(sched.entries, date);
  const wanted = Array.from({ length: hours }, (_, i) => startHour + i);
  const missing = wanted.filter((h) => !slots.find((s) => s.hour === h && s.available));
  const places = Math.min(...wanted.map((h) => { const sl = slots.find((s) => s.hour === h); return sl?.quota !== undefined ? sl.quota - (sl.used ?? 0) : Infinity; }));
  checks.push({
    name: "disponibilidad",
    ok: missing.length === 0,
    detail: missing.length
      ? `${spec.capacity === "quota" ? "sin cupo" : "ocupado o no reservable"}: ${missing.map(hh).join(", ")}`
      : `libre ${hh(startHour)}–${hh(startHour + hours)}${Number.isFinite(places) ? ` · ${places} cupos` : ""} (verificado en vivo)`,
  });

  if (spec.needs === "sport") {
    checks.push({ name: "deporte", ok: cal.sportId !== undefined, detail: cal.sportId !== undefined ? `sport_id ${cal.sportId}` : `falta --sport-id (idrd court sports ${courtId})` });
  }

  // ---- beneficiary and responsible adult (CEFE pools: ages 5–12 need one; the portal then creates two bookings)
  const adultDoc = str(ctx.args, "adultDocument");
  const adultType = str(ctx.args, "adultDocumentType");
  const adultName = str(ctx.args, "adultName");
  const adult = Boolean(adultDoc || adultType || adultName);
  if (adult && !(adultDoc && adultType && adultName)) {
    fail("usage/missing-flag", "El adulto responsable necesita --adult-document-type, --adult-document y --adult-name.");
  }

  let document: string | undefined = str(ctx.args, "document");
  let who = "";
  try {
    const { token } = await accessToken(ctx.flags.profile);
    const u = await me(token);
    document = document ?? u.document ?? undefined;
    who = `${u.email}${u.hasProfile ? "" : " (perfil incompleto)"}${str(ctx.args, "document") ? ` · beneficiario ${document}` : ""}`;
    checks.push({ name: "sesion", ok: u.hasProfile, detail: u.hasProfile ? who : `${who}: completa tu perfil en el portal` });
  } catch (e) {
    checks.push({ name: "sesion", ok: false, detail: e instanceof AppError ? e.human : String(e) });
  }
  if (sport === "pool" && CEFE_POOL_IDS.has(courtId) && str(ctx.args, "document") && !adult) {
    checks.push({ name: "acudiente", ok: true, detail: "sin adulto responsable (obligatorio si el beneficiario tiene entre 5 y 12 años)" });
  }

  const body: BookingRequest = {
    date,
    start_hour: hourLabel(startHour),
    final_hour: hourLabel(startHour + hours),
    sport_id: cal.sportId ?? null,
    lane: cal.lane ?? null,
    document,
    is_a_responsible_adult_required: adult,
    ...(adult ? { document_type_responsible_adult: adultType, document_number_responsible_adult: adultDoc, full_name_responsible_adult: adultName } : {}),
  };
  const ready = checks.every((c) => c.ok);
  const where = `${sched.endowment.description || `${spec.noun} ${courtId}`} · ${sched.park.name}${cal.lane ? ` · carril ${cal.lane}` : ""}${cal.sportId ? ` · deporte ${cal.sportId}` : ""}`;
  const argv = `${courtId} --date ${date} --hour ${startHour}${hours > 1 || spec.block ? ` --hours ${hours}` : ""}${cal.lane ? ` --lane ${cal.lane}` : ""}${cal.sportId ? ` --sport-id ${cal.sportId}` : ""}${str(ctx.args, "document") ? ` --document ${document}` : ""}${adult ? ` --adult-document-type ${adultType} --adult-document ${adultDoc} --adult-name "${adultName}"` : ""}`;

  if (!live) {
    audit(ctx, "booking.create", "booking create", "T3", { courtId, kind: sport, date, startHour, hours, lane: cal.lane ?? null, sportId: cal.sportId ?? null, ready }).dryRun();
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
          ready ? `\n${dim("Para reservar de verdad:")}\n  idrd booking create ${argv} --yes --confirm ${strong(intent)}` : danger("\nNo se puede reservar mientras haya checks en rojo."),
        ].join("\n"),
      nextSteps: ready
        ? [{ command: `idrd booking create ${argv} --yes --confirm ${intent}`, description: "RESERVA REAL e irreversible" }]
        : checks.find((c) => c.name === "sesion" && !c.ok)
          ? [{ command: "idrd auth login --email <correo>", description: "iniciar sesión y volver a previsualizar" }]
          : checks.find((c) => c.name === "disponibilidad" && !c.ok)
            ? [{ command: `idrd slot list ${courtId} --date ${date} --free${cal.lane ? ` --lane ${cal.lane}` : ""}${cal.sportId ? ` --sport-id ${cal.sportId}` : ""}`, description: "ver horas libres de ese espacio" }]
            : [],
    };
  }

  // ---- live path
  assertWritable();
  const failed = checks.find((c) => !c.ok);
  if (failed) {
    const code = failed.name === "disponibilidad" ? "slot/unavailable" : failed.name === "reglas" ? "rule/violation" : failed.name === "sesion" ? "auth/required" : failed.name === "deporte" ? "usage/missing-flag" : "safety/precheck";
    fail(code, `No reservo: ${failed.name} — ${failed.detail}`);
  }
  await approveGate(
    { cliName: "idrd", flags: { json: ctx.flags.json, noInput: ctx.flags.noInput } },
    { title: "Reserva irreversible", summary: `${where} · ${date} ${hourLabel(startHour)}–${hourLabel(startHour + hours)}` },
    { trust: "T3", yes: true, confirm: str(ctx.args, "confirm"), confirmAgainst: intent },
  );

  const { token } = await accessToken(ctx.flags.profile);
  const a = audit(ctx, "booking.create", "booking create", "T3", { courtId, kind: sport, date, startHour, hours, lane: cal.lane ?? null, sportId: cal.sportId ?? null, intent });
  let booking: BookingRecord;
  try {
    const raw = await createBooking(token, courtId, body);
    booking = normalizeBooking(raw, { courtId, date, startHour: body.start_hour, finalHour: body.final_hour, lane: cal.lane ?? null, sportId: cal.sportId ?? null });
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
        booking.raw.adult_booking_id ? `  ${info("i")} El portal creó también la reserva del acudiente (${String(booking.raw.adult_booking_id)}).` : "",
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
