import { parseArgv, type ParsedArgs } from "../cli/foundation/argv.js";
import { fail } from "./errors.js";

/**
 * Flags that never take a value. The argv block treats `--json tennis` as
 * json="tennis"; rewriting known booleans to `--flag=true` first keeps the
 * following token a positional.
 */
const BOOLEAN_FLAGS = new Set([
  "json", "dry-run", "no-input", "quiet", "verbose", "help", "yes", "all",
  "open", "version", "no-banner", "free", "password-stdin", "paid", "available", "upcoming", "accept-habeas-data", "save", "forget",
]);
const SHORT_BOOLEANS = new Set(["q", "v", "h", "y"]);

export function parseArgs(argv: string[]): ParsedArgs {
  const rewritten = argv.map((a) => {
    if (a.startsWith("--") && !a.includes("=") && BOOLEAN_FLAGS.has(a.slice(2))) return `${a}=true`;
    return a;
  });
  const parsed = parseArgv(rewritten);
  for (const key of Object.keys(parsed)) {
    if (parsed[key] === "true") parsed[key] = true;
    if (parsed[key] === "false") parsed[key] = false;
  }
  for (const s of SHORT_BOOLEANS) if (parsed[s] !== undefined) parsed[s] = true;
  return parsed;
}

export function str(args: ParsedArgs, key: string): string | undefined {
  const v = args[key];
  if (v === undefined || v === true || v === false) return undefined;
  return String(v);
}

export function requireStr(args: ParsedArgs, key: string, flag = `--${key}`): string {
  const v = str(args, key);
  if (!v) fail("usage/missing-flag", `Falta ${flag}.`, `Agrega ${flag} <valor>.`);
  return v;
}

export function positional(args: ParsedArgs, index: number, name: string): string {
  const v = args._[index];
  if (!v) fail("usage/missing-arg", `Falta el argumento <${name}>.`, `Uso: ver \`cupo help\`.`);
  return v;
}

export function int(args: ParsedArgs, key: string, def?: number): number | undefined {
  const v = str(args, key);
  if (v === undefined) return def;
  const n = Number(v);
  if (!Number.isInteger(n)) fail("usage/bad-number", `--${key} debe ser un entero, recibí "${v}".`);
  return n;
}
