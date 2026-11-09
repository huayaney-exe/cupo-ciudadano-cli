import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { allFiles, mockCefe, readAudit, run, tempHome } from "./harness.ts";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

let home: ReturnType<typeof tempHome>;
beforeEach(() => { home = tempHome(); });
afterEach(() => home.cleanup());

const PASSWORD = "cefe-Never-On-Disk";
async function loggedIn(sc: Parameters<typeof mockCefe>[0] = {}) {
  const calls = mockCefe(sc);
  const r = await run(["cefe", "auth", "login", "--email", "ana@cefe.co", "--json"], { CEFE_PASSWORD: PASSWORD });
  expect(r.code).toBe(0);
  return calls;
}

describe("cefe auth", () => {
  test("login stores token + user, never the password; status; logout", async () => {
    const calls = await loggedIn();
    expect(calls.find((c) => c.url === "/main/auth/login")!.body).toEqual({ email: "ana@cefe.co", password: PASSWORD });
    for (const f of allFiles(home.dir)) expect(readFileSync(f, "utf8")).not.toContain(PASSWORD);
    const session = allFiles(home.dir).find((f) => f.includes("/cefe/sessions/") && f.endsWith("current.json"))!;
    expect(JSON.parse(readFileSync(session, "utf8"))).toMatchObject({ token: "cefe-tok", user: { userId: "u-1" } });
    const st = await run(["cefe", "auth", "status", "--json"]);
    expect(st.json.data).toMatchObject({ loggedIn: true, user: { name: "Ana Ruiz" } });
    const out = await run(["cefe", "auth", "logout", "--json"]);
    expect(out.json.data.loggedOut).toBe(true);
    expect((await run(["cefe", "me", "--json"])).code).toBe(3);
  });
  test("--save stores the password in ~/.cupo/env and an expired session logs in again by itself", async () => {
    const calls = mockCefe();
    const r = await run(["cefe", "auth", "login", "--email", "ana@cefe.co", "--save", "--json"], { CEFE_PASSWORD: PASSWORD });
    expect(r.code).toBe(0);
    expect(readFileSync(join(home.dir, "env"), "utf8")).toBe(`CEFE_PASSWORD=${PASSWORD}\n`);
    const sessionFile = allFiles(home.dir).find((f) => f.includes("/cefe/sessions/") && f.endsWith("current.json"))!;
    writeFileSync(sessionFile, JSON.stringify({ ...JSON.parse(readFileSync(sessionFile, "utf8")), expiresAt: "2020-01-01T00:00:00.000Z" }));
    const me = await run(["cefe", "me", "--json"], { CEFE_PASSWORD: undefined });
    expect(me.code).toBe(0);
    expect(calls.filter((c) => c.url === "/main/auth/login")).toHaveLength(2);
    const out = await run(["cefe", "auth", "logout", "--forget", "--json"], { CEFE_PASSWORD: undefined });
    expect(out.json.data.passwordForgotten).toBe(true);
    expect((await run(["cefe", "me", "--json"], { CEFE_PASSWORD: undefined })).code).toBe(3);
  });
  test("bad credentials → exit 3; sessions are separate from the IDRD one", async () => {
    mockCefe({ loginStatus: 401 });
    const r = await run(["cefe", "auth", "login", "--email", "ana@cefe.co", "--json"], { CEFE_PASSWORD: "x" });
    expect(r.code).toBe(3);
    expect(r.json.error.code).toBe("auth/invalid-credentials");
    expect(allFiles(home.dir).some((f) => f.includes("/sessions/default/current.json") && !f.includes("/cefe/"))).toBe(false);
  });
  test("register requires explicit habeas-data consent", async () => {
    mockCefe();
    const no = await run(["cefe", "auth", "register", "--name", "Ana", "--email", "ana@cefe.co", "--phone", "300", "--document", "123", "--json"], { CEFE_PASSWORD: PASSWORD });
    expect(no.code).toBe(5);
    expect(no.json.error.code).toBe("approval/consent-required");
    const yes = await run(["cefe", "auth", "register", "--name", "Ana", "--email", "ana@cefe.co", "--phone", "300", "--document", "123", "--accept-habeas-data", "--json"], { CEFE_PASSWORD: PASSWORD });
    expect(yes.code).toBe(0);
  });
});

describe("cefe pools and slots (public)", () => {
  test("pool list hides inactive by default; pool get resolves by name", async () => {
    mockCefe();
    const r = await run(["cefe", "pool", "list", "--json"]);
    expect(r.json.data.map((p: any) => p.poolId)).toEqual(["pool-sem", "pool-occ"]);
    expect((await run(["cefe", "pool", "list", "--all", "--json"])).json.data).toHaveLength(3);
    const g = await run(["cefe", "pool", "get", "semiolimpica", "--json"]);
    expect(g.json.data).toMatchObject({ poolId: "pool-sem", rating: { overallAverage: 4.8 } });
    expect(g.json.data.schedule.weekly.MONDAY.isClosed).toBe(true);
    const amb = await run(["cefe", "pool", "get", "recreativa", "--json"]);
    expect(amb.json.error.code).toBe("usage/ambiguous");
  });
  test("slot list: weekly config wins over default, occupancy subtracts, past hours hidden, override replaces", async () => {
    mockCefe();
    // Thursday 2026-11-05 at the fixed clock (Tue 10:00) → THURSDAY config, occupancy for 06:00 (full) and 07:15 (12/30)
    const r = await run(["cefe", "slot", "list", "pool-sem", "--date", "2026-11-05", "--json"]);
    expect(r.json.data.slots).toEqual([
      { time: "06:00", start: "2026-11-05T06:00:00", end: "2026-11-05T07:00:00", capacity: 30, reserved: 30, free: 0, closed: false, available: false },
      { time: "07:15", start: "2026-11-05T07:15:00", end: "2026-11-05T08:15:00", capacity: 30, reserved: 12, free: 18, closed: false, available: true },
      { time: "09:45", start: "2026-11-05T09:45:00", end: "2026-11-05T10:45:00", capacity: 10, reserved: 0, free: 10, closed: false, available: true },
    ]);
    expect(r.json.data.priceEstimate).toBe(10000);
    expect(r.json.nextSteps[0].command).toBe("cupo cefe booking create pool-sem --date 2026-11-05 --time 07:15");
    const mon = await run(["cefe", "slot", "list", "pool-sem", "--date", "2026-11-09", "--json"]);
    expect(mon.json.data.slots).toEqual([]);
    const today = await run(["cefe", "slot", "list", "pool-sem", "--date", "2026-11-03", "--json"]); // default config, clock 10:00 → all three past
    expect(today.json.data.slots.map((s: any) => s.available)).toEqual([false, false, false]);
    expect(today.json.data.priceEstimate).toBe(0);
    const ov = await run(["cefe", "slot", "list", "pool-sem", "--date", "2026-11-07", "--json"]);
    expect(ov.json.data.slots.map((s: any) => [s.time, s.capacity])).toEqual([["10:00", 5]]);
  });
  test("find scans active pools and honours the window", async () => {
    mockCefe();
    const r = await run(["cefe", "find", "--date", "2026-11-05", "--from", "07:00", "--to", "09:00", "--json"]);
    expect(r.json.command).toBe("cefe slot find");
    expect(r.json.data.scanned).toBe(2);
    expect(r.json.data.results.map((x: any) => [x.pool.poolId, x.slots.map((s: any) => s.time)])).toEqual([[ "pool-occ", ["07:15"]], ["pool-sem", ["07:15"]]]);
  });
});

describe("cefe booking", () => {
  test("preview runs the real checks; live posts the SPA's payload and audits", async () => {
    let posted: any = null;
    const calls = await loggedIn({ onCreate: (b) => { posted = b; } });
    const pre = await run(["cefe", "booking", "create", "semiolimpica", "--date", "2026-11-05", "--time", "07:15", "--dependent", "1", "--json"]);
    expect(pre.code).toBe(0);
    expect(pre.json.data).toMatchObject({ dryRun: true, ready: true, pay: "EFECTIVO", price: 20000 });
    expect(pre.json.data.request.body).toMatchObject({ poolId: "pool-sem", poolName: "Piscina Semiolímpica", userId: "u-1", email: "ana@cefe.co", startTime: "2026-11-05T07:15:00", endTime: "2026-11-05T08:15:00", status: "pending", paymentMethod: "EFECTIVO", price: 20000, dependents: [{ name: "Leo Ruiz", identification: "456" }] });
    expect(pre.json.data.request.body.notes).toContain("Menores: Leo Ruiz");
    expect(posted).toBeNull();
    const full = await run(["cefe", "booking", "create", "pool-sem", "--date", "2026-11-05", "--time", "06:00", "--json"]);
    expect(full.json.data.ready).toBe(false);
    expect(full.json.data.checks.find((c: any) => c.name === "cupos").detail).toBe("llena");
    const unpublished = await run(["cefe", "booking", "create", "pool-sem", "--date", "2026-11-05", "--time", "08:00", "--json"]);
    expect(unpublished.json.data.checks.find((c: any) => c.name === "franja").ok).toBe(false);
    const live = await run(["cefe", "booking", "create", "pool-sem", "--date", "2026-11-05", "--time", "07:15", "--dependent", "1", "--yes", "--json"]);
    expect(live.code).toBe(0);
    expect(posted).toMatchObject({ startTime: "2026-11-05T07:15:00", price: 20000 });
    expect(live.json.data.reservation).toMatchObject({ id: "pool-sem_res-9", status: "pending" });
    expect(calls.find((c) => c.url === "/main/reservations" && c.method === "POST")!.auth).toBe("Bearer cefe-tok");
    const results = readAudit(home.dir).filter((a) => a.kind === "cefe.booking.create").map((a) => a.result);
    expect(results).toEqual(["pending", "dry-run", "pending", "dry-run", "pending", "dry-run", "pending", "ok"]);
  });
  test("one reservation per day and profile gaps block; credits need balance; free before 2026-11-05", async () => {
    await loggedIn({ reservations: [{ poolId: "pool-occ", poolName: "Occ", userId_uuid: "r1", startTime: "2026-11-05T06:00:00", endTime: "2026-11-05T07:00:00", status: "confirmed", price: 0 }], user: { estrato: "" } });
    const pre = await run(["cefe", "booking", "create", "pool-sem", "--date", "2026-11-05", "--time", "07:15", "--pay", "creditos", "--json"]);
    const by = Object.fromEntries(pre.json.data.checks.map((c: any) => [c.name, c.ok]));
    expect(by).toMatchObject({ "una-por-dia": false, perfil: false, creditos: false, cupos: true });
    const live = await run(["cefe", "booking", "create", "pool-sem", "--date", "2026-11-05", "--time", "07:15", "--yes", "--json"]);
    expect(live.code).toBe(2); // una-por-dia is a portal rule → rule/violation
    mockCefe();
    await run(["cefe", "auth", "login", "--email", "ana@cefe.co", "--json"], { CEFE_PASSWORD: PASSWORD });
    const free = await run(["cefe", "booking", "create", "pool-sem", "--date", "2026-11-04", "--time", "06:00", "--json"]);
    expect(free.json.data).toMatchObject({ pay: "FREE", price: 0 });
    expect(free.json.data.request.body).toMatchObject({ status: "confirmed" });
    expect(free.json.data.request.body).not.toHaveProperty("paymentMethod");
  });
  test("list and cancel: 6 h rule, --yes gate, DELETE on the composite id", async () => {
    const calls = await loggedIn({ reservations: [
      { poolId: "pool-sem", poolName: "Semi", userId_uuid: "r1", startTime: "2026-11-06T07:15:00", endTime: "2026-11-06T08:15:00", status: "pending", price: 10000, paymentMethod: "EFECTIVO" },
      { poolId: "pool-sem", poolName: "Semi", userId_uuid: "r2", startTime: "2026-11-03T12:00:00", endTime: "2026-11-03T13:00:00", status: "confirmed", price: 0 },
      { poolId: "pool-sem", poolName: "Semi", userId_uuid: "r3", startTime: "2026-11-01T12:00:00", endTime: "2026-11-01T13:00:00", status: "cancelled", price: 0 },
    ] });
    const l = await run(["cefe", "booking", "list", "--json"]);
    expect(l.json.data.map((r: any) => [r.id, r.cancellable])).toEqual([["pool-sem_r1", true], ["pool-sem_r2", false], ["pool-sem_r3", false]]);
    const up = await run(["cefe", "booking", "list", "--upcoming", "--json"]);
    expect(up.json.data.map((r: any) => r.id)).toEqual(["pool-sem_r1", "pool-sem_r2"]);
    const soon = await run(["cefe", "booking", "cancel", "pool-sem_r2", "--yes", "--json"]);
    expect(soon.code).toBe(2);
    expect(soon.json.error.message).toContain("6 h");
    const noYes = await run(["cefe", "booking", "cancel", "pool-sem_r1", "--json"]);
    expect(noYes.code).toBe(5);
    const okc = await run(["cefe", "booking", "cancel", "pool-sem_r1", "--yes", "--json"]);
    expect(okc.code).toBe(0);
    expect(calls.find((c) => c.method === "DELETE")!.url).toBe("/main/reservations/pool-sem_r1");
  });
});

describe("cefe courses, classes, tournaments, promos", () => {
  test("course list/get (public) and enroll preview with stratum pricing and the SPA gate", async () => {
    mockCefe();
    const l = await run(["cefe", "course", "list", "--available", "--json"]);
    expect(l.json.data.map((c: any) => c.name)).toEqual(["Curso Adultos Nivel 3"]);
    const g = await run(["cefe", "course", "get", "a3d9fade", "--from", "2026-11-05", "--to", "2026-11-05", "--json"]);
    expect(g.json.data.availability.dates[0].classes[0]).toMatchObject({ at: "2026-11-05T06:00:00", free: 7, available: true });
    await loggedIn();
    const pre = await run(["cefe", "course", "enroll", "a3d9fade", "--json"]);
    expect(pre.json.data.request).toMatchObject({ url: "/courses/a3d9fade-64c9-467e-b2d4-17653697ade7/users/u-1/enroll", body: { status: "PENDING", paymentType: "CASH", paymentStatus: "PENDING", coursePrice: 80000 } });
    expect(pre.json.data.checks.find((c: any) => c.name === "portal").ok).toBe(false); // web disabled since 2026-07-30
    expect(pre.json.data.ready).toBe(false);
    const live = await run(["cefe", "course", "enroll", "a3d9fade", "--yes", "--json"]);
    expect(live.code).toBe(5);
    const high = await loggedIn({ user: { estrato: "5" } });
    const p5 = await run(["cefe", "course", "enroll", "a3d9fade", "--pay", "wompi", "--json"]);
    expect(p5.json.data.request.body).toMatchObject({ coursePrice: 85250, paymentType: "WOMPI" });
    expect(high.filter((c) => c.url.endsWith("/enroll"))).toHaveLength(0);
  });
  test("class book preview, cancel, course mine", async () => {
    const calls = await loggedIn({ classBookings: [{ userId_date: "u-1#2026-11-05", courseId: "a3d9fade-64c9-467e-b2d4-17653697ade7", classDateTime: "2026-11-05T06:00:00", status: "CONFIRMED" }] });
    const pre = await run(["cefe", "class", "book", "a3d9fade", "--date", "2026-11-05", "--json"]);
    expect(pre.json.data).toMatchObject({ classDateTime: "2026-11-05T06:00:00", ready: false });
    expect(pre.json.data.checks.find((c: any) => c.name === "cupo").ok).toBe(true);
    const none = await run(["cefe", "class", "book", "a3d9fade", "--date", "2026-11-06", "--json"]);
    expect(none.json.data.checks.find((c: any) => c.name === "clase").ok).toBe(false);
    const mine = await run(["cefe", "course", "mine", "--json"]);
    expect(mine.json.data.classes).toHaveLength(1);
    const cancel = await run(["cefe", "class", "cancel", "a3d9fade", "--date", "2026-11-05", "--yes", "--json"]);
    expect(cancel.code).toBe(0);
    const del = calls.find((c) => c.method === "DELETE" && c.url === "/main/users/u-1/class-bookings")!;
    expect(del.body).toEqual({ courseId: "a3d9fade-64c9-467e-b2d4-17653697ade7", classDateTime: "2026-11-05T06:00:00" });
  });
  test("tournaments need a session; register posts the competition body; promos are public", async () => {
    mockCefe();
    expect((await run(["cefe", "tournament", "list", "--json"])).code).toBe(3);
    const promos = await run(["cefe", "promo", "list", "--json"]);
    expect(promos.json.data.promotions[0].name).toBe("AquaGym");
    const calls = await loggedIn();
    const t = await run(["cefe", "tournament", "get", "t-1", "--json"]);
    expect(t.json.data.competitions[0].competitionId).toBe("c-1");
    const reg = await run(["cefe", "tournament", "register", "t-1", "--competition", "c-1", "--sex", "F", "--yes", "--json"]);
    expect(reg.code).toBe(0);
    expect(calls.find((c) => c.url === "/main/tournaments/t-1/competitions/c-1/register" && c.method === "POST")!.body).toEqual({ sex: "F" });
    expect((await run(["cefe", "tournament", "register", "t-1", "--competition", "c-1", "--json"])).code).toBe(5);
  });
  test("schema lists every cefe command; three-word lookup and aliases work", async () => {
    mockCefe();
    const s = await run(["schema", "--json"]);
    const names = s.json.data.commands.map((c: any) => c.name).filter((n: string) => n.startsWith("cefe "));
    expect(names.length).toBe(24);
    expect((await run(["cefe", "pools", "--json"])).json.command).toBe("cefe pool list");
    expect((await run(["cefe", "courses", "--json"])).json.command).toBe("cefe course list");
    expect((await run(["cefe", "help"])).code).toBe(2);
  });
});
