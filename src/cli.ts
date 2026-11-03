import { printBanner } from "./cli/foundation/banner.js";
import { parseGlobalFlags, type GlobalFlags } from "./cli/foundation/global-flags.js";
import { parseArgs } from "./core/args.js";
import { AppError, EXIT, exitCodeFor, toAppError } from "./core/errors.js";
import { emitError, emitResult, isJson } from "./core/output.js";
import { authLogin, authLogout, authStatus, bookingList, commandHelp, doctor, helpText, killswitch, schema, VERSION } from "./commands/account.js";
import type { Handler } from "./commands/context.js";
import { courtGet, courtList, slotFind, slotList } from "./commands/read.js";
import { bookingCreate, payBanks, payPse, payStatus } from "./commands/write.js";
import { COMMANDS, findCommand } from "./registry.js";

const HANDLERS: Record<string, Handler> = {
  "court list": courtList,
  "court get": courtGet,
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
  doctor,
  killswitch,
  schema,
};

/** The single most common operation gets the shortest spelling. */
const ALIASES: Record<string, string[]> = { find: ["slot", "find"] };

export async function main(argv: string[]): Promise<number> {
  const args = parseArgs(argv);
  const flags: GlobalFlags = parseGlobalFlags(args);
  let words = args._.slice();
  const alias = words[0] ? ALIASES[words[0]] : undefined;
  if (alias) words = [...alias, ...words.slice(1)];

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
