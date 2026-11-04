import { fail } from "./errors.js";
import { cleanText } from "./sanitize.js";

export const HOSTS = {
  /** Auth, parks, schedules, bookings. */
  api: process.env.IDRD_API_URL || "https://portalciudadano-back.idrd.gov.co",
  /** Payment gateway (PSE). */
  pay: process.env.IDRD_PAY_URL || "https://portalcontratista-back.idrd.gov.co",
  /** The portal's public web frontend (source of its OAuth web-client config). */
  web: process.env.IDRD_WEB_URL || "https://portalciudadano.idrd.gov.co",
};

const UA = "idrd-cli/0.1 (+personal, unofficial)";

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  token?: string;
  query?: Record<string, string | number | undefined>;
  timeoutMs?: number;
  /** Retries apply to GET only; writes are never retried. */
  retries?: number;
};

export type HttpResponse<T> = { status: number; body: T };

export type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
let fetchImpl: FetchLike = (input, init) => fetch(input, init);
/** Test seam: swap the network layer. */
export function setFetch(f: FetchLike): void {
  fetchImpl = f;
}

export async function request<T = unknown>(base: string, path: string, opts: RequestOptions = {}): Promise<HttpResponse<T>> {
  const method = opts.method ?? "GET";
  const url = new URL(path, base);
  for (const [k, v] of Object.entries(opts.query ?? {})) if (v !== undefined) url.searchParams.set(k, String(v));
  const headers: Record<string, string> = { Accept: "application/json", "User-Agent": UA };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  const retries = method === "GET" ? (opts.retries ?? 2) : 0;

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 30_000);
    try {
      const res = await fetchImpl(url, {
        method,
        headers,
        body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
        signal: ctrl.signal,
      });
      const text = await res.text();
      let body: unknown = text;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        /* non-JSON body (HTML error page) stays a string */
      }
      if (res.status >= 500 && attempt < retries) {
        await sleep(400 * (attempt + 1));
        continue;
      }
      return { status: res.status, body: body as T };
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await sleep(400 * (attempt + 1));
        continue;
      }
    } finally {
      clearTimeout(timer);
    }
  }
  const reason = lastErr instanceof Error ? lastErr.message : String(lastErr);
  fail("network/unreachable", `No pude conectar con ${url.host}.`, cleanText(reason, 160), lastErr);
}

/** Extracts a readable message from a Laravel-style error body. */
export function upstreamMessage(body: unknown): string {
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    const errors = b.errors && typeof b.errors === "object" ? Object.values(b.errors as Record<string, unknown>).flat() : [];
    const parts = [b.message, b.error_description, ...errors].filter(Boolean).map((x) => cleanText(x, 200));
    if (parts.length) return [...new Set(parts)].join(" — ");
  }
  if (typeof body === "string" && body.startsWith("<")) return "respuesta HTML (ruta inexistente o error del servidor)";
  return cleanText(body, 200) || "sin detalle";
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
