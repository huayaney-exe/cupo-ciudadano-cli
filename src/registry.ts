/**
 * Single source of truth for the command surface. `cupo help` and
 * `cupo schema` are both generated from this table, so they cannot drift.
 */
export type Trust = "T0" | "T1" | "T2" | "T3";

export type Provider = "cupo" | "idrd" | "cefe";

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
  // ---------------------------------------------------------------- el job: conseguir cupo (todos los proveedores)
  {
    name: "find",
    summary: "Busca cupo para hacer deporte en todos los proveedores a la vez. Cada resultado trae el comando exacto para reservarlo.",
    flags: [
      { flag: "--sport <tennis|padel|pickleball|synthetic|natural|pool|grill|gym|coliseum>", description: "Qué quieres hacer (default pool)" },
      { flag: "--date <YYYY-MM-DD|hoy|mañana|lun..dom>", description: "Cuándo (default mañana)" },
      { flag: "--from <hora> --to <hora>", description: "Ventana, ej. --from 6 --to 10 o --from 06:30" },
      { flag: "--locality <texto>", description: "Localidad o parque (chapinero, suba, usaquen…)" },
      { flag: "--provider <idrd|cefe>", description: "Solo un proveedor" },
    ],
    trust: "T0", auth: false,
    output: "{date, sport, window, providers[], scanned{}, results: [{provider, id, kind, name, where, lane?, free[]{start,end,places?}, bookCommand}], failed[]}",
    examples: ["cupo find --sport pool --date sab --from 6 --to 10", "cupo find --sport tennis --date vie --locality suba"],
  },
  {
    name: "book",
    summary: "Reserva un cupo de `cupo find` por su id (idrd:… o cefe:…). Sin --yes solo muestra la vista previa; el proveedor decide si además exige --confirm.",
    args: [{ name: "id", description: "idrd:<id> o cefe:<poolId>" }],
    flags: [
      { flag: "--date <fecha>", description: "Fecha" },
      { flag: "--hour <h> | --time HH:MM", description: "Hora de inicio (cualquiera de las dos formas)" },
      { flag: "--hours, --lane, --sport-id, --dependent, --pay, --document, --adult-*", description: "Pasan al proveedor; ver `cupo idrd booking create --help` y `cupo cefe booking create --help`" },
      { flag: "--yes [--confirm <intent>]", description: "Ejecuta. IDRD (irreversible) exige también --confirm" },
    ],
    trust: "T3", auth: true,
    output: "la salida de `idrd booking create` o `cefe booking create` según el proveedor",
    examples: ["cupo book idrd:11537 --date vie --hour 16", "cupo book cefe:463e2980-59d9-4789-a6b1-7a0d035f561d --date sab --time 07:15 --yes"],
  },
  {
    name: "providers",
    summary: "Mapa de proveedores: qué cubre cada uno, si tienes sesión y cómo entrar.",
    trust: "T0", auth: false,
    output: "[{id, name, web, covers, sports[], loggedIn, email, login, commands}]",
  },
  {
    name: "idrd court list",
    summary: "Lista espacios reservables de un tipo: canchas, piscinas, asadores, gimnasios, coliseos (por defecto solo los reservables en línea). Alias: `cupo idrd space list`.",
    flags: [
      { flag: "--sport <tennis|padel|pickleball|synthetic|natural|pool|grill|gym|coliseum>", description: "Tipo de espacio (default tennis)" },
      { flag: "--locality <texto>", description: "Filtra por localidad (ej. usaquen)" },
      { flag: "--all", description: "Incluye canchas no reservables en línea" },
    ],
    trust: "T0", auth: false,
    output: "Court[] {id, parkId, parkName, parkCode, address, locality, upz, sport, description, bookable}",
    examples: ["cupo idrd court list", "cupo idrd court list --sport padel", "cupo idrd court list --sport pool --all"],
  },
  {
    name: "idrd court get",
    summary: "Detalle de un espacio: tipo, parque, horario de servicio, superficie, reglas; carriles (piscinas) o deportes (coliseos).",
    args: [{ name: "id", description: "id del espacio (park_endowment_id)" }],
    trust: "T0", auth: false,
    output: "{court, kind, park, endowment{kind,sport,status,surface,lighting,lanes,rules}, lanes[], sports[]}",
    examples: ["cupo idrd court get 11537", "cupo idrd court get 16893"],
  },
  {
    name: "idrd court lanes",
    summary: "Carriles de una piscina (las piscinas se consultan y reservan por carril).",
    args: [{ name: "id", description: "id de la piscina" }],
    trust: "T0", auth: false,
    output: "Lane[] {id, name, level, direction, quota, poolId, enabled}",
    examples: ["cupo idrd court lanes 16893"],
  },
  {
    name: "idrd court sports",
    summary: "Deportes que admite un coliseo (el id va en --sport-id al consultar y reservar).",
    args: [{ name: "id", description: "id del coliseo" }],
    trust: "T0", auth: false,
    output: "ColiseumSport[] {id, name}",
    examples: ["cupo idrd court sports 16892"],
  },
  {
    name: "idrd slot list",
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
    examples: ["cupo idrd slot list 11537 --date vie --free", "cupo idrd slot list 16893 --lane 3 --date sab", "cupo idrd slot list 16892 --sport-id 3 --date dom"],
  },
  {
    name: "idrd slot find",
    summary: "Busca horas libres en todos los espacios de un tipo (piscinas: en todos sus carriles). Atajo: `cupo idrd find`.",
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
    examples: ["cupo idrd find --date mie --from 6 --to 9", "cupo idrd find --sport pool --date sab --from 6 --to 10", "cupo idrd find --sport grill --date dom"],
  },
  {
    name: "idrd auth login",
    summary: "Inicia sesión (OAuth del portal). Guarda el token y tu correo. La contraseña solo con --save: Llavero de macOS o ~/.cupo/env (0600); entonces la sesión se renueva sola al vencer.",
    flags: [
      { flag: "--email <correo>", description: "Correo de tu cuenta (se recuerda)" },
      { flag: "--password-stdin", description: "Lee la contraseña de stdin (o usa IDRD_PASSWORD)" },
      { flag: "--save", description: "Guarda la contraseña (Llavero en macOS, ~/.cupo/env en Linux) para no volver a pedirla" },
    ],
    trust: "T1", auth: false,
    output: "{email, expiresAt, refreshable, passwordSaved, user{id,name,verified,hasProfile}}",
    examples: ["cupo idrd auth login --email yo@correo.com --save", "IDRD_PASSWORD=… cupo idrd auth login --email yo@correo.com --json"],
  },
  { name: "idrd auth status", summary: "Estado de la sesión, con una llamada real al portal.", trust: "T0", auth: false, output: "{loggedIn, email, expiresAt, expired, refreshable, passwordStored, user?}" },
  { name: "idrd auth logout", summary: "Cierra sesión en el portal y borra el token local. Con --forget borra también la contraseña guardada.", flags: [{ flag: "--forget", description: "Borra la contraseña guardada con --save" }], trust: "T1", auth: true, output: "{loggedOut, passwordForgotten}" },
  {
    name: "idrd booking list",
    summary: "Tus reservas en el portal, más las creadas desde este equipo.",
    trust: "T0", auth: true,
    output: "{remote: object[], local: BookingRecord[]}",
  },
  {
    name: "idrd booking create",
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
    examples: ["cupo idrd booking create 11537 --date vie --hour 6", "cupo idrd booking create 16893 --lane 3 --date sab --hour 7", "cupo idrd booking create 16848 --date dom", "cupo idrd booking create 11537 --date vie --hour 6 --yes --confirm 11537@2026-11-06T06x1"],
  },
  { name: "idrd pay banks", summary: "Bancos disponibles en PSE.", trust: "T0", auth: false, output: "Bank[] {code, name}" },
  {
    name: "idrd pay pse",
    summary: "Genera el link de pago PSE (bank_url) de una reserva creada desde este equipo.",
    args: [{ name: "bookingId", description: "id devuelto por booking create" }],
    flags: [
      { flag: "--bank <código>", description: "Banco (ver `cupo idrd pay banks`)" },
      { flag: "--yes", description: "Confirma la creación de la orden de pago" },
      { flag: "--open", description: "Abre el link en el navegador" },
    ],
    trust: "T2", auth: true,
    output: "{bookingId, amount, bankUrl, paymentCode}",
  },
  {
    name: "idrd pay status",
    summary: "Estado de un pago PSE.",
    args: [{ name: "code", description: "código de pago" }],
    trust: "T0", auth: true,
    output: "object (respuesta del portal)",
  },
  { name: "idrd pay pending", summary: "Pagos pendientes de tu cuenta en el portal.", trust: "T0", auth: true, output: "object[] (respuesta del portal)" },
  { name: "idrd pay history", summary: "Historial de pagos de tu cuenta.", trust: "T0", auth: true, output: "object[] (respuesta del portal)" },
  { name: "idrd gym status", summary: "Estado de tu mensualidad en un gimnasio CEFE (y sus reservas).", args: [{ name: "id", description: "id del gimnasio" }], trust: "T0", auth: true, output: "{gymId, active, status, reservations}" },
  { name: "idrd gym quote", summary: "Cotiza la mensualidad de un gimnasio: valor y vigencia.", args: [{ name: "id", description: "id del gimnasio" }], trust: "T0", auth: true, output: "{gymId, amount, validFrom, validTo, concept, quote}" },
  { name: "idrd gym availability", summary: "Cupos por día y hora para usar la mensualidad.", args: [{ name: "id", description: "id del gimnasio" }], trust: "T0", auth: true, output: "{gymId, days[]}" },
  { name: "idrd gym active", summary: "Tus mensualidades activas en todos los gimnasios.", trust: "T0", auth: true, output: "object (respuesta del portal)" },
  {
    name: "idrd gym buy",
    summary: "Compra la mensualidad de un gimnasio. Sin --yes solo vista previa. Crea la mensualidad y el link de pago PSE; no se puede cancelar. (No ejecutado en vivo: payload copiado del portal.)",
    args: [{ name: "id", description: "id del gimnasio" }],
    flags: [
      { flag: "--bank <código>", description: "Banco PSE (ver `cupo idrd pay banks`)" },
      { flag: "--yes --confirm <intent>", description: "Ejecuta. <intent> lo imprime la vista previa" },
    ],
    trust: "T3", auth: true,
    output: "preview: {dryRun, intent, ready, amount, checks[]} | live: {gymId, membershipId, amount, payment{paymentCode, bankUrl}}",
  },
  { name: "idrd gym activate", summary: "Activa la mensualidad con el código de un pago PSE aprobado.", args: [{ name: "id", description: "id del gimnasio" }], flags: [{ flag: "--code <pago>", description: "código de pago" }, { flag: "--yes", description: "Confirma" }], trust: "T2", auth: true, output: "{gymId, active, status}" },
  {
    name: "idrd activity list",
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
    examples: ["cupo idrd activity list --available", "cupo idrd activity list --text natacion --age 8", "cupo idrd activity list --stage 3"],
  },
  { name: "idrd activity get", summary: "Detalle de una actividad: horario, edades, cupos, costo, consentimientos y reglamento.", args: [{ name: "id", description: "id de la actividad" }], trust: "T0", auth: false, output: "Activity" },
  { name: "idrd activity programs", summary: "Programas del portal con su número de actividades.", trust: "T0", auth: false, output: "{id, name, count}[]" },
  { name: "idrd activity stages", summary: "Sedes/escenarios de las actividades (incluye los CEFE) con su parque.", trust: "T0", auth: false, output: "{id, name, parkName, parkCode, count}[]" },
  { name: "idrd activity categories", summary: "Categorías deportivas de las actividades.", trust: "T0", auth: false, output: "{name, value}[]" },
  { name: "idrd activity mine", summary: "Inscripciones de tu cuenta.", trust: "T0", auth: true, output: "object[] (respuesta del portal)" },
  {
    name: "idrd activity subscribe",
    summary: "Preinscribe un perfil de tu cuenta en una actividad. Sin --yes solo vista previa. Se puede deshacer con `activity unsubscribe`. (No ejecutado en vivo.)",
    args: [{ name: "id", description: "id de la actividad" }],
    flags: [
      { flag: "--person <profileId>", description: "Perfil (titular o beneficiario) a inscribir; ver `cupo idrd profile list`" },
      { flag: "--yes --confirm <intent>", description: "Ejecuta y acepta términos y consentimientos. <intent> lo imprime la vista previa" },
    ],
    trust: "T2", auth: true,
    output: "preview: {dryRun, intent, ready, request, checks[], consent[]} | live: {activityId, profileId, message, subscriptionId}",
  },
  { name: "idrd activity unsubscribe", summary: "Retira una inscripción.", args: [{ name: "subscriptionId", description: "id de la inscripción (ver `activity mine`)" }], flags: [{ flag: "--yes", description: "Confirma" }], trust: "T2", auth: true, output: "{subscriptionId, unsubscribed}" },
  { name: "idrd profile list", summary: "Perfiles de tu cuenta (titular y beneficiarios) para inscripciones y reservas CEFE.", trust: "T0", auth: true, output: "{profiles[], beneficiaries[]}" },
  // ---------------------------------------------------------------- CEFE Chapinero (cefechapinero.com)
  { name: "cefe auth login", summary: "Inicia sesión en CEFE Chapinero (cuenta distinta a la del IDRD). Guarda el token y tu correo. La contraseña solo con --save (Llavero o ~/.cupo/env); entonces la sesión se renueva sola.", flags: [{ flag: "--email <correo>", description: "Correo de tu cuenta (se recuerda)" }, { flag: "--password-stdin", description: "Lee la contraseña de stdin (o usa CEFE_PASSWORD)" }, { flag: "--save", description: "Guarda la contraseña para no volver a pedirla" }], trust: "T1", auth: false, output: "{email, expiresAt, passwordSaved, user{userId,name,credits,reservasDisponibles,dependents[]}, missingForBooking[]}", examples: ["cupo cefe auth login --email yo@correo.com --save"] },
  { name: "cefe auth status", summary: "Estado de la sesión CEFE, con una llamada real.", trust: "T0", auth: false, output: "{loggedIn, email, expiresAt, passwordStored, user?}" },
  { name: "cefe auth logout", summary: "Borra el token local de CEFE. Con --forget borra también la contraseña guardada.", flags: [{ flag: "--forget", description: "Borra la contraseña guardada con --save" }], trust: "T1", auth: false, output: "{loggedOut, passwordForgotten}" },
  { name: "cefe auth register", summary: "Crea una cuenta en CEFE Chapinero (exige --accept-habeas-data).", flags: [{ flag: "--name <nombre> --email <correo> --phone <tel> --document <num> [--document-type CC]", description: "Datos de la cuenta" }, { flag: "--accept-habeas-data", description: "Aceptas el tratamiento de datos personales" }], trust: "T2", auth: false, output: "{email, user}" },
  { name: "cefe me", summary: "Tu perfil CEFE: documento, teléfono, estrato, créditos, reservas disponibles, dependientes; y qué falta para reservar.", trust: "T0", auth: true, output: "CefeUser + missingForBooking[]" },
  { name: "cefe pool list", summary: "Piscinas del CEFE Chapinero con capacidad y horario.", flags: [{ flag: "--all", description: "Incluye inactivas" }], trust: "T0", auth: false, output: "Pool[] {poolId, name, capacity, pricePerHour, active, hours[]}" },
  { name: "cefe pool get", summary: "Detalle de una piscina: franjas publicadas, días cerrados, calificación pública.", args: [{ name: "pool", description: "poolId o parte del nombre (ej. semiolimpica)" }], trust: "T0", auth: false, output: "Pool + {schedule, rating}" },
  { name: "cefe slot list", summary: "Cupos por franja de una piscina en una fecha (capacidad menos reservados, como la web).", args: [{ name: "pool", description: "poolId o parte del nombre" }], flags: [{ flag: "--date <fecha>", description: "Fecha (default hoy)" }, { flag: "--free", description: "Solo franjas con cupo" }], trust: "T0", auth: false, output: "{poolId, date, slots[] {time, start, end, capacity, reserved, free, available}, priceEstimate}", examples: ["cupo cefe slot list semiolimpica --date sab --free"] },
  { name: "cefe slot find", summary: "Cupos libres en todas las piscinas del CEFE. Atajo: `cupo cefe find`.", flags: [{ flag: "--date <fecha>", description: "Fecha (default mañana)" }, { flag: "--from HH:MM --to HH:MM", description: "Ventana horaria" }], trust: "T0", auth: false, output: "{date, window, results[] {pool, slots[]}, scanned, failed[]}", examples: ["cupo cefe find --date sab --from 06:00 --to 10:00"] },
  {
    name: "cefe booking create",
    summary: "Reserva práctica libre (60 min). Sin --yes solo vista previa. Cancelable hasta 6 h antes. Pago: efectivo en la sede (default), Wompi en la web, o créditos.",
    args: [{ name: "pool", description: "poolId o parte del nombre" }],
    flags: [{ flag: "--date <fecha> --time HH:MM", description: "Franja publicada (ver `cefe slot list`)" }, { flag: "--dependent <n,n>", description: "Dependientes de tu perfil a incluir (1-based, ver `cefe me`)" }, { flag: "--pay <efectivo|wompi|creditos>", description: "Método de pago (default efectivo)" }, { flag: "--notes <texto>", description: "Nota para la reserva" }, { flag: "--yes", description: "Ejecuta" }],
    trust: "T2", auth: true,
    output: "preview: {dryRun, ready, where, pay, price, request, checks[]} | live: {reservation{id, status, …}, pay, price, payUrl?}",
    examples: ["cupo cefe booking create semiolimpica --date sab --time 07:15", "cupo cefe booking create semiolimpica --date sab --time 07:15 --dependent 1 --yes"],
  },
  { name: "cefe booking list", summary: "Tus reservas de práctica libre.", flags: [{ flag: "--date <fecha> | --from <fecha> --to <fecha>", description: "Filtro de fechas" }, { flag: "--status <pending|confirmed|cancelled|completed>", description: "Filtro de estado" }, { flag: "--upcoming", description: "Solo futuras no canceladas" }], trust: "T0", auth: true, output: "Reservation[] {id, poolName, startTime, endTime, status, price, paymentMethod, paymentStatus, cancellable}" },
  { name: "cefe booking cancel", summary: "Cancela una reserva (hasta 6 h antes).", args: [{ name: "reservationId", description: "id de `cefe booking list`" }], flags: [{ flag: "--yes", description: "Confirma" }], trust: "T2", auth: true, output: "{reservationId, cancelled}" },
  { name: "cefe course list", summary: "Cursos y actividades (natación por niveles, matronatación, acuafitness…) con precio por estrato.", flags: [{ flag: "--text <texto>", description: "Busca en nombre y grupo" }, { flag: "--available", description: "Solo con cupo" }, { flag: "--all", description: "Incluye no activos" }], trust: "T0", auth: false, output: "Course[] {courseId, name, group, schedule[], priceEstrato1_3, priceEstrato4_6, full, …}" },
  { name: "cefe course get", summary: "Detalle de un curso y sus clases con cupo en un rango de fechas.", args: [{ name: "course", description: "courseId (o prefijo de 8) o nombre exacto" }], flags: [{ flag: "--from <fecha> --to <fecha>", description: "Rango (default hoy + 13 días)" }], trust: "T0", auth: false, output: "Course + {availability{dates[]{date, classes[]}}}" },
  { name: "cefe course mine", summary: "Tus inscripciones y clases reservadas.", trust: "T0", auth: true, output: "{enrollments[], classes[]}" },
  { name: "cefe course enroll", summary: "Inscribe tu cuenta en un curso (queda pendiente de pago). Sin --yes solo vista previa. Nota: la web lo tiene deshabilitado desde jul-2026; el check lo refleja.", args: [{ name: "course", description: "courseId o prefijo" }], flags: [{ flag: "--pay <efectivo|wompi>", description: "default efectivo" }, { flag: "--yes", description: "Ejecuta" }], trust: "T2", auth: true, output: "preview {ready, checks[], request} | live {courseId, price, pay, response}" },
  { name: "cefe class book", summary: "Reserva una clase de un curso en una fecha. Sin --yes solo vista previa.", args: [{ name: "course", description: "courseId o prefijo" }], flags: [{ flag: "--date <fecha>", description: "Día de la clase" }, { flag: "--yes", description: "Ejecuta" }], trust: "T2", auth: true, output: "preview {ready, checks[]} | live {courseId, classDateTime}" },
  { name: "cefe class cancel", summary: "Cancela una clase reservada.", args: [{ name: "course", description: "courseId o prefijo" }], flags: [{ flag: "--date <fecha>", description: "Día de la clase" }, { flag: "--yes", description: "Confirma" }], trust: "T2", auth: true, output: "{courseId, classDateTime, cancelled}" },
  { name: "cefe tournament list", summary: "Torneos publicados.", flags: [{ flag: "--status <estado>", description: "Filtro" }], trust: "T0", auth: true, output: "object[]" },
  { name: "cefe tournament get", summary: "Un torneo y sus competiciones.", args: [{ name: "tournamentId", description: "id" }], trust: "T0", auth: true, output: "object + competitions[]" },
  { name: "cefe tournament mine", summary: "Tus inscripciones a torneos.", trust: "T0", auth: true, output: "object[]" },
  { name: "cefe tournament register", summary: "Te inscribe (o a un dependiente) en una competición.", args: [{ name: "tournamentId", description: "id" }], flags: [{ flag: "--competition <id>", description: "Competición" }, { flag: "--dependent <documento>", description: "Inscribir a un dependiente" }, { flag: "--sex <M|F>", description: "Si la competición lo exige" }, { flag: "--observation <texto>", description: "Nota" }, { flag: "--yes", description: "Confirma" }], trust: "T2", auth: true, output: "{tournamentId, competitionId, response}" },
  { name: "cefe tournament unregister", summary: "Cancela una inscripción a competición.", args: [{ name: "tournamentId", description: "id" }], flags: [{ flag: "--competition <id>", description: "Competición" }, { flag: "--dependent <documento>", description: "Si era de un dependiente" }, { flag: "--yes", description: "Confirma" }], trust: "T2", auth: true, output: "{tournamentId, competitionId, unregistered}" },
  { name: "cefe promo list", summary: "Promociones (pases de uso) publicadas y las tuyas si hay sesión. La compra es en la web.", trust: "T0", auth: false, output: "{promotions[], mine[]}" },
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

/** Which system a command talks to: `cupo` (cross-provider jobs), `idrd` or `cefe`. */
export function providerOf(name: string): Provider {
  return name.startsWith("idrd ") ? "idrd" : name.startsWith("cefe ") ? "cefe" : "cupo";
}

export function findCommand(words: string[]): { spec: CommandSpec; rest: string[] } | null {
  for (const n of [4, 3, 2, 1]) {
    const name = words.slice(0, n).join(" ");
    const spec = COMMANDS.find((c) => c.name === name);
    if (spec) return { spec, rest: words.slice(n) };
  }
  return null;
}
