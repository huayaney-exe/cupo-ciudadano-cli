import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { appHome } from "./paths.js";

/**
 * Update check, the way update-notifier does it: the running command only
 * reads a small cache and prints one line to stderr when a newer version is
 * known; a detached child refreshes the cache at most once a day. The
 * command's own latency never depends on the network.
 *
 * Off when: CUPO_NO_UPDATE_CHECK=1, CI, JSON mode, --quiet, or no TTY.
 */
export const UPDATE_URL = "https://raw.githubusercontent.com/huayaney-exe/cupo-ciudadano-cli/main/package.json";
export const UPDATE_TTL_MS = 24 * 3600_000;

export type UpdateCache = { checkedAt: string; current: string; latest: string | null; error?: string };

export function updateCachePath(): string {
  return join(appHome(), "update-check.json");
}

export function updateChecksDisabled(): boolean {
  return Boolean(process.env.CUPO_NO_UPDATE_CHECK || process.env.CI || process.env.NODE_ENV === "test");
}

/** Numeric semver compare on the x.y.z part: >0 when a is newer than b. */
export function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/, "").split(/[.-]/).map((x) => Number(x) || 0);
  const pb = b.replace(/^v/, "").split(/[.-]/).map((x) => Number(x) || 0);
  for (let i = 0; i < 3; i++) if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0);
  return 0;
}

export function readUpdateCache(): UpdateCache | null {
  try {
    const file = updateCachePath();
    return existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as UpdateCache) : null;
  } catch {
    return null;
  }
}

export function writeUpdateCache(cache: UpdateCache): void {
  mkdirSync(appHome(), { recursive: true, mode: 0o700 });
  writeFileSync(updateCachePath(), `${JSON.stringify(cache)}\n`, { mode: 0o600 });
}

/** The repo checkout that `npm link` points at: dist/cupo.js lives one level below it. */
export function repoDir(entry = process.argv[1] ?? ""): string {
  return resolve(dirname(entry), "..");
}

/** One line for stderr when the cache says a newer version exists; null otherwise. */
export function updateNotice(current: string, cache: UpdateCache | null = readUpdateCache(), repo = repoDir()): string | null {
  if (!cache?.latest || compareVersions(cache.latest, current) <= 0) return null;
  return `↑ cupo ${cache.latest} disponible (tienes ${current}). Actualiza: git -C ${repo} pull`;
}

/** Refresh the cache in the background when it is older than a day. Never blocks, never throws. */
export function scheduleUpdateCheck(current: string, entry = process.argv[1]): void {
  if (updateChecksDisabled() || !entry) return;
  const cache = readUpdateCache();
  if (cache && cache.current === current && Date.now() - Date.parse(cache.checkedAt) < UPDATE_TTL_MS) return;
  try {
    const child = spawn(process.execPath, [entry, "__update-check"], { detached: true, stdio: "ignore", env: { ...process.env, CUPO_NO_UPDATE_CHECK: "" } });
    child.unref();
  } catch {
    /* no background check this time */
  }
}

/** The detached child's job: fetch the published package.json and record its version. */
export async function runUpdateCheck(current: string, url = UPDATE_URL): Promise<UpdateCache> {
  let cache: UpdateCache = { checkedAt: new Date().toISOString(), current, latest: null };
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000), headers: { accept: "application/json", "user-agent": `cupo/${current}` } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const pkg = (await res.json()) as { version?: string };
    cache.latest = typeof pkg.version === "string" ? pkg.version : null;
  } catch (e) {
    cache = { ...cache, error: e instanceof Error ? e.message : String(e) };
  }
  writeUpdateCache(cache);
  return cache;
}
