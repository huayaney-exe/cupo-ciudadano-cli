import { homedir } from "node:os";
import { join } from "node:path";

import { existsSync } from "node:fs";

/**
 * Root for all local state: CUPO_HOME, else ~/.cupo. An existing ~/.cupo idrd from
 * the time the CLI was called `idrd` keeps working until it is moved.
 * IDRD_HOME is honoured as the old name of the same setting.
 */
export function appHome(): string {
  if (process.env.CUPO_HOME) return process.env.CUPO_HOME;
  if (process.env.IDRD_HOME) return process.env.IDRD_HOME;
  const cupo = join(homedir(), ".cupo");
  const legacy = join(homedir(), ".idrd");
  return !existsSync(cupo) && existsSync(legacy) ? legacy : cupo;
}

export function profileName(profile?: string): string {
  return profile || process.env.CUPO_PROFILE || process.env.IDRD_PROFILE || "default";
}

export const paths = {
  config: () => appHome(),
  sessions: (profile?: string) => join(appHome(), "sessions", profileName(profile)),
  audit: () => join(appHome(), "audit"),
  bookings: (profile?: string) => join(appHome(), "bookings", profileName(profile)),
  /** CEFE Chapinero (cefechapinero.com) is a different platform and account: its own store. */
  cefe: {
    config: () => join(appHome(), "cefe"),
    sessions: (profile?: string) => join(appHome(), "cefe", "sessions", profileName(profile)),
  },
};
