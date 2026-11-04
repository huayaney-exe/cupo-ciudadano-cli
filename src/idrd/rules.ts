import { bogotaNow, hourLabel } from "./time.js";

/**
 * Booking rules published in the portal's own scenario requirements text.
 * These are pre-checks so the CLI never sends a request the portal would
 * refuse; the server remains the authority.
 */
export const RULES = {
  maxContinuousHours: 2,
  maxHoursPerWeek: 4,
  minAdvanceHours: 24,
  mondayOpenHour: 9,
} as const;

export type RuleViolation = { rule: string; message: string };

export function checkBookingRules(input: {
  date: string;
  startHour: number;
  hours: number;
  weekDates: string[];
  /**
   * Courts carry the 2 h / 24 h prose rules. Other spaces (pools, grills, gyms,
   * coliseums) are booked inside the blocks the portal publishes, so only the
   * calendar-derived rules apply; `maxHours` is the block length when given.
   */
  court?: boolean;
  maxHours?: number;
}): RuleViolation[] {
  const v: RuleViolation[] = [];
  const now = bogotaNow();
  const court = input.court ?? true;

  if (input.hours < 1) v.push({ rule: "min-hours", message: "La reserva debe durar al menos 1 hora." });
  if (court && input.hours > RULES.maxContinuousHours) {
    v.push({ rule: "max-continuous-hours", message: `Máximo ${RULES.maxContinuousHours} horas continuas por día (pediste ${input.hours}).` });
  }
  if (!court && input.maxHours !== undefined && input.hours > input.maxHours) {
    v.push({ rule: "within-block", message: `El bloque publicado dura ${input.maxHours} h (pediste ${input.hours}).` });
  }
  if (input.startHour + input.hours > 24) {
    v.push({ rule: "same-day", message: "La reserva debe terminar el mismo día." });
  }
  if (input.weekDates.length && !input.weekDates.includes(input.date)) {
    v.push({
      rule: "current-week-only",
      message: `Solo se puede reservar dentro de la semana publicada (${input.weekDates[0]} a ${input.weekDates[input.weekDates.length - 1]}).`,
    });
  }
  const startMs = Date.parse(`${input.date}T${String(input.startHour).padStart(2, "0")}:00:00-05:00`);
  const nowMs = Date.parse(`${now.date}T${String(now.hour).padStart(2, "0")}:${String(now.minute).padStart(2, "0")}:00-05:00`);
  const advance = (startMs - nowMs) / 3_600_000;
  if (advance < 0) {
    v.push({ rule: "in-the-past", message: `${input.date} ${hourLabel(input.startHour)} ya pasó.` });
  } else if (court && advance < RULES.minAdvanceHours) {
    v.push({ rule: "min-advance", message: `Se reserva con mínimo ${RULES.minAdvanceHours} h de anticipación (faltan ${advance.toFixed(1)} h).` });
  }
  if (now.isoWeekday === 1 && now.hour < RULES.mondayOpenHour) {
    v.push({ rule: "monday-window", message: "Las reservas de la semana abren los lunes a partir de las 9:00 a.m." });
  }
  return v;
}
