import { afterAll, describe, expect, test } from "bun:test";
import { addDays, hourLabel, parseDate, parseHour, setNow } from "../../src/idrd/time.ts";

// Tuesday 2026-11-03 10:00 Bogotá
setNow(() => new Date("2026-11-03T15:00:00Z"));
afterAll(() => setNow(() => new Date()));

describe("hours", () => {
  test("labels match the portal's id format", () => {
    expect(hourLabel(6)).toBe("6:00 AM");
    expect(hourLabel(12)).toBe("12:00 PM");
    expect(hourLabel(13)).toBe("1:00 PM");
    expect(hourLabel(0)).toBe("12:00 AM");
  });
  test("parses common spellings", () => {
    for (const [input, want] of [["6", 6], ["06", 6], ["6am", 6], ["6:00 AM", 6], ["18", 18], ["18:00", 18], ["6pm", 18], ["12pm", 12], ["12am", 0]] as const) {
      expect(parseHour(input)).toBe(want);
    }
  });
  test("rejects non-round and out-of-range hours", () => {
    expect(() => parseHour("6:30")).toThrow();
    expect(() => parseHour("25")).toThrow();
    expect(() => parseHour("13pm")).toThrow();
  });
});

describe("dates", () => {
  test("relative words resolve in Bogotá time", () => {
    expect(parseDate("hoy")).toBe("2026-11-03");
    expect(parseDate("mañana")).toBe("2026-11-04");
    expect(parseDate(undefined)).toBe("2026-11-03");
  });
  test("weekday names pick the next occurrence, today included", () => {
    expect(parseDate("mar")).toBe("2026-11-03");
    expect(parseDate("mie")).toBe("2026-11-04");
    expect(parseDate("vie")).toBe("2026-11-06");
    expect(parseDate("lun")).toBe("2026-11-09");
  });
  test("validates ISO dates", () => {
    expect(parseDate("2026-11-05")).toBe("2026-11-05");
    expect(() => parseDate("2026-02-30")).toThrow();
    expect(() => parseDate("ayer")).toThrow();
  });
  test("addDays crosses month boundaries", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
  });
});

test("late evening UTC is still the same Bogotá day", () => {
  setNow(() => new Date("2026-11-04T03:30:00Z")); // 22:30 Bogotá on the 3rd
  expect(parseDate("hoy")).toBe("2026-11-03");
  setNow(() => new Date("2026-11-03T15:00:00Z"));
});

import { rangeLabel, rangesLabel } from "../../src/idrd/time.ts";
test("compact hour ranges for human output", () => {
  expect(rangeLabel([16, 17, 18, 19])).toBe("4–8 PM");
  expect(rangeLabel([11, 12])).toBe("11 AM–1 PM");
  expect(rangeLabel([6])).toBe("6–7 AM");
  expect(rangesLabel([21, 16, 17, 18, 6, 7])).toBe("6–8 AM, 4–7 PM, 9–10 PM");
});
