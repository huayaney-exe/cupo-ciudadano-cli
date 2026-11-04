import { bold, dim, info, muted, ok, strong } from "../cli/platform/style.js";
import { int, positional, str } from "../core/args.js";
import { fail } from "../core/errors.js";
import { table } from "../core/table.js";
import { getPark, getSchedule, listColiseumSports, listCourts, listLanes, type Court, type Lane, type Schedule } from "../idrd/api.js";
import { blocks, datesIn, freeRuns, hourSlots, type Block, type HourSlot } from "../idrd/availability.js";
import { parseSport, SPORTS, type Sport } from "../idrd/sports.js";
import { addDays, bogotaNow, hh, parseDate, parseHour, rangesLabel } from "../idrd/time.js";
import type { Ctx } from "./context.js";

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function courtId(raw: string): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) fail("usage/bad-id", `Id de espacio inválido: ${raw}.`, "Usa el id de `cupo idrd court list`.");
  return n;
}

function optInt(ctx: Ctx, key: string): number | undefined {
  const v = str(ctx.args, key);
  if (v === undefined) return undefined;
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) fail("usage/bad-arg", `--${key} debe ser un entero positivo (recibí ${v}).`);
  return n;
}

async function courtsFor(ctx: Ctx): Promise<Court[]> {
  const sport = parseSport(str(ctx.args, "sport"));
  const loc = str(ctx.args, "locality");
  let courts = await listCourts(sport);
  if (!ctx.args.all) courts = courts.filter((c) => c.bookable);
  if (loc) courts = courts.filter((c) => fold(c.locality).includes(fold(loc)) || fold(c.parkName).includes(fold(loc)));
  return courts;
}

export async function courtList(ctx: Ctx) {
  const courts = await courtsFor(ctx);
  const sport = parseSport(str(ctx.args, "sport"));
  const spec = SPORTS[sport];
  const first = courts[0];
  return {
    data: courts,
    human: (cs: Court[]) =>
      cs.length === 0
        ? `No hay ${spec.label.toLowerCase()} con esos filtros.`
        : `${bold(`${spec.label}: ${cs.length} ${cs.length === 1 ? spec.noun : spec.plural}`)}\n\n` +
          table(
            ["ID", "Parque", "Localidad", "Descripción"],
            cs.map((c) => [strong(String(c.id)), c.parkName, c.locality, muted(c.description || c.address)]),
            [8, 30, 14, 50],
          ),
    nextSteps: first
      ? spec.needs === "lane"
        ? [
            { command: `cupo idrd court lanes ${first.id}`, description: "carriles de una piscina" },
            { command: `cupo idrd find --sport pool --date mañana --from 6 --to 9`, description: "buscar cupos en todas las piscinas y carriles" },
          ]
        : spec.needs === "sport"
          ? [
              { command: `cupo idrd court sports ${first.id}`, description: "deportes que admite el coliseo" },
              { command: `cupo idrd slot list ${first.id} --date mañana --free`, description: "horas libres" },
            ]
          : [
              { command: `cupo idrd slot list ${first.id} --date mañana --free`, description: `horas libres de ${spec.noun === "cancha" ? "una cancha" : `un ${spec.noun}`}` },
              { command: `cupo idrd find --sport ${sport} --date mañana --from 6 --to 9`, description: "buscar en todos a la vez" },
            ]
      : [],
  };
}

export async function courtGet(ctx: Ctx) {
  const id = courtId(positional(ctx.args, 0, "id"));
  const sched = await getSchedule(id, bogotaNow().date);
  const spec = SPORTS[sched.endowment.sport];
  const [park, lanes, sports] = await Promise.all([
    Number.isFinite(sched.park.id) ? getPark(sched.park.id).catch(() => null) : Promise.resolve(null),
    spec.needs === "lane" ? listLanes(id).catch(() => []) : Promise.resolve([] as Lane[]),
    spec.needs === "sport" ? listColiseumSports(id).catch(() => []) : Promise.resolve([]),
  ]);
  const { id: parkId, ...parkInfo } = sched.park;
  const data = { court: { id, parkId, ...parkInfo }, kind: sched.endowment.sport, park, endowment: sched.endowment, lanes, sports };
  return {
    data,
    human: (d: typeof data) =>
      [
        bold(`${d.endowment.description || spec.noun} · ${d.court.name}`),
        `${muted("Tipo")}       ${spec.label}${spec.capacity === "quota" ? " (por cupos)" : ""}${spec.block ? " (por bloque)" : ""}`,
        `${muted("Dirección")}  ${d.court.address}${d.court.locality ? `, ${d.court.locality}` : ""}`,
        d.park?.hours ? `${muted("Parque")}     ${d.park.hours}` : "",
        `${muted("Superficie")} ${d.endowment.surface || "—"} · ${muted("Luz")} ${d.endowment.lighting || "—"} · ${muted("Estado")} ${d.endowment.status || "—"}`,
        d.park?.email ? `${muted("Contacto")}   ${d.park.email}` : "",
        lanes.length ? `${muted("Carriles")}   ${lanes.map((l) => `${l.id} (${l.name} ${l.level} ${l.direction}, ${l.quota ?? "?"} cupos)`).join(" · ")}` : "",
        sports.length ? `${muted("Deportes")}   ${sports.map((s) => `${s.id} ${s.name}`).join(" · ")}` : "",
        keyRules(d.endowment.rules).length ? `\n${dim("Para reservar:")}\n${keyRules(d.endowment.rules).map((l) => `  • ${l}`).join("\n")}\n${dim("  Reglas completas: cupo idrd court get " + d.court.id + " --json (endowment.rules)")}` : "",
      ].filter(Boolean).join("\n"),
    nextSteps: lanes[0]
      ? [{ command: `cupo idrd slot list ${id} --lane ${lanes[0].id} --date mañana`, description: "cupos por hora en un carril" }]
      : sports[0]
        ? [{ command: `cupo idrd slot list ${id} --sport-id ${sports[0].id} --date mañana`, description: "horas para ese deporte" }]
        : [{ command: `cupo idrd slot list ${id} --date mañana`, description: "ver horas" }],
  };
}

export async function courtLanes(ctx: Ctx) {
  const id = courtId(positional(ctx.args, 0, "id"));
  const lanes = await listLanes(id);
  return {
    data: lanes,
    human: () =>
      lanes.length === 0
        ? "Esta dotación no tiene carriles (¿no es una piscina?)."
        : table(["Carril", "Nombre", "Nivel", "Sentido", "Cupos"], lanes.map((l) => [strong(String(l.id)), l.name, l.level, l.direction, String(l.quota ?? "—")]), [8, 8, 10, 12, 6]),
    nextSteps: lanes[0] ? [{ command: `cupo idrd slot list ${id} --lane ${lanes[0].id} --date mañana --free`, description: "cupos libres en ese carril" }] : [],
  };
}

export async function courtSports(ctx: Ctx) {
  const id = courtId(positional(ctx.args, 0, "id"));
  const sports = await listColiseumSports(id);
  return {
    data: sports,
    human: () => (sports.length === 0 ? "Esta dotación no publica deportes (¿no es un coliseo?)." : sports.map((s) => `  ${strong(String(s.id).padEnd(4))} ${s.name}`).join("\n")),
    nextSteps: sports[0] ? [{ command: `cupo idrd slot list ${id} --sport-id ${sports[0].id} --date mañana --free`, description: "horas libres para ese deporte" }] : [],
  };
}

/** The few published rules that decide whether a booking is possible, one sentence each. */
function keyRules(rules: string): string[] {
  return rules
    .split("\n")
    .map((l) => l.replace(/^[*•-]\s*/, "").trim())
    .filter((l) => /podrá reservar máximo|horas de anticipación|devolución de dinero/i.test(l))
    .map((l) => {
      const first = l.split(/(?<=\.)\s/)[0] ?? l;
      return first.length > 160 ? `${first.slice(0, 159)}…` : first;
    });
}

function renderSlots(slots: HourSlot[]): string {
  if (slots.length === 0) return dim("  Sin franjas reservables ese día.");
  return slots
    .map((s) => {
      const cap = s.quota !== undefined ? muted(`  ${Math.max(0, s.quota - (s.used ?? 0))}/${s.quota} cupos`) : "";
      return `  ${s.available ? ok("●") : muted("○")} ${hh(s.hour)}–${hh(s.hour + 1)}  ${s.available ? ok("libre") : muted("sin cupo")}${cap}`;
    })
    .join("\n");
}

function renderBlocks(bs: Block[]): string {
  return bs.map((b) => `  ${b.available ? ok("●") : muted("○")} bloque ${hh(b.from)}–${hh(b.to)}  ${b.available ? ok("libre") : muted("reservado")}`).join("\n");
}

/** Resolve what the calendar needs for this space, failing with the concrete fix when it is missing. */
export async function calendarOptions(ctx: Ctx, id: number, sched: Schedule): Promise<{ lane?: number; sportId?: number; document?: string }> {
  const spec = SPORTS[sched.endowment.sport];
  const lane = optInt(ctx, "lane");
  const sportId = optInt(ctx, "sportId");
  const document = str(ctx.args, "document");
  if (spec.needs === "lane" && lane === undefined) {
    const lanes = await listLanes(id).catch(() => [] as Lane[]);
    fail("usage/missing-lane", "Las piscinas se consultan y reservan por carril.", lanes.length ? `Usa --lane <id>. Carriles: ${lanes.map((l) => `${l.id} (${l.name} ${l.level})`).join(", ")}.` : `Corre \`cupo idrd court lanes ${id}\`.`);
  }
  return { lane, sportId, document };
}

export async function slotList(ctx: Ctx) {
  const id = courtId(positional(ctx.args, 0, "id"));
  const date = parseDate(str(ctx.args, "date"));
  let sched = await getSchedule(id, date, { lane: optInt(ctx, "lane"), sportId: optInt(ctx, "sportId"), document: str(ctx.args, "document") });
  const opts = await calendarOptions(ctx, id, sched);
  const spec = SPORTS[sched.endowment.sport];
  const weekDates = datesIn(sched.entries);
  let slots = hourSlots(sched.entries, date);
  const runs = freeRuns(slots);
  const bs = blocks(sched.entries, date);
  if (ctx.args.free) slots = slots.filter((s) => s.available);
  const outside = weekDates.length > 0 && !weekDates.includes(date);
  const data = { courtId: id, kind: sched.endowment.sport, lane: opts.lane ?? null, sportId: opts.sportId ?? null, date, weekDates, outsidePublishedWeek: outside, slots, blocks: bs, freeRuns: runs };
  const first = runs[0];
  const extra = `${opts.lane ? ` --lane ${opts.lane}` : ""}${opts.sportId ? ` --sport-id ${opts.sportId}` : ""}`;
  const freeBlock = bs.find((b) => b.available);
  return {
    data,
    human: () =>
      [
        bold(`${sched.endowment.description || `${spec.noun} ${id}`} · ${sched.park.name} · ${date}${opts.lane ? ` · carril ${opts.lane}` : ""}`),
        outside ? `${info("!")} El portal solo publica la semana ${weekDates[0]} a ${weekDates[weekDates.length - 1]}.` : "",
        spec.block ? renderBlocks(bs) : renderSlots(slots),
        spec.needs === "sport" && opts.sportId === undefined ? dim(`  Para reservar hace falta --sport-id (cupo idrd court sports ${id}).`) : "",
      ].filter(Boolean).join("\n"),
    nextSteps: spec.block && freeBlock
      ? [{ command: `cupo idrd booking create ${id} --date ${date} --hour ${freeBlock.from} --hours ${freeBlock.to - freeBlock.from}${extra}`, description: "vista previa de la reserva del bloque (no reserva nada)" }]
      : first
        ? [{ command: `cupo idrd booking create ${id} --date ${date} --hour ${first[0]}${first.length > 1 && spec.capacity === "exclusive" && !spec.block ? " --hours 2" : ""}${extra}`, description: "vista previa de la reserva (no reserva nada)" }]
        : [{ command: `cupo idrd find --sport ${sched.endowment.sport} --date ${date}`, description: "buscar en otros espacios" }],
  };
}

type FindResult = { court: Court; lane?: Lane; freeHours: number[]; places?: number };

export async function slotFind(ctx: Ctx) {
  const sport: Sport = parseSport(str(ctx.args, "sport"));
  const spec = SPORTS[sport];
  const date = parseDate(str(ctx.args, "date") ?? addDays(bogotaNow().date, 1));
  const from = str(ctx.args, "from") ? parseHour(str(ctx.args, "from")) : 0;
  const to = str(ctx.args, "to") ? parseHour(str(ctx.args, "to")) : 24;
  if (to <= from) fail("usage/bad-window", "--to debe ser mayor que --from.");
  const sportId = optInt(ctx, "sportId");
  const courts = await courtsFor(ctx);
  const concurrency = Math.max(1, Math.min(int(ctx.args, "concurrency", 4)!, 8));

  // Pools are a calendar per lane: expand each pool into its lanes first.
  type Unit = { court: Court; lane?: Lane };
  let units: Unit[] = courts.map((court) => ({ court }));
  const failed: Array<{ courtId: number; lane?: number; error: string }> = [];
  if (spec.needs === "lane") {
    const expanded: Unit[] = [];
    await runQueue(courts, concurrency, async (c) => {
      try {
        const lanes = (await listLanes(c.id)).filter((l) => l.enabled);
        if (lanes.length === 0) failed.push({ courtId: c.id, error: "sin carriles publicados" });
        for (const lane of lanes) expanded.push({ court: c, lane });
      } catch (e) {
        failed.push({ courtId: c.id, error: e instanceof Error ? e.message : String(e) });
      }
    });
    units = expanded;
  }

  const results: FindResult[] = [];
  let weekDates: string[] = [];
  await runQueue(units, concurrency, async (u) => {
    try {
      const sched = await getSchedule(u.court.id, date, { lane: u.lane?.id, sportId });
      if (!weekDates.length) weekDates = datesIn(sched.entries);
      const free = hourSlots(sched.entries, date).filter((s) => s.available && s.hour >= from && s.hour + 1 <= to);
      if (free.length) {
        const r: FindResult = { court: u.court, freeHours: free.map((s) => s.hour) };
        if (u.lane) r.lane = u.lane;
        const places = free.map((s) => (s.quota !== undefined ? s.quota - (s.used ?? 0) : undefined)).filter((n): n is number => n !== undefined);
        if (places.length) r.places = Math.min(...places);
        results.push(r);
      }
    } catch (e) {
      failed.push({ courtId: u.court.id, lane: u.lane?.id, error: e instanceof Error ? e.message : String(e) });
    }
  });
  results.sort((a, b) => (a.freeHours[0] ?? 99) - (b.freeHours[0] ?? 99) || a.court.parkName.localeCompare(b.court.parkName) || (a.lane?.id ?? 0) - (b.lane?.id ?? 0));
  const data = { date, sport, window: { from, to }, weekDates, results, scanned: units.length, spaces: courts.length, failed };
  const best = results[0];
  const bestExtra = best ? `${best.lane ? ` --lane ${best.lane.id}` : ""}${sportId ? ` --sport-id ${sportId}` : ""}` : "";
  return {
    data,
    human: () => {
      const span = from === 0 && to === 24 ? "todo el día" : `${hh(from)}–${hh(to)}`;
      const what = spec.needs === "lane" ? `${courts.length} piscinas · ${units.length} carriles revisados` : `${courts.length} ${courts.length === 1 ? spec.noun : spec.plural} revisad${spec.noun.endsWith("a") ? "as" : "os"}`;
      const head = bold(`${spec.label} · ${date} · ${span} · ${what}`);
      if (!results.length) return `${head}\n\n  Ninguna hora libre en esa franja.${failed.length ? dim(`\n  (${failed.length} no respondieron)`) : ""}`;
      const cols = spec.needs === "lane" ? ["ID", "Parque", "Carril", "Libre (mín. cupos)"] : ["ID", "Parque", "Localidad", "Libre"];
      return `${head}\n\n${table(
        cols,
        results.map((r) => [
          strong(String(r.court.id)),
          r.court.parkName,
          spec.needs === "lane" ? `${r.lane?.id} (${r.lane?.name} ${r.lane?.level})` : r.court.locality,
          ok(rangesLabel(r.freeHours)) + (r.places !== undefined ? muted(` (${r.places})`) : ""),
        ]),
        [8, 28, 18, 46],
      )}${failed.length ? dim(`\n\n${failed.length} no respondieron.`) : ""}`;
    },
    nextSteps: best
      ? [{ command: `cupo idrd booking create ${best.court.id} --date ${date} --hour ${best.freeHours[0]}${bestExtra}`, description: "vista previa de la reserva (no reserva nada)" }]
      : [{ command: `cupo idrd find --date ${addDays(date, 1)} --sport ${sport}`, description: "probar otro día" }],
  };
}

async function runQueue<T>(items: T[], concurrency: number, fn: (item: T) => Promise<void>): Promise<void> {
  const queue = [...items];
  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, async () => {
    for (let it = queue.shift(); it !== undefined; it = queue.shift()) await fn(it);
  }));
}
