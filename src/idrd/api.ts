import { fail } from "../core/errors.js";
import { HOSTS, request, upstreamMessage } from "../core/http.js";
import { cleanBlock, cleanText } from "../core/sanitize.js";
import type { RawScheduleEntry } from "./availability.js";
import { webClient } from "./webclient.js";
import { SPORTS, type Sport } from "./sports.js";

export type Court = {
  id: number;
  parkId: number;
  parkName: string;
  parkCode: string;
  address: string;
  locality: string;
  upz: string;
  sport: Sport;
  description: string;
  bookable: boolean;
};

type RawCourt = Record<string, unknown>;

function normalizeCourt(c: RawCourt, sport: Sport): Court {
  return {
    id: Number(c.park_endowment_id ?? c.id),
    parkId: Number(c.park_id),
    parkName: cleanText(c.park_name, 120),
    parkCode: cleanText(c.park_code, 20),
    address: cleanText(c.park_address, 200),
    locality: cleanText(c.locality, 60),
    upz: cleanText(c.upz, 60),
    sport,
    description: cleanText(c.endowment_description, 120),
    bookable: Boolean(c.for_booking),
  };
}

function ensureOk<T>(res: { status: number; body: T }, what: string): T {
  if (res.status === 401) fail("auth/unauthorized", "Sesión inválida o vencida.", "Corre `idrd auth login`.");
  if (res.status === 404) fail("not-found/resource", `${what}: no existe.`);
  if (res.status === 422) fail("upstream/validation", `${what}: el portal rechazó la solicitud.`, upstreamMessage(res.body));
  if (res.status >= 400) fail("upstream/error", `${what}: HTTP ${res.status}.`, upstreamMessage(res.body));
  return res.body;
}

export async function listCourts(sport: Sport): Promise<Court[]> {
  const body = ensureOk(await request<{ data: RawCourt[] }>(HOSTS.api, SPORTS[sport].path), "Listado de canchas");
  return (body?.data ?? []).map((c) => normalizeCourt(c, sport));
}

export type ParkDetails = {
  id: number;
  name: string;
  code: string;
  address: string;
  email: string;
  hours: string;
  stratum: number | null;
};

export async function getPark(parkId: number): Promise<ParkDetails> {
  const body = ensureOk(await request<{ data: Record<string, unknown> }>(HOSTS.api, `/api/parks/${parkId}/details`), "Parque");
  const d = body?.data ?? {};
  return {
    id: Number(d.id),
    name: cleanText(d.name, 120),
    code: cleanText(d.code, 20),
    address: cleanText(d.address, 200),
    email: cleanText(d.email, 120),
    hours: cleanText(d.schedule_service, 300),
    stratum: typeof d.stratum === "number" ? d.stratum : null,
  };
}

export type Schedule = {
  entries: RawScheduleEntry[];
  endowment: {
    kind: string;
    description: string;
    status: string;
    surface: string;
    lighting: string;
    allDay: boolean;
    rules: string;
  };
  park: { id: number; name: string; code: string; address: string; locality: string };
};

export async function getSchedule(courtId: number, date: string): Promise<Schedule> {
  const res = await request<{ data: RawScheduleEntry[]; details: Record<string, unknown> }>(
    HOSTS.api, `/api/parks/schedules/${courtId}`, { query: { date } });
  const body = ensureOk(res, `Horarios de la cancha ${courtId}`);
  const det = (body?.details ?? {}) as Record<string, unknown>;
  const inner = (det.details ?? {}) as Record<string, unknown>;
  return {
    entries: (body?.data ?? []).filter((e) => typeof e?.start === "string" && typeof e?.end === "string"),
    endowment: {
      kind: cleanText(inner.endowment, 40),
      description: cleanText(inner.description ?? det.endowment_description, 120),
      status: cleanText(inner.status, 40),
      surface: cleanText(inner.floor_material, 80),
      lighting: cleanText(inner.illumination, 10),
      allDay: Boolean(inner.all_day),
      rules: cleanBlock(inner.requirements, 6000),
    },
    park: {
      id: Number(inner.park_id ?? det.id),
      name: cleanText(det.name, 120),
      code: cleanText(det.code, 20),
      address: cleanText(det.address, 200),
      locality: cleanText(det.locality, 60),
    },
  };
}

// ---------------------------------------------------------------- auth

export type TokenSet = { accessToken: string; refreshToken?: string; expiresIn: number };

function toTokenSet(body: Record<string, unknown>): TokenSet {
  if (typeof body.access_token !== "string") fail("auth/bad-response", "El portal no devolvió un token.");
  return {
    accessToken: body.access_token,
    refreshToken: typeof body.refresh_token === "string" ? body.refresh_token : undefined,
    expiresIn: Number(body.expires_in ?? 0),
  };
}

/** POST /oauth/token with the portal's web client; re-discovers it once if the portal rotated it. */
async function tokenRequest(grant: Record<string, string>): Promise<{ status: number; body: Record<string, unknown> }> {
  for (const refresh of [false, true]) {
    const client = await webClient({ refresh });
    const res = await request<Record<string, unknown>>(HOSTS.api, "/oauth/token", {
      method: "POST",
      body: { ...grant, client_id: client.id, client_secret: client.secret, scope: "" },
    });
    const rotated = res.body && typeof res.body === "object" && res.body.error === "invalid_client";
    if (!rotated || refresh || client.source === "env") return res;
  }
  return fail("auth/web-client", "El portal rechazó la configuración de login.");
}

export async function passwordGrant(email: string, password: string): Promise<TokenSet> {
  const res = await tokenRequest({ grant_type: "password", username: email, password });
  if (res.body?.error === "invalid_client") fail("auth/web-client", "El portal rechazó la configuración de login.", "Revisa IDRD_CLIENT_ID/IDRD_CLIENT_SECRET o borra ~/.idrd/web-client.json.");
  if (res.status === 401 || res.status === 400) fail("auth/invalid-credentials", "Correo o contraseña incorrectos.", "Verifica tus datos en portalciudadano.idrd.gov.co.");
  return toTokenSet(ensureOk(res, "Login"));
}

/** Standard Passport refresh grant. The portal's SPA never uses it: unverified live. */
export async function refreshGrant(refreshToken: string): Promise<TokenSet> {
  const res = await tokenRequest({ grant_type: "refresh_token", refresh_token: refreshToken });
  if (res.status >= 400) fail("auth/refresh-failed", "No pude renovar la sesión.", "Corre `idrd auth login` de nuevo.");
  return toTokenSet(res.body);
}

export type Me = { id: number; name: string; email: string; verified: boolean; hasProfile: boolean; document: string | null; documentType: string | null };

export async function me(token: string): Promise<Me> {
  const body = ensureOk(await request<{ data?: Record<string, unknown> } & Record<string, unknown>>(HOSTS.api, "/api/user", { token }), "Usuario");
  const u = (body?.data ?? body) as Record<string, unknown>;
  const profile = (u.profile ?? {}) as Record<string, unknown>;
  return {
    id: Number(u.id),
    name: cleanText(u.name, 120),
    email: cleanText(u.email, 120),
    verified: Boolean(u.is_verified ?? u.verified_at),
    hasProfile: Boolean(u.has_profile),
    document: profile.document ? cleanText(profile.document, 30) : null,
    documentType: profile.document_type_id ? cleanText(profile.document_type_id, 10) : null,
  };
}

export async function logout(token: string): Promise<void> {
  await request(HOSTS.api, "/api/logout", { method: "POST", token, body: {} });
}

export async function listBookings(token: string): Promise<Record<string, unknown>[]> {
  const body = ensureOk(await request<{ data?: unknown } | unknown[]>(HOSTS.api, "/api/citizen-portal/bookings", { token }), "Reservas");
  const list = Array.isArray(body) ? body : ((body as { data?: unknown })?.data ?? []);
  return Array.isArray(list) ? (list as Record<string, unknown>[]) : [];
}

// ---------------------------------------------------------------- booking + payment

export type BookingRequest = {
  date: string;
  start_hour: string;
  final_hour: string;
  sport_id: null;
  lane: null;
  document: string | undefined;
  is_a_responsible_adult_required: false;
};

export async function createBooking(token: string, courtId: number, body: BookingRequest): Promise<Record<string, unknown>> {
  const res = await request<{ data?: Record<string, unknown> }>(HOSTS.api, `/api/parks/schedules/${courtId}/payment`, { method: "POST", token, body });
  const ok = ensureOk(res, "Crear reserva");
  return (ok?.data ?? (ok as Record<string, unknown>)) as Record<string, unknown>;
}

export type Bank = { code: string; name: string };

export async function listBanks(): Promise<Bank[]> {
  const body = ensureOk(await request<{ banks?: Array<{ code: unknown; name: unknown }> }>(HOSTS.pay, "/api/payment-gateway/banks"), "Bancos PSE");
  return (body?.banks ?? [])
    .map((b) => ({ code: cleanText(b.code, 10), name: cleanText(b.name, 100) }))
    .filter((b) => b.code && b.code !== "0");
}

export async function transferBank(token: string, payload: Record<string, unknown>, free: boolean): Promise<Record<string, unknown>> {
  const path = free ? "/api/payment-gateway/transferBankFree" : "/api/payment-gateway/transferBank";
  const res = await request<{ data?: Record<string, unknown> }>(HOSTS.pay, path, { method: "POST", token, body: payload, timeoutMs: 60_000 });
  const ok = ensureOk(res, free ? "Confirmar reserva gratuita" : "Iniciar pago PSE");
  return (ok?.data ?? (ok as Record<string, unknown>)) as Record<string, unknown>;
}

export async function paymentStatus(token: string, code: string): Promise<Record<string, unknown>> {
  const res = await request<{ data?: Record<string, unknown> }>(HOSTS.pay, `/api/payment-gateway/status/${encodeURIComponent(code)}`, { token });
  const ok = ensureOk(res, "Estado del pago");
  return (ok?.data ?? (ok as Record<string, unknown>)) as Record<string, unknown>;
}
