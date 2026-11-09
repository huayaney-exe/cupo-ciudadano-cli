import { readFileSync } from "node:fs";
import { promptSecret } from "../cli/agent/prompt-secret.js";
import { loadConfig, saveConfig } from "../cli/foundation/config.js";
import { clearSession, loadSession, saveSession, type SessionBase } from "../cli/foundation/session.js";
import { AppError, fail } from "../core/errors.js";
import { paths, profileName } from "../core/paths.js";
import { envFileValue, forgetSecret, loadSecret, saveSecret, secretLocation, type SecretRef } from "../core/secrets.js";
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

export const secretRef = (email: string): SecretRef => ({ service: "cupo-idrd", account: email, envKey: "IDRD_PASSWORD" });

/** Email for this profile: flag > IDRD_EMAIL (env or ~/.cupo/env) > remembered from the last login. */
export function knownEmail(profile?: string): string | undefined {
  return process.env.IDRD_EMAIL ?? envFileValue("IDRD_EMAIL") ?? storedEmail(profile);
}

/** A password that needs no human: env, ~/.cupo/env, or the Keychain (after `auth login --save`). */
export function savedPassword(email: string): string | undefined {
  return process.env.IDRD_PASSWORD || loadSecret(secretRef(email))?.value;
}

/**
 * Resolves the password:
 * IDRD_PASSWORD env > --password-stdin pipe > saved (~/.cupo/env or Keychain) > no-echo TTY prompt.
 * Without any of those it fails instead of hanging. Only `--save` ever stores it.
 */
export async function resolvePassword(opts: { stdin?: boolean; noInput?: boolean; email?: string }): Promise<string> {
  if (process.env.IDRD_PASSWORD) return process.env.IDRD_PASSWORD;
  if (opts.stdin) {
    const text = readFileSync(0, "utf8").split(/\r?\n/)[0] ?? "";
    if (!text) fail("auth/password-required", "No llegó contraseña por stdin.");
    return text;
  }
  if (opts.email) {
    const saved = loadSecret(secretRef(opts.email));
    if (saved) return saved.value;
  }
  if (!opts.noInput) {
    const pw = await promptSecret("Contraseña IDRD: ");
    if (pw) return pw;
  }
  return fail(
    "auth/password-required",
    "Necesito tu contraseña y no hay terminal interactiva.",
    "Exporta IDRD_PASSWORD, usa --password-stdin, o guárdala una vez con `cupo idrd auth login --save`.",
  );
}

export async function login(profile: string | undefined, email: string, password: string, opts: { save?: boolean } = {}): Promise<IdrdSession & { savedTo?: string }> {
  const tokens = await passwordGrant(email, password);
  // Identifier only. The password is stored only when the user asks for --save, and only after the portal accepted it.
  saveConfig<IdrdConfig>(paths.config(), { profiles: { [profileName(profile)]: { email } } });
  const session = persist(profile, email, tokens);
  if (!opts.save) return session;
  const saved = saveSecret(secretRef(email), password);
  return { ...session, savedTo: saved.detail };
}

export function forgetPassword(email: string): { file: boolean; keychain: boolean } {
  return forgetSecret(secretRef(email));
}

export function passwordLocation(email: string | undefined): "file" | "keychain" | null {
  return email ? secretLocation(secretRef(email)) : null;
}

/** Logs in again with a saved password, without a human. Returns null when there is nothing saved. */
async function autoLogin(profile: string | undefined, email: string | undefined): Promise<IdrdSession | null> {
  if (!email) return null;
  const password = savedPassword(email);
  if (!password) return null;
  return login(profile, email, password);
}

export function logoutLocal(profile?: string): void {
  clearSession(paths.sessions(profile));
}

/** Returns a usable access token, refreshing when it is close to expiry. */
export async function accessToken(profile?: string): Promise<{ token: string; session: IdrdSession; refreshed: boolean }> {
  const session = currentSession(profile);
  if (!session) {
    const auto = await autoLogin(profile, knownEmail(profile));
    if (auto) return { token: auto.accessToken, session: auto, refreshed: true };
    fail("auth/required", "No has iniciado sesión.", "Corre `cupo idrd auth login --email <tu correo>` (con --save no vuelve a pedir la contraseña).");
  }
  const expiresAt = session.expiresAt ? Date.parse(session.expiresAt) : 0;
  if (expiresAt - Date.now() > REFRESH_MARGIN_MS) return { token: session.accessToken, session, refreshed: false };
  // The portal revokes refresh tokens (observed live 2026-11-09), so this usually fails; a saved password is the reliable path.
  if (session.refreshToken) {
    try {
      const t = await refreshGrant(session.refreshToken);
      const next = persist(profile, session.email, t, session.refreshToken);
      return { token: next.accessToken, session: next, refreshed: true };
    } catch (err) {
      if (!(err instanceof AppError)) throw err;
    }
  }
  const auto = await autoLogin(profile, session.email);
  if (auto) return { token: auto.accessToken, session: auto, refreshed: true };
  return fail("auth/expired", "La sesión venció y no se pudo renovar.", "Corre `cupo idrd auth login` (con --save no vuelve a pedir la contraseña).");
}
