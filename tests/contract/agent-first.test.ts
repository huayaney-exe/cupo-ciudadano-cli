/**
 * Agent-first rules from the cli-build skill, checked against the built
 * binary as a real subprocess (real TTY detection, real streams).
 * Each test names the rule it enforces.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { COURTS, schedule } from "./harness.ts";

const BIN = join(import.meta.dir, "../../dist/cupo.js");
const ANSI = /\x1b\[/;
let server: ReturnType<typeof Bun.serve>;
let home: string;

beforeAll(() => {
  const build = spawnSync("bun", ["run", "build"], { cwd: join(import.meta.dir, "../.."), encoding: "utf8" });
  if (build.status !== 0) throw new Error(build.stderr);
  home = mkdtempSync(join(tmpdir(), "idrd-af-"));
  server = Bun.serve({
    port: 0,
    fetch(req) {
      const p = new URL(req.url).pathname;
      if (p === "/api/parks/tennis-courts") return Response.json(COURTS);
      if (p.startsWith("/api/parks/schedules/")) return Response.json(schedule());
      return new Response("not found", { status: 404 });
    },
  });
});
afterAll(() => {
  server.stop(true);
  rmSync(home, { recursive: true, force: true });
});

async function cli(args: string[], env: Record<string, string> = {}, opts: { tty?: boolean } = {}) {
  const base: Record<string, string | undefined> = { ...process.env, IDRD_HOME: home, IDRD_API_URL: `http://localhost:${server.port}`, ...env };
  delete base.FORCE_COLOR;
  // Async spawn: the mock server lives in this process and must keep serving.
  // In TTY mode, macOS `script` allocates a pseudo-terminal (stdout.isTTY = true);
  // its stdin must be /dev/null or it waits for input.
  const cmd = opts.tty ? ["script", "-q", "/dev/null", "node", BIN, ...args] : ["node", BIN, ...args];
  const proc = Bun.spawn(cmd, { env: base, stdin: opts.tty ? "ignore" : new Blob([""]), stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, code] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited]);
  const clean = (t: string) => (opts.tty ? t.replace(/^\^D\x08\x08/, "").replace(/\r/g, "") : t);
  return { code, stdout: clean(stdout), stderr: clean(stderr) };
}

describe("agent-first rules", () => {
  test("rule: JSON automatically when stdout is not a TTY", async () => {
    const r = await cli(["idrd", "court", "list"]);
    expect(r.code).toBe(0);
    const j = JSON.parse(r.stdout);
    expect(j).toMatchObject({ ok: true, command: "idrd court list", schemaVersion: 1 });
  });
  test("rule: machine mode has no ANSI and nothing on stderr", async () => {
    const r = await cli(["idrd", "slot", "list", "11537", "--date", "2026-11-05"]);
    expect(r.stdout).not.toMatch(ANSI);
    expect(r.stderr).toBe("");
    expect(r.stdout.trim().split("\n")).toHaveLength(1);
  });
  test("rule: errors are structured with distinguishable exit codes", async () => {
    const usage = await cli(["idrd", "slot", "list", "11537", "--date", "ayer"]);
    expect(usage.code).toBe(2);
    expect(JSON.parse(usage.stdout).error.code).toBe("usage/bad-date");
    const auth = await cli(["idrd", "booking", "list"]);
    expect(auth.code).toBe(3);
  });
  test("rule: no prompt blocks a non-interactive run", async () => {
    const t0 = Date.now();
    const r = await cli(["idrd", "auth", "login", "--email", "a@b.co"], { IDRD_PASSWORD: "" });
    expect(Date.now() - t0).toBeLessThan(5000);
    expect(r.code).toBe(3);
    expect(JSON.parse(r.stdout).error.code).toBe("auth/password-required");
  });
  test("rule: a schema command with a version field", async () => {
    const j = JSON.parse((await cli(["schema"])).stdout);
    expect(j.data.schemaVersion).toBe(1);
    expect(typeof j.data.version).toBe("string");
  });
  test("rule: bare invoke never writes data to stdout", async () => {
    const piped = await cli([]);
    expect(piped.code).toBe(2);
    expect(JSON.parse(piped.stdout).error.code).toBe("usage/no-command");
  });
  test("rule: human mode in a TTY is styled; NO_COLOR keeps the content", async () => {
    const colored = await cli(["idrd", "court", "list"], {}, { tty: true });
    expect(colored.stdout).toMatch(ANSI);
    expect(colored.stdout).toContain("SAN ANDRES");
    const plain = await cli(["idrd", "court", "list"], { NO_COLOR: "1" }, { tty: true });
    expect(plain.stdout).not.toMatch(ANSI);
    expect(plain.stdout).toContain("SAN ANDRES");
  });
  test("rule: --json forces machine mode even in a TTY", async () => {
    const r = await cli(["idrd", "court", "list", "--json"], {}, { tty: true });
    expect(JSON.parse(r.stdout.trim()).ok).toBe(true);
  });
});
