import { homedir } from "node:os";
import { join } from "node:path";

/** Root for all local state. Override with IDRD_HOME (tests use a temp dir). */
export function appHome(): string {
  return process.env.IDRD_HOME || join(homedir(), ".idrd");
}

export function profileName(profile?: string): string {
  return profile || process.env.IDRD_PROFILE || "default";
}

export const paths = {
  config: () => appHome(),
  sessions: (profile?: string) => join(appHome(), "sessions", profileName(profile)),
  audit: () => join(appHome(), "audit"),
  bookings: (profile?: string) => join(appHome(), "bookings", profileName(profile)),
};
