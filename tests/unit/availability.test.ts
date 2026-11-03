import { describe, expect, test } from "bun:test";
import { datesIn, freeRuns, hourSlots, type RawScheduleEntry } from "../../src/idrd/availability.ts";

// Shape and values observed live for court 11537 on 2026-11-04.
const LIVE_11537: RawScheduleEntry[] = [
  { title: "Espacio Reservable", can: true, category: "Disponible", start: "2026-11-04T06:00:00", end: "2026-11-04T08:00:00" },
  { title: "Espacio Reservable", can: true, category: "Disponible", start: "2026-11-04T16:00:00", end: "2026-11-04T19:00:00" },
  { title: "Espacio Reservable", can: true, category: "Disponible", start: "2026-11-04T20:00:00", end: "2026-11-04T22:00:00" },
  { title: "Espacio Reservado", can: false, category: "Reservado", start: "2026-11-04T06:00:00", end: "2026-11-04T08:00:00" },
  { title: "Espacio Reservable", can: true, category: "Disponible", start: "2026-11-05T06:00:00", end: "2026-11-05T09:00:00" },
];

describe("hourSlots", () => {
  test("a reservable window fully covered by a reservation is not free", () => {
    const s = hourSlots(LIVE_11537, "2026-11-04");
    expect(s.find((x) => x.hour === 6)?.available).toBe(false);
    expect(s.find((x) => x.hour === 7)?.available).toBe(false);
  });
  test("uncovered reservable hours are free", () => {
    const free = hourSlots(LIVE_11537, "2026-11-04").filter((x) => x.available).map((x) => x.hour);
    expect(free).toEqual([16, 17, 18, 20, 21]);
  });
  test("partial overlap books only the overlapped hours", () => {
    const entries: RawScheduleEntry[] = [
      { can: true, start: "2026-11-05T06:00:00", end: "2026-11-05T09:00:00" },
      { can: false, start: "2026-11-05T07:00:00", end: "2026-11-05T08:00:00" },
    ];
    expect(hourSlots(entries, "2026-11-05").map((x) => [x.hour, x.available])).toEqual([[6, true], [7, false], [8, true]]);
  });
  test("other days do not leak into the requested date", () => {
    expect(hourSlots(LIVE_11537, "2026-11-05").map((x) => x.hour)).toEqual([6, 7, 8]);
    expect(hourSlots(LIVE_11537, "2026-11-10")).toEqual([]);
  });
  test("falls back to category text when `can` is missing", () => {
    const entries: RawScheduleEntry[] = [
      { category: "Disponible", start: "2026-11-05T10:00:00", end: "2026-11-05T11:00:00" },
      { category: "Reservado", start: "2026-11-05T10:00:00", end: "2026-11-05T11:00:00" },
    ];
    expect(hourSlots(entries, "2026-11-05")).toEqual([{ hour: 10, start: "10:00", end: "11:00", available: false }]);
  });
});

test("datesIn lists the published week", () => {
  expect(datesIn(LIVE_11537)).toEqual(["2026-11-04", "2026-11-05"]);
});

test("freeRuns groups consecutive hours", () => {
  expect(freeRuns(hourSlots(LIVE_11537, "2026-11-04"))).toEqual([[16, 17, 18], [20, 21]]);
});
