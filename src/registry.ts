/**
 * Single source of truth for the command surface. `idrd help` and
 * `idrd schema` are both generated from this table, so they cannot drift.
 */
export type Trust = "T0" | "T1" | "T2" | "T3";

export type CommandSpec = {
  name: string;
  summary: string;
  args?: Array<{ name: string; description: string }>;
  flags?: Array<{ flag: string; description: string }>;
  trust: Trust;
  auth: boolean;
  output: string;
  examples?: string[];
};

export const COMMANDS: CommandSpec[] = [
  {
    name: "court list",
    summary: "Lista canchas de un deporte (por defecto solo las reservables).",
    flags: [
      { flag: "--sport <tennis|padel|pickleball|synthetic|natural>", description: "Deporte (default tennis)" },
      { flag: "--locality <texto>", description: "Filtra por localidad (ej. usaquen)" },
      { flag: "--all", description: "Incluye canchas no reservables en línea" },
    ],
    trust: "T0", auth: false,
    output: "Court[] {id, parkId, parkName, parkCode, address, locality, upz, sport, description, bookable}",
    examples: ["idrd court list", "idrd court list --sport padel"],
  },
  {
    name: "court get",
    summary: "Detalle de una cancha: parque, horario de servicio, superficie, reglas de uso.",
    args: [{ name: "id", description: "id de la cancha (park_endowment_id)" }],
    trust: "T0", auth: false,
    output: "{court, park, endowment{kind,status,surface,lighting,rules}}",
    examples: ["idrd court get 11537"],
  },
  {
    name: "slot list",
    summary: "Horas de una cancha en una fecha, con disponibilidad real (reservable menos reservado).",
    args: [{ name: "id", description: "id de la cancha" }],
    flags: [
      { flag: "--date <YYYY-MM-DD|hoy|mañana|lun..dom>", description: "Fecha (default hoy)" },
      { flag: "--free", description: "Solo horas libres" },
    ],
    trust: "T0", auth: false,
    output: "{courtId, date, weekDates[], slots: HourSlot[] {hour,start,end,available}, freeRuns}",
    examples: ["idrd slot list 11537 --date vie --free"],
  },
  {
    name: "slot find",
    summary: "Busca horas libres en todas las canchas de un deporte. Atajo: `idrd find`.",
    flags: [
      { flag: "--date <fecha>", description: "Fecha (default mañana)" },
      { flag: "--sport <deporte>", description: "Deporte (default tennis)" },
      { flag: "--from <hora>", description: "Desde esta hora, ej. 6 (default 0)" },
      { flag: "--to <hora>", description: "Hasta esta hora, ej. 9 (default 24)" },
      { flag: "--locality <texto>", description: "Filtra por localidad" },
    ],
    trust: "T0", auth: false,
    output: "{date, sport, window, results: [{court, freeHours[]}], scanned, failed[]}",
    examples: ["idrd find --date mie --from 6 --to 9"],
  },
  {
    name: "auth login",
    summary: "Inicia sesión (OAuth del portal). Guarda solo el token y tu correo; nunca la contraseña.",
    flags: [
      { flag: "--email <correo>", description: "Correo de tu cuenta (se recuerda)" },
      { flag: "--password-stdin", description: "Lee la contraseña de stdin (o usa IDRD_PASSWORD)" },
    ],
    trust: "T1", auth: false,
    output: "{email, expiresAt, refreshable, user{id,name,verified,hasProfile}}",
    examples: ["idrd auth login --email yo@correo.com", "IDRD_PASSWORD=… idrd auth login --email yo@correo.com --json"],
  },
  { name: "auth status", summary: "Estado de la sesión, con una llamada real al portal.", trust: "T0", auth: false, output: "{loggedIn, email, expiresAt, expired, refreshable, user?}" },
  { name: "auth logout", summary: "Cierra sesión en el portal y borra el token local.", trust: "T1", auth: true, output: "{loggedOut}" },
  {
    name: "booking list",
    summary: "Tus reservas en el portal, más las creadas desde este equipo.",
    trust: "T0", auth: true,
    output: "{remote: object[], local: BookingRecord[]}",
  },
  {
    name: "booking create",
    summary: "Reserva una cancha. Sin --yes solo muestra la vista previa. Las reservas NO se pueden cancelar.",
    args: [{ name: "id", description: "id de la cancha" }],
    flags: [
      { flag: "--date <fecha>", description: "Fecha de la reserva" },
      { flag: "--hour <hora>", description: "Hora de inicio, ej. 6 o \"6:00 AM\"" },
      { flag: "--hours <1|2>", description: "Duración (máx. 2, default 1)" },
      { flag: "--bank <código>", description: "Si cobra: genera de una vez el link PSE con este banco" },
      { flag: "--yes --confirm <intent>", description: "Ejecuta. <intent> lo imprime la vista previa" },
      { flag: "--dry-run", description: "Fuerza vista previa aunque pases --yes" },
    ],
    trust: "T3", auth: true,
    output: "preview: {dryRun:true, intent, request, checks[]} | live: {booking: BookingRecord, payment?}",
    examples: ["idrd booking create 11537 --date vie --hour 6", "idrd booking create 11537 --date vie --hour 6 --yes --confirm 11537@2026-11-06T06x1"],
  },
  { name: "pay banks", summary: "Bancos disponibles en PSE.", trust: "T0", auth: false, output: "Bank[] {code, name}" },
  {
    name: "pay pse",
    summary: "Genera el link de pago PSE (bank_url) de una reserva creada desde este equipo.",
    args: [{ name: "bookingId", description: "id devuelto por booking create" }],
    flags: [
      { flag: "--bank <código>", description: "Banco (ver `idrd pay banks`)" },
      { flag: "--yes", description: "Confirma la creación de la orden de pago" },
      { flag: "--open", description: "Abre el link en el navegador" },
    ],
    trust: "T2", auth: true,
    output: "{bookingId, amount, bankUrl, paymentCode}",
  },
  {
    name: "pay status",
    summary: "Estado de un pago PSE.",
    args: [{ name: "code", description: "código de pago" }],
    trust: "T0", auth: true,
    output: "object (respuesta del portal)",
  },
  { name: "doctor", summary: "Diagnóstico: red, portal, sesión, killswitch, entorno.", trust: "T0", auth: false, output: "{ok, checks: {name, ok, detail}[]}" },
  { name: "killswitch", summary: "on|off|status — bloquea toda escritura (reservas y pagos).", args: [{ name: "on|off|status", description: "acción" }], trust: "T1", auth: false, output: "{active, reason?, activatedAt?}" },
  { name: "schema", summary: "Contrato de comandos en JSON (versionado) para agentes.", trust: "T0", auth: false, output: "{schemaVersion, cli, version, exitCodes, commands[]}" },
];

export const GLOBAL_FLAGS = [
  { flag: "--json", description: "Salida JSON (automática si stdout no es una terminal)" },
  { flag: "--profile <nombre>", description: "Cuenta/perfil (default \"default\")" },
  { flag: "--no-input", description: "Nunca preguntar; fallar si falta algo" },
  { flag: "-q, --quiet", description: "Sin diagnósticos ni próximos pasos" },
];

export function findCommand(words: string[]): { spec: CommandSpec; rest: string[] } | null {
  for (const n of [2, 1]) {
    const name = words.slice(0, n).join(" ");
    const spec = COMMANDS.find((c) => c.name === name);
    if (spec) return { spec, rest: words.slice(n) };
  }
  return null;
}
