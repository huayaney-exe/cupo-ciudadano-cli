import { runDoctor, type DoctorCheck } from "../cli/agent/doctor.js";
import { getKillswitchState, turnKillswitchOff, turnKillswitchOn } from "../cli/safety/killswitch.js";
import { bold, danger, dim, muted, ok, strong, warn } from "../cli/platform/style.js";
import { table } from "../core/table.js";
import { nowMs } from "../idrd/time.js";
import { currentSession as cefeCurrentSession } from "../cefe/auth.js";
import { positional, str } from "../core/args.js";
import { EXIT, fail } from "../core/errors.js";
import { appHome } from "../core/paths.js";
import { SCHEMA_VERSION } from "../core/output.js";
import { listBookings, listCourts, logout, me, paymentHistory, pendingToPay } from "../idrd/api.js";
import { accessToken, currentSession, forgetPassword, knownEmail, login, logoutLocal, passwordLocation, resolvePassword, storedEmail } from "../idrd/auth.js";
import { envFileInsecure, envFilePath, secretBackend } from "../core/secrets.js";
import { localBookings } from "../idrd/payment.js";
import { COMMANDS, GLOBAL_FLAGS, providerOf } from "../registry.js";
import { PROVIDERS } from "./jobs.js";
import { currentSession as cefeSession } from "../cefe/auth.js";
import { listPools as cefeListPools } from "../cefe/api.js";
import type { Ctx } from "./context.js";

import pkg from "../../package.json";

export const VERSION: string = pkg.version;

export async function authLogin(ctx: Ctx) {
  const profile = ctx.flags.profile;
  const email = str(ctx.args, "email") ?? knownEmail(profile);
  if (!email) fail("usage/missing-flag", "Falta tu correo.", "Usa --email <correo> (se recuerda para la próxima).");
  const save = ctx.args.save === true;
  if (save && secretBackend() === "none") fail("usage/bad-flag", "CUPO_SECRETS=none: guardar la contraseña está deshabilitado.", "Quita CUPO_SECRETS o ponlo en keychain|file.");
  const password = await resolvePassword({ stdin: Boolean(ctx.args.passwordStdin), noInput: ctx.flags.noInput, email });
  const session = await login(profile, email, password, { save });
  const user = await me(session.accessToken).catch(() => null);
  const data = { email, expiresAt: session.expiresAt, refreshable: Boolean(session.refreshToken), passwordSaved: save ? session.savedTo ?? null : null, user };
  return {
    data,
    human: () => `${ok("✓")} Sesión iniciada como ${bold(email)}${user ? ` (${user.name})` : ""}\n  ${muted(`Vence: ${session.expiresAt}`)}${session.savedTo ? `\n  ${muted(`Contraseña guardada en ${session.savedTo}: no se volverá a pedir.`)}` : ""}`,
    nextSteps: [{ command: "cupo idrd find --date mañana --from 6 --to 9", description: "buscar canchas libres" }],
  };
}

export async function authStatus(ctx: Ctx) {
  const s = currentSession(ctx.flags.profile);
  if (!s) {
    return {
      data: { loggedIn: false, email: storedEmail(ctx.flags.profile) ?? null },
      human: () => `${warn("○")} Sin sesión. Corre ${bold("cupo idrd auth login --email <correo>")}`,
      nextSteps: [{ command: "cupo idrd auth login --email <correo>", description: "iniciar sesión" }],
    };
  }
  const expired = s.expiresAt ? Date.parse(s.expiresAt) < Date.now() : false;
  let user = null;
  let liveCheck: string;
  try {
    const { token } = await accessToken(ctx.flags.profile);
    user = await me(token);
    liveCheck = "ok";
  } catch (e) {
    liveCheck = e instanceof Error ? e.message : String(e);
  }
  const passwordStored = passwordLocation(s.email);
  const data = { loggedIn: user !== null, email: s.email, expiresAt: s.expiresAt, expired, refreshable: Boolean(s.refreshToken), passwordStored, liveCheck, user };
  return {
    data,
    human: () =>
      user
        ? `${ok("●")} Sesión activa: ${bold(s.email)} (${user.name})\n  ${muted(`Vence: ${s.expiresAt}${passwordStored ? ` · contraseña guardada (${passwordStored === "keychain" ? "Llavero" : envFilePath()}): se renueva sola` : " · al vencer pedirá la contraseña (guárdala con `auth login --save`)"}`)}`
        : `${danger("●")} Sesión guardada pero no válida: ${liveCheck}`,
  };
}

export async function authLogout(ctx: Ctx) {
  const s = currentSession(ctx.flags.profile);
  if (s) await logout(s.accessToken).catch(() => undefined);
  logoutLocal(ctx.flags.profile);
  const email = s?.email ?? knownEmail(ctx.flags.profile);
  const forgotten = ctx.args.forget === true && email ? forgetPassword(email) : null;
  const forgot = Boolean(forgotten && (forgotten.file || forgotten.keychain));
  return { data: { loggedOut: true, passwordForgotten: forgot }, human: () => `${ok("✓")} Sesión cerrada y token local borrado.${forgot ? " Contraseña guardada eliminada." : ""}` };
}

export async function bookingList(ctx: Ctx) {
  const { token } = await accessToken(ctx.flags.profile);
  const remote = await listBookings(token);
  const local = localBookings(ctx.flags.profile).map(({ raw, ...rest }) => rest);
  const remoteIds = new Set(remote.map((r) => String((r as { id?: unknown }).id)));
  const localStatus = (b: (typeof local)[number]): { status: "pagada" | "pendiente" | "vencida"; detail: string } => {
    if (remoteIds.has(String(b.bookingId))) return { status: "pagada", detail: "confirmada en el portal" };
    const hold = b.holdUntil ? Date.parse(`${String(b.holdUntil).replace(" ", "T")}-05:00`) : NaN;
    if (Number.isFinite(hold) && hold < nowMs()) return { status: "vencida", detail: `la retención venció el ${String(b.holdUntil).slice(0, 16)}; vuelve a reservar` };
    return { status: "pendiente", detail: `paga antes de las ${String(b.holdUntil ?? "").slice(11, 16)}: cupo idrd pay pse ${b.bookingId} --bank <código> --yes` };
  };
  const data = { remote, local: local.map((b) => ({ ...b, ...localStatus(b) })) };
  const r = (x: Record<string, unknown>, k: string) => (x[k] === null || x[k] === undefined ? "" : String(x[k]));
  const hhmm = (t: string) => t.slice(0, 5);
  return {
    data,
    human: () =>
      [
        bold(`Reservas en el portal: ${remote.length}`),
        ...(remote.length
          ? [table(
              ["Reserva", "Fecha", "Hora", "Espacio", "Parque", "Valor", "Pago"],
              remote.slice(0, 30).map((x) => {
                const o = x as Record<string, unknown>;
                return [r(o, "id"), r(o, "date"), `${hhmm(r(o, "start_hour"))}–${hhmm(r(o, "final_hour"))}`, r(o, "name"), r(o, "park"), r(o, "total_format").trim() || r(o, "total"), r(o, "status_bank") === "OK" ? ok("pagado") : r(o, "status_bank") || muted("—")];
              }),
              [8, 10, 11, 34, 28, 14, 10],
            )]
          : [muted("  ninguna")]),
        "",
        bold(`Creadas desde este equipo: ${local.length}`),
        ...data.local.map((b) => `  • ${b.bookingId}  cancha ${b.courtId}  ${b.date} ${b.startHour}–${b.finalHour}  $${b.amount}  ${b.status === "pagada" ? ok(`✓ ${b.detail}`) : b.status === "vencida" ? muted(`○ ${b.detail}`) : warn(`! ${b.detail}`)}`),
      ].join("\n"),
  };
}

export async function payPending(ctx: Ctx) {
  const { token } = await accessToken(ctx.flags.profile);
  const items = await pendingToPay(token);
  return {
    data: items,
    human: () => (items.length === 0 ? `${ok("✓")} No tienes pagos pendientes.` : `${bold(`Pagos pendientes: ${items.length}`)}\n${items.map((i) => `  • ${scalarLine(i)}`).join("\n")}`),
    nextSteps: items.length ? [{ command: "cupo idrd pay pse <bookingId> --bank <código> --yes", description: "pagar una reserva creada desde este equipo" }] : [],
  };
}

export async function payHistory(ctx: Ctx) {
  const { token } = await accessToken(ctx.flags.profile);
  const items = await paymentHistory(token);
  return {
    data: items,
    human: () => {
      if (items.length === 0) return "Sin pagos registrados.";
      const g = (x: unknown, k: string) => { const v = (x as Record<string, unknown>)[k]; return v === null || v === undefined ? "" : String(v); };
      const status = (s: string) => (s === "APROBADO" ? ok(s) : s === "FALLIDO" || s === "RECHAZADO" ? danger(s) : warn(s || "—"));
      return `${bold(`Pagos: ${items.length}`)}\n${table(
        ["Fecha", "Concepto", "Valor", "Estado", "Reserva", "Código de pago"],
        items.slice(0, 50).map((i) => [(g(i, "payment_at") || g(i, "created_at")).slice(0, 16), g(i, "concept").replace(/^RESERVA /, ""), g(i, "total_format").trim() || g(i, "total"), status(g(i, "status")), g(i, "booking_id"), g(i, "payment_code")]),
        [16, 44, 16, 10, 8, 36],
      )}\n${dim("Comprobante de un pago aprobado: https://portalciudadano.idrd.gov.co/app/pagos/comprobante/<código de pago>")}`;
    },
    nextSteps: items[0] && (items[0] as Record<string, unknown>).payment_code ? [{ command: `cupo idrd pay status ${String((items[0] as Record<string, unknown>).payment_code)}`, description: "detalle del pago más reciente" }] : [],
  };
}

/** Readable one-liner for a record of unknown shape: its scalar fields. */
function scalarLine(x: unknown): string {
  if (!x || typeof x !== "object") return String(x);
  return Object.entries(x as Record<string, unknown>).filter(([, v]) => v !== null && v !== undefined && typeof v !== "object").slice(0, 8).map(([k, v]) => `${muted(`${k}:`)} ${String(v)}`).join("  ");
}

export async function doctor(ctx: Ctx) {
  const checks: Array<() => Promise<DoctorCheck>> = [
    async () => {
      const major = Number(process.versions.node.split(".")[0]);
      return { name: "node", ok: major >= 20, detail: `v${process.versions.node}${major >= 20 ? "" : " (requiere >= 20)"}` };
    },
    async () => ({ name: "home", ok: true, detail: appHome() }),
    async () => {
      const t0 = Date.now();
      const courts = await listCourts("tennis");
      return { name: "idrd-publico", ok: courts.length > 0, detail: `${courts.length} canchas de tenis · ${Date.now() - t0} ms` };
    },
    async () => {
      const t0 = Date.now();
      const pools = await cefeListPools();
      return { name: "cefe-publico", ok: pools.length > 0, detail: `${pools.length} piscinas · ${Date.now() - t0} ms` };
    },
    async () => {
      const s = cefeSession(ctx.flags.profile);
      return { name: "cefe-sesion", ok: true, detail: s ? `${s.email} · vence ${s.expiresAt}` : "sin sesión (solo lectura disponible)" };
    },
    async () => {
      const s = currentSession(ctx.flags.profile);
      if (!s) return { name: "idrd-sesion", ok: true, detail: "sin sesión (solo lectura disponible)" };
      const { token, refreshed } = await accessToken(ctx.flags.profile);
      const u = await me(token);
      return { name: "idrd-sesion", ok: true, detail: `${u.email} · vence ${s.expiresAt}${refreshed ? " · renovada" : ""}` };
    },
    async () => {
      const email = knownEmail(ctx.flags.profile);
      const where = passwordLocation(email);
      const insecure = envFileInsecure();
      return { name: "credenciales", ok: !insecure, detail: insecure ? `${envFilePath()} es legible por otros usuarios: chmod 600` : where ? `IDRD: contraseña guardada en ${where === "keychain" ? "el Llavero" : envFilePath()} (sesión se renueva sola)` : `IDRD: sin contraseña guardada (almacén: ${secretBackend()}); guárdala con \`cupo idrd auth login --save\`` };
    },
    async () => {
      const k = getKillswitchState(appHome());
      return { name: "killswitch", ok: !k.active, detail: k.active ? `ACTIVO desde ${k.activatedAt}: ${k.reason}` : "apagado" };
    },
  ];
  const result = await runDoctor(checks);
  return {
    data: result,
    human: () =>
      `${result.checks.map((c) => `${c.ok ? ok("✓") : danger("✗")} ${c.name.padEnd(15)} ${muted(c.detail)}`).join("\n")}\n\n${result.ok ? ok("Todo bien.") : danger("Hay problemas.")}`,
    meta: { exitCode: result.ok ? EXIT.ok : EXIT.unknown },
  };
}

export async function killswitch(ctx: Ctx) {
  const action = positional(ctx.args, 0, "on|off|status");
  if (action === "on") turnKillswitchOn(appHome(), str(ctx.args, "reason") ?? "manual");
  else if (action === "off") turnKillswitchOff(appHome());
  else if (action !== "status") fail("usage/bad-arg", "Usa: cupo killswitch on|off|status");
  const state = getKillswitchState(appHome());
  return {
    data: state,
    human: () => (state.active ? `${danger("■")} Killswitch ACTIVO: reservas y pagos bloqueados.` : `${ok("■")} Killswitch apagado.`),
  };
}

export async function schema() {
  const data = {
    schemaVersion: SCHEMA_VERSION,
    cli: "cupo",
    version: VERSION,
    envelope: {
      success: "{ok:true, schemaVersion, command, data, nextSteps[], meta?}",
      error: "{ok:false, schemaVersion, command, error:{code, message, hint?}}",
    },
    exitCodes: { ok: 0, unknown: 1, usage: 2, auth: 3, notFound: 4, refused: 5, upstream: 6 },
    env: ["CUPO_HOME", "CUPO_PROFILE", "CUPO_JSON", "CUPO_SECRETS", "IDRD_PASSWORD", "IDRD_EMAIL", "CEFE_PASSWORD", "CEFE_EMAIL", "NO_COLOR"],
    /** `~/.cupo/env` (0600) is read for every variable above; `auth login --save` stores the password in the macOS Keychain or there. */
    envFile: envFilePath(),
    globalFlags: GLOBAL_FLAGS,
    /** Start here: the job, then the map, then the provider detail. */
    start: ["cupo providers", "cupo find --sport pool --date sab", "cupo book <id de find>"],
    providers: PROVIDERS.map((p) => ({ id: p.id, name: p.name, web: p.web, covers: p.covers, sports: p.sports, login: p.login })),
    commands: COMMANDS.map((c) => ({ ...c, provider: providerOf(c.name) })),
  };
  return { data, human: () => JSON.stringify(data, null, 2) };
}

const GROUPS: Array<[string, string]> = [["cupo", "El job (todos los proveedores)"], ["idrd", "IDRD · Portal Ciudadano"], ["cefe", "CEFE Chapinero"]];

/** Full help, or one provider's commands (`cupo idrd --help`). */
export function helpText(only?: "idrd" | "cefe"): string {
  const lines = [bold(only ? `cupo ${only}` : "cupo") + dim(only ? ` — ${GROUPS.find(([g]) => g === only)![1]} · parte de cupo` : " — consigue cupo para hacer deporte en Bogotá (IDRD + CEFE Chapinero), no oficial"), "", bold("Comandos:")];
  const w = Math.max(...COMMANDS.map((c) => c.name.length)) + 1;
  const groups = only ? GROUPS.filter(([g]) => g === only) : GROUPS;
  for (const [g, title] of groups) {
    lines.push("", dim(`# ${title}`));
    for (const c of COMMANDS.filter((x) => providerOf(x.name) === g)) lines.push(`  ${c.name.padEnd(w)} ${c.summary}${c.trust === "T3" ? warn("  [irreversible]") : ""}`);
  }
  lines.push("", bold("Globales:"), ...GLOBAL_FLAGS.map((f) => `  ${f.flag.padEnd(20)} ${f.description}`));
  lines.push("", dim(`Detalle de un comando: cupo ${only ?? "idrd"} <comando> --help · Contrato para agentes: cupo schema${only ? " · Todo: cupo --help" : ""}`));
  return lines.join("\n");
}

/** Bare `cupo` for a human: the three commands of the job and where they stand, not sixty lines of reference. */
export function welcomeText(profile?: string): string {
  const idrd = currentSession(profile);
  const cefe = cefeCurrentSession(profile);
  const row = (n: number, cmd: string, what: string) => `   ${n}. ${strong(cmd.padEnd(48))} ${muted(what)}`;
  return [
    bold("Para empezar:"),
    row(1, "cupo find --sport tennis --date sab --from 8", "busca cupo en todos los proveedores"),
    row(2, "cupo book <id de find>", "vista previa; con --yes reserva de verdad"),
    row(3, "cupo idrd auth login --email tu@correo --save", "entra una vez; la sesión se renueva sola"),
    "",
    `  ${muted("Sesión IDRD:")} ${idrd ? ok(idrd.email) : muted("sin sesión")}   ${muted("CEFE Chapinero:")} ${cefe ? ok(cefe.email) : muted("sin sesión")}`,
    `  ${muted("Todos los comandos: cupo --help · Por proveedor: cupo idrd --help, cupo cefe --help · Para agentes: cupo schema")}`,
  ].join("\n");
}

/** Closest command names for a typo, by shared first word or small edit distance. */
export function suggestCommands(words: string[], max = 3): string[] {
  const typed = words.slice(0, 3).join(" ").toLowerCase();
  const dist = (a: string, b: string): number => {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0]![j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i]![j] = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length]![b.length]!;
  };
  const typedWords = words.slice(0, 3).map((w) => w.toLowerCase());
  const wordScore = (w: string, cw: string) => (cw === w || (w.length > 2 && cw.startsWith(w)) ? 0 : dist(w, cw));
  const scored = COMMANDS.map((c) => {
    const cws = c.name.toLowerCase().split(" ");
    // Each typed word is matched to its closest word in the command; a command missing a typed word costs 2.
    const score = typedWords.reduce((sum, w) => sum + Math.min(2, ...cws.map((cw) => wordScore(w, cw))), 0);
    return { name: c.name, score };
  }).filter((x) => x.score <= Math.max(1, typedWords.length)).sort((a, b) => a.score - b.score || a.name.length - b.name.length);
  void typed;
  return scored.slice(0, max).map((x) => x.name);
}

export function commandHelp(name: string): string {
  const c = COMMANDS.find((x) => x.name === name)!;
  const args = (c.args ?? []).map((a) => `<${a.name}>`).join(" ");
  return [
    `${bold(`cupo ${c.name}`)} ${args}`,
    c.summary,
    ...(c.args?.length ? ["", bold("Argumentos:"), ...c.args.map((a) => `  <${a.name}>  ${a.description}`)] : []),
    ...(c.flags?.length ? ["", bold("Flags:"), ...c.flags.map((f) => `  ${f.flag.padEnd(34)} ${f.description}`)] : []),
    "",
    `${muted("Nivel de confianza:")} ${c.trust}${c.auth ? muted(" · requiere sesión") : ""}`,
    `${muted("Salida JSON:")} ${c.output}`,
    ...(c.examples?.length ? ["", bold("Ejemplos:"), ...c.examples.map((e) => `  ${e}`)] : []),
  ].join("\n");
}
