import { runDoctor, type DoctorCheck } from "../cli/agent/doctor.js";
import { getKillswitchState, turnKillswitchOff, turnKillswitchOn } from "../cli/safety/killswitch.js";
import { bold, danger, dim, muted, ok, warn } from "../cli/platform/style.js";
import { positional, str } from "../core/args.js";
import { EXIT, fail } from "../core/errors.js";
import { appHome } from "../core/paths.js";
import { SCHEMA_VERSION } from "../core/output.js";
import { listBookings, listCourts, logout, me, paymentHistory, pendingToPay } from "../idrd/api.js";
import { accessToken, currentSession, login, logoutLocal, resolvePassword, storedEmail } from "../idrd/auth.js";
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
  const email = str(ctx.args, "email") ?? process.env.IDRD_EMAIL ?? storedEmail(profile);
  if (!email) fail("usage/missing-flag", "Falta tu correo.", "Usa --email <correo> (se recuerda para la próxima).");
  const password = await resolvePassword({ stdin: Boolean(ctx.args.passwordStdin), noInput: ctx.flags.noInput });
  const session = await login(profile, email, password);
  const user = await me(session.accessToken).catch(() => null);
  const data = { email, expiresAt: session.expiresAt, refreshable: Boolean(session.refreshToken), user };
  return {
    data,
    human: () => `${ok("✓")} Sesión iniciada como ${bold(email)}${user ? ` (${user.name})` : ""}\n  ${muted(`Vence: ${session.expiresAt}`)}`,
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
  const data = { loggedIn: user !== null, email: s.email, expiresAt: s.expiresAt, expired, refreshable: Boolean(s.refreshToken), liveCheck, user };
  return {
    data,
    human: () =>
      user
        ? `${ok("●")} Sesión activa: ${bold(s.email)} (${user.name})\n  ${muted(`Vence: ${s.expiresAt}${s.refreshToken ? " · renovable" : ""}`)}`
        : `${danger("●")} Sesión guardada pero no válida: ${liveCheck}`,
  };
}

export async function authLogout(ctx: Ctx) {
  const s = currentSession(ctx.flags.profile);
  if (s) await logout(s.accessToken).catch(() => undefined);
  logoutLocal(ctx.flags.profile);
  return { data: { loggedOut: true }, human: () => `${ok("✓")} Sesión cerrada y token local borrado.` };
}

export async function bookingList(ctx: Ctx) {
  const { token } = await accessToken(ctx.flags.profile);
  const remote = await listBookings(token);
  const local = localBookings(ctx.flags.profile).map(({ raw, ...rest }) => rest);
  const data = { remote, local };
  return {
    data,
    human: () =>
      [
        bold(`Reservas en el portal: ${remote.length}`),
        ...remote.slice(0, 20).map((r) => `  • ${JSON.stringify(r).slice(0, 140)}`),
        "",
        bold(`Creadas desde este equipo: ${local.length}`),
        ...local.map((b) => `  • ${b.bookingId}  cancha ${b.courtId}  ${b.date} ${b.startHour}–${b.finalHour}  ${b.free ? ok("gratis") : `$${b.amount}`}`),
      ].join("\n"),
  };
}

export async function payPending(ctx: Ctx) {
  const { token } = await accessToken(ctx.flags.profile);
  const items = await pendingToPay(token);
  return {
    data: items,
    human: () => (items.length === 0 ? `${ok("✓")} No tienes pagos pendientes.` : `${bold(`Pagos pendientes: ${items.length}`)}\n${items.map((i) => `  • ${JSON.stringify(i).slice(0, 160)}`).join("\n")}`),
    nextSteps: items.length ? [{ command: "cupo idrd pay pse <bookingId> --bank <código> --yes", description: "pagar una reserva creada desde este equipo" }] : [],
  };
}

export async function payHistory(ctx: Ctx) {
  const { token } = await accessToken(ctx.flags.profile);
  const items = await paymentHistory(token);
  return {
    data: items,
    human: () => (items.length === 0 ? "Sin pagos registrados." : `${bold(`Pagos: ${items.length}`)}\n${items.slice(0, 50).map((i) => `  • ${JSON.stringify(i).slice(0, 160)}`).join("\n")}`),
  };
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
    env: ["CUPO_HOME", "CUPO_PROFILE", "CUPO_JSON", "IDRD_PASSWORD", "IDRD_EMAIL", "CEFE_PASSWORD", "CEFE_EMAIL", "NO_COLOR"],
    globalFlags: GLOBAL_FLAGS,
    /** Start here: the job, then the map, then the provider detail. */
    start: ["cupo providers", "cupo find --sport pool --date sab", "cupo book <id de find>"],
    providers: PROVIDERS.map((p) => ({ id: p.id, name: p.name, web: p.web, covers: p.covers, sports: p.sports, login: p.login })),
    commands: COMMANDS.map((c) => ({ ...c, provider: providerOf(c.name) })),
  };
  return { data, human: () => JSON.stringify(data, null, 2) };
}

export function helpText(): string {
  const lines = [bold("cupo") + dim(" — consigue cupo para hacer deporte en Bogotá (IDRD + CEFE Chapinero), no oficial"), "", bold("Comandos:")];
  const w = Math.max(...COMMANDS.map((c) => c.name.length)) + 1;
  const groups: Array<[string, string]> = [["cupo", "El job (todos los proveedores)"], ["idrd", "IDRD · Portal Ciudadano"], ["cefe", "CEFE Chapinero"]];
  for (const [g, title] of groups) {
    lines.push("", dim(`# ${title}`));
    for (const c of COMMANDS.filter((x) => providerOf(x.name) === g)) lines.push(`  ${c.name.padEnd(w)} ${c.summary}${c.trust === "T3" ? warn("  [irreversible]") : ""}`);
  }
  lines.push("", bold("Globales:"), ...GLOBAL_FLAGS.map((f) => `  ${f.flag.padEnd(20)} ${f.description}`));
  lines.push("", dim("Detalle de un comando: idrd <comando> --help · Contrato para agentes: cupo schema"));
  return lines.join("\n");
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
