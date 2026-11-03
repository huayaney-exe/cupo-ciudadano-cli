import { fail } from "../core/errors.js";

export type Sport = "tennis" | "padel" | "pickleball" | "synthetic" | "natural";

export const SPORTS: Record<Sport, { path: string; label: string }> = {
  tennis: { path: "/api/parks/tennis-courts", label: "Tenis" },
  padel: { path: "/api/parks/paddle-courts", label: "Pádel" },
  pickleball: { path: "/api/parks/pickleball-courts", label: "Pickleball" },
  synthetic: { path: "/api/parks/synthetic-fields", label: "Fútbol sintético" },
  natural: { path: "/api/parks/natural-soccer-fields", label: "Fútbol natural" },
};

const ALIASES: Record<string, Sport> = {
  tennis: "tennis", tenis: "tennis",
  padel: "padel", pádel: "padel", paddle: "padel",
  pickleball: "pickleball", pickle: "pickleball",
  synthetic: "synthetic", sintetica: "synthetic", sintética: "synthetic", sinteticas: "synthetic", futbol: "synthetic",
  natural: "natural", naturales: "natural",
};

export function parseSport(input: string | undefined): Sport {
  if (!input) return "tennis";
  const s = ALIASES[input.trim().toLowerCase()];
  if (!s) fail("usage/bad-sport", `Deporte desconocido: ${input}.`, `Opciones: ${Object.keys(SPORTS).join(", ")}.`);
  return s;
}
