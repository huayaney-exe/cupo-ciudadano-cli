import { AppError, type ErrorEntry } from "../cli/foundation/error-map.js";

export { AppError };

/** Exit codes are part of the contract. Agents branch on them. */
export const EXIT = {
  ok: 0,
  unknown: 1,
  usage: 2,
  auth: 3,
  notFound: 4,
  refused: 5,
  upstream: 6,
} as const;

const EXIT_BY_PREFIX: Array<[string, number]> = [
  ["usage/", EXIT.usage],
  ["rule/", EXIT.usage],
  ["auth/", EXIT.auth],
  ["not-found/", EXIT.notFound],
  ["approval/", EXIT.refused],
  ["safety/", EXIT.refused],
  ["slot/", EXIT.refused],
  ["upstream/", EXIT.upstream],
  ["network/", EXIT.upstream],
];

export function exitCodeFor(code: string): number {
  for (const [prefix, exit] of EXIT_BY_PREFIX) if (code.startsWith(prefix)) return exit;
  return EXIT.unknown;
}

export function fail(code: string, human: string, hint?: string, cause?: unknown): never {
  const entry: ErrorEntry = { name: code, human, hint };
  throw new AppError(code, entry, cause);
}

export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  const message = err instanceof Error ? err.message : String(err);
  return new AppError("unknown", { name: "UnknownError", human: message }, err);
}
