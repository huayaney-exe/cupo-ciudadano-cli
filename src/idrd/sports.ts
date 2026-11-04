import { fail } from "../core/errors.js";

/**
 * Every bookable space in the portal, not only courts. All of them share the
 * same list shape (Laravel paginator of park endowments) and the same
 * `/api/parks/schedules/{id}` calendar; they differ in what the calendar
 * needs (a lane, a sport) and in how availability is counted.
 */
export type Sport = "tennis" | "padel" | "pickleball" | "synthetic" | "natural" | "pool" | "grill" | "gym" | "coliseum";

export type SpaceSpec = {
  path: string;
  label: string;
  /** Singular and plural nouns for human output. */
  noun: string;
  plural: string;
  /** `exclusive`: one booking per hour. `quota`: N people per hour (pools, gyms). */
  capacity: "exclusive" | "quota";
  /** What the calendar and the booking need besides date and hours. */
  needs?: "lane" | "sport";
  /** Booked as whole published blocks (e.g. grills 8 AM–4 PM), not by the hour. */
  block?: boolean;
};

export const SPORTS: Record<Sport, SpaceSpec> = {
  tennis: { path: "/api/parks/tennis-courts", label: "Tenis", noun: "cancha", plural: "canchas", capacity: "exclusive" },
  padel: { path: "/api/parks/paddle-courts", label: "Pádel", noun: "cancha", plural: "canchas", capacity: "exclusive" },
  pickleball: { path: "/api/parks/pickleball-courts", label: "Pickleball", noun: "cancha", plural: "canchas", capacity: "exclusive" },
  synthetic: { path: "/api/parks/synthetic-fields", label: "Fútbol sintético", noun: "cancha", plural: "canchas", capacity: "exclusive" },
  natural: { path: "/api/parks/natural-soccer-fields", label: "Fútbol natural", noun: "cancha", plural: "canchas", capacity: "exclusive" },
  pool: { path: "/api/parks/swimming-pools", label: "Piscinas", noun: "piscina", plural: "piscinas", capacity: "quota", needs: "lane" },
  grill: { path: "/api/parks/grills", label: "Asadores", noun: "asador", plural: "asadores", capacity: "exclusive", block: true },
  gym: { path: "/api/parks/gyms", label: "Gimnasios", noun: "gimnasio", plural: "gimnasios", capacity: "quota" },
  coliseum: { path: "/api/parks/coliseum", label: "Coliseos", noun: "coliseo", plural: "coliseos", capacity: "exclusive", needs: "sport" },
};

export const COURT_SPORTS: Sport[] = ["tennis", "padel", "pickleball", "synthetic", "natural"];
export const ALL_SPORTS = Object.keys(SPORTS) as Sport[];

const ALIASES: Record<string, Sport> = {
  tennis: "tennis", tenis: "tennis",
  padel: "padel", pádel: "padel", paddle: "padel",
  pickleball: "pickleball", pickle: "pickleball",
  synthetic: "synthetic", sintetica: "synthetic", sintética: "synthetic", sinteticas: "synthetic", futbol: "synthetic",
  natural: "natural", naturales: "natural",
  pool: "pool", pools: "pool", piscina: "pool", piscinas: "pool", natacion: "pool", natación: "pool",
  grill: "grill", grills: "grill", asador: "grill", asadores: "grill", asadero: "grill", asaderos: "grill", bbq: "grill",
  gym: "gym", gyms: "gym", gimnasio: "gym", gimnasios: "gym",
  coliseum: "coliseum", coliseo: "coliseum", coliseos: "coliseum", polideportivo: "coliseum",
};

export function parseSport(input: string | undefined): Sport {
  if (!input) return "tennis";
  const s = ALIASES[input.trim().toLowerCase()];
  if (!s) fail("usage/bad-sport", `Tipo de espacio desconocido: ${input}.`, `Opciones: ${ALL_SPORTS.join(", ")}.`);
  return s;
}

/**
 * The calendar response names the endowment type the way the portal's own
 * booking screen reads it; this is how the SPA decides which form to show.
 */
export function sportFromEndowment(kind: string, hints: { isPickleball?: boolean; isPaddle?: boolean; isGrill?: boolean } = {}): Sport {
  const k = kind.trim().toUpperCase();
  if (k === "PISCINA") return "pool";
  if (k === "ASADERO" || hints.isGrill) return "grill";
  if (k === "OTRO(MÓDULO)" || k === "OTRO(MODULO)") return "gym";
  if (k === "POLIDEPORTIVO") return "coliseum";
  if (hints.isPickleball) return "pickleball";
  if (hints.isPaddle) return "padel";
  if (k.includes("TENNIS") || k.includes("TENIS")) return "tennis";
  if (k.includes("NATURAL")) return "natural";
  return "synthetic";
}

/** The CEFE pools: beneficiaries aged 5–12 need a responsible adult; the portal creates two bookings. */
export const CEFE_POOL_IDS = new Set([16893, 17256, 17082, 18181, 12499]);
