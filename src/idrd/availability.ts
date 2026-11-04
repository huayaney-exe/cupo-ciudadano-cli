/**
 * The schedule endpoint returns overlapping windows for the whole current
 * week: "Espacio Reservable" (can:true) and "Espacio Reservado" (can:false)
 * on top of them. An hour is free only if it sits inside a reservable window
 * and no reserved window overlaps it. Reading `can:true` alone over-reports.
 *
 * Capacity spaces (pools, gyms) add `quota`/`used_quota` per window and the
 * server already flips a full hour to can:false ("Espacio No Disponible"),
 * so the same difference works; the numbers are carried through for display.
 */
export type RawScheduleEntry = {
  title?: string;
  start: string;
  end: string;
  can?: boolean;
  category?: string;
  description?: string;
  quota?: number | string | null;
  used_quota?: number | string | null;
};

export type HourSlot = {
  hour: number;
  start: string;
  end: string;
  available: boolean;
  /** Capacity spaces only: places in the hour and places already taken. */
  quota?: number;
  used?: number;
};

/** A published window as the portal publishes it (grills: 8 AM–4 PM; coliseums: 2 h blocks). */
export type Block = { from: number; to: number; available: boolean; quota?: number; used?: number };

type Window = { from: number; to: number; entry: RawScheduleEntry };

function toWindow(e: RawScheduleEntry): Window | null {
  const [sd, st] = e.start.split("T");
  const [ed, et] = e.end.split("T");
  if (!sd || !st || !ed || !et) return null;
  const from = Number(st.slice(0, 2)) + Number(st.slice(3, 5)) / 60;
  let to = Number(et.slice(0, 2)) + Number(et.slice(3, 5)) / 60;
  if (ed > sd) to = 24; // window running past midnight is clipped to the day
  return to > from ? { from, to, entry: e } : null;
}

function isReservable(e: RawScheduleEntry): boolean {
  if (e.can === true) return true;
  if (e.can === false) return false;
  return /disponible|reservable/i.test(`${e.category ?? ""} ${e.title ?? ""}`);
}

function num(v: unknown): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function datesIn(entries: RawScheduleEntry[]): string[] {
  return [...new Set(entries.map((e) => e.start.slice(0, 10)))].sort();
}

function split(entries: RawScheduleEntry[], date: string): { open: Window[]; taken: Window[] } {
  const day = entries.filter((e) => e.start.startsWith(date));
  const win = (xs: RawScheduleEntry[]) => xs.map(toWindow).filter((w): w is Window => w !== null);
  return { open: win(day.filter(isReservable)), taken: win(day.filter((e) => !isReservable(e))) };
}

export function hourSlots(entries: RawScheduleEntry[], date: string): HourSlot[] {
  const { open, taken } = split(entries, date);
  const hours = new Map<number, HourSlot>();
  for (const w of open) {
    for (let h = Math.ceil(w.from); h + 1 <= w.to; h++) {
      const busy = taken.some((t) => t.from < h + 1 && t.to > h);
      const prev = hours.get(h);
      const slot: HourSlot = {
        hour: h,
        start: `${String(h).padStart(2, "0")}:00`,
        end: `${String(h + 1).padStart(2, "0")}:00`,
        available: (prev?.available ?? false) || !busy,
      };
      const quota = num(w.entry.quota);
      const used = num(w.entry.used_quota);
      if (quota !== undefined) slot.quota = quota;
      if (used !== undefined) slot.used = used;
      hours.set(h, slot);
    }
  }
  // Capacity spaces replace a full hour's reservable window with a can:false one
  // that still carries the numbers; show it as "sin cupo" instead of dropping it.
  for (const t of taken) {
    if (num(t.entry.quota) === undefined) continue;
    for (let h = Math.ceil(t.from); h + 1 <= t.to; h++) {
      if (hours.has(h)) continue;
      hours.set(h, { hour: h, start: `${String(h).padStart(2, "0")}:00`, end: `${String(h + 1).padStart(2, "0")}:00`, available: false, quota: num(t.entry.quota)!, used: num(t.entry.used_quota) ?? num(t.entry.quota)! });
    }
  }
  return [...hours.values()].sort((a, b) => a.hour - b.hour);
}

/** The reservable windows of a day as published, each marked free or not. */
export function blocks(entries: RawScheduleEntry[], date: string): Block[] {
  const { open, taken } = split(entries, date);
  const full = taken
    .filter((t) => num(t.entry.quota) !== undefined && !open.some((o) => o.from === t.from && o.to === t.to))
    .map((t): Block => ({ from: t.from, to: t.to, available: false, quota: num(t.entry.quota)!, used: num(t.entry.used_quota) ?? num(t.entry.quota)! }));
  return open
    .map((w) => {
      const b: Block = { from: w.from, to: w.to, available: !taken.some((t) => t.from < w.to && t.to > w.from) };
      const quota = num(w.entry.quota);
      const used = num(w.entry.used_quota);
      if (quota !== undefined) b.quota = quota;
      if (used !== undefined) b.used = used;
      return b;
    })
    .concat(full)
    .sort((a, b) => a.from - b.from);
}

/** Groups consecutive free hours: [6,7,9] → [[6,7],[9]] */
export function freeRuns(slots: HourSlot[]): number[][] {
  const runs: number[][] = [];
  for (const s of slots.filter((x) => x.available)) {
    const last = runs[runs.length - 1];
    if (last && last[last.length - 1] === s.hour - 1) last.push(s.hour);
    else runs.push([s.hour]);
  }
  return runs;
}
