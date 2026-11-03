import { afterAll, describe, expect, test } from "bun:test";
import { checkBookingRules } from "../../src/idrd/rules.ts";
import { setNow } from "../../src/idrd/time.ts";

const WEEK = ["2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08", "2026-11-09"];
setNow(() => new Date("2026-11-03T15:00:00Z")); // Tue 10:00 Bogotá
afterAll(() => setNow(() => new Date()));
const rules = (date: string, startHour: number, hours = 1) => checkBookingRules({ date, startHour, hours, weekDates: WEEK }).map((v) => v.rule);

describe("booking rules", () => {
  test("a valid request has no violations", () => {
    expect(rules("2026-11-05", 16)).toEqual([]);
  });
  test("needs 24 h of advance", () => {
    expect(rules("2026-11-04", 6)).toEqual(["min-advance"]); // 20 h away
    expect(rules("2026-11-04", 10)).toEqual([]); // exactly 24 h
  });
  test("refuses the past", () => {
    expect(rules("2026-11-03", 6)).toEqual(["in-the-past"]);
  });
  test("max 2 continuous hours", () => {
    expect(rules("2026-11-05", 16, 2)).toEqual([]);
    expect(rules("2026-11-05", 16, 3)).toEqual(["max-continuous-hours"]);
  });
  test("only the published week", () => {
    expect(rules("2026-11-12", 16)).toEqual(["current-week-only"]);
  });
  test("monday before 9 am the week is closed", () => {
    setNow(() => new Date("2026-11-09T12:00:00Z")); // Mon 07:00 Bogotá
    expect(checkBookingRules({ date: "2026-11-11", startHour: 16, hours: 1, weekDates: [] }).map((v) => v.rule)).toEqual(["monday-window"]);
    setNow(() => new Date("2026-11-03T15:00:00Z"));
  });
});
