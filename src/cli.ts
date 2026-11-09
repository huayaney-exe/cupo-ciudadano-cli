import { printBanner } from "./cli/foundation/banner.js";
import { parseGlobalFlags, type GlobalFlags } from "./cli/foundation/global-flags.js";
import { parseArgs } from "./core/args.js";
import { AppError, EXIT, exitCodeFor, toAppError } from "./core/errors.js";
import { emitError, emitResult, isJson } from "./core/output.js";
import { authLogin, authLogout, authStatus, bookingList, commandHelp, doctor, helpText, killswitch, payHistory, payPending, schema, suggestCommands, VERSION, welcomeText } from "./commands/account.js";
import { runUpdateCheck, scheduleUpdateCheck, updateNotice } from "./core/update.js";
import { providerOf } from "./registry.js";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { appHome } from "./core/paths.js";
import { activityCategories, activityGet, activityList, activityMine, activityPrograms, activityStages, activitySubscribe, activityUnsubscribe, profileList } from "./commands/activities.js";
import { gymActivate, gymActive, gymAvailability, gymBuy, gymQuote, gymStatus } from "./commands/gym.js";
import * as cefe from "./commands/cefe.js";
import { book, find, providers } from "./commands/jobs.js";
import type { Handler } from "./commands/context.js";
import { courtGet, courtLanes, courtList, courtSports, slotFind, slotList } from "./commands/read.js";
import { bookingCreate, payBanks, payPse, payStatus } from "./commands/write.js";
import { COMMANDS, findCommand } from "./registry.js";

const HANDLERS: Record<string, Handler> = {
  find,
  book,
  providers,
  "idrd court list": courtList,
  "idrd court get": courtGet,
  "idrd court lanes": courtLanes,
  "idrd court sports": courtSports,
  "idrd slot list": slotList,
  "idrd slot find": slotFind,
  "idrd auth login": authLogin,
  "idrd auth status": authStatus,
  "idrd auth logout": authLogout,
  "idrd booking list": bookingList,
  "idrd booking create": bookingCreate,
  "idrd pay banks": payBanks,
  "idrd pay pse": payPse,
  "idrd pay status": payStatus,
  "idrd pay pending": payPending,
  "idrd pay history": payHistory,
  "idrd gym status": gymStatus,
  "idrd gym quote": gymQuote,
  "idrd gym availability": gymAvailability,
  "idrd gym active": gymActive,
  "idrd gym buy": gymBuy,
  "idrd gym activate": gymActivate,
  "idrd activity list": activityList,
  "idrd activity get": activityGet,
  "idrd activity programs": activityPrograms,
  "idrd activity stages": activityStages,
  "idrd activity categories": activityCategories,
  "idrd activity mine": activityMine,
  "idrd activity subscribe": activitySubscribe,
  "idrd activity unsubscribe": activityUnsubscribe,
  "idrd profile list": profileList,
  "cefe auth login": cefe.cefeLogin,
  "cefe auth status": cefe.cefeStatus,
  "cefe auth logout": cefe.cefeLogout,
  "cefe auth register": cefe.cefeRegister,
  "cefe me": cefe.cefeMe,
  "cefe pool list": cefe.cefePoolList,
  "cefe pool get": cefe.cefePoolGet,
  "cefe slot list": cefe.cefeSlotList,
  "cefe slot find": cefe.cefeSlotFind,
  "cefe booking create": cefe.cefeBookingCreate,
  "cefe booking list": cefe.cefeBookingList,
  "cefe booking cancel": cefe.cefeBookingCancel,
  "cefe course list": cefe.cefeCourseList,
  "cefe course get": cefe.cefeCourseGet,
  "cefe course mine": cefe.cefeCourseMine,
  "cefe course enroll": cefe.cefeCourseEnroll,
  "cefe class book": cefe.cefeClassBook,
  "cefe class cancel": cefe.cefeClassCancel,
  "cefe tournament list": cefe.cefeTournamentList,
  "cefe tournament get": cefe.cefeTournamentGet,
  "cefe tournament mine": cefe.cefeTournamentMine,
  "cefe tournament register": cefe.cefeTournamentRegister,
  "cefe tournament unregister": cefe.cefeTournamentUnregister,
  "cefe promo list": cefe.cefePromoList,
  doctor,
  killswitch,
  schema,
};

/** The single most common operation gets the shortest spelling. */
const ALIASES: Record<string, string[]> = {
  "idrd find": ["idrd", "slot", "find"], "idrd space": ["idrd", "court"], "idrd activities": ["idrd", "activity"],
  "cefe find": ["cefe", "slot", "find"], "cefe pools": ["cefe", "pool", "list"], "cefe courses": ["cefe", "course", "list"],
};

export async function main(argv: string[]): Promise<number> {
  const args = parseArgs(argv);
  const flags: GlobalFlags = parseGlobalFlags(args);
  let words = args._.slice();
  const two = words.slice(0, 2).join(" ");
  const alias = ALIASES[two] ? { to: ALIASES[two]!, n: 2 } : words[0] && ALIASES[words[0]] ? { to: ALIASES[words[0]]!, n: 1 } : undefined;
  if (alias) words = [...alias.to, ...words.slice(alias.n)];

  if (args.version) {
    process.stdout.write(isJson(flags) ? `${JSON.stringify({ ok: true, version: VERSION })}\n` : `${VERSION}\n`);
    return EXIT.ok;
  }
  // Detached child spawned by scheduleUpdateCheck(): refresh the version cache and exit. Hidden from help and schema.
  if (words[0] === "__update-check") {
    await runUpdateCheck(VERSION);
    return EXIT.ok;
  }
  const human = !isJson(flags);
  if (human && !flags.quiet) scheduleUpdateCheck(VERSION);
  // First run on this machine (any install method): the banner and the three commands of the job, once, on stderr.
  const welcomed = join(appHome(), "welcomed");
  if (human && !flags.quiet && !args.noBanner && !process.env.CUPO_NO_BANNER && words.length > 0 && !existsSync(welcomed)) {
    printBanner({ name: "cupo", version: VERSION, tagline: "Cupo para hacer deporte en Bogotá · IDRD + CEFE Chapinero · no oficial", gradient: ["#00B4D8", "#2E7D32"] });
    process.stderr.write(`${welcomeText(flags.profile)}\n\n`);
    try { mkdirSync(appHome(), { recursive: true, mode: 0o700 }); writeFileSync(welcomed, `${new Date().toISOString()}\n`); } catch { /* read-only home: show it again next time */ }
  }
  const notice = () => { const n = human && !flags.quiet ? updateNotice(VERSION) : null; if (n) process.stderr.write(`\n${n}\n`); };
  // `cupo idrd`, `cupo cefe`, with or without --help: that provider's commands.
  if (words.length === 1 && (words[0] === "idrd" || words[0] === "cefe")) {
    const p = words[0];
    if (isJson(flags)) process.stdout.write(`${JSON.stringify({ ok: true, schemaVersion: 1, command: p, data: { provider: p, commands: COMMANDS.filter((c) => providerOf(c.name) === p) }, nextSteps: [] })}\n`);
    else process.stdout.write(`${helpText(p)}\n`);
    return EXIT.ok;
  }
  if (words.length === 0 || words[0] === "help") {
    const target = words[0] === "help" ? findCommand(words.slice(1)) : null;
    if (target) {
      process.stdout.write(`${commandHelp(target.spec.name)}\n`);
      return EXIT.ok;
    }
    if (words[0] === "help" || args.help) {
      process.stdout.write(`${helpText()}\n`);
      return EXIT.ok;
    }
    // Bare invoke: humans get the banner and help on stderr; agents get a
    // structured usage error pointing at the schema. Never data on stdout.
    if (isJson(flags)) {
      emitError("cupo", new AppError("usage/no-command", { name: "NoCommand", human: "Falta el comando.", hint: "Corre `cupo schema` para ver el contrato." }), flags);
      return EXIT.usage;
    }
    if (!args.noBanner) printBanner({ name: "cupo", version: VERSION, tagline: "Cupo para hacer deporte en Bogotá · IDRD + CEFE Chapinero · no oficial", gradient: ["#00B4D8", "#2E7D32"] });
    process.stderr.write(`${welcomeText(flags.profile)}\n`);
    try { mkdirSync(appHome(), { recursive: true, mode: 0o700 }); writeFileSync(welcomed, `${new Date().toISOString()}\n`); } catch { /* ignore */ }
    notice();
    return EXIT.ok;
  }

  const found = findCommand(words);
  const commandName = found?.spec.name ?? words.join(" ");
  if (!found) {
    const close = suggestCommands(words);
    const err = new AppError("usage/unknown-command", {
      name: "UnknownCommand",
      human: `Comando desconocido: ${words.join(" ")}`,
      hint: close.length ? `¿Quisiste decir: ${close.map((c) => `cupo ${c}`).join(" · ")}? Todos: cupo --help` : "Todos los comandos: cupo --help · Contrato para agentes: cupo schema",
    });
    emitError(commandName, err, flags);
    return EXIT.usage;
  }
  if (args.help || args.h) {
    if (isJson(flags)) process.stdout.write(`${JSON.stringify({ ok: true, command: found.spec.name, data: found.spec })}\n`);
    else process.stdout.write(`${commandHelp(found.spec.name)}\n`);
    return EXIT.ok;
  }

  try {
    const handler = HANDLERS[found.spec.name]!;
    const result = await handler({ args: { ...args, _: found.rest }, flags });
    emitResult(found.spec.name, result, flags);
    notice();
    const exit = result.meta?.exitCode;
    return typeof exit === "number" ? exit : EXIT.ok;
  } catch (e) {
    const err = toAppError(e);
    emitError(found.spec.name, err, flags);
    if (process.env.DEBUG && err.cause instanceof Error) process.stderr.write(`${err.cause.stack}\n`);
    return exitCodeFor(err.code);
  }
}
