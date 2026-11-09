import { mkdtempSync, readdirSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setFetch, type FetchLike } from "../../src/core/http.ts";
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

const space = (id: number, park: string, desc: string, locality = "SAN CRISTÓBAL", booking = 1) => ({
  park_endowment_id: id, id, park_id: 8585, park_name: park, park_code: "04-127", park_address: "CL 1", locality, upz: "X", endowment_description: desc, for_booking: booking,
});
/** One of each non-court space, as the portal lists them. */
export const SPACES: Record<string, Record<string, unknown>[]> = {
  "/api/parks/swimming-pools": [space(16893, "SAN CRISTOBAL", "CEFE PISCINA OLIMPICA", "SAN CRISTÓBAL", 251), space(15528, "TUNAL", "PISCINA CERRADA", "TUNJUELITO", 0)],
  "/api/parks/grills": [space(16848, "SAN CARLOS", "Asadero NÂ° 1", "TUNJUELITO", 7)],
  "/api/parks/gyms": [space(15227, "SAN CRISTOBAL", "Centro Felicidad CeFe", "SAN CRISTÓBAL", 6)],
  "/api/parks/coliseum": [space(16892, "SAN CRISTOBAL", "Polideportivo CEFE San Cristóbal", "SAN CRISTÓBAL", 15)],
};
export const LANES = [
  { quota: "12", name: "3", id: 3, enable: "1", pool_id: "40", level: { id: 2, name: "MEDIO" }, direction: { id: 2, name: "VERTICAL" }, pool: { id_piscina: 40, id_dotacion: "16893" } },
  { quota: "12", name: "4", id: 4, enable: "1", pool_id: "40", level: { id: 2, name: "MEDIO" }, direction: { id: 2, name: "VERTICAL" }, pool: { id_piscina: 40, id_dotacion: "16893" } },
];
export const COLISEUM_SPORTS = [{ id: "1", nombre: "Futsal" }, { id: "3", nombre: "Baloncesto" }];

function details(kind: string, extra: Record<string, unknown> = {}) {
  return {
    id: 8585, name: "SAN CRISTOBAL", code: "04-127", address: "CL 1", locality: "SAN CRISTÓBAL", endowment_description: kind,
    details: { park_id: 8585, endowment: kind, description: kind, status: "BUENO", floor_material: "BALDOSA", illumination: "SI", all_day: "False", lane: "0", is_grill: "False", is_pickleball: "False", is_paddle: "False", requirements: "", ...extra },
  };
}
const win = (date: string, from: number, to: number, can: boolean, extra: Record<string, unknown> = {}) => ({
  title: can ? "Espacio Reservable" : extra.quota !== undefined ? "Espacio No Disponible" : "Espacio Reservado",
  can, category: can ? "Disponible" : "Reservado",
  start: `${date}T${String(from).padStart(2, "0")}:00:00`, end: `${date}T${String(to).padStart(2, "0")}:00:00`, ...extra,
});

/** Calendars per space kind, keyed by endowment id. Pools answer nothing without a lane, like the portal. */
export function spaceSchedule(id: number, params: URLSearchParams): { data: unknown[]; details: unknown } | null {
  if (id === 16893) {
    const lane = params.get("lane");
    if (!lane) return { data: [], details: details("PISCINA", { lane: "8" }) };
    const data = lane === "3"
      ? [win("2026-11-05", 7, 8, true, { quota: 12, used_quota: 9 }), win("2026-11-05", 8, 9, false, { quota: 12, used_quota: 12 }), win("2026-11-06", 6, 7, true, { quota: 12, used_quota: 0 })]
      : [win("2026-11-05", 7, 8, false, { quota: 12, used_quota: 12 }), win("2026-11-05", 9, 10, true, { quota: 12, used_quota: 2 })];
    return { data, details: details("PISCINA", { lane: "8" }) };
  }
  if (id === 16848) {
    return { data: [win("2026-11-05", 8, 16, true), win("2026-11-06", 8, 16, true), win("2026-11-06", 8, 16, false)], details: details("ASADERO", { is_grill: "True" }) };
  }
  if (id === 16892) {
    return { data: [win("2026-11-05", 12, 14, true), win("2026-11-05", 18, 20, true), win("2026-11-05", 18, 20, false)], details: details("POLIDEPORTIVO") };
  }
  if (id === 15227) {
    return { data: [win("2026-11-05", 6, 7, true, { quota: 15, used_quota: 11 }), win("2026-11-05", 7, 8, false, { quota: 15, used_quota: 15 })], details: details("OTRO(MÓDULO)") };
  }
  return null;
}

export const ACTIVITIES = [
  { id: 11338, program_name: "DEPORTE DE 0 A 100", activity_name: "FÚTBOL FEMENINO", stage_name: "VALLES DE CAFAM", park_code: "05-003", park_name: "VALLES DE CAFAM", park_address: "CALLE 92 SUR", weekday_name: "LUNES Y JUEVES", daily_name: "02:00 P.M. A 04:00 P.M.", min_age: 7, max_age: 17, quota: 30, is_paid: false, rate_id: null, rate_name: null, rate_value: null, is_initiate: true, start_date: "2026-05-28 10:00:00", final_date: "2026-12-31 23:00:00", is_activated: true, is_teams: false, disability: false, taken: 29, consent: [{ id: 5, name: "Consentimiento" }], regulations: [], program_id: 12, stage_id: 17 },
  { id: 12001, program_name: "DEPORTE DE 0 A 100 MENORES", activity_name: "NATACIÓN INICIACIÓN", stage_name: "CEFE SAN CRISTOBAL", park_code: "04-127", park_name: "SAN CRISTOBAL", park_address: "CL 1", weekday_name: "SÁBADOS", daily_name: "08:00 A.M. A 09:00 A.M.", min_age: 6, max_age: 12, quota: 10, is_paid: true, rate_id: 2, rate_name: "TARIFA", rate_value: 25000, is_initiate: true, start_date: "2026-11-01 00:00:00", final_date: "2026-12-31 23:00:00", is_activated: true, is_teams: false, disability: false, taken: 10, consent: [], regulations: [], program_id: 43, stage_id: 3 },
  { id: 12002, program_name: "DEPORTE DE 0 A 100 MENORES", activity_name: "ATLETISMO", stage_name: "CEFE TUNAL", park_code: "06-063", park_name: "EL TUNAL", park_address: "CL 2", weekday_name: "MARTES", daily_name: "04:00 P.M. A 05:00 P.M.", min_age: 8, max_age: 14, quota: 20, is_paid: false, rate_id: null, rate_name: null, rate_value: null, is_initiate: true, start_date: "2026-11-01 00:00:00", final_date: "2026-12-31 23:00:00", is_activated: true, is_teams: false, disability: false, taken: 3, consent: [], regulations: [], program_id: 43, stage_id: 1 },
];
export const PROFILES = [
  { id: 900, name: "Ana Ruiz", document: "123", age: 34, verified: true, profile_type_id: 1 },
  { id: 901, name: "Leo Ruiz", document: "456", age: 9, verified: true, profile_type_id: 2 },
];

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
  /** Court list served by the mock (default: COURTS.data). */
  courts?: Record<string, unknown>[];
  /** Max rows per page the mock will serve, ignoring a larger `per_page` (like a server that caps it). */
  courtPageCap?: number;
  loginStatus?: number;
  onCreate?: () => void;
  transferStatus?: number;
  /** client secret served by the mock web frontend */
  webSecret?: string;
  /** client secret the mock token endpoint accepts */
  acceptSecret?: string;
  membershipActive?: boolean;
  membershipAmount?: number;
  subscriptions?: Record<string, unknown>[];
  onSubscribe?: () => void;
  pending?: unknown[];
  payments?: unknown[];
  /** booking POST answers with the twin adult booking the portal creates for 5–12 year olds */
  adultBooking?: boolean;
};

// ---------------------------------------------------------------- CEFE Chapinero mock (cefechapinero.com backend)
export const CEFE_POOLS = [
  { poolId: "pool-sem", name: "Piscina Semiolímpica", description: "25 m", capacity: 30, pricePerHour: 0, isActive: true, schedules: [{ dayOfWeek: "Jueves", open: "06:00", close: "20:00" }] },
  { poolId: "pool-occ", name: "Piscina Recreativa Occidental", description: "niños", capacity: 20, pricePerHour: 0, isActive: true, schedules: [] },
  { poolId: "pool-ori", name: "Piscina Recreativa Oriental", description: "", capacity: 20, pricePerHour: 0, isActive: false, schedules: [] },
];
export const CEFE_SCHEDULE = {
  default: { slots: [{ time: "06:00", capacity: 30 }, { time: "07:15", capacity: 30 }, { time: "08:15", capacity: 30 }], isClosed: false },
  weekly: { MONDAY: { isClosed: true, slots: [] }, THURSDAY: { isClosed: false, slots: [{ time: "06:00", capacity: 30 }, { time: "07:15", capacity: 30 }, { time: "09:45", capacity: 10 }] } },
  overrides: [{ date: "2026-11-07", isClosed: false, slots: [{ time: "10:00", capacity: 5 }] }],
};
export const CEFE_COURSES = [
  { courseId: "a3d9fade-64c9-467e-b2d4-17653697ade7", name: "Curso Adultos Nivel 3", group: "Cursos de Natación", type: "course", description: "desc", duration: 60, numberOfClasses: 4, price: 85250, priceEstrato1_3: 80000, priceEstrato4_6: 85250, maxEnrollments: 10, maxEnrollmentsPerUser: 1, isFull: false, instructor: "No Aplica", poolId: "pool-sem", schedule: [{ day: "thursday", startTime: "06:00", endTime: "07:00" }], startDate: "2025-11-07", status: "ACTIVE" },
  { courseId: "28409344-0000-0000-0000-000000000000", name: "Hidrobiofilia", group: "Actividades", type: "activity", description: "x", duration: 60, numberOfClasses: 1, price: 12800, priceEstrato1_3: 12800, priceEstrato4_6: 12800, maxEnrollments: 20, maxEnrollmentsPerUser: 1, isFull: true, instructor: "", poolId: "pool-sem", schedule: [], startDate: "2025-11-07", status: "ACTIVE" },
];
export const CEFE_USER = { userId: "u-1", email: "ana@cefe.co", role: "client", name: "Ana Ruiz", phone: "3000000000", estrato: "3", dateOfBirth: "1990-01-01", identification: "123", documentType: "CC", credits: 0, reservasDisponibles: 0, dependents: [{ name: "Leo Ruiz", documentType: "TI", identification: "456", dateOfBirth: "2017-05-05", relationship: "hijo" }] };

export type CefeScenario = {
  user?: Record<string, unknown>;
  /** occupancy records returned by /pool-slots for 2026-11-05 */
  occupancy?: Array<{ date: string; capacity: number; reservedCount: number; status: string }>;
  reservations?: Record<string, unknown>[];
  loginStatus?: number;
  onCreate?: (body: unknown) => void;
  enrollments?: Record<string, unknown>[];
  classBookings?: Record<string, unknown>[];
};

export function mockCefe(sc: CefeScenario = {}) {
  const calls: Call[] = [];
  setFetch(cefeFetch(sc, calls));
  return calls;
}

/** Both backends at once, routed by host: the `find`/`book`/`providers` job commands talk to both. */
export function mockAll(scPortal: Scenario = {}, scCefe: CefeScenario = {}) {
  const calls: Call[] = [];
  const portal = portalFetch(scPortal, calls);
  const cefe = cefeFetch(scCefe, calls);
  setFetch(async (input, init) => (new URL(String(input)).host.includes("execute-api") ? cefe(input, init) : portal(input, init)));
  return calls;
}

function cefeFetch(sc: CefeScenario, calls: Call[]): FetchLike {
  const user = { ...CEFE_USER, ...(sc.user ?? {}) };
  return async (input, init) => {
    const url = new URL(String(input));
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    const headers = (init?.headers ?? {}) as Record<string, string>;
    calls.push({ method, url: url.pathname + url.search, body, auth: headers.Authorization ?? null });
    const json = (status: number, b: unknown) => new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json" } });
    const p = url.pathname.replace(/^\/main/, "");
    const authed = headers.Authorization === "Bearer cefe-tok";
    const needAuth = () => json(401, { message: "Debes iniciar sesión para continuar." });
    if (p === "/auth/login" && method === "POST") {
      if (sc.loginStatus && sc.loginStatus !== 200) return json(sc.loginStatus, { message: "Credenciales incorrectas" });
      if ((body as { email: string }).email !== "ana@cefe.co") return json(401, { message: "Credenciales incorrectas" });
      return json(200, { token: "cefe-tok", user });
    }
    if (p === "/auth/register" && method === "POST") return json(201, { token: "cefe-tok", user: { ...user, ...(body as object) } });
    if (p === "/pools") return json(200, CEFE_POOLS);
    if (/^\/pools\/[^/]+$/.test(p)) { const pool = CEFE_POOLS.find((x) => x.poolId === p.split("/")[2]); return pool ? json(200, pool) : json(404, { message: "no" }); }
    if (p.startsWith("/schedules/")) return json(200, CEFE_SCHEDULE);
    if (p === "/pool-slots") {
      if (!url.searchParams.get("date")) return json(500, { message: "Internal server error" });
      const date = url.searchParams.get("date");
      const occ = date === "2026-11-05" ? (sc.occupancy ?? [{ date: "2026-11-05T06:00:00", capacity: 30, reservedCount: 30, status: "OPEN" }, { date: "2026-11-05T07:15:00", capacity: 30, reservedCount: 12, status: "OPEN" }]) : [];
      return json(200, { slots: occ.map((o) => ({ ...o, poolId: url.searchParams.get("poolId"), __typename: "PoolSlots-main" })), count: occ.length });
    }
    if (p === "/courses") return json(200, CEFE_COURSES);
    if (/^\/courses\/[^/]+\/availability$/.test(p)) {
      const from = url.searchParams.get("startDate")!;
      return json(200, { courseId: p.split("/")[2], courseName: "Curso Adultos Nivel 3", maxEnrollments: 10, dates: [{ date: from, classes: from === "2026-11-05" ? [{ classDateTime: "2026-11-05T06:00:00", maxCapacity: 10, currentBookings: 3, availableSlots: 7, isAvailable: true }] : [] }] });
    }
    if (p === "/promotions") return json(200, [{ promotionId: "6ac48f53-x", name: "AquaGym", promotionType: "USAGE_PASS", status: "ACTIVE", visibility: "RESTRICTED", price: 50000, endDate: "2026-07-15T00:00:00.000Z", description: "Un mes" }]);
    if (p.startsWith("/ratings/pool/")) return json(200, { data: { overallAverage: 4.8, totalRatings: 110, npsScore: 66 } });
    // ---- authenticated
    if (!authed) return needAuth();
    if (p === "/users/u-1" && method === "GET") return json(200, user);
    if (p === "/users/u-1" && method === "PUT") return json(200, { ...user, ...(body as object) });
    if (p === "/users/u-1/reservas") return json(200, { reservations: (sc.reservations ?? []).filter((r) => !url.searchParams.get("date") || String(r.startTime).startsWith(url.searchParams.get("date")!)) });
    if (p === "/reservations" && method === "GET") return json(200, sc.reservations ?? []);
    if (p === "/reservations" && method === "POST") { sc.onCreate?.(body); return json(201, { ...(body as object), userId_uuid: "res-9", reservationId: "res-9" }); }
    if (p.startsWith("/reservations/") && method === "DELETE") return json(200, {});
    if (p === "/users/u-1/courses") return json(200, sc.enrollments ?? []);
    if (p === "/users/u-1/class-bookings" && method === "GET") return json(200, sc.classBookings ?? []);
    if (p === "/users/u-1/class-bookings" && method === "POST") return json(200, { success: true, booking: body });
    if (p === "/users/u-1/class-bookings" && method === "DELETE") return json(200, { success: true });
    if (/^\/courses\/[^/]+\/users\/u-1\/enroll$/.test(p) && method === "POST") return json(201, { enrolled: true, ...(body as object) });
    if (p === "/tournaments") return json(200, { data: [{ tournamentId: "t-1", name: "Festival", status: "registration_open", registrationCloseAt: "2026-12-01T00:00:00Z" }] });
    if (p === "/tournaments/t-1") return json(200, { data: { tournamentId: "t-1", name: "Festival", status: "registration_open" } });
    if (p === "/tournaments/t-1/competitions") return json(200, { data: [{ competitionId: "c-1", name: "50 m libre", category: "adultos" }] });
    if (p === "/tournaments/t-1/competitions/c-1/register") return json(200, { data: { registered: method === "POST" } });
    if (p === "/tournaments/my-registrations") return json(200, { data: [] });
    if (p === "/users/u-1/promotions") return json(200, []);
    return json(404, { message: "Not found" });
  };
}

export function mockPortal(sc: Scenario = {}) {
  const calls: Call[] = [];
  setFetch(portalFetch(sc, calls));
  return calls;
}

function portalFetch(sc: Scenario, calls: Call[]): FetchLike {
  return async (input, init) => {
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
    const paged = (rows: unknown[]) => {
      // Laravel paginator, like the real portal: 10 per page unless `per_page` says otherwise.
      const asked = Number(url.searchParams.get("per_page") ?? 10) || 10;
      const perPage = Math.min(asked, sc.courtPageCap ?? Number.MAX_SAFE_INTEGER);
      const page = Number(url.searchParams.get("page") ?? 1) || 1;
      const lastPage = Math.max(1, Math.ceil(rows.length / perPage));
      return json(200, { data: rows.slice((page - 1) * perPage, page * perPage), meta: { current_page: page, last_page: lastPage, per_page: perPage, total: rows.length } });
    };
    if (SPACES[p]) return paged(SPACES[p]!);
    if (p === "/api/parks/swimming-pool-lanes") return json(200, { data: url.searchParams.get("id_dotacion") === "16893" ? LANES : [] });
    if (p === "/api/parks/coliseum-sports") return json(200, { data: url.searchParams.get("id_dotacion") === "16892" ? COLISEUM_SPORTS : [] });
    // gym membership (auth)
    if (p.includes("/gym-membership/") || p === "/api/parks/gym-membership/active" || p.startsWith("/api/memberships/")) {
      if (!headers.Authorization) return json(401, { message: "No estás autenticado para esta solicitud." });
      if (p.endsWith("/status")) return json(200, { data: sc.membershipActive ? { id: 77, active: true, ends_at: "2026-12-03" } : { active: false } });
      if (p.endsWith("/quote")) return json(200, { data: { amount: sc.membershipAmount ?? 60000, valid_from: "2026-11-03", valid_to: "2026-12-03", park_id: 8585, service_id: 51, concept: "MENSUALIDAD GIMNASIO #15227" } });
      if (p.endsWith("/availability")) return json(200, { data: { availability: [{ date: "2026-11-05", slots: [{ start_hour: "6:00 AM", quota: 15, used: 11 }, { start_hour: "7:00 AM", quota: 15, used: 15 }] }] } });
      if (p.endsWith("/purchase") && method === "POST") return json(200, { data: (body as { init?: boolean })?.init ? { membership_id: 77 } : { activated: true } });
      if (p === "/api/parks/gym-membership/active") return json(200, { data: [] });
      if (p.endsWith("/reservations")) return json(200, { data: { items: [{ date: "2026-11-05" }], changes_this_week: 0 } });
    }
    // activities
    if (p === "/api/citizen-portal/public-schedules") {
      const programs = [...url.searchParams.entries()].filter(([k]) => k.startsWith("program_id")).map(([, v]) => Number(v));
      const stages = [...url.searchParams.entries()].filter(([k]) => k.startsWith("stage_id")).map(([, v]) => Number(v));
      return paged(ACTIVITIES.filter((a) => (!programs.length || programs.includes(a.program_id)) && (!stages.length || stages.includes(a.stage_id))));
    }
    if (p.startsWith("/api/citizen-portal/public-schedules/")) {
      const a = ACTIVITIES.find((x) => String(x.id) === p.split("/").pop());
      return a ? json(200, { data: a }) : json(404, { message: "No encontrado" });
    }
    if (p === "/api/citizen-portal/programs") return json(200, { data: [{ id: 12, name: "DEPORTE DE 0 A 100", schedules_count: 18 }, { id: 43, name: "DEPORTE DE 0 A 100 MENORES", schedules_count: 39 }] });
    if (p === "/api/citizen-portal/stages") return json(200, { data: [{ id: 1, name: "CEFE TUNAL", park_id: 9478, park_code: "06-063", park_name: "EL TUNAL", schedules_count: 1 }, { id: 3, name: "CEFE SAN CRISTOBAL", park_id: 8585, park_code: "04-127", park_name: "SAN CRISTOBAL", schedules_count: 1 }] });
    if (p === "/api/citizen-portal/schedules/categories") return json(200, { data: [{ name: "ATLETISMO PP", value: "ATLETISMO", icon: "mdi-run" }] });
    if (p === "/api/profiles/list" || p === "/api/profiles") return headers.Authorization ? json(200, { data: PROFILES }) : json(401, {});
    if (p === "/api/profiles/subscriptions" && method === "GET") return headers.Authorization ? json(200, { data: sc.subscriptions ?? [] }) : json(401, {});
    if (p.startsWith("/api/profiles/subscriptions/") && method === "DELETE") return headers.Authorization ? json(200, { data: "Eliminado" }) : json(401, {});
    if (/^\/api\/profiles\/\d+\/schedules\/\d+$/.test(p) && method === "POST") {
      if (!headers.Authorization) return json(401, {});
      sc.onSubscribe?.();
      return json(200, { data: "Preinscripción registrada", details: 5150 });
    }
    if (p === "/api/citizen-portal/pending-to-pay") return headers.Authorization ? json(200, { data: sc.pending ?? [] }) : json(401, {});
    if (p === "/api/citizen-portal/payments") return headers.Authorization ? paged(sc.payments ?? []) : json(401, {});
    if (p === "/api/parks/tennis-courts") {
      // Laravel paginator, like the real portal: 10 per page unless `per_page` says otherwise.
      const rows = sc.courts ?? COURTS.data;
      const asked = Number(url.searchParams.get("per_page") ?? 10) || 10;
      const perPage = Math.min(asked, sc.courtPageCap ?? Number.MAX_SAFE_INTEGER);
      const page = Number(url.searchParams.get("page") ?? 1) || 1;
      const lastPage = Math.max(1, Math.ceil(rows.length / perPage));
      return json(200, {
        data: rows.slice((page - 1) * perPage, page * perPage),
        meta: { current_page: page, last_page: lastPage, per_page: perPage, total: rows.length },
      });
    }
    if (p.startsWith("/api/parks/schedules/") && p.endsWith("/payment") && method === "POST") {
      sc.onCreate?.();
      return json(200, { data: { booking_id: 555, amount: sc.amount ?? 0, name: "Ana", surname: "Ruiz", phone: 300, email: "a@b.co", address: "Cl 1", document_type_id: "CE", document: "123", park_id: 10721, service_id: 9, concept: "Tenis", person_type_id: "N", created_at: "2099-01-01T00:00:00Z", ...(sc.adultBooking ? { is_beneficiary_booking: true, adult_booking_id: 556, adult_name: "Ana Ruiz" } : {}) } });
    }
    if (p.startsWith("/api/parks/schedules/")) {
      const id = Number(p.split("/")[4]);
      const sp = spaceSchedule(id, url.searchParams);
      return json(200, sp ?? schedule());
    }
    if (p.startsWith("/api/parks/") && p.endsWith("/details")) return json(200, { data: { id: 10721, name: "SAN ANDRES", code: "10-234", address: "CALLE 82", email: "x@idrd.gov.co", schedule_service: "Lunes a Domingo 6 AM - 10 PM", stratum: 3 } });
    if (p === "/oauth/token") {
      const accepted = sc.acceptSecret ?? sc.webSecret ?? "web-secret-1";
      if ((body as { client_secret?: string })?.client_secret !== accepted) return json(401, { error: "invalid_client", message: "Client authentication failed" });
      if (sc.loginStatus && sc.loginStatus !== 200) return json(sc.loginStatus, { error: "invalid_credentials" });
      return json(200, { token_type: "Bearer", expires_in: 28800, access_token: "tok-abc", refresh_token: "ref-xyz" });
    }
    if (p === "/api/user") return headers.Authorization ? json(200, { id: 1, name: "Ana Ruiz", email: "a@b.co", is_verified: true, has_profile: true, profile: { document: "123", document_type_id: "CE", name: "Ana", surname: "Ruiz", phone: 300, address: "Cl 1", person_type_id: "N" } }) : json(401, {});
    if (p === "/api/citizen-portal/bookings") return json(200, { data: [] });
    if (p === "/api/logout") return json(200, {});
    if (p === "/api/payment-gateway/banks") return json(200, { banks: [{ code: "0", name: "A continuación seleccione su banco" }, { code: "1007", name: "BANCOLOMBIA" }] });
    if (p === "/api/payment-gateway/transferBankFree") return sc.transferStatus ? json(sc.transferStatus, { message: "PSE caído" }) : json(200, { data: { payment: "FREE-1" } });
    if (p === "/api/payment-gateway/transferBank") return json(200, { data: { bank_url: "https://pse.example/pay?ref=PAY-1", payment: "PAY-1" } });
    return new Response("<html>404</html>", { status: 404 });
  };
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
  // Never touch the developer's real Keychain from the suite.
  process.env.CUPO_SECRETS = "file";
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
