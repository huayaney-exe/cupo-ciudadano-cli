import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { atomicWriteJson } from "../cli/foundation/atomic-write.js";
import { fail } from "../core/errors.js";
import { HOSTS, request } from "../core/http.js";
import { appHome } from "../core/paths.js";

/**
 * The portal authenticates citizens through a public OAuth "web client"
 * whose id/secret every browser receives inside the portal's JavaScript.
 * They identify the app, not the user. Rather than hardcode (and republish)
 * them, discover them from the same file a browser loads, cache for a week,
 * and re-discover when the portal rotates them.
 */
export type WebClient = { id: string; secret: string; source: "env" | "cache" | "portal" };

const TTL_MS = 7 * 24 * 3600_000;
const cacheFile = () => join(appHome(), "web-client.json");

export async function webClient(opts: { refresh?: boolean } = {}): Promise<WebClient> {
  const envId = process.env.IDRD_CLIENT_ID;
  const envSecret = process.env.IDRD_CLIENT_SECRET;
  if (envId && envSecret) return { id: envId, secret: envSecret, source: "env" };

  if (!opts.refresh && existsSync(cacheFile())) {
    try {
      const c = JSON.parse(readFileSync(cacheFile(), "utf8")) as { id?: string; secret?: string; fetchedAt?: string };
      if (c.id && c.secret && c.fetchedAt && Date.now() - Date.parse(c.fetchedAt) < TTL_MS) {
        return { id: c.id, secret: c.secret, source: "cache" };
      }
    } catch {
      /* corrupt cache: rediscover */
    }
  }

  const index = await request<unknown>(HOSTS.web, "/", { timeoutMs: 20_000 });
  const html = typeof index.body === "string" ? index.body : "";
  // Config lives in chunk-common; check the app's own scripts, never the vendor bundle.
  const scripts = [...html.matchAll(/src="(\/js\/(?:chunk-common|index|app)[^"]*\.js)"/g)].map((m) => m[1]!);
  for (const src of scripts) {
    const js = await request<unknown>(HOSTS.web, src, { timeoutMs: 30_000 });
    const text = typeof js.body === "string" ? js.body : "";
    const id = /VUE_APP_CLIENT_ID:"([^"]+)"/.exec(text)?.[1];
    const secret = /VUE_APP_CLIENT_SECRET:"([^"]+)"/.exec(text)?.[1];
    if (id && secret) {
      atomicWriteJson(cacheFile(), { id, secret, fetchedAt: new Date().toISOString(), from: src }, { mode: 0o600 });
      return { id, secret, source: "portal" };
    }
  }
  return fail(
    "upstream/web-client",
    "No encontré la configuración de login en el frontend del portal (¿cambió el portal?).",
    "Define IDRD_CLIENT_ID e IDRD_CLIENT_SECRET, o reporta el cambio.",
  );
}

export function forgetWebClient(): void {
  if (existsSync(cacheFile())) unlinkSync(cacheFile());
}
