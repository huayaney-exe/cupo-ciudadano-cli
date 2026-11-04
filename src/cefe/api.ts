import { fail } from "../core/errors.js";
import { HOSTS, request, upstreamMessage, type RequestOptions } from "../core/http.js";
import { cleanText } from "../core/sanitize.js";

/**
 * cefechapinero.com: a Next.js SPA over an AWS API Gateway ("Infracol").
 * Contract from the SPA's own service classes; see docs/recon-cefe.md.
 * Records are DynamoDB-shaped (`__typename`, `_version`); only the fields
 * the SPA reads are normalized here, the rest travels in `raw` where useful.
 */

type Res<T> = { status: number; body: T };

async function call<T>(path: string, opts: RequestOptions & { what: string }): Promise<T> {
  const { what, ...rest } = opts;
  const res = await request<T>(HOSTS.cefe, path, rest);
  return ensure(res, what);
}

function ensure<T>(res: Res<T>, what: string): T {
  const msg = () => upstreamMessage(res.body);
  if (res.status === 401) fail("auth/unauthorized", `${what}: ${msg() || "sesión requerida"}.`, "Corre `cupo cefe auth login`.");
  // API Gateway answers 403 "Missing Authentication Token" both for unknown routes and for protected ones.
  if (res.status === 403) fail("auth/forbidden", `${what}: el servidor rechazó la solicitud (${msg()}).`, "Inicia sesión con `cupo cefe auth login`; si persiste, la ruta cambió.");
  if (res.status === 404) fail("not-found/resource", `${what}: no existe.`, msg());
  if (res.status === 400 || res.status === 422) fail("upstream/validation", `${what}: el servidor rechazó los datos.`, msg());
  if (res.status >= 400) fail("upstream/error", `${what}: HTTP ${res.status}.`, msg());
  return res.body;
}

function arr<T = Record<string, any>>(body: unknown, key?: string): T[] {
  if (Array.isArray(body)) return body as T[];
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    for (const k of [key, "data", "items", "reservations", "courses", "enrollments", "bookings", "slots"].filter(Boolean) as string[]) {
      if (Array.isArray(b[k])) return b[k] as T[];
      if (b[k] && typeof b[k] === "object" && Array.isArray((b[k] as Record<string, unknown>).data)) return (b[k] as { data: T[] }).data;
    }
    if (b.data && typeof b.data === "object" && !Array.isArray(b.data)) return arr<T>(b.data, key);
  }
  return [];
}

// ---------------------------------------------------------------- auth

export type CefeUser = {
  userId: string;
  email: string;
  name: string;
  role: string;
  phone: string | null;
  estrato: string | null;
  dateOfBirth: string | null;
  identification: string | null;
  documentType: string | null;
  credits: number;
  reservasDisponibles: number;
  dependents: Array<{ name: string; documentType: string; identification: string; dateOfBirth?: string; relationship?: string }>;
  raw: Record<string, unknown>;
};

export function normalizeUser(u: Record<string, any>): CefeUser {
  const str = (v: unknown, n = 120) => (v === null || v === undefined || v === "" ? null : cleanText(v, n));
  return {
    userId: String(u.userId ?? u.id ?? ""),
    email: cleanText(u.email, 120),
    name: cleanText(u.name, 120),
    role: cleanText(u.role, 30),
    phone: str(u.phone, 30),
    estrato: str(u.estrato, 5),
    dateOfBirth: str(u.dateOfBirth, 30),
    identification: str(u.identification, 30),
    documentType: str(u.documentType, 10),
    credits: Number(u.credits ?? 0) || 0,
    reservasDisponibles: Number(u.reservasDisponibles ?? 0) || 0,
    dependents: Array.isArray(u.dependents)
      ? u.dependents.map((d: Record<string, unknown>) => ({
          name: cleanText(d.name, 120), documentType: cleanText(d.documentType, 10), identification: cleanText(d.identification, 30),
          ...(d.dateOfBirth ? { dateOfBirth: cleanText(d.dateOfBirth, 30) } : {}), ...(d.relationship ? { relationship: cleanText(d.relationship, 40) } : {}),
        }))
      : [],
    raw: u,
  };
}

export type LoginResult = { token: string; user: CefeUser };

export async function login(email: string, password: string): Promise<LoginResult> {
  const res = await request<Record<string, any>>(HOSTS.cefe, "/auth/login", { method: "POST", body: { email: email.trim().toLowerCase(), password } });
  if (res.status === 401 || res.status === 400) fail("auth/invalid-credentials", "Correo o contraseña incorrectos.", "Verifica tus datos en cefechapinero.com/login.");
  const body = ensure(res, "Login");
  if (typeof body?.token !== "string" || !body?.user) fail("auth/bad-response", "El servidor no devolvió un token.");
  return { token: body.token, user: normalizeUser(body.user) };
}

export type RegisterRequest = {
  name: string; email: string; password: string; phone: string; identification: string; documentType: string; role: "client"; aceptaHabeasData: true;
};

export async function register(body: RegisterRequest): Promise<LoginResult> {
  const res = await request<Record<string, any>>(HOSTS.cefe, "/auth/register", { method: "POST", body });
  const out = ensure(res, "Registro");
  if (typeof out?.token !== "string" || !out?.user) fail("auth/bad-response", "El servidor no devolvió un token tras registrar.", upstreamMessage(out));
  return { token: out.token, user: normalizeUser(out.user) };
}

export async function getUser(token: string, userId: string): Promise<CefeUser> {
  const body = await call<Record<string, any>>(`/users/${encodeURIComponent(userId)}`, { token, what: "Perfil" });
  return normalizeUser(body?.user ?? body?.data ?? body);
}

export async function updateUser(token: string, userId: string, patch: Record<string, unknown>): Promise<unknown> {
  return call(`/users/${encodeURIComponent(userId)}`, { method: "PUT", token, body: patch, what: "Actualizar perfil" });
}

export async function forgotPassword(email: string): Promise<void> {
  await call("/auth/forgot-password", { method: "POST", body: { email }, what: "Recuperar contraseña" });
}

// ---------------------------------------------------------------- pools

export type Pool = {
  poolId: string; name: string; description: string; capacity: number; pricePerHour: number; active: boolean;
  hours: Array<{ day: string; open: string; close: string }>;
};

function normalizePool(p: Record<string, any>): Pool {
  return {
    poolId: String(p.poolId ?? p.id),
    name: cleanText(p.name, 120),
    description: cleanText(p.description, 200),
    capacity: Number(p.capacity ?? 0),
    pricePerHour: Number(p.pricePerHour ?? 0),
    active: Boolean(p.isActive ?? p.active ?? true),
    hours: Array.isArray(p.schedules) ? p.schedules.map((s: Record<string, unknown>) => ({ day: cleanText(s.dayOfWeek, 20), open: cleanText(s.open, 5), close: cleanText(s.close, 5) })) : [],
  };
}

export async function listPools(): Promise<Pool[]> {
  const body = await call<unknown>("/pools", { what: "Piscinas" });
  return arr(body, "pools").map(normalizePool);
}

export async function getPool(poolId: string): Promise<Pool> {
  const body = await call<Record<string, any>>(`/pools/${encodeURIComponent(poolId)}`, { what: `Piscina ${poolId}` });
  return normalizePool(body?.data ?? body);
}

export type SlotConfig = { slots: Array<{ time: string; capacity: number }>; isClosed: boolean };
export type ScheduleConfig = { default?: SlotConfig; weekly?: Record<string, SlotConfig>; overrides?: Array<SlotConfig & { date: string }> };

export async function getScheduleConfig(poolId: string): Promise<ScheduleConfig> {
  const body = await call<Record<string, any>>(`/schedules/${encodeURIComponent(poolId)}`, { what: "Configuración de horarios" });
  const cfg = (body?.data ?? body ?? {}) as Record<string, any>;
  const norm = (c: Record<string, any> | undefined): SlotConfig | undefined =>
    c ? { isClosed: Boolean(c.isClosed), slots: Array.isArray(c.slots) ? c.slots.map((s: Record<string, unknown>) => ({ time: cleanText(s.time, 5), capacity: Number(s.capacity ?? c.defaultCapacity ?? 0) })) : [] } : undefined;
  const weekly: Record<string, SlotConfig> = {};
  for (const [k, v] of Object.entries(cfg.weekly ?? {})) { const n = norm(v as Record<string, any>); if (n) weekly[k.toUpperCase()] = n; }
  const overrides = Array.isArray(cfg.overrides)
    ? cfg.overrides.map((o: Record<string, any>) => ({ ...(norm(o) as SlotConfig), date: cleanText(o.date, 10) }))
    : Object.entries(cfg.overrides ?? {}).map(([date, o]) => ({ ...(norm(o as Record<string, any>) as SlotConfig), date }));
  return { default: norm(cfg.default), weekly, overrides };
}

export type PoolSlotRecord = { start: string; capacity: number; reserved: number; status: string };

export async function getPoolSlots(poolId: string, date: string): Promise<PoolSlotRecord[]> {
  const body = await call<unknown>("/pool-slots", { query: { poolId, date }, what: "Cupos" });
  return arr(body, "slots").map((s) => ({ start: cleanText(s.date, 19), capacity: Number(s.capacity ?? 0), reserved: Number(s.reservedCount ?? 0), status: cleanText(s.status, 10) }));
}

// ---------------------------------------------------------------- reservations

export type Reservation = {
  id: string; poolId: string; poolName: string; startTime: string; endTime: string; status: string;
  price: number; paymentMethod: string | null; paymentStatus: string | null; wompiReference: string | null; notes: string;
  dependents: number; raw: Record<string, unknown>;
};

export function normalizeReservation(r: Record<string, any>): Reservation {
  const uuid = r.userId_uuid ?? r.reservationId ?? r.id;
  return {
    id: r.poolId && uuid ? `${r.poolId}_${uuid}` : String(uuid ?? ""),
    poolId: String(r.poolId ?? ""),
    poolName: cleanText(r.poolName, 120),
    startTime: cleanText(r.startTime, 25),
    endTime: cleanText(r.endTime, 25),
    status: cleanText(r.status, 20),
    price: Number(r.price ?? 0) || 0,
    paymentMethod: r.paymentMethod ? cleanText(r.paymentMethod, 20) : null,
    paymentStatus: r.statusPayment ? cleanText(r.statusPayment, 30) : null,
    wompiReference: r.wompiReference ? cleanText(r.wompiReference, 80) : null,
    notes: cleanText(r.notes, 300),
    dependents: Array.isArray(r.dependents) ? r.dependents.length : 0,
    raw: r,
  };
}

export async function userReservations(token: string, userId: string): Promise<Reservation[]> {
  const body = await call<unknown>("/reservations", { token, query: { userId }, what: "Reservas" });
  return arr(body, "reservations").map(normalizeReservation);
}

export async function userReservationsByDate(token: string, userId: string, date: string): Promise<Reservation[]> {
  const body = await call<unknown>(`/users/${encodeURIComponent(userId)}/reservas`, { token, query: { date }, what: "Reservas del día" });
  return arr(body, "reservations").map(normalizeReservation);
}

export async function userReservationsRange(token: string, userId: string, startDate: string, endDate: string, status?: string): Promise<Reservation[]> {
  const body = await call<unknown>(`/users/${encodeURIComponent(userId)}/reservas`, { token, query: { startDate, endDate, status }, what: "Reservas" });
  return arr(body, "reservations").map(normalizeReservation);
}

export type ReservationRequest = {
  poolId: string; poolName: string; poolImage: string; userId: string; email: string;
  startTime: string; endTime: string; status: "pending" | "confirmed"; notes: string; price: number;
  paymentMethod?: "WOMPI" | "EFECTIVO" | "CREDITOS";
  dependents?: Array<{ name: string; documentType: string; identification: string; dateOfBirth?: string; relationship?: string }>;
};

export async function createReservation(token: string, body: ReservationRequest): Promise<Record<string, unknown>> {
  const out = await call<Record<string, any>>("/reservations", { method: "POST", token, body, what: "Crear reserva" });
  return (out?.data ?? out ?? {}) as Record<string, unknown>;
}

export async function cancelReservation(token: string, reservationId: string): Promise<void> {
  await call(`/reservations/${encodeURIComponent(reservationId)}`, { method: "DELETE", token, what: "Cancelar reserva" });
}

export async function updateReservation(token: string, reservationId: string, patch: Record<string, unknown>): Promise<unknown> {
  return call(`/reservations/${encodeURIComponent(reservationId)}`, { method: "PUT", token, body: patch, what: "Actualizar reserva" });
}

// ---------------------------------------------------------------- courses & classes

export type Course = {
  courseId: string; name: string; group: string; type: string; description: string; durationMin: number; classes: number;
  price: number; priceEstrato1_3: number; priceEstrato4_6: number; maxEnrollments: number; maxPerUser: number; full: boolean;
  instructor: string; poolId: string; schedule: Array<{ day: string; start: string; end: string }>; startDate: string; status: string;
};

function normalizeCourse(c: Record<string, any>): Course {
  return {
    courseId: String(c.courseId ?? c.id),
    name: cleanText(c.name, 120),
    group: cleanText(c.group, 80),
    type: cleanText(c.type, 20),
    description: cleanText(c.description, 600),
    durationMin: Number(c.duration ?? 0),
    classes: Number(c.numberOfClasses ?? 0),
    price: Number(c.price ?? 0),
    priceEstrato1_3: Number(c.priceEstrato1_3 ?? c.price ?? 0),
    priceEstrato4_6: Number(c.priceEstrato4_6 ?? c.price ?? 0),
    maxEnrollments: Number(c.maxEnrollments ?? 0),
    maxPerUser: Number(c.maxEnrollmentsPerUser ?? 0),
    full: Boolean(c.isFull),
    instructor: cleanText(c.instructor, 80),
    poolId: String(c.poolId ?? ""),
    schedule: Array.isArray(c.schedule) ? c.schedule.map((s: Record<string, unknown>) => ({ day: cleanText(s.day, 12), start: cleanText(s.startTime, 5), end: cleanText(s.endTime, 5) })) : [],
    startDate: cleanText(c.startDate, 25),
    status: cleanText(c.status, 20),
  };
}

export async function listCourses(status?: string): Promise<Course[]> {
  const body = await call<unknown>("/courses", { query: { status }, what: "Cursos" });
  return arr(body, "courses").map(normalizeCourse);
}

export type ClassAvailability = { date: string; classes: Array<{ at: string; capacity: number; booked: number; free: number; available: boolean }> };

export async function courseAvailability(courseId: string, startDate: string, endDate: string): Promise<{ courseName: string; dates: ClassAvailability[] }> {
  const body = await call<Record<string, any>>(`/courses/${encodeURIComponent(courseId)}/availability`, { query: { startDate, endDate }, what: "Disponibilidad del curso" });
  const d = (body?.data ?? body ?? {}) as Record<string, any>;
  return {
    courseName: cleanText(d.courseName, 120),
    dates: (Array.isArray(d.dates) ? d.dates : []).map((x: Record<string, any>) => ({
      date: cleanText(x.date, 10),
      classes: (Array.isArray(x.classes) ? x.classes : []).map((c: Record<string, any>) => ({
        at: cleanText(c.classDateTime, 19), capacity: Number(c.maxCapacity ?? 0), booked: Number(c.currentBookings ?? 0), free: Number(c.availableSlots ?? 0), available: Boolean(c.isAvailable),
      })),
    })),
  };
}

export async function userCourses(token: string, userId: string): Promise<Record<string, any>[]> {
  return arr(await call<unknown>(`/users/${encodeURIComponent(userId)}/courses`, { token, what: "Mis cursos" }), "courses");
}

export async function enroll(token: string, courseId: string, userId: string, body: { status: "PENDING"; paymentType: "CASH" | "WOMPI"; paymentStatus: "PENDING"; coursePrice: number; wompiReference?: string }): Promise<unknown> {
  return call(`/courses/${encodeURIComponent(courseId)}/users/${encodeURIComponent(userId)}/enroll`, { method: "POST", token, body, what: "Inscripción al curso" });
}

/** Path inferred from the SPA's `updateUserCourse`; used to cancel an enrolment. Unverified live. */
export async function updateUserCourse(token: string, courseId: string, userId: string, patch: Record<string, unknown>): Promise<unknown> {
  return call(`/courses/${encodeURIComponent(courseId)}/users/${encodeURIComponent(userId)}`, { method: "PUT", token, body: patch, what: "Actualizar inscripción" });
}

export async function classBookings(token: string, userId: string, filter: { courseId?: string; status?: string; startDate?: string; endDate?: string } = {}): Promise<Record<string, any>[]> {
  return arr(await call<unknown>(`/users/${encodeURIComponent(userId)}/class-bookings`, { token, query: filter, what: "Mis clases" }), "bookings");
}

export async function bookClass(token: string, userId: string, courseId: string, classDateTime: string): Promise<Record<string, unknown>> {
  const out = await call<Record<string, any>>(`/users/${encodeURIComponent(userId)}/class-bookings`, { method: "POST", token, body: { courseId, classDateTime, status: "CONFIRMED" }, what: "Reservar clase" });
  if (out && out.success === false) fail("upstream/validation", `Reservar clase: ${cleanText(out.message, 200) || "rechazada"}.`);
  return (out ?? {}) as Record<string, unknown>;
}

export async function cancelClass(token: string, userId: string, courseId: string, classDateTime: string): Promise<void> {
  await call(`/users/${encodeURIComponent(userId)}/class-bookings`, { method: "DELETE", token, body: { courseId, classDateTime }, what: "Cancelar clase" });
}

// ---------------------------------------------------------------- tournaments, promotions, ratings

export async function listTournaments(token: string, status?: string): Promise<Record<string, any>[]> {
  return arr(await call<unknown>("/tournaments", { token, query: { status }, what: "Torneos" }), "tournaments");
}
export async function getTournament(token: string, id: string): Promise<Record<string, any>> {
  const b = await call<Record<string, any>>(`/tournaments/${encodeURIComponent(id)}`, { token, what: `Torneo ${id}` });
  return (b?.data ?? b ?? {}) as Record<string, any>;
}
export async function competitions(token: string, id: string): Promise<Record<string, any>[]> {
  return arr(await call<unknown>(`/tournaments/${encodeURIComponent(id)}/competitions`, { token, what: "Competiciones" }), "competitions");
}
export async function registerCompetition(token: string, t: string, c: string, body: { dependentIdentification?: string; sex?: string; observation?: string }): Promise<unknown> {
  return call(`/tournaments/${encodeURIComponent(t)}/competitions/${encodeURIComponent(c)}/register`, { method: "POST", token, body, what: "Inscripción al torneo" });
}
export async function unregisterCompetition(token: string, t: string, c: string, dependentIdentification?: string): Promise<void> {
  await call(`/tournaments/${encodeURIComponent(t)}/competitions/${encodeURIComponent(c)}/register`, { method: "DELETE", token, body: dependentIdentification ? { dependentIdentification } : {}, what: "Cancelar inscripción" });
}
export async function myRegistrations(token: string): Promise<Record<string, any>[]> {
  return arr(await call<unknown>("/tournaments/my-registrations", { token, what: "Mis inscripciones" }), "registrations");
}
export async function listPromotions(status?: string): Promise<Record<string, any>[]> {
  return arr(await call<unknown>("/promotions", { query: { status }, what: "Promociones" }), "promotions");
}
export async function userPromotions(token: string, userId: string): Promise<Record<string, any>[]> {
  return arr(await call<unknown>(`/users/${encodeURIComponent(userId)}/promotions`, { token, what: "Mis promociones" }), "promotions");
}
export async function poolRatingSummary(poolId: string): Promise<Record<string, unknown>> {
  const b = await call<Record<string, any>>(`/ratings/pool/${encodeURIComponent(poolId)}/summary/public`, { what: "Calificaciones" });
  return (b?.data ?? b ?? {}) as Record<string, unknown>;
}
