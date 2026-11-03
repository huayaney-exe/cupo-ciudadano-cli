import { mkdtempSync, readdirSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setFetch } from "../../src/core/http.ts";
import { setNow } from "../../src/idrd/time.ts";
import { main } from "../../src/cli.ts";

export type Call = { method: string; url: string; body: unknown; auth: string | null };

/** Fixed clock: Tue 2026-11-03 10:00 Bogotá. */
export const NOW = "2026-11-03T15:00:00Z";
export const WEEK = ["2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08", "2026-11-09"];

export const COURTS = {
  data: [
    { park_endowment_id: 11537, id: 11537, park_id: 10721, park_name: "SAN ANDRES", park_code: "10-234", park_address: "CALLE 82 N 100A 91", locality: "ENGATIVA", upz: "BOLIVIA", endowment_description: "CANCHA DE TENNIS NÂ° 1", for_booking: 1 },
    { park_endowment_id: 11404, id: 11404, park_id: 1, park_name: "SERVITA", park_code: "01-1", park_address: "CL 165", locality: "USAQUÉN", upz: "X", endowment_description: "CANCHA", for_booking: 0 },
  ],
};

export function schedule() {
  return {
    data: [
      { title: "Espacio Reservable", can: true, category: "Disponible", start: "2026-11-05T06:00:00", end: "2026-11-05T08:00:00" },
      { title: "Espacio Reservado", can: false, category: "Reservado", start: "2026-11-05T06:00:00", end: "2026-11-05T07:00:00" },
      { title: "Espacio Reservable", can: true, category: "Disponible", start: "2026-11-05T16:00:00", end: "2026-11-05T19:00:00" },
      { title: "Espacio Reservable", can: true, category: "Disponible", start: "2026-11-09T06:00:00", end: "2026-11-09T07:00:00" },
    ],
    details: { id: 10721, name: "SAN ANDRES", code: "10-234", address: "CALLE 82 N 100A 91", locality: "ENGATIVA", endowment_description: "CANCHA DE TENIS", details: { park_id: 10721, endowment: "TENNIS", description: "Cancha de Tennis NÂ° 1", status: "BUENO", floor_material: "ASFALTO", illumination: "SI", all_day: false, requirements: "* El usuario podrá reservar máximo 2 horas continuas por día." } },
  };
}

export type Scenario = {
  amount?: number;
  loginStatus?: number;
  onCreate?: () => void;
  transferStatus?: number;
  /** client secret served by the mock web frontend */
  webSecret?: string;
  /** client secret the mock token endpoint accepts */
  acceptSecret?: string;
};

export function mockPortal(sc: Scenario = {}) {
  const calls: Call[] = [];
  setFetch(async (input, init) => {
    const url = new URL(String(input));
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    const headers = (init?.headers ?? {}) as Record<string, string>;
    calls.push({ method, url: url.pathname + url.search, body, auth: headers.Authorization ?? null });
    const json = (status: number, b: unknown) => new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json" } });
    const p = url.pathname;
    if (url.host === "api.ipify.org") return json(200, { ip: "190.1.2.3" });
    if (url.host === "portalciudadano.idrd.gov.co") {
      if (p === "/") return new Response('<html><script defer="defer" src="/js/chunk-vendors.v1.js"></script><script defer="defer" src="/js/chunk-common.c0ffee.js"></script></html>', { status: 200, headers: { "content-type": "text/html" } });
      if (p === "/js/chunk-common.c0ffee.js") return new Response(`var e={VUE_APP_GRANT_TYPE:"password",VUE_APP_CLIENT_ID:"2",VUE_APP_CLIENT_SECRET:"${sc.webSecret ?? "web-secret-1"}"};`, { status: 200, headers: { "content-type": "application/javascript" } });
      return new Response("nope", { status: 404 });
    }
    if (p === "/api/parks/tennis-courts") return json(200, COURTS);
    if (p.startsWith("/api/parks/schedules/") && p.endsWith("/payment") && method === "POST") {
      sc.onCreate?.();
      return json(200, { data: { booking_id: 555, amount: sc.amount ?? 0, name: "Ana", surname: "Ruiz", phone: 300, email: "a@b.co", address: "Cl 1", document_type_id: "CE", document: "123", park_id: 10721, service_id: 9, concept: "Tenis", person_type_id: "N", created_at: "2099-01-01T00:00:00Z" } });
    }
    if (p.startsWith("/api/parks/schedules/")) return json(200, schedule());
    if (p.startsWith("/api/parks/") && p.endsWith("/details")) return json(200, { data: { id: 10721, name: "SAN ANDRES", code: "10-234", address: "CALLE 82", email: "x@idrd.gov.co", schedule_service: "Lunes a Domingo 6 AM - 10 PM", stratum: 3 } });
    if (p === "/oauth/token") {
      const accepted = sc.acceptSecret ?? sc.webSecret ?? "web-secret-1";
      if ((body as { client_secret?: string })?.client_secret !== accepted) return json(401, { error: "invalid_client", message: "Client authentication failed" });
      if (sc.loginStatus && sc.loginStatus !== 200) return json(sc.loginStatus, { error: "invalid_credentials" });
      return json(200, { token_type: "Bearer", expires_in: 28800, access_token: "tok-abc", refresh_token: "ref-xyz" });
    }
    if (p === "/api/user") return headers.Authorization ? json(200, { id: 1, name: "Ana Ruiz", email: "a@b.co", is_verified: true, has_profile: true, profile: { document: "123", document_type_id: "CE" } }) : json(401, {});
    if (p === "/api/citizen-portal/bookings") return json(200, { data: [] });
    if (p === "/api/logout") return json(200, {});
    if (p === "/api/payment-gateway/banks") return json(200, { banks: [{ code: "0", name: "A continuación seleccione su banco" }, { code: "1007", name: "BANCOLOMBIA" }] });
    if (p === "/api/payment-gateway/transferBankFree") return sc.transferStatus ? json(sc.transferStatus, { message: "PSE caído" }) : json(200, { data: { payment: "FREE-1" } });
    if (p === "/api/payment-gateway/transferBank") return json(200, { data: { bank_url: "https://pse.example/pay?ref=PAY-1", payment: "PAY-1" } });
    return new Response("<html>404</html>", { status: 404 });
  });
  return calls;
}

export type Run = { code: number; stdout: string; stderr: string; json: any };

export async function run(argv: string[], env: Record<string, string | undefined> = {}): Promise<Run> {
  const saved: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(env)) {
    saved[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  let stdout = "";
  let stderr = "";
  const ow = process.stdout.write.bind(process.stdout);
  const ew = process.stderr.write.bind(process.stderr);
  process.stdout.write = ((c: string | Uint8Array) => ((stdout += String(c)), true)) as typeof process.stdout.write;
  process.stderr.write = ((c: string | Uint8Array) => ((stderr += String(c)), true)) as typeof process.stderr.write;
  setNow(() => new Date(NOW));
  try {
    const code = await main(argv);
    let json: any = null;
    try { json = JSON.parse(stdout.trim().split("\n").pop() ?? ""); } catch { /* human output */ }
    return { code, stdout, stderr, json };
  } finally {
    process.stdout.write = ow;
    process.stderr.write = ew;
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

export function tempHome(): { dir: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), "idrd-test-"));
  process.env.IDRD_HOME = dir;
  return { dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

export function readAudit(home: string): any[] {
  const dir = join(home, "audit");
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((f) => readFileSync(join(dir, f), "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)));
}

export function allFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? allFiles(join(dir, e.name)) : [join(dir, e.name)]));
}
