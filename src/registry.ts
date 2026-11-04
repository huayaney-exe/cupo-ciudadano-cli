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
    summary: "Lista espacios reservables de un tipo: canchas, piscinas, asadores, gimnasios, coliseos (por defecto solo los reservables en línea). Alias: `idrd space list`.",
    flags: [
      { flag: "--sport <tennis|padel|pickleball|synthetic|natural|pool|grill|gym|coliseum>", description: "Tipo de espacio (default tennis)" },
      { flag: "--locality <texto>", description: "Filtra por localidad (ej. usaquen)" },
      { flag: "--all", description: "Incluye canchas no reservables en línea" },
    ],
    trust: "T0", auth: false,
    output: "Court[] {id, parkId, parkName, parkCode, address, locality, upz, sport, description, bookable}",
    examples: ["idrd court list", "idrd court list --sport padel", "idrd court list --sport pool --all"],
  },
  {
    name: "court get",
    summary: "Detalle de un espacio: tipo, parque, horario de servicio, superficie, reglas; carriles (piscinas) o deportes (coliseos).",
    args: [{ name: "id", description: "id del espacio (park_endowment_id)" }],
    trust: "T0", auth: false,
    output: "{court, kind, park, endowment{kind,sport,status,surface,lighting,lanes,rules}, lanes[], sports[]}",
    examples: ["idrd court get 11537", "idrd court get 16893"],
  },
  {
    name: "court lanes",
    summary: "Carriles de una piscina (las piscinas se consultan y reservan por carril).",
    args: [{ name: "id", description: "id de la piscina" }],
    trust: "T0", auth: false,
    output: "Lane[] {id, name, level, direction, quota, poolId, enabled}",
    examples: ["idrd court lanes 16893"],
  },
  {
    name: "court sports",
    summary: "Deportes que admite un coliseo (el id va en --sport-id al consultar y reservar).",
    args: [{ name: "id", description: "id del coliseo" }],
    trust: "T0", auth: false,
    output: "ColiseumSport[] {id, name}",
    examples: ["idrd court sports 16892"],
  },
  {
    name: "slot list",
    summary: "Horas de un espacio en una fecha, con disponibilidad real (reservable menos reservado; cupos en piscinas y gimnasios; bloques en asadores).",
    args: [{ name: "id", description: "id del espacio" }],
    flags: [
      { flag: "--date <YYYY-MM-DD|hoy|mañana|lun..dom>", description: "Fecha (default hoy)" },
      { flag: "--free", description: "Solo horas libres" },
      { flag: "--lane <id>", description: "Piscinas: carril (obligatorio; ver `court lanes`)" },
      { flag: "--sport-id <id>", description: "Coliseos: deporte (ver `court sports`)" },
      { flag: "--document <doc>", description: "CEFE: documento del beneficiario (filtra su calendario)" },
    ],
    trust: "T0", auth: false,
    output: "{courtId, kind, lane, sportId, date, weekDates[], slots: HourSlot[] {hour,start,end,available,quota?,used?}, blocks: [{from,to,available}], freeRuns}",
    examples: ["idrd slot list 11537 --date vie --free", "idrd slot list 16893 --lane 3 --date sab", "idrd slot list 16892 --sport-id 3 --date dom"],
  },
  {
    name: "slot find",
    summary: "Busca horas libres en todos los espacios de un tipo (piscinas: en todos sus carriles). Atajo: `idrd find`.",
    flags: [
      { flag: "--date <fecha>", description: "Fecha (default mañana)" },
      { flag: "--sport <tipo>", description: "Tipo de espacio (default tennis)" },
      { flag: "--from <hora>", description: "Desde esta hora, ej. 6 (default 0)" },
      { flag: "--to <hora>", description: "Hasta esta hora, ej. 9 (default 24)" },
      { flag: "--locality <texto>", description: "Filtra por localidad o parque" },
      { flag: "--sport-id <id>", description: "Coliseos: deporte" },
    ],
    trust: "T0", auth: false,
    output: "{date, sport, window, results: [{court, lane?, freeHours[], places?}], scanned, spaces, failed[]}",
    examples: ["idrd find --date mie --from 6 --to 9", "idrd find --sport pool --date sab --from 6 --to 10", "idrd find --sport grill --date dom"],
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
    summary: "Reserva un espacio (cancha, piscina, asador, gimnasio por hora, coliseo). Sin --yes solo muestra la vista previa. Las reservas NO se pueden cancelar.",
    args: [{ name: "id", description: "id del espacio" }],
    flags: [
      { flag: "--date <fecha>", description: "Fecha de la reserva" },
      { flag: "--hour <hora>", description: "Hora de inicio, ej. 6 o \"6:00 AM\" (asadores: inicio del bloque, default el primero libre)" },
      { flag: "--hours <n>", description: "Duración (canchas máx. 2; otros, dentro del bloque publicado; asadores: el bloque completo)" },
      { flag: "--lane <id>", description: "Piscinas: carril (obligatorio)" },
      { flag: "--sport-id <id>", description: "Coliseos: deporte (obligatorio)" },
      { flag: "--document <doc>", description: "Beneficiario distinto al titular (CEFE); default tu documento" },
      { flag: "--adult-document-type <t> --adult-document <n> --adult-name <nombre>", description: "Piscinas CEFE: adulto responsable para beneficiarios de 5 a 12 años" },
      { flag: "--bank <código>", description: "Si cobra: genera de una vez el link PSE con este banco" },
      { flag: "--yes --confirm <intent>", description: "Ejecuta. <intent> lo imprime la vista previa" },
      { flag: "--dry-run", description: "Fuerza vista previa aunque pases --yes" },
    ],
    trust: "T3", auth: true,
    output: "preview: {dryRun:true, intent, request, checks[]} | live: {booking: BookingRecord, payment?}",
    examples: ["idrd booking create 11537 --date vie --hour 6", "idrd booking create 16893 --lane 3 --date sab --hour 7", "idrd booking create 16848 --date dom", "idrd booking create 11537 --date vie --hour 6 --yes --confirm 11537@2026-11-06T06x1"],
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
  { name: "pay pending", summary: "Pagos pendientes de tu cuenta en el portal.", trust: "T0", auth: true, output: "object[] (respuesta del portal)" },
  { name: "pay history", summary: "Historial de pagos de tu cuenta.", trust: "T0", auth: true, output: "object[] (respuesta del portal)" },
  { name: "gym status", summary: "Estado de tu mensualidad en un gimnasio CEFE (y sus reservas).", args: [{ name: "id", description: "id del gimnasio" }], trust: "T0", auth: true, output: "{gymId, active, status, reservations}" },
  { name: "gym quote", summary: "Cotiza la mensualidad de un gimnasio: valor y vigencia.", args: [{ name: "id", description: "id del gimnasio" }], trust: "T0", auth: true, output: "{gymId, amount, validFrom, validTo, concept, quote}" },
  { name: "gym availability", summary: "Cupos por día y hora para usar la mensualidad.", args: [{ name: "id", description: "id del gimnasio" }], trust: "T0", auth: true, output: "{gymId, days[]}" },
  { name: "gym active", summary: "Tus mensualidades activas en todos los gimnasios.", trust: "T0", auth: true, output: "object (respuesta del portal)" },
  {
    name: "gym buy",
    summary: "Compra la mensualidad de un gimnasio. Sin --yes solo vista previa. Crea la mensualidad y el link de pago PSE; no se puede cancelar. (No ejecutado en vivo: payload copiado del portal.)",
    args: [{ name: "id", description: "id del gimnasio" }],
    flags: [
      { flag: "--bank <código>", description: "Banco PSE (ver `idrd pay banks`)" },
      { flag: "--yes --confirm <intent>", description: "Ejecuta. <intent> lo imprime la vista previa" },
    ],
    trust: "T3", auth: true,
    output: "preview: {dryRun, intent, ready, amount, checks[]} | live: {gymId, membershipId, amount, payment{paymentCode, bankUrl}}",
  },
  { name: "gym activate", summary: "Activa la mensualidad con el código de un pago PSE aprobado.", args: [{ name: "id", description: "id del gimnasio" }], flags: [{ flag: "--code <pago>", description: "código de pago" }, { flag: "--yes", description: "Confirma" }], trust: "T2", auth: true, output: "{gymId, active, status}" },
  {
    name: "activity list",
    summary: "Actividades y escuelas con inscripción (Escuelas de mi Barrio, Deporte de 0 a 100, CEFE…). Lee todas las páginas.",
    flags: [
      { flag: "--program <ids>", description: "Programas, ej. 43,27 (ver `activity programs`)" },
      { flag: "--stage <ids>", description: "Escenarios/sedes, ej. 1,3 (ver `activity stages`; los CEFE están aquí)" },
      { flag: "--text <texto>", description: "Busca en nombre, programa, sede y dirección" },
      { flag: "--locality <texto>", description: "Filtra por sede, parque o dirección" },
      { flag: "--age <n>", description: "Solo actividades para esa edad" },
      { flag: "--free | --paid", description: "Solo gratuitas o solo pagas" },
      { flag: "--available", description: "Solo con cupos e inscripciones abiertas" },
    ],
    trust: "T0", auth: false,
    output: "Activity[] {id, program, name, stage, parkName, address, weekdays, hours, minAge, maxAge, quota, taken, left, paid, rate, rateValue, startDate, endDate, open, active, consent[], regulations[]}",
    examples: ["idrd activity list --available", "idrd activity list --text natacion --age 8", "idrd activity list --stage 3"],
  },
  { name: "activity get", summary: "Detalle de una actividad: horario, edades, cupos, costo, consentimientos y reglamento.", args: [{ name: "id", description: "id de la actividad" }], trust: "T0", auth: false, output: "Activity" },
  { name: "activity programs", summary: "Programas del portal con su número de actividades.", trust: "T0", auth: false, output: "{id, name, count}[]" },
  { name: "activity stages", summary: "Sedes/escenarios de las actividades (incluye los CEFE) con su parque.", trust: "T0", auth: false, output: "{id, name, parkName, parkCode, count}[]" },
  { name: "activity categories", summary: "Categorías deportivas de las actividades.", trust: "T0", auth: false, output: "{name, value}[]" },
  { name: "activity mine", summary: "Inscripciones de tu cuenta.", trust: "T0", auth: true, output: "object[] (respuesta del portal)" },
  {
    name: "activity subscribe",
    summary: "Preinscribe un perfil de tu cuenta en una actividad. Sin --yes solo vista previa. Se puede deshacer con `activity unsubscribe`. (No ejecutado en vivo.)",
    args: [{ name: "id", description: "id de la actividad" }],
    flags: [
      { flag: "--person <profileId>", description: "Perfil (titular o beneficiario) a inscribir; ver `idrd profile list`" },
      { flag: "--yes --confirm <intent>", description: "Ejecuta y acepta términos y consentimientos. <intent> lo imprime la vista previa" },
    ],
    trust: "T2", auth: true,
    output: "preview: {dryRun, intent, ready, request, checks[], consent[]} | live: {activityId, profileId, message, subscriptionId}",
  },
  { name: "activity unsubscribe", summary: "Retira una inscripción.", args: [{ name: "subscriptionId", description: "id de la inscripción (ver `activity mine`)" }], flags: [{ flag: "--yes", description: "Confirma" }], trust: "T2", auth: true, output: "{subscriptionId, unsubscribed}" },
  { name: "profile list", summary: "Perfiles de tu cuenta (titular y beneficiarios) para inscripciones y reservas CEFE.", trust: "T0", auth: true, output: "{profiles[], beneficiaries[]}" },
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
