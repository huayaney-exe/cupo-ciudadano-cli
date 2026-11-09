import { nowMs } from "../idrd/time.js";
import type { PoolSlotRecord, Reservation, ScheduleConfig } from "./api.js";

/**
 * Availability the way the SPA's booking screen computes it: the day's slot
 * list comes from the schedule config (override > weekly > default), the
 * occupancy from `pool-slots`, and today's past times are hidden.
 */
export type DaySlot = { time: string; start: string; end: string; capacity: number; reserved: number; free: number; available: boolean; closed: boolean };

const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

export const SLOT_MINUTES = 60;
/** Free practice became paid on this date (SPA constant); 10,000 COP per person per hour. */
export const PAID_FROM = "2026-11-05";
export const PRICE_PER_PERSON = 10_000;

export function weekdayName(date: string): string {
  return DAYS[new Date(`${date}T12:00:00Z`).getUTCDay()]!;
}

export function addMinutes(date: string, time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = (h ?? 0) * 60 + (m ?? 0) + minutes;
  const hh = String(Math.floor(total / 60) % 24).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${date}T${hh}:${mm}:00`;
}

export function daySlots(cfg: ScheduleConfig, date: string, occupancy: PoolSlotRecord[], now: { date: string; hour: number; minute: number }): DaySlot[] {
  const override = cfg.overrides?.find((o) => o.date === date);
  const day = override ?? cfg.weekly?.[weekdayName(date)] ?? cfg.default;
  if (!day || day.isClosed) return [];
  const isToday = date === now.date;
  const nowMin = now.hour * 60 + now.minute;
  return day.slots
    .map((s) => {
      const [h, m] = s.time.split(":").map(Number);
      const start = `${date}T${s.time}:00`;
      const rec = occupancy.find((o) => o.start.slice(0, 16) === start.slice(0, 16));
      const closed = rec?.status === "CLOSED";
      const capacity = rec?.capacity ?? s.capacity;
      const reserved = rec?.reserved ?? 0;
      const free = closed ? 0 : Math.max(0, capacity - reserved);
      const past = isToday && (h ?? 0) * 60 + (m ?? 0) <= nowMin;
      return { time: s.time, start, end: addMinutes(date, s.time, SLOT_MINUTES), capacity, reserved, free, closed, available: !past && !closed && free > 0 };
    })
    .sort((a, b) => a.time.localeCompare(b.time));
}

/** What the SPA would charge; the server does not price the booking itself. */
export function priceEstimate(date: string, people: number): number {
  return date < PAID_FROM ? 0 : PRICE_PER_PERSON * Math.max(1, people);
}

/** Cancellation window used by the SPA: pending/confirmed and more than 6 h before start. */
export const CANCEL_MARGIN_MS = 6 * 3600_000;

export function canCancel(r: Reservation, at = nowMs()): { ok: boolean; reason?: string } {
  if (!(r.status === "confirmed" || r.status === "pending")) return { ok: false, reason: `estado ${r.status || "desconocido"}` };
  const start = Date.parse(`${r.startTime}-05:00`);
  if (!Number.isFinite(start)) return { ok: false, reason: "hora de inicio ilegible" };
  if (start - at <= CANCEL_MARGIN_MS) return { ok: false, reason: "faltan menos de 6 h para la hora reservada" };
  return { ok: true };
}

/** The SPA disables classes, enrolments and promotion purchases after this date. The backend's view is unknown. */
export const SPA_CLASSES_DISABLED_AFTER = "2026-07-29";

export function spaGateClosed(today: string): boolean {
  return today > SPA_CLASSES_DISABLED_AFTER;
}
