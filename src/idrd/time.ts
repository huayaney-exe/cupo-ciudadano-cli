import { fail } from "../core/errors.js";

/** Bogotá is UTC-5 all year (no DST). All portal times are local Bogotá. */
export const TZ = "America/Bogota";

export type LocalNow = { date: string; hour: number; minute: number; isoWeekday: number };

let nowImpl = () => new Date();
/** Test seam: freeze the clock. */
export function setNow(f: () => Date): void {
  nowImpl = f;
}

export function bogotaNow(): LocalNow {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(nowImpl()).map((p) => [p.type, p.value]),
  );
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  return { date, hour: Number(parts.hour), minute: Number(parts.minute), isoWeekday: isoWeekday(date) };
}

export function isoWeekday(date: string): number {
  const d = new Date(`${date}T12:00:00Z`).getUTCDay();
  return d === 0 ? 7 : d;
}

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const WEEKDAYS: Record<string, number> = {
  lun: 1, lunes: 1, mon: 1, monday: 1,
  mar: 2, martes: 2, tue: 2, tuesday: 2,
  mie: 3, mié: 3, miercoles: 3, miércoles: 3, wed: 3, wednesday: 3,
  jue: 4, jueves: 4, thu: 4, thursday: 4,
  vie: 5, viernes: 5, fri: 5, friday: 5,
  sab: 6, sáb: 6, sabado: 6, sábado: 6, sat: 6, saturday: 6,
  dom: 7, domingo: 7, sun: 7, sunday: 7,
};

/** Accepts YYYY-MM-DD, hoy/today, mañana/tomorrow, or a weekday (next occurrence, today included). */
export function parseDate(input: string | undefined): string {
  const today = bogotaNow().date;
  if (!input) return today;
  const s = input.trim().toLowerCase();
  if (s === "hoy" || s === "today") return today;
  if (s === "mañana" || s === "manana" || s === "tomorrow") return addDays(today, 1);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(`${s}T12:00:00Z`);
    if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) fail("usage/bad-date", `Fecha inválida: ${input}.`);
    return s;
  }
  const wd = WEEKDAYS[s];
  if (wd) {
    const delta = (wd - isoWeekday(today) + 7) % 7;
    return addDays(today, delta);
  }
  return fail("usage/bad-date", `No entiendo la fecha "${input}".`, "Usa YYYY-MM-DD, hoy, mañana o un día (lun, mar, mie…).");
}

/** "6", "06", "6am", "6:00 AM", "18", "18:00", "6pm" → 0..23 */
export function parseHour(input: string | undefined): number {
  if (input === undefined) return fail("usage/missing-hour", "Falta la hora.", "Ej: --hora 6 o --hora \"6:00 AM\".");
  const s = input.trim().toLowerCase().replace(/\s+/g, "");
  const m = /^(\d{1,2})(?::(\d{2}))?(am|pm|a\.m\.|p\.m\.)?$/.exec(s);
  if (!m) return fail("usage/bad-hour", `Hora inválida: ${input}.`);
  let h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  const mer = m[3]?.replace(/\./g, "");
  if (min !== 0) fail("usage/bad-hour", "Las reservas son por horas en punto.", `Usa ${h}:00.`);
  if (mer === "pm" && h < 12) h += 12;
  if (mer === "am" && h === 12) h = 0;
  if (h < 0 || h > 23 || (mer && Number(m[1]) > 12)) fail("usage/bad-hour", `Hora fuera de rango: ${input}.`);
  return h;
}

/** 6 → "6:00 AM", 13 → "1:00 PM" — the exact id format the portal expects. */
export function hourLabel(h: number): string {
  const mer = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:00 ${mer}`;
}

export function hh(h: number): string {
  return `${String(h).padStart(2, "0")}:00`;
}

function short(h: number): { n: number; m: "AM" | "PM" } {
  const m = h % 24 < 12 ? "AM" : "PM";
  return { n: h % 12 === 0 ? 12 : h % 12, m };
}

/** [16,17,18,19] → "4–8 PM"; [11,12] → "11 AM–1 PM" (end is exclusive). */
export function rangeLabel(run: number[]): string {
  const a = short(run[0]!);
  const b = short(run[run.length - 1]! + 1);
  return a.m === b.m ? `${a.n}–${b.n} ${b.m}` : `${a.n} ${a.m}–${b.n} ${b.m}`;
}

/** Consecutive hours → compact ranges: [6,7,16,17,18] → "6–8 AM, 4–7 PM" */
export function rangesLabel(hours: number[]): string {
  const runs: number[][] = [];
  for (const h of [...hours].sort((x, y) => x - y)) {
    const last = runs[runs.length - 1];
    if (last && last[last.length - 1] === h - 1) last.push(h);
    else runs.push([h]);
  }
  return runs.map(rangeLabel).join(", ");
}
