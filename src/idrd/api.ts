import { fail } from "../core/errors.js";
import { HOSTS, request, upstreamMessage } from "../core/http.js";
import { cleanBlock, cleanText } from "../core/sanitize.js";
import type { RawScheduleEntry } from "./availability.js";
import { webClient } from "./webclient.js";
import { SPORTS, sportFromEndowment, type Sport } from "./sports.js";

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
  if (res.status === 401) fail("auth/unauthorized", "Sesión inválida o vencida.", "Corre `cupo idrd auth login`.");
  if (res.status === 404) fail("not-found/resource", `${what}: no existe.`);
  if (res.status === 422) fail("upstream/validation", `${what}: el portal rechazó la solicitud.`, upstreamMessage(res.body));
  if (res.status >= 400) fail("upstream/error", `${what}: HTTP ${res.status}.`, upstreamMessage(res.body));
  return res.body;
}

type Paginated<T> = { data?: T[]; meta?: { current_page?: unknown; last_page?: unknown; total?: unknown } };

/** Ask for everything in one page; the portal honours it today (320 courts across 9 kinds, Nov 2026). */
const PAGE_SIZE = 500;
/** Hard stop if the portal ever ignores `per_page` and a list grows past this many pages. */
const MAX_PAGES = 50;

/**
 * Every list in the portal is a Laravel paginator (10 per page by default). Its SPA
 * shows pages one at a time; the CLI must see all of them, so it asks for a large
 * page and still follows `meta.last_page` in case the server caps `per_page`.
 */
async function paginate<T>(path: string, what: string, query: Record<string, string | number | undefined> = {}, token?: string): Promise<T[]> {
  const all: T[] = [];
  let page = 1;
  let lastPage = 1;
  do {
    const body = ensureOk(await request<Paginated<T>>(HOSTS.api, path, { query: { ...query, per_page: PAGE_SIZE, page }, token }), what);
    all.push(...(body?.data ?? []));
    const meta = body?.meta ?? {};
    lastPage = Math.max(1, Number(meta.last_page) || 1);
    const current = Number(meta.current_page) || page;
    if (current !== page) break; // the server did not honour `page`: stop rather than loop
    page += 1;
  } while (page <= lastPage && page <= MAX_PAGES);
  if (lastPage > MAX_PAGES) {
    fail("upstream/pagination", `${what}: el portal devolvió ${lastPage} páginas y solo leí ${MAX_PAGES}.`, "Reporta el cambio; el listado estaría incompleto.");
  }
  return all;
}

export async function listCourts(sport: Sport): Promise<Court[]> {
  const raw = await paginate<RawCourt>(SPORTS[sport].path, "Listado de espacios");
  const seen = new Set<number>();
  const courts: Court[] = [];
  for (const r of raw) {
    const c = normalizeCourt(r, sport);
    if (!seen.has(c.id)) {
      seen.add(c.id);
      courts.push(c);
    }
  }
  return courts;
}

export type Lane = { id: number; name: string; level: string; direction: string; quota: number | null; poolId: number | null; enabled: boolean };

/** Pools are booked per lane; the calendar is empty without one. */
export async function listLanes(poolId: number): Promise<Lane[]> {
  const body = ensureOk(await request<{ data: Record<string, any>[] }>(HOSTS.api, "/api/parks/swimming-pool-lanes", { query: { id_dotacion: poolId } }), "Carriles");
  return (body?.data ?? []).map((l) => ({
    id: Number(l.id),
    name: cleanText(l.name, 20),
    level: cleanText(l.level?.name, 30),
    direction: cleanText(l.direction?.name, 30),
    quota: l.quota === undefined || l.quota === null ? null : Number(l.quota),
    poolId: l.pool?.id_piscina === undefined ? null : Number(l.pool.id_piscina),
    enabled: String(l.enable ?? "1") === "1",
  }));
}

export type ColiseumSport = { id: number; name: string };

/** Coliseums ask which sport the space is for; the id travels in the calendar query and the booking. */
export async function listColiseumSports(coliseumId: number): Promise<ColiseumSport[]> {
  const body = ensureOk(await request<{ data: Array<{ id: unknown; nombre?: unknown; name?: unknown }> }>(HOSTS.api, "/api/parks/coliseum-sports", { query: { id_dotacion: coliseumId } }), "Deportes del coliseo");
  return (body?.data ?? []).map((d) => ({ id: Number(d.id), name: cleanText(d.nombre ?? d.name, 60) }));
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
    /** Which CLI space kind the portal's own booking screen would use for this endowment. */
    sport: Sport;
    description: string;
    status: string;
    surface: string;
    lighting: string;
    allDay: boolean;
    lanes: number | null;
    rules: string;
  };
  park: { id: number; name: string; code: string; address: string; locality: string };
};

export type ScheduleOptions = {
  /** Pools: lane id (required by the portal for any data to come back). */
  lane?: number;
  /** Coliseums: sport id from `listColiseumSports`. */
  sportId?: number;
  /** CEFE spaces: beneficiary document (the portal filters the calendar by it). */
  document?: string;
};

const truthy = (v: unknown) => v === true || v === 1 || v === "1" || v === "True" || v === "true";

export async function getSchedule(courtId: number, date: string, opts: ScheduleOptions = {}): Promise<Schedule> {
  const res = await request<{ data: RawScheduleEntry[]; details: Record<string, unknown> }>(
    HOSTS.api, `/api/parks/schedules/${courtId}`, { query: { date, lane: opts.lane, sport_id: opts.sportId, document: opts.document } });
  const body = ensureOk(res, `Horarios del espacio ${courtId}`);
  const det = (body?.details ?? {}) as Record<string, unknown>;
  const inner = (det.details ?? {}) as Record<string, unknown>;
  const kind = cleanText(inner.endowment, 40);
  return {
    entries: (body?.data ?? []).filter((e) => typeof e?.start === "string" && typeof e?.end === "string"),
    endowment: {
      kind,
      sport: sportFromEndowment(kind, { isPickleball: truthy(inner.is_pickleball), isPaddle: truthy(inner.is_paddle), isGrill: truthy(inner.is_grill) }),
      description: cleanText(inner.description ?? det.endowment_description, 120),
      status: cleanText(inner.status, 40),
      surface: cleanText(inner.floor_material, 80),
      lighting: cleanText(inner.illumination, 10),
      allDay: truthy(inner.all_day),
      lanes: inner.lane === undefined || inner.lane === null ? null : Number(inner.lane) || null,
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
  if (res.status >= 400) fail("auth/refresh-failed", "No pude renovar la sesión.", "Corre `cupo idrd auth login` de nuevo.");
  return toTokenSet(res.body);
}

export type Me = {
  id: number; name: string; email: string; verified: boolean; hasProfile: boolean;
  document: string | null; documentType: string | null;
  /** Raw profile as the portal returns it; the payment gateway form is built from it. */
  profile: Record<string, unknown>;
};

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
    profile,
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
  /** Coliseums only. */
  sport_id: number | null;
  /** Pools only. */
  lane: number | null;
  /** Beneficiary document (defaults to the account's own profile). */
  document: string | undefined;
  is_a_responsible_adult_required: boolean;
  document_type_responsible_adult?: string;
  document_number_responsible_adult?: string;
  full_name_responsible_adult?: string;
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

/** Pools: asks the portal whether this document pays nothing for the pool (PUT, no side effect). */
export async function validateFreePayment(token: string, poolId: number, document: string | undefined): Promise<boolean> {
  const res = await request<{ data?: { isFree?: unknown } }>(HOSTS.api, `/api/parks/schedules/validateFreePayment/${poolId}`, { method: "PUT", token, body: { document } });
  const ok = ensureOk(res, "Validar tarifa de piscina");
  return Boolean(ok?.data?.isFree);
}

// ---------------------------------------------------------------- gym memberships

function dataOf(res: { status: number; body: unknown }, what: string): Record<string, unknown> {
  const ok = ensureOk(res as { status: number; body: { data?: unknown } }, what);
  const d = ok && typeof ok === "object" && "data" in ok ? (ok as { data?: unknown }).data : ok;
  return (d && typeof d === "object" ? d : {}) as Record<string, unknown>;
}

export async function gymMembershipStatus(token: string, gymId: number): Promise<Record<string, unknown>> {
  return dataOf(await request(HOSTS.api, `/api/parks/schedules/${gymId}/gym-membership/status`, { token }), "Estado de la mensualidad");
}
export async function gymMembershipQuote(token: string, gymId: number): Promise<Record<string, unknown>> {
  return dataOf(await request(HOSTS.api, `/api/parks/schedules/${gymId}/gym-membership/quote`, { token }), "Cotización de la mensualidad");
}
export async function gymMembershipAvailability(token: string, gymId: number): Promise<Record<string, unknown>> {
  return dataOf(await request(HOSTS.api, `/api/parks/schedules/${gymId}/gym-membership/availability`, { token }), "Disponibilidad de la mensualidad");
}
export async function gymMembershipActive(token: string): Promise<unknown> {
  const res = await request<{ data?: unknown }>(HOSTS.api, "/api/parks/gym-membership/active", { token });
  const ok = ensureOk(res, "Mensualidades activas");
  return ok?.data ?? ok;
}
/** `{init:true}` creates the pending membership; `{payment_code}` activates it after PSE. */
export async function gymMembershipPurchase(token: string, gymId: number, body: { init?: true } | { payment_code: string }): Promise<Record<string, unknown>> {
  return dataOf(await request(HOSTS.api, `/api/parks/schedules/${gymId}/gym-membership/purchase`, { method: "POST", token, body }), "Compra de la mensualidad");
}
export async function membershipReservations(token: string, membershipId: number | string): Promise<Record<string, unknown>> {
  return dataOf(await request(HOSTS.api, `/api/memberships/${membershipId}/reservations`, { token }), "Reservas de la mensualidad");
}
export async function createMembershipReservation(token: string, membershipId: number | string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  return dataOf(await request(HOSTS.api, `/api/memberships/${membershipId}/reservations`, { method: "POST", token, body }), "Reservar con la mensualidad");
}

// ---------------------------------------------------------------- activities (schools, programs)

export type Activity = {
  id: number;
  program: string;
  name: string;
  stage: string;
  parkName: string;
  parkCode: string;
  address: string;
  weekdays: string;
  hours: string;
  minAge: number | null;
  maxAge: number | null;
  quota: number;
  taken: number;
  left: number;
  paid: boolean;
  rate: string;
  rateValue: number | null;
  startDate: string;
  endDate: string;
  active: boolean;
  open: boolean;
  teams: boolean;
  disability: boolean;
  consent: unknown[];
  regulations: unknown[];
};

type RawActivity = Record<string, any>;

function normalizeActivity(a: RawActivity): Activity {
  const quota = Number(a.quota ?? 0);
  const taken = Number(a.taken ?? a.users_schedules_count ?? 0);
  return {
    id: Number(a.id),
    program: cleanText(a.program_name, 120),
    name: cleanText(a.activity_name, 160),
    stage: cleanText(a.stage_name, 160),
    parkName: cleanText(a.park_name, 120),
    parkCode: cleanText(a.park_code, 20),
    address: cleanText(a.park_address, 200),
    weekdays: cleanText(a.weekday_name, 80),
    hours: cleanText(a.daily_name, 80),
    minAge: a.min_age === null || a.min_age === undefined ? null : Number(a.min_age),
    maxAge: a.max_age === null || a.max_age === undefined ? null : Number(a.max_age),
    quota,
    taken,
    left: Math.max(0, quota - taken),
    paid: Boolean(a.is_paid),
    rate: cleanText(a.rate_name, 80),
    rateValue: a.rate_value === null || a.rate_value === undefined ? null : Number(a.rate_value),
    startDate: cleanText(a.start_date, 30),
    endDate: cleanText(a.final_date, 30),
    active: Boolean(a.is_activated),
    open: Boolean(a.is_initiate),
    teams: Boolean(a.is_teams),
    disability: Boolean(a.disability),
    consent: Array.isArray(a.consent) ? a.consent : [],
    regulations: Array.isArray(a.regulations) ? a.regulations : [],
  };
}

/** The portal filters by arrays (`program_id[]`, `stage_id[]`); anything else is filtered here. */
export async function listActivities(filter: { programIds?: number[]; stageIds?: number[] } = {}): Promise<Activity[]> {
  const query: Record<string, string | number> = {};
  (filter.programIds ?? []).forEach((id, i) => { query[`program_id[${i}]`] = id; });
  (filter.stageIds ?? []).forEach((id, i) => { query[`stage_id[${i}]`] = id; });
  const raw = await paginate<RawActivity>("/api/citizen-portal/public-schedules", "Actividades", query);
  return raw.map(normalizeActivity);
}

export async function getActivity(id: number): Promise<Activity> {
  const body = ensureOk(await request<{ data?: RawActivity }>(HOSTS.api, `/api/citizen-portal/public-schedules/${id}`), `Actividad ${id}`);
  if (!body?.data) fail("not-found/resource", `Actividad ${id}: no existe.`);
  return normalizeActivity(body.data);
}

export type NamedRef = { id: number; name: string; count: number | null; parkName?: string; parkCode?: string };

function refs(rows: Record<string, unknown>[] | undefined): NamedRef[] {
  return (rows ?? []).map((r) => ({
    id: Number(r.id),
    name: cleanText(r.name, 160),
    count: typeof r.schedules_count === "number" ? r.schedules_count : null,
    ...(r.park_name !== undefined ? { parkName: cleanText(r.park_name, 120), parkCode: cleanText(r.park_code, 20) } : {}),
  }));
}

export async function listPrograms(): Promise<NamedRef[]> {
  return refs(ensureOk(await request<{ data?: Record<string, unknown>[] }>(HOSTS.api, "/api/citizen-portal/programs"), "Programas")?.data);
}
export async function listStages(): Promise<NamedRef[]> {
  return refs(ensureOk(await request<{ data?: Record<string, unknown>[] }>(HOSTS.api, "/api/citizen-portal/stages"), "Escenarios")?.data);
}
export async function listCategories(): Promise<Array<{ name: string; value: string }>> {
  const body = ensureOk(await request<{ data?: Array<{ name?: unknown; value?: unknown }> }>(HOSTS.api, "/api/citizen-portal/schedules/categories"), "Categorías");
  return (body?.data ?? []).map((c) => ({ name: cleanText(c.name, 80), value: cleanText(c.value, 80) }));
}

/** The people on the account who can be enrolled (the holder and their beneficiaries). */
export async function listProfiles(token: string): Promise<Record<string, unknown>[]> {
  const body = ensureOk(await request<{ data?: unknown }>(HOSTS.api, "/api/profiles/list", { token }), "Perfiles");
  return Array.isArray(body?.data) ? (body.data as Record<string, unknown>[]) : [];
}
/** Beneficiaries as the booking screen loads them for CEFE spaces. */
export async function listBeneficiaries(token: string): Promise<Record<string, unknown>[]> {
  const body = ensureOk(await request<{ data?: unknown }>(HOSTS.api, "/api/profiles", { token }), "Beneficiarios");
  return Array.isArray(body?.data) ? (body.data as Record<string, unknown>[]) : [];
}
export async function listSubscriptions(token: string): Promise<Record<string, unknown>[]> {
  const body = ensureOk(await request<{ data?: unknown }>(HOSTS.api, "/api/profiles/subscriptions", { token }), "Inscripciones");
  return Array.isArray(body?.data) ? (body.data as Record<string, unknown>[]) : [];
}
export async function subscribe(token: string, profileId: number, activityId: number, body: { profile_id: number; terms: boolean; consent: unknown[] }): Promise<{ message: string; details: unknown }> {
  const res = await request<{ data?: unknown; details?: unknown; message?: unknown }>(HOSTS.api, `/api/profiles/${profileId}/schedules/${activityId}`, { method: "POST", token, body });
  const ok = ensureOk(res, "Inscripción");
  return { message: cleanText(ok?.data ?? ok?.message, 300), details: ok?.details ?? null };
}
export async function unsubscribe(token: string, subscriptionId: number | string): Promise<unknown> {
  const res = await request<{ data?: unknown }>(HOSTS.api, `/api/profiles/subscriptions/${subscriptionId}`, { method: "DELETE", token });
  return ensureOk(res, "Desinscripción");
}

// ---------------------------------------------------------------- account: payments

export async function pendingToPay(token: string): Promise<unknown[]> {
  const body = ensureOk(await request<{ data?: unknown } | unknown[]>(HOSTS.api, "/api/citizen-portal/pending-to-pay", { token }), "Pagos pendientes");
  const list = Array.isArray(body) ? body : ((body as { data?: unknown })?.data ?? []);
  return Array.isArray(list) ? list : [];
}
export async function paymentHistory(token: string): Promise<unknown[]> {
  return paginate<unknown>("/api/citizen-portal/payments", "Historial de pagos", {}, token);
}
