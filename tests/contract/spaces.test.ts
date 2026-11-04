import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mockPortal, readAudit, run, tempHome } from "./harness.ts";

let home: ReturnType<typeof tempHome>;
beforeEach(() => { home = tempHome(); });
afterEach(() => home.cleanup());

const PASSWORD = "s3cret-Never-On-Disk";
async function loggedIn(sc: Parameters<typeof mockPortal>[0] = {}) {
  const calls = mockPortal(sc);
  const r = await run(["idrd", "auth", "login", "--email", "a@b.co", "--json"], { IDRD_PASSWORD: PASSWORD });
  expect(r.code).toBe(0);
  return calls;
}
const query = (url: string) => new URL(url, "http://x").searchParams;

describe("pools: per-lane calendars with quotas", () => {
  test("court list --sport pool and court lanes", async () => {
    mockPortal();
    const r = await run(["idrd", "court", "list", "--sport", "piscina", "--json"]);
    expect(r.json.data.map((c: any) => c.id)).toEqual([16893]); // the closed pool (for_booking 0) is hidden
    expect(r.json.data[0].sport).toBe("pool");
    const lanes = await run(["idrd", "court", "lanes", "16893", "--json"]);
    expect(lanes.json.data).toEqual([
      expect.objectContaining({ id: 3, name: "3", level: "MEDIO", direction: "VERTICAL", quota: 12, poolId: 40, enabled: true }),
      expect.objectContaining({ id: 4 }),
    ]);
  });
  test("slot list without --lane fails with the lanes in the hint; with --lane shows places", async () => {
    const calls = mockPortal();
    const bad = await run(["idrd", "slot", "list", "16893", "--date", "2026-11-05", "--json"]);
    expect(bad.code).toBe(2);
    expect(bad.json.error.code).toBe("usage/missing-lane");
    expect(bad.json.error.hint).toContain("3 (3 MEDIO)");
    const r = await run(["idrd", "slot", "list", "16893", "--lane", "3", "--date", "2026-11-05", "--json"]);
    expect(r.code).toBe(0);
    expect(r.json.data.kind).toBe("pool");
    expect(r.json.data.lane).toBe(3);
    expect(r.json.data.slots).toEqual([
      { hour: 7, start: "07:00", end: "08:00", available: true, quota: 12, used: 9 },
      { hour: 8, start: "08:00", end: "09:00", available: false, quota: 12, used: 12 },
    ]);
    expect(query(calls.filter((c) => c.url.startsWith("/api/parks/schedules/16893")).pop()!.url).get("lane")).toBe("3");
    expect(r.json.nextSteps[0].command).toContain("booking create 16893 --date 2026-11-05 --hour 7 --lane 3");
  });
  test("find --sport pool scans every lane of every pool and reports places", async () => {
    const calls = mockPortal();
    const r = await run(["idrd", "find", "--sport", "pool", "--date", "2026-11-05", "--from", "6", "--to", "10", "--json"]);
    expect(r.code).toBe(0);
    expect(r.json.data.spaces).toBe(1);
    expect(r.json.data.scanned).toBe(2);
    const lanes = calls.filter((c) => c.url.startsWith("/api/parks/schedules/16893")).map((c) => query(c.url).get("lane")).sort();
    expect(lanes).toEqual(["3", "4"]);
    expect(r.json.data.results.map((x: any) => [x.lane.id, x.freeHours, x.places])).toEqual([[3, [7], 3], [4, [9], 10]]);
    expect(r.json.nextSteps[0].command).toBe("cupo idrd booking create 16893 --date 2026-11-05 --hour 7 --lane 3");
  });
  test("booking create on a pool carries the lane; beneficiary and adult go in the body", async () => {
    const calls = await loggedIn({ adultBooking: true });
    const pre = await run(["idrd", "booking", "create", "16893", "--lane", "3", "--date", "2026-11-05", "--hour", "7", "--document", "456", "--adult-document-type", "CC", "--adult-document", "123", "--adult-name", "Ana Ruiz", "--json"]);
    expect(pre.code).toBe(0);
    expect(pre.json.data.intent).toBe("16893@2026-11-05T07x1L3");
    expect(pre.json.data.ready).toBe(true);
    expect(pre.json.data.request.body).toMatchObject({ lane: 3, sport_id: null, is_a_responsible_adult_required: true, document_type_responsible_adult: "CC", document_number_responsible_adult: "123", full_name_responsible_adult: "Ana Ruiz" });
    const half = await run(["idrd", "booking", "create", "16893", "--lane", "3", "--date", "2026-11-05", "--hour", "7", "--adult-name", "Ana", "--json"]);
    expect(half.json.error.code).toBe("usage/missing-flag");
    const live = await run(["idrd", "booking", "create", "16893", "--lane", "3", "--date", "2026-11-05", "--hour", "7", "--document", "456", "--adult-document-type", "CC", "--adult-document", "123", "--adult-name", "Ana Ruiz", "--yes", "--confirm", "16893@2026-11-05T07x1L3", "--json"]);
    expect(live.code).toBe(0);
    const post = calls.find((c) => c.url === "/api/parks/schedules/16893/payment")!;
    expect(post.body).toMatchObject({ lane: 3, document: "456", start_hour: "7:00 AM", final_hour: "8:00 AM", is_a_responsible_adult_required: true });
    expect(live.json.data.booking).toMatchObject({ bookingId: "555", lane: 3 });
    expect(readAudit(home.dir).find((a) => a.result === "ok" && a.kind === "booking.create").meta).toMatchObject({ kind: "pool", lane: 3 });
  });
});

describe("grills: whole published block", () => {
  test("slot list shows blocks; booking defaults to the first free block", async () => {
    mockPortal();
    const r = await run(["idrd", "slot", "list", "16848", "--date", "2026-11-06", "--json"]);
    expect(r.json.data.kind).toBe("grill");
    expect(r.json.data.blocks).toEqual([{ from: 8, to: 16, available: false }]);
    const free = await run(["idrd", "slot", "list", "16848", "--date", "2026-11-05", "--json"]);
    expect(free.json.data.blocks).toEqual([{ from: 8, to: 16, available: true }]);
    expect(free.json.nextSteps[0].command).toBe("cupo idrd booking create 16848 --date 2026-11-05 --hour 8 --hours 8");
    await loggedIn();
    const pre = await run(["idrd", "booking", "create", "16848", "--date", "2026-11-05", "--json"]);
    expect(pre.code).toBe(0);
    expect(pre.json.data.intent).toBe("16848@2026-11-05T08x8");
    expect(pre.json.data.request.body).toMatchObject({ start_hour: "8:00 AM", final_hour: "4:00 PM" });
    expect(pre.json.data.checks.find((c: any) => c.name === "reglas")).toMatchObject({ ok: true });
    expect(pre.json.data.ready).toBe(true);
    const taken = await run(["idrd", "booking", "create", "16848", "--date", "2026-11-06", "--json"]);
    expect(taken.json.data.ready).toBe(false);
    expect(taken.json.data.checks.find((c: any) => c.name === "disponibilidad").ok).toBe(false);
  });
});

describe("coliseums: sport id travels with calendar, booking and payment", () => {
  test("court sports, slot list --sport-id, booking requires it", async () => {
    const calls = await loggedIn();
    const sports = await run(["idrd", "court", "sports", "16892", "--json"]);
    expect(sports.json.data).toEqual([{ id: 1, name: "Futsal" }, { id: 3, name: "Baloncesto" }]);
    const r = await run(["idrd", "slot", "list", "16892", "--sport-id", "3", "--date", "2026-11-05", "--json"]);
    expect(r.json.data.kind).toBe("coliseum");
    expect(r.json.data.blocks).toEqual([{ from: 12, to: 14, available: true }, { from: 18, to: 20, available: false }]);
    expect(r.json.data.freeRuns).toEqual([[12, 13]]);
    expect(query(calls.find((c) => c.url.startsWith("/api/parks/schedules/16892"))!.url).get("sport_id")).toBe("3");
    const noSport = await run(["idrd", "booking", "create", "16892", "--date", "2026-11-05", "--hour", "12", "--hours", "2", "--json"]);
    expect(noSport.json.data.ready).toBe(false);
    expect(noSport.json.data.checks.find((c: any) => c.name === "deporte").ok).toBe(false);
    const tooLong = await run(["idrd", "booking", "create", "16892", "--sport-id", "3", "--date", "2026-11-05", "--hour", "12", "--hours", "3", "--json"]);
    expect(tooLong.json.data.checks.find((c: any) => c.name === "reglas").detail).toContain("no cabe en un bloque");
    const pre = await run(["idrd", "booking", "create", "16892", "--sport-id", "3", "--date", "2026-11-05", "--hour", "12", "--hours", "2", "--json"]);
    expect(pre.json.data.ready).toBe(true);
    expect(pre.json.data.intent).toBe("16892@2026-11-05T12x2S3");
    const live = await run(["idrd", "booking", "create", "16892", "--sport-id", "3", "--date", "2026-11-05", "--hour", "12", "--hours", "2", "--yes", "--confirm", "16892@2026-11-05T12x2S3", "--json"]);
    expect(live.code).toBe(0);
    expect(calls.find((c) => c.url === "/api/parks/schedules/16892/payment")!.body).toMatchObject({ sport_id: 3, lane: null, start_hour: "12:00 PM", final_hour: "2:00 PM" });
    expect(calls.find((c) => c.url === "/api/payment-gateway/transferBankFree")!.body).toMatchObject({ sport_id: 3 });
  });
});

describe("gyms: by the hour with quotas, or by membership", () => {
  test("hourly booking preview shows places", async () => {
    await loggedIn();
    const pre = await run(["idrd", "booking", "create", "15227", "--date", "2026-11-05", "--hour", "6", "--json"]);
    expect(pre.json.data.ready).toBe(true);
    expect(pre.json.data.checks.find((c: any) => c.name === "disponibilidad").detail).toContain("4 cupos");
    const full = await run(["idrd", "booking", "create", "15227", "--date", "2026-11-05", "--hour", "7", "--json"]);
    expect(full.json.data.checks.find((c: any) => c.name === "disponibilidad").detail).toContain("sin cupo");
  });
  test("membership reads need a session; buy is preview-first and pays without a reservation", async () => {
    mockPortal();
    const anon = await run(["idrd", "gym", "quote", "15227", "--json"]);
    expect(anon.code).toBe(3);
    const calls = await loggedIn();
    const q = await run(["idrd", "gym", "quote", "15227", "--json"]);
    expect(q.json.data).toMatchObject({ amount: 60000, validFrom: "2026-11-03", validTo: "2026-12-03" });
    const st = await run(["idrd", "gym", "status", "15227", "--json"]);
    expect(st.json.data.active).toBe(false);
    const av = await run(["idrd", "gym", "availability", "15227", "--json"]);
    expect(av.json.data.days[0].slots).toHaveLength(2);
    const pre = await run(["idrd", "gym", "buy", "15227", "--json"]);
    expect(pre.json.data.ready).toBe(false); // no bank
    expect(pre.json.data.intent).toBe("gym15227@membership");
    const ready = await run(["idrd", "gym", "buy", "15227", "--bank", "1007", "--json"]);
    expect(ready.json.data.ready).toBe(true);
    expect(calls.filter((c) => c.url.endsWith("/purchase"))).toHaveLength(0);
    const wrong = await run(["idrd", "gym", "buy", "15227", "--bank", "1007", "--yes", "--confirm", "nope", "--json"]);
    expect(wrong.code).toBe(5);
    const live = await run(["idrd", "gym", "buy", "15227", "--bank", "1007", "--yes", "--confirm", "gym15227@membership", "--json"]);
    expect(live.code).toBe(0);
    expect(live.json.data).toMatchObject({ membershipId: "77", amount: 60000, payment: { bankUrl: "https://pse.example/pay?ref=PAY-1", paymentCode: "PAY-1" } });
    const init = calls.find((c) => c.url.endsWith("/gym-membership/purchase"))!;
    expect(init.body).toEqual({ init: true });
    const pay = calls.find((c) => c.url === "/api/payment-gateway/transferBank")!;
    expect(pay.body).toMatchObject({ membership_id: "77", totalPay: 60000, BankTypeSelected: "1007", concept: "MENSUALIDAD GIMNASIO #15227", parkSelected: 8585, serviceParkSelected: 51, name: "Ana", document: "123" });
    expect(pay.body).not.toHaveProperty("reservationId");
    expect(live.json.nextSteps.map((s: any) => s.command)).toContain("cupo idrd gym activate 15227 --code PAY-1");
    const act = await run(["idrd", "gym", "activate", "15227", "--code", "PAY-1", "--yes", "--json"]);
    expect(act.code).toBe(0);
    expect(calls.filter((c) => c.url.endsWith("/gym-membership/purchase")).pop()!.body).toEqual({ payment_code: "PAY-1" });
    expect(readAudit(home.dir).filter((a) => a.kind.startsWith("gym.membership")).map((a) => a.result)).toEqual(["pending", "dry-run", "pending", "dry-run", "pending", "ok", "pending", "ok"]);
  });
  test("buy refuses when a membership is already active", async () => {
    await loggedIn({ membershipActive: true });
    const pre = await run(["idrd", "gym", "buy", "15227", "--bank", "1007", "--json"]);
    expect(pre.json.data.checks.find((c: any) => c.name === "mensualidad").ok).toBe(false);
    const live = await run(["idrd", "gym", "buy", "15227", "--bank", "1007", "--yes", "--confirm", "gym15227@membership", "--json"]);
    expect(live.code).toBe(5);
  });
});

describe("activities: read all pages, filter, enrol", () => {
  test("list, filters and get", async () => {
    const calls = mockPortal({ courtPageCap: 2 });
    const all = await run(["idrd", "activity", "list", "--json"]);
    expect(all.json.data).toHaveLength(3);
    expect(calls.filter((c) => c.url.startsWith("/api/citizen-portal/public-schedules?"))).toHaveLength(2); // two pages
    expect(all.json.data.find((a: any) => a.id === 11338)).toMatchObject({ left: 1, paid: false, open: true, stage: "VALLES DE CAFAM" });
    const free = await run(["idrd", "activity", "list", "--free", "--available", "--age", "9", "--json"]);
    expect(free.json.data.map((a: any) => a.id)).toEqual([11338, 12002]);
    const text = await run(["idrd", "activity", "list", "--text", "natacion", "--json"]);
    expect(text.json.data.map((a: any) => a.id)).toEqual([12001]);
    const prog = await run(["idrd", "activity", "list", "--program", "43", "--json"]);
    expect(prog.json.data.map((a: any) => a.id).sort()).toEqual([12001, 12002]);
    expect(query(calls.find((c) => c.url.includes("program_id"))!.url).get("program_id[0]")).toBe("43");
    const stage = await run(["idrd", "activity", "list", "--stage", "3", "--json"]);
    expect(stage.json.data.map((a: any) => a.id)).toEqual([12001]);
    const one = await run(["idrd", "activity", "get", "12001", "--json"]);
    expect(one.json.data).toMatchObject({ name: "NATACIÓN INICIACIÓN", rateValue: 25000, left: 0 });
    const missing = await run(["idrd", "activity", "get", "99", "--json"]);
    expect(missing.code).toBe(4);
    const stages = await run(["idrd", "activity", "stages", "--json"]);
    expect(stages.json.data[1]).toMatchObject({ id: 3, name: "CEFE SAN CRISTOBAL", parkName: "SAN CRISTOBAL" });
    const programs = await run(["idrd", "activity", "programs", "--json"]);
    expect(programs.json.data).toHaveLength(2);
    const cats = await run(["idrd", "activity", "categories", "--json"]);
    expect(cats.json.data[0].value).toBe("ATLETISMO");
  });
  test("subscribe: checks, preview, live POST with consent, unsubscribe", async () => {
    let subscribed = 0;
    const calls = await loggedIn({ onSubscribe: () => { subscribed++; } });
    const profiles = await run(["idrd", "profile", "list", "--json"]);
    expect(profiles.json.data.profiles.map((p: any) => p.id)).toEqual([900, 901]);
    const adult = await run(["idrd", "activity", "subscribe", "11338", "--person", "900", "--json"]);
    expect(adult.json.data.ready).toBe(false);
    expect(adult.json.data.checks.find((c: any) => c.name === "edad").ok).toBe(false);
    const full = await run(["idrd", "activity", "subscribe", "12001", "--person", "901", "--json"]);
    expect(full.json.data.checks.find((c: any) => c.name === "cupos").ok).toBe(false);
    const pre = await run(["idrd", "activity", "subscribe", "11338", "--person", "901", "--json"]);
    expect(pre.json.data.ready).toBe(true);
    expect(pre.json.data.intent).toBe("activity11338@profile901");
    expect(pre.json.data.request).toEqual({ method: "POST", path: "/api/profiles/901/schedules/11338", body: { profile_id: 901, terms: true, consent: [5] } });
    expect(subscribed).toBe(0);
    const live = await run(["idrd", "activity", "subscribe", "11338", "--person", "901", "--yes", "--confirm", "activity11338@profile901", "--json"]);
    expect(live.code).toBe(0);
    expect(subscribed).toBe(1);
    expect(live.json.data).toMatchObject({ subscriptionId: 5150, message: "Preinscripción registrada" });
    expect(calls.find((c) => c.url === "/api/profiles/901/schedules/11338")!.body).toEqual({ profile_id: 901, terms: true, consent: [5] });
    const again = await run(["idrd", "activity", "subscribe", "11338", "--person", "901", "--json"]);
    expect(again.json.data.ready).toBe(true); // mock does not persist; the real portal would list it under activity mine
    const un = await run(["idrd", "activity", "unsubscribe", "5150", "--yes", "--json"]);
    expect(un.code).toBe(0);
    expect(calls.find((c) => c.url === "/api/profiles/subscriptions/5150")!.method).toBe("DELETE");
    const noYes = await run(["idrd", "activity", "unsubscribe", "5150", "--json"]);
    expect(noYes.code).toBe(5);
  });
  test("already subscribed profile is refused", async () => {
    await loggedIn({ subscriptions: [{ id: 5150, schedule_id: 11338, profile_id: 901 }] });
    const pre = await run(["idrd", "activity", "subscribe", "11338", "--person", "901", "--json"]);
    expect(pre.json.data.checks.find((c: any) => c.name === "repetida").ok).toBe(false);
    const mine = await run(["idrd", "activity", "mine", "--json"]);
    expect(mine.json.data).toHaveLength(1);
  });
});

describe("account: payments", () => {
  test("pay pending and pay history need a session and read every page", async () => {
    mockPortal();
    expect((await run(["idrd", "pay", "pending", "--json"])).code).toBe(3);
    await loggedIn({ pending: [{ id: 1, amount: 12000 }], payments: Array.from({ length: 23 }, (_, i) => ({ id: i })) });
    const p = await run(["idrd", "pay", "pending", "--json"]);
    expect(p.json.data).toEqual([{ id: 1, amount: 12000 }]);
    const h = await run(["idrd", "pay", "history", "--json"]);
    expect(h.json.data).toHaveLength(23);
  });
});

describe("surface", () => {
  test("schema lists every wired command and the space alias works", async () => {
    mockPortal();
    const s = await run(["schema", "--json"]);
    const names = s.json.data.commands.map((c: any) => c.name);
    for (const n of ["idrd court lanes", "idrd court sports", "idrd gym buy", "idrd gym activate", "idrd activity list", "idrd activity subscribe", "idrd activity unsubscribe", "idrd profile list", "idrd pay pending", "idrd pay history"]) expect(names).toContain(n);
    const alias = await run(["idrd", "space", "list", "--sport", "grill", "--json"]);
    expect(alias.json.command).toBe("idrd court list");
    expect(alias.json.data[0].id).toBe(16848);
  });
});
