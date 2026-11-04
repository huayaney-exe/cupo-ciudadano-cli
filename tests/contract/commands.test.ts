import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { readFileSync, statSync } from "node:fs";
import { allFiles, mockPortal, readAudit, run, tempHome } from "./harness.ts";

let home: ReturnType<typeof tempHome>;
beforeEach(() => { home = tempHome(); });
afterEach(() => home.cleanup());

const PASSWORD = "s3cret-Never-On-Disk";
async function loggedIn() {
  mockPortal();
  const r = await run(["idrd", "auth", "login", "--email", "a@b.co", "--json"], { IDRD_PASSWORD: PASSWORD });
  expect(r.code).toBe(0);
}
const isEnvelope = (j: any, command: string) => {
  expect(j).toMatchObject({ ok: true, schemaVersion: 1, command });
  expect(Array.isArray(j.nextSteps)).toBe(true);
};

describe("read commands (no auth)", () => {
  test("court list: only bookable by default, text repaired", async () => {
    mockPortal();
    const r = await run(["idrd", "court", "list", "--json"]);
    expect(r.code).toBe(0);
    isEnvelope(r.json, "idrd court list");
    expect(r.json.data).toHaveLength(1);
    expect(r.json.data[0]).toMatchObject({ id: 11537, sport: "tennis", bookable: true, description: "CANCHA DE TENNIS N° 1" });
    const all = await run(["idrd", "court", "list", "--all", "--json"]);
    expect(all.json.data).toHaveLength(2);
  });
  test("court list reads every page, not just the first 10", async () => {
    // 37 courts; the mock caps pages at 10 rows even when asked for more, like a server that ignores per_page.
    const courts = Array.from({ length: 37 }, (_, i) => ({
      park_endowment_id: 20000 + i, id: 20000 + i, park_id: 1, park_name: `PARQUE ${i}`, park_code: `01-${i}`,
      park_address: "CL 1", locality: i === 36 ? "CHAPINERO" : "SUBA", upz: "X", endowment_description: "CANCHA", for_booking: 1,
    }));
    const calls = mockPortal({ courts, courtPageCap: 10 });
    const r = await run(["idrd", "court", "list", "--json"]);
    expect(r.code).toBe(0);
    expect(r.json.data).toHaveLength(37);
    expect(calls.filter((c) => c.url.startsWith("/api/parks/tennis-courts")).map((c) => new URL(c.url, "http://x").searchParams.get("page"))).toEqual(["1", "2", "3", "4"]);
    const last = await run(["idrd", "court", "list", "--locality", "chapinero", "--json"]);
    expect(last.json.data.map((c: any) => c.id)).toEqual([20036]);
  });
  test("court list fetches a single large page when the server honours per_page", async () => {
    const courts = Array.from({ length: 88 }, (_, i) => ({ park_endowment_id: 30000 + i, id: 30000 + i, park_id: 1, park_name: `P${i}`, park_code: "x", park_address: "y", locality: "L", upz: "U", endowment_description: "C", for_booking: 1 }));
    const calls = mockPortal({ courts });
    const r = await run(["idrd", "court", "list", "--json"]);
    expect(r.json.data).toHaveLength(88);
    expect(calls.filter((c) => c.url.startsWith("/api/parks/tennis-courts"))).toHaveLength(1);
  });
  test("slot list subtracts reservations", async () => {
    mockPortal();
    const r = await run(["idrd", "slot", "list", "11537", "--date", "2026-11-05", "--json"]);
    isEnvelope(r.json, "idrd slot list");
    expect(r.json.data.slots.map((s: any) => [s.hour, s.available])).toEqual([[6, false], [7, true], [16, true], [17, true], [18, true]]);
    expect(r.json.data.freeRuns).toEqual([[7], [16, 17, 18]]);
    expect(r.json.nextSteps[0].command).toContain("booking create 11537 --date 2026-11-05 --hour 7");
  });
  test("find scans courts and honours the window", async () => {
    mockPortal();
    const r = await run(["idrd", "find", "--date", "2026-11-05", "--from", "6", "--to", "9", "--json"]);
    isEnvelope(r.json, "idrd slot find");
    expect(r.json.data.results).toHaveLength(1);
    expect(r.json.data.results[0].freeHours).toEqual([7]);
  });
  test("court get merges schedule details and park info", async () => {
    mockPortal();
    const r = await run(["idrd", "court", "get", "11537", "--json"]);
    expect(r.json.data.endowment).toMatchObject({ kind: "TENNIS", surface: "ASFALTO" });
    expect(r.json.data.park.hours).toContain("6 AM");
  });
  test("pay banks hides the placeholder entry", async () => {
    mockPortal();
    const r = await run(["idrd", "pay", "banks", "--json"]);
    expect(r.json.data).toEqual([{ code: "1007", name: "BANCOLOMBIA" }]);
  });
});

describe("auth", () => {
  test("login stores the token 0600 and never the password", async () => {
    await loggedIn();
    const files = allFiles(home.dir);
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) expect(readFileSync(f, "utf8")).not.toContain(PASSWORD);
    const session = files.find((f) => f.endsWith("current.json"))!;
    expect(statSync(session).mode & 0o777).toBe(0o600);
    expect(readFileSync(files.find((f) => f.endsWith("config.json"))!, "utf8")).toContain("a@b.co");
  });
  test("login without TTY and without IDRD_PASSWORD fails fast instead of prompting", async () => {
    mockPortal();
    const r = await run(["idrd", "auth", "login", "--email", "a@b.co", "--json", "--no-input"], { IDRD_PASSWORD: undefined });
    expect(r.code).toBe(3);
    expect(r.json.error.code).toBe("auth/password-required");
  });
  test("bad credentials map to auth exit code", async () => {
    mockPortal({ loginStatus: 401 });
    const r = await run(["idrd", "auth", "login", "--email", "a@b.co", "--json"], { IDRD_PASSWORD: "x" });
    expect(r.code).toBe(3);
    expect(r.json.error.code).toBe("auth/invalid-credentials");
  });
  test("status makes a live call", async () => {
    await loggedIn();
    const calls = mockPortal();
    const r = await run(["idrd", "auth", "status", "--json"]);
    expect(r.json.data).toMatchObject({ loggedIn: true, email: "a@b.co", refreshable: true });
    expect(calls.some((c) => c.url === "/api/user" && c.auth === "Bearer tok-abc")).toBe(true);
  });
  test("authed commands without a session exit 3", async () => {
    mockPortal();
    const r = await run(["idrd", "booking", "list", "--json"]);
    expect(r.code).toBe(3);
  });
});

describe("web client discovery", () => {
  test("discovers the portal's web client from its frontend, caches it 0600, reuses the cache", async () => {
    const calls = mockPortal();
    const r1 = await run(["idrd", "auth", "login", "--email", "a@b.co", "--json"], { IDRD_PASSWORD: PASSWORD });
    expect(r1.code).toBe(0);
    expect(calls.filter((c) => c.url.startsWith("/js/chunk-common")).length).toBe(1);
    expect(calls.some((c) => c.url.includes("chunk-vendors"))).toBe(false);
    expect(calls.find((c) => c.url === "/oauth/token")!.body).toMatchObject({ client_id: "2", client_secret: "web-secret-1", grant_type: "password" });
    const cache = allFiles(home.dir).find((f) => f.endsWith("web-client.json"))!;
    expect(statSync(cache).mode & 0o777).toBe(0o600);
    const calls2 = mockPortal();
    await run(["idrd", "auth", "login", "--email", "a@b.co", "--json"], { IDRD_PASSWORD: PASSWORD });
    expect(calls2.some((c) => c.url === "/" || c.url.startsWith("/js/"))).toBe(false);
  });
  test("IDRD_CLIENT_ID/SECRET override discovery", async () => {
    const calls = mockPortal({ acceptSecret: "from-env" });
    const r = await run(["idrd", "auth", "login", "--email", "a@b.co", "--json"], { IDRD_PASSWORD: PASSWORD, IDRD_CLIENT_ID: "2", IDRD_CLIENT_SECRET: "from-env" });
    expect(r.code).toBe(0);
    expect(calls.some((c) => c.url === "/")).toBe(false);
  });
  test("a rotated client (invalid_client) is re-discovered once, then login succeeds", async () => {
    mockPortal({ webSecret: "old-secret" });
    await run(["idrd", "auth", "login", "--email", "a@b.co", "--json"], { IDRD_PASSWORD: PASSWORD });
    const calls = mockPortal({ webSecret: "new-secret" }); // cache still holds old-secret
    const r = await run(["idrd", "auth", "login", "--email", "a@b.co", "--json"], { IDRD_PASSWORD: PASSWORD });
    expect(r.code).toBe(0);
    expect(calls.filter((c) => c.url === "/oauth/token").map((c) => (c.body as any).client_secret)).toEqual(["old-secret", "new-secret"]);
  });
});

describe("booking create safety", () => {
  const BASE = ["idrd", "booking", "create", "11537", "--date", "2026-11-05", "--hour", "16", "--json"];
  const INTENT = "11537@2026-11-05T16x1";

  test("without --yes it is a preview and never POSTs", async () => {
    await loggedIn();
    const calls = mockPortal();
    const r = await run(BASE);
    expect(r.code).toBe(0);
    expect(r.json.data).toMatchObject({ dryRun: true, ready: true, intent: INTENT });
    expect(calls.some((c) => c.method === "POST")).toBe(false);
    expect(r.json.nextSteps[0].command).toContain(`--confirm ${INTENT}`);
    expect(readAudit(home.dir).map((a) => a.result)).toEqual(["pending", "dry-run"]);
  });
  test("--yes without the matching --confirm is refused and never POSTs", async () => {
    await loggedIn();
    const calls = mockPortal();
    for (const extra of [[], ["--confirm", "11537@2026-11-05T17x1"]]) {
      const r = await run([...BASE, "--yes", ...extra]);
      expect(r.code).toBe(5);
      expect(r.json.error.code).toBe("approval/confirm-mismatch");
    }
    expect(calls.some((c) => c.url.endsWith("/payment"))).toBe(false);
  });
  test("--dry-run wins over --yes", async () => {
    await loggedIn();
    const calls = mockPortal();
    const r = await run([...BASE, "--yes", "--confirm", INTENT, "--dry-run"]);
    expect(r.json.data.dryRun).toBe(true);
    expect(calls.some((c) => c.method === "POST")).toBe(false);
  });
  test("an occupied hour is refused even with full confirmation", async () => {
    await loggedIn();
    const calls = mockPortal();
    const r = await run(["idrd", "booking", "create", "11537", "--date", "2026-11-05", "--hour", "6", "--json", "--yes", "--confirm", "11537@2026-11-05T06x1"]);
    expect(r.code).toBe(5);
    expect(r.json.error.code).toBe("slot/unavailable");
    expect(calls.some((c) => c.url.endsWith("/payment"))).toBe(false);
  });
  test("portal rules are enforced before any call (3 hours)", async () => {
    await loggedIn();
    mockPortal();
    const r = await run(["idrd", "booking", "create", "11537", "--date", "2026-11-05", "--hour", "16", "--hours", "3", "--json", "--yes", "--confirm", "11537@2026-11-05T16x3"]);
    expect(r.code).toBe(2);
    expect(r.json.error.code).toBe("rule/violation");
  });
  test("killswitch blocks the write", async () => {
    await loggedIn();
    const calls = mockPortal();
    await run(["killswitch", "on", "--json"]);
    const r = await run([...BASE, "--yes", "--confirm", INTENT]);
    expect(r.code).toBe(5);
    expect(r.json.error.code).toBe("safety/killswitch");
    expect(calls.some((c) => c.url.endsWith("/payment"))).toBe(false);
    await run(["killswitch", "off", "--json"]);
  });
  test("live free booking: audit pending is on disk before the POST, then auto-confirmed", async () => {
    await loggedIn();
    let pendingAtPost: string[] = [];
    const calls = mockPortal({ amount: 0, onCreate: () => { pendingAtPost = readAudit(home.dir).filter((a) => a.kind === "booking.create").map((a) => a.result); } });
    const r = await run([...BASE, "--yes", "--confirm", INTENT]);
    expect(r.code).toBe(0);
    expect(pendingAtPost).toEqual(["pending"]);
    const post = calls.find((c) => c.url.endsWith("/payment"))!;
    expect(post.body).toMatchObject({ date: "2026-11-05", start_hour: "4:00 PM", final_hour: "5:00 PM", document: "123" });
    expect(r.json.data.booking).toMatchObject({ bookingId: "555", free: true });
    expect(r.json.data.payment).toMatchObject({ paymentCode: "FREE-1", receiptUrl: "https://portalciudadano.idrd.gov.co/app/pagos/comprobante/FREE-1" });
    const free = calls.find((c) => c.url === "/api/payment-gateway/transferBankFree")!;
    expect(free.body).toMatchObject({ reservationId: 555, BankTypeSelected: "0", totalPay: 0, ip_address: "190.1.2.3" });
    const results = readAudit(home.dir).map((a) => `${a.kind}:${a.result}`);
    expect(results).toContain("booking.create:ok");
    expect(results).toContain("payment.free:ok");
    for (const a of readAudit(home.dir)) expect(JSON.stringify(a)).not.toContain("tok-abc");
  });
  test("live paid booking with --bank returns the PSE link in one shot", async () => {
    await loggedIn();
    const calls = mockPortal({ amount: 12000 });
    const r = await run([...BASE, "--bank", "1007", "--yes", "--confirm", INTENT]);
    expect(r.code).toBe(0);
    expect(r.json.data.payment.bankUrl).toBe("https://pse.example/pay?ref=PAY-1");
    expect(calls.find((c) => c.url === "/api/payment-gateway/transferBank")!.body).toMatchObject({ BankTypeSelected: "1007", totalPay: 12000 });
  });
  test("paid booking without --bank points to pay pse, which needs --yes", async () => {
    await loggedIn();
    mockPortal({ amount: 12000 });
    const r = await run([...BASE, "--yes", "--confirm", INTENT]);
    expect(r.json.data.payment).toBeNull();
    expect(r.json.nextSteps.map((s: any) => s.command).join(" ")).toContain("cupo idrd pay pse 555");
    const noYes = await run(["idrd", "pay", "pse", "555", "--bank", "1007", "--json"]);
    expect(noYes.code).toBe(5);
    expect(noYes.json.error.code).toBe("approval/required");
    const preview = await run(["idrd", "pay", "pse", "555", "--bank", "1007", "--dry-run", "--json"]);
    expect(preview.code).toBe(0);
    expect(preview.json.data).toMatchObject({ dryRun: true, amount: 12000, bank: "1007" });
    const ok = await run(["idrd", "pay", "pse", "555", "--bank", "1007", "--yes", "--json"]);
    expect(ok.json.data.bankUrl).toContain("pse.example");
  });
  test("if confirmation fails after the booking exists, the booking id is still reported", async () => {
    await loggedIn();
    mockPortal({ amount: 0, transferStatus: 500 });
    const r = await run([...BASE, "--yes", "--confirm", INTENT]);
    expect(r.code).toBe(0);
    expect(r.json.data.booking.bookingId).toBe("555");
    expect(r.json.data.payment).toMatchObject({ ok: false, error: { code: "upstream/error" } });
    expect(r.json.nextSteps[0].command).toBe("cupo idrd pay pse 555 --yes");
  });
  test("pay pse for an unknown booking is not-found", async () => {
    await loggedIn();
    mockPortal();
    const r = await run(["idrd", "pay", "pse", "999", "--bank", "1007", "--yes", "--json"]);
    expect(r.code).toBe(4);
  });
});

describe("surface", () => {
  test("schema is versioned and lists every command", async () => {
    const r = await run(["schema", "--json"]);
    expect(r.json.data.schemaVersion).toBe(1);
    expect(r.json.data.commands.map((c: any) => c.name)).toContain("idrd booking create");
    expect(r.json.data.exitCodes.refused).toBe(5);
  });
  test("unknown command is a usage error", async () => {
    const r = await run(["nope", "--json"]);
    expect(r.code).toBe(2);
    expect(r.json.ok).toBe(false);
  });
  test("command --help in JSON returns the spec", async () => {
    const r = await run(["idrd", "booking", "create", "--help", "--json"]);
    expect(r.json.data).toMatchObject({ name: "idrd booking create", trust: "T3" });
  });
});
