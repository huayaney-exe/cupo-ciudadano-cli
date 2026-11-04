import { approveGate } from "../cli/agent/trust-ladder.js";
import { beginAudit } from "../cli/foundation/audit-lifecycle.js";
import { getKillswitchState } from "../cli/safety/killswitch.js";
import { bold, danger, dim, info, muted, ok, strong, warn } from "../cli/platform/style.js";
import { positional, requireStr, str } from "../core/args.js";
import { AppError, fail } from "../core/errors.js";
import { appHome, paths, profileName } from "../core/paths.js";
import { table } from "../core/table.js";
import * as api from "../cefe/api.js";
import { currentSession, login, logoutLocal, persistSession, requireSession, resolvePassword, storedEmail } from "../cefe/auth.js";
import { canCancel, daySlots, priceEstimate, SLOT_MINUTES, spaGateClosed, type DaySlot } from "../cefe/schedule.js";
import { addDays, bogotaNow, parseDate } from "../idrd/time.js";
import type { Ctx } from "./context.js";

const WEB = "https://cefechapinero.com";
const cop = (n: number) => n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const hhmm = (iso: string) => iso.slice(11, 16);
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const DAY_ES: Record<string, string> = { monday: "lun", tuesday: "mar", wednesday: "mié", thursday: "jue", friday: "vie", saturday: "sáb", sunday: "dom" };
const dayEs = (d: string) => DAY_ES[d.toLowerCase()] ?? d.slice(0, 3);

function assertWritable(): void {
  const k = getKillswitchState(appHome());
  if (k.active) fail("safety/killswitch", `Killswitch activo${k.reason ? ` (${k.reason})` : ""}: escrituras bloqueadas.`, "Desactívalo con `cupo killswitch off`.");
}
function audit(ctx: Ctx, kind: string, command: string, tier: string, meta: Record<string, unknown>) {
  return beginAudit(paths.audit(), { kind, command, tier, profile: profileName(ctx.flags.profile), meta });
}
function parseTime(raw: string | undefined): string {
  if (!raw) fail("usage/missing-flag", "Falta --time.", "Ej: --time 07:15 (las horas son las que publica la piscina).");
  const m = /^(\d{1,2}):(\d{2})$/.exec(raw.trim());
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) fail("usage/bad-hour", `Hora inválida: ${raw}.`, "Usa HH:MM, ej. 07:15.");
  return `${m[1]!.padStart(2, "0")}:${m[2]}`;
}
/** Resolve a pool by id or by a name fragment, so humans can say "semiolimpica". */
async function resolvePool(raw: string): Promise<api.Pool> {
  const pools = await api.listPools();
  const byId = pools.find((p) => p.poolId === raw);
  if (byId) return byId;
  const hits = pools.filter((p) => fold(p.name).includes(fold(raw)));
  if (hits.length === 1) return hits[0]!;
  if (hits.length > 1) fail("usage/ambiguous", `Varias piscinas coinciden con "${raw}": ${hits.map((h) => h.name).join(", ")}.`, "Usa el poolId.");
  return fail("not-found/resource", `No encontré la piscina "${raw}".`, `Opciones: ${pools.map((p) => `${p.name} (${p.poolId})`).join(" · ")}`);
}

// ---------------------------------------------------------------- auth

export async function cefeLogin(ctx: Ctx) {
  const email = str(ctx.args, "email") ?? process.env.CEFE_EMAIL ?? storedEmail(ctx.flags.profile);
  if (!email) fail("usage/missing-flag", "Falta tu correo.", "Usa --email <correo> (se recuerda para la próxima).");
  const password = await resolvePassword({ stdin: Boolean(ctx.args.passwordStdin), noInput: ctx.flags.noInput });
  const s = await login(ctx.flags.profile, email, password);
  const missing = profileGaps(s.user);
  return {
    data: { email, expiresAt: s.expiresAt, user: { ...s.user, raw: undefined }, missingForBooking: missing },
    human: () => `${ok("✓")} Sesión CEFE Chapinero iniciada como ${bold(email)} (${s.user.name})\n  ${muted(`Créditos: ${s.user.credits} · Reservas disponibles: ${s.user.reservasDisponibles} · Dependientes: ${s.user.dependents.length}`)}${missing.length ? `\n  ${warn("!")} Para reservar falta en tu perfil: ${missing.join(", ")} (cefechapinero.com/client/profile)` : ""}`,
    nextSteps: [{ command: "cupo cefe find --date mañana", description: "cupos libres en las piscinas" }],
  };
}

function profileGaps(u: api.CefeUser): string[] {
  const m: string[] = [];
  if (!u.phone) m.push("teléfono");
  if (!u.estrato) m.push("estrato");
  if (!u.dateOfBirth) m.push("fecha de nacimiento");
  return m;
}

export async function cefeStatus(ctx: Ctx) {
  const s = currentSession(ctx.flags.profile);
  if (!s) return { data: { loggedIn: false, email: storedEmail(ctx.flags.profile) ?? null }, human: () => `${warn("○")} Sin sesión CEFE. Corre ${bold("cupo cefe auth login --email <correo>")}`, nextSteps: [{ command: "cupo cefe auth login --email <correo>", description: "iniciar sesión" }] };
  let user: api.CefeUser | null = null;
  let liveCheck = "ok";
  try {
    user = await api.getUser(s.token, s.user.userId);
    persistSession(ctx.flags.profile, s.email, s.token, user);
  } catch (e) {
    liveCheck = e instanceof Error ? e.message : String(e);
  }
  return {
    data: { loggedIn: user !== null, email: s.email, expiresAt: s.expiresAt, liveCheck, user: user ? { ...user, raw: undefined } : null },
    human: () => (user ? `${ok("●")} Sesión CEFE activa: ${bold(s.email)} (${user.name})\n  ${muted(`Vence: ${s.expiresAt} · créditos ${user.credits} · reservas disponibles ${user.reservasDisponibles}`)}` : `${danger("●")} Sesión guardada pero no válida: ${liveCheck}`),
  };
}

export async function cefeLogout(ctx: Ctx) {
  logoutLocal(ctx.flags.profile);
  return { data: { loggedOut: true }, human: () => `${ok("✓")} Sesión CEFE cerrada (token local borrado; el servidor no tiene logout).` };
}

export async function cefeRegister(ctx: Ctx) {
  const body: api.RegisterRequest = {
    name: requireStr(ctx.args, "name"), email: requireStr(ctx.args, "email"), password: await resolvePassword({ stdin: Boolean(ctx.args.passwordStdin), noInput: ctx.flags.noInput }),
    phone: requireStr(ctx.args, "phone"), identification: requireStr(ctx.args, "document"), documentType: str(ctx.args, "documentType") ?? "CC", role: "client", aceptaHabeasData: true,
  };
  if (ctx.args.acceptHabeasData !== true) fail("approval/consent-required", "El registro exige aceptar el tratamiento de datos personales.", "Lee la política en cefechapinero.com/register y agrega --accept-habeas-data si estás de acuerdo.");
  assertWritable();
  const a = audit(ctx, "cefe.register", "cefe auth register", "T2", { email: body.email });
  try {
    const { token, user } = await api.register(body);
    persistSession(ctx.flags.profile, body.email, token, user);
    a.complete({ userId: user.userId });
    return { data: { email: body.email, user: { ...user, raw: undefined } }, human: () => `${ok("✓")} Cuenta creada e iniciada: ${bold(body.email)}`, nextSteps: [{ command: "cupo cefe me", description: "ver el perfil (completa teléfono, estrato y fecha de nacimiento en la web)" }] };
  } catch (e) {
    a.fail({ error: e instanceof AppError ? e.code : String(e) });
    throw e;
  }
}

export async function cefeMe(ctx: Ctx) {
  const s = requireSession(ctx.flags.profile);
  const u = await api.getUser(s.token, s.user.userId);
  persistSession(ctx.flags.profile, s.email, s.token, u);
  const missing = profileGaps(u);
  return {
    data: { ...u, raw: undefined, missingForBooking: missing },
    human: () =>
      [
        bold(`${u.name} · ${u.email}`),
        `${muted("Documento")}  ${u.documentType ?? ""} ${u.identification ?? "—"} · ${muted("Tel")} ${u.phone ?? "—"} · ${muted("Estrato")} ${u.estrato ?? "—"} · ${muted("Nacimiento")} ${u.dateOfBirth ?? "—"}`,
        `${muted("Créditos")}   ${u.credits} · ${muted("Reservas disponibles")} ${u.reservasDisponibles}`,
        u.dependents.length ? `${muted("Dependientes")} ${u.dependents.map((d, i) => `${i + 1}. ${d.name} (${d.documentType} ${d.identification})`).join(" · ")}` : muted("Sin dependientes registrados"),
        missing.length ? warn(`! Para reservar falta: ${missing.join(", ")}. Se completa en ${WEB}/client/profile`) : "",
      ].filter(Boolean).join("\n"),
  };
}

// ---------------------------------------------------------------- pools & slots

export async function cefePoolList(ctx: Ctx) {
  let pools = await api.listPools();
  if (!ctx.args.all) pools = pools.filter((p) => p.active);
  return {
    data: pools,
    human: () => table(["poolId", "Piscina", "Cap.", "Horario hoy"], pools.map((p) => {
      const today = p.hours.find((h) => fold(h.day) === fold(todayName()));
      return [strong(p.poolId), `${p.name}${p.active ? "" : muted(" (inactiva)")}`, String(p.capacity), today ? `${today.open}–${today.close}` : muted("—")];
    }), [38, 30, 5, 14]),
    nextSteps: pools[0] ? [{ command: `cupo cefe slot list ${pools[0].poolId} --date mañana`, description: "cupos por hora" }, { command: "cupo cefe find --date sab", description: "buscar en todas" }] : [],
  };
}

function todayName(): string {
  return ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"][new Date(`${bogotaNow().date}T12:00:00Z`).getUTCDay()]!;
}

export async function cefePoolGet(ctx: Ctx) {
  const pool = await resolvePool(positional(ctx.args, 0, "pool"));
  const [cfg, rating] = await Promise.all([api.getScheduleConfig(pool.poolId), api.poolRatingSummary(pool.poolId).catch(() => null)]);
  const data = { ...pool, schedule: cfg, rating };
  return {
    data,
    human: () =>
      [
        bold(`${pool.name}`) + muted(` · ${pool.poolId}`),
        pool.description ? `${muted("Qué es")}     ${pool.description}` : "",
        `${muted("Capacidad")}  ${pool.capacity} personas por franja · ${muted("Franjas de")} ${SLOT_MINUTES} min`,
        `${muted("Horario")}    ${pool.hours.map((h) => `${h.day.slice(0, 3)} ${h.open}–${h.close}`).join(" · ")}`,
        cfg.default ? `${muted("Franjas")}    ${cfg.default.slots.map((s) => s.time).sort().join(" ")}${Object.values(cfg.weekly ?? {}).some((d) => d.isClosed) ? dim(`  (cerrada: ${Object.entries(cfg.weekly ?? {}).filter(([, d]) => d.isClosed).map(([k]) => k.toLowerCase()).join(", ")})`) : ""}` : "",
        rating && rating.overallAverage !== undefined ? `${muted("Opiniones")}  ${String(rating.overallAverage)}/5 (${String(rating.totalRatings)} calificaciones) · NPS ${String(rating.npsScore)}` : "",
      ].filter(Boolean).join("\n"),
    nextSteps: [{ command: `cupo cefe slot list ${pool.poolId} --date mañana`, description: "cupos por hora" }],
  };
}

async function slotsFor(pool: api.Pool, date: string): Promise<DaySlot[]> {
  const [cfg, occ] = await Promise.all([api.getScheduleConfig(pool.poolId), api.getPoolSlots(pool.poolId, date)]);
  return daySlots(cfg, date, occ, bogotaNow());
}

function renderSlots(slots: DaySlot[]): string {
  if (!slots.length) return dim("  Cerrada ese día.");
  return slots.map((s) => `  ${s.available ? ok("●") : muted("○")} ${s.time}–${hhmm(s.end)}  ${s.closed ? muted("cerrada") : s.available ? ok(`${s.free} cupos`) : muted(s.free === 0 ? "llena" : "pasó")}${s.reserved ? muted(`  (${s.reserved}/${s.capacity})`) : ""}`).join("\n");
}

export async function cefeSlotList(ctx: Ctx) {
  const pool = await resolvePool(positional(ctx.args, 0, "pool"));
  const date = parseDate(str(ctx.args, "date"));
  let slots = await slotsFor(pool, date);
  const all = slots;
  if (ctx.args.free) slots = slots.filter((s) => s.available);
  const first = all.find((s) => s.available);
  return {
    data: { poolId: pool.poolId, pool: pool.name, date, slots, priceEstimate: priceEstimate(date, 1) },
    human: () => `${bold(`${pool.name} · ${date}`)}${priceEstimate(date, 1) ? muted(`  · ${cop(priceEstimate(date, 1))} por persona`) : muted("  · gratis")}\n${renderSlots(slots)}`,
    nextSteps: first ? [{ command: `cupo cefe booking create ${pool.poolId} --date ${date} --time ${first.time}`, description: "vista previa de la reserva (no reserva nada)" }] : [{ command: `cupo cefe find --date ${addDays(date, 1)}`, description: "probar otro día" }],
  };
}

export async function cefeSlotFind(ctx: Ctx) {
  const date = parseDate(str(ctx.args, "date") ?? addDays(bogotaNow().date, 1));
  const from = str(ctx.args, "from") ? parseTime(str(ctx.args, "from")) : "00:00";
  const to = str(ctx.args, "to") ? parseTime(str(ctx.args, "to")) : "24:00";
  const pools = (await api.listPools()).filter((p) => p.active);
  const results: Array<{ pool: api.Pool; slots: DaySlot[] }> = [];
  const failed: Array<{ poolId: string; error: string }> = [];
  await Promise.all(pools.map(async (pool) => {
    try {
      const free = (await slotsFor(pool, date)).filter((s) => s.available && s.time >= from && s.time < to);
      if (free.length) results.push({ pool, slots: free });
    } catch (e) {
      failed.push({ poolId: pool.poolId, error: e instanceof Error ? e.message : String(e) });
    }
  }));
  results.sort((a, b) => a.pool.name.localeCompare(b.pool.name));
  const best = results[0]?.slots[0];
  return {
    data: { date, window: { from, to }, results: results.map((r) => ({ pool: r.pool, slots: r.slots })), scanned: pools.length, failed, priceEstimate: priceEstimate(date, 1) },
    human: () => {
      const head = bold(`CEFE Chapinero · ${date} · ${from === "00:00" && to === "24:00" ? "todo el día" : `${from}–${to}`} · ${pools.length} piscinas`);
      if (!results.length) return `${head}\n\n  Sin cupos libres en esa franja.${failed.length ? dim(`\n  (${failed.length} no respondieron)`) : ""}`;
      return `${head}\n\n${table(["Piscina", "Cupos libres (hora: cupos)"], results.map((r) => [r.pool.name, r.slots.map((s) => `${s.time} ${ok(String(s.free))}`).join("  ")]), [30, 80])}${failed.length ? dim(`\n\n${failed.length} no respondieron.`) : ""}`;
    },
    nextSteps: best ? [{ command: `cupo cefe booking create ${results[0]!.pool.poolId} --date ${date} --time ${best.time}`, description: "vista previa de la reserva (no reserva nada)" }] : [{ command: `cupo cefe find --date ${addDays(date, 1)}`, description: "probar otro día" }],
  };
}

// ---------------------------------------------------------------- bookings

type Check = { name: string; ok: boolean; detail: string };
type PayMethod = "EFECTIVO" | "WOMPI" | "CREDITOS" | "FREE";

function parsePay(raw: string | undefined, price: number): PayMethod {
  if (price === 0) return "FREE";
  const v = (raw ?? "efectivo").toLowerCase();
  if (["efectivo", "cash", "presencial"].includes(v)) return "EFECTIVO";
  if (["wompi", "online", "pse", "tarjeta"].includes(v)) return "WOMPI";
  if (["creditos", "créditos", "credits"].includes(v)) return "CREDITOS";
  return fail("usage/bad-arg", `Método de pago desconocido: ${raw}.`, "Opciones: efectivo (en la sede), wompi (en la web), creditos.");
}

export async function cefeBookingCreate(ctx: Ctx) {
  const s = requireSession(ctx.flags.profile);
  const pool = await resolvePool(positional(ctx.args, 0, "pool"));
  const date = parseDate(requireStr(ctx.args, "date"));
  const time = parseTime(str(ctx.args, "time") ?? str(ctx.args, "hour"));
  const live = ctx.args.yes === true && !ctx.flags.dryRun;
  const [user, slots, sameDay] = await Promise.all([api.getUser(s.token, s.user.userId), slotsFor(pool, date), api.userReservationsByDate(s.token, s.user.userId, date).catch(() => [] as api.Reservation[])]);
  persistSession(ctx.flags.profile, s.email, s.token, user);

  // dependents: --dependent 1,2 picks from the profile's list (1-based), like the SPA's checkboxes
  const picks = (str(ctx.args, "dependent") ?? "").split(",").map((x) => x.trim()).filter(Boolean).map(Number);
  const dependents = picks.map((n) => user.dependents[n - 1]).filter((d): d is NonNullable<typeof d> => Boolean(d));
  if (dependents.length !== picks.length) fail("usage/bad-arg", `--dependent fuera de rango: tu perfil tiene ${user.dependents.length} dependiente(s).`, "Mira `cupo cefe me`.");
  const people = 1 + dependents.length;
  const price = priceEstimate(date, people);
  const pay = parsePay(str(ctx.args, "pay"), price);
  const slot = slots.find((x) => x.time === time);
  const blocking = sameDay.filter((r) => ["confirmed", "pending", "not_attended"].includes(r.status));
  const gaps = profileGaps(user);

  const checks: Check[] = [];
  const k = getKillswitchState(appHome());
  checks.push({ name: "killswitch", ok: !k.active, detail: k.active ? `activo: ${k.reason}` : "apagado" });
  checks.push({ name: "franja", ok: Boolean(slot), detail: slot ? `${slot.time}–${hhmm(slot.end)} publicada` : `la piscina no publica ${time} ese día (${slots.map((x) => x.time).join(" ") || "cerrada"})` });
  checks.push({ name: "cupos", ok: Boolean(slot?.available) && (slot?.free ?? 0) >= people, detail: slot ? (slot.closed ? "franja cerrada" : slot.available ? `${slot.free} libres de ${slot.capacity} (necesitas ${people})` : slot.free === 0 ? "llena" : "ya pasó") : "—" });
  checks.push({ name: "una-por-dia", ok: blocking.length === 0, detail: blocking.length ? `ya tienes una reserva ${blocking[0]!.status} ese día a las ${hhmm(blocking[0]!.startTime)}` : "sin otra reserva ese día" });
  checks.push({ name: "perfil", ok: gaps.length === 0, detail: gaps.length ? `falta ${gaps.join(", ")} (${WEB}/client/profile)` : "completo" });
  if (pay === "CREDITOS") checks.push({ name: "creditos", ok: user.credits * 100 >= price, detail: `tienes ${user.credits}, necesitas ${price / 100}` });
  const ready = checks.every((c) => c.ok);
  const startTime = slot?.start ?? `${date}T${time}:00`;
  const endTime = slot?.end ?? `${date}T${time}:00`;
  const body: api.ReservationRequest = {
    poolId: pool.poolId, poolName: pool.name, poolImage: "", userId: user.userId, email: user.email,
    startTime, endTime, status: pay === "CREDITOS" || pay === "FREE" ? "confirmed" : "pending",
    notes: [str(ctx.args, "notes"), dependents.length ? `Menores: ${dependents.map((d) => `${d.name} (${d.documentType} ${d.identification})`).join(", ")}` : ""].filter(Boolean).join(" | "),
    price, ...(pay === "FREE" ? {} : { paymentMethod: pay }), ...(dependents.length ? { dependents } : {}),
  };
  const where = `${pool.name} · ${date} ${time}–${hhmm(endTime)} · ${people} persona${people > 1 ? "s" : ""}`;
  const payLabel = pay === "FREE" ? "gratis" : pay === "EFECTIVO" ? `${cop(price)}, se paga en la sede` : pay === "WOMPI" ? `${cop(price)}, se paga en la web (Wompi)` : `${cop(price)} con créditos`;
  const argv = `${pool.poolId} --date ${date} --time ${time}${picks.length ? ` --dependent ${picks.join(",")}` : ""}${str(ctx.args, "pay") ? ` --pay ${str(ctx.args, "pay")}` : ""}`;

  if (!live) {
    audit(ctx, "cefe.booking.create", "cefe booking create", "T2", { poolId: pool.poolId, date, time, people, pay, ready }).dryRun();
    return {
      data: { dryRun: true, ready, where, pay, price, request: { method: "POST", url: "/reservations", body }, checks, note: "La reserva se puede cancelar hasta 6 h antes con `cupo cefe booking cancel`." },
      human: () => [bold("Vista previa — no se reservó nada"), `${muted("Qué")}   ${where}`, `${muted("Pago")}  ${payLabel}`, "", ...checks.map((c) => `${c.ok ? ok("✓") : danger("✗")} ${c.name.padEnd(13)} ${muted(c.detail)}`), "", ready ? `${dim("Para reservar de verdad:")}\n  cupo cefe booking create ${argv} --yes` : danger("No se puede reservar mientras haya checks en rojo.")].join("\n"),
      nextSteps: ready ? [{ command: `cupo cefe booking create ${argv} --yes`, description: "RESERVA REAL (cancelable hasta 6 h antes)" }] : checks.find((c) => c.name === "cupos" && !c.ok) ? [{ command: `cupo cefe slot list ${pool.poolId} --date ${date} --free`, description: "ver franjas con cupo" }] : [],
    };
  }

  assertWritable();
  const failed = checks.find((c) => !c.ok);
  if (failed) fail(failed.name === "cupos" || failed.name === "franja" ? "slot/unavailable" : failed.name === "una-por-dia" ? "rule/violation" : "safety/precheck", `No reservo: ${failed.name} — ${failed.detail}`);
  await approveGate({ cliName: "cupo", flags: { json: ctx.flags.json, noInput: ctx.flags.noInput } }, { title: "Reserva CEFE Chapinero", summary: `${where} · ${payLabel}` }, { trust: "T2", yes: true });
  const a = audit(ctx, "cefe.booking.create", "cefe booking create", "T2", { poolId: pool.poolId, date, time, people, pay, price });
  try {
    const raw = await api.createReservation(s.token, body);
    const res = api.normalizeReservation({ ...body, ...raw });
    a.complete({ reservationId: res.id, status: res.status });
    return {
      data: { reservation: { ...res, raw: undefined }, pay, price, payUrl: pay === "WOMPI" ? `${WEB}/client/reservations` : null },
      human: () => [
        `${ok("✓")} Reserva creada: ${bold(res.id || "(id en la web)")} · ${where}`,
        pay === "EFECTIVO" ? `  Pendiente: paga ${cop(price)} en la sede antes de entrar.` : pay === "WOMPI" ? `  Pendiente de pago: completa el pago con Wompi en ${WEB}/client/reservations` : `  ${ok("Confirmada.")}`,
        dim("  Se puede cancelar hasta 6 h antes: cupo cefe booking cancel " + (res.id || "<id>") + " --yes"),
      ].join("\n"),
      nextSteps: [{ command: "cupo cefe booking list", description: "ver tus reservas" }],
    };
  } catch (e) {
    a.fail({ error: e instanceof AppError ? e.code : String(e) });
    throw e;
  }
}

export async function cefeBookingList(ctx: Ctx) {
  const s = requireSession(ctx.flags.profile);
  const from = str(ctx.args, "from") ? parseDate(str(ctx.args, "from")) : undefined;
  const to = str(ctx.args, "to") ? parseDate(str(ctx.args, "to")) : undefined;
  const date = str(ctx.args, "date") ? parseDate(str(ctx.args, "date")) : undefined;
  let list = date ? await api.userReservationsByDate(s.token, s.user.userId, date) : from || to ? await api.userReservationsRange(s.token, s.user.userId, from ?? "2020-01-01", to ?? addDays(bogotaNow().date, 365), str(ctx.args, "status")) : await api.userReservations(s.token, s.user.userId);
  if (str(ctx.args, "status")) list = list.filter((r) => r.status === str(ctx.args, "status"));
  if (ctx.args.upcoming) list = list.filter((r) => r.startTime >= `${bogotaNow().date}T00:00:00` && r.status !== "cancelled");
  list.sort((a, b) => b.startTime.localeCompare(a.startTime));
  return {
    data: list.map((r) => ({ ...r, raw: undefined, cancellable: canCancel(r).ok })),
    human: () => list.length === 0 ? "Sin reservas." : table(["id", "Piscina", "Cuándo", "Estado", "Pago", "Valor"], list.map((r) => [strong(r.id), r.poolName, `${r.startTime.slice(0, 10)} ${hhmm(r.startTime)}–${hhmm(r.endTime)}`, r.status === "confirmed" ? ok(r.status) : r.status === "cancelled" ? muted(r.status) : warn(r.status), `${r.paymentMethod ?? "—"}${r.paymentStatus ? ` (${r.paymentStatus})` : ""}`, r.price ? cop(r.price) : muted("gratis")]), [44, 24, 24, 11, 18, 10]),
    nextSteps: list.find((r) => canCancel(r).ok) ? [{ command: `cupo cefe booking cancel ${list.find((r) => canCancel(r).ok)!.id} --yes`, description: "cancelar una reserva (hasta 6 h antes)" }] : [],
  };
}

export async function cefeBookingCancel(ctx: Ctx) {
  const s = requireSession(ctx.flags.profile);
  const id = positional(ctx.args, 0, "reservationId");
  const list = await api.userReservations(s.token, s.user.userId);
  const r = list.find((x) => x.id === id);
  if (!r) fail("not-found/booking", `No encontré la reserva ${id} en tu cuenta.`, "Mira `cupo cefe booking list`.");
  const can = canCancel(r);
  if (!can.ok) fail("rule/violation", `No se puede cancelar: ${can.reason}.`, "El portal permite cancelar hasta 6 h antes de la hora reservada.");
  assertWritable();
  await approveGate({ cliName: "cupo", flags: { json: ctx.flags.json, noInput: ctx.flags.noInput } }, { title: "Cancelar reserva", summary: `${r.poolName} · ${r.startTime}` }, { trust: "T2", yes: ctx.args.yes === true });
  const a = audit(ctx, "cefe.booking.cancel", "cefe booking cancel", "T2", { reservationId: id });
  try {
    await api.cancelReservation(s.token, id);
    a.complete({});
  } catch (e) {
    a.fail({ error: e instanceof AppError ? e.code : String(e) });
    throw e;
  }
  return { data: { reservationId: id, cancelled: true }, human: () => `${ok("✓")} Reserva ${id} cancelada.` };
}

// ---------------------------------------------------------------- courses & classes

export async function cefeCourseList(ctx: Ctx) {
  let courses = await api.listCourses();
  const text = str(ctx.args, "text");
  if (text) courses = courses.filter((c) => fold(`${c.name} ${c.group} ${c.description}`).includes(fold(text)));
  if (!ctx.args.all) courses = courses.filter((c) => c.status === "ACTIVE");
  if (ctx.args.available) courses = courses.filter((c) => !c.full);
  courses.sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name));
  return {
    data: courses,
    human: () => courses.length === 0 ? "Sin cursos con esos filtros." : table(["courseId", "Curso", "Horario", "Precio (estrato 1-3 / 4-6)", "Cupo"], courses.map((c) => [strong(c.courseId.slice(0, 8)), c.name, c.schedule.map((x) => `${dayEs(x.day)} ${x.start}`).join(" · "), `${cop(c.priceEstrato1_3)} / ${cop(c.priceEstrato4_6)}`, c.full ? muted("lleno") : ok("hay")]), [10, 38, 34, 30, 6]) + dim("\n\nEl courseId completo está en --json; los comandos aceptan el prefijo de 8 caracteres."),
    nextSteps: courses[0] ? [{ command: `cupo cefe course get ${courses[0].courseId.slice(0, 8)}`, description: "detalle y clases disponibles" }] : [],
  };
}

async function resolveCourse(raw: string): Promise<api.Course> {
  const courses = await api.listCourses();
  const hits = courses.filter((c) => c.courseId === raw || c.courseId.startsWith(raw) || fold(c.name) === fold(raw));
  if (hits.length === 1) return hits[0]!;
  if (hits.length > 1) fail("usage/ambiguous", `Varios cursos coinciden con "${raw}".`, "Usa más caracteres del courseId.");
  return fail("not-found/resource", `No encontré el curso "${raw}".`, "Mira `cupo cefe course list`.");
}

export async function cefeCourseGet(ctx: Ctx) {
  const c = await resolveCourse(positional(ctx.args, 0, "course"));
  const from = parseDate(str(ctx.args, "from") ?? bogotaNow().date);
  const to = parseDate(str(ctx.args, "to") ?? addDays(from, 13));
  const av = await api.courseAvailability(c.courseId, from, to).catch(() => null);
  const classes = av?.dates.flatMap((d) => d.classes) ?? [];
  return {
    data: { ...c, availability: av },
    human: () => [
      bold(c.name) + muted(` · ${c.group} · ${c.courseId}`),
      `${muted("Horario")}   ${c.schedule.map((x) => `${dayEs(x.day)} ${x.start}–${x.end}`).join(" · ")} · ${c.durationMin} min · ${c.classes} clases`,
      `${muted("Precio")}    estrato 1-3 ${cop(c.priceEstrato1_3)} · estrato 4-6 ${cop(c.priceEstrato4_6)} · ${c.full ? danger("lleno") : ok("con cupo")} (máx. ${c.maxEnrollments})`,
      c.instructor && c.instructor !== "No Aplica" ? `${muted("Instructor")} ${c.instructor}` : "",
      classes.length ? `\n${dim(`Clases ${from} → ${to}:`)}\n${classes.map((k) => `  ${k.available ? ok("●") : muted("○")} ${k.at.slice(0, 16).replace("T", " ")}  ${k.free}/${k.capacity} cupos`).join("\n")}` : dim(`\nSin clases publicadas entre ${from} y ${to}.`),
      "",
      dim(c.description.slice(0, 300)),
    ].filter(Boolean).join("\n"),
    nextSteps: [{ command: `cupo cefe course enroll ${c.courseId.slice(0, 8)}`, description: "vista previa de la inscripción" }],
  };
}

export async function cefeCourseMine(ctx: Ctx) {
  const s = requireSession(ctx.flags.profile);
  const [mine, classes] = await Promise.all([api.userCourses(s.token, s.user.userId), api.classBookings(s.token, s.user.userId).catch(() => [])]);
  return {
    data: { enrollments: mine, classes },
    human: () => [
      bold(`Inscripciones: ${mine.length}`),
      ...mine.map((e) => `  • ${String(e.courseName ?? e.course?.name ?? e.courseId)}  ${String(e.status ?? "")}  ${e.paymentType ? muted(`${String(e.paymentType)} ${String(e.paymentStatus ?? "")}`) : ""}`),
      "",
      bold(`Clases reservadas: ${classes.length}`),
      ...classes.map((k) => `  • ${String(k.classDateTime ?? "").slice(0, 16).replace("T", " ")}  ${String(k.course?.name ?? k.courseId ?? "")}  ${String(k.status ?? "")}`),
    ].join("\n"),
  };
}

function gateCheck(): Check {
  const closed = spaGateClosed(bogotaNow().date);
  return { name: "portal", ok: !closed, detail: closed ? "la web del CEFE tiene deshabilitadas inscripciones y clases desde el 30 de julio de 2026; el servidor puede rechazarlo" : "habilitado" };
}

export async function cefeCourseEnroll(ctx: Ctx) {
  const s = requireSession(ctx.flags.profile);
  const c = await resolveCourse(positional(ctx.args, 0, "course"));
  const user = await api.getUser(s.token, s.user.userId);
  const live = ctx.args.yes === true && !ctx.flags.dryRun;
  const estrato = Number(user.estrato ?? 0);
  const price = estrato >= 4 ? c.priceEstrato4_6 : c.priceEstrato1_3;
  const payRaw = (str(ctx.args, "pay") ?? "efectivo").toLowerCase();
  const pay: "CASH" | "WOMPI" = ["wompi", "online", "pse", "tarjeta"].includes(payRaw) ? "WOMPI" : "CASH";
  const mine = await api.userCourses(s.token, s.user.userId).catch(() => []);
  const already = mine.filter((e) => String(e.courseId) === c.courseId && !["CANCELLED"].includes(String(e.status)));
  const k = getKillswitchState(appHome());
  const checks: Check[] = [
    { name: "killswitch", ok: !k.active, detail: k.active ? `activo: ${k.reason}` : "apagado" },
    { name: "curso", ok: c.status === "ACTIVE" && !c.full, detail: c.full ? "lleno" : c.status === "ACTIVE" ? "activo con cupo" : `estado ${c.status}` },
    { name: "estrato", ok: Boolean(user.estrato), detail: user.estrato ? `estrato ${user.estrato} → ${cop(price)}` : `sin estrato en el perfil (${WEB}/client/profile)` },
    { name: "repetida", ok: already.length < Math.max(1, c.maxPerUser), detail: already.length ? `ya tienes ${already.length} inscripción(es)` : "sin inscripción previa" },
    gateCheck(),
  ];
  const ready = checks.every((x) => x.ok);
  const body = { status: "PENDING" as const, paymentType: pay, paymentStatus: "PENDING" as const, coursePrice: price };
  const summary = `${c.name} · ${cop(price)} · ${pay === "CASH" ? "pago en la sede" : "pago Wompi en la web"}`;
  if (!live) {
    audit(ctx, "cefe.course.enroll", "cefe course enroll", "T2", { courseId: c.courseId, pay, price, ready }).dryRun();
    return {
      data: { dryRun: true, ready, summary, request: { method: "POST", url: `/courses/${c.courseId}/users/${user.userId}/enroll`, body }, checks },
      human: () => [bold("Vista previa — no se inscribió a nadie"), `${muted("Qué")}  ${summary}`, "", ...checks.map((x) => `${x.ok ? ok("✓") : danger("✗")} ${x.name.padEnd(11)} ${muted(x.detail)}`), "", ready ? `${dim("Para inscribir de verdad:")}\n  cupo cefe course enroll ${c.courseId.slice(0, 8)}${pay === "WOMPI" ? " --pay wompi" : ""} --yes` : danger("No se puede inscribir mientras haya checks en rojo.")].join("\n"),
      nextSteps: ready ? [{ command: `cupo cefe course enroll ${c.courseId.slice(0, 8)}${pay === "WOMPI" ? " --pay wompi" : ""} --yes`, description: "INSCRIPCIÓN REAL (queda pendiente de pago)" }] : [],
    };
  }
  assertWritable();
  const failed = checks.find((x) => !x.ok);
  if (failed) fail("safety/precheck", `No inscribo: ${failed.name} — ${failed.detail}`);
  await approveGate({ cliName: "cupo", flags: { json: ctx.flags.json, noInput: ctx.flags.noInput } }, { title: "Inscripción a curso", summary }, { trust: "T2", yes: true });
  const a = audit(ctx, "cefe.course.enroll", "cefe course enroll", "T2", { courseId: c.courseId, pay, price });
  try {
    const res = await api.enroll(s.token, c.courseId, user.userId, body);
    a.complete({});
    return { data: { courseId: c.courseId, price, pay, response: res }, human: () => `${ok("✓")} Inscripción creada: ${summary}.\n  ${pay === "CASH" ? "Actívala pagando en la sede." : `Completa el pago en ${WEB}/client/courses`}`, nextSteps: [{ command: "cupo cefe course mine", description: "ver inscripciones" }] };
  } catch (e) {
    a.fail({ error: e instanceof AppError ? e.code : String(e) });
    throw e;
  }
}

export async function cefeClassBook(ctx: Ctx) {
  const s = requireSession(ctx.flags.profile);
  const c = await resolveCourse(positional(ctx.args, 0, "course"));
  const date = parseDate(requireStr(ctx.args, "date"));
  const live = ctx.args.yes === true && !ctx.flags.dryRun;
  const av = await api.courseAvailability(c.courseId, date, date);
  const klass = av.dates.flatMap((d) => d.classes).find((x) => x.at.startsWith(date));
  const k = getKillswitchState(appHome());
  const checks: Check[] = [
    { name: "killswitch", ok: !k.active, detail: k.active ? `activo: ${k.reason}` : "apagado" },
    { name: "clase", ok: Boolean(klass), detail: klass ? `${klass.at.slice(0, 16).replace("T", " ")}` : `el curso no tiene clase el ${date}` },
    { name: "cupo", ok: Boolean(klass?.available), detail: klass ? `${klass.free}/${klass.capacity}` : "—" },
    gateCheck(),
  ];
  const ready = checks.every((x) => x.ok);
  const at = klass?.at ?? `${date}T00:00:00`;
  if (!live) {
    audit(ctx, "cefe.class.book", "cefe class book", "T2", { courseId: c.courseId, at, ready }).dryRun();
    return {
      data: { dryRun: true, ready, courseId: c.courseId, classDateTime: at, checks },
      human: () => [bold("Vista previa — no se reservó la clase"), `${muted("Qué")}  ${c.name} · ${at.slice(0, 16).replace("T", " ")}`, "", ...checks.map((x) => `${x.ok ? ok("✓") : danger("✗")} ${x.name.padEnd(11)} ${muted(x.detail)}`), "", ready ? `${dim("Para reservar de verdad:")}\n  cupo cefe class book ${c.courseId.slice(0, 8)} --date ${date} --yes` : danger("No se puede reservar mientras haya checks en rojo.")].join("\n"),
      nextSteps: ready ? [{ command: `cupo cefe class book ${c.courseId.slice(0, 8)} --date ${date} --yes`, description: "RESERVA REAL de la clase" }] : [],
    };
  }
  assertWritable();
  const failed = checks.find((x) => !x.ok);
  if (failed) fail(failed.name === "cupo" || failed.name === "clase" ? "slot/unavailable" : "safety/precheck", `No reservo: ${failed.name} — ${failed.detail}`);
  await approveGate({ cliName: "cupo", flags: { json: ctx.flags.json, noInput: ctx.flags.noInput } }, { title: "Reservar clase", summary: `${c.name} · ${at}` }, { trust: "T2", yes: true });
  const a = audit(ctx, "cefe.class.book", "cefe class book", "T2", { courseId: c.courseId, at });
  try {
    const res = await api.bookClass(s.token, s.user.userId, c.courseId, at);
    a.complete({});
    return { data: { courseId: c.courseId, classDateTime: at, response: res }, human: () => `${ok("✓")} Clase reservada: ${c.name} · ${at.slice(0, 16).replace("T", " ")}`, nextSteps: [{ command: "cupo cefe course mine", description: "ver clases reservadas" }] };
  } catch (e) {
    a.fail({ error: e instanceof AppError ? e.code : String(e) });
    throw e;
  }
}

export async function cefeClassCancel(ctx: Ctx) {
  const s = requireSession(ctx.flags.profile);
  const c = await resolveCourse(positional(ctx.args, 0, "course"));
  const date = parseDate(requireStr(ctx.args, "date"));
  const mine = await api.classBookings(s.token, s.user.userId, { courseId: c.courseId });
  const booking = mine.find((b) => String(b.classDateTime ?? "").startsWith(date));
  if (!booking) fail("not-found/booking", `No tienes clase de ${c.name} el ${date}.`, "Mira `cupo cefe course mine`.");
  if (Date.parse(`${String(booking.classDateTime)}-05:00`) <= Date.now()) fail("rule/violation", "La clase ya pasó.");
  assertWritable();
  await approveGate({ cliName: "cupo", flags: { json: ctx.flags.json, noInput: ctx.flags.noInput } }, { title: "Cancelar clase", summary: `${c.name} · ${String(booking.classDateTime)}` }, { trust: "T2", yes: ctx.args.yes === true });
  const a = audit(ctx, "cefe.class.cancel", "cefe class cancel", "T2", { courseId: c.courseId, at: booking.classDateTime });
  try {
    await api.cancelClass(s.token, s.user.userId, c.courseId, String(booking.classDateTime));
    a.complete({});
  } catch (e) {
    a.fail({ error: e instanceof AppError ? e.code : String(e) });
    throw e;
  }
  return { data: { courseId: c.courseId, classDateTime: booking.classDateTime, cancelled: true }, human: () => `${ok("✓")} Clase cancelada.` };
}

// ---------------------------------------------------------------- tournaments & promotions

export async function cefeTournamentList(ctx: Ctx) {
  const s = requireSession(ctx.flags.profile);
  const list = await api.listTournaments(s.token, str(ctx.args, "status"));
  return {
    data: list,
    human: () => list.length === 0 ? "Sin torneos publicados." : list.map((t) => `  ${strong(String(t.tournamentId ?? t.id))}  ${String(t.name ?? "")}  ${muted(String(t.status ?? ""))}${t.registrationCloseAt ? muted(`  inscripciones hasta ${String(t.registrationCloseAt).slice(0, 10)}`) : ""}`).join("\n"),
    nextSteps: list[0] ? [{ command: `cupo cefe tournament get ${String(list[0].tournamentId ?? list[0].id)}`, description: "competiciones del torneo" }] : [],
  };
}

export async function cefeTournamentGet(ctx: Ctx) {
  const s = requireSession(ctx.flags.profile);
  const id = positional(ctx.args, 0, "tournamentId");
  const [t, comps] = await Promise.all([api.getTournament(s.token, id), api.competitions(s.token, id)]);
  return {
    data: { ...t, competitions: comps },
    human: () => [bold(String(t.name ?? id)) + muted(`  ${String(t.status ?? "")}`), ...comps.map((c) => `  ${strong(String(c.competitionId ?? c.id))}  ${String(c.name ?? "")}  ${muted([c.category, c.sex, c.distance].filter(Boolean).map(String).join(" · "))}`)].join("\n"),
    nextSteps: comps[0] ? [{ command: `cupo cefe tournament register ${id} --competition ${String(comps[0].competitionId ?? comps[0].id)} --yes`, description: "inscribirse en una competición" }] : [],
  };
}

export async function cefeTournamentMine(ctx: Ctx) {
  const s = requireSession(ctx.flags.profile);
  const list = await api.myRegistrations(s.token);
  return { data: list, human: () => (list.length === 0 ? "Sin inscripciones a torneos." : list.map((r) => `  • ${JSON.stringify(r).slice(0, 160)}`).join("\n")) };
}

export async function cefeTournamentRegister(ctx: Ctx) {
  const s = requireSession(ctx.flags.profile);
  const id = positional(ctx.args, 0, "tournamentId");
  const comp = requireStr(ctx.args, "competition");
  const body = { ...(str(ctx.args, "dependent") ? { dependentIdentification: str(ctx.args, "dependent") } : {}), ...(str(ctx.args, "sex") ? { sex: str(ctx.args, "sex") } : {}), ...(str(ctx.args, "observation") ? { observation: str(ctx.args, "observation") } : {}) };
  assertWritable();
  await approveGate({ cliName: "cupo", flags: { json: ctx.flags.json, noInput: ctx.flags.noInput } }, { title: "Inscripción a torneo", summary: `torneo ${id} · competición ${comp}` }, { trust: "T2", yes: ctx.args.yes === true });
  const a = audit(ctx, "cefe.tournament.register", "cefe tournament register", "T2", { tournamentId: id, competitionId: comp, dependent: body.dependentIdentification ?? null });
  try {
    const res = await api.registerCompetition(s.token, id, comp, body);
    a.complete({});
    return { data: { tournamentId: id, competitionId: comp, response: res }, human: () => `${ok("✓")} Inscripción registrada en la competición ${comp}.`, nextSteps: [{ command: "cupo cefe tournament mine", description: "ver inscripciones" }] };
  } catch (e) {
    a.fail({ error: e instanceof AppError ? e.code : String(e) });
    throw e;
  }
}

export async function cefeTournamentUnregister(ctx: Ctx) {
  const s = requireSession(ctx.flags.profile);
  const id = positional(ctx.args, 0, "tournamentId");
  const comp = requireStr(ctx.args, "competition");
  assertWritable();
  await approveGate({ cliName: "cupo", flags: { json: ctx.flags.json, noInput: ctx.flags.noInput } }, { title: "Cancelar inscripción a torneo", summary: `torneo ${id} · competición ${comp}` }, { trust: "T2", yes: ctx.args.yes === true });
  const a = audit(ctx, "cefe.tournament.unregister", "cefe tournament unregister", "T2", { tournamentId: id, competitionId: comp });
  try {
    await api.unregisterCompetition(s.token, id, comp, str(ctx.args, "dependent"));
    a.complete({});
  } catch (e) {
    a.fail({ error: e instanceof AppError ? e.code : String(e) });
    throw e;
  }
  return { data: { tournamentId: id, competitionId: comp, unregistered: true }, human: () => `${ok("✓")} Inscripción cancelada.` };
}

export async function cefePromoList(ctx: Ctx) {
  const list = await api.listPromotions(str(ctx.args, "status"));
  const s = currentSession(ctx.flags.profile);
  const mine = s ? await api.userPromotions(s.token, s.user.userId).catch(() => []) : [];
  return {
    data: { promotions: list, mine },
    human: () => [
      ...list.map((p) => `  ${strong(String(p.promotionId ?? "").slice(0, 8))}  ${String(p.name ?? "")}  ${muted(`${String(p.promotionType ?? "")} · ${String(p.status ?? "")} · ${String(p.visibility ?? "")} · ${cop(Number(p.price ?? 0))} · hasta ${String(p.endDate ?? "").slice(0, 10)}`)}\n     ${dim(String(p.description ?? "").slice(0, 140))}`),
      mine.length ? `\n${bold("Tus promociones:")} ${mine.length}` : s ? dim("\nNo tienes promociones asignadas.") : dim("\nInicia sesión para ver las tuyas."),
      info("i") + dim(" La compra de promociones se hace en cefechapinero.com/client/promotions (pago Wompi)."),
    ].join("\n"),
  };
}
