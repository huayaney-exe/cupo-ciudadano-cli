#!/usr/bin/env node
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
function __accessProp(key) {
  return this[key];
}
var __toESMCache_node;
var __toESMCache_esm;
var __toESM = (mod, isNodeMode, target) => {
  var canCache = mod != null && typeof mod === "object";
  if (canCache) {
    var cache = isNodeMode ? __toESMCache_node ??= new WeakMap : __toESMCache_esm ??= new WeakMap;
    var cached = cache.get(mod);
    if (cached)
      return cached;
  }
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: __accessProp.bind(mod, key),
        enumerable: true
      });
  if (canCache)
    cache.set(mod, to);
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);

// node_modules/picocolors/picocolors.js
var require_picocolors = __commonJS((exports, module) => {
  var p = process || {};
  var argv = p.argv || [];
  var env = p.env || {};
  var isColorSupported = !(!!env.NO_COLOR || argv.includes("--no-color")) && (!!env.FORCE_COLOR || argv.includes("--color") || p.platform === "win32" || (p.stdout || {}).isTTY && env.TERM !== "dumb" || !!env.CI);
  var formatter = (open, close, replace = open) => (input) => {
    let string = "" + input, index = string.indexOf(close, open.length);
    return ~index ? open + replaceClose(string, close, replace, index) + close : open + string + close;
  };
  var replaceClose = (string, close, replace, index) => {
    let result = "", cursor = 0;
    do {
      result += string.substring(cursor, index) + replace;
      cursor = index + close.length;
      index = string.indexOf(close, cursor);
    } while (~index);
    return result + string.substring(cursor);
  };
  var createColors = (enabled = isColorSupported) => {
    let f = enabled ? formatter : () => String;
    return {
      isColorSupported: enabled,
      reset: f("\x1B[0m", "\x1B[0m"),
      bold: f("\x1B[1m", "\x1B[22m", "\x1B[22m\x1B[1m"),
      dim: f("\x1B[2m", "\x1B[22m", "\x1B[22m\x1B[2m"),
      italic: f("\x1B[3m", "\x1B[23m"),
      underline: f("\x1B[4m", "\x1B[24m"),
      inverse: f("\x1B[7m", "\x1B[27m"),
      hidden: f("\x1B[8m", "\x1B[28m"),
      strikethrough: f("\x1B[9m", "\x1B[29m"),
      black: f("\x1B[30m", "\x1B[39m"),
      red: f("\x1B[31m", "\x1B[39m"),
      green: f("\x1B[32m", "\x1B[39m"),
      yellow: f("\x1B[33m", "\x1B[39m"),
      blue: f("\x1B[34m", "\x1B[39m"),
      magenta: f("\x1B[35m", "\x1B[39m"),
      cyan: f("\x1B[36m", "\x1B[39m"),
      white: f("\x1B[37m", "\x1B[39m"),
      gray: f("\x1B[90m", "\x1B[39m"),
      bgBlack: f("\x1B[40m", "\x1B[49m"),
      bgRed: f("\x1B[41m", "\x1B[49m"),
      bgGreen: f("\x1B[42m", "\x1B[49m"),
      bgYellow: f("\x1B[43m", "\x1B[49m"),
      bgBlue: f("\x1B[44m", "\x1B[49m"),
      bgMagenta: f("\x1B[45m", "\x1B[49m"),
      bgCyan: f("\x1B[46m", "\x1B[49m"),
      bgWhite: f("\x1B[47m", "\x1B[49m"),
      blackBright: f("\x1B[90m", "\x1B[39m"),
      redBright: f("\x1B[91m", "\x1B[39m"),
      greenBright: f("\x1B[92m", "\x1B[39m"),
      yellowBright: f("\x1B[93m", "\x1B[39m"),
      blueBright: f("\x1B[94m", "\x1B[39m"),
      magentaBright: f("\x1B[95m", "\x1B[39m"),
      cyanBright: f("\x1B[96m", "\x1B[39m"),
      whiteBright: f("\x1B[97m", "\x1B[39m"),
      bgBlackBright: f("\x1B[100m", "\x1B[49m"),
      bgRedBright: f("\x1B[101m", "\x1B[49m"),
      bgGreenBright: f("\x1B[102m", "\x1B[49m"),
      bgYellowBright: f("\x1B[103m", "\x1B[49m"),
      bgBlueBright: f("\x1B[104m", "\x1B[49m"),
      bgMagentaBright: f("\x1B[105m", "\x1B[49m"),
      bgCyanBright: f("\x1B[106m", "\x1B[49m"),
      bgWhiteBright: f("\x1B[107m", "\x1B[49m")
    };
  };
  module.exports = createColors();
  module.exports.createColors = createColors;
});

// src/cli/platform/detect.ts
import { existsSync, readFileSync } from "node:fs";
import { platform } from "node:os";
var wslCache = null;
function isWsl() {
  if (wslCache !== null)
    return wslCache;
  if (platform() !== "linux") {
    wslCache = false;
    return false;
  }
  try {
    const version = readFileSync("/proc/version", "utf8").toLowerCase();
    wslCache = version.includes("microsoft") || version.includes("wsl");
  } catch {
    wslCache = false;
  }
  return wslCache;
}
function isCi() {
  return Boolean(process.env.CI || process.env.CONTINUOUS_INTEGRATION || process.env.GITHUB_ACTIONS || process.env.GITLAB_CI || process.env.CIRCLECI || process.env.BUILDKITE);
}
function isHeadlessLinux() {
  if (platform() !== "linux")
    return false;
  if (isWsl())
    return false;
  return !process.env.DISPLAY && !process.env.WAYLAND_DISPLAY;
}
function hasCommand(cmd) {
  const separator = platform() === "win32" ? ";" : ":";
  const paths = (process.env.PATH || "").split(separator);
  const exts = platform() === "win32" ? [".exe", ".cmd", ".bat", ""] : [""];
  for (const p of paths) {
    for (const ext of exts) {
      if (existsSync(`${p}/${cmd}${ext}`))
        return true;
    }
  }
  return false;
}
function detectMode(opts = {}) {
  if (opts.json === true)
    return "json";
  if (process.env.NO_JSON === "1")
    return "human";
  if (!process.stdout.isTTY)
    return "json";
  return "human";
}
function shouldColor() {
  if (process.env.NO_COLOR)
    return false;
  if (process.env.FORCE_COLOR)
    return true;
  return Boolean(process.stdout.isTTY);
}

// src/cli/foundation/banner.ts
function printBanner(opts) {
  const { name, tagline, version, gradient = ["#FFFFFF", "#8A8A8A"] } = opts;
  const color = shouldColor();
  if (!color) {
    const v = version ? ` v${version}` : "";
    process.stderr.write(`
  ${name}${v}
`);
    if (tagline)
      process.stderr.write(`  ${tagline}
`);
    process.stderr.write(`
`);
    return;
  }
  const lines = toAsciiBlock(name.toUpperCase());
  const from = hexToRgb(gradient[0]);
  const to = hexToRgb(gradient[1]);
  process.stderr.write(`
`);
  for (let i = 0;i < lines.length; i++) {
    const t = lines.length > 1 ? i / (lines.length - 1) : 0;
    const r = Math.round(from.r + (to.r - from.r) * t);
    const g = Math.round(from.g + (to.g - from.g) * t);
    const b = Math.round(from.b + (to.b - from.b) * t);
    process.stderr.write(`  \x1B[38;2;${r};${g};${b}m${lines[i] ?? ""}\x1B[0m
`);
  }
  const meta = [];
  if (version)
    meta.push(`v${version}`);
  if (tagline)
    meta.push(tagline);
  if (meta.length) {
    process.stderr.write(`  \x1B[2m${meta.join("  ·  ")}\x1B[0m
`);
  }
  process.stderr.write(`
`);
}
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return {
    r: Number.parseInt(h.slice(0, 2), 16),
    g: Number.parseInt(h.slice(2, 4), 16),
    b: Number.parseInt(h.slice(4, 6), 16)
  };
}
var BLANK = ["     ", "     ", "     ", "     ", "     "];
function toAsciiBlock(text) {
  const out = ["", "", "", "", ""];
  for (let i = 0;i < text.length; i++) {
    const glyph = GLYPHS[text.charAt(i)] ?? BLANK;
    for (let row = 0;row < 5; row++) {
      out[row] = `${out[row] ?? ""}${glyph[row] ?? "     "} `;
    }
  }
  return out;
}
var GLYPHS = {
  A: ["  █  ", " █ █ ", "█████", "█   █", "█   █"],
  B: ["████ ", "█   █", "████ ", "█   █", "████ "],
  C: [" ████", "█    ", "█    ", "█    ", " ████"],
  D: ["████ ", "█   █", "█   █", "█   █", "████ "],
  E: ["█████", "█    ", "████ ", "█    ", "█████"],
  F: ["█████", "█    ", "████ ", "█    ", "█    "],
  G: [" ████", "█    ", "█  ██", "█   █", " ████"],
  H: ["█   █", "█   █", "█████", "█   █", "█   █"],
  I: ["█████", "  █  ", "  █  ", "  █  ", "█████"],
  J: ["█████", "    █", "    █", "█   █", " ███ "],
  K: ["█   █", "█  █ ", "███  ", "█  █ ", "█   █"],
  L: ["█    ", "█    ", "█    ", "█    ", "█████"],
  M: ["█   █", "██ ██", "█ █ █", "█   █", "█   █"],
  N: ["█   █", "██  █", "█ █ █", "█  ██", "█   █"],
  O: [" ███ ", "█   █", "█   █", "█   █", " ███ "],
  P: ["████ ", "█   █", "████ ", "█    ", "█    "],
  Q: [" ███ ", "█   █", "█ █ █", "█  █ ", " ██ █"],
  R: ["████ ", "█   █", "████ ", "█  █ ", "█   █"],
  S: [" ████", "█    ", " ███ ", "    █", "████ "],
  T: ["█████", "  █  ", "  █  ", "  █  ", "  █  "],
  U: ["█   █", "█   █", "█   █", "█   █", " ███ "],
  V: ["█   █", "█   █", "█   █", " █ █ ", "  █  "],
  W: ["█   █", "█   █", "█ █ █", "██ ██", "█   █"],
  X: ["█   █", " █ █ ", "  █  ", " █ █ ", "█   █"],
  Y: ["█   █", " █ █ ", "  █  ", "  █  ", "  █  "],
  Z: ["█████", "   █ ", "  █  ", " █   ", "█████"],
  " ": ["     ", "     ", "     ", "     ", "     "],
  "0": [" ███ ", "█  ██", "█ █ █", "██  █", " ███ "],
  "1": [" ██  ", "  █  ", "  █  ", "  █  ", "█████"],
  "2": [" ███ ", "█   █", "  ██ ", " █   ", "█████"],
  "3": ["████ ", "    █", " ███ ", "    █", "████ "],
  "4": ["█   █", "█   █", "█████", "    █", "    █"],
  "5": ["█████", "█    ", "████ ", "    █", "████ "],
  "6": [" ███ ", "█    ", "████ ", "█   █", " ███ "],
  "7": ["█████", "    █", "   █ ", "  █  ", "  █  "],
  "8": [" ███ ", "█   █", " ███ ", "█   █", " ███ "],
  "9": [" ███ ", "█   █", " ████", "    █", " ███ "]
};

// src/cli/foundation/global-flags.ts
function parseGlobalFlags(raw = {}) {
  return {
    json: Boolean(raw.json ?? process.env.IDRD_JSON === "1"),
    dryRun: Boolean(raw.dryRun ?? raw["dry-run"] ?? false),
    profile: raw.profile ?? process.env.IDRD_PROFILE ?? undefined,
    noInput: Boolean(raw.noInput ?? raw["no-input"] ?? process.env.CI === "true"),
    quiet: Boolean(raw.quiet ?? raw.q ?? false),
    verbose: Boolean(raw.verbose ?? raw.v ?? false)
  };
}

// src/cli/foundation/argv.ts
function kebabToCamel(s) {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}
function parseArgv(argv = process.argv.slice(2)) {
  const result = { _: [] };
  let i = 0;
  let stopped = false;
  while (i < argv.length) {
    const arg = argv[i];
    if (stopped || arg === undefined) {
      if (arg !== undefined)
        result._.push(arg);
      i++;
      continue;
    }
    if (arg === "--") {
      stopped = true;
      i++;
      continue;
    }
    if (arg.startsWith("--")) {
      const eqIdx = arg.indexOf("=");
      if (eqIdx !== -1) {
        const key = kebabToCamel(arg.slice(2, eqIdx));
        result[key] = arg.slice(eqIdx + 1);
      } else {
        const key = kebabToCamel(arg.slice(2));
        const next = argv[i + 1];
        if (next !== undefined && !next.startsWith("-")) {
          result[key] = next;
          i++;
        } else {
          result[key] = true;
        }
      }
      i++;
      continue;
    }
    if (arg.startsWith("-") && arg.length > 1) {
      for (let j = 1;j < arg.length; j++) {
        result[arg[j]] = true;
      }
      i++;
      continue;
    }
    result._.push(arg);
    i++;
  }
  return result;
}

// src/cli/foundation/error-map.ts
class AppError extends Error {
  code;
  human;
  hint;
  constructor(code, entry, cause) {
    super(entry.human);
    this.name = entry.name;
    this.code = code;
    this.human = entry.human;
    this.hint = entry.hint;
    if (cause)
      this.cause = cause;
  }
  toJSON() {
    return {
      ok: false,
      code: this.code,
      name: this.name,
      error: this.human,
      hint: this.hint
    };
  }
}

// src/core/errors.ts
var EXIT = {
  ok: 0,
  unknown: 1,
  usage: 2,
  auth: 3,
  notFound: 4,
  refused: 5,
  upstream: 6
};
var EXIT_BY_PREFIX = [
  ["usage/", EXIT.usage],
  ["rule/", EXIT.usage],
  ["auth/", EXIT.auth],
  ["not-found/", EXIT.notFound],
  ["approval/", EXIT.refused],
  ["safety/", EXIT.refused],
  ["slot/", EXIT.refused],
  ["upstream/", EXIT.upstream],
  ["network/", EXIT.upstream]
];
function exitCodeFor(code) {
  for (const [prefix, exit] of EXIT_BY_PREFIX)
    if (code.startsWith(prefix))
      return exit;
  return EXIT.unknown;
}
function fail(code, human, hint, cause) {
  const entry = { name: code, human, hint };
  throw new AppError(code, entry, cause);
}
function toAppError(err) {
  if (err instanceof AppError)
    return err;
  const message = err instanceof Error ? err.message : String(err);
  return new AppError("unknown", { name: "UnknownError", human: message }, err);
}

// src/core/args.ts
var BOOLEAN_FLAGS = new Set([
  "json",
  "dry-run",
  "no-input",
  "quiet",
  "verbose",
  "help",
  "yes",
  "all",
  "open",
  "version",
  "no-banner",
  "free",
  "password-stdin"
]);
var SHORT_BOOLEANS = new Set(["q", "v", "h", "y"]);
function parseArgs(argv) {
  const rewritten = argv.map((a) => {
    if (a.startsWith("--") && !a.includes("=") && BOOLEAN_FLAGS.has(a.slice(2)))
      return `${a}=true`;
    return a;
  });
  const parsed = parseArgv(rewritten);
  for (const key of Object.keys(parsed)) {
    if (parsed[key] === "true")
      parsed[key] = true;
    if (parsed[key] === "false")
      parsed[key] = false;
  }
  for (const s of SHORT_BOOLEANS)
    if (parsed[s] !== undefined)
      parsed[s] = true;
  return parsed;
}
function str(args, key) {
  const v = args[key];
  if (v === undefined || v === true || v === false)
    return;
  return String(v);
}
function requireStr(args, key, flag = `--${key}`) {
  const v = str(args, key);
  if (!v)
    fail("usage/missing-flag", `Falta ${flag}.`, `Agrega ${flag} <valor>.`);
  return v;
}
function positional(args, index, name) {
  const v = args._[index];
  if (!v)
    fail("usage/missing-arg", `Falta el argumento <${name}>.`, `Uso: ver \`idrd help\`.`);
  return v;
}
function int(args, key, def) {
  const v = str(args, key);
  if (v === undefined)
    return def;
  const n = Number(v);
  if (!Number.isInteger(n))
    fail("usage/bad-number", `--${key} debe ser un entero, recibí "${v}".`);
  return n;
}

// src/cli/agent/next-steps.ts
var import_picocolors = __toESM(require_picocolors(), 1);
function emitNextSteps(steps, opts = {}) {
  if (steps.length === 0)
    return;
  const mode = detectMode(opts);
  if (mode === "json") {
    for (const step of steps) {
      process.stderr.write(`${JSON.stringify({ type: "next-step", ...step })}
`);
    }
    return;
  }
  const color = shouldColor();
  const header = color ? import_picocolors.default.bold("Próximos pasos:") : "Próximos pasos:";
  process.stderr.write(`
${header}
`);
  for (const step of steps) {
    const marker = step.optional ? "○" : "→";
    const cmd = color ? import_picocolors.default.cyan(step.command) : step.command;
    const desc = color ? import_picocolors.default.dim(step.description) : step.description;
    process.stderr.write(`  ${marker} ${cmd}  ${desc}
`);
  }
  process.stderr.write(`
`);
}

// src/core/output.ts
var SCHEMA_VERSION = 1;
function isJson(flags) {
  return detectMode({ json: flags.json }) === "json";
}
function emitResult(command, result, flags) {
  const nextSteps = result.nextSteps ?? [];
  if (isJson(flags)) {
    const env = {
      ok: true,
      schemaVersion: SCHEMA_VERSION,
      command,
      data: result.data,
      nextSteps,
      ...result.meta ? { meta: result.meta } : {}
    };
    process.stdout.write(`${JSON.stringify(env)}
`);
    return;
  }
  const text = result.human ? result.human(result.data) : JSON.stringify(result.data, null, 2);
  if (text)
    process.stdout.write(text.endsWith(`
`) ? text : `${text}
`);
  if (!flags.quiet && nextSteps.length)
    emitNextSteps(nextSteps, { json: false });
}
function emitError(command, err, flags) {
  if (isJson(flags)) {
    const body = {
      ok: false,
      schemaVersion: SCHEMA_VERSION,
      command,
      error: { code: err.code, message: err.human, ...err.hint ? { hint: err.hint } : {} }
    };
    process.stdout.write(`${JSON.stringify(body)}
`);
    return;
  }
  const red = shouldColor() ? (t) => `\x1B[38;5;203m${t}\x1B[0m` : (t) => t;
  const dim = shouldColor() ? (t) => `\x1B[2m${t}\x1B[0m` : (t) => t;
  process.stderr.write(`${red("✗")} ${err.human}
`);
  if (err.hint)
    process.stderr.write(`  ${dim(err.hint)}
`);
  process.stderr.write(`  ${dim(`(${err.code})`)}
`);
}

// src/cli/agent/doctor.ts
async function runDoctor(checks) {
  const results = [];
  for (const check of checks) {
    try {
      results.push(await check());
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      results.push({ name: "unknown", ok: false, detail });
    }
  }
  return { ok: results.every((c) => c.ok), checks: results };
}

// src/cli/safety/killswitch.ts
import { existsSync as existsSync2, mkdirSync, readFileSync as readFileSync2, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
var KILLSWITCH_FILE = "KILLSWITCH";
function getPath(appHome) {
  return join(appHome, KILLSWITCH_FILE);
}
function getKillswitchState(appHome) {
  const path = getPath(appHome);
  if (!existsSync2(path))
    return { active: false };
  try {
    const data = JSON.parse(readFileSync2(path, "utf8"));
    return { active: true, reason: data.reason, activatedAt: data.at };
  } catch {
    return { active: true, reason: "unknown (file exists but unreadable)" };
  }
}
function turnKillswitchOn(appHome, reason = "manual") {
  mkdirSync(appHome, { recursive: true });
  writeFileSync(getPath(appHome), JSON.stringify({ reason, at: new Date().toISOString() }, null, 2));
}
function turnKillswitchOff(appHome) {
  const path = getPath(appHome);
  if (existsSync2(path)) {
    unlinkSync(path);
  }
}

// src/cli/platform/style.ts
var wrap = (code, text) => shouldColor() ? `\x1B[${code}m${text}\x1B[0m` : text;
var bold = (t) => wrap("1", t);
var dim = (t) => wrap("2", t);
var danger = (t) => wrap("38;5;203", t);
var warn = (t) => wrap("38;5;214", t);
var ok = (t) => wrap("38;5;114", t);
var info = (t) => wrap("38;5;110", t);
var muted = (t) => wrap("38;5;245", t);
var strong = (t) => wrap("38;5;255", t);
function visibleWidth(text) {
  return text.replace(/\x1b\[[0-9;]*m/g, "").length;
}
function padVisible(text, width) {
  const missing = width - visibleWidth(text);
  return missing > 0 ? text + " ".repeat(missing) : text;
}
function truncateVisible(text, width) {
  if (visibleWidth(text) <= width)
    return text;
  const plain = text.replace(/\x1b\[[0-9;]*m/g, "");
  return width <= 1 ? plain.slice(0, width) : `${plain.slice(0, width - 1)}…`;
}

// src/core/paths.ts
import { homedir } from "node:os";
import { join as join2 } from "node:path";
function appHome() {
  return process.env.IDRD_HOME || join2(homedir(), ".idrd");
}
function profileName(profile) {
  return profile || process.env.IDRD_PROFILE || "default";
}
var paths = {
  config: () => appHome(),
  sessions: (profile) => join2(appHome(), "sessions", profileName(profile)),
  audit: () => join2(appHome(), "audit"),
  bookings: (profile) => join2(appHome(), "bookings", profileName(profile))
};

// src/core/sanitize.ts
var ANSI = /\x1b\[[0-9;?]*[ -/]*[@-~]/g;
var CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩]/g;
var CP1252 = {
  "€": 128,
  "‚": 130,
  "ƒ": 131,
  "„": 132,
  "…": 133,
  "†": 134,
  "‡": 135,
  "ˆ": 136,
  "‰": 137,
  "Š": 138,
  "‹": 139,
  "Œ": 140,
  "Ž": 142,
  "‘": 145,
  "’": 146,
  "“": 147,
  "”": 148,
  "•": 149,
  "–": 150,
  "—": 151,
  "˜": 152,
  "™": 153,
  "š": 154,
  "›": 155,
  "œ": 156,
  "ž": 158,
  "Ÿ": 159
};
function fixMojibake(s) {
  if (!/[ÃÂ][\u0080-\u00BF€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]/.test(s))
    return s;
  const bytes = [];
  for (const ch of s) {
    const code = ch.codePointAt(0);
    if (code <= 255)
      bytes.push(code);
    else if (CP1252[ch] !== undefined)
      bytes.push(CP1252[ch]);
    else
      return s;
  }
  const repaired = Buffer.from(bytes).toString("utf8");
  return repaired.includes("�") ? s : repaired;
}
function cleanText(value, max = 500) {
  if (value === null || value === undefined)
    return "";
  let s = fixMojibake(String(value)).replace(ANSI, "").replace(CONTROL, "");
  s = s.replace(/\s+/g, " ").trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}
function cleanBlock(value, max = 4000) {
  if (value === null || value === undefined)
    return "";
  let s = fixMojibake(String(value)).replace(ANSI, "").replace(CONTROL, "");
  s = s.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, `

`).trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

// src/core/http.ts
var HOSTS = {
  api: process.env.IDRD_API_URL || "https://portalciudadano-back.idrd.gov.co",
  pay: process.env.IDRD_PAY_URL || "https://portalcontratista-back.idrd.gov.co",
  web: process.env.IDRD_WEB_URL || "https://portalciudadano.idrd.gov.co"
};
var UA = "idrd-cli/0.1 (+personal, unofficial)";
var fetchImpl = (input, init) => fetch(input, init);
async function request(base, path, opts = {}) {
  const method = opts.method ?? "GET";
  const url = new URL(path, base);
  for (const [k, v] of Object.entries(opts.query ?? {}))
    if (v !== undefined)
      url.searchParams.set(k, String(v));
  const headers = { Accept: "application/json", "User-Agent": UA };
  if (opts.body !== undefined)
    headers["Content-Type"] = "application/json";
  if (opts.token)
    headers.Authorization = `Bearer ${opts.token}`;
  const retries = method === "GET" ? opts.retries ?? 2 : 0;
  let lastErr;
  for (let attempt = 0;attempt <= retries; attempt++) {
    const ctrl = new AbortController;
    const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 30000);
    try {
      const res = await fetchImpl(url, {
        method,
        headers,
        body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
        signal: ctrl.signal
      });
      const text = await res.text();
      let body = text;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {}
      if (res.status >= 500 && attempt < retries) {
        await sleep(400 * (attempt + 1));
        continue;
      }
      return { status: res.status, body };
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await sleep(400 * (attempt + 1));
        continue;
      }
    } finally {
      clearTimeout(timer);
    }
  }
  const reason = lastErr instanceof Error ? lastErr.message : String(lastErr);
  fail("network/unreachable", `No pude conectar con ${url.host}.`, cleanText(reason, 160), lastErr);
}
function upstreamMessage(body) {
  if (body && typeof body === "object") {
    const b = body;
    const errors = b.errors && typeof b.errors === "object" ? Object.values(b.errors).flat() : [];
    const parts = [b.message, b.error_description, ...errors].filter(Boolean).map((x) => cleanText(x, 200));
    if (parts.length)
      return [...new Set(parts)].join(" — ");
  }
  if (typeof body === "string" && body.startsWith("<"))
    return "respuesta HTML (ruta inexistente o error del servidor)";
  return cleanText(body, 200) || "sin detalle";
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// src/idrd/webclient.ts
import { existsSync as existsSync4, readFileSync as readFileSync3, unlinkSync as unlinkSync3 } from "node:fs";
import { join as join4 } from "node:path";

// src/cli/foundation/atomic-write.ts
import {
  closeSync,
  existsSync as existsSync3,
  fdatasyncSync,
  mkdirSync as mkdirSync2,
  openSync,
  renameSync,
  unlinkSync as unlinkSync2,
  writeSync
} from "node:fs";
import { dirname, join as join3 } from "node:path";
import { platform as platform2 } from "node:os";
function atomicWrite(filePath, content, options = {}) {
  const { mode = 420, encoding = "utf8" } = options;
  const dir = dirname(filePath);
  const tmpPath = join3(dir, `.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`);
  mkdirSync2(dir, { recursive: true });
  const data = typeof content === "string" ? Buffer.from(content, encoding) : content;
  const fd = openSync(tmpPath, "w", mode);
  try {
    writeSync(fd, data);
    fdatasyncSync(fd);
  } finally {
    closeSync(fd);
  }
  if (platform2() === "win32" && existsSync3(filePath)) {
    unlinkSync2(filePath);
  }
  renameSync(tmpPath, filePath);
}
function atomicWriteJson(filePath, value, options = {}) {
  atomicWrite(filePath, `${JSON.stringify(value, null, 2)}
`, options);
}

// src/idrd/webclient.ts
var TTL_MS = 7 * 24 * 3600000;
var cacheFile = () => join4(appHome(), "web-client.json");
async function webClient(opts = {}) {
  const envId = process.env.IDRD_CLIENT_ID;
  const envSecret = process.env.IDRD_CLIENT_SECRET;
  if (envId && envSecret)
    return { id: envId, secret: envSecret, source: "env" };
  if (!opts.refresh && existsSync4(cacheFile())) {
    try {
      const c = JSON.parse(readFileSync3(cacheFile(), "utf8"));
      if (c.id && c.secret && c.fetchedAt && Date.now() - Date.parse(c.fetchedAt) < TTL_MS) {
        return { id: c.id, secret: c.secret, source: "cache" };
      }
    } catch {}
  }
  const index = await request(HOSTS.web, "/", { timeoutMs: 20000 });
  const html = typeof index.body === "string" ? index.body : "";
  const scripts = [...html.matchAll(/src="(\/js\/(?:chunk-common|index|app)[^"]*\.js)"/g)].map((m) => m[1]);
  for (const src of scripts) {
    const js = await request(HOSTS.web, src, { timeoutMs: 30000 });
    const text = typeof js.body === "string" ? js.body : "";
    const id = /VUE_APP_CLIENT_ID:"([^"]+)"/.exec(text)?.[1];
    const secret = /VUE_APP_CLIENT_SECRET:"([^"]+)"/.exec(text)?.[1];
    if (id && secret) {
      atomicWriteJson(cacheFile(), { id, secret, fetchedAt: new Date().toISOString(), from: src }, { mode: 384 });
      return { id, secret, source: "portal" };
    }
  }
  return fail("upstream/web-client", "No encontré la configuración de login en el frontend del portal (¿cambió el portal?).", "Define IDRD_CLIENT_ID e IDRD_CLIENT_SECRET, o reporta el cambio.");
}

// src/idrd/sports.ts
var SPORTS = {
  tennis: { path: "/api/parks/tennis-courts", label: "Tenis" },
  padel: { path: "/api/parks/paddle-courts", label: "Pádel" },
  pickleball: { path: "/api/parks/pickleball-courts", label: "Pickleball" },
  synthetic: { path: "/api/parks/synthetic-fields", label: "Fútbol sintético" },
  natural: { path: "/api/parks/natural-soccer-fields", label: "Fútbol natural" }
};
var ALIASES = {
  tennis: "tennis",
  tenis: "tennis",
  padel: "padel",
  pádel: "padel",
  paddle: "padel",
  pickleball: "pickleball",
  pickle: "pickleball",
  synthetic: "synthetic",
  sintetica: "synthetic",
  sintética: "synthetic",
  sinteticas: "synthetic",
  futbol: "synthetic",
  natural: "natural",
  naturales: "natural"
};
function parseSport(input) {
  if (!input)
    return "tennis";
  const s = ALIASES[input.trim().toLowerCase()];
  if (!s)
    fail("usage/bad-sport", `Deporte desconocido: ${input}.`, `Opciones: ${Object.keys(SPORTS).join(", ")}.`);
  return s;
}

// src/idrd/api.ts
function normalizeCourt(c, sport) {
  return {
    id: Number(c.park_endowment_id ?? c.id),
    parkId: Number(c.park_id),
    parkName: cleanText(c.park_name, 120),
    parkCode: cleanText(c.park_code, 20),
    address: cleanText(c.park_address, 200),
    locality: cleanText(c.locality, 60),
    upz: cleanText(c.upz, 60),
    sport,
    description: cleanText(c.endowment_description, 120),
    bookable: Boolean(c.for_booking)
  };
}
function ensureOk(res, what) {
  if (res.status === 401)
    fail("auth/unauthorized", "Sesión inválida o vencida.", "Corre `idrd auth login`.");
  if (res.status === 404)
    fail("not-found/resource", `${what}: no existe.`);
  if (res.status === 422)
    fail("upstream/validation", `${what}: el portal rechazó la solicitud.`, upstreamMessage(res.body));
  if (res.status >= 400)
    fail("upstream/error", `${what}: HTTP ${res.status}.`, upstreamMessage(res.body));
  return res.body;
}
async function listCourts(sport) {
  const body = ensureOk(await request(HOSTS.api, SPORTS[sport].path), "Listado de canchas");
  return (body?.data ?? []).map((c) => normalizeCourt(c, sport));
}
async function getPark(parkId) {
  const body = ensureOk(await request(HOSTS.api, `/api/parks/${parkId}/details`), "Parque");
  const d = body?.data ?? {};
  return {
    id: Number(d.id),
    name: cleanText(d.name, 120),
    code: cleanText(d.code, 20),
    address: cleanText(d.address, 200),
    email: cleanText(d.email, 120),
    hours: cleanText(d.schedule_service, 300),
    stratum: typeof d.stratum === "number" ? d.stratum : null
  };
}
async function getSchedule(courtId, date) {
  const res = await request(HOSTS.api, `/api/parks/schedules/${courtId}`, { query: { date } });
  const body = ensureOk(res, `Horarios de la cancha ${courtId}`);
  const det = body?.details ?? {};
  const inner = det.details ?? {};
  return {
    entries: (body?.data ?? []).filter((e) => typeof e?.start === "string" && typeof e?.end === "string"),
    endowment: {
      kind: cleanText(inner.endowment, 40),
      description: cleanText(inner.description ?? det.endowment_description, 120),
      status: cleanText(inner.status, 40),
      surface: cleanText(inner.floor_material, 80),
      lighting: cleanText(inner.illumination, 10),
      allDay: Boolean(inner.all_day),
      rules: cleanBlock(inner.requirements, 6000)
    },
    park: {
      id: Number(inner.park_id ?? det.id),
      name: cleanText(det.name, 120),
      code: cleanText(det.code, 20),
      address: cleanText(det.address, 200),
      locality: cleanText(det.locality, 60)
    }
  };
}
function toTokenSet(body) {
  if (typeof body.access_token !== "string")
    fail("auth/bad-response", "El portal no devolvió un token.");
  return {
    accessToken: body.access_token,
    refreshToken: typeof body.refresh_token === "string" ? body.refresh_token : undefined,
    expiresIn: Number(body.expires_in ?? 0)
  };
}
async function tokenRequest(grant) {
  for (const refresh of [false, true]) {
    const client = await webClient({ refresh });
    const res = await request(HOSTS.api, "/oauth/token", {
      method: "POST",
      body: { ...grant, client_id: client.id, client_secret: client.secret, scope: "" }
    });
    const rotated = res.body && typeof res.body === "object" && res.body.error === "invalid_client";
    if (!rotated || refresh || client.source === "env")
      return res;
  }
  return fail("auth/web-client", "El portal rechazó la configuración de login.");
}
async function passwordGrant(email, password) {
  const res = await tokenRequest({ grant_type: "password", username: email, password });
  if (res.body?.error === "invalid_client")
    fail("auth/web-client", "El portal rechazó la configuración de login.", "Revisa IDRD_CLIENT_ID/IDRD_CLIENT_SECRET o borra ~/.idrd/web-client.json.");
  if (res.status === 401 || res.status === 400)
    fail("auth/invalid-credentials", "Correo o contraseña incorrectos.", "Verifica tus datos en portalciudadano.idrd.gov.co.");
  return toTokenSet(ensureOk(res, "Login"));
}
async function refreshGrant(refreshToken) {
  const res = await tokenRequest({ grant_type: "refresh_token", refresh_token: refreshToken });
  if (res.status >= 400)
    fail("auth/refresh-failed", "No pude renovar la sesión.", "Corre `idrd auth login` de nuevo.");
  return toTokenSet(res.body);
}
async function me(token) {
  const body = ensureOk(await request(HOSTS.api, "/api/user", { token }), "Usuario");
  const u = body?.data ?? body;
  const profile = u.profile ?? {};
  return {
    id: Number(u.id),
    name: cleanText(u.name, 120),
    email: cleanText(u.email, 120),
    verified: Boolean(u.is_verified ?? u.verified_at),
    hasProfile: Boolean(u.has_profile),
    document: profile.document ? cleanText(profile.document, 30) : null,
    documentType: profile.document_type_id ? cleanText(profile.document_type_id, 10) : null
  };
}
async function logout(token) {
  await request(HOSTS.api, "/api/logout", { method: "POST", token, body: {} });
}
async function listBookings(token) {
  const body = ensureOk(await request(HOSTS.api, "/api/citizen-portal/bookings", { token }), "Reservas");
  const list = Array.isArray(body) ? body : body?.data ?? [];
  return Array.isArray(list) ? list : [];
}
async function createBooking(token, courtId, body) {
  const res = await request(HOSTS.api, `/api/parks/schedules/${courtId}/payment`, { method: "POST", token, body });
  const ok2 = ensureOk(res, "Crear reserva");
  return ok2?.data ?? ok2;
}
async function listBanks() {
  const body = ensureOk(await request(HOSTS.pay, "/api/payment-gateway/banks"), "Bancos PSE");
  return (body?.banks ?? []).map((b) => ({ code: cleanText(b.code, 10), name: cleanText(b.name, 100) })).filter((b) => b.code && b.code !== "0");
}
async function transferBank(token, payload, free) {
  const path = free ? "/api/payment-gateway/transferBankFree" : "/api/payment-gateway/transferBank";
  const res = await request(HOSTS.pay, path, { method: "POST", token, body: payload, timeoutMs: 60000 });
  const ok2 = ensureOk(res, free ? "Confirmar reserva gratuita" : "Iniciar pago PSE");
  return ok2?.data ?? ok2;
}
async function paymentStatus(token, code) {
  const res = await request(HOSTS.pay, `/api/payment-gateway/status/${encodeURIComponent(code)}`, { token });
  const ok2 = ensureOk(res, "Estado del pago");
  return ok2?.data ?? ok2;
}

// src/idrd/auth.ts
import { readFileSync as readFileSync6 } from "node:fs";

// src/cli/agent/prompt-secret.ts
import { stdin, stderr as stdout } from "node:process";
function promptSecret(label, options = {}) {
  const mask = options.mask ?? "•";
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    return Promise.resolve(null);
  }
  stdout.write(label);
  return new Promise((resolve, reject) => {
    const chars = [];
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    const cleanup = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener("data", onData);
    };
    const onData = (chunk) => {
      for (let i = 0;i < chunk.length; i++) {
        const ch = chunk.charAt(i);
        const code = ch.charCodeAt(0);
        if (ch === "\r" || ch === `
` || code === 4) {
          stdout.write(`
`);
          cleanup();
          resolve(chars.join(""));
          return;
        }
        if (code === 3) {
          stdout.write(`
`);
          cleanup();
          reject(new Error("cancelled"));
          return;
        }
        if (code === 8 || code === 127) {
          if (chars.length > 0) {
            chars.pop();
            if (mask.length > 0)
              stdout.write("\b \b");
          }
          continue;
        }
        if (code >= 32) {
          chars.push(ch);
          if (mask.length > 0)
            stdout.write(mask);
        }
      }
    };
    stdin.on("data", onData);
  });
}

// src/cli/foundation/config.ts
import { existsSync as existsSync5, readFileSync as readFileSync4 } from "node:fs";
import { join as join5 } from "node:path";
function loadConfig(configDir, profile) {
  const filePath = join5(configDir, "config.json");
  let file = {};
  if (existsSync5(filePath)) {
    try {
      file = JSON.parse(readFileSync4(filePath, "utf8"));
    } catch {}
  }
  const defaults = file.defaults ?? {};
  const profileOverrides = profile && file.profiles?.[profile] ? file.profiles[profile] : {};
  return { ...defaults, ...profileOverrides };
}
function saveConfig(configDir, update) {
  const filePath = join5(configDir, "config.json");
  let existing = {};
  if (existsSync5(filePath)) {
    try {
      existing = JSON.parse(readFileSync4(filePath, "utf8"));
    } catch {}
  }
  const merged = {
    defaults: { ...existing.defaults, ...update.defaults },
    profiles: { ...existing.profiles, ...update.profiles }
  };
  atomicWriteJson(filePath, merged);
}

// src/cli/foundation/session.ts
import { existsSync as existsSync6, readFileSync as readFileSync5, unlinkSync as unlinkSync4 } from "node:fs";
import { join as join6 } from "node:path";
var SESSION_FILE = "current.json";
function loadSession(sessionsDir) {
  const filePath = join6(sessionsDir, SESSION_FILE);
  if (!existsSync6(filePath))
    return null;
  try {
    return JSON.parse(readFileSync5(filePath, "utf8"));
  } catch {
    return null;
  }
}
function saveSession(sessionsDir, session) {
  atomicWriteJson(join6(sessionsDir, SESSION_FILE), session, { mode: 384 });
}
function clearSession(sessionsDir) {
  const filePath = join6(sessionsDir, SESSION_FILE);
  if (existsSync6(filePath)) {
    unlinkSync4(filePath);
  }
}

// src/idrd/auth.ts
var REFRESH_MARGIN_MS = 5 * 60000;
function storedEmail(profile) {
  return loadConfig(paths.config(), profileName(profile)).email;
}
function currentSession(profile) {
  return loadSession(paths.sessions(profile));
}
function persist(profile, email, t, previousRefresh) {
  const now = Date.now();
  const session = {
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + t.expiresIn * 1000).toISOString(),
    email,
    accessToken: t.accessToken,
    refreshToken: t.refreshToken ?? previousRefresh
  };
  saveSession(paths.sessions(profile), session);
  return session;
}
async function resolvePassword(opts) {
  if (process.env.IDRD_PASSWORD)
    return process.env.IDRD_PASSWORD;
  if (opts.stdin) {
    const text = readFileSync6(0, "utf8").split(/\r?\n/)[0] ?? "";
    if (!text)
      fail("auth/password-required", "No llegó contraseña por stdin.");
    return text;
  }
  if (!opts.noInput) {
    const pw = await promptSecret("Contraseña IDRD: ");
    if (pw)
      return pw;
  }
  return fail("auth/password-required", "Necesito tu contraseña y no hay terminal interactiva.", "Exporta IDRD_PASSWORD o usa --password-stdin. Nunca se guarda en disco.");
}
async function login(profile, email, password) {
  const tokens = await passwordGrant(email, password);
  saveConfig(paths.config(), { profiles: { [profileName(profile)]: { email } } });
  return persist(profile, email, tokens);
}
function logoutLocal(profile) {
  clearSession(paths.sessions(profile));
}
async function accessToken(profile) {
  const session = currentSession(profile);
  if (!session)
    fail("auth/required", "No has iniciado sesión.", "Corre `idrd auth login --email <tu correo>`.");
  const expiresAt = session.expiresAt ? Date.parse(session.expiresAt) : 0;
  if (expiresAt - Date.now() > REFRESH_MARGIN_MS)
    return { token: session.accessToken, session, refreshed: false };
  if (!session.refreshToken)
    fail("auth/expired", "La sesión venció.", "Corre `idrd auth login`.");
  try {
    const t = await refreshGrant(session.refreshToken);
    const next = persist(profile, session.email, t, session.refreshToken);
    return { token: next.accessToken, session: next, refreshed: true };
  } catch (err) {
    if (err instanceof AppError)
      fail("auth/expired", "La sesión venció y no se pudo renovar.", "Corre `idrd auth login`.", err);
    throw err;
  }
}

// src/idrd/payment.ts
import { readdirSync, readFileSync as readFileSync7 } from "node:fs";
import { join as join7 } from "node:path";
var RECEIPT_BASE = "https://portalciudadano.idrd.gov.co/app/pagos/comprobante/";
function normalizeBooking(raw, ctx) {
  const id = raw.booking_id ?? raw.id ?? raw.citizen_schedule_id;
  if (id === undefined || id === null)
    fail("upstream/bad-booking", "El portal respondió sin id de reserva.", cleanText(JSON.stringify(raw), 200));
  const amount = Number(raw.amount ?? 0);
  return {
    bookingId: String(id),
    courtId: ctx.courtId,
    date: ctx.date,
    startHour: ctx.startHour,
    finalHour: ctx.finalHour,
    amount,
    free: amount === 0,
    concept: cleanText(raw.concept, 200),
    parkId: raw.park_id,
    serviceId: raw.service_id,
    holdUntil: typeof raw.created_at === "string" ? raw.created_at : null,
    createdAt: new Date().toISOString(),
    raw
  };
}
function saveBooking(profile, b) {
  atomicWriteJson(join7(paths.bookings(profile), `${b.bookingId}.json`), b, { mode: 384 });
}
function loadBooking(profile, bookingId) {
  try {
    return JSON.parse(readFileSync7(join7(paths.bookings(profile), `${bookingId}.json`), "utf8"));
  } catch {
    return fail("not-found/booking", `No tengo registrada la reserva ${bookingId} en este equipo.`, "Solo se puede pagar una reserva creada con `idrd booking create`.");
  }
}
function localBookings(profile) {
  try {
    return readdirSync(paths.bookings(profile)).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(readFileSync7(join7(paths.bookings(profile), f), "utf8")));
  } catch {
    return [];
  }
}
async function publicIp() {
  try {
    const res = await request("https://api.ipify.org", "/", { query: { format: "json" }, timeoutMs: 8000, retries: 1 });
    if (res.status === 200 && res.body?.ip && /^[0-9a-f.:]+$/i.test(res.body.ip))
      return res.body.ip;
  } catch {}
  return fail("network/no-public-ip", "No pude determinar tu IP pública, que la pasarela PSE exige.", "Revisa tu conexión y vuelve a intentar.");
}
function paymentPayload(b, opts) {
  const r = b.raw;
  const phone = r.phone === null || r.phone === undefined ? r.phone : String(r.phone);
  const person = r.person_type_id || "N";
  return {
    reservationId: r.booking_id ?? b.bookingId,
    permitTypeSelected: "PO",
    permitNumber: "999",
    name: r.name,
    lastName: r.surname,
    phone,
    email: r.email,
    address: r.address,
    documentTypeSelected: r.document_type_id,
    document: r.document,
    parkSelected: r.park_id,
    serviceParkSelected: r.service_id,
    isTheSame: true,
    documentTypeSelectedPayer: r.document_type_id,
    documentPayer: r.document,
    namePayer: r.name,
    lastNamePayer: r.surname,
    phonePayer: phone,
    emailPayer: r.email,
    addressPayer: r.address,
    concept: r.concept,
    totalPay: b.free ? 0 : b.amount,
    typePersonSelected: person,
    typePersonSelectedPayer: person,
    BankTypeSelected: b.free ? "0" : opts.bankCode,
    redirect_url: RECEIPT_BASE,
    ip_address: opts.ip,
    sport_id: null
  };
}

// src/registry.ts
var COMMANDS = [
  {
    name: "court list",
    summary: "Lista canchas de un deporte (por defecto solo las reservables).",
    flags: [
      { flag: "--sport <tennis|padel|pickleball|synthetic|natural>", description: "Deporte (default tennis)" },
      { flag: "--locality <texto>", description: "Filtra por localidad (ej. usaquen)" },
      { flag: "--all", description: "Incluye canchas no reservables en línea" }
    ],
    trust: "T0",
    auth: false,
    output: "Court[] {id, parkId, parkName, parkCode, address, locality, upz, sport, description, bookable}",
    examples: ["idrd court list", "idrd court list --sport padel"]
  },
  {
    name: "court get",
    summary: "Detalle de una cancha: parque, horario de servicio, superficie, reglas de uso.",
    args: [{ name: "id", description: "id de la cancha (park_endowment_id)" }],
    trust: "T0",
    auth: false,
    output: "{court, park, endowment{kind,status,surface,lighting,rules}}",
    examples: ["idrd court get 11537"]
  },
  {
    name: "slot list",
    summary: "Horas de una cancha en una fecha, con disponibilidad real (reservable menos reservado).",
    args: [{ name: "id", description: "id de la cancha" }],
    flags: [
      { flag: "--date <YYYY-MM-DD|hoy|mañana|lun..dom>", description: "Fecha (default hoy)" },
      { flag: "--free", description: "Solo horas libres" }
    ],
    trust: "T0",
    auth: false,
    output: "{courtId, date, weekDates[], slots: HourSlot[] {hour,start,end,available}, freeRuns}",
    examples: ["idrd slot list 11537 --date vie --free"]
  },
  {
    name: "slot find",
    summary: "Busca horas libres en todas las canchas de un deporte. Atajo: `idrd find`.",
    flags: [
      { flag: "--date <fecha>", description: "Fecha (default mañana)" },
      { flag: "--sport <deporte>", description: "Deporte (default tennis)" },
      { flag: "--from <hora>", description: "Desde esta hora, ej. 6 (default 0)" },
      { flag: "--to <hora>", description: "Hasta esta hora, ej. 9 (default 24)" },
      { flag: "--locality <texto>", description: "Filtra por localidad" }
    ],
    trust: "T0",
    auth: false,
    output: "{date, sport, window, results: [{court, freeHours[]}], scanned, failed[]}",
    examples: ["idrd find --date mie --from 6 --to 9"]
  },
  {
    name: "auth login",
    summary: "Inicia sesión (OAuth del portal). Guarda solo el token y tu correo; nunca la contraseña.",
    flags: [
      { flag: "--email <correo>", description: "Correo de tu cuenta (se recuerda)" },
      { flag: "--password-stdin", description: "Lee la contraseña de stdin (o usa IDRD_PASSWORD)" }
    ],
    trust: "T1",
    auth: false,
    output: "{email, expiresAt, refreshable, user{id,name,verified,hasProfile}}",
    examples: ["idrd auth login --email yo@correo.com", "IDRD_PASSWORD=… idrd auth login --email yo@correo.com --json"]
  },
  { name: "auth status", summary: "Estado de la sesión, con una llamada real al portal.", trust: "T0", auth: false, output: "{loggedIn, email, expiresAt, expired, refreshable, user?}" },
  { name: "auth logout", summary: "Cierra sesión en el portal y borra el token local.", trust: "T1", auth: true, output: "{loggedOut}" },
  {
    name: "booking list",
    summary: "Tus reservas en el portal, más las creadas desde este equipo.",
    trust: "T0",
    auth: true,
    output: "{remote: object[], local: BookingRecord[]}"
  },
  {
    name: "booking create",
    summary: "Reserva una cancha. Sin --yes solo muestra la vista previa. Las reservas NO se pueden cancelar.",
    args: [{ name: "id", description: "id de la cancha" }],
    flags: [
      { flag: "--date <fecha>", description: "Fecha de la reserva" },
      { flag: "--hour <hora>", description: 'Hora de inicio, ej. 6 o "6:00 AM"' },
      { flag: "--hours <1|2>", description: "Duración (máx. 2, default 1)" },
      { flag: "--bank <código>", description: "Si cobra: genera de una vez el link PSE con este banco" },
      { flag: "--yes --confirm <intent>", description: "Ejecuta. <intent> lo imprime la vista previa" },
      { flag: "--dry-run", description: "Fuerza vista previa aunque pases --yes" }
    ],
    trust: "T3",
    auth: true,
    output: "preview: {dryRun:true, intent, request, checks[]} | live: {booking: BookingRecord, payment?}",
    examples: ["idrd booking create 11537 --date vie --hour 6", "idrd booking create 11537 --date vie --hour 6 --yes --confirm 11537@2026-11-06T06x1"]
  },
  { name: "pay banks", summary: "Bancos disponibles en PSE.", trust: "T0", auth: false, output: "Bank[] {code, name}" },
  {
    name: "pay pse",
    summary: "Genera el link de pago PSE (bank_url) de una reserva creada desde este equipo.",
    args: [{ name: "bookingId", description: "id devuelto por booking create" }],
    flags: [
      { flag: "--bank <código>", description: "Banco (ver `idrd pay banks`)" },
      { flag: "--yes", description: "Confirma la creación de la orden de pago" },
      { flag: "--open", description: "Abre el link en el navegador" }
    ],
    trust: "T2",
    auth: true,
    output: "{bookingId, amount, bankUrl, paymentCode}"
  },
  {
    name: "pay status",
    summary: "Estado de un pago PSE.",
    args: [{ name: "code", description: "código de pago" }],
    trust: "T0",
    auth: true,
    output: "object (respuesta del portal)"
  },
  { name: "doctor", summary: "Diagnóstico: red, portal, sesión, killswitch, entorno.", trust: "T0", auth: false, output: "{ok, checks: {name, ok, detail}[]}" },
  { name: "killswitch", summary: "on|off|status — bloquea toda escritura (reservas y pagos).", args: [{ name: "on|off|status", description: "acción" }], trust: "T1", auth: false, output: "{active, reason?, activatedAt?}" },
  { name: "schema", summary: "Contrato de comandos en JSON (versionado) para agentes.", trust: "T0", auth: false, output: "{schemaVersion, cli, version, exitCodes, commands[]}" }
];
var GLOBAL_FLAGS = [
  { flag: "--json", description: "Salida JSON (automática si stdout no es una terminal)" },
  { flag: "--profile <nombre>", description: 'Cuenta/perfil (default "default")' },
  { flag: "--no-input", description: "Nunca preguntar; fallar si falta algo" },
  { flag: "-q, --quiet", description: "Sin diagnósticos ni próximos pasos" }
];
function findCommand(words) {
  for (const n of [2, 1]) {
    const name = words.slice(0, n).join(" ");
    const spec = COMMANDS.find((c) => c.name === name);
    if (spec)
      return { spec, rest: words.slice(n) };
  }
  return null;
}
// package.json
var package_default = {
  name: "idrd-cli",
  version: "0.1.0",
  description: "Unofficial agent-first CLI for Bogotá's IDRD Portal Ciudadano (park courts: availability, booking, PSE payment link).",
  type: "module",
  private: true,
  bin: {
    idrd: "dist/idrd.js"
  },
  files: [
    "dist"
  ],
  engines: {
    node: ">=20"
  },
  scripts: {
    build: "bun build src/bin.ts --target=node --format=esm --outfile=dist/idrd.js && node scripts/shebang.mjs",
    dev: "bun src/bin.ts",
    typecheck: "tsc --noEmit",
    test: "bun test",
    check: "bun run typecheck && bun test && bun run build",
    "verify:dist": 'bun run build && git diff --quiet -- dist/ || (echo "dist/idrd.js no coincide con src/: haz commit del build" && exit 1)'
  },
  license: "MIT",
  devDependencies: {
    "@types/bun": "^1.4.4",
    "@types/node": "^26.6.6",
    typescript: "^7.0.2",
    picocolors: "^1.1.1"
  },
  registries: {
    "@cligentic": "https://cligentic.railly.dev/r/{name}.json"
  },
  repository: {
    type: "git",
    url: "git+https://github.com/huayaney-exe/portal-ciudadano-cli.git"
  },
  homepage: "https://github.com/huayaney-exe/portal-ciudadano-cli#readme",
  keywords: [
    "idrd",
    "bogota",
    "cli",
    "agent",
    "tennis",
    "booking"
  ]
};

// src/commands/account.ts
var VERSION = package_default.version;
async function authLogin(ctx) {
  const profile = ctx.flags.profile;
  const email = str(ctx.args, "email") ?? process.env.IDRD_EMAIL ?? storedEmail(profile);
  if (!email)
    fail("usage/missing-flag", "Falta tu correo.", "Usa --email <correo> (se recuerda para la próxima).");
  const password = await resolvePassword({ stdin: Boolean(ctx.args.passwordStdin), noInput: ctx.flags.noInput });
  const session = await login(profile, email, password);
  const user = await me(session.accessToken).catch(() => null);
  const data = { email, expiresAt: session.expiresAt, refreshable: Boolean(session.refreshToken), user };
  return {
    data,
    human: () => `${ok("✓")} Sesión iniciada como ${bold(email)}${user ? ` (${user.name})` : ""}
  ${muted(`Vence: ${session.expiresAt}`)}`,
    nextSteps: [{ command: "idrd find --date mañana --from 6 --to 9", description: "buscar canchas libres" }]
  };
}
async function authStatus(ctx) {
  const s = currentSession(ctx.flags.profile);
  if (!s) {
    return {
      data: { loggedIn: false, email: storedEmail(ctx.flags.profile) ?? null },
      human: () => `${warn("○")} Sin sesión. Corre ${bold("idrd auth login --email <correo>")}`,
      nextSteps: [{ command: "idrd auth login --email <correo>", description: "iniciar sesión" }]
    };
  }
  const expired = s.expiresAt ? Date.parse(s.expiresAt) < Date.now() : false;
  let user = null;
  let liveCheck;
  try {
    const { token } = await accessToken(ctx.flags.profile);
    user = await me(token);
    liveCheck = "ok";
  } catch (e) {
    liveCheck = e instanceof Error ? e.message : String(e);
  }
  const data = { loggedIn: user !== null, email: s.email, expiresAt: s.expiresAt, expired, refreshable: Boolean(s.refreshToken), liveCheck, user };
  return {
    data,
    human: () => user ? `${ok("●")} Sesión activa: ${bold(s.email)} (${user.name})
  ${muted(`Vence: ${s.expiresAt}${s.refreshToken ? " · renovable" : ""}`)}` : `${danger("●")} Sesión guardada pero no válida: ${liveCheck}`
  };
}
async function authLogout(ctx) {
  const s = currentSession(ctx.flags.profile);
  if (s)
    await logout(s.accessToken).catch(() => {
      return;
    });
  logoutLocal(ctx.flags.profile);
  return { data: { loggedOut: true }, human: () => `${ok("✓")} Sesión cerrada y token local borrado.` };
}
async function bookingList(ctx) {
  const { token } = await accessToken(ctx.flags.profile);
  const remote = await listBookings(token);
  const local = localBookings(ctx.flags.profile).map(({ raw, ...rest }) => rest);
  const data = { remote, local };
  return {
    data,
    human: () => [
      bold(`Reservas en el portal: ${remote.length}`),
      ...remote.slice(0, 20).map((r) => `  • ${JSON.stringify(r).slice(0, 140)}`),
      "",
      bold(`Creadas desde este equipo: ${local.length}`),
      ...local.map((b) => `  • ${b.bookingId}  cancha ${b.courtId}  ${b.date} ${b.startHour}–${b.finalHour}  ${b.free ? ok("gratis") : `$${b.amount}`}`)
    ].join(`
`)
  };
}
async function doctor(ctx) {
  const checks = [
    async () => {
      const major = Number(process.versions.node.split(".")[0]);
      return { name: "node", ok: major >= 20, detail: `v${process.versions.node}${major >= 20 ? "" : " (requiere >= 20)"}` };
    },
    async () => ({ name: "home", ok: true, detail: appHome() }),
    async () => {
      const t0 = Date.now();
      const courts = await listCourts("tennis");
      return { name: "portal-publico", ok: courts.length > 0, detail: `${courts.length} canchas de tenis · ${Date.now() - t0} ms` };
    },
    async () => {
      const s = currentSession(ctx.flags.profile);
      if (!s)
        return { name: "sesion", ok: true, detail: "sin sesión (solo lectura disponible)" };
      const { token, refreshed } = await accessToken(ctx.flags.profile);
      const u = await me(token);
      return { name: "sesion", ok: true, detail: `${u.email} · vence ${s.expiresAt}${refreshed ? " · renovada" : ""}` };
    },
    async () => {
      const k = getKillswitchState(appHome());
      return { name: "killswitch", ok: !k.active, detail: k.active ? `ACTIVO desde ${k.activatedAt}: ${k.reason}` : "apagado" };
    }
  ];
  const result = await runDoctor(checks);
  return {
    data: result,
    human: () => `${result.checks.map((c) => `${c.ok ? ok("✓") : danger("✗")} ${c.name.padEnd(15)} ${muted(c.detail)}`).join(`
`)}

${result.ok ? ok("Todo bien.") : danger("Hay problemas.")}`,
    meta: { exitCode: result.ok ? EXIT.ok : EXIT.unknown }
  };
}
async function killswitch(ctx) {
  const action = positional(ctx.args, 0, "on|off|status");
  if (action === "on")
    turnKillswitchOn(appHome(), str(ctx.args, "reason") ?? "manual");
  else if (action === "off")
    turnKillswitchOff(appHome());
  else if (action !== "status")
    fail("usage/bad-arg", "Usa: idrd killswitch on|off|status");
  const state = getKillswitchState(appHome());
  return {
    data: state,
    human: () => state.active ? `${danger("■")} Killswitch ACTIVO: reservas y pagos bloqueados.` : `${ok("■")} Killswitch apagado.`
  };
}
async function schema() {
  const data = {
    schemaVersion: SCHEMA_VERSION,
    cli: "idrd",
    version: VERSION,
    envelope: {
      success: "{ok:true, schemaVersion, command, data, nextSteps[], meta?}",
      error: "{ok:false, schemaVersion, command, error:{code, message, hint?}}"
    },
    exitCodes: { ok: 0, unknown: 1, usage: 2, auth: 3, notFound: 4, refused: 5, upstream: 6 },
    env: ["IDRD_PASSWORD", "IDRD_EMAIL", "IDRD_PROFILE", "IDRD_HOME", "IDRD_JSON", "NO_COLOR"],
    globalFlags: GLOBAL_FLAGS,
    commands: COMMANDS
  };
  return { data, human: () => JSON.stringify(data, null, 2) };
}
function helpText() {
  const lines = [bold("idrd") + dim(" — CLI no oficial del Portal Ciudadano IDRD (Bogotá)"), "", bold("Comandos:")];
  for (const c of COMMANDS)
    lines.push(`  ${c.name.padEnd(16)} ${c.summary}${c.trust === "T3" ? warn("  [irreversible]") : ""}`);
  lines.push("", bold("Globales:"), ...GLOBAL_FLAGS.map((f) => `  ${f.flag.padEnd(20)} ${f.description}`));
  lines.push("", dim("Detalle de un comando: idrd <comando> --help · Contrato para agentes: idrd schema"));
  return lines.join(`
`);
}
function commandHelp(name) {
  const c = COMMANDS.find((x) => x.name === name);
  const args = (c.args ?? []).map((a) => `<${a.name}>`).join(" ");
  return [
    `${bold(`idrd ${c.name}`)} ${args}`,
    c.summary,
    ...c.args?.length ? ["", bold("Argumentos:"), ...c.args.map((a) => `  <${a.name}>  ${a.description}`)] : [],
    ...c.flags?.length ? ["", bold("Flags:"), ...c.flags.map((f) => `  ${f.flag.padEnd(34)} ${f.description}`)] : [],
    "",
    `${muted("Nivel de confianza:")} ${c.trust}${c.auth ? muted(" · requiere sesión") : ""}`,
    `${muted("Salida JSON:")} ${c.output}`,
    ...c.examples?.length ? ["", bold("Ejemplos:"), ...c.examples.map((e) => `  ${e}`)] : []
  ].join(`
`);
}

// src/core/table.ts
function table(headers, rows, maxWidths = []) {
  const widths = headers.map((h, i) => {
    const natural = Math.max(visibleWidth(h), ...rows.map((r) => visibleWidth(r[i] ?? "")));
    return maxWidths[i] ? Math.min(natural, maxWidths[i]) : natural;
  });
  const line = (cells) => cells.map((c, i) => padVisible(truncateVisible(c ?? "", widths[i]), widths[i])).join("  ").trimEnd();
  return [bold(line(headers)), dim(widths.map((w) => "─".repeat(w)).join("  ")), ...rows.map(line)].join(`
`);
}

// src/idrd/availability.ts
function toWindow(e) {
  const [sd, st] = e.start.split("T");
  const [ed, et] = e.end.split("T");
  if (!sd || !st || !ed || !et)
    return null;
  const from = Number(st.slice(0, 2)) + Number(st.slice(3, 5)) / 60;
  let to = Number(et.slice(0, 2)) + Number(et.slice(3, 5)) / 60;
  if (ed > sd)
    to = 24;
  return to > from ? { from, to } : null;
}
function isReservable(e) {
  if (e.can === true)
    return true;
  if (e.can === false)
    return false;
  return /disponible|reservable/i.test(`${e.category ?? ""} ${e.title ?? ""}`);
}
function datesIn(entries) {
  return [...new Set(entries.map((e) => e.start.slice(0, 10)))].sort();
}
function hourSlots(entries, date) {
  const day = entries.filter((e) => e.start.startsWith(date));
  const open = day.filter(isReservable).map(toWindow).filter((w) => w !== null);
  const taken = day.filter((e) => !isReservable(e)).map(toWindow).filter((w) => w !== null);
  const hours = new Map;
  for (const w of open) {
    for (let h = Math.ceil(w.from);h + 1 <= w.to; h++) {
      const busy = taken.some((t) => t.from < h + 1 && t.to > h);
      hours.set(h, (hours.get(h) ?? false) || !busy);
    }
  }
  return [...hours.entries()].sort((a, b) => a[0] - b[0]).map(([hour, available]) => ({
    hour,
    start: `${String(hour).padStart(2, "0")}:00`,
    end: `${String(hour + 1).padStart(2, "0")}:00`,
    available
  }));
}
function freeRuns(slots) {
  const runs = [];
  for (const s of slots.filter((x) => x.available)) {
    const last = runs[runs.length - 1];
    if (last && last[last.length - 1] === s.hour - 1)
      last.push(s.hour);
    else
      runs.push([s.hour]);
  }
  return runs;
}

// src/idrd/time.ts
var TZ = "America/Bogota";
var nowImpl = () => new Date;
function bogotaNow() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(nowImpl()).map((p) => [p.type, p.value]));
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  return { date, hour: Number(parts.hour), minute: Number(parts.minute), isoWeekday: isoWeekday(date) };
}
function isoWeekday(date) {
  const d = new Date(`${date}T12:00:00Z`).getUTCDay();
  return d === 0 ? 7 : d;
}
function addDays(date, n) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
var WEEKDAYS = {
  lun: 1,
  lunes: 1,
  mon: 1,
  monday: 1,
  mar: 2,
  martes: 2,
  tue: 2,
  tuesday: 2,
  mie: 3,
  mié: 3,
  miercoles: 3,
  miércoles: 3,
  wed: 3,
  wednesday: 3,
  jue: 4,
  jueves: 4,
  thu: 4,
  thursday: 4,
  vie: 5,
  viernes: 5,
  fri: 5,
  friday: 5,
  sab: 6,
  sáb: 6,
  sabado: 6,
  sábado: 6,
  sat: 6,
  saturday: 6,
  dom: 7,
  domingo: 7,
  sun: 7,
  sunday: 7
};
function parseDate(input) {
  const today = bogotaNow().date;
  if (!input)
    return today;
  const s = input.trim().toLowerCase();
  if (s === "hoy" || s === "today")
    return today;
  if (s === "mañana" || s === "manana" || s === "tomorrow")
    return addDays(today, 1);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(`${s}T12:00:00Z`);
    if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s)
      fail("usage/bad-date", `Fecha inválida: ${input}.`);
    return s;
  }
  const wd = WEEKDAYS[s];
  if (wd) {
    const delta = (wd - isoWeekday(today) + 7) % 7;
    return addDays(today, delta);
  }
  return fail("usage/bad-date", `No entiendo la fecha "${input}".`, "Usa YYYY-MM-DD, hoy, mañana o un día (lun, mar, mie…).");
}
function parseHour(input) {
  if (input === undefined)
    return fail("usage/missing-hour", "Falta la hora.", 'Ej: --hora 6 o --hora "6:00 AM".');
  const s = input.trim().toLowerCase().replace(/\s+/g, "");
  const m = /^(\d{1,2})(?::(\d{2}))?(am|pm|a\.m\.|p\.m\.)?$/.exec(s);
  if (!m)
    return fail("usage/bad-hour", `Hora inválida: ${input}.`);
  let h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  const mer = m[3]?.replace(/\./g, "");
  if (min !== 0)
    fail("usage/bad-hour", "Las reservas son por horas en punto.", `Usa ${h}:00.`);
  if (mer === "pm" && h < 12)
    h += 12;
  if (mer === "am" && h === 12)
    h = 0;
  if (h < 0 || h > 23 || mer && Number(m[1]) > 12)
    fail("usage/bad-hour", `Hora fuera de rango: ${input}.`);
  return h;
}
function hourLabel(h) {
  const mer = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:00 ${mer}`;
}
function hh(h) {
  return `${String(h).padStart(2, "0")}:00`;
}
function short(h) {
  const m = h % 24 < 12 ? "AM" : "PM";
  return { n: h % 12 === 0 ? 12 : h % 12, m };
}
function rangeLabel(run) {
  const a = short(run[0]);
  const b = short(run[run.length - 1] + 1);
  return a.m === b.m ? `${a.n}–${b.n} ${b.m}` : `${a.n} ${a.m}–${b.n} ${b.m}`;
}
function rangesLabel(hours) {
  const runs = [];
  for (const h of [...hours].sort((x, y) => x - y)) {
    const last = runs[runs.length - 1];
    if (last && last[last.length - 1] === h - 1)
      last.push(h);
    else
      runs.push([h]);
  }
  return runs.map(rangeLabel).join(", ");
}

// src/commands/read.ts
var fold = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
function courtId(raw) {
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0)
    fail("usage/bad-id", `Id de cancha inválido: ${raw}.`, "Usa el id de `idrd court list`.");
  return n;
}
async function courtsFor(ctx) {
  const sport = parseSport(str(ctx.args, "sport"));
  const loc = str(ctx.args, "locality");
  let courts = await listCourts(sport);
  if (!ctx.args.all)
    courts = courts.filter((c) => c.bookable);
  if (loc)
    courts = courts.filter((c) => fold(c.locality).includes(fold(loc)) || fold(c.parkName).includes(fold(loc)));
  return courts;
}
async function courtList(ctx) {
  const courts = await courtsFor(ctx);
  const sport = parseSport(str(ctx.args, "sport"));
  return {
    data: courts,
    human: (cs) => cs.length === 0 ? `No hay canchas de ${SPORTS[sport].label.toLowerCase()} con esos filtros.` : `${bold(`${SPORTS[sport].label}: ${cs.length} canchas`)}

` + table(["ID", "Parque", "Localidad", "Dirección"], cs.map((c) => [strong(String(c.id)), c.parkName, c.locality, muted(c.address)]), [8, 34, 14, 46]),
    nextSteps: courts[0] ? [
      { command: `idrd slot list ${courts[0].id} --date mañana --free`, description: "horas libres de una cancha" },
      { command: `idrd find --sport ${sport} --date mañana --from 6 --to 9`, description: "buscar en todas a la vez" }
    ] : []
  };
}
async function courtGet(ctx) {
  const id = courtId(positional(ctx.args, 0, "id"));
  const sched = await getSchedule(id, bogotaNow().date);
  const park = Number.isFinite(sched.park.id) ? await getPark(sched.park.id).catch(() => null) : null;
  const { id: parkId, ...parkInfo } = sched.park;
  const data = { court: { id, parkId, ...parkInfo }, park, endowment: sched.endowment };
  return {
    data,
    human: (d) => [
      bold(`${d.endowment.description || "Cancha"} · ${d.court.name}`),
      `${muted("Dirección")}  ${d.court.address}${d.court.locality ? `, ${d.court.locality}` : ""}`,
      d.park?.hours ? `${muted("Parque")}     ${d.park.hours}` : "",
      `${muted("Superficie")} ${d.endowment.surface || "—"} · ${muted("Luz")} ${d.endowment.lighting || "—"} · ${muted("Estado")} ${d.endowment.status || "—"}`,
      d.park?.email ? `${muted("Contacto")}   ${d.park.email}` : "",
      keyRules(d.endowment.rules).length ? `
${dim("Para reservar:")}
${keyRules(d.endowment.rules).map((l) => `  • ${l}`).join(`
`)}
${dim("  Reglas completas: idrd court get " + d.court.id + " --json (endowment.rules)")}` : ""
    ].filter(Boolean).join(`
`),
    nextSteps: [{ command: `idrd slot list ${id} --date mañana`, description: "ver horas" }]
  };
}
function keyRules(rules) {
  return rules.split(`
`).map((l) => l.replace(/^[*•-]\s*/, "").trim()).filter((l) => /podrá reservar máximo|horas de anticipación|devolución de dinero/i.test(l)).map((l) => {
    const first = l.split(/(?<=\.)\s/)[0] ?? l;
    return first.length > 160 ? `${first.slice(0, 159)}…` : first;
  });
}
function renderSlots(slots) {
  if (slots.length === 0)
    return dim("  Sin franjas reservables ese día.");
  return slots.map((s) => `  ${s.available ? ok("●") : muted("○")} ${hh(s.hour)}–${hh(s.hour + 1)}  ${s.available ? ok("libre") : muted("reservado")}`).join(`
`);
}
async function slotList(ctx) {
  const id = courtId(positional(ctx.args, 0, "id"));
  const date = parseDate(str(ctx.args, "date"));
  const sched = await getSchedule(id, date);
  const weekDates = datesIn(sched.entries);
  let slots = hourSlots(sched.entries, date);
  const runs = freeRuns(slots);
  if (ctx.args.free)
    slots = slots.filter((s) => s.available);
  const outside = weekDates.length > 0 && !weekDates.includes(date);
  const data = { courtId: id, date, weekDates, outsidePublishedWeek: outside, slots, freeRuns: runs };
  const first = runs[0];
  return {
    data,
    human: () => [
      bold(`${sched.endowment.description || `Cancha ${id}`} · ${sched.park.name} · ${date}`),
      outside ? `${info("!")} El portal solo publica la semana ${weekDates[0]} a ${weekDates[weekDates.length - 1]}.` : "",
      renderSlots(slots)
    ].filter(Boolean).join(`
`),
    nextSteps: first ? [{ command: `idrd booking create ${id} --date ${date} --hour ${first[0]}${first.length > 1 ? " --hours 2" : ""}`, description: "vista previa de la reserva (no reserva nada)" }] : [{ command: `idrd find --date ${date}`, description: "buscar en otras canchas" }]
  };
}
async function slotFind(ctx) {
  const sport = parseSport(str(ctx.args, "sport"));
  const date = parseDate(str(ctx.args, "date") ?? addDays(bogotaNow().date, 1));
  const from = str(ctx.args, "from") ? parseHour(str(ctx.args, "from")) : 0;
  const to = str(ctx.args, "to") ? parseHour(str(ctx.args, "to")) : 24;
  if (to <= from)
    fail("usage/bad-window", "--to debe ser mayor que --from.");
  const courts = await courtsFor(ctx);
  const concurrency = int(ctx.args, "concurrency", 4);
  const results = [];
  const failed = [];
  let weekDates = [];
  const queue = [...courts];
  await Promise.all(Array.from({ length: Math.max(1, Math.min(concurrency, 8)) }, async () => {
    for (let c = queue.shift();c; c = queue.shift()) {
      try {
        const sched = await getSchedule(c.id, date);
        if (!weekDates.length)
          weekDates = datesIn(sched.entries);
        const free = hourSlots(sched.entries, date).filter((s) => s.available && s.hour >= from && s.hour + 1 <= to).map((s) => s.hour);
        if (free.length)
          results.push({ court: c, freeHours: free });
      } catch (e) {
        failed.push({ courtId: c.id, error: e instanceof Error ? e.message : String(e) });
      }
    }
  }));
  results.sort((a, b) => (a.freeHours[0] ?? 99) - (b.freeHours[0] ?? 99) || a.court.parkName.localeCompare(b.court.parkName));
  const data = { date, sport, window: { from, to }, weekDates, results, scanned: courts.length, failed };
  const best = results[0];
  return {
    data,
    human: () => {
      const span = from === 0 && to === 24 ? "todo el día" : `${hh(from)}–${hh(to)}`;
      const head = bold(`${SPORTS[sport].label} · ${date} · ${span} · ${courts.length} canchas revisadas`);
      if (!results.length)
        return `${head}

  Ninguna hora libre en esa franja.${failed.length ? dim(`
  (${failed.length} canchas no respondieron)`) : ""}`;
      return `${head}

${table(["ID", "Parque", "Localidad", "Libre"], results.map((r) => [strong(String(r.court.id)), r.court.parkName, r.court.locality, ok(rangesLabel(r.freeHours))]), [8, 30, 14, 48])}${failed.length ? dim(`

${failed.length} canchas no respondieron.`) : ""}`;
    },
    nextSteps: best ? [{ command: `idrd booking create ${best.court.id} --date ${date} --hour ${best.freeHours[0]}`, description: "vista previa de la reserva (no reserva nada)" }] : [{ command: `idrd find --date ${addDays(date, 1)} --sport ${sport}`, description: "probar otro día" }]
  };
}

// src/cli/agent/trust-ladder.ts
import { createInterface } from "node:readline/promises";
import { stdin as defaultStdin, stderr as defaultStderr } from "node:process";
async function approveGate(ctx, preview, opts) {
  if (opts.trust !== "T2" && opts.trust !== "T3")
    return true;
  if (opts.trust === "T3") {
    const expected = opts.confirmAgainst;
    if (!opts.confirm || !expected || opts.confirm !== expected) {
      throw new AppError("approval/confirm-mismatch", {
        name: "ApprovalConfirmMismatch",
        human: "Confirmation value does not match the target id.",
        hint: "Pass --yes --confirm <id> for T3 commands."
      });
    }
  }
  if (opts.yes === true)
    return true;
  const flags = ctx.flags ?? {};
  const input = ctx.stdin ?? defaultStdin;
  const output = ctx.stderr ?? defaultStderr;
  const json = detectMode(flags) === "json";
  const noInput = flags.noInput === true;
  const inputTty = input.isTTY === true;
  const outputTty = output.isTTY === true;
  if (json || noInput || !inputTty || !outputTty) {
    const cli = ctx.cliName ?? "this CLI";
    throw new AppError("approval/required", {
      name: "ApprovalRequired",
      human: `Approval is required before ${cli} can run this operation.`,
      hint: opts.trust === "T3" ? "Pass --yes --confirm <id>." : "Pass --yes."
    });
  }
  output.write(`${preview.title}

${renderPreview(preview)}

`);
  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question("Continue? [y/N] ");
    return answer.trim().toLowerCase() === "y" || answer.trim().toLowerCase() === "yes";
  } finally {
    rl.close();
  }
}
function renderPreview(preview, opts = {}) {
  const labelWidth = opts.labelWidth ?? 14;
  const rows = Object.entries(preview.details ?? {}).map(([key, value]) => {
    const lines = String(value ?? "").split(`
`);
    const [first = "", ...rest] = lines;
    const label = `${key}:`.padEnd(labelWidth);
    const body = [first, ...rest.map((line) => `${" ".repeat(labelWidth)}${line}`)].join(`
`);
    return `${label}${body}`;
  });
  return [
    preview.summary,
    ...rows.length > 0 ? ["", ...rows] : [],
    ...preview.warning ? ["", preview.warning] : []
  ].join(`
`);
}

// src/cli/foundation/audit-lifecycle.ts
import { appendFileSync, mkdirSync as mkdirSync3 } from "node:fs";
import { randomUUID } from "node:crypto";
import { join as join8 } from "node:path";
function todayFilename() {
  return `${new Date().toISOString().slice(0, 10)}.jsonl`;
}
function beginAudit(auditDir, record, opts = {}) {
  const auditId = opts.auditId ?? randomUUID();
  const started = Date.now();
  const baseMeta = { ...record.meta ?? {}, audit_id: auditId };
  appendLifecycleRecord(auditDir, record, "pending", baseMeta);
  const finish = (result, meta = {}) => {
    appendLifecycleRecord(auditDir, record, result, {
      ...baseMeta,
      ...meta,
      duration_ms: Date.now() - started
    });
  };
  return {
    auditId,
    complete: (meta) => finish("ok", meta),
    fail: (meta) => finish("error", meta),
    block: (meta) => finish("blocked", meta),
    dryRun: (meta) => finish("dry-run", meta)
  };
}
function appendLifecycleRecord(auditDir, record, result, meta = {}) {
  mkdirSync3(auditDir, { recursive: true });
  const file = join8(auditDir, todayFilename());
  const stored = {
    ts: new Date().toISOString(),
    ...record,
    result,
    meta
  };
  appendFileSync(file, `${JSON.stringify(stored)}
`, { mode: 384 });
}

// src/cli/platform/open-url.ts
import { spawn } from "node:child_process";
import { platform as platform3 } from "node:os";
function spawnDetached(cmd, args) {
  const child = spawn(cmd, args, {
    detached: true,
    stdio: "ignore",
    shell: false
  });
  child.unref();
}
async function openUrl(url, options = {}) {
  const { dryRun = false, manualOnly = false } = options;
  if (manualOnly || isCi() || isHeadlessLinux()) {
    return {
      url,
      opened: false,
      via: "manual",
      reason: manualOnly ? "manualOnly flag set" : isCi() ? "CI environment detected" : "headless Linux (no DISPLAY / WAYLAND_DISPLAY)"
    };
  }
  const browserEnv = process.env.BROWSER;
  if (browserEnv && browserEnv !== "none") {
    if (dryRun)
      return { url, opened: true, via: "browser-env", reason: `would run: ${browserEnv} ${url}` };
    try {
      spawnDetached(browserEnv, [url]);
      return { url, opened: true, via: "browser-env" };
    } catch {}
  }
  const os = platform3();
  if (os === "darwin") {
    if (dryRun)
      return { url, opened: true, via: "darwin", reason: `would run: open ${url}` };
    try {
      spawnDetached("open", [url]);
      return { url, opened: true, via: "darwin" };
    } catch (err) {
      return { url, opened: false, via: "manual", reason: `open failed: ${err.message}` };
    }
  }
  if (os === "win32") {
    if (dryRun)
      return { url, opened: true, via: "windows", reason: "would run: powershell Start-Process" };
    try {
      spawnDetached("powershell.exe", ["-NoProfile", "-Command", `Start-Process "${url}"`]);
      return { url, opened: true, via: "windows" };
    } catch (err) {
      return { url, opened: false, via: "manual", reason: `powershell failed: ${err.message}` };
    }
  }
  if (os === "linux" && isWsl()) {
    if (hasCommand("wslview")) {
      if (dryRun)
        return { url, opened: true, via: "wsl", reason: "would run: wslview" };
      try {
        spawnDetached("wslview", [url]);
        return { url, opened: true, via: "wsl" };
      } catch {}
    }
    if (hasCommand("cmd.exe")) {
      if (dryRun)
        return { url, opened: true, via: "wsl", reason: "would run: cmd.exe /c start" };
      try {
        spawnDetached("cmd.exe", ["/c", "start", "", url]);
        return { url, opened: true, via: "wsl" };
      } catch (err) {
        return { url, opened: false, via: "manual", reason: `wsl cmd.exe failed: ${err.message}` };
      }
    }
    return { url, opened: false, via: "manual", reason: "WSL without wslview or cmd.exe" };
  }
  const candidates = ["xdg-open", "gio", "sensible-browser", "firefox", "google-chrome", "chromium"];
  for (const cmd of candidates) {
    if (hasCommand(cmd)) {
      if (dryRun)
        return { url, opened: true, via: "linux", reason: `would run: ${cmd} ${url}` };
      try {
        const args = cmd === "gio" ? ["open", url] : [url];
        spawnDetached(cmd, args);
        return { url, opened: true, via: "linux" };
      } catch {}
    }
  }
  return { url, opened: false, via: "manual", reason: "no known browser opener found on PATH" };
}

// src/idrd/rules.ts
var RULES = {
  maxContinuousHours: 2,
  maxHoursPerWeek: 4,
  minAdvanceHours: 24,
  mondayOpenHour: 9
};
function checkBookingRules(input) {
  const v = [];
  const now = bogotaNow();
  if (input.hours < 1 || input.hours > RULES.maxContinuousHours) {
    v.push({ rule: "max-continuous-hours", message: `Máximo ${RULES.maxContinuousHours} horas continuas por día (pediste ${input.hours}).` });
  }
  if (input.startHour + input.hours > 24) {
    v.push({ rule: "same-day", message: "La reserva debe terminar el mismo día." });
  }
  if (input.weekDates.length && !input.weekDates.includes(input.date)) {
    v.push({
      rule: "current-week-only",
      message: `Solo se puede reservar dentro de la semana publicada (${input.weekDates[0]} a ${input.weekDates[input.weekDates.length - 1]}).`
    });
  }
  const startMs = Date.parse(`${input.date}T${String(input.startHour).padStart(2, "0")}:00:00-05:00`);
  const nowMs = Date.parse(`${now.date}T${String(now.hour).padStart(2, "0")}:${String(now.minute).padStart(2, "0")}:00-05:00`);
  const advance = (startMs - nowMs) / 3600000;
  if (advance < 0) {
    v.push({ rule: "in-the-past", message: `${input.date} ${hourLabel(input.startHour)} ya pasó.` });
  } else if (advance < RULES.minAdvanceHours) {
    v.push({ rule: "min-advance", message: `Se reserva con mínimo ${RULES.minAdvanceHours} h de anticipación (faltan ${advance.toFixed(1)} h).` });
  }
  if (now.isoWeekday === 1 && now.hour < RULES.mondayOpenHour) {
    v.push({ rule: "monday-window", message: "Las reservas de la semana abren los lunes a partir de las 9:00 a.m." });
  }
  return v;
}

// src/commands/write.ts
function assertWritable() {
  const k = getKillswitchState(appHome());
  if (k.active)
    fail("safety/killswitch", `Killswitch activo${k.reason ? ` (${k.reason})` : ""}: escrituras bloqueadas.`, "Desactívalo con `idrd killswitch off`.");
}
function audit(ctx, kind, command, tier, meta) {
  return beginAudit(paths.audit(), { kind, command, tier, profile: profileName(ctx.flags.profile), meta });
}
async function bookingCreate(ctx) {
  const courtId2 = Number(positional(ctx.args, 0, "id"));
  if (!Number.isInteger(courtId2) || courtId2 <= 0)
    fail("usage/bad-id", "Id de cancha inválido.");
  const date = parseDate(requireStr(ctx.args, "date"));
  const startHour = parseHour(requireStr(ctx.args, "hour"));
  const hours = int(ctx.args, "hours", 1);
  const bank = str(ctx.args, "bank");
  const intent = `${courtId2}@${date}T${String(startHour).padStart(2, "0")}x${hours}`;
  const live = ctx.args.yes === true && !ctx.flags.dryRun;
  const checks = [];
  const k = getKillswitchState(appHome());
  checks.push({ name: "killswitch", ok: !k.active, detail: k.active ? `activo: ${k.reason}` : "apagado" });
  const sched = await getSchedule(courtId2, date);
  const weekDates = datesIn(sched.entries);
  const violations = checkBookingRules({ date, startHour, hours, weekDates });
  checks.push({ name: "reglas", ok: violations.length === 0, detail: violations.map((v) => v.message).join(" ") || "cumple las reglas del portal" });
  const slots = hourSlots(sched.entries, date);
  const wanted = Array.from({ length: hours }, (_, i) => startHour + i);
  const missing = wanted.filter((h) => !slots.find((s) => s.hour === h && s.available));
  checks.push({
    name: "disponibilidad",
    ok: missing.length === 0,
    detail: missing.length ? `ocupado o no reservable: ${missing.map(hh).join(", ")}` : `libre ${hh(startHour)}–${hh(startHour + hours)} (verificado en vivo)`
  });
  let document;
  let who = "";
  try {
    const { token: token2 } = await accessToken(ctx.flags.profile);
    const u = await me(token2);
    document = u.document ?? undefined;
    who = `${u.email}${u.hasProfile ? "" : " (perfil incompleto)"}`;
    checks.push({ name: "sesion", ok: u.hasProfile, detail: u.hasProfile ? who : `${who}: completa tu perfil en el portal` });
  } catch (e) {
    checks.push({ name: "sesion", ok: false, detail: e instanceof AppError ? e.human : String(e) });
  }
  const body = {
    date,
    start_hour: hourLabel(startHour),
    final_hour: hourLabel(startHour + hours),
    sport_id: null,
    lane: null,
    document,
    is_a_responsible_adult_required: false
  };
  const ready = checks.every((c) => c.ok);
  const where = `${sched.endowment.description || `Cancha ${courtId2}`} · ${sched.park.name}`;
  if (!live) {
    audit(ctx, "booking.create", "booking create", "T3", { courtId: courtId2, date, startHour, hours, ready }).dryRun();
    const preview = {
      dryRun: true,
      intent,
      ready,
      where,
      when: `${date} ${hourLabel(startHour)}–${hourLabel(startHour + hours)}`,
      request: { method: "POST", url: `${HOSTS.api}/api/parks/schedules/${courtId2}/payment`, body: { ...body, document: body.document ? "<de tu perfil>" : undefined } },
      checks,
      warning: "Las reservas del portal IDRD no se pueden cancelar desde la app ni la API."
    };
    return {
      data: preview,
      human: () => [
        bold("Vista previa — no se reservó nada"),
        `${muted("Dónde")}   ${where}`,
        `${muted("Cuándo")}  ${preview.when}`,
        "",
        ...checks.map((c) => `${c.ok ? ok("✓") : danger("✗")} ${c.name.padEnd(15)} ${muted(c.detail)}`),
        "",
        warn(`! ${preview.warning}`),
        ready ? `
${dim("Para reservar de verdad:")}
  idrd booking create ${courtId2} --date ${date} --hour ${startHour}${hours > 1 ? ` --hours ${hours}` : ""} --yes --confirm ${strong(intent)}` : danger(`
No se puede reservar mientras haya checks en rojo.`)
      ].join(`
`),
      nextSteps: ready ? [{ command: `idrd booking create ${courtId2} --date ${date} --hour ${startHour}${hours > 1 ? ` --hours ${hours}` : ""} --yes --confirm ${intent}`, description: "RESERVA REAL e irreversible" }] : checks.find((c) => c.name === "sesion" && !c.ok) ? [{ command: "idrd auth login --email <correo>", description: "iniciar sesión y volver a previsualizar" }] : checks.find((c) => c.name === "disponibilidad" && !c.ok) ? [{ command: `idrd slot list ${courtId2} --date ${date} --free`, description: "ver horas libres de esa cancha" }] : []
    };
  }
  assertWritable();
  const failed = checks.find((c) => !c.ok);
  if (failed) {
    const code = failed.name === "disponibilidad" ? "slot/unavailable" : failed.name === "reglas" ? "rule/violation" : failed.name === "sesion" ? "auth/required" : "safety/precheck";
    fail(code, `No reservo: ${failed.name} — ${failed.detail}`);
  }
  await approveGate({ cliName: "idrd", flags: { json: ctx.flags.json, noInput: ctx.flags.noInput } }, { title: "Reserva irreversible", summary: `${where} · ${date} ${hourLabel(startHour)}–${hourLabel(startHour + hours)}` }, { trust: "T3", yes: true, confirm: str(ctx.args, "confirm"), confirmAgainst: intent });
  const { token } = await accessToken(ctx.flags.profile);
  const a = audit(ctx, "booking.create", "booking create", "T3", { courtId: courtId2, date, startHour, hours, intent });
  let booking;
  try {
    const raw = await createBooking(token, courtId2, body);
    booking = normalizeBooking(raw, { courtId: courtId2, date, startHour: body.start_hour, finalHour: body.final_hour });
    saveBooking(ctx.flags.profile, booking);
    a.complete({ bookingId: booking.bookingId, amount: booking.amount, free: booking.free });
  } catch (e) {
    a.fail({ error: e instanceof AppError ? e.code : String(e) });
    throw e;
  }
  let payment = null;
  if (booking.free || bank) {
    try {
      payment = { ok: true, ...await settle(ctx, token, booking, booking.free ? "0" : bank) };
    } catch (e) {
      const err = e instanceof AppError ? e : new AppError("unknown", { name: "Unknown", human: String(e) });
      payment = { ok: false, error: { code: err.code, message: err.human, ...err.hint ? { hint: err.hint } : {} } };
    }
  }
  const { raw: _raw, ...summary } = booking;
  const data = { booking: summary, payment };
  return {
    data,
    human: () => [
      `${ok("✓")} Reserva creada: ${bold(booking.bookingId)} · ${where} · ${date} ${booking.startHour}–${booking.finalHour}`,
      booking.free ? `  ${ok("Gratis.")} ${payment?.receiptUrl ? `Comprobante: ${payment.receiptUrl}` : ""}` : `  Valor: ${bold(`$${booking.amount}`)} ${muted(booking.concept)}`,
      payment?.bankUrl ? `  ${bold("Link de pago PSE:")} ${payment.bankUrl}` : "",
      payment && payment.ok === false ? danger(`  ✗ La reserva existe, pero falló el paso de ${booking.free ? "confirmación" : "pago"}: ${payment.error.message}`) : ""
    ].filter(Boolean).join(`
`),
    nextSteps: payment && payment.ok === false ? [{ command: `idrd pay pse ${booking.bookingId}${booking.free ? "" : ` --bank ${bank}`} --yes`, description: booking.free ? "reintentar la confirmación gratuita" : "reintentar el link de pago" }] : !booking.free && !payment ? [
      { command: "idrd pay banks", description: "elegir banco" },
      { command: `idrd pay pse ${booking.bookingId} --bank <código> --yes`, description: "generar link de pago PSE" }
    ] : []
  };
}
async function settle(ctx, token, b, bankCode) {
  assertWritable();
  if (!b.free && b.holdUntil && Date.parse(b.holdUntil) < Date.now()) {
    fail("slot/hold-expired", "El tiempo para pagar esta reserva ya venció.", "Crea una reserva nueva.");
  }
  const ip = await publicIp();
  const payload = paymentPayload(b, { bankCode, ip });
  const a = audit(ctx, b.free ? "payment.free" : "payment.pse", "pay", b.free ? "T1" : "T2", { bookingId: b.bookingId, amount: b.amount, bank: b.free ? null : bankCode });
  try {
    const res = await transferBank(token, payload, b.free);
    const code = res.payment ?? null;
    const out = {
      bookingId: b.bookingId,
      amount: b.amount,
      free: b.free,
      paymentCode: code,
      bankUrl: typeof res.bank_url === "string" ? res.bank_url : null,
      receiptUrl: code ? `${RECEIPT_BASE}${code}` : null
    };
    if (!b.free && !out.bankUrl)
      fail("upstream/pse-unavailable", "PSE no devolvió link de pago.", "El portal dice que PSE no está disponible; intenta más tarde.");
    a.complete({ paymentCode: code, hasBankUrl: Boolean(out.bankUrl) });
    return out;
  } catch (e) {
    a.fail({ error: e instanceof AppError ? e.code : String(e) });
    throw e;
  }
}
async function payBanks() {
  const banks = await listBanks();
  return {
    data: banks,
    human: () => banks.map((b) => `  ${b.code.padEnd(6)} ${b.name}`).join(`
`)
  };
}
async function payPse(ctx) {
  const bookingId = positional(ctx.args, 0, "bookingId");
  const b = loadBooking(ctx.flags.profile, bookingId);
  const bank = b.free ? "0" : requireStr(ctx.args, "bank");
  assertWritable();
  if (ctx.flags.dryRun) {
    return {
      data: { dryRun: true, bookingId: b.bookingId, amount: b.amount, free: b.free, bank },
      human: () => `Vista previa: se crearía ${b.free ? "la confirmación gratuita" : `la orden PSE por $${b.amount} con el banco ${bank}`}.`
    };
  }
  await approveGate({ cliName: "idrd", flags: { json: ctx.flags.json, noInput: ctx.flags.noInput } }, { title: b.free ? "Confirmar reserva gratuita" : "Crear orden de pago PSE", summary: `Reserva ${b.bookingId} · $${b.amount}` }, { trust: "T2", yes: ctx.args.yes === true });
  const { token } = await accessToken(ctx.flags.profile);
  const out = await settle(ctx, token, b, bank);
  let opened = false;
  const url = out.bankUrl ?? out.receiptUrl;
  if (ctx.args.open && url)
    opened = (await openUrl(url)).opened;
  return {
    data: { ...out, opened },
    human: () => out.bankUrl ? `${bold("Link de pago PSE:")} ${out.bankUrl}
${muted("Ábrelo y paga en tu banco. Nadie más debe usarlo.")}` : `${ok("✓")} Reserva gratuita confirmada.${out.receiptUrl ? ` Comprobante: ${out.receiptUrl}` : ""}`,
    nextSteps: out.paymentCode ? [{ command: `idrd pay status ${out.paymentCode}`, description: "ver si el pago quedó aprobado" }] : []
  };
}
async function payStatus(ctx) {
  const code = positional(ctx.args, 0, "code");
  const { token } = await accessToken(ctx.flags.profile);
  const st = await paymentStatus(token, code);
  return { data: st, human: () => JSON.stringify(st, null, 2) };
}

// src/cli.ts
var HANDLERS = {
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
  schema
};
var ALIASES2 = { find: ["slot", "find"] };
async function main(argv) {
  const args = parseArgs(argv);
  const flags = parseGlobalFlags(args);
  let words = args._.slice();
  const alias = words[0] ? ALIASES2[words[0]] : undefined;
  if (alias)
    words = [...alias, ...words.slice(1)];
  if (args.version) {
    process.stdout.write(isJson(flags) ? `${JSON.stringify({ ok: true, version: VERSION })}
` : `${VERSION}
`);
    return EXIT.ok;
  }
  if (words.length === 0 || words[0] === "help") {
    const target = words[0] === "help" ? findCommand(words.slice(1)) : null;
    if (target) {
      process.stdout.write(`${commandHelp(target.spec.name)}
`);
      return EXIT.ok;
    }
    if (words[0] === "help" || args.help) {
      process.stdout.write(`${helpText()}
`);
      return EXIT.ok;
    }
    if (isJson(flags)) {
      emitError("idrd", new AppError("usage/no-command", { name: "NoCommand", human: "Falta el comando.", hint: "Corre `idrd schema` para ver el contrato." }), flags);
      return EXIT.usage;
    }
    if (!args.noBanner)
      printBanner({ name: "IDRD", version: VERSION, tagline: "Portal Ciudadano · Bogotá", gradient: ["#F5C518", "#2E7D32"] });
    process.stderr.write(`${helpText()}
`);
    return EXIT.ok;
  }
  const found = findCommand(words);
  const commandName = found?.spec.name ?? words.join(" ");
  if (!found) {
    const err = new AppError("usage/unknown-command", {
      name: "UnknownCommand",
      human: `Comando desconocido: ${words.join(" ")}`,
      hint: `Disponibles: ${COMMANDS.map((c) => c.name).join(", ")}`
    });
    emitError(commandName, err, flags);
    return EXIT.usage;
  }
  if (args.help || args.h) {
    if (isJson(flags))
      process.stdout.write(`${JSON.stringify({ ok: true, command: found.spec.name, data: found.spec })}
`);
    else
      process.stdout.write(`${commandHelp(found.spec.name)}
`);
    return EXIT.ok;
  }
  try {
    const handler = HANDLERS[found.spec.name];
    const result = await handler({ args: { ...args, _: found.rest }, flags });
    emitResult(found.spec.name, result, flags);
    const exit = result.meta?.exitCode;
    return typeof exit === "number" ? exit : EXIT.ok;
  } catch (e) {
    const err = toAppError(e);
    emitError(found.spec.name, err, flags);
    if (process.env.DEBUG && err.cause instanceof Error)
      process.stderr.write(`${err.cause.stack}
`);
    return exitCodeFor(err.code);
  }
}

// src/bin.ts
main(process.argv.slice(2)).then((code) => {
  process.exitCode = code;
}, (err) => {
  process.stderr.write(`idrd: error inesperado: ${err instanceof Error ? err.message : String(err)}
`);
  process.exitCode = 1;
});
