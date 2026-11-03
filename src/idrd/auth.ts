import { readFileSync } from "node:fs";
import { promptSecret } from "../cli/agent/prompt-secret.js";
import { loadConfig, saveConfig } from "../cli/foundation/config.js";
import { clearSession, loadSession, saveSession, type SessionBase } from "../cli/foundation/session.js";
import { AppError, fail } from "../core/errors.js";
import { paths, profileName } from "../core/paths.js";
import { passwordGrant, refreshGrant, type TokenSet } from "./api.js";

export type IdrdSession = SessionBase & {
  email: string;
  accessToken: string;
  refreshToken?: string;
};

type IdrdConfig = { email?: string };

const REFRESH_MARGIN_MS = 5 * 60_000;

export function storedEmail(profile?: string): string | undefined {
  return loadConfig<IdrdConfig>(paths.config(), profileName(profile)).email;
}

export function currentSession(profile?: string): IdrdSession | null {
  return loadSession<IdrdSession>(paths.sessions(profile));
}

function persist(profile: string | undefined, email: string, t: TokenSet, previousRefresh?: string): IdrdSession {
  const now = Date.now();
  const session: IdrdSession = {
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + t.expiresIn * 1000).toISOString(),
    email,
    accessToken: t.accessToken,
    // Some OAuth servers rotate the refresh token, some do not.
    refreshToken: t.refreshToken ?? previousRefresh,
  };
  saveSession(paths.sessions(profile), session);
  return session;
}

/**
 * Resolves the password without ever persisting it:
 * IDRD_PASSWORD env > --password-stdin pipe > no-echo TTY prompt.
 * Without any of those it fails instead of hanging.
 */
export async function resolvePassword(opts: { stdin?: boolean; noInput?: boolean }): Promise<string> {
  if (process.env.IDRD_PASSWORD) return process.env.IDRD_PASSWORD;
  if (opts.stdin) {
    const text = readFileSync(0, "utf8").split(/\r?\n/)[0] ?? "";
    if (!text) fail("auth/password-required", "No llegó contraseña por stdin.");
    return text;
  }
  if (!opts.noInput) {
    const pw = await promptSecret("Contraseña IDRD: ");
    if (pw) return pw;
  }
  return fail(
    "auth/password-required",
    "Necesito tu contraseña y no hay terminal interactiva.",
    "Exporta IDRD_PASSWORD o usa --password-stdin. Nunca se guarda en disco.",
  );
}

export async function login(profile: string | undefined, email: string, password: string): Promise<IdrdSession> {
  const tokens = await passwordGrant(email, password);
  // Identifier only. The password is never written anywhere.
  saveConfig<IdrdConfig>(paths.config(), { profiles: { [profileName(profile)]: { email } } });
  return persist(profile, email, tokens);
}

export function logoutLocal(profile?: string): void {
  clearSession(paths.sessions(profile));
}

/** Returns a usable access token, refreshing when it is close to expiry. */
export async function accessToken(profile?: string): Promise<{ token: string; session: IdrdSession; refreshed: boolean }> {
  const session = currentSession(profile);
  if (!session) fail("auth/required", "No has iniciado sesión.", "Corre `idrd auth login --email <tu correo>`.");
  const expiresAt = session.expiresAt ? Date.parse(session.expiresAt) : 0;
  if (expiresAt - Date.now() > REFRESH_MARGIN_MS) return { token: session.accessToken, session, refreshed: false };
  if (!session.refreshToken) fail("auth/expired", "La sesión venció.", "Corre `idrd auth login`.");
  try {
    const t = await refreshGrant(session.refreshToken);
    const next = persist(profile, session.email, t, session.refreshToken);
    return { token: next.accessToken, session: next, refreshed: true };
  } catch (err) {
    if (err instanceof AppError) fail("auth/expired", "La sesión venció y no se pudo renovar.", "Corre `idrd auth login`.", err);
    throw err;
  }
}
