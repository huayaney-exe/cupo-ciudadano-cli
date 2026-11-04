import { printBanner } from "./cli/foundation/banner.js";
import { parseGlobalFlags, type GlobalFlags } from "./cli/foundation/global-flags.js";
import { parseArgs } from "./core/args.js";
import { AppError, EXIT, exitCodeFor, toAppError } from "./core/errors.js";
import { emitError, emitResult, isJson } from "./core/output.js";
import { authLogin, authLogout, authStatus, bookingList, commandHelp, doctor, helpText, killswitch, payHistory, payPending, schema, VERSION } from "./commands/account.js";
import { activityCategories, activityGet, activityList, activityMine, activityPrograms, activityStages, activitySubscribe, activityUnsubscribe, profileList } from "./commands/activities.js";
import { gymActivate, gymActive, gymAvailability, gymBuy, gymQuote, gymStatus } from "./commands/gym.js";
import * as cefe from "./commands/cefe.js";
import type { Handler } from "./commands/context.js";
import { courtGet, courtLanes, courtList, courtSports, slotFind, slotList } from "./commands/read.js";
import { bookingCreate, payBanks, payPse, payStatus } from "./commands/write.js";
import { COMMANDS, findCommand } from "./registry.js";

const HANDLERS: Record<string, Handler> = {
  "court list": courtList,
  "court get": courtGet,
  "court lanes": courtLanes,
  "court sports": courtSports,
  "slot list": slotList,
  "slot find": slotFind,
  "auth login": authLogin,
  "auth status": authStatus,
  "auth logout": authLogout,
  "booking list": bookingList,
  "booking create": bookingCreate,
  "pay banks": payBanks,
  "pay pse": payPse,
  "pay status": payStatus,
  "pay pending": payPending,
  "pay history": payHistory,
  "gym status": gymStatus,
  "gym quote": gymQuote,
  "gym availability": gymAvailability,
  "gym active": gymActive,
  "gym buy": gymBuy,
  "gym activate": gymActivate,
  "activity list": activityList,
  "activity get": activityGet,
  "activity programs": activityPrograms,
  "activity stages": activityStages,
  "activity categories": activityCategories,
  "activity mine": activityMine,
  "activity subscribe": activitySubscribe,
  "activity unsubscribe": activityUnsubscribe,
  "profile list": profileList,
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
const ALIASES: Record<string, string[]> = { find: ["slot", "find"], space: ["court"], activities: ["activity"], "cefe find": ["cefe", "slot", "find"], "cefe pools": ["cefe", "pool", "list"], "cefe courses": ["cefe", "course", "list"] };

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
      emitError("idrd", new AppError("usage/no-command", { name: "NoCommand", human: "Falta el comando.", hint: "Corre `idrd schema` para ver el contrato." }), flags);
      return EXIT.usage;
    }
    if (!args.noBanner) printBanner({ name: "IDRD", version: VERSION, tagline: "Portal Ciudadano · Bogotá", gradient: ["#F5C518", "#2E7D32"] });
    process.stderr.write(`${helpText()}\n`);
    return EXIT.ok;
  }

  const found = findCommand(words);
  const commandName = found?.spec.name ?? words.join(" ");
  if (!found) {
    const err = new AppError("usage/unknown-command", {
      name: "UnknownCommand",
      human: `Comando desconocido: ${words.join(" ")}`,
      hint: `Disponibles: ${COMMANDS.map((c) => c.name).join(", ")}`,
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
    const exit = result.meta?.exitCode;
    return typeof exit === "number" ? exit : EXIT.ok;
  } catch (e) {
    const err = toAppError(e);
    emitError(found.spec.name, err, flags);
    if (process.env.DEBUG && err.cause instanceof Error) process.stderr.write(`${err.cause.stack}\n`);
    return exitCodeFor(err.code);
  }
}
