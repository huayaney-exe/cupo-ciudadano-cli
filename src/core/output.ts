import { detectMode, shouldColor } from "../cli/platform/detect.js";
import { emitNextSteps, type NextStep } from "../cli/agent/next-steps.js";
import type { AppError } from "../cli/foundation/error-map.js";
import type { GlobalFlags } from "../cli/foundation/global-flags.js";

export const SCHEMA_VERSION = 1;
export type { NextStep };

export type Envelope<T> = {
  ok: true;
  schemaVersion: number;
  command: string;
  data: T;
  nextSteps: NextStep[];
  meta?: Record<string, unknown>;
};

export type Result<T> = {
  data: T;
  human?: (data: T) => string;
  nextSteps?: NextStep[];
  meta?: Record<string, unknown>;
};

export function isJson(flags: Pick<GlobalFlags, "json">): boolean {
  return detectMode({ json: flags.json }) === "json";
}

/**
 * One JSON object per invocation on stdout in machine mode (envelope with
 * nextSteps inline). Human mode: rendered text on stdout, next steps on stderr.
 */
export function emitResult<T>(command: string, result: Result<T>, flags: GlobalFlags): void {
  const nextSteps = result.nextSteps ?? [];
  if (isJson(flags)) {
    const env: Envelope<T> = {
      ok: true,
      schemaVersion: SCHEMA_VERSION,
      command,
      data: result.data,
      nextSteps,
      ...(result.meta ? { meta: result.meta } : {}),
    };
    process.stdout.write(`${JSON.stringify(env)}\n`);
    return;
  }
  const text = result.human ? result.human(result.data) : JSON.stringify(result.data, null, 2);
  if (text) process.stdout.write(text.endsWith("\n") ? text : `${text}\n`);
  if (!flags.quiet && nextSteps.length) emitNextSteps(nextSteps, { json: false });
}

export function emitError(command: string, err: AppError, flags: GlobalFlags): void {
  if (isJson(flags)) {
    const body = {
      ok: false,
      schemaVersion: SCHEMA_VERSION,
      command,
      error: { code: err.code, message: err.human, ...(err.hint ? { hint: err.hint } : {}) },
    };
    process.stdout.write(`${JSON.stringify(body)}\n`);
    return;
  }
  const red = shouldColor() ? (t: string) => `\x1b[38;5;203m${t}\x1b[0m` : (t: string) => t;
  const dim = shouldColor() ? (t: string) => `\x1b[2m${t}\x1b[0m` : (t: string) => t;
  process.stderr.write(`${red("✗")} ${err.human}\n`);
  if (err.hint) process.stderr.write(`  ${dim(err.hint)}\n`);
  process.stderr.write(`  ${dim(`(${err.code})`)}\n`);
}

/** Diagnostics: stderr, human mode only, suppressed by --quiet. */
export function diag(message: string, flags: GlobalFlags): void {
  if (isJson(flags) || flags.quiet) return;
  const text = shouldColor() ? `\x1b[2m${message}\x1b[0m` : message;
  process.stderr.write(`${text}\n`);
}
