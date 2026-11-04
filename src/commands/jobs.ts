import { bold, dim, muted, ok, strong, warn } from "../cli/platform/style.js";
import { positional, str } from "../core/args.js";
import { fail } from "../core/errors.js";
import { table } from "../core/table.js";
import { currentSession as cefeSession } from "../cefe/auth.js";
import { currentSession as idrdSession } from "../idrd/auth.js";
import { ALL_SPORTS, parseSport, SPORTS, type Sport } from "../idrd/sports.js";
import { addDays, bogotaNow, hh, parseDate } from "../idrd/time.js";
import { cefeBookingCreate, cefeSlotFind } from "./cefe.js";
import type { ParsedArgs } from "../cli/foundation/argv.js";
import type { Ctx } from "./context.js";
import { slotFind } from "./read.js";
import { bookingCreate } from "./write.js";

/**
 * The job: "quiero hacer deporte tal día a tal hora; consígueme el cupo".
 * These commands sit above the providers. Every result carries the exact
 * command that books it, so an agent never has to learn which system owns
 * a space. Ids are prefixed with the provider: `idrd:11537`, `cefe:<poolId>`.
 */
export type ProviderId = "idrd" | "cefe";

export const PROVIDERS: Array<{ id: ProviderId; name: string; web: string; covers: string; sports: string[]; login: string; account: string }> = [
  { id: "idrd", name: "IDRD · Portal Ciudadano", web: "https://portalciudadano.idrd.gov.co", covers: "parques públicos de toda Bogotá: 320 canchas (tenis, pádel, pickleball, fútbol), 12 piscinas por carril, 35 asadores, 5 gimnasios CEFE, 4 coliseos; escuelas y actividades con inscripción", sports: [...ALL_SPORTS], login: "cupo idrd auth login --email <correo>", account: "cuenta del Portal Ciudadano (IDRD_PASSWORD)" },
  { id: "cefe", name: "CEFE Chapinero", web: "https://cefechapinero.com", covers: "Centro Felicidad Chapinero: 2 piscinas por franja de 60 min con cupos, 18 cursos de natación y actividades, torneos", sports: ["pool"], login: "cupo cefe auth login --email <correo>", account: "cuenta propia del CEFE (CEFE_PASSWORD)" },
];

type Free = { start: string; end: string; places?: number };
type Hit = { provider: ProviderId; id: string; kind: Sport; name: string; where: string; lane?: string; free: Free[]; bookCommand: string };

/** "6", "6am", "06:30", "18" → minutes from midnight. */
function minutes(raw: string | undefined, def: number): number {
  if (!raw) return def;
  const s = raw.trim().toLowerCase().replace(/\s+/g, "");
  const m = /^(\d{1,2})(?::(\d{2}))?(am|pm)?$/.exec(s);
  if (!m) fail("usage/bad-hour", `Hora inválida: ${raw}.`, "Usa 6, 6am, 18 o 06:30.");
  let h = Number(m[1]);
  if (m[3] === "pm" && h < 12) h += 12;
  if (m[3] === "am" && h === 12) h = 0;
  return h * 60 + Number(m[2] ?? 0);
}
const hm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export async function find(ctx: Ctx) {
  const sport = parseSport(str(ctx.args, "sport") ?? "pool");
  const date = parseDate(str(ctx.args, "date") ?? addDays(bogotaNow().date, 1));
  const from = minutes(str(ctx.args, "from"), 0);
  const to = minutes(str(ctx.args, "to"), 24 * 60);
  if (to <= from) fail("usage/bad-window", "--to debe ser mayor que --from.");
  const only = str(ctx.args, "provider") as ProviderId | undefined;
  if (only && !PROVIDERS.some((p) => p.id === only)) fail("usage/bad-arg", `Proveedor desconocido: ${only}.`, "Opciones: idrd, cefe.");
  const locality = str(ctx.args, "locality");
  const providers = PROVIDERS.filter((p) => (!only || p.id === only) && p.sports.includes(sport));
  const hits: Hit[] = [];
  const failed: Array<{ provider: ProviderId; error: string }> = [];
  const scanned: Record<string, number> = {};

  await Promise.all(providers.map(async (p) => {
    try {
      if (p.id === "idrd") {
        const r = await slotFind({ ...ctx, args: { ...ctx.args, _: [], sport, date, from: String(Math.floor(from / 60)), to: String(Math.ceil(to / 60)), locality } });
        scanned.idrd = r.data.scanned;
        for (const x of r.data.results) {
          const lane = x.lane ? ` --lane ${x.lane.id}` : "";
          hits.push({
            provider: "idrd", id: `idrd:${x.court.id}`, kind: sport, name: `${x.court.parkName}${x.court.description ? ` · ${x.court.description}` : ""}`, where: x.court.locality,
            ...(x.lane ? { lane: `${x.lane.id} (${x.lane.name} ${x.lane.level})` } : {}),
            free: x.freeHours.map((h) => ({ start: hh(h), end: hh(h + 1), ...(x.places !== undefined ? { places: x.places } : {}) })),
            bookCommand: `cupo book idrd:${x.court.id} --date ${date} --hour ${x.freeHours[0]}${lane}`,
          });
        }
      } else {
        if (locality && !"chapinero cefe centro felicidad".includes(locality.toLowerCase())) { scanned.cefe = 0; return; }
        const r = await cefeSlotFind({ ...ctx, args: { ...ctx.args, _: [], date, from: hm(from), to: hm(to) } });
        scanned.cefe = r.data.scanned;
        for (const x of r.data.results) {
          hits.push({
            provider: "cefe", id: `cefe:${x.pool.poolId}`, kind: "pool", name: `CEFE Chapinero · ${x.pool.name}`, where: "CHAPINERO",
            free: x.slots.map((s) => ({ start: s.time, end: s.end.slice(11, 16), places: s.free })),
            bookCommand: `cupo book cefe:${x.pool.poolId} --date ${date} --time ${x.slots[0]!.time}`,
          });
        }
      }
    } catch (e) {
      failed.push({ provider: p.id, error: e instanceof Error ? e.message : String(e) });
    }
  }));
  hits.sort((a, b) => a.free[0]!.start.localeCompare(b.free[0]!.start) || a.name.localeCompare(b.name));
  const data = { date, sport, window: { from: hm(from), to: hm(to) }, providers: providers.map((p) => p.id), scanned, results: hits, failed };
  return {
    data,
    human: () => {
      const span = from === 0 && to === 1440 ? "todo el día" : `${hm(from)}–${hm(to)}`;
      const head = bold(`${SPORTS[sport].label} · ${date} · ${span}`) + muted(` · ${providers.map((p) => `${p.name} (${scanned[p.id] ?? 0})`).join(" + ")}`);
      if (!hits.length) return `${head}\n\n  Sin cupo en esa franja.${failed.length ? dim(`\n  (${failed.map((f) => `${f.provider}: ${f.error}`).join("; ")})`) : ""}\n  ${dim(`Prueba otro día: cupo find --sport ${sport} --date ${addDays(date, 1)}`)}`;
      return `${head}\n\n${table(
        ["Dónde", "Localidad", "Libre", "Reservar con"],
        hits.map((h) => [`${h.name}${h.lane ? muted(` · carril ${h.lane}`) : ""}`, h.where, ok(h.free.map((f) => `${f.start}${f.places !== undefined ? ` (${f.places})` : ""}`).join(" ")), strong(h.bookCommand.replace(/^cupo /, ""))]),
        [40, 12, 36, 60],
      )}${failed.length ? warn(`\n\n${failed.map((f) => `${f.provider} no respondió: ${f.error}`).join("\n")}`) : ""}\n${dim("Entre paréntesis: cupos cuando el espacio es compartido. `cupo book` muestra una vista previa antes de reservar.")}`;
    },
    nextSteps: hits[0] ? [{ command: hits[0].bookCommand, description: "vista previa de la reserva (no reserva nada)" }] : [{ command: `cupo find --sport ${sport} --date ${addDays(date, 1)}`, description: "probar otro día" }],
  };
}

/** Route a booking to its provider by the id prefix; flags pass through. */
export async function book(ctx: Ctx) {
  const raw = positional(ctx.args, 0, "id");
  const m = /^(idrd|cefe):(.+)$/.exec(raw);
  if (!m) fail("usage/bad-id", `El id debe llevar el proveedor: idrd:11537 o cefe:<poolId> (recibí ${raw}).`, "Los ids salen así de `cupo find`.");
  const [, provider, id] = m as unknown as [string, ProviderId, string];
  const args: ParsedArgs = { ...ctx.args, _: [id, ...ctx.args._.slice(1)] };
  if (provider === "idrd") {
    const time = str(args, "time");
    if (time && !str(args, "hour")) { const mm = /^(\d{1,2}):(\d{2})$/.exec(time); if (mm) args.hour = mm[1]; }
    return bookingCreate({ ...ctx, args });
  }
  const hour = str(args, "hour");
  if (hour && !str(args, "time")) args.time = /^\d{1,2}$/.test(hour) ? `${hour.padStart(2, "0")}:00` : hour;
  return cefeBookingCreate({ ...ctx, args });
}

export async function providers(ctx: Ctx) {
  const idrd = idrdSession(ctx.flags.profile);
  const cefe = cefeSession(ctx.flags.profile);
  const data = PROVIDERS.map((p) => ({
    ...p,
    loggedIn: p.id === "idrd" ? Boolean(idrd) : Boolean(cefe),
    email: p.id === "idrd" ? idrd?.email ?? null : cefe?.email ?? null,
    commands: { find: `cupo find --provider ${p.id} --sport ${p.id === "cefe" ? "pool" : "tennis"} --date mañana`, all: `cupo ${p.id} --help` },
  }));
  return {
    data,
    human: () => data.map((p) => [
      `${p.loggedIn ? ok("●") : muted("○")} ${bold(p.name)} ${muted(p.web)}`,
      `   ${p.covers}`,
      `   ${muted("Deportes")} ${p.sports.join(" ")}`,
      `   ${p.loggedIn ? ok(`sesión: ${p.email}`) : `${muted("sin sesión")} → ${p.login}`}`,
    ].join("\n")).join("\n\n") + `\n\n${dim("Buscar en todos: cupo find --sport pool --date sab · Reservar: cupo book <id de find> · Detalle por proveedor: cupo idrd --help, cupo cefe --help")}`,
    nextSteps: [{ command: "cupo find --sport pool --date sab --from 6 --to 10", description: "cupo para nadar el sábado en la mañana, en todos los proveedores" }],
  };
}
