import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { appHome } from "./paths.js";

/**
 * Where a saved password lives when the user asks for `auth login --save`.
 *
 * - `keychain`: macOS Keychain through the system `security` tool. Default on macOS.
 * - `file`: `~/.cupo/env`, a KEY=VALUE file with mode 0600. Default elsewhere.
 * - `none`: never save; `--save` fails.
 *
 * `CUPO_SECRETS=keychain|file|none` overrides the default. Lookup order when a
 * password is needed: process env > `~/.cupo/env` > Keychain > prompt.
 */
export type SecretBackend = "keychain" | "file" | "none";

export function secretBackend(): SecretBackend {
  const env = process.env.CUPO_SECRETS;
  if (env === "keychain" || env === "file" || env === "none") return env;
  return process.platform === "darwin" && hasSecurityTool() ? "keychain" : "file";
}

let securityChecked: boolean | undefined;
function hasSecurityTool(): boolean {
  if (securityChecked === undefined) securityChecked = existsSync("/usr/bin/security");
  return securityChecked;
}

export function envFilePath(): string {
  return join(appHome(), "env");
}

function readEnvFile(): Record<string, string> {
  const file = envFilePath();
  if (!existsSync(file)) return {};
  const out: Record<string, string> = {};
  for (const raw of readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim().replace(/^export\s+/, "");
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    out[key] = value;
  }
  return out;
}

/** A value from `~/.cupo/env`, the user-editable file. Works on every platform and with every backend. */
export function envFileValue(key: string): string | undefined {
  return readEnvFile()[key];
}

function writeEnvFile(values: Record<string, string | undefined>): void {
  const file = envFilePath();
  const merged = { ...readEnvFile(), ...values };
  const lines = Object.entries(merged).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}=${v}`);
  mkdirSync(appHome(), { recursive: true, mode: 0o700 });
  writeFileSync(file, lines.length ? `${lines.join("\n")}\n` : "", { mode: 0o600 });
  chmodSync(file, 0o600);
}

/** Security-tool quoting: its interactive parser accepts "…" with \" and \\ escapes. */
const q = (s: string) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

function keychainRead(service: string, account: string): string | undefined {
  const r = spawnSync("/usr/bin/security", ["find-generic-password", "-s", service, "-a", account, "-w"], { encoding: "utf8" });
  if (r.status !== 0) return undefined;
  const v = r.stdout.replace(/\r?\n$/, "");
  return v || undefined;
}

function keychainWrite(service: string, account: string, value: string): void {
  // `security -i` reads the command from stdin so the secret never appears in argv.
  const r = spawnSync("/usr/bin/security", ["-i"], { input: `add-generic-password -U -s ${q(service)} -a ${q(account)} -w ${q(value)}\n`, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`security add-generic-password: ${r.stderr.trim() || `exit ${r.status}`}`);
}

function keychainDelete(service: string, account: string): boolean {
  const r = spawnSync("/usr/bin/security", ["delete-generic-password", "-s", service, "-a", account], { encoding: "utf8" });
  return r.status === 0;
}

export type SecretRef = { service: string; account: string; envKey: string };

/** Saved password, if any: `~/.cupo/env` first, then the Keychain. Never prompts. */
export function loadSecret(ref: SecretRef): { value: string; source: "file" | "keychain" } | undefined {
  const fromFile = envFileValue(ref.envKey);
  if (fromFile) return { value: fromFile, source: "file" };
  if (secretBackend() === "keychain") {
    const v = keychainRead(ref.service, ref.account);
    if (v) return { value: v, source: "keychain" };
  }
  return undefined;
}

export function saveSecret(ref: SecretRef, value: string): { where: "file" | "keychain"; detail: string } {
  const backend = secretBackend();
  if (backend === "none") throw new Error("CUPO_SECRETS=none: guardar contraseñas está deshabilitado.");
  if (backend === "keychain") {
    keychainWrite(ref.service, ref.account, value);
    return { where: "keychain", detail: `Llavero de macOS (servicio ${ref.service}, cuenta ${ref.account})` };
  }
  writeEnvFile({ [ref.envKey]: value });
  return { where: "file", detail: `${envFilePath()} (permisos 0600)` };
}

export function forgetSecret(ref: SecretRef): { file: boolean; keychain: boolean } {
  const file = envFileValue(ref.envKey) !== undefined;
  if (file) writeEnvFile({ [ref.envKey]: undefined });
  const keychain = secretBackend() === "keychain" ? keychainDelete(ref.service, ref.account) : false;
  return { file, keychain };
}

/** Where a saved password for this account is, for `auth status` and `doctor`. */
export function secretLocation(ref: SecretRef): "file" | "keychain" | null {
  return loadSecret(ref)?.source ?? null;
}

/** Warn-worthy: an env file readable by others. */
export function envFileInsecure(): boolean {
  const file = envFilePath();
  if (!existsSync(file) || process.platform === "win32") return false;
  return (statSync(file).mode & 0o077) !== 0;
}
