import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mockPortal, run, tempHome } from "./harness.ts";
import { compareVersions, updateNotice } from "../../src/core/update.ts";

let home: ReturnType<typeof tempHome>;
beforeEach(() => { home = tempHome(); });
afterEach(() => home.cleanup());

describe("help and typos", () => {
  test("`cupo idrd` and `cupo idrd --help` list only that provider's commands", async () => {
    for (const argv of [["idrd"], ["idrd", "--help"], ["cefe"]]) {
      const r = await run([...argv, "--json"]);
      expect(r.code).toBe(0);
      const names: string[] = r.json.data.commands.map((c: any) => c.name);
      expect(names.length).toBeGreaterThan(5);
      expect(names.every((n) => n.startsWith(`${argv[0]} `))).toBe(true);
    }
    const human = await run(["idrd", "--help"], { NO_JSON: "1" });
    expect(human.stdout).toContain("idrd booking create");
    expect(human.stdout).not.toContain("cefe pool list");
  });
  test("a typo gets the closest commands, not the whole catalogue", async () => {
    const r = await run(["fnd", "--json"]);
    expect(r.code).toBe(2);
    expect(r.json.error.hint).toContain("cupo find");
    expect(r.json.error.hint.length).toBeLessThan(200);
    const two = await run(["idrd", "bookings", "--json"]);
    expect(two.json.error.hint).toContain("cupo idrd booking list");
  });
});

describe("readable account lists", () => {
  test("booking list renders a table and marks local bookings as pagada / vencida / pendiente", async () => {
    mockPortal({ bookings: [{ id: 875972, date: "2026-11-08", start_hour: "17:00:00", final_hour: "18:00:00", name: "CANCHA DE TENNIS NO. 2", park: "CERROS", total: 22800, total_format: "$ 22,800.00 ", status_bank: "OK" }] });
    await run(["idrd", "auth", "login", "--email", "a@b.co", "--json"], { IDRD_PASSWORD: "x" });
    const { writeFileSync, mkdirSync } = await import("node:fs");
    const { join } = await import("node:path");
    const dir = join(home.dir, "bookings", "default");
    mkdirSync(dir, { recursive: true });
    const base = { courtId: 3032, startHour: "5:00 PM", finalHour: "6:00 PM", amount: 22800, free: false, concept: "x", parkId: 309, serviceId: 4, createdAt: "2026-11-01T00:00:00Z", lane: null, sportId: null, raw: {} };
    writeFileSync(join(dir, "875972.json"), JSON.stringify({ ...base, bookingId: "875972", date: "2026-11-08", holdUntil: "2026-11-01 10:00:00" }));
    writeFileSync(join(dir, "880847.json"), JSON.stringify({ ...base, bookingId: "880847", date: "2026-11-15", holdUntil: "2026-11-01 10:21:07" }));
    writeFileSync(join(dir, "999.json"), JSON.stringify({ ...base, bookingId: "999", date: "2026-11-04", holdUntil: "2026-11-03 10:30:00" }));
    const j = await run(["idrd", "booking", "list", "--json"]);
    expect(j.json.data.local.map((b: any) => [b.bookingId, b.status])).toEqual([["875972", "pagada"], ["880847", "vencida"], ["999", "pendiente"]]);
    const h = await run(["idrd", "booking", "list"], { NO_JSON: "1" });
    expect(h.stdout).not.toContain("{\"id\"");
    expect(h.stdout).toContain("Reserva");
    expect(h.stdout).toContain("pagado");
    expect(h.stdout).toContain("pay pse 999");
  });
  test("pay history renders a table with the status per payment", async () => {
    mockPortal({ payments: [{ payment_at: "2026-11-06 21:43:16", concept: "RESERVA CANCHA TENIS #3032", total_format: "$ 22,800.00 COP", status: "APROBADO", booking_id: "875972", payment_code: "e4334d5c" }, { created_at: "2026-11-09 10:08:20", concept: "RESERVA CANCHA TENIS #3032", total_format: "$ 45,600.00 COP", status: "FALLIDO", booking_id: "880847", payment_code: "64d1e7cc" }] });
    await run(["idrd", "auth", "login", "--email", "a@b.co", "--json"], { IDRD_PASSWORD: "x" });
    const h = await run(["idrd", "pay", "history"], { NO_JSON: "1" });
    expect(h.stdout).not.toContain("{\"");
    expect(h.stdout).toContain("APROBADO");
    expect(h.stdout).toContain("FALLIDO");
    expect(h.stderr).toContain("pay status e4334d5c");
  });
});

describe("first run", () => {
  test("the first human command shows the welcome once and leaves a marker", async () => {
    mockPortal();
    const first = await run(["providers"], { NO_JSON: "1", CUPO_NO_BANNER: undefined });
    expect(first.code).toBe(0);
    expect(first.stderr).toContain("Para empezar");
    const { existsSync } = await import("node:fs");
    const { join } = await import("node:path");
    expect(existsSync(join(home.dir, "welcomed"))).toBe(true);
    const second = await run(["providers"], { NO_JSON: "1", CUPO_NO_BANNER: undefined });
    expect(second.stderr).not.toContain("Para empezar");
    // Agents never see it: JSON mode keeps stdout to one object and stderr empty.
    home.cleanup(); home = tempHome(); mockPortal();
    const agent = await run(["providers", "--json"], { CUPO_NO_BANNER: undefined });
    expect(agent.stderr).toBe("");
    expect(agent.stdout.trim().split("\n")).toHaveLength(1);
  });
});

describe("update notice", () => {
  test("semver compare and the one-line notice", () => {
    expect(compareVersions("0.4.0", "0.3.0")).toBeGreaterThan(0);
    expect(compareVersions("0.4.0", "0.4.0")).toBe(0);
    expect(compareVersions("0.4.0", "0.10.0")).toBeLessThan(0);
    const cache = { checkedAt: new Date().toISOString(), current: "0.4.0", latest: "0.5.0" };
    expect(updateNotice("0.4.0", cache, "/repo")).toBe("↑ cupo 0.5.0 disponible (tienes 0.4.0). Actualiza: git -C /repo pull");
    expect(updateNotice("0.5.0", cache, "/repo")).toBeNull();
    expect(updateNotice("0.4.0", { ...cache, latest: null }, "/repo")).toBeNull();
    expect(updateNotice("0.4.0", null, "/repo")).toBeNull();
  });
});
