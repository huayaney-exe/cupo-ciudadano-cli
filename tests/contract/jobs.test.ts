import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mockAll, run, tempHome } from "./harness.ts";

let home: ReturnType<typeof tempHome>;
beforeEach(() => { home = tempHome(); });
afterEach(() => home.cleanup());

describe("the job: cupo find / book / providers", () => {
  test("find --sport pool scans IDRD lanes and CEFE slots, ids carry the provider, every row has a book command", async () => {
    mockAll();
    const r = await run(["find", "--sport", "pool", "--date", "2026-11-05", "--from", "6", "--to", "10", "--json"]);
    expect(r.code).toBe(0);
    expect(r.json.command).toBe("find");
    expect(r.json.data.providers).toEqual(["idrd", "cefe"]);
    expect(r.json.data.scanned).toEqual({ idrd: 2, cefe: 2 });
    const ids = r.json.data.results.map((h: any) => h.id).sort();
    expect(ids).toEqual(["cefe:pool-occ", "cefe:pool-sem", "idrd:16893", "idrd:16893"]);
    const cefe = r.json.data.results.find((h: any) => h.id === "cefe:pool-sem");
    expect(cefe).toMatchObject({ provider: "cefe", kind: "pool", where: "CHAPINERO", free: [{ start: "07:15", end: "08:15", places: 18 }, { start: "09:45", end: "10:45", places: 10 }], bookCommand: "cupo book cefe:pool-sem --date 2026-11-05 --time 07:15" });
    const idrd = r.json.data.results.find((h: any) => h.id === "idrd:16893" && h.lane.startsWith("3 "));
    expect(idrd).toMatchObject({ provider: "idrd", free: [{ start: "07:00", end: "08:00", places: 3 }], bookCommand: "cupo book idrd:16893 --date 2026-11-05 --hour 7 --lane 3" });
    expect(r.json.data.results[0].free[0].start).toBe("07:00"); // sorted by first free time
    expect(r.json.nextSteps[0].command).toBe(r.json.data.results[0].bookCommand);
  });
  test("find --sport tennis skips providers that do not offer it; --locality chapinero keeps only CEFE; --provider filters", async () => {
    mockAll();
    const t = await run(["find", "--sport", "tennis", "--date", "2026-11-05", "--from", "6", "--to", "9", "--json"]);
    expect(t.json.data.providers).toEqual(["idrd"]);
    expect(t.json.data.results.map((h: any) => h.id)).toEqual(["idrd:11537"]);
    const ch = await run(["find", "--sport", "pool", "--date", "2026-11-05", "--locality", "chapinero", "--json"]);
    expect(ch.json.data.results.every((h: any) => h.provider === "cefe")).toBe(true);
    const only = await run(["find", "--sport", "pool", "--date", "2026-11-05", "--provider", "idrd", "--json"]);
    expect(only.json.data.providers).toEqual(["idrd"]);
    expect((await run(["find", "--provider", "nope", "--json"])).json.error.code).toBe("usage/bad-arg");
  });
  test("book routes by prefix and normalizes --time/--hour; previews come from the provider", async () => {
    mockAll();
    await run(["idrd", "auth", "login", "--email", "a@b.co", "--json"], { IDRD_PASSWORD: "x" });
    await run(["cefe", "auth", "login", "--email", "ana@cefe.co", "--json"], { CEFE_PASSWORD: "y" });
    const i = await run(["book", "idrd:16893", "--date", "2026-11-05", "--time", "07:00", "--lane", "3", "--json"]);
    expect(i.json.command).toBe("book");
    expect(i.json.data).toMatchObject({ dryRun: true, intent: "16893@2026-11-05T07x1L3", ready: true });
    const c = await run(["book", "cefe:pool-sem", "--date", "2026-11-05", "--hour", "7", "--json"]);
    expect(c.json.data.ready).toBe(false); // 07:00 is not a published CEFE slot; 07:15 is
    expect(c.json.data.checks.find((x: any) => x.name === "franja").ok).toBe(false);
    const c2 = await run(["book", "cefe:pool-sem", "--date", "2026-11-05", "--time", "07:15", "--json"]);
    expect(c2.json.data).toMatchObject({ dryRun: true, ready: true, pay: "EFECTIVO" });
    const bad = await run(["book", "11537", "--date", "2026-11-05", "--hour", "7", "--json"]);
    expect(bad.json.error.code).toBe("usage/bad-id");
  });
  test("providers shows coverage and session state; schema exposes start, providers and a provider per command", async () => {
    mockAll();
    const p = await run(["providers", "--json"]);
    expect(p.json.data.map((x: any) => [x.id, x.loggedIn])).toEqual([["idrd", false], ["cefe", false]]);
    await run(["cefe", "auth", "login", "--email", "ana@cefe.co", "--json"], { CEFE_PASSWORD: "y" });
    const p2 = await run(["providers", "--json"]);
    expect(p2.json.data.find((x: any) => x.id === "cefe")).toMatchObject({ loggedIn: true, email: "ana@cefe.co" });
    const s = await run(["schema", "--json"]);
    expect(s.json.data.cli).toBe("cupo");
    expect(s.json.data.start[0]).toBe("cupo providers");
    expect(s.json.data.providers.map((x: any) => x.id)).toEqual(["idrd", "cefe"]);
    const byProvider = s.json.data.commands.reduce((acc: any, c: any) => ((acc[c.provider] = (acc[c.provider] ?? 0) + 1), acc), {});
    expect(byProvider).toEqual({ cupo: 6, idrd: 31, cefe: 24 });
    expect(s.json.data.commands.find((c: any) => c.name === "idrd booking create").provider).toBe("idrd");
  });
});
