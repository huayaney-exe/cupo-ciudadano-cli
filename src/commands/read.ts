import { bold, dim, info, muted, ok, strong } from "../cli/platform/style.js";
import { int, positional, str } from "../core/args.js";
import { fail } from "../core/errors.js";
import { table } from "../core/table.js";
import { getPark, getSchedule, listCourts, type Court } from "../idrd/api.js";
import { datesIn, freeRuns, hourSlots, type HourSlot } from "../idrd/availability.js";
import { parseSport, SPORTS } from "../idrd/sports.js";
import { addDays, bogotaNow, hh, parseDate, parseHour, rangesLabel } from "../idrd/time.js";
import type { Ctx } from "./context.js";

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function courtId(raw: string): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) fail("usage/bad-id", `Id de cancha inválido: ${raw}.`, "Usa el id de `idrd court list`.");
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
  return {
    data: courts,
    human: (cs: Court[]) =>
      cs.length === 0
        ? `No hay canchas de ${SPORTS[sport].label.toLowerCase()} con esos filtros.`
        : `${bold(`${SPORTS[sport].label}: ${cs.length} canchas`)}\n\n` +
          table(
            ["ID", "Parque", "Localidad", "Dirección"],
            cs.map((c) => [strong(String(c.id)), c.parkName, c.locality, muted(c.address)]),
            [8, 34, 14, 46],
          ),
    nextSteps: courts[0]
      ? [
          { command: `idrd slot list ${courts[0].id} --date mañana --free`, description: "horas libres de una cancha" },
          { command: `idrd find --sport ${sport} --date mañana --from 6 --to 9`, description: "buscar en todas a la vez" },
        ]
      : [],
  };
}

export async function courtGet(ctx: Ctx) {
  const id = courtId(positional(ctx.args, 0, "id"));
  const sched = await getSchedule(id, bogotaNow().date);
  const park = Number.isFinite(sched.park.id) ? await getPark(sched.park.id).catch(() => null) : null;
  const { id: parkId, ...parkInfo } = sched.park;
  const data = { court: { id, parkId, ...parkInfo }, park, endowment: sched.endowment };
  return {
    data,
    human: (d: typeof data) =>
      [
        bold(`${d.endowment.description || "Cancha"} · ${d.court.name}`),
        `${muted("Dirección")}  ${d.court.address}${d.court.locality ? `, ${d.court.locality}` : ""}`,
        d.park?.hours ? `${muted("Parque")}     ${d.park.hours}` : "",
        `${muted("Superficie")} ${d.endowment.surface || "—"} · ${muted("Luz")} ${d.endowment.lighting || "—"} · ${muted("Estado")} ${d.endowment.status || "—"}`,
        d.park?.email ? `${muted("Contacto")}   ${d.park.email}` : "",
        keyRules(d.endowment.rules).length ? `\n${dim("Para reservar:")}\n${keyRules(d.endowment.rules).map((l) => `  • ${l}`).join("\n")}\n${dim("  Reglas completas: idrd court get " + d.court.id + " --json (endowment.rules)")}` : "",
      ].filter(Boolean).join("\n"),
    nextSteps: [{ command: `idrd slot list ${id} --date mañana`, description: "ver horas" }],
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
    .map((s) => `  ${s.available ? ok("●") : muted("○")} ${hh(s.hour)}–${hh(s.hour + 1)}  ${s.available ? ok("libre") : muted("reservado")}`)
    .join("\n");
}

export async function slotList(ctx: Ctx) {
  const id = courtId(positional(ctx.args, 0, "id"));
  const date = parseDate(str(ctx.args, "date"));
  const sched = await getSchedule(id, date);
  const weekDates = datesIn(sched.entries);
  let slots = hourSlots(sched.entries, date);
  const runs = freeRuns(slots);
  if (ctx.args.free) slots = slots.filter((s) => s.available);
  const outside = weekDates.length > 0 && !weekDates.includes(date);
  const data = { courtId: id, date, weekDates, outsidePublishedWeek: outside, slots, freeRuns: runs };
  const first = runs[0];
  return {
    data,
    human: () =>
      [
        bold(`${sched.endowment.description || `Cancha ${id}`} · ${sched.park.name} · ${date}`),
        outside ? `${info("!")} El portal solo publica la semana ${weekDates[0]} a ${weekDates[weekDates.length - 1]}.` : "",
        renderSlots(slots),
      ].filter(Boolean).join("\n"),
    nextSteps: first
      ? [{ command: `idrd booking create ${id} --date ${date} --hour ${first[0]}${first.length > 1 ? " --hours 2" : ""}`, description: "vista previa de la reserva (no reserva nada)" }]
      : [{ command: `idrd find --date ${date}`, description: "buscar en otras canchas" }],
  };
}

export async function slotFind(ctx: Ctx) {
  const sport = parseSport(str(ctx.args, "sport"));
  const date = parseDate(str(ctx.args, "date") ?? addDays(bogotaNow().date, 1));
  const from = str(ctx.args, "from") ? parseHour(str(ctx.args, "from")) : 0;
  const to = str(ctx.args, "to") ? parseHour(str(ctx.args, "to")) : 24;
  if (to <= from) fail("usage/bad-window", "--to debe ser mayor que --from.");
  const courts = await courtsFor(ctx);
  const concurrency = int(ctx.args, "concurrency", 4)!;

  const results: Array<{ court: Court; freeHours: number[] }> = [];
  const failed: Array<{ courtId: number; error: string }> = [];
  let weekDates: string[] = [];
  const queue = [...courts];
  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(concurrency, 8)) }, async () => {
      for (let c = queue.shift(); c; c = queue.shift()) {
        try {
          const sched = await getSchedule(c.id, date);
          if (!weekDates.length) weekDates = datesIn(sched.entries);
          const free = hourSlots(sched.entries, date).filter((s) => s.available && s.hour >= from && s.hour + 1 <= to).map((s) => s.hour);
          if (free.length) results.push({ court: c, freeHours: free });
        } catch (e) {
          failed.push({ courtId: c.id, error: e instanceof Error ? e.message : String(e) });
        }
      }
    }),
  );
  results.sort((a, b) => (a.freeHours[0] ?? 99) - (b.freeHours[0] ?? 99) || a.court.parkName.localeCompare(b.court.parkName));
  const data = { date, sport, window: { from, to }, weekDates, results, scanned: courts.length, failed };
  const best = results[0];
  return {
    data,
    human: () => {
      const span = from === 0 && to === 24 ? "todo el día" : `${hh(from)}–${hh(to)}`;
      const head = bold(`${SPORTS[sport].label} · ${date} · ${span} · ${courts.length} canchas revisadas`);
      if (!results.length) return `${head}\n\n  Ninguna hora libre en esa franja.${failed.length ? dim(`\n  (${failed.length} canchas no respondieron)`) : ""}`;
      return `${head}\n\n${table(
        ["ID", "Parque", "Localidad", "Libre"],
        results.map((r) => [strong(String(r.court.id)), r.court.parkName, r.court.locality, ok(rangesLabel(r.freeHours))]),
        [8, 30, 14, 48],
      )}${failed.length ? dim(`\n\n${failed.length} canchas no respondieron.`) : ""}`;
    },
    nextSteps: best
      ? [{ command: `idrd booking create ${best.court.id} --date ${date} --hour ${best.freeHours[0]}`, description: "vista previa de la reserva (no reserva nada)" }]
      : [{ command: `idrd find --date ${addDays(date, 1)} --sport ${sport}`, description: "probar otro día" }],
  };
}
