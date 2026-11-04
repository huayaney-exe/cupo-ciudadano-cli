import { readFileSync } from "node:fs";
import { promptSecret } from "../cli/agent/prompt-secret.js";
import { loadConfig, saveConfig } from "../cli/foundation/config.js";
import { clearSession, loadSession, saveSession, type SessionBase } from "../cli/foundation/session.js";
import { fail } from "../core/errors.js";
import { paths, profileName } from "../core/paths.js";
import { login as apiLogin, type CefeUser } from "./api.js";

/** Token plus the user record the login returned (userId is needed for every call). */
export type CefeSession = SessionBase & { email: string; token: string; user: CefeUser };

type CefeConfig = { email?: string };

export function storedEmail(profile?: string): string | undefined {
  return loadConfig<CefeConfig>(paths.cefe.config(), profileName(profile)).email;
}

export function currentSession(profile?: string): CefeSession | null {
  return loadSession<CefeSession>(paths.cefe.sessions(profile));
}

/** The token is a JWT in the SPA; read `exp` when present, otherwise assume 12 h. Unverified live. */
export function tokenExpiry(token: string, now = Date.now()): string {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8")) as { exp?: number };
    if (typeof payload.exp === "number") return new Date(payload.exp * 1000).toISOString();
  } catch {
    /* opaque token */
  }
  return new Date(now + 12 * 3600_000).toISOString();
}

export async function resolvePassword(opts: { stdin?: boolean; noInput?: boolean }): Promise<string> {
  if (process.env.CEFE_PASSWORD) return process.env.CEFE_PASSWORD;
  if (opts.stdin) {
    const text = readFileSync(0, "utf8").split(/\r?\n/)[0] ?? "";
    if (!text) fail("auth/password-required", "No llegó contraseña por stdin.");
    return text;
  }
  if (!opts.noInput) {
    const pw = await promptSecret("Contraseña CEFE Chapinero: ");
    if (pw) return pw;
  }
  return fail("auth/password-required", "Necesito tu contraseña y no hay terminal interactiva.", "Exporta CEFE_PASSWORD o usa --password-stdin. Nunca se guarda en disco.");
}

export function persistSession(profile: string | undefined, email: string, token: string, user: CefeUser): CefeSession {
  const session: CefeSession = { createdAt: new Date().toISOString(), expiresAt: tokenExpiry(token), email, token, user };
  saveSession(paths.cefe.sessions(profile), session);
  saveConfig<CefeConfig>(paths.cefe.config(), { profiles: { [profileName(profile)]: { email } } });
  return session;
}

export async function login(profile: string | undefined, email: string, password: string): Promise<CefeSession> {
  const { token, user } = await apiLogin(email, password);
  return persistSession(profile, email, token, user);
}

export function logoutLocal(profile?: string): void {
  clearSession(paths.cefe.sessions(profile));
}

/** No refresh endpoint exists: an expired token means logging in again. */
export function requireSession(profile?: string): CefeSession {
  const s = currentSession(profile);
  if (!s) fail("auth/required", "No has iniciado sesión en CEFE Chapinero.", "Corre `idrd cefe auth login --email <tu correo>`.");
  if (s.expiresAt && Date.parse(s.expiresAt) < Date.now()) fail("auth/expired", "La sesión de CEFE Chapinero venció.", "Corre `idrd cefe auth login` de nuevo.");
  return s;
}
