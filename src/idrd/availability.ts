/**
 * The schedule endpoint returns overlapping windows for the whole current
 * week: "Espacio Reservable" (can:true) and "Espacio Reservado" (can:false)
 * on top of them. An hour is free only if it sits inside a reservable window
 * and no reserved window overlaps it. Reading `can:true` alone over-reports.
 */
export type RawScheduleEntry = {
  title?: string;
  start: string;
  end: string;
  can?: boolean;
  category?: string;
  description?: string;
};

export type HourSlot = {
  hour: number;
  start: string;
  end: string;
  available: boolean;
};

type Window = { from: number; to: number };

function toWindow(e: RawScheduleEntry): Window | null {
  const [sd, st] = e.start.split("T");
  const [ed, et] = e.end.split("T");
  if (!sd || !st || !ed || !et) return null;
  const from = Number(st.slice(0, 2)) + Number(st.slice(3, 5)) / 60;
  let to = Number(et.slice(0, 2)) + Number(et.slice(3, 5)) / 60;
  if (ed > sd) to = 24; // window running past midnight is clipped to the day
  return to > from ? { from, to } : null;
}

function isReservable(e: RawScheduleEntry): boolean {
  if (e.can === true) return true;
  if (e.can === false) return false;
  return /disponible|reservable/i.test(`${e.category ?? ""} ${e.title ?? ""}`);
}

export function datesIn(entries: RawScheduleEntry[]): string[] {
  return [...new Set(entries.map((e) => e.start.slice(0, 10)))].sort();
}

export function hourSlots(entries: RawScheduleEntry[], date: string): HourSlot[] {
  const day = entries.filter((e) => e.start.startsWith(date));
  const open = day.filter(isReservable).map(toWindow).filter((w): w is Window => w !== null);
  const taken = day.filter((e) => !isReservable(e)).map(toWindow).filter((w): w is Window => w !== null);
  const hours = new Map<number, boolean>();
  for (const w of open) {
    for (let h = Math.ceil(w.from); h + 1 <= w.to; h++) {
      const busy = taken.some((t) => t.from < h + 1 && t.to > h);
      hours.set(h, (hours.get(h) ?? false) || !busy);
    }
  }
  return [...hours.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([hour, available]) => ({
      hour,
      start: `${String(hour).padStart(2, "0")}:00`,
      end: `${String(hour + 1).padStart(2, "0")}:00`,
      available,
    }));
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
