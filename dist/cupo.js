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
    json: Boolean(raw.json ?? (process.env.CUPO_JSON ?? process.env.IDRD_JSON) === "1"),
    dryRun: Boolean(raw.dryRun ?? raw["dry-run"] ?? false),
    profile: raw.profile ?? process.env.CUPO_PROFILE ?? process.env.IDRD_PROFILE ?? undefined,
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
  "password-stdin",
  "paid",
  "available",
  "upcoming",
  "accept-habeas-data",
  "save",
  "forget"
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
    fail("usage/missing-arg", `Falta el argumento <${name}>.`, `Uso: ver \`cupo help\`.`);
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

// src/idrd/time.ts
var TZ = "America/Bogota";
var nowImpl = () => new Date;
function nowMs() {
  return nowImpl().getTime();
}
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

// src/cefe/auth.ts
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
import { existsSync as existsSync4, readFileSync as readFileSync3 } from "node:fs";
import { join as join3 } from "node:path";

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
import { dirname, join as join2 } from "node:path";
import { platform as platform2 } from "node:os";
function atomicWrite(filePath, content, options = {}) {
  const { mode = 420, encoding = "utf8" } = options;
  const dir = dirname(filePath);
  const tmpPath = join2(dir, `.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`);
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

// src/cli/foundation/config.ts
function loadConfig(configDir, profile) {
  const filePath = join3(configDir, "config.json");
  let file = {};
  if (existsSync4(filePath)) {
    try {
      file = JSON.parse(readFileSync3(filePath, "utf8"));
    } catch {}
  }
  const defaults = file.defaults ?? {};
  const profileOverrides = profile && file.profiles?.[profile] ? file.profiles[profile] : {};
  return { ...defaults, ...profileOverrides };
}
function saveConfig(configDir, update) {
  const filePath = join3(configDir, "config.json");
  let existing = {};
  if (existsSync4(filePath)) {
    try {
      existing = JSON.parse(readFileSync3(filePath, "utf8"));
    } catch {}
  }
  const merged = {
    defaults: { ...existing.defaults, ...update.defaults },
    profiles: { ...existing.profiles, ...update.profiles }
  };
  atomicWriteJson(filePath, merged);
}

// src/cli/foundation/session.ts
import { existsSync as existsSync5, readFileSync as readFileSync4, unlinkSync as unlinkSync3 } from "node:fs";
import { join as join4 } from "node:path";
var SESSION_FILE = "current.json";
function loadSession(sessionsDir) {
  const filePath = join4(sessionsDir, SESSION_FILE);
  if (!existsSync5(filePath))
    return null;
  try {
    return JSON.parse(readFileSync4(filePath, "utf8"));
  } catch {
    return null;
  }
}
function saveSession(sessionsDir, session) {
  atomicWriteJson(join4(sessionsDir, SESSION_FILE), session, { mode: 384 });
}
function clearSession(sessionsDir) {
  const filePath = join4(sessionsDir, SESSION_FILE);
  if (existsSync5(filePath)) {
    unlinkSync3(filePath);
  }
}

// src/core/paths.ts
import { homedir } from "node:os";
import { join as join5 } from "node:path";
import { existsSync as existsSync6 } from "node:fs";
function appHome() {
  if (process.env.CUPO_HOME)
    return process.env.CUPO_HOME;
  if (process.env.IDRD_HOME)
    return process.env.IDRD_HOME;
  const cupo = join5(homedir(), ".cupo");
  const legacy = join5(homedir(), ".idrd");
  return !existsSync6(cupo) && existsSync6(legacy) ? legacy : cupo;
}
function profileName(profile) {
  return profile || process.env.CUPO_PROFILE || process.env.IDRD_PROFILE || "default";
}
var paths = {
  config: () => appHome(),
  sessions: (profile) => join5(appHome(), "sessions", profileName(profile)),
  audit: () => join5(appHome(), "audit"),
  bookings: (profile) => join5(appHome(), "bookings", profileName(profile)),
  cefe: {
    config: () => join5(appHome(), "cefe"),
    sessions: (profile) => join5(appHome(), "cefe", "sessions", profileName(profile))
  }
};

// src/core/secrets.ts
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync as existsSync7, mkdirSync as mkdirSync3, readFileSync as readFileSync5, statSync, writeFileSync as writeFileSync2 } from "node:fs";
import { join as join6 } from "node:path";
function secretBackend() {
  const env = process.env.CUPO_SECRETS;
  if (env === "keychain" || env === "file" || env === "none")
    return env;
  return process.platform === "darwin" && hasSecurityTool() ? "keychain" : "file";
}
var securityChecked;
function hasSecurityTool() {
  if (securityChecked === undefined)
    securityChecked = existsSync7("/usr/bin/security");
  return securityChecked;
}
function envFilePath() {
  return join6(appHome(), "env");
}
function readEnvFile() {
  const file = envFilePath();
  if (!existsSync7(file))
    return {};
  const out = {};
  for (const raw of readFileSync5(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#"))
      continue;
    const eq = line.indexOf("=");
    if (eq <= 0)
      continue;
    const key = line.slice(0, eq).trim().replace(/^export\s+/, "");
    let value = line.slice(eq + 1).trim();
    if (value.startsWith('"') && value.endsWith('"') || value.startsWith("'") && value.endsWith("'"))
      value = value.slice(1, -1);
    out[key] = value;
  }
  return out;
}
function envFileValue(key) {
  return readEnvFile()[key];
}
function writeEnvFile(values) {
  const file = envFilePath();
  const merged = { ...readEnvFile(), ...values };
  const lines = Object.entries(merged).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}=${v}`);
  mkdirSync3(appHome(), { recursive: true, mode: 448 });
  writeFileSync2(file, lines.length ? `${lines.join(`
`)}
` : "", { mode: 384 });
  chmodSync(file, 384);
}
var q = (s) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"`;
function keychainRead(service, account) {
  const r = spawnSync("/usr/bin/security", ["find-generic-password", "-s", service, "-a", account, "-w"], { encoding: "utf8" });
  if (r.status !== 0)
    return;
  const v = r.stdout.replace(/\r?\n$/, "");
  return v || undefined;
}
function keychainWrite(service, account, value) {
  const r = spawnSync("/usr/bin/security", ["-i"], { input: `add-generic-password -U -s ${q(service)} -a ${q(account)} -w ${q(value)}
`, encoding: "utf8" });
  if (r.status !== 0)
    throw new Error(`security add-generic-password: ${r.stderr.trim() || `exit ${r.status}`}`);
}
function keychainDelete(service, account) {
  const r = spawnSync("/usr/bin/security", ["delete-generic-password", "-s", service, "-a", account], { encoding: "utf8" });
  return r.status === 0;
}
function loadSecret(ref) {
  const fromFile = envFileValue(ref.envKey);
  if (fromFile)
    return { value: fromFile, source: "file" };
  if (secretBackend() === "keychain") {
    const v = keychainRead(ref.service, ref.account);
    if (v)
      return { value: v, source: "keychain" };
  }
  return;
}
function saveSecret(ref, value) {
  const backend = secretBackend();
  if (backend === "none")
    throw new Error("CUPO_SECRETS=none: guardar contraseñas está deshabilitado.");
  if (backend === "keychain") {
    keychainWrite(ref.service, ref.account, value);
    return { where: "keychain", detail: `Llavero de macOS (servicio ${ref.service}, cuenta ${ref.account})` };
  }
  writeEnvFile({ [ref.envKey]: value });
  return { where: "file", detail: `${envFilePath()} (permisos 0600)` };
}
function forgetSecret(ref) {
  const file = envFileValue(ref.envKey) !== undefined;
  if (file)
    writeEnvFile({ [ref.envKey]: undefined });
  const keychain = secretBackend() === "keychain" ? keychainDelete(ref.service, ref.account) : false;
  return { file, keychain };
}
function secretLocation(ref) {
  return loadSecret(ref)?.source ?? null;
}
function envFileInsecure() {
  const file = envFilePath();
  if (!existsSync7(file) || process.platform === "win32")
    return false;
  return (statSync(file).mode & 63) !== 0;
}

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
  web: process.env.IDRD_WEB_URL || "https://portalciudadano.idrd.gov.co",
  cefe: process.env.CEFE_API_URL || "https://49jdz51sl6.execute-api.us-east-1.amazonaws.com/main"
};
var UA = "idrd-cli/0.1 (+personal, unofficial)";
var fetchImpl = (input, init) => fetch(input, init);
async function request(base, path, opts = {}) {
  const method = opts.method ?? "GET";
  const url = path.startsWith("/") ? new URL(`${base.replace(/\/$/, "")}${path}`) : new URL(path, base);
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

// src/cefe/api.ts
async function call(path, opts) {
  const { what, ...rest } = opts;
  const res = await request(HOSTS.cefe, path, rest);
  return ensure(res, what);
}
function ensure(res, what) {
  const msg = () => upstreamMessage(res.body);
  if (res.status === 401)
    fail("auth/unauthorized", `${what}: ${msg() || "sesión requerida"}.`, "Corre `cupo cefe auth login`.");
  if (res.status === 403)
    fail("auth/forbidden", `${what}: el servidor rechazó la solicitud (${msg()}).`, "Inicia sesión con `cupo cefe auth login`; si persiste, la ruta cambió.");
  if (res.status === 404)
    fail("not-found/resource", `${what}: no existe.`, msg());
  if (res.status === 400 || res.status === 422)
    fail("upstream/validation", `${what}: el servidor rechazó los datos.`, msg());
  if (res.status >= 400)
    fail("upstream/error", `${what}: HTTP ${res.status}.`, msg());
  return res.body;
}
function arr(body, key) {
  if (Array.isArray(body))
    return body;
  if (body && typeof body === "object") {
    const b = body;
    for (const k of [key, "data", "items", "reservations", "courses", "enrollments", "bookings", "slots"].filter(Boolean)) {
      if (Array.isArray(b[k]))
        return b[k];
      if (b[k] && typeof b[k] === "object" && Array.isArray(b[k].data))
        return b[k].data;
    }
    if (b.data && typeof b.data === "object" && !Array.isArray(b.data))
      return arr(b.data, key);
  }
  return [];
}
function normalizeUser(u) {
  const str2 = (v, n = 120) => v === null || v === undefined || v === "" ? null : cleanText(v, n);
  return {
    userId: String(u.userId ?? u.id ?? ""),
    email: cleanText(u.email, 120),
    name: cleanText(u.name, 120),
    role: cleanText(u.role, 30),
    phone: str2(u.phone, 30),
    estrato: str2(u.estrato, 5),
    dateOfBirth: str2(u.dateOfBirth, 30),
    identification: str2(u.identification, 30),
    documentType: str2(u.documentType, 10),
    credits: Number(u.credits ?? 0) || 0,
    reservasDisponibles: Number(u.reservasDisponibles ?? 0) || 0,
    dependents: Array.isArray(u.dependents) ? u.dependents.map((d) => ({
      name: cleanText(d.name, 120),
      documentType: cleanText(d.documentType, 10),
      identification: cleanText(d.identification, 30),
      ...d.dateOfBirth ? { dateOfBirth: cleanText(d.dateOfBirth, 30) } : {},
      ...d.relationship ? { relationship: cleanText(d.relationship, 40) } : {}
    })) : [],
    raw: u
  };
}
async function login(email, password) {
  const res = await request(HOSTS.cefe, "/auth/login", { method: "POST", body: { email: email.trim().toLowerCase(), password } });
  if (res.status === 401 || res.status === 400)
    fail("auth/invalid-credentials", "Correo o contraseña incorrectos.", "Verifica tus datos en cefechapinero.com/login.");
  const body = ensure(res, "Login");
  if (typeof body?.token !== "string" || !body?.user)
    fail("auth/bad-response", "El servidor no devolvió un token.");
  return { token: body.token, user: normalizeUser(body.user) };
}
async function register(body) {
  const res = await request(HOSTS.cefe, "/auth/register", { method: "POST", body });
  const out = ensure(res, "Registro");
  if (typeof out?.token !== "string" || !out?.user)
    fail("auth/bad-response", "El servidor no devolvió un token tras registrar.", upstreamMessage(out));
  return { token: out.token, user: normalizeUser(out.user) };
}
async function getUser(token, userId) {
  const body = await call(`/users/${encodeURIComponent(userId)}`, { token, what: "Perfil" });
  return normalizeUser(body?.user ?? body?.data ?? body);
}
function normalizePool(p) {
  return {
    poolId: String(p.poolId ?? p.id),
    name: cleanText(p.name, 120),
    description: cleanText(p.description, 200),
    capacity: Number(p.capacity ?? 0),
    pricePerHour: Number(p.pricePerHour ?? 0),
    active: Boolean(p.isActive ?? p.active ?? true),
    hours: Array.isArray(p.schedules) ? p.schedules.map((s) => ({ day: cleanText(s.dayOfWeek, 20), open: cleanText(s.open, 5), close: cleanText(s.close, 5) })) : []
  };
}
async function listPools() {
  const body = await call("/pools", { what: "Piscinas" });
  return arr(body, "pools").map(normalizePool);
}
async function getScheduleConfig(poolId) {
  const body = await call(`/schedules/${encodeURIComponent(poolId)}`, { what: "Configuración de horarios" });
  const cfg = body?.data ?? body ?? {};
  const norm = (c) => c ? { isClosed: Boolean(c.isClosed), slots: Array.isArray(c.slots) ? c.slots.map((s) => ({ time: cleanText(s.time, 5), capacity: Number(s.capacity ?? c.defaultCapacity ?? 0) })) : [] } : undefined;
  const weekly = {};
  for (const [k, v] of Object.entries(cfg.weekly ?? {})) {
    const n = norm(v);
    if (n)
      weekly[k.toUpperCase()] = n;
  }
  const overrides = Array.isArray(cfg.overrides) ? cfg.overrides.map((o) => ({ ...norm(o), date: cleanText(o.date, 10) })) : Object.entries(cfg.overrides ?? {}).map(([date, o]) => ({ ...norm(o), date }));
  return { default: norm(cfg.default), weekly, overrides };
}
async function getPoolSlots(poolId, date) {
  const body = await call("/pool-slots", { query: { poolId, date }, what: "Cupos" });
  return arr(body, "slots").map((s) => ({ start: cleanText(s.date, 19), capacity: Number(s.capacity ?? 0), reserved: Number(s.reservedCount ?? 0), status: cleanText(s.status, 10) }));
}
function normalizeReservation(r) {
  const uuid = r.userId_uuid ?? r.reservationId ?? r.id;
  return {
    id: r.poolId && uuid ? `${r.poolId}_${uuid}` : String(uuid ?? ""),
    poolId: String(r.poolId ?? ""),
    poolName: cleanText(r.poolName, 120),
    startTime: cleanText(r.startTime, 25),
    endTime: cleanText(r.endTime, 25),
    status: cleanText(r.status, 20),
    price: Number(r.price ?? 0) || 0,
    paymentMethod: r.paymentMethod ? cleanText(r.paymentMethod, 20) : null,
    paymentStatus: r.statusPayment ? cleanText(r.statusPayment, 30) : null,
    wompiReference: r.wompiReference ? cleanText(r.wompiReference, 80) : null,
    notes: cleanText(r.notes, 300),
    dependents: Array.isArray(r.dependents) ? r.dependents.length : 0,
    raw: r
  };
}
async function userReservations(token, userId) {
  const body = await call("/reservations", { token, query: { userId }, what: "Reservas" });
  return arr(body, "reservations").map(normalizeReservation);
}
async function userReservationsByDate(token, userId, date) {
  const body = await call(`/users/${encodeURIComponent(userId)}/reservas`, { token, query: { date }, what: "Reservas del día" });
  return arr(body, "reservations").map(normalizeReservation);
}
async function userReservationsRange(token, userId, startDate, endDate, status) {
  const body = await call(`/users/${encodeURIComponent(userId)}/reservas`, { token, query: { startDate, endDate, status }, what: "Reservas" });
  return arr(body, "reservations").map(normalizeReservation);
}
async function createReservation(token, body) {
  const out = await call("/reservations", { method: "POST", token, body, what: "Crear reserva" });
  return out?.data ?? out ?? {};
}
async function cancelReservation(token, reservationId) {
  await call(`/reservations/${encodeURIComponent(reservationId)}`, { method: "DELETE", token, what: "Cancelar reserva" });
}
function normalizeCourse(c) {
  return {
    courseId: String(c.courseId ?? c.id),
    name: cleanText(c.name, 120),
    group: cleanText(c.group, 80),
    type: cleanText(c.type, 20),
    description: cleanText(c.description, 600),
    durationMin: Number(c.duration ?? 0),
    classes: Number(c.numberOfClasses ?? 0),
    price: Number(c.price ?? 0),
    priceEstrato1_3: Number(c.priceEstrato1_3 ?? c.price ?? 0),
    priceEstrato4_6: Number(c.priceEstrato4_6 ?? c.price ?? 0),
    maxEnrollments: Number(c.maxEnrollments ?? 0),
    maxPerUser: Number(c.maxEnrollmentsPerUser ?? 0),
    full: Boolean(c.isFull),
    instructor: cleanText(c.instructor, 80),
    poolId: String(c.poolId ?? ""),
    schedule: Array.isArray(c.schedule) ? c.schedule.map((s) => ({ day: cleanText(s.day, 12), start: cleanText(s.startTime, 5), end: cleanText(s.endTime, 5) })) : [],
    startDate: cleanText(c.startDate, 25),
    status: cleanText(c.status, 20)
  };
}
async function listCourses(status) {
  const body = await call("/courses", { query: { status }, what: "Cursos" });
  return arr(body, "courses").map(normalizeCourse);
}
async function courseAvailability(courseId, startDate, endDate) {
  const body = await call(`/courses/${encodeURIComponent(courseId)}/availability`, { query: { startDate, endDate }, what: "Disponibilidad del curso" });
  const d = body?.data ?? body ?? {};
  return {
    courseName: cleanText(d.courseName, 120),
    dates: (Array.isArray(d.dates) ? d.dates : []).map((x) => ({
      date: cleanText(x.date, 10),
      classes: (Array.isArray(x.classes) ? x.classes : []).map((c) => ({
        at: cleanText(c.classDateTime, 19),
        capacity: Number(c.maxCapacity ?? 0),
        booked: Number(c.currentBookings ?? 0),
        free: Number(c.availableSlots ?? 0),
        available: Boolean(c.isAvailable)
      }))
    }))
  };
}
async function userCourses(token, userId) {
  return arr(await call(`/users/${encodeURIComponent(userId)}/courses`, { token, what: "Mis cursos" }), "courses");
}
async function enroll(token, courseId, userId, body) {
  return call(`/courses/${encodeURIComponent(courseId)}/users/${encodeURIComponent(userId)}/enroll`, { method: "POST", token, body, what: "Inscripción al curso" });
}
async function classBookings(token, userId, filter = {}) {
  return arr(await call(`/users/${encodeURIComponent(userId)}/class-bookings`, { token, query: filter, what: "Mis clases" }), "bookings");
}
async function bookClass(token, userId, courseId, classDateTime) {
  const out = await call(`/users/${encodeURIComponent(userId)}/class-bookings`, { method: "POST", token, body: { courseId, classDateTime, status: "CONFIRMED" }, what: "Reservar clase" });
  if (out && out.success === false)
    fail("upstream/validation", `Reservar clase: ${cleanText(out.message, 200) || "rechazada"}.`);
  return out ?? {};
}
async function cancelClass(token, userId, courseId, classDateTime) {
  await call(`/users/${encodeURIComponent(userId)}/class-bookings`, { method: "DELETE", token, body: { courseId, classDateTime }, what: "Cancelar clase" });
}
async function listTournaments(token, status) {
  return arr(await call("/tournaments", { token, query: { status }, what: "Torneos" }), "tournaments");
}
async function getTournament(token, id) {
  const b = await call(`/tournaments/${encodeURIComponent(id)}`, { token, what: `Torneo ${id}` });
  return b?.data ?? b ?? {};
}
async function competitions(token, id) {
  return arr(await call(`/tournaments/${encodeURIComponent(id)}/competitions`, { token, what: "Competiciones" }), "competitions");
}
async function registerCompetition(token, t, c, body) {
  return call(`/tournaments/${encodeURIComponent(t)}/competitions/${encodeURIComponent(c)}/register`, { method: "POST", token, body, what: "Inscripción al torneo" });
}
async function unregisterCompetition(token, t, c, dependentIdentification) {
  await call(`/tournaments/${encodeURIComponent(t)}/competitions/${encodeURIComponent(c)}/register`, { method: "DELETE", token, body: dependentIdentification ? { dependentIdentification } : {}, what: "Cancelar inscripción" });
}
async function myRegistrations(token) {
  return arr(await call("/tournaments/my-registrations", { token, what: "Mis inscripciones" }), "registrations");
}
async function listPromotions(status) {
  return arr(await call("/promotions", { query: { status }, what: "Promociones" }), "promotions");
}
async function userPromotions(token, userId) {
  return arr(await call(`/users/${encodeURIComponent(userId)}/promotions`, { token, what: "Mis promociones" }), "promotions");
}
async function poolRatingSummary(poolId) {
  const b = await call(`/ratings/pool/${encodeURIComponent(poolId)}/summary/public`, { what: "Calificaciones" });
  return b?.data ?? b ?? {};
}

// src/cefe/auth.ts
function storedEmail(profile) {
  return loadConfig(paths.cefe.config(), profileName(profile)).email;
}
function currentSession(profile) {
  return loadSession(paths.cefe.sessions(profile));
}
function tokenExpiry(token, now = Date.now()) {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8"));
    if (typeof payload.exp === "number")
      return new Date(payload.exp * 1000).toISOString();
  } catch {}
  return new Date(now + 12 * 3600000).toISOString();
}
var secretRef = (email) => ({ service: "cupo-cefe", account: email, envKey: "CEFE_PASSWORD" });
function knownEmail(profile) {
  return process.env.CEFE_EMAIL ?? envFileValue("CEFE_EMAIL") ?? storedEmail(profile);
}
function savedPassword(email) {
  return process.env.CEFE_PASSWORD || loadSecret(secretRef(email))?.value;
}
async function resolvePassword(opts) {
  if (process.env.CEFE_PASSWORD)
    return process.env.CEFE_PASSWORD;
  if (opts.stdin) {
    const text = readFileSync6(0, "utf8").split(/\r?\n/)[0] ?? "";
    if (!text)
      fail("auth/password-required", "No llegó contraseña por stdin.");
    return text;
  }
  if (opts.email) {
    const saved = loadSecret(secretRef(opts.email));
    if (saved)
      return saved.value;
  }
  if (!opts.noInput) {
    const pw = await promptSecret("Contraseña CEFE Chapinero: ");
    if (pw)
      return pw;
  }
  return fail("auth/password-required", "Necesito tu contraseña y no hay terminal interactiva.", "Exporta CEFE_PASSWORD, usa --password-stdin, o guárdala una vez con `cupo cefe auth login --save`.");
}
function forgetPassword(email) {
  return forgetSecret(secretRef(email));
}
function passwordLocation(email) {
  return email ? secretLocation(secretRef(email)) : null;
}
function persistSession(profile, email, token, user) {
  const session = { createdAt: new Date().toISOString(), expiresAt: tokenExpiry(token), email, token, user };
  saveSession(paths.cefe.sessions(profile), session);
  saveConfig(paths.cefe.config(), { profiles: { [profileName(profile)]: { email } } });
  return session;
}
async function login2(profile, email, password, opts = {}) {
  const { token, user } = await login(email, password);
  const session = persistSession(profile, email, token, user);
  if (!opts.save)
    return session;
  const saved = saveSecret(secretRef(email), password);
  return { ...session, savedTo: saved.detail };
}
function logoutLocal(profile) {
  clearSession(paths.cefe.sessions(profile));
}
async function requireSession(profile) {
  const s = currentSession(profile);
  const expired = Boolean(s?.expiresAt && Date.parse(s.expiresAt) < nowMs());
  if (s && !expired)
    return s;
  const email = s?.email ?? knownEmail(profile);
  const password = email ? savedPassword(email) : undefined;
  if (email && password)
    return login2(profile, email, password);
  if (!s)
    return fail("auth/required", "No has iniciado sesión en CEFE Chapinero.", "Corre `cupo cefe auth login --email <tu correo>` (con --save no vuelve a pedir la contraseña).");
  return fail("auth/expired", "La sesión de CEFE Chapinero venció.", "Corre `cupo cefe auth login` de nuevo (con --save no vuelve a pedir la contraseña).");
}

// src/idrd/webclient.ts
import { existsSync as existsSync8, readFileSync as readFileSync7, unlinkSync as unlinkSync4 } from "node:fs";
import { join as join7 } from "node:path";
var TTL_MS = 7 * 24 * 3600000;
var cacheFile = () => join7(appHome(), "web-client.json");
async function webClient(opts = {}) {
  const envId = process.env.IDRD_CLIENT_ID;
  const envSecret = process.env.IDRD_CLIENT_SECRET;
  if (envId && envSecret)
    return { id: envId, secret: envSecret, source: "env" };
  if (!opts.refresh && existsSync8(cacheFile())) {
    try {
      const c = JSON.parse(readFileSync7(cacheFile(), "utf8"));
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
  tennis: { path: "/api/parks/tennis-courts", label: "Tenis", noun: "cancha", plural: "canchas", capacity: "exclusive" },
  padel: { path: "/api/parks/paddle-courts", label: "Pádel", noun: "cancha", plural: "canchas", capacity: "exclusive" },
  pickleball: { path: "/api/parks/pickleball-courts", label: "Pickleball", noun: "cancha", plural: "canchas", capacity: "exclusive" },
  synthetic: { path: "/api/parks/synthetic-fields", label: "Fútbol sintético", noun: "cancha", plural: "canchas", capacity: "exclusive" },
  natural: { path: "/api/parks/natural-soccer-fields", label: "Fútbol natural", noun: "cancha", plural: "canchas", capacity: "exclusive" },
  pool: { path: "/api/parks/swimming-pools", label: "Piscinas", noun: "piscina", plural: "piscinas", capacity: "quota", needs: "lane" },
  grill: { path: "/api/parks/grills", label: "Asadores", noun: "asador", plural: "asadores", capacity: "exclusive", block: true },
  gym: { path: "/api/parks/gyms", label: "Gimnasios", noun: "gimnasio", plural: "gimnasios", capacity: "quota" },
  coliseum: { path: "/api/parks/coliseum", label: "Coliseos", noun: "coliseo", plural: "coliseos", capacity: "exclusive", needs: "sport" }
};
var ALL_SPORTS = Object.keys(SPORTS);
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
  naturales: "natural",
  pool: "pool",
  pools: "pool",
  piscina: "pool",
  piscinas: "pool",
  natacion: "pool",
  natación: "pool",
  grill: "grill",
  grills: "grill",
  asador: "grill",
  asadores: "grill",
  asadero: "grill",
  asaderos: "grill",
  bbq: "grill",
  gym: "gym",
  gyms: "gym",
  gimnasio: "gym",
  gimnasios: "gym",
  coliseum: "coliseum",
  coliseo: "coliseum",
  coliseos: "coliseum",
  polideportivo: "coliseum"
};
function parseSport(input) {
  if (!input)
    return "tennis";
  const s = ALIASES[input.trim().toLowerCase()];
  if (!s)
    fail("usage/bad-sport", `Tipo de espacio desconocido: ${input}.`, `Opciones: ${ALL_SPORTS.join(", ")}.`);
  return s;
}
function sportFromEndowment(kind, hints = {}) {
  const k = kind.trim().toUpperCase();
  if (k === "PISCINA")
    return "pool";
  if (k === "ASADERO" || hints.isGrill)
    return "grill";
  if (k === "OTRO(MÓDULO)" || k === "OTRO(MODULO)")
    return "gym";
  if (k === "POLIDEPORTIVO")
    return "coliseum";
  if (hints.isPickleball)
    return "pickleball";
  if (hints.isPaddle)
    return "padel";
  if (k.includes("TENNIS") || k.includes("TENIS"))
    return "tennis";
  if (k.includes("NATURAL"))
    return "natural";
  return "synthetic";
}
var CEFE_POOL_IDS = new Set([16893, 17256, 17082, 18181, 12499]);

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
    fail("auth/unauthorized", "Sesión inválida o vencida.", "Corre `cupo idrd auth login`.");
  if (res.status === 404)
    fail("not-found/resource", `${what}: no existe.`);
  if (res.status === 422)
    fail("upstream/validation", `${what}: el portal rechazó la solicitud.`, upstreamMessage(res.body));
  if (res.status >= 400)
    fail("upstream/error", `${what}: HTTP ${res.status}.`, upstreamMessage(res.body));
  return res.body;
}
var PAGE_SIZE = 500;
var MAX_PAGES = 50;
async function paginate(path, what, query = {}, token) {
  const all = [];
  let page = 1;
  let lastPage = 1;
  do {
    const body = ensureOk(await request(HOSTS.api, path, { query: { ...query, per_page: PAGE_SIZE, page }, token }), what);
    all.push(...body?.data ?? []);
    const meta = body?.meta ?? {};
    lastPage = Math.max(1, Number(meta.last_page) || 1);
    const current = Number(meta.current_page) || page;
    if (current !== page)
      break;
    page += 1;
  } while (page <= lastPage && page <= MAX_PAGES);
  if (lastPage > MAX_PAGES) {
    fail("upstream/pagination", `${what}: el portal devolvió ${lastPage} páginas y solo leí ${MAX_PAGES}.`, "Reporta el cambio; el listado estaría incompleto.");
  }
  return all;
}
async function listCourts(sport) {
  const raw = await paginate(SPORTS[sport].path, "Listado de espacios");
  const seen = new Set;
  const courts = [];
  for (const r of raw) {
    const c = normalizeCourt(r, sport);
    if (!seen.has(c.id)) {
      seen.add(c.id);
      courts.push(c);
    }
  }
  return courts;
}
async function listLanes(poolId) {
  const body = ensureOk(await request(HOSTS.api, "/api/parks/swimming-pool-lanes", { query: { id_dotacion: poolId } }), "Carriles");
  return (body?.data ?? []).map((l) => ({
    id: Number(l.id),
    name: cleanText(l.name, 20),
    level: cleanText(l.level?.name, 30),
    direction: cleanText(l.direction?.name, 30),
    quota: l.quota === undefined || l.quota === null ? null : Number(l.quota),
    poolId: l.pool?.id_piscina === undefined ? null : Number(l.pool.id_piscina),
    enabled: String(l.enable ?? "1") === "1"
  }));
}
async function listColiseumSports(coliseumId) {
  const body = ensureOk(await request(HOSTS.api, "/api/parks/coliseum-sports", { query: { id_dotacion: coliseumId } }), "Deportes del coliseo");
  return (body?.data ?? []).map((d) => ({ id: Number(d.id), name: cleanText(d.nombre ?? d.name, 60) }));
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
var truthy = (v) => v === true || v === 1 || v === "1" || v === "True" || v === "true";
async function getSchedule(courtId, date, opts = {}) {
  const res = await request(HOSTS.api, `/api/parks/schedules/${courtId}`, { query: { date, lane: opts.lane, sport_id: opts.sportId, document: opts.document } });
  const body = ensureOk(res, `Horarios del espacio ${courtId}`);
  const det = body?.details ?? {};
  const inner = det.details ?? {};
  const kind = cleanText(inner.endowment, 40);
  return {
    entries: (body?.data ?? []).filter((e) => typeof e?.start === "string" && typeof e?.end === "string"),
    endowment: {
      kind,
      sport: sportFromEndowment(kind, { isPickleball: truthy(inner.is_pickleball), isPaddle: truthy(inner.is_paddle), isGrill: truthy(inner.is_grill) }),
      description: cleanText(inner.description ?? det.endowment_description, 120),
      status: cleanText(inner.status, 40),
      surface: cleanText(inner.floor_material, 80),
      lighting: cleanText(inner.illumination, 10),
      allDay: truthy(inner.all_day),
      lanes: inner.lane === undefined || inner.lane === null ? null : Number(inner.lane) || null,
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
    fail("auth/refresh-failed", "No pude renovar la sesión.", "Corre `cupo idrd auth login` de nuevo.");
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
    documentType: profile.document_type_id ? cleanText(profile.document_type_id, 10) : null,
    profile
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
function dataOf(res, what) {
  const ok2 = ensureOk(res, what);
  const d = ok2 && typeof ok2 === "object" && "data" in ok2 ? ok2.data : ok2;
  return d && typeof d === "object" ? d : {};
}
async function gymMembershipStatus(token, gymId) {
  return dataOf(await request(HOSTS.api, `/api/parks/schedules/${gymId}/gym-membership/status`, { token }), "Estado de la mensualidad");
}
async function gymMembershipQuote(token, gymId) {
  return dataOf(await request(HOSTS.api, `/api/parks/schedules/${gymId}/gym-membership/quote`, { token }), "Cotización de la mensualidad");
}
async function gymMembershipAvailability(token, gymId) {
  return dataOf(await request(HOSTS.api, `/api/parks/schedules/${gymId}/gym-membership/availability`, { token }), "Disponibilidad de la mensualidad");
}
async function gymMembershipActive(token) {
  const res = await request(HOSTS.api, "/api/parks/gym-membership/active", { token });
  const ok2 = ensureOk(res, "Mensualidades activas");
  return ok2?.data ?? ok2;
}
async function gymMembershipPurchase(token, gymId, body) {
  return dataOf(await request(HOSTS.api, `/api/parks/schedules/${gymId}/gym-membership/purchase`, { method: "POST", token, body }), "Compra de la mensualidad");
}
async function membershipReservations(token, membershipId) {
  return dataOf(await request(HOSTS.api, `/api/memberships/${membershipId}/reservations`, { token }), "Reservas de la mensualidad");
}
function normalizeActivity(a) {
  const quota = Number(a.quota ?? 0);
  const taken = Number(a.taken ?? a.users_schedules_count ?? 0);
  return {
    id: Number(a.id),
    program: cleanText(a.program_name, 120),
    name: cleanText(a.activity_name, 160),
    stage: cleanText(a.stage_name, 160),
    parkName: cleanText(a.park_name, 120),
    parkCode: cleanText(a.park_code, 20),
    address: cleanText(a.park_address, 200),
    weekdays: cleanText(a.weekday_name, 80),
    hours: cleanText(a.daily_name, 80),
    minAge: a.min_age === null || a.min_age === undefined ? null : Number(a.min_age),
    maxAge: a.max_age === null || a.max_age === undefined ? null : Number(a.max_age),
    quota,
    taken,
    left: Math.max(0, quota - taken),
    paid: Boolean(a.is_paid),
    rate: cleanText(a.rate_name, 80),
    rateValue: a.rate_value === null || a.rate_value === undefined ? null : Number(a.rate_value),
    startDate: cleanText(a.start_date, 30),
    endDate: cleanText(a.final_date, 30),
    active: Boolean(a.is_activated),
    open: Boolean(a.is_initiate),
    teams: Boolean(a.is_teams),
    disability: Boolean(a.disability),
    consent: Array.isArray(a.consent) ? a.consent : [],
    regulations: Array.isArray(a.regulations) ? a.regulations : []
  };
}
async function listActivities(filter = {}) {
  const query = {};
  (filter.programIds ?? []).forEach((id, i) => {
    query[`program_id[${i}]`] = id;
  });
  (filter.stageIds ?? []).forEach((id, i) => {
    query[`stage_id[${i}]`] = id;
  });
  const raw = await paginate("/api/citizen-portal/public-schedules", "Actividades", query);
  return raw.map(normalizeActivity);
}
async function getActivity(id) {
  const body = ensureOk(await request(HOSTS.api, `/api/citizen-portal/public-schedules/${id}`), `Actividad ${id}`);
  if (!body?.data)
    fail("not-found/resource", `Actividad ${id}: no existe.`);
  return normalizeActivity(body.data);
}
function refs(rows) {
  return (rows ?? []).map((r) => ({
    id: Number(r.id),
    name: cleanText(r.name, 160),
    count: typeof r.schedules_count === "number" ? r.schedules_count : null,
    ...r.park_name !== undefined ? { parkName: cleanText(r.park_name, 120), parkCode: cleanText(r.park_code, 20) } : {}
  }));
}
async function listPrograms() {
  return refs(ensureOk(await request(HOSTS.api, "/api/citizen-portal/programs"), "Programas")?.data);
}
async function listStages() {
  return refs(ensureOk(await request(HOSTS.api, "/api/citizen-portal/stages"), "Escenarios")?.data);
}
async function listCategories() {
  const body = ensureOk(await request(HOSTS.api, "/api/citizen-portal/schedules/categories"), "Categorías");
  return (body?.data ?? []).map((c) => ({ name: cleanText(c.name, 80), value: cleanText(c.value, 80) }));
}
async function listProfiles(token) {
  const body = ensureOk(await request(HOSTS.api, "/api/profiles/list", { token }), "Perfiles");
  return Array.isArray(body?.data) ? body.data : [];
}
async function listBeneficiaries(token) {
  const body = ensureOk(await request(HOSTS.api, "/api/profiles", { token }), "Beneficiarios");
  return Array.isArray(body?.data) ? body.data : [];
}
async function listSubscriptions(token) {
  const body = ensureOk(await request(HOSTS.api, "/api/profiles/subscriptions", { token }), "Inscripciones");
  return Array.isArray(body?.data) ? body.data : [];
}
async function subscribe(token, profileId, activityId, body) {
  const res = await request(HOSTS.api, `/api/profiles/${profileId}/schedules/${activityId}`, { method: "POST", token, body });
  const ok2 = ensureOk(res, "Inscripción");
  return { message: cleanText(ok2?.data ?? ok2?.message, 300), details: ok2?.details ?? null };
}
async function unsubscribe(token, subscriptionId) {
  const res = await request(HOSTS.api, `/api/profiles/subscriptions/${subscriptionId}`, { method: "DELETE", token });
  return ensureOk(res, "Desinscripción");
}
async function pendingToPay(token) {
  const body = ensureOk(await request(HOSTS.api, "/api/citizen-portal/pending-to-pay", { token }), "Pagos pendientes");
  const list = Array.isArray(body) ? body : body?.data ?? [];
  return Array.isArray(list) ? list : [];
}
async function paymentHistory(token) {
  return paginate("/api/citizen-portal/payments", "Historial de pagos", {}, token);
}

// src/idrd/auth.ts
import { readFileSync as readFileSync8 } from "node:fs";
var REFRESH_MARGIN_MS = 5 * 60000;
function storedEmail2(profile) {
  return loadConfig(paths.config(), profileName(profile)).email;
}
function currentSession2(profile) {
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
var secretRef2 = (email) => ({ service: "cupo-idrd", account: email, envKey: "IDRD_PASSWORD" });
function knownEmail2(profile) {
  return process.env.IDRD_EMAIL ?? envFileValue("IDRD_EMAIL") ?? storedEmail2(profile);
}
function savedPassword2(email) {
  return process.env.IDRD_PASSWORD || loadSecret(secretRef2(email))?.value;
}
async function resolvePassword2(opts) {
  if (process.env.IDRD_PASSWORD)
    return process.env.IDRD_PASSWORD;
  if (opts.stdin) {
    const text = readFileSync8(0, "utf8").split(/\r?\n/)[0] ?? "";
    if (!text)
      fail("auth/password-required", "No llegó contraseña por stdin.");
    return text;
  }
  if (opts.email) {
    const saved = loadSecret(secretRef2(opts.email));
    if (saved)
      return saved.value;
  }
  if (!opts.noInput) {
    const pw = await promptSecret("Contraseña IDRD: ");
    if (pw)
      return pw;
  }
  return fail("auth/password-required", "Necesito tu contraseña y no hay terminal interactiva.", "Exporta IDRD_PASSWORD, usa --password-stdin, o guárdala una vez con `cupo idrd auth login --save`.");
}
async function login3(profile, email, password, opts = {}) {
  const tokens = await passwordGrant(email, password);
  saveConfig(paths.config(), { profiles: { [profileName(profile)]: { email } } });
  const session = persist(profile, email, tokens);
  if (!opts.save)
    return session;
  const saved = saveSecret(secretRef2(email), password);
  return { ...session, savedTo: saved.detail };
}
function forgetPassword2(email) {
  return forgetSecret(secretRef2(email));
}
function passwordLocation2(email) {
  return email ? secretLocation(secretRef2(email)) : null;
}
async function autoLogin(profile, email) {
  if (!email)
    return null;
  const password = savedPassword2(email);
  if (!password)
    return null;
  return login3(profile, email, password);
}
function logoutLocal2(profile) {
  clearSession(paths.sessions(profile));
}
async function accessToken(profile) {
  const session = currentSession2(profile);
  if (!session) {
    const auto2 = await autoLogin(profile, knownEmail2(profile));
    if (auto2)
      return { token: auto2.accessToken, session: auto2, refreshed: true };
    fail("auth/required", "No has iniciado sesión.", "Corre `cupo idrd auth login --email <tu correo>` (con --save no vuelve a pedir la contraseña).");
  }
  const expiresAt = session.expiresAt ? Date.parse(session.expiresAt) : 0;
  if (expiresAt - Date.now() > REFRESH_MARGIN_MS)
    return { token: session.accessToken, session, refreshed: false };
  if (session.refreshToken) {
    try {
      const t = await refreshGrant(session.refreshToken);
      const next = persist(profile, session.email, t, session.refreshToken);
      return { token: next.accessToken, session: next, refreshed: true };
    } catch (err) {
      if (!(err instanceof AppError))
        throw err;
    }
  }
  const auto = await autoLogin(profile, session.email);
  if (auto)
    return { token: auto.accessToken, session: auto, refreshed: true };
  return fail("auth/expired", "La sesión venció y no se pudo renovar.", "Corre `cupo idrd auth login` (con --save no vuelve a pedir la contraseña).");
}

// src/idrd/payment.ts
import { readdirSync, readFileSync as readFileSync9 } from "node:fs";
import { join as join8 } from "node:path";
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
    lane: ctx.lane ?? null,
    sportId: ctx.sportId ?? null,
    raw
  };
}
function saveBooking(profile, b) {
  atomicWriteJson(join8(paths.bookings(profile), `${b.bookingId}.json`), b, { mode: 384 });
}
function loadBooking(profile, bookingId) {
  try {
    return JSON.parse(readFileSync9(join8(paths.bookings(profile), `${bookingId}.json`), "utf8"));
  } catch {
    return fail("not-found/booking", `No tengo registrada la reserva ${bookingId} en este equipo.`, "Solo se puede pagar una reserva creada con `cupo idrd booking create`.");
  }
}
function localBookings(profile) {
  try {
    return readdirSync(paths.bookings(profile)).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(readFileSync9(join8(paths.bookings(profile), f), "utf8")));
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
    sport_id: b.sportId ?? null
  };
}
function membershipPaymentPayload(quote, profile, opts) {
  const s = (v) => v === null || v === undefined ? null : String(v);
  const person = profile.person_type_id || "N";
  const amount = Number(quote.amount ?? 0);
  const base = {
    permitTypeSelected: "PO",
    permitNumber: "999",
    name: profile.name ?? profile.first_name ?? null,
    lastName: profile.surname ?? profile.last_name ?? null,
    phone: s(profile.phone ?? profile.mobile_phone),
    email: opts.email,
    address: profile.address ?? null,
    documentTypeSelected: profile.document_type_id ?? null,
    document: profile.document ?? null,
    parkSelected: quote.park_id ?? null,
    serviceParkSelected: quote.service_id ?? null,
    isTheSame: true,
    concept: quote.concept ?? "Mensualidad Gimnasio",
    totalPay: amount,
    typePersonSelected: person,
    typePersonSelectedPayer: person,
    BankTypeSelected: amount === 0 ? "0" : opts.bankCode,
    redirect_url: RECEIPT_BASE,
    ip_address: opts.ip,
    sport_id: null,
    ...opts.membershipId ? { membership_id: opts.membershipId } : {}
  };
  return {
    ...base,
    documentTypeSelectedPayer: base.documentTypeSelected,
    documentPayer: base.document,
    namePayer: base.name,
    lastNamePayer: base.lastName,
    phonePayer: base.phone,
    emailPayer: base.email,
    addressPayer: base.address
  };
}

// src/registry.ts
var COMMANDS = [
  {
    name: "find",
    summary: "Busca cupo para hacer deporte en todos los proveedores a la vez. Cada resultado trae el comando exacto para reservarlo.",
    flags: [
      { flag: "--sport <tennis|padel|pickleball|synthetic|natural|pool|grill|gym|coliseum>", description: "Qué quieres hacer (default pool)" },
      { flag: "--date <YYYY-MM-DD|hoy|mañana|lun..dom>", description: "Cuándo (default mañana)" },
      { flag: "--from <hora> --to <hora>", description: "Ventana, ej. --from 6 --to 10 o --from 06:30" },
      { flag: "--locality <texto>", description: "Localidad o parque (chapinero, suba, usaquen…)" },
      { flag: "--provider <idrd|cefe>", description: "Solo un proveedor" }
    ],
    trust: "T0",
    auth: false,
    output: "{date, sport, window, providers[], scanned{}, results: [{provider, id, kind, name, where, lane?, free[]{start,end,places?}, bookCommand}], failed[]}",
    examples: ["cupo find --sport pool --date sab --from 6 --to 10", "cupo find --sport tennis --date vie --locality suba"]
  },
  {
    name: "book",
    summary: "Reserva un cupo de `cupo find` por su id (idrd:… o cefe:…). Sin --yes solo muestra la vista previa; el proveedor decide si además exige --confirm.",
    args: [{ name: "id", description: "idrd:<id> o cefe:<poolId>" }],
    flags: [
      { flag: "--date <fecha>", description: "Fecha" },
      { flag: "--hour <h> | --time HH:MM", description: "Hora de inicio (cualquiera de las dos formas)" },
      { flag: "--hours, --lane, --sport-id, --dependent, --pay, --document, --adult-*", description: "Pasan al proveedor; ver `cupo idrd booking create --help` y `cupo cefe booking create --help`" },
      { flag: "--yes [--confirm <intent>]", description: "Ejecuta. IDRD (irreversible) exige también --confirm" }
    ],
    trust: "T3",
    auth: true,
    output: "la salida de `idrd booking create` o `cefe booking create` según el proveedor",
    examples: ["cupo book idrd:11537 --date vie --hour 16", "cupo book cefe:463e2980-59d9-4789-a6b1-7a0d035f561d --date sab --time 07:15 --yes"]
  },
  {
    name: "providers",
    summary: "Mapa de proveedores: qué cubre cada uno, si tienes sesión y cómo entrar.",
    trust: "T0",
    auth: false,
    output: "[{id, name, web, covers, sports[], loggedIn, email, login, commands}]"
  },
  {
    name: "idrd court list",
    summary: "Lista espacios reservables de un tipo: canchas, piscinas, asadores, gimnasios, coliseos (por defecto solo los reservables en línea). Alias: `cupo idrd space list`.",
    flags: [
      { flag: "--sport <tennis|padel|pickleball|synthetic|natural|pool|grill|gym|coliseum>", description: "Tipo de espacio (default tennis)" },
      { flag: "--locality <texto>", description: "Filtra por localidad (ej. usaquen)" },
      { flag: "--all", description: "Incluye canchas no reservables en línea" }
    ],
    trust: "T0",
    auth: false,
    output: "Court[] {id, parkId, parkName, parkCode, address, locality, upz, sport, description, bookable}",
    examples: ["cupo idrd court list", "cupo idrd court list --sport padel", "cupo idrd court list --sport pool --all"]
  },
  {
    name: "idrd court get",
    summary: "Detalle de un espacio: tipo, parque, horario de servicio, superficie, reglas; carriles (piscinas) o deportes (coliseos).",
    args: [{ name: "id", description: "id del espacio (park_endowment_id)" }],
    trust: "T0",
    auth: false,
    output: "{court, kind, park, endowment{kind,sport,status,surface,lighting,lanes,rules}, lanes[], sports[]}",
    examples: ["cupo idrd court get 11537", "cupo idrd court get 16893"]
  },
  {
    name: "idrd court lanes",
    summary: "Carriles de una piscina (las piscinas se consultan y reservan por carril).",
    args: [{ name: "id", description: "id de la piscina" }],
    trust: "T0",
    auth: false,
    output: "Lane[] {id, name, level, direction, quota, poolId, enabled}",
    examples: ["cupo idrd court lanes 16893"]
  },
  {
    name: "idrd court sports",
    summary: "Deportes que admite un coliseo (el id va en --sport-id al consultar y reservar).",
    args: [{ name: "id", description: "id del coliseo" }],
    trust: "T0",
    auth: false,
    output: "ColiseumSport[] {id, name}",
    examples: ["cupo idrd court sports 16892"]
  },
  {
    name: "idrd slot list",
    summary: "Horas de un espacio en una fecha, con disponibilidad real (reservable menos reservado; cupos en piscinas y gimnasios; bloques en asadores).",
    args: [{ name: "id", description: "id del espacio" }],
    flags: [
      { flag: "--date <YYYY-MM-DD|hoy|mañana|lun..dom>", description: "Fecha (default hoy)" },
      { flag: "--free", description: "Solo horas libres" },
      { flag: "--lane <id>", description: "Piscinas: carril (obligatorio; ver `court lanes`)" },
      { flag: "--sport-id <id>", description: "Coliseos: deporte (ver `court sports`)" },
      { flag: "--document <doc>", description: "CEFE: documento del beneficiario (filtra su calendario)" }
    ],
    trust: "T0",
    auth: false,
    output: "{courtId, kind, lane, sportId, date, weekDates[], slots: HourSlot[] {hour,start,end,available,quota?,used?}, blocks: [{from,to,available}], freeRuns}",
    examples: ["cupo idrd slot list 11537 --date vie --free", "cupo idrd slot list 16893 --lane 3 --date sab", "cupo idrd slot list 16892 --sport-id 3 --date dom"]
  },
  {
    name: "idrd slot find",
    summary: "Busca horas libres en todos los espacios de un tipo (piscinas: en todos sus carriles). Atajo: `cupo idrd find`.",
    flags: [
      { flag: "--date <fecha>", description: "Fecha (default mañana)" },
      { flag: "--sport <tipo>", description: "Tipo de espacio (default tennis)" },
      { flag: "--from <hora>", description: "Desde esta hora, ej. 6 (default 0)" },
      { flag: "--to <hora>", description: "Hasta esta hora, ej. 9 (default 24)" },
      { flag: "--locality <texto>", description: "Filtra por localidad o parque" },
      { flag: "--sport-id <id>", description: "Coliseos: deporte" }
    ],
    trust: "T0",
    auth: false,
    output: "{date, sport, window, results: [{court, lane?, freeHours[], places?}], scanned, spaces, failed[]}",
    examples: ["cupo idrd find --date mie --from 6 --to 9", "cupo idrd find --sport pool --date sab --from 6 --to 10", "cupo idrd find --sport grill --date dom"]
  },
  {
    name: "idrd auth login",
    summary: "Inicia sesión (OAuth del portal). Guarda el token y tu correo. La contraseña solo con --save: Llavero de macOS o ~/.cupo/env (0600); entonces la sesión se renueva sola al vencer.",
    flags: [
      { flag: "--email <correo>", description: "Correo de tu cuenta (se recuerda)" },
      { flag: "--password-stdin", description: "Lee la contraseña de stdin (o usa IDRD_PASSWORD)" },
      { flag: "--save", description: "Guarda la contraseña (Llavero en macOS, ~/.cupo/env en Linux) para no volver a pedirla" }
    ],
    trust: "T1",
    auth: false,
    output: "{email, expiresAt, refreshable, passwordSaved, user{id,name,verified,hasProfile}}",
    examples: ["cupo idrd auth login --email yo@correo.com --save", "IDRD_PASSWORD=… cupo idrd auth login --email yo@correo.com --json"]
  },
  { name: "idrd auth status", summary: "Estado de la sesión, con una llamada real al portal.", trust: "T0", auth: false, output: "{loggedIn, email, expiresAt, expired, refreshable, passwordStored, user?}" },
  { name: "idrd auth logout", summary: "Cierra sesión en el portal y borra el token local. Con --forget borra también la contraseña guardada.", flags: [{ flag: "--forget", description: "Borra la contraseña guardada con --save" }], trust: "T1", auth: true, output: "{loggedOut, passwordForgotten}" },
  {
    name: "idrd booking list",
    summary: "Tus reservas en el portal, más las creadas desde este equipo.",
    trust: "T0",
    auth: true,
    output: "{remote: object[], local: BookingRecord[]}"
  },
  {
    name: "idrd booking create",
    summary: "Reserva un espacio (cancha, piscina, asador, gimnasio por hora, coliseo). Sin --yes solo muestra la vista previa. Las reservas NO se pueden cancelar.",
    args: [{ name: "id", description: "id del espacio" }],
    flags: [
      { flag: "--date <fecha>", description: "Fecha de la reserva" },
      { flag: "--hour <hora>", description: 'Hora de inicio, ej. 6 o "6:00 AM" (asadores: inicio del bloque, default el primero libre)' },
      { flag: "--hours <n>", description: "Duración (canchas máx. 2; otros, dentro del bloque publicado; asadores: el bloque completo)" },
      { flag: "--lane <id>", description: "Piscinas: carril (obligatorio)" },
      { flag: "--sport-id <id>", description: "Coliseos: deporte (obligatorio)" },
      { flag: "--document <doc>", description: "Beneficiario distinto al titular (CEFE); default tu documento" },
      { flag: "--adult-document-type <t> --adult-document <n> --adult-name <nombre>", description: "Piscinas CEFE: adulto responsable para beneficiarios de 5 a 12 años" },
      { flag: "--bank <código>", description: "Si cobra: genera de una vez el link PSE con este banco" },
      { flag: "--yes --confirm <intent>", description: "Ejecuta. <intent> lo imprime la vista previa" },
      { flag: "--dry-run", description: "Fuerza vista previa aunque pases --yes" }
    ],
    trust: "T3",
    auth: true,
    output: "preview: {dryRun:true, intent, request, checks[]} | live: {booking: BookingRecord, payment?}",
    examples: ["cupo idrd booking create 11537 --date vie --hour 6", "cupo idrd booking create 16893 --lane 3 --date sab --hour 7", "cupo idrd booking create 16848 --date dom", "cupo idrd booking create 11537 --date vie --hour 6 --yes --confirm 11537@2026-11-06T06x1"]
  },
  { name: "idrd pay banks", summary: "Bancos disponibles en PSE.", trust: "T0", auth: false, output: "Bank[] {code, name}" },
  {
    name: "idrd pay pse",
    summary: "Genera el link de pago PSE (bank_url) de una reserva creada desde este equipo.",
    args: [{ name: "bookingId", description: "id devuelto por booking create" }],
    flags: [
      { flag: "--bank <código>", description: "Banco (ver `cupo idrd pay banks`)" },
      { flag: "--yes", description: "Confirma la creación de la orden de pago" },
      { flag: "--open", description: "Abre el link en el navegador" }
    ],
    trust: "T2",
    auth: true,
    output: "{bookingId, amount, bankUrl, paymentCode}"
  },
  {
    name: "idrd pay status",
    summary: "Estado de un pago PSE: aprobado, fallido o pendiente, con el comprobante si fue aprobado.",
    args: [{ name: "code", description: "código de pago que imprimió `pay pse`, o el número de la reserva (se busca en tu historial)" }],
    trust: "T0",
    auth: true,
    output: "{code, bookingId, approved, receiptUrl, payments[]}",
    examples: ["cupo idrd pay status 875972", "cupo idrd pay status e4334d5c-…"]
  },
  { name: "idrd pay pending", summary: "Pagos pendientes de tu cuenta en el portal.", trust: "T0", auth: true, output: "object[] (respuesta del portal)" },
  { name: "idrd pay history", summary: "Historial de pagos de tu cuenta.", trust: "T0", auth: true, output: "object[] (respuesta del portal)" },
  { name: "idrd gym status", summary: "Estado de tu mensualidad en un gimnasio CEFE (y sus reservas).", args: [{ name: "id", description: "id del gimnasio" }], trust: "T0", auth: true, output: "{gymId, active, status, reservations}" },
  { name: "idrd gym quote", summary: "Cotiza la mensualidad de un gimnasio: valor y vigencia.", args: [{ name: "id", description: "id del gimnasio" }], trust: "T0", auth: true, output: "{gymId, amount, validFrom, validTo, concept, quote}" },
  { name: "idrd gym availability", summary: "Cupos por día y hora para usar la mensualidad.", args: [{ name: "id", description: "id del gimnasio" }], trust: "T0", auth: true, output: "{gymId, days[]}" },
  { name: "idrd gym active", summary: "Tus mensualidades activas en todos los gimnasios.", trust: "T0", auth: true, output: "object (respuesta del portal)" },
  {
    name: "idrd gym buy",
    summary: "Compra la mensualidad de un gimnasio. Sin --yes solo vista previa. Crea la mensualidad y el link de pago PSE; no se puede cancelar. (No ejecutado en vivo: payload copiado del portal.)",
    args: [{ name: "id", description: "id del gimnasio" }],
    flags: [
      { flag: "--bank <código>", description: "Banco PSE (ver `cupo idrd pay banks`)" },
      { flag: "--yes --confirm <intent>", description: "Ejecuta. <intent> lo imprime la vista previa" }
    ],
    trust: "T3",
    auth: true,
    output: "preview: {dryRun, intent, ready, amount, checks[]} | live: {gymId, membershipId, amount, payment{paymentCode, bankUrl}}"
  },
  { name: "idrd gym activate", summary: "Activa la mensualidad con el código de un pago PSE aprobado.", args: [{ name: "id", description: "id del gimnasio" }], flags: [{ flag: "--code <pago>", description: "código de pago" }, { flag: "--yes", description: "Confirma" }], trust: "T2", auth: true, output: "{gymId, active, status}" },
  {
    name: "idrd activity list",
    summary: "Actividades y escuelas con inscripción (Escuelas de mi Barrio, Deporte de 0 a 100, CEFE…). Lee todas las páginas.",
    flags: [
      { flag: "--program <ids>", description: "Programas, ej. 43,27 (ver `activity programs`)" },
      { flag: "--stage <ids>", description: "Escenarios/sedes, ej. 1,3 (ver `activity stages`; los CEFE están aquí)" },
      { flag: "--text <texto>", description: "Busca en nombre, programa, sede y dirección" },
      { flag: "--locality <texto>", description: "Filtra por sede, parque o dirección" },
      { flag: "--age <n>", description: "Solo actividades para esa edad" },
      { flag: "--free | --paid", description: "Solo gratuitas o solo pagas" },
      { flag: "--available", description: "Solo con cupos e inscripciones abiertas" }
    ],
    trust: "T0",
    auth: false,
    output: "Activity[] {id, program, name, stage, parkName, address, weekdays, hours, minAge, maxAge, quota, taken, left, paid, rate, rateValue, startDate, endDate, open, active, consent[], regulations[]}",
    examples: ["cupo idrd activity list --available", "cupo idrd activity list --text natacion --age 8", "cupo idrd activity list --stage 3"]
  },
  { name: "idrd activity get", summary: "Detalle de una actividad: horario, edades, cupos, costo, consentimientos y reglamento.", args: [{ name: "id", description: "id de la actividad" }], trust: "T0", auth: false, output: "Activity" },
  { name: "idrd activity programs", summary: "Programas del portal con su número de actividades.", trust: "T0", auth: false, output: "{id, name, count}[]" },
  { name: "idrd activity stages", summary: "Sedes/escenarios de las actividades (incluye los CEFE) con su parque.", trust: "T0", auth: false, output: "{id, name, parkName, parkCode, count}[]" },
  { name: "idrd activity categories", summary: "Categorías deportivas de las actividades.", trust: "T0", auth: false, output: "{name, value}[]" },
  { name: "idrd activity mine", summary: "Inscripciones de tu cuenta.", trust: "T0", auth: true, output: "object[] (respuesta del portal)" },
  {
    name: "idrd activity subscribe",
    summary: "Preinscribe un perfil de tu cuenta en una actividad. Sin --yes solo vista previa. Se puede deshacer con `activity unsubscribe`. (No ejecutado en vivo.)",
    args: [{ name: "id", description: "id de la actividad" }],
    flags: [
      { flag: "--person <profileId>", description: "Perfil (titular o beneficiario) a inscribir; ver `cupo idrd profile list`" },
      { flag: "--yes --confirm <intent>", description: "Ejecuta y acepta términos y consentimientos. <intent> lo imprime la vista previa" }
    ],
    trust: "T2",
    auth: true,
    output: "preview: {dryRun, intent, ready, request, checks[], consent[]} | live: {activityId, profileId, message, subscriptionId}"
  },
  { name: "idrd activity unsubscribe", summary: "Retira una inscripción.", args: [{ name: "subscriptionId", description: "id de la inscripción (ver `activity mine`)" }], flags: [{ flag: "--yes", description: "Confirma" }], trust: "T2", auth: true, output: "{subscriptionId, unsubscribed}" },
  { name: "idrd profile list", summary: "Perfiles de tu cuenta (titular y beneficiarios) para inscripciones y reservas CEFE.", trust: "T0", auth: true, output: "{profiles[], beneficiaries[]}" },
  { name: "cefe auth login", summary: "Inicia sesión en CEFE Chapinero (cuenta distinta a la del IDRD). Guarda el token y tu correo. La contraseña solo con --save (Llavero o ~/.cupo/env); entonces la sesión se renueva sola.", flags: [{ flag: "--email <correo>", description: "Correo de tu cuenta (se recuerda)" }, { flag: "--password-stdin", description: "Lee la contraseña de stdin (o usa CEFE_PASSWORD)" }, { flag: "--save", description: "Guarda la contraseña para no volver a pedirla" }], trust: "T1", auth: false, output: "{email, expiresAt, passwordSaved, user{userId,name,credits,reservasDisponibles,dependents[]}, missingForBooking[]}", examples: ["cupo cefe auth login --email yo@correo.com --save"] },
  { name: "cefe auth status", summary: "Estado de la sesión CEFE, con una llamada real.", trust: "T0", auth: false, output: "{loggedIn, email, expiresAt, passwordStored, user?}" },
  { name: "cefe auth logout", summary: "Borra el token local de CEFE. Con --forget borra también la contraseña guardada.", flags: [{ flag: "--forget", description: "Borra la contraseña guardada con --save" }], trust: "T1", auth: false, output: "{loggedOut, passwordForgotten}" },
  { name: "cefe auth register", summary: "Crea una cuenta en CEFE Chapinero (exige --accept-habeas-data).", flags: [{ flag: "--name <nombre> --email <correo> --phone <tel> --document <num> [--document-type CC]", description: "Datos de la cuenta" }, { flag: "--accept-habeas-data", description: "Aceptas el tratamiento de datos personales" }], trust: "T2", auth: false, output: "{email, user}" },
  { name: "cefe me", summary: "Tu perfil CEFE: documento, teléfono, estrato, créditos, reservas disponibles, dependientes; y qué falta para reservar.", trust: "T0", auth: true, output: "CefeUser + missingForBooking[]" },
  { name: "cefe pool list", summary: "Piscinas del CEFE Chapinero con capacidad y horario.", flags: [{ flag: "--all", description: "Incluye inactivas" }], trust: "T0", auth: false, output: "Pool[] {poolId, name, capacity, pricePerHour, active, hours[]}" },
  { name: "cefe pool get", summary: "Detalle de una piscina: franjas publicadas, días cerrados, calificación pública.", args: [{ name: "pool", description: "poolId o parte del nombre (ej. semiolimpica)" }], trust: "T0", auth: false, output: "Pool + {schedule, rating}" },
  { name: "cefe slot list", summary: "Cupos por franja de una piscina en una fecha (capacidad menos reservados, como la web).", args: [{ name: "pool", description: "poolId o parte del nombre" }], flags: [{ flag: "--date <fecha>", description: "Fecha (default hoy)" }, { flag: "--free", description: "Solo franjas con cupo" }], trust: "T0", auth: false, output: "{poolId, date, slots[] {time, start, end, capacity, reserved, free, available}, priceEstimate}", examples: ["cupo cefe slot list semiolimpica --date sab --free"] },
  { name: "cefe slot find", summary: "Cupos libres en todas las piscinas del CEFE. Atajo: `cupo cefe find`.", flags: [{ flag: "--date <fecha>", description: "Fecha (default mañana)" }, { flag: "--from HH:MM --to HH:MM", description: "Ventana horaria" }], trust: "T0", auth: false, output: "{date, window, results[] {pool, slots[]}, scanned, failed[]}", examples: ["cupo cefe find --date sab --from 06:00 --to 10:00"] },
  {
    name: "cefe booking create",
    summary: "Reserva práctica libre (60 min). Sin --yes solo vista previa. Cancelable hasta 6 h antes. Pago: efectivo en la sede (default), Wompi en la web, o créditos.",
    args: [{ name: "pool", description: "poolId o parte del nombre" }],
    flags: [{ flag: "--date <fecha> --time HH:MM", description: "Franja publicada (ver `cefe slot list`)" }, { flag: "--dependent <n,n>", description: "Dependientes de tu perfil a incluir (1-based, ver `cefe me`)" }, { flag: "--pay <efectivo|wompi|creditos>", description: "Método de pago (default efectivo)" }, { flag: "--notes <texto>", description: "Nota para la reserva" }, { flag: "--yes", description: "Ejecuta" }],
    trust: "T2",
    auth: true,
    output: "preview: {dryRun, ready, where, pay, price, request, checks[]} | live: {reservation{id, status, …}, pay, price, payUrl?}",
    examples: ["cupo cefe booking create semiolimpica --date sab --time 07:15", "cupo cefe booking create semiolimpica --date sab --time 07:15 --dependent 1 --yes"]
  },
  { name: "cefe booking list", summary: "Tus reservas de práctica libre.", flags: [{ flag: "--date <fecha> | --from <fecha> --to <fecha>", description: "Filtro de fechas" }, { flag: "--status <pending|confirmed|cancelled|completed>", description: "Filtro de estado" }, { flag: "--upcoming", description: "Solo futuras no canceladas" }], trust: "T0", auth: true, output: "Reservation[] {id, poolName, startTime, endTime, status, price, paymentMethod, paymentStatus, cancellable}" },
  { name: "cefe booking cancel", summary: "Cancela una reserva (hasta 6 h antes).", args: [{ name: "reservationId", description: "id de `cefe booking list`" }], flags: [{ flag: "--yes", description: "Confirma" }], trust: "T2", auth: true, output: "{reservationId, cancelled}" },
  { name: "cefe course list", summary: "Cursos y actividades (natación por niveles, matronatación, acuafitness…) con precio por estrato.", flags: [{ flag: "--text <texto>", description: "Busca en nombre y grupo" }, { flag: "--available", description: "Solo con cupo" }, { flag: "--all", description: "Incluye no activos" }], trust: "T0", auth: false, output: "Course[] {courseId, name, group, schedule[], priceEstrato1_3, priceEstrato4_6, full, …}" },
  { name: "cefe course get", summary: "Detalle de un curso y sus clases con cupo en un rango de fechas.", args: [{ name: "course", description: "courseId (o prefijo de 8) o nombre exacto" }], flags: [{ flag: "--from <fecha> --to <fecha>", description: "Rango (default hoy + 13 días)" }], trust: "T0", auth: false, output: "Course + {availability{dates[]{date, classes[]}}}" },
  { name: "cefe course mine", summary: "Tus inscripciones y clases reservadas.", trust: "T0", auth: true, output: "{enrollments[], classes[]}" },
  { name: "cefe course enroll", summary: "Inscribe tu cuenta en un curso (queda pendiente de pago). Sin --yes solo vista previa. Nota: la web lo tiene deshabilitado desde jul-2026; el check lo refleja.", args: [{ name: "course", description: "courseId o prefijo" }], flags: [{ flag: "--pay <efectivo|wompi>", description: "default efectivo" }, { flag: "--yes", description: "Ejecuta" }], trust: "T2", auth: true, output: "preview {ready, checks[], request} | live {courseId, price, pay, response}" },
  { name: "cefe class book", summary: "Reserva una clase de un curso en una fecha. Sin --yes solo vista previa.", args: [{ name: "course", description: "courseId o prefijo" }], flags: [{ flag: "--date <fecha>", description: "Día de la clase" }, { flag: "--yes", description: "Ejecuta" }], trust: "T2", auth: true, output: "preview {ready, checks[]} | live {courseId, classDateTime}" },
  { name: "cefe class cancel", summary: "Cancela una clase reservada.", args: [{ name: "course", description: "courseId o prefijo" }], flags: [{ flag: "--date <fecha>", description: "Día de la clase" }, { flag: "--yes", description: "Confirma" }], trust: "T2", auth: true, output: "{courseId, classDateTime, cancelled}" },
  { name: "cefe tournament list", summary: "Torneos publicados.", flags: [{ flag: "--status <estado>", description: "Filtro" }], trust: "T0", auth: true, output: "object[]" },
  { name: "cefe tournament get", summary: "Un torneo y sus competiciones.", args: [{ name: "tournamentId", description: "id" }], trust: "T0", auth: true, output: "object + competitions[]" },
  { name: "cefe tournament mine", summary: "Tus inscripciones a torneos.", trust: "T0", auth: true, output: "object[]" },
  { name: "cefe tournament register", summary: "Te inscribe (o a un dependiente) en una competición.", args: [{ name: "tournamentId", description: "id" }], flags: [{ flag: "--competition <id>", description: "Competición" }, { flag: "--dependent <documento>", description: "Inscribir a un dependiente" }, { flag: "--sex <M|F>", description: "Si la competición lo exige" }, { flag: "--observation <texto>", description: "Nota" }, { flag: "--yes", description: "Confirma" }], trust: "T2", auth: true, output: "{tournamentId, competitionId, response}" },
  { name: "cefe tournament unregister", summary: "Cancela una inscripción a competición.", args: [{ name: "tournamentId", description: "id" }], flags: [{ flag: "--competition <id>", description: "Competición" }, { flag: "--dependent <documento>", description: "Si era de un dependiente" }, { flag: "--yes", description: "Confirma" }], trust: "T2", auth: true, output: "{tournamentId, competitionId, unregistered}" },
  { name: "cefe promo list", summary: "Promociones (pases de uso) publicadas y las tuyas si hay sesión. La compra es en la web.", trust: "T0", auth: false, output: "{promotions[], mine[]}" },
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
function providerOf(name) {
  return name.startsWith("idrd ") ? "idrd" : name.startsWith("cefe ") ? "cefe" : "cupo";
}
function findCommand(words) {
  for (const n of [4, 3, 2, 1]) {
    const name = words.slice(0, n).join(" ");
    const spec = COMMANDS.find((c) => c.name === name);
    if (spec)
      return { spec, rest: words.slice(n) };
  }
  return null;
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
import { appendFileSync, mkdirSync as mkdirSync4 } from "node:fs";
import { randomUUID } from "node:crypto";
import { join as join9 } from "node:path";
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
  mkdirSync4(auditDir, { recursive: true });
  const file = join9(auditDir, todayFilename());
  const stored = {
    ts: new Date().toISOString(),
    ...record,
    result,
    meta
  };
  appendFileSync(file, `${JSON.stringify(stored)}
`, { mode: 384 });
}

// src/cefe/schedule.ts
var DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
var SLOT_MINUTES = 60;
var PAID_FROM = "2026-11-05";
var PRICE_PER_PERSON = 1e4;
function weekdayName(date) {
  return DAYS[new Date(`${date}T12:00:00Z`).getUTCDay()];
}
function addMinutes(date, time, minutes) {
  const [h, m] = time.split(":").map(Number);
  const total = (h ?? 0) * 60 + (m ?? 0) + minutes;
  const hh2 = String(Math.floor(total / 60) % 24).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${date}T${hh2}:${mm}:00`;
}
function daySlots(cfg, date, occupancy, now) {
  const override = cfg.overrides?.find((o) => o.date === date);
  const day = override ?? cfg.weekly?.[weekdayName(date)] ?? cfg.default;
  if (!day || day.isClosed)
    return [];
  const isToday = date === now.date;
  const nowMin = now.hour * 60 + now.minute;
  return day.slots.map((s) => {
    const [h, m] = s.time.split(":").map(Number);
    const start = `${date}T${s.time}:00`;
    const rec = occupancy.find((o) => o.start.slice(0, 16) === start.slice(0, 16));
    const closed = rec?.status === "CLOSED";
    const capacity = rec?.capacity ?? s.capacity;
    const reserved = rec?.reserved ?? 0;
    const free = closed ? 0 : Math.max(0, capacity - reserved);
    const past = isToday && (h ?? 0) * 60 + (m ?? 0) <= nowMin;
    return { time: s.time, start, end: addMinutes(date, s.time, SLOT_MINUTES), capacity, reserved, free, closed, available: !past && !closed && free > 0 };
  }).sort((a, b) => a.time.localeCompare(b.time));
}
function priceEstimate(date, people) {
  return date < PAID_FROM ? 0 : PRICE_PER_PERSON * Math.max(1, people);
}
var CANCEL_MARGIN_MS = 6 * 3600000;
function canCancel(r, at = nowMs()) {
  if (!(r.status === "confirmed" || r.status === "pending"))
    return { ok: false, reason: `estado ${r.status || "desconocido"}` };
  const start = Date.parse(`${r.startTime}-05:00`);
  if (!Number.isFinite(start))
    return { ok: false, reason: "hora de inicio ilegible" };
  if (start - at <= CANCEL_MARGIN_MS)
    return { ok: false, reason: "faltan menos de 6 h para la hora reservada" };
  return { ok: true };
}
var SPA_CLASSES_DISABLED_AFTER = "2026-07-29";
function spaGateClosed(today) {
  return today > SPA_CLASSES_DISABLED_AFTER;
}

// src/commands/cefe.ts
var WEB = "https://cefechapinero.com";
var cop = (n) => n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
var hhmm = (iso) => iso.slice(11, 16);
var fold = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
var DAY_ES = { monday: "lun", tuesday: "mar", wednesday: "mié", thursday: "jue", friday: "vie", saturday: "sáb", sunday: "dom" };
var dayEs = (d) => DAY_ES[d.toLowerCase()] ?? d.slice(0, 3);
function assertWritable() {
  const k = getKillswitchState(appHome());
  if (k.active)
    fail("safety/killswitch", `Killswitch activo${k.reason ? ` (${k.reason})` : ""}: escrituras bloqueadas.`, "Desactívalo con `cupo killswitch off`.");
}
function audit(ctx, kind, command, tier, meta) {
  return beginAudit(paths.audit(), { kind, command, tier, profile: profileName(ctx.flags.profile), meta });
}
function parseTime(raw) {
  if (!raw)
    fail("usage/missing-flag", "Falta --time.", "Ej: --time 07:15 (las horas son las que publica la piscina).");
  const m = /^(\d{1,2}):(\d{2})$/.exec(raw.trim());
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59)
    fail("usage/bad-hour", `Hora inválida: ${raw}.`, "Usa HH:MM, ej. 07:15.");
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}
async function resolvePool(raw) {
  const pools = await listPools();
  const byId = pools.find((p) => p.poolId === raw);
  if (byId)
    return byId;
  const hits = pools.filter((p) => fold(p.name).includes(fold(raw)));
  if (hits.length === 1)
    return hits[0];
  if (hits.length > 1)
    fail("usage/ambiguous", `Varias piscinas coinciden con "${raw}": ${hits.map((h) => h.name).join(", ")}.`, "Usa el poolId.");
  return fail("not-found/resource", `No encontré la piscina "${raw}".`, `Opciones: ${pools.map((p) => `${p.name} (${p.poolId})`).join(" · ")}`);
}
async function cefeLogin(ctx) {
  const email = str(ctx.args, "email") ?? knownEmail(ctx.flags.profile);
  if (!email)
    fail("usage/missing-flag", "Falta tu correo.", "Usa --email <correo> (se recuerda para la próxima).");
  const save = ctx.args.save === true;
  if (save && secretBackend() === "none")
    fail("usage/bad-flag", "CUPO_SECRETS=none: guardar la contraseña está deshabilitado.", "Quita CUPO_SECRETS o ponlo en keychain|file.");
  const password = await resolvePassword({ stdin: Boolean(ctx.args.passwordStdin), noInput: ctx.flags.noInput, email });
  const s = await login2(ctx.flags.profile, email, password, { save });
  const missing = profileGaps(s.user);
  return {
    data: { email, expiresAt: s.expiresAt, passwordSaved: save ? s.savedTo ?? null : null, user: { ...s.user, raw: undefined }, missingForBooking: missing },
    human: () => `${ok("✓")} Sesión CEFE Chapinero iniciada como ${bold(email)} (${s.user.name})
  ${muted(`Créditos: ${s.user.credits} · Reservas disponibles: ${s.user.reservasDisponibles} · Dependientes: ${s.user.dependents.length}`)}${missing.length ? `
  ${warn("!")} Para reservar falta en tu perfil: ${missing.join(", ")} (cefechapinero.com/client/profile)` : ""}`,
    nextSteps: [{ command: "cupo cefe find --date mañana", description: "cupos libres en las piscinas" }]
  };
}
function profileGaps(u) {
  const m = [];
  if (!u.phone)
    m.push("teléfono");
  if (!u.estrato)
    m.push("estrato");
  if (!u.dateOfBirth)
    m.push("fecha de nacimiento");
  return m;
}
async function cefeStatus(ctx) {
  const s = currentSession(ctx.flags.profile);
  if (!s)
    return { data: { loggedIn: false, email: storedEmail(ctx.flags.profile) ?? null }, human: () => `${warn("○")} Sin sesión CEFE. Corre ${bold("cupo cefe auth login --email <correo>")}`, nextSteps: [{ command: "cupo cefe auth login --email <correo>", description: "iniciar sesión" }] };
  let user = null;
  let liveCheck = "ok";
  try {
    user = await getUser(s.token, s.user.userId);
    persistSession(ctx.flags.profile, s.email, s.token, user);
  } catch (e) {
    liveCheck = e instanceof Error ? e.message : String(e);
  }
  return {
    data: { loggedIn: user !== null, email: s.email, expiresAt: s.expiresAt, passwordStored: passwordLocation(s.email), liveCheck, user: user ? { ...user, raw: undefined } : null },
    human: () => user ? `${ok("●")} Sesión CEFE activa: ${bold(s.email)} (${user.name})
  ${muted(`Vence: ${s.expiresAt} · créditos ${user.credits} · reservas disponibles ${user.reservasDisponibles}`)}` : `${danger("●")} Sesión guardada pero no válida: ${liveCheck}`
  };
}
async function cefeLogout(ctx) {
  const email = currentSession(ctx.flags.profile)?.email ?? knownEmail(ctx.flags.profile);
  logoutLocal(ctx.flags.profile);
  const forgotten = ctx.args.forget === true && email ? forgetPassword(email) : null;
  const forgot = Boolean(forgotten && (forgotten.file || forgotten.keychain));
  return { data: { loggedOut: true, passwordForgotten: forgot }, human: () => `${ok("✓")} Sesión CEFE cerrada (token local borrado; el servidor no tiene logout).${forgot ? " Contraseña guardada eliminada." : ""}` };
}
async function cefeRegister(ctx) {
  const body = {
    name: requireStr(ctx.args, "name"),
    email: requireStr(ctx.args, "email"),
    password: await resolvePassword({ stdin: Boolean(ctx.args.passwordStdin), noInput: ctx.flags.noInput }),
    phone: requireStr(ctx.args, "phone"),
    identification: requireStr(ctx.args, "document"),
    documentType: str(ctx.args, "documentType") ?? "CC",
    role: "client",
    aceptaHabeasData: true
  };
  if (ctx.args.acceptHabeasData !== true)
    fail("approval/consent-required", "El registro exige aceptar el tratamiento de datos personales.", "Lee la política en cefechapinero.com/register y agrega --accept-habeas-data si estás de acuerdo.");
  assertWritable();
  const a = audit(ctx, "cefe.register", "cefe auth register", "T2", { email: body.email });
  try {
    const { token, user } = await register(body);
    persistSession(ctx.flags.profile, body.email, token, user);
    a.complete({ userId: user.userId });
    return { data: { email: body.email, user: { ...user, raw: undefined } }, human: () => `${ok("✓")} Cuenta creada e iniciada: ${bold(body.email)}`, nextSteps: [{ command: "cupo cefe me", description: "ver el perfil (completa teléfono, estrato y fecha de nacimiento en la web)" }] };
  } catch (e) {
    a.fail({ error: e instanceof AppError ? e.code : String(e) });
    throw e;
  }
}
async function cefeMe(ctx) {
  const s = await requireSession(ctx.flags.profile);
  const u = await getUser(s.token, s.user.userId);
  persistSession(ctx.flags.profile, s.email, s.token, u);
  const missing = profileGaps(u);
  return {
    data: { ...u, raw: undefined, missingForBooking: missing },
    human: () => [
      bold(`${u.name} · ${u.email}`),
      `${muted("Documento")}  ${u.documentType ?? ""} ${u.identification ?? "—"} · ${muted("Tel")} ${u.phone ?? "—"} · ${muted("Estrato")} ${u.estrato ?? "—"} · ${muted("Nacimiento")} ${u.dateOfBirth ?? "—"}`,
      `${muted("Créditos")}   ${u.credits} · ${muted("Reservas disponibles")} ${u.reservasDisponibles}`,
      u.dependents.length ? `${muted("Dependientes")} ${u.dependents.map((d, i) => `${i + 1}. ${d.name} (${d.documentType} ${d.identification})`).join(" · ")}` : muted("Sin dependientes registrados"),
      missing.length ? warn(`! Para reservar falta: ${missing.join(", ")}. Se completa en ${WEB}/client/profile`) : ""
    ].filter(Boolean).join(`
`)
  };
}
async function cefePoolList(ctx) {
  let pools = await listPools();
  if (!ctx.args.all)
    pools = pools.filter((p) => p.active);
  return {
    data: pools,
    human: () => table(["poolId", "Piscina", "Cap.", "Horario hoy"], pools.map((p) => {
      const today = p.hours.find((h) => fold(h.day) === fold(todayName()));
      return [strong(p.poolId), `${p.name}${p.active ? "" : muted(" (inactiva)")}`, String(p.capacity), today ? `${today.open}–${today.close}` : muted("—")];
    }), [38, 30, 5, 14]),
    nextSteps: pools[0] ? [{ command: `cupo cefe slot list ${pools[0].poolId} --date mañana`, description: "cupos por hora" }, { command: "cupo cefe find --date sab", description: "buscar en todas" }] : []
  };
}
function todayName() {
  return ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"][new Date(`${bogotaNow().date}T12:00:00Z`).getUTCDay()];
}
async function cefePoolGet(ctx) {
  const pool = await resolvePool(positional(ctx.args, 0, "pool"));
  const [cfg, rating] = await Promise.all([getScheduleConfig(pool.poolId), poolRatingSummary(pool.poolId).catch(() => null)]);
  const data = { ...pool, schedule: cfg, rating };
  return {
    data,
    human: () => [
      bold(`${pool.name}`) + muted(` · ${pool.poolId}`),
      pool.description ? `${muted("Qué es")}     ${pool.description}` : "",
      `${muted("Capacidad")}  ${pool.capacity} personas por franja · ${muted("Franjas de")} ${SLOT_MINUTES} min`,
      `${muted("Horario")}    ${pool.hours.map((h) => `${h.day.slice(0, 3)} ${h.open}–${h.close}`).join(" · ")}`,
      cfg.default ? `${muted("Franjas")}    ${cfg.default.slots.map((s) => s.time).sort().join(" ")}${Object.values(cfg.weekly ?? {}).some((d) => d.isClosed) ? dim(`  (cerrada: ${Object.entries(cfg.weekly ?? {}).filter(([, d]) => d.isClosed).map(([k]) => k.toLowerCase()).join(", ")})`) : ""}` : "",
      rating && rating.overallAverage !== undefined ? `${muted("Opiniones")}  ${String(rating.overallAverage)}/5 (${String(rating.totalRatings)} calificaciones) · NPS ${String(rating.npsScore)}` : ""
    ].filter(Boolean).join(`
`),
    nextSteps: [{ command: `cupo cefe slot list ${pool.poolId} --date mañana`, description: "cupos por hora" }]
  };
}
async function slotsFor(pool, date) {
  const [cfg, occ] = await Promise.all([getScheduleConfig(pool.poolId), getPoolSlots(pool.poolId, date)]);
  return daySlots(cfg, date, occ, bogotaNow());
}
function renderSlots(slots) {
  if (!slots.length)
    return dim("  Cerrada ese día.");
  return slots.map((s) => `  ${s.available ? ok("●") : muted("○")} ${s.time}–${hhmm(s.end)}  ${s.closed ? muted("cerrada") : s.available ? ok(`${s.free} cupos`) : muted(s.free === 0 ? "llena" : "pasó")}${s.reserved ? muted(`  (${s.reserved}/${s.capacity})`) : ""}`).join(`
`);
}
async function cefeSlotList(ctx) {
  const pool = await resolvePool(positional(ctx.args, 0, "pool"));
  const date = parseDate(str(ctx.args, "date"));
  let slots = await slotsFor(pool, date);
  const all = slots;
  if (ctx.args.free)
    slots = slots.filter((s) => s.available);
  const first = all.find((s) => s.available);
  return {
    data: { poolId: pool.poolId, pool: pool.name, date, slots, priceEstimate: priceEstimate(date, 1) },
    human: () => `${bold(`${pool.name} · ${date}`)}${priceEstimate(date, 1) ? muted(`  · ${cop(priceEstimate(date, 1))} por persona`) : muted("  · gratis")}
${renderSlots(slots)}`,
    nextSteps: first ? [{ command: `cupo cefe booking create ${pool.poolId} --date ${date} --time ${first.time}`, description: "vista previa de la reserva (no reserva nada)" }] : [{ command: `cupo cefe find --date ${addDays(date, 1)}`, description: "probar otro día" }]
  };
}
async function cefeSlotFind(ctx) {
  const date = parseDate(str(ctx.args, "date") ?? addDays(bogotaNow().date, 1));
  const from = str(ctx.args, "from") ? parseTime(str(ctx.args, "from")) : "00:00";
  const to = str(ctx.args, "to") ? parseTime(str(ctx.args, "to")) : "24:00";
  const pools = (await listPools()).filter((p) => p.active);
  const results = [];
  const failed = [];
  await Promise.all(pools.map(async (pool) => {
    try {
      const free = (await slotsFor(pool, date)).filter((s) => s.available && s.time >= from && s.time < to);
      if (free.length)
        results.push({ pool, slots: free });
    } catch (e) {
      failed.push({ poolId: pool.poolId, error: e instanceof Error ? e.message : String(e) });
    }
  }));
  results.sort((a, b) => a.pool.name.localeCompare(b.pool.name));
  const best = results[0]?.slots[0];
  return {
    data: { date, window: { from, to }, results: results.map((r) => ({ pool: r.pool, slots: r.slots })), scanned: pools.length, failed, priceEstimate: priceEstimate(date, 1) },
    human: () => {
      const head = bold(`CEFE Chapinero · ${date} · ${from === "00:00" && to === "24:00" ? "todo el día" : `${from}–${to}`} · ${pools.length} piscinas`);
      if (!results.length)
        return `${head}

  Sin cupos libres en esa franja.${failed.length ? dim(`
  (${failed.length} no respondieron)`) : ""}`;
      return `${head}

${table(["Piscina", "Cupos libres (hora: cupos)"], results.map((r) => [r.pool.name, r.slots.map((s) => `${s.time} ${ok(String(s.free))}`).join("  ")]), [30, 80])}${failed.length ? dim(`

${failed.length} no respondieron.`) : ""}`;
    },
    nextSteps: best ? [{ command: `cupo cefe booking create ${results[0].pool.poolId} --date ${date} --time ${best.time}`, description: "vista previa de la reserva (no reserva nada)" }] : [{ command: `cupo cefe find --date ${addDays(date, 1)}`, description: "probar otro día" }]
  };
}
function parsePay(raw, price) {
  if (price === 0)
    return "FREE";
  const v = (raw ?? "efectivo").toLowerCase();
  if (["efectivo", "cash", "presencial"].includes(v))
    return "EFECTIVO";
  if (["wompi", "online", "pse", "tarjeta"].includes(v))
    return "WOMPI";
  if (["creditos", "créditos", "credits"].includes(v))
    return "CREDITOS";
  return fail("usage/bad-arg", `Método de pago desconocido: ${raw}.`, "Opciones: efectivo (en la sede), wompi (en la web), creditos.");
}
async function cefeBookingCreate(ctx) {
  const s = await requireSession(ctx.flags.profile);
  const pool = await resolvePool(positional(ctx.args, 0, "pool"));
  const date = parseDate(requireStr(ctx.args, "date"));
  const time = parseTime(str(ctx.args, "time") ?? str(ctx.args, "hour"));
  const live = ctx.args.yes === true && !ctx.flags.dryRun;
  const [user, slots, sameDay] = await Promise.all([getUser(s.token, s.user.userId), slotsFor(pool, date), userReservationsByDate(s.token, s.user.userId, date).catch(() => [])]);
  persistSession(ctx.flags.profile, s.email, s.token, user);
  const picks = (str(ctx.args, "dependent") ?? "").split(",").map((x) => x.trim()).filter(Boolean).map(Number);
  const dependents = picks.map((n) => user.dependents[n - 1]).filter((d) => Boolean(d));
  if (dependents.length !== picks.length)
    fail("usage/bad-arg", `--dependent fuera de rango: tu perfil tiene ${user.dependents.length} dependiente(s).`, "Mira `cupo cefe me`.");
  const people = 1 + dependents.length;
  const price = priceEstimate(date, people);
  const pay = parsePay(str(ctx.args, "pay"), price);
  const slot = slots.find((x) => x.time === time);
  const blocking = sameDay.filter((r) => ["confirmed", "pending", "not_attended"].includes(r.status));
  const gaps = profileGaps(user);
  const checks = [];
  const k = getKillswitchState(appHome());
  checks.push({ name: "killswitch", ok: !k.active, detail: k.active ? `activo: ${k.reason}` : "apagado" });
  checks.push({ name: "franja", ok: Boolean(slot), detail: slot ? `${slot.time}–${hhmm(slot.end)} publicada` : `la piscina no publica ${time} ese día (${slots.map((x) => x.time).join(" ") || "cerrada"})` });
  checks.push({ name: "cupos", ok: Boolean(slot?.available) && (slot?.free ?? 0) >= people, detail: slot ? slot.closed ? "franja cerrada" : slot.available ? `${slot.free} libres de ${slot.capacity} (necesitas ${people})` : slot.free === 0 ? "llena" : "ya pasó" : "—" });
  checks.push({ name: "una-por-dia", ok: blocking.length === 0, detail: blocking.length ? `ya tienes una reserva ${blocking[0].status} ese día a las ${hhmm(blocking[0].startTime)}` : "sin otra reserva ese día" });
  checks.push({ name: "perfil", ok: gaps.length === 0, detail: gaps.length ? `falta ${gaps.join(", ")} (${WEB}/client/profile)` : "completo" });
  if (pay === "CREDITOS")
    checks.push({ name: "creditos", ok: user.credits * 100 >= price, detail: `tienes ${user.credits}, necesitas ${price / 100}` });
  const ready = checks.every((c) => c.ok);
  const startTime = slot?.start ?? `${date}T${time}:00`;
  const endTime = slot?.end ?? `${date}T${time}:00`;
  const body = {
    poolId: pool.poolId,
    poolName: pool.name,
    poolImage: "",
    userId: user.userId,
    email: user.email,
    startTime,
    endTime,
    status: pay === "CREDITOS" || pay === "FREE" ? "confirmed" : "pending",
    notes: [str(ctx.args, "notes"), dependents.length ? `Menores: ${dependents.map((d) => `${d.name} (${d.documentType} ${d.identification})`).join(", ")}` : ""].filter(Boolean).join(" | "),
    price,
    ...pay === "FREE" ? {} : { paymentMethod: pay },
    ...dependents.length ? { dependents } : {}
  };
  const where = `${pool.name} · ${date} ${time}–${hhmm(endTime)} · ${people} persona${people > 1 ? "s" : ""}`;
  const payLabel = pay === "FREE" ? "gratis" : pay === "EFECTIVO" ? `${cop(price)}, se paga en la sede` : pay === "WOMPI" ? `${cop(price)}, se paga en la web (Wompi)` : `${cop(price)} con créditos`;
  const argv = `${pool.poolId} --date ${date} --time ${time}${picks.length ? ` --dependent ${picks.join(",")}` : ""}${str(ctx.args, "pay") ? ` --pay ${str(ctx.args, "pay")}` : ""}`;
  if (!live) {
    audit(ctx, "cefe.booking.create", "cefe booking create", "T2", { poolId: pool.poolId, date, time, people, pay, ready }).dryRun();
    return {
      data: { dryRun: true, ready, where, pay, price, request: { method: "POST", url: "/reservations", body }, checks, note: "La reserva se puede cancelar hasta 6 h antes con `cupo cefe booking cancel`." },
      human: () => [bold("Vista previa — no se reservó nada"), `${muted("Qué")}   ${where}`, `${muted("Pago")}  ${payLabel}`, "", ...checks.map((c) => `${c.ok ? ok("✓") : danger("✗")} ${c.name.padEnd(13)} ${muted(c.detail)}`), "", ready ? `${dim("Para reservar de verdad:")}
  cupo cefe booking create ${argv} --yes` : danger("No se puede reservar mientras haya checks en rojo.")].join(`
`),
      nextSteps: ready ? [{ command: `cupo cefe booking create ${argv} --yes`, description: "RESERVA REAL (cancelable hasta 6 h antes)" }] : checks.find((c) => c.name === "cupos" && !c.ok) ? [{ command: `cupo cefe slot list ${pool.poolId} --date ${date} --free`, description: "ver franjas con cupo" }] : []
    };
  }
  assertWritable();
  const failed = checks.find((c) => !c.ok);
  if (failed)
    fail(failed.name === "cupos" || failed.name === "franja" ? "slot/unavailable" : failed.name === "una-por-dia" ? "rule/violation" : "safety/precheck", `No reservo: ${failed.name} — ${failed.detail}`);
  await approveGate({ cliName: "cupo", flags: { json: ctx.flags.json, noInput: ctx.flags.noInput } }, { title: "Reserva CEFE Chapinero", summary: `${where} · ${payLabel}` }, { trust: "T2", yes: true });
  const a = audit(ctx, "cefe.booking.create", "cefe booking create", "T2", { poolId: pool.poolId, date, time, people, pay, price });
  try {
    const raw = await createReservation(s.token, body);
    const res = normalizeReservation({ ...body, ...raw });
    a.complete({ reservationId: res.id, status: res.status });
    return {
      data: { reservation: { ...res, raw: undefined }, pay, price, payUrl: pay === "WOMPI" ? `${WEB}/client/reservations` : null },
      human: () => [
        `${ok("✓")} Reserva creada: ${bold(res.id || "(id en la web)")} · ${where}`,
        pay === "EFECTIVO" ? `  Pendiente: paga ${cop(price)} en la sede antes de entrar.` : pay === "WOMPI" ? `  Pendiente de pago: completa el pago con Wompi en ${WEB}/client/reservations` : `  ${ok("Confirmada.")}`,
        dim("  Se puede cancelar hasta 6 h antes: cupo cefe booking cancel " + (res.id || "<id>") + " --yes")
      ].join(`
`),
      nextSteps: [{ command: "cupo cefe booking list", description: "ver tus reservas" }]
    };
  } catch (e) {
    a.fail({ error: e instanceof AppError ? e.code : String(e) });
    throw e;
  }
}
async function cefeBookingList(ctx) {
  const s = await requireSession(ctx.flags.profile);
  const from = str(ctx.args, "from") ? parseDate(str(ctx.args, "from")) : undefined;
  const to = str(ctx.args, "to") ? parseDate(str(ctx.args, "to")) : undefined;
  const date = str(ctx.args, "date") ? parseDate(str(ctx.args, "date")) : undefined;
  let list = date ? await userReservationsByDate(s.token, s.user.userId, date) : from || to ? await userReservationsRange(s.token, s.user.userId, from ?? "2020-01-01", to ?? addDays(bogotaNow().date, 365), str(ctx.args, "status")) : await userReservations(s.token, s.user.userId);
  if (str(ctx.args, "status"))
    list = list.filter((r) => r.status === str(ctx.args, "status"));
  if (ctx.args.upcoming)
    list = list.filter((r) => r.startTime >= `${bogotaNow().date}T00:00:00` && r.status !== "cancelled");
  list.sort((a, b) => b.startTime.localeCompare(a.startTime));
  return {
    data: list.map((r) => ({ ...r, raw: undefined, cancellable: canCancel(r).ok })),
    human: () => list.length === 0 ? "Sin reservas." : table(["id", "Piscina", "Cuándo", "Estado", "Pago", "Valor"], list.map((r) => [strong(r.id), r.poolName, `${r.startTime.slice(0, 10)} ${hhmm(r.startTime)}–${hhmm(r.endTime)}`, r.status === "confirmed" ? ok(r.status) : r.status === "cancelled" ? muted(r.status) : warn(r.status), `${r.paymentMethod ?? "—"}${r.paymentStatus ? ` (${r.paymentStatus})` : ""}`, r.price ? cop(r.price) : muted("gratis")]), [44, 24, 24, 11, 18, 10]),
    nextSteps: list.find((r) => canCancel(r).ok) ? [{ command: `cupo cefe booking cancel ${list.find((r) => canCancel(r).ok).id} --yes`, description: "cancelar una reserva (hasta 6 h antes)" }] : []
  };
}
async function cefeBookingCancel(ctx) {
  const s = await requireSession(ctx.flags.profile);
  const id = positional(ctx.args, 0, "reservationId");
  const list = await userReservations(s.token, s.user.userId);
  const r = list.find((x) => x.id === id);
  if (!r)
    fail("not-found/booking", `No encontré la reserva ${id} en tu cuenta.`, "Mira `cupo cefe booking list`.");
  const can = canCancel(r);
  if (!can.ok)
    fail("rule/violation", `No se puede cancelar: ${can.reason}.`, "El portal permite cancelar hasta 6 h antes de la hora reservada.");
  assertWritable();
  await approveGate({ cliName: "cupo", flags: { json: ctx.flags.json, noInput: ctx.flags.noInput } }, { title: "Cancelar reserva", summary: `${r.poolName} · ${r.startTime}` }, { trust: "T2", yes: ctx.args.yes === true });
  const a = audit(ctx, "cefe.booking.cancel", "cefe booking cancel", "T2", { reservationId: id });
  try {
    await cancelReservation(s.token, id);
    a.complete({});
  } catch (e) {
    a.fail({ error: e instanceof AppError ? e.code : String(e) });
    throw e;
  }
  return { data: { reservationId: id, cancelled: true }, human: () => `${ok("✓")} Reserva ${id} cancelada.` };
}
async function cefeCourseList(ctx) {
  let courses = await listCourses();
  const text = str(ctx.args, "text");
  if (text)
    courses = courses.filter((c) => fold(`${c.name} ${c.group} ${c.description}`).includes(fold(text)));
  if (!ctx.args.all)
    courses = courses.filter((c) => c.status === "ACTIVE");
  if (ctx.args.available)
    courses = courses.filter((c) => !c.full);
  courses.sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name));
  return {
    data: courses,
    human: () => courses.length === 0 ? "Sin cursos con esos filtros." : table(["courseId", "Curso", "Horario", "Precio (estrato 1-3 / 4-6)", "Cupo"], courses.map((c) => [strong(c.courseId.slice(0, 8)), c.name, c.schedule.map((x) => `${dayEs(x.day)} ${x.start}`).join(" · "), `${cop(c.priceEstrato1_3)} / ${cop(c.priceEstrato4_6)}`, c.full ? muted("lleno") : ok("hay")]), [10, 38, 34, 30, 6]) + dim(`

El courseId completo está en --json; los comandos aceptan el prefijo de 8 caracteres.`),
    nextSteps: courses[0] ? [{ command: `cupo cefe course get ${courses[0].courseId.slice(0, 8)}`, description: "detalle y clases disponibles" }] : []
  };
}
async function resolveCourse(raw) {
  const courses = await listCourses();
  const hits = courses.filter((c) => c.courseId === raw || c.courseId.startsWith(raw) || fold(c.name) === fold(raw));
  if (hits.length === 1)
    return hits[0];
  if (hits.length > 1)
    fail("usage/ambiguous", `Varios cursos coinciden con "${raw}".`, "Usa más caracteres del courseId.");
  return fail("not-found/resource", `No encontré el curso "${raw}".`, "Mira `cupo cefe course list`.");
}
async function cefeCourseGet(ctx) {
  const c = await resolveCourse(positional(ctx.args, 0, "course"));
  const from = parseDate(str(ctx.args, "from") ?? bogotaNow().date);
  const to = parseDate(str(ctx.args, "to") ?? addDays(from, 13));
  const av = await courseAvailability(c.courseId, from, to).catch(() => null);
  const classes = av?.dates.flatMap((d) => d.classes) ?? [];
  return {
    data: { ...c, availability: av },
    human: () => [
      bold(c.name) + muted(` · ${c.group} · ${c.courseId}`),
      `${muted("Horario")}   ${c.schedule.map((x) => `${dayEs(x.day)} ${x.start}–${x.end}`).join(" · ")} · ${c.durationMin} min · ${c.classes} clases`,
      `${muted("Precio")}    estrato 1-3 ${cop(c.priceEstrato1_3)} · estrato 4-6 ${cop(c.priceEstrato4_6)} · ${c.full ? danger("lleno") : ok("con cupo")} (máx. ${c.maxEnrollments})`,
      c.instructor && c.instructor !== "No Aplica" ? `${muted("Instructor")} ${c.instructor}` : "",
      classes.length ? `
${dim(`Clases ${from} → ${to}:`)}
${classes.map((k) => `  ${k.available ? ok("●") : muted("○")} ${k.at.slice(0, 16).replace("T", " ")}  ${k.free}/${k.capacity} cupos`).join(`
`)}` : dim(`
Sin clases publicadas entre ${from} y ${to}.`),
      "",
      dim(c.description.slice(0, 300))
    ].filter(Boolean).join(`
`),
    nextSteps: [{ command: `cupo cefe course enroll ${c.courseId.slice(0, 8)}`, description: "vista previa de la inscripción" }]
  };
}
async function cefeCourseMine(ctx) {
  const s = await requireSession(ctx.flags.profile);
  const [mine, classes] = await Promise.all([userCourses(s.token, s.user.userId), classBookings(s.token, s.user.userId).catch(() => [])]);
  return {
    data: { enrollments: mine, classes },
    human: () => [
      bold(`Inscripciones: ${mine.length}`),
      ...mine.map((e) => `  • ${String(e.courseName ?? e.course?.name ?? e.courseId)}  ${String(e.status ?? "")}  ${e.paymentType ? muted(`${String(e.paymentType)} ${String(e.paymentStatus ?? "")}`) : ""}`),
      "",
      bold(`Clases reservadas: ${classes.length}`),
      ...classes.map((k) => `  • ${String(k.classDateTime ?? "").slice(0, 16).replace("T", " ")}  ${String(k.course?.name ?? k.courseId ?? "")}  ${String(k.status ?? "")}`)
    ].join(`
`)
  };
}
function gateCheck() {
  const closed = spaGateClosed(bogotaNow().date);
  return { name: "portal", ok: !closed, detail: closed ? "la web del CEFE tiene deshabilitadas inscripciones y clases desde el 30 de julio de 2026; el servidor puede rechazarlo" : "habilitado" };
}
async function cefeCourseEnroll(ctx) {
  const s = await requireSession(ctx.flags.profile);
  const c = await resolveCourse(positional(ctx.args, 0, "course"));
  const user = await getUser(s.token, s.user.userId);
  const live = ctx.args.yes === true && !ctx.flags.dryRun;
  const estrato = Number(user.estrato ?? 0);
  const price = estrato >= 4 ? c.priceEstrato4_6 : c.priceEstrato1_3;
  const payRaw = (str(ctx.args, "pay") ?? "efectivo").toLowerCase();
  const pay = ["wompi", "online", "pse", "tarjeta"].includes(payRaw) ? "WOMPI" : "CASH";
  const mine = await userCourses(s.token, s.user.userId).catch(() => []);
  const already = mine.filter((e) => String(e.courseId) === c.courseId && !["CANCELLED"].includes(String(e.status)));
  const k = getKillswitchState(appHome());
  const checks = [
    { name: "killswitch", ok: !k.active, detail: k.active ? `activo: ${k.reason}` : "apagado" },
    { name: "curso", ok: c.status === "ACTIVE" && !c.full, detail: c.full ? "lleno" : c.status === "ACTIVE" ? "activo con cupo" : `estado ${c.status}` },
    { name: "estrato", ok: Boolean(user.estrato), detail: user.estrato ? `estrato ${user.estrato} → ${cop(price)}` : `sin estrato en el perfil (${WEB}/client/profile)` },
    { name: "repetida", ok: already.length < Math.max(1, c.maxPerUser), detail: already.length ? `ya tienes ${already.length} inscripción(es)` : "sin inscripción previa" },
    gateCheck()
  ];
  const ready = checks.every((x) => x.ok);
  const body = { status: "PENDING", paymentType: pay, paymentStatus: "PENDING", coursePrice: price };
  const summary = `${c.name} · ${cop(price)} · ${pay === "CASH" ? "pago en la sede" : "pago Wompi en la web"}`;
  if (!live) {
    audit(ctx, "cefe.course.enroll", "cefe course enroll", "T2", { courseId: c.courseId, pay, price, ready }).dryRun();
    return {
      data: { dryRun: true, ready, summary, request: { method: "POST", url: `/courses/${c.courseId}/users/${user.userId}/enroll`, body }, checks },
      human: () => [bold("Vista previa — no se inscribió a nadie"), `${muted("Qué")}  ${summary}`, "", ...checks.map((x) => `${x.ok ? ok("✓") : danger("✗")} ${x.name.padEnd(11)} ${muted(x.detail)}`), "", ready ? `${dim("Para inscribir de verdad:")}
  cupo cefe course enroll ${c.courseId.slice(0, 8)}${pay === "WOMPI" ? " --pay wompi" : ""} --yes` : danger("No se puede inscribir mientras haya checks en rojo.")].join(`
`),
      nextSteps: ready ? [{ command: `cupo cefe course enroll ${c.courseId.slice(0, 8)}${pay === "WOMPI" ? " --pay wompi" : ""} --yes`, description: "INSCRIPCIÓN REAL (queda pendiente de pago)" }] : []
    };
  }
  assertWritable();
  const failed = checks.find((x) => !x.ok);
  if (failed)
    fail("safety/precheck", `No inscribo: ${failed.name} — ${failed.detail}`);
  await approveGate({ cliName: "cupo", flags: { json: ctx.flags.json, noInput: ctx.flags.noInput } }, { title: "Inscripción a curso", summary }, { trust: "T2", yes: true });
  const a = audit(ctx, "cefe.course.enroll", "cefe course enroll", "T2", { courseId: c.courseId, pay, price });
  try {
    const res = await enroll(s.token, c.courseId, user.userId, body);
    a.complete({});
    return { data: { courseId: c.courseId, price, pay, response: res }, human: () => `${ok("✓")} Inscripción creada: ${summary}.
  ${pay === "CASH" ? "Actívala pagando en la sede." : `Completa el pago en ${WEB}/client/courses`}`, nextSteps: [{ command: "cupo cefe course mine", description: "ver inscripciones" }] };
  } catch (e) {
    a.fail({ error: e instanceof AppError ? e.code : String(e) });
    throw e;
  }
}
async function cefeClassBook(ctx) {
  const s = await requireSession(ctx.flags.profile);
  const c = await resolveCourse(positional(ctx.args, 0, "course"));
  const date = parseDate(requireStr(ctx.args, "date"));
  const live = ctx.args.yes === true && !ctx.flags.dryRun;
  const av = await courseAvailability(c.courseId, date, date);
  const klass = av.dates.flatMap((d) => d.classes).find((x) => x.at.startsWith(date));
  const k = getKillswitchState(appHome());
  const checks = [
    { name: "killswitch", ok: !k.active, detail: k.active ? `activo: ${k.reason}` : "apagado" },
    { name: "clase", ok: Boolean(klass), detail: klass ? `${klass.at.slice(0, 16).replace("T", " ")}` : `el curso no tiene clase el ${date}` },
    { name: "cupo", ok: Boolean(klass?.available), detail: klass ? `${klass.free}/${klass.capacity}` : "—" },
    gateCheck()
  ];
  const ready = checks.every((x) => x.ok);
  const at = klass?.at ?? `${date}T00:00:00`;
  if (!live) {
    audit(ctx, "cefe.class.book", "cefe class book", "T2", { courseId: c.courseId, at, ready }).dryRun();
    return {
      data: { dryRun: true, ready, courseId: c.courseId, classDateTime: at, checks },
      human: () => [bold("Vista previa — no se reservó la clase"), `${muted("Qué")}  ${c.name} · ${at.slice(0, 16).replace("T", " ")}`, "", ...checks.map((x) => `${x.ok ? ok("✓") : danger("✗")} ${x.name.padEnd(11)} ${muted(x.detail)}`), "", ready ? `${dim("Para reservar de verdad:")}
  cupo cefe class book ${c.courseId.slice(0, 8)} --date ${date} --yes` : danger("No se puede reservar mientras haya checks en rojo.")].join(`
`),
      nextSteps: ready ? [{ command: `cupo cefe class book ${c.courseId.slice(0, 8)} --date ${date} --yes`, description: "RESERVA REAL de la clase" }] : []
    };
  }
  assertWritable();
  const failed = checks.find((x) => !x.ok);
  if (failed)
    fail(failed.name === "cupo" || failed.name === "clase" ? "slot/unavailable" : "safety/precheck", `No reservo: ${failed.name} — ${failed.detail}`);
  await approveGate({ cliName: "cupo", flags: { json: ctx.flags.json, noInput: ctx.flags.noInput } }, { title: "Reservar clase", summary: `${c.name} · ${at}` }, { trust: "T2", yes: true });
  const a = audit(ctx, "cefe.class.book", "cefe class book", "T2", { courseId: c.courseId, at });
  try {
    const res = await bookClass(s.token, s.user.userId, c.courseId, at);
    a.complete({});
    return { data: { courseId: c.courseId, classDateTime: at, response: res }, human: () => `${ok("✓")} Clase reservada: ${c.name} · ${at.slice(0, 16).replace("T", " ")}`, nextSteps: [{ command: "cupo cefe course mine", description: "ver clases reservadas" }] };
  } catch (e) {
    a.fail({ error: e instanceof AppError ? e.code : String(e) });
    throw e;
  }
}
async function cefeClassCancel(ctx) {
  const s = await requireSession(ctx.flags.profile);
  const c = await resolveCourse(positional(ctx.args, 0, "course"));
  const date = parseDate(requireStr(ctx.args, "date"));
  const mine = await classBookings(s.token, s.user.userId, { courseId: c.courseId });
  const booking = mine.find((b) => String(b.classDateTime ?? "").startsWith(date));
  if (!booking)
    fail("not-found/booking", `No tienes clase de ${c.name} el ${date}.`, "Mira `cupo cefe course mine`.");
  if (Date.parse(`${String(booking.classDateTime)}-05:00`) <= nowMs())
    fail("rule/violation", "La clase ya pasó.");
  assertWritable();
  await approveGate({ cliName: "cupo", flags: { json: ctx.flags.json, noInput: ctx.flags.noInput } }, { title: "Cancelar clase", summary: `${c.name} · ${String(booking.classDateTime)}` }, { trust: "T2", yes: ctx.args.yes === true });
  const a = audit(ctx, "cefe.class.cancel", "cefe class cancel", "T2", { courseId: c.courseId, at: booking.classDateTime });
  try {
    await cancelClass(s.token, s.user.userId, c.courseId, String(booking.classDateTime));
    a.complete({});
  } catch (e) {
    a.fail({ error: e instanceof AppError ? e.code : String(e) });
    throw e;
  }
  return { data: { courseId: c.courseId, classDateTime: booking.classDateTime, cancelled: true }, human: () => `${ok("✓")} Clase cancelada.` };
}
async function cefeTournamentList(ctx) {
  const s = await requireSession(ctx.flags.profile);
  const list = await listTournaments(s.token, str(ctx.args, "status"));
  return {
    data: list,
    human: () => list.length === 0 ? "Sin torneos publicados." : list.map((t) => `  ${strong(String(t.tournamentId ?? t.id))}  ${String(t.name ?? "")}  ${muted(String(t.status ?? ""))}${t.registrationCloseAt ? muted(`  inscripciones hasta ${String(t.registrationCloseAt).slice(0, 10)}`) : ""}`).join(`
`),
    nextSteps: list[0] ? [{ command: `cupo cefe tournament get ${String(list[0].tournamentId ?? list[0].id)}`, description: "competiciones del torneo" }] : []
  };
}
async function cefeTournamentGet(ctx) {
  const s = await requireSession(ctx.flags.profile);
  const id = positional(ctx.args, 0, "tournamentId");
  const [t, comps] = await Promise.all([getTournament(s.token, id), competitions(s.token, id)]);
  return {
    data: { ...t, competitions: comps },
    human: () => [bold(String(t.name ?? id)) + muted(`  ${String(t.status ?? "")}`), ...comps.map((c) => `  ${strong(String(c.competitionId ?? c.id))}  ${String(c.name ?? "")}  ${muted([c.category, c.sex, c.distance].filter(Boolean).map(String).join(" · "))}`)].join(`
`),
    nextSteps: comps[0] ? [{ command: `cupo cefe tournament register ${id} --competition ${String(comps[0].competitionId ?? comps[0].id)} --yes`, description: "inscribirse en una competición" }] : []
  };
}
async function cefeTournamentMine(ctx) {
  const s = await requireSession(ctx.flags.profile);
  const list = await myRegistrations(s.token);
  return { data: list, human: () => list.length === 0 ? "Sin inscripciones a torneos." : list.map((r) => `  • ${JSON.stringify(r).slice(0, 160)}`).join(`
`) };
}
async function cefeTournamentRegister(ctx) {
  const s = await requireSession(ctx.flags.profile);
  const id = positional(ctx.args, 0, "tournamentId");
  const comp = requireStr(ctx.args, "competition");
  const body = { ...str(ctx.args, "dependent") ? { dependentIdentification: str(ctx.args, "dependent") } : {}, ...str(ctx.args, "sex") ? { sex: str(ctx.args, "sex") } : {}, ...str(ctx.args, "observation") ? { observation: str(ctx.args, "observation") } : {} };
  assertWritable();
  await approveGate({ cliName: "cupo", flags: { json: ctx.flags.json, noInput: ctx.flags.noInput } }, { title: "Inscripción a torneo", summary: `torneo ${id} · competición ${comp}` }, { trust: "T2", yes: ctx.args.yes === true });
  const a = audit(ctx, "cefe.tournament.register", "cefe tournament register", "T2", { tournamentId: id, competitionId: comp, dependent: body.dependentIdentification ?? null });
  try {
    const res = await registerCompetition(s.token, id, comp, body);
    a.complete({});
    return { data: { tournamentId: id, competitionId: comp, response: res }, human: () => `${ok("✓")} Inscripción registrada en la competición ${comp}.`, nextSteps: [{ command: "cupo cefe tournament mine", description: "ver inscripciones" }] };
  } catch (e) {
    a.fail({ error: e instanceof AppError ? e.code : String(e) });
    throw e;
  }
}
async function cefeTournamentUnregister(ctx) {
  const s = await requireSession(ctx.flags.profile);
  const id = positional(ctx.args, 0, "tournamentId");
  const comp = requireStr(ctx.args, "competition");
  assertWritable();
  await approveGate({ cliName: "cupo", flags: { json: ctx.flags.json, noInput: ctx.flags.noInput } }, { title: "Cancelar inscripción a torneo", summary: `torneo ${id} · competición ${comp}` }, { trust: "T2", yes: ctx.args.yes === true });
  const a = audit(ctx, "cefe.tournament.unregister", "cefe tournament unregister", "T2", { tournamentId: id, competitionId: comp });
  try {
    await unregisterCompetition(s.token, id, comp, str(ctx.args, "dependent"));
    a.complete({});
  } catch (e) {
    a.fail({ error: e instanceof AppError ? e.code : String(e) });
    throw e;
  }
  return { data: { tournamentId: id, competitionId: comp, unregistered: true }, human: () => `${ok("✓")} Inscripción cancelada.` };
}
async function cefePromoList(ctx) {
  const list = await listPromotions(str(ctx.args, "status"));
  const s = currentSession(ctx.flags.profile);
  const mine = s ? await userPromotions(s.token, s.user.userId).catch(() => []) : [];
  return {
    data: { promotions: list, mine },
    human: () => [
      ...list.map((p) => `  ${strong(String(p.promotionId ?? "").slice(0, 8))}  ${String(p.name ?? "")}  ${muted(`${String(p.promotionType ?? "")} · ${String(p.status ?? "")} · ${String(p.visibility ?? "")} · ${cop(Number(p.price ?? 0))} · hasta ${String(p.endDate ?? "").slice(0, 10)}`)}
     ${dim(String(p.description ?? "").slice(0, 140))}`),
      mine.length ? `
${bold("Tus promociones:")} ${mine.length}` : s ? dim(`
No tienes promociones asignadas.`) : dim(`
Inicia sesión para ver las tuyas.`),
      info("i") + dim(" La compra de promociones se hace en cefechapinero.com/client/promotions (pago Wompi).")
    ].join(`
`)
  };
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
  return to > from ? { from, to, entry: e } : null;
}
function isReservable(e) {
  if (e.can === true)
    return true;
  if (e.can === false)
    return false;
  return /disponible|reservable/i.test(`${e.category ?? ""} ${e.title ?? ""}`);
}
function num(v) {
  if (v === null || v === undefined || v === "")
    return;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
function datesIn(entries) {
  return [...new Set(entries.map((e) => e.start.slice(0, 10)))].sort();
}
function split(entries, date) {
  const day = entries.filter((e) => e.start.startsWith(date));
  const win = (xs) => xs.map(toWindow).filter((w) => w !== null);
  return { open: win(day.filter(isReservable)), taken: win(day.filter((e) => !isReservable(e))) };
}
function hourSlots(entries, date) {
  const { open, taken } = split(entries, date);
  const hours = new Map;
  for (const w of open) {
    for (let h = Math.ceil(w.from);h + 1 <= w.to; h++) {
      const busy = taken.some((t) => t.from < h + 1 && t.to > h);
      const prev = hours.get(h);
      const slot = {
        hour: h,
        start: `${String(h).padStart(2, "0")}:00`,
        end: `${String(h + 1).padStart(2, "0")}:00`,
        available: (prev?.available ?? false) || !busy
      };
      const quota = num(w.entry.quota);
      const used = num(w.entry.used_quota);
      if (quota !== undefined)
        slot.quota = quota;
      if (used !== undefined)
        slot.used = used;
      hours.set(h, slot);
    }
  }
  for (const t of taken) {
    if (num(t.entry.quota) === undefined)
      continue;
    for (let h = Math.ceil(t.from);h + 1 <= t.to; h++) {
      if (hours.has(h))
        continue;
      hours.set(h, { hour: h, start: `${String(h).padStart(2, "0")}:00`, end: `${String(h + 1).padStart(2, "0")}:00`, available: false, quota: num(t.entry.quota), used: num(t.entry.used_quota) ?? num(t.entry.quota) });
    }
  }
  return [...hours.values()].sort((a, b) => a.hour - b.hour);
}
function blocks(entries, date) {
  const { open, taken } = split(entries, date);
  const full = taken.filter((t) => num(t.entry.quota) !== undefined && !open.some((o) => o.from === t.from && o.to === t.to)).map((t) => ({ from: t.from, to: t.to, available: false, quota: num(t.entry.quota), used: num(t.entry.used_quota) ?? num(t.entry.quota) }));
  return open.map((w) => {
    const b = { from: w.from, to: w.to, available: !taken.some((t) => t.from < w.to && t.to > w.from) };
    const quota = num(w.entry.quota);
    const used = num(w.entry.used_quota);
    if (quota !== undefined)
      b.quota = quota;
    if (used !== undefined)
      b.used = used;
    return b;
  }).concat(full).sort((a, b) => a.from - b.from);
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

// src/commands/read.ts
var fold2 = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
function courtId(raw) {
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0)
    fail("usage/bad-id", `Id de espacio inválido: ${raw}.`, "Usa el id de `cupo idrd court list`.");
  return n;
}
function optInt(ctx, key) {
  const v = str(ctx.args, key);
  if (v === undefined)
    return;
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0)
    fail("usage/bad-arg", `--${key} debe ser un entero positivo (recibí ${v}).`);
  return n;
}
async function courtsFor(ctx) {
  const sport = parseSport(str(ctx.args, "sport"));
  const loc = str(ctx.args, "locality");
  let courts = await listCourts(sport);
  if (!ctx.args.all)
    courts = courts.filter((c) => c.bookable);
  if (loc)
    courts = courts.filter((c) => fold2(c.locality).includes(fold2(loc)) || fold2(c.parkName).includes(fold2(loc)));
  return courts;
}
async function courtList(ctx) {
  const courts = await courtsFor(ctx);
  const sport = parseSport(str(ctx.args, "sport"));
  const spec = SPORTS[sport];
  const first = courts[0];
  return {
    data: courts,
    human: (cs) => cs.length === 0 ? `No hay ${spec.label.toLowerCase()} con esos filtros.` : `${bold(`${spec.label}: ${cs.length} ${cs.length === 1 ? spec.noun : spec.plural}`)}

` + table(["ID", "Parque", "Localidad", "Descripción"], cs.map((c) => [strong(String(c.id)), c.parkName, c.locality, muted(c.description || c.address)]), [8, 30, 14, 50]),
    nextSteps: first ? spec.needs === "lane" ? [
      { command: `cupo idrd court lanes ${first.id}`, description: "carriles de una piscina" },
      { command: `cupo idrd find --sport pool --date mañana --from 6 --to 9`, description: "buscar cupos en todas las piscinas y carriles" }
    ] : spec.needs === "sport" ? [
      { command: `cupo idrd court sports ${first.id}`, description: "deportes que admite el coliseo" },
      { command: `cupo idrd slot list ${first.id} --date mañana --free`, description: "horas libres" }
    ] : [
      { command: `cupo idrd slot list ${first.id} --date mañana --free`, description: `horas libres de ${spec.noun === "cancha" ? "una cancha" : `un ${spec.noun}`}` },
      { command: `cupo idrd find --sport ${sport} --date mañana --from 6 --to 9`, description: "buscar en todos a la vez" }
    ] : []
  };
}
async function courtGet(ctx) {
  const id = courtId(positional(ctx.args, 0, "id"));
  const sched = await getSchedule(id, bogotaNow().date);
  const spec = SPORTS[sched.endowment.sport];
  const [park, lanes, sports] = await Promise.all([
    Number.isFinite(sched.park.id) ? getPark(sched.park.id).catch(() => null) : Promise.resolve(null),
    spec.needs === "lane" ? listLanes(id).catch(() => []) : Promise.resolve([]),
    spec.needs === "sport" ? listColiseumSports(id).catch(() => []) : Promise.resolve([])
  ]);
  const { id: parkId, ...parkInfo } = sched.park;
  const data = { court: { id, parkId, ...parkInfo }, kind: sched.endowment.sport, park, endowment: sched.endowment, lanes, sports };
  return {
    data,
    human: (d) => [
      bold(`${d.endowment.description || spec.noun} · ${d.court.name}`),
      `${muted("Tipo")}       ${spec.label}${spec.capacity === "quota" ? " (por cupos)" : ""}${spec.block ? " (por bloque)" : ""}`,
      `${muted("Dirección")}  ${d.court.address}${d.court.locality ? `, ${d.court.locality}` : ""}`,
      d.park?.hours ? `${muted("Parque")}     ${d.park.hours}` : "",
      `${muted("Superficie")} ${d.endowment.surface || "—"} · ${muted("Luz")} ${d.endowment.lighting || "—"} · ${muted("Estado")} ${d.endowment.status || "—"}`,
      d.park?.email ? `${muted("Contacto")}   ${d.park.email}` : "",
      lanes.length ? `${muted("Carriles")}   ${lanes.map((l) => `${l.id} (${l.name} ${l.level} ${l.direction}, ${l.quota ?? "?"} cupos)`).join(" · ")}` : "",
      sports.length ? `${muted("Deportes")}   ${sports.map((s) => `${s.id} ${s.name}`).join(" · ")}` : "",
      keyRules(d.endowment.rules).length ? `
${dim("Para reservar:")}
${keyRules(d.endowment.rules).map((l) => `  • ${l}`).join(`
`)}
${dim("  Reglas completas: cupo idrd court get " + d.court.id + " --json (endowment.rules)")}` : ""
    ].filter(Boolean).join(`
`),
    nextSteps: lanes[0] ? [{ command: `cupo idrd slot list ${id} --lane ${lanes[0].id} --date mañana`, description: "cupos por hora en un carril" }] : sports[0] ? [{ command: `cupo idrd slot list ${id} --sport-id ${sports[0].id} --date mañana`, description: "horas para ese deporte" }] : [{ command: `cupo idrd slot list ${id} --date mañana`, description: "ver horas" }]
  };
}
async function courtLanes(ctx) {
  const id = courtId(positional(ctx.args, 0, "id"));
  const lanes = await listLanes(id);
  return {
    data: lanes,
    human: () => lanes.length === 0 ? "Esta dotación no tiene carriles (¿no es una piscina?)." : table(["Carril", "Nombre", "Nivel", "Sentido", "Cupos"], lanes.map((l) => [strong(String(l.id)), l.name, l.level, l.direction, String(l.quota ?? "—")]), [8, 8, 10, 12, 6]),
    nextSteps: lanes[0] ? [{ command: `cupo idrd slot list ${id} --lane ${lanes[0].id} --date mañana --free`, description: "cupos libres en ese carril" }] : []
  };
}
async function courtSports(ctx) {
  const id = courtId(positional(ctx.args, 0, "id"));
  const sports = await listColiseumSports(id);
  return {
    data: sports,
    human: () => sports.length === 0 ? "Esta dotación no publica deportes (¿no es un coliseo?)." : sports.map((s) => `  ${strong(String(s.id).padEnd(4))} ${s.name}`).join(`
`),
    nextSteps: sports[0] ? [{ command: `cupo idrd slot list ${id} --sport-id ${sports[0].id} --date mañana --free`, description: "horas libres para ese deporte" }] : []
  };
}
function keyRules(rules) {
  return rules.split(`
`).map((l) => l.replace(/^[*•-]\s*/, "").trim()).filter((l) => /podrá reservar máximo|horas de anticipación|devolución de dinero/i.test(l)).map((l) => {
    const first = l.split(/(?<=\.)\s/)[0] ?? l;
    return first.length > 160 ? `${first.slice(0, 159)}…` : first;
  });
}
function renderSlots2(slots) {
  if (slots.length === 0)
    return dim("  Sin franjas reservables ese día.");
  return slots.map((s) => {
    const cap = s.quota !== undefined ? muted(`  ${Math.max(0, s.quota - (s.used ?? 0))}/${s.quota} cupos`) : "";
    return `  ${s.available ? ok("●") : muted("○")} ${hh(s.hour)}–${hh(s.hour + 1)}  ${s.available ? ok("libre") : muted("sin cupo")}${cap}`;
  }).join(`
`);
}
function renderBlocks(bs) {
  return bs.map((b) => `  ${b.available ? ok("●") : muted("○")} bloque ${hh(b.from)}–${hh(b.to)}  ${b.available ? ok("libre") : muted("reservado")}`).join(`
`);
}
async function calendarOptions(ctx, id, sched) {
  const spec = SPORTS[sched.endowment.sport];
  const lane = optInt(ctx, "lane");
  const sportId = optInt(ctx, "sportId");
  const document = str(ctx.args, "document");
  if (spec.needs === "lane" && lane === undefined) {
    const lanes = await listLanes(id).catch(() => []);
    fail("usage/missing-lane", "Las piscinas se consultan y reservan por carril.", lanes.length ? `Usa --lane <id>. Carriles: ${lanes.map((l) => `${l.id} (${l.name} ${l.level})`).join(", ")}.` : `Corre \`cupo idrd court lanes ${id}\`.`);
  }
  return { lane, sportId, document };
}
async function slotList(ctx) {
  const id = courtId(positional(ctx.args, 0, "id"));
  const date = parseDate(str(ctx.args, "date"));
  let sched = await getSchedule(id, date, { lane: optInt(ctx, "lane"), sportId: optInt(ctx, "sportId"), document: str(ctx.args, "document") });
  const opts = await calendarOptions(ctx, id, sched);
  const spec = SPORTS[sched.endowment.sport];
  const weekDates = datesIn(sched.entries);
  let slots = hourSlots(sched.entries, date);
  const runs = freeRuns(slots);
  const bs = blocks(sched.entries, date);
  if (ctx.args.free)
    slots = slots.filter((s) => s.available);
  const outside = weekDates.length > 0 && !weekDates.includes(date);
  const data = { courtId: id, kind: sched.endowment.sport, lane: opts.lane ?? null, sportId: opts.sportId ?? null, date, weekDates, outsidePublishedWeek: outside, slots, blocks: bs, freeRuns: runs };
  const first = runs[0];
  const extra = `${opts.lane ? ` --lane ${opts.lane}` : ""}${opts.sportId ? ` --sport-id ${opts.sportId}` : ""}`;
  const freeBlock = bs.find((b) => b.available);
  return {
    data,
    human: () => [
      bold(`${sched.endowment.description || `${spec.noun} ${id}`} · ${sched.park.name} · ${date}${opts.lane ? ` · carril ${opts.lane}` : ""}`),
      outside ? `${info("!")} El portal solo publica la semana ${weekDates[0]} a ${weekDates[weekDates.length - 1]}.` : "",
      spec.block ? renderBlocks(bs) : renderSlots2(slots),
      spec.needs === "sport" && opts.sportId === undefined ? dim(`  Para reservar hace falta --sport-id (cupo idrd court sports ${id}).`) : ""
    ].filter(Boolean).join(`
`),
    nextSteps: spec.block && freeBlock ? [{ command: `cupo idrd booking create ${id} --date ${date} --hour ${freeBlock.from} --hours ${freeBlock.to - freeBlock.from}${extra}`, description: "vista previa de la reserva del bloque (no reserva nada)" }] : first ? [{ command: `cupo idrd booking create ${id} --date ${date} --hour ${first[0]}${first.length > 1 && spec.capacity === "exclusive" && !spec.block ? " --hours 2" : ""}${extra}`, description: "vista previa de la reserva (no reserva nada)" }] : [{ command: `cupo idrd find --sport ${sched.endowment.sport} --date ${date}`, description: "buscar en otros espacios" }]
  };
}
async function slotFind(ctx) {
  const sport = parseSport(str(ctx.args, "sport"));
  const spec = SPORTS[sport];
  const date = parseDate(str(ctx.args, "date") ?? addDays(bogotaNow().date, 1));
  const from = str(ctx.args, "from") ? parseHour(str(ctx.args, "from")) : 0;
  const to = str(ctx.args, "to") ? parseHour(str(ctx.args, "to")) : 24;
  if (to <= from)
    fail("usage/bad-window", "--to debe ser mayor que --from.");
  const sportId = optInt(ctx, "sportId");
  const courts = await courtsFor(ctx);
  const concurrency = Math.max(1, Math.min(int(ctx.args, "concurrency", 4), 8));
  let units = courts.map((court) => ({ court }));
  const failed = [];
  if (spec.needs === "lane") {
    const expanded = [];
    await runQueue(courts, concurrency, async (c) => {
      try {
        const lanes = (await listLanes(c.id)).filter((l) => l.enabled);
        if (lanes.length === 0)
          failed.push({ courtId: c.id, error: "sin carriles publicados" });
        for (const lane of lanes)
          expanded.push({ court: c, lane });
      } catch (e) {
        failed.push({ courtId: c.id, error: e instanceof Error ? e.message : String(e) });
      }
    });
    units = expanded;
  }
  const results = [];
  let weekDates = [];
  await runQueue(units, concurrency, async (u) => {
    try {
      const sched = await getSchedule(u.court.id, date, { lane: u.lane?.id, sportId });
      if (!weekDates.length)
        weekDates = datesIn(sched.entries);
      const free = hourSlots(sched.entries, date).filter((s) => s.available && s.hour >= from && s.hour + 1 <= to);
      if (free.length) {
        const r = { court: u.court, freeHours: free.map((s) => s.hour) };
        if (u.lane)
          r.lane = u.lane;
        const places = free.map((s) => s.quota !== undefined ? s.quota - (s.used ?? 0) : undefined).filter((n) => n !== undefined);
        if (places.length)
          r.places = Math.min(...places);
        results.push(r);
      }
    } catch (e) {
      failed.push({ courtId: u.court.id, lane: u.lane?.id, error: e instanceof Error ? e.message : String(e) });
    }
  });
  results.sort((a, b) => (a.freeHours[0] ?? 99) - (b.freeHours[0] ?? 99) || a.court.parkName.localeCompare(b.court.parkName) || (a.lane?.id ?? 0) - (b.lane?.id ?? 0));
  const data = { date, sport, window: { from, to }, weekDates, results, scanned: units.length, spaces: courts.length, failed };
  const best = results[0];
  const bestExtra = best ? `${best.lane ? ` --lane ${best.lane.id}` : ""}${sportId ? ` --sport-id ${sportId}` : ""}` : "";
  return {
    data,
    human: () => {
      const span = from === 0 && to === 24 ? "todo el día" : `${hh(from)}–${hh(to)}`;
      const what = spec.needs === "lane" ? `${courts.length} piscinas · ${units.length} carriles revisados` : `${courts.length} ${courts.length === 1 ? spec.noun : spec.plural} revisad${spec.noun.endsWith("a") ? "as" : "os"}`;
      const head = bold(`${spec.label} · ${date} · ${span} · ${what}`);
      if (!results.length)
        return `${head}

  Ninguna hora libre en esa franja.${failed.length ? dim(`
  (${failed.length} no respondieron)`) : ""}`;
      const cols = spec.needs === "lane" ? ["ID", "Parque", "Carril", "Libre (mín. cupos)"] : ["ID", "Parque", "Localidad", "Libre"];
      return `${head}

${table(cols, results.map((r) => [
        strong(String(r.court.id)),
        r.court.parkName,
        spec.needs === "lane" ? `${r.lane?.id} (${r.lane?.name} ${r.lane?.level})` : r.court.locality,
        ok(rangesLabel(r.freeHours)) + (r.places !== undefined ? muted(` (${r.places})`) : "")
      ]), [8, 28, 18, 46])}${failed.length ? dim(`

${failed.length} no respondieron.`) : ""}`;
    },
    nextSteps: best ? [{ command: `cupo idrd booking create ${best.court.id} --date ${date} --hour ${best.freeHours[0]}${bestExtra}`, description: "vista previa de la reserva (no reserva nada)" }] : [{ command: `cupo idrd find --date ${addDays(date, 1)} --sport ${sport}`, description: "probar otro día" }]
  };
}
async function runQueue(items, concurrency, fn) {
  const queue = [...items];
  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, async () => {
    for (let it = queue.shift();it !== undefined; it = queue.shift())
      await fn(it);
  }));
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
  const court = input.court ?? true;
  if (input.hours < 1)
    v.push({ rule: "min-hours", message: "La reserva debe durar al menos 1 hora." });
  if (court && input.hours > RULES.maxContinuousHours) {
    v.push({ rule: "max-continuous-hours", message: `Máximo ${RULES.maxContinuousHours} horas continuas por día (pediste ${input.hours}).` });
  }
  if (!court && input.maxHours !== undefined && input.hours > input.maxHours) {
    v.push({ rule: "within-block", message: `El bloque publicado dura ${input.maxHours} h (pediste ${input.hours}).` });
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
  const nowMs2 = Date.parse(`${now.date}T${String(now.hour).padStart(2, "0")}:${String(now.minute).padStart(2, "0")}:00-05:00`);
  const advance = (startMs - nowMs2) / 3600000;
  if (advance < 0) {
    v.push({ rule: "in-the-past", message: `${input.date} ${hourLabel(input.startHour)} ya pasó.` });
  } else if (court && advance < RULES.minAdvanceHours) {
    v.push({ rule: "min-advance", message: `Se reserva con mínimo ${RULES.minAdvanceHours} h de anticipación (faltan ${advance.toFixed(1)} h).` });
  }
  if (now.isoWeekday === 1 && now.hour < RULES.mondayOpenHour) {
    v.push({ rule: "monday-window", message: "Las reservas de la semana abren los lunes a partir de las 9:00 a.m." });
  }
  return v;
}

// src/commands/write.ts
function assertWritable2() {
  const k = getKillswitchState(appHome());
  if (k.active)
    fail("safety/killswitch", `Killswitch activo${k.reason ? ` (${k.reason})` : ""}: escrituras bloqueadas.`, "Desactívalo con `cupo killswitch off`.");
}
function audit2(ctx, kind, command, tier, meta) {
  return beginAudit(paths.audit(), { kind, command, tier, profile: profileName(ctx.flags.profile), meta });
}
async function bookingCreate(ctx) {
  const courtId2 = Number(positional(ctx.args, 0, "id"));
  if (!Number.isInteger(courtId2) || courtId2 <= 0)
    fail("usage/bad-id", "Id de espacio inválido.");
  const date = parseDate(requireStr(ctx.args, "date"));
  const bank = str(ctx.args, "bank");
  const live = ctx.args.yes === true && !ctx.flags.dryRun;
  const probe = await getSchedule(courtId2, date, { lane: int(ctx.args, "lane"), sportId: int(ctx.args, "sportId"), document: str(ctx.args, "document") });
  const sport = probe.endowment.sport;
  const spec = SPORTS[sport];
  const cal = await calendarOptions(ctx, courtId2, probe);
  const sched = probe;
  const weekDates = datesIn(sched.entries);
  const dayBlocks = blocks(sched.entries, date);
  let startHour;
  let hours;
  if (spec.block) {
    const block = str(ctx.args, "hour") ? dayBlocks.find((b) => b.from === parseHour(str(ctx.args, "hour"))) : dayBlocks.find((b) => b.available) ?? dayBlocks[0];
    if (!block)
      fail("slot/unavailable", `No hay bloques publicados para ${date}.`, `Mira otros días con \`cupo idrd slot list ${courtId2} --date <día>\`.`);
    startHour = block.from;
    hours = int(ctx.args, "hours", block.to - block.from);
  } else {
    startHour = parseHour(requireStr(ctx.args, "hour"));
    hours = int(ctx.args, "hours", 1);
  }
  const intent = `${courtId2}@${date}T${String(startHour).padStart(2, "0")}x${hours}${cal.lane ? `L${cal.lane}` : ""}${cal.sportId ? `S${cal.sportId}` : ""}`;
  const checks = [];
  const k = getKillswitchState(appHome());
  checks.push({ name: "killswitch", ok: !k.active, detail: k.active ? `activo: ${k.reason}` : "apagado" });
  const containing = dayBlocks.find((b) => b.from <= startHour && b.to >= startHour + hours);
  const violations = checkBookingRules({
    date,
    startHour,
    hours,
    weekDates,
    court: spec.capacity === "exclusive" && !spec.block && !spec.needs,
    maxHours: containing ? containing.to - containing.from : undefined
  });
  if (!containing && !(spec.capacity === "exclusive" && !spec.block && !spec.needs)) {
    violations.push({ rule: "within-block", message: `${hh(startHour)}–${hh(startHour + hours)} no cabe en un bloque publicado (${dayBlocks.map((b) => `${hh(b.from)}–${hh(b.to)}`).join(", ") || "ninguno"}).` });
  }
  checks.push({ name: "reglas", ok: violations.length === 0, detail: violations.map((v) => v.message).join(" ") || (spec.block ? "bloque completo, como lo publica el portal" : "cumple las reglas del portal") });
  const slots = hourSlots(sched.entries, date);
  const wanted = Array.from({ length: hours }, (_, i) => startHour + i);
  const missing = wanted.filter((h) => !slots.find((s) => s.hour === h && s.available));
  const places = Math.min(...wanted.map((h) => {
    const sl = slots.find((s) => s.hour === h);
    return sl?.quota !== undefined ? sl.quota - (sl.used ?? 0) : Infinity;
  }));
  checks.push({
    name: "disponibilidad",
    ok: missing.length === 0,
    detail: missing.length ? `${spec.capacity === "quota" ? "sin cupo" : "ocupado o no reservable"}: ${missing.map(hh).join(", ")}` : `libre ${hh(startHour)}–${hh(startHour + hours)}${Number.isFinite(places) ? ` · ${places} cupos` : ""} (verificado en vivo)`
  });
  if (spec.needs === "sport") {
    checks.push({ name: "deporte", ok: cal.sportId !== undefined, detail: cal.sportId !== undefined ? `sport_id ${cal.sportId}` : `falta --sport-id (cupo idrd court sports ${courtId2})` });
  }
  const adultDoc = str(ctx.args, "adultDocument");
  const adultType = str(ctx.args, "adultDocumentType");
  const adultName = str(ctx.args, "adultName");
  const adult = Boolean(adultDoc || adultType || adultName);
  if (adult && !(adultDoc && adultType && adultName)) {
    fail("usage/missing-flag", "El adulto responsable necesita --adult-document-type, --adult-document y --adult-name.");
  }
  let document = str(ctx.args, "document");
  let who = "";
  try {
    const { token: token2 } = await accessToken(ctx.flags.profile);
    const u = await me(token2);
    document = document ?? u.document ?? undefined;
    who = `${u.email}${u.hasProfile ? "" : " (perfil incompleto)"}${str(ctx.args, "document") ? ` · beneficiario ${document}` : ""}`;
    checks.push({ name: "sesion", ok: u.hasProfile, detail: u.hasProfile ? who : `${who}: completa tu perfil en el portal` });
  } catch (e) {
    checks.push({ name: "sesion", ok: false, detail: e instanceof AppError ? e.human : String(e) });
  }
  if (sport === "pool" && CEFE_POOL_IDS.has(courtId2) && str(ctx.args, "document") && !adult) {
    checks.push({ name: "acudiente", ok: true, detail: "sin adulto responsable (obligatorio si el beneficiario tiene entre 5 y 12 años)" });
  }
  const body = {
    date,
    start_hour: hourLabel(startHour),
    final_hour: hourLabel(startHour + hours),
    sport_id: cal.sportId ?? null,
    lane: cal.lane ?? null,
    document,
    is_a_responsible_adult_required: adult,
    ...adult ? { document_type_responsible_adult: adultType, document_number_responsible_adult: adultDoc, full_name_responsible_adult: adultName } : {}
  };
  const ready = checks.every((c) => c.ok);
  const where = `${sched.endowment.description || `${spec.noun} ${courtId2}`} · ${sched.park.name}${cal.lane ? ` · carril ${cal.lane}` : ""}${cal.sportId ? ` · deporte ${cal.sportId}` : ""}`;
  const argv = `${courtId2} --date ${date} --hour ${startHour}${hours > 1 || spec.block ? ` --hours ${hours}` : ""}${cal.lane ? ` --lane ${cal.lane}` : ""}${cal.sportId ? ` --sport-id ${cal.sportId}` : ""}${str(ctx.args, "document") ? ` --document ${document}` : ""}${adult ? ` --adult-document-type ${adultType} --adult-document ${adultDoc} --adult-name "${adultName}"` : ""}`;
  if (!live) {
    audit2(ctx, "booking.create", "booking create", "T3", { courtId: courtId2, kind: sport, date, startHour, hours, lane: cal.lane ?? null, sportId: cal.sportId ?? null, ready }).dryRun();
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
  cupo idrd booking create ${argv} --yes --confirm ${strong(intent)}` : danger(`
No se puede reservar mientras haya checks en rojo.`)
      ].join(`
`),
      nextSteps: ready ? [{ command: `cupo idrd booking create ${argv} --yes --confirm ${intent}`, description: "RESERVA REAL e irreversible" }] : checks.find((c) => c.name === "sesion" && !c.ok) ? [{ command: "cupo idrd auth login --email <correo>", description: "iniciar sesión y volver a previsualizar" }] : checks.find((c) => c.name === "disponibilidad" && !c.ok) ? [{ command: `cupo idrd slot list ${courtId2} --date ${date} --free${cal.lane ? ` --lane ${cal.lane}` : ""}${cal.sportId ? ` --sport-id ${cal.sportId}` : ""}`, description: "ver horas libres de ese espacio" }] : []
    };
  }
  assertWritable2();
  const failed = checks.find((c) => !c.ok);
  if (failed) {
    const code = failed.name === "disponibilidad" ? "slot/unavailable" : failed.name === "reglas" ? "rule/violation" : failed.name === "sesion" ? "auth/required" : failed.name === "deporte" ? "usage/missing-flag" : "safety/precheck";
    fail(code, `No reservo: ${failed.name} — ${failed.detail}`);
  }
  await approveGate({ cliName: "cupo", flags: { json: ctx.flags.json, noInput: ctx.flags.noInput } }, { title: "Reserva irreversible", summary: `${where} · ${date} ${hourLabel(startHour)}–${hourLabel(startHour + hours)}` }, { trust: "T3", yes: true, confirm: str(ctx.args, "confirm"), confirmAgainst: intent });
  const { token } = await accessToken(ctx.flags.profile);
  const a = audit2(ctx, "booking.create", "booking create", "T3", { courtId: courtId2, kind: sport, date, startHour, hours, lane: cal.lane ?? null, sportId: cal.sportId ?? null, intent });
  let booking;
  try {
    const raw = await createBooking(token, courtId2, body);
    booking = normalizeBooking(raw, { courtId: courtId2, date, startHour: body.start_hour, finalHour: body.final_hour, lane: cal.lane ?? null, sportId: cal.sportId ?? null });
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
      booking.raw.adult_booking_id ? `  ${info("i")} El portal creó también la reserva del acudiente (${String(booking.raw.adult_booking_id)}).` : "",
      booking.free ? `  ${ok("Gratis.")} ${payment?.receiptUrl ? `Comprobante: ${payment.receiptUrl}` : ""}` : `  Valor: ${bold(`$${booking.amount}`)} ${muted(booking.concept)}`,
      payment?.bankUrl ? `  ${bold("Link de pago PSE:")} ${payment.bankUrl}` : "",
      payment && payment.ok === false ? danger(`  ✗ La reserva existe, pero falló el paso de ${booking.free ? "confirmación" : "pago"}: ${payment.error.message}`) : ""
    ].filter(Boolean).join(`
`),
    nextSteps: payment && payment.ok === false ? [{ command: `cupo idrd pay pse ${booking.bookingId}${booking.free ? "" : ` --bank ${bank}`} --yes`, description: booking.free ? "reintentar la confirmación gratuita" : "reintentar el link de pago" }] : !booking.free && !payment ? [
      { command: "cupo idrd pay banks", description: "elegir banco" },
      { command: `cupo idrd pay pse ${booking.bookingId} --bank <código> --yes`, description: "generar link de pago PSE" }
    ] : []
  };
}
async function settle(ctx, token, b, bankCode) {
  assertWritable2();
  if (!b.free && b.holdUntil && Date.parse(b.holdUntil) < Date.now()) {
    fail("slot/hold-expired", "El tiempo para pagar esta reserva ya venció.", "Crea una reserva nueva.");
  }
  const ip = await publicIp();
  const payload = paymentPayload(b, { bankCode, ip });
  const a = audit2(ctx, b.free ? "payment.free" : "payment.pse", "pay", b.free ? "T1" : "T2", { bookingId: b.bookingId, amount: b.amount, bank: b.free ? null : bankCode });
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
  assertWritable2();
  if (ctx.flags.dryRun) {
    return {
      data: { dryRun: true, bookingId: b.bookingId, amount: b.amount, free: b.free, bank },
      human: () => `Vista previa: se crearía ${b.free ? "la confirmación gratuita" : `la orden PSE por $${b.amount} con el banco ${bank}`}.`
    };
  }
  await approveGate({ cliName: "cupo", flags: { json: ctx.flags.json, noInput: ctx.flags.noInput } }, { title: b.free ? "Confirmar reserva gratuita" : "Crear orden de pago PSE", summary: `Reserva ${b.bookingId} · $${b.amount}` }, { trust: "T2", yes: ctx.args.yes === true });
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
    nextSteps: out.paymentCode ? [{ command: `cupo idrd pay status ${out.paymentCode}`, description: "ver si el pago quedó aprobado" }] : []
  };
}
async function payStatus(ctx) {
  const arg = positional(ctx.args, 0, "code");
  const { token } = await accessToken(ctx.flags.profile);
  let code = arg;
  let resolvedFrom = null;
  if (/^\d+$/.test(arg)) {
    const hist = await paymentHistory(token);
    const mine = hist.filter((h) => String(h.booking_id ?? "") === arg && typeof h.payment_code === "string");
    mine.sort((a, b) => Number(b.status === "APROBADO") - Number(a.status === "APROBADO") || String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")));
    if (!mine[0])
      fail("not-found/resource", `No hay pagos de la reserva ${arg} en tu historial.`, "Si acabas de crearla, genera el pago con `cupo idrd pay pse <reserva> --bank <código> --yes`. `cupo idrd pay history` lista todos tus pagos.");
    code = String(mine[0].payment_code);
    resolvedFrom = arg;
  }
  const raw = await paymentStatus(token, code);
  const items = Array.isArray(raw) ? raw : [raw];
  const g = (o, path) => path.split(".").reduce((acc, k) => acc && typeof acc === "object" ? acc[k] : undefined, o);
  const s = (v) => v === null || v === undefined ? "" : String(v);
  const approved = items.some((i) => /aprobado/i.test(s(g(i, "status.descripcion"))) || s(g(i, "status_bank")) === "OK");
  const data = { code, bookingId: resolvedFrom ?? (items[0] ? s(g(items[0], "booking_id")) || null : null), approved, receiptUrl: approved ? `${RECEIPT_BASE}${code}` : null, payments: items };
  return {
    data,
    human: () => items.map((i) => {
      const st = s(g(i, "status.descripcion")) || s(g(i, "status")) || "—";
      const line = /aprobado/i.test(st) ? ok(`✓ ${st}`) : /fallid|rechaz/i.test(st) ? danger(`✗ ${st}`) : warn(`! ${st}`);
      return [
        `${bold("Pago")} ${code}${resolvedFrom ? muted(` (reserva ${resolvedFrom})`) : ""}`,
        `  Estado    ${line}${s(g(i, "status_bank")) ? muted(` · banco ${s(g(i, "status_bank"))}`) : ""}`,
        `  Valor     $${s(g(i, "amount"))} ${s(g(i, "currently"))}`,
        `  Fecha     ${s(g(i, "date_payment"))}`,
        `  Concepto  ${s(g(i, "concept"))}`,
        `  Medio     ${s(g(i, "method.Nombre")).toUpperCase()}${s(g(i, "transaccion_id_pse")) ? ` · ${s(g(i, "transaccion_id_pse"))}` : ""}`,
        ...approved ? [`  ${muted("Comprobante")} ${RECEIPT_BASE}${code}`] : []
      ].join(`
`);
    }).join(`

`) || muted("El portal no devolvió información de ese pago."),
    nextSteps: approved ? [] : [{ command: "cupo idrd pay history", description: "todos tus pagos con su estado" }]
  };
}

// src/commands/jobs.ts
var PROVIDERS = [
  { id: "idrd", name: "IDRD · Portal Ciudadano", web: "https://portalciudadano.idrd.gov.co", covers: "parques públicos de toda Bogotá: 320 canchas (tenis, pádel, pickleball, fútbol), 12 piscinas por carril, 35 asadores, 5 gimnasios CEFE, 4 coliseos; escuelas y actividades con inscripción", sports: [...ALL_SPORTS], login: "cupo idrd auth login --email <correo>", account: "cuenta del Portal Ciudadano (IDRD_PASSWORD)" },
  { id: "cefe", name: "CEFE Chapinero", web: "https://cefechapinero.com", covers: "Centro Felicidad Chapinero: 2 piscinas por franja de 60 min con cupos, 18 cursos de natación y actividades, torneos", sports: ["pool"], login: "cupo cefe auth login --email <correo>", account: "cuenta propia del CEFE (CEFE_PASSWORD)" }
];
function minutes(raw, def) {
  if (!raw)
    return def;
  const s = raw.trim().toLowerCase().replace(/\s+/g, "");
  const m = /^(\d{1,2})(?::(\d{2}))?(am|pm)?$/.exec(s);
  if (!m)
    fail("usage/bad-hour", `Hora inválida: ${raw}.`, "Usa 6, 6am, 18 o 06:30.");
  let h = Number(m[1]);
  if (m[3] === "pm" && h < 12)
    h += 12;
  if (m[3] === "am" && h === 12)
    h = 0;
  return h * 60 + Number(m[2] ?? 0);
}
var hm = (min) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
async function find(ctx) {
  const sportInput = (str(ctx.args, "sport") ?? "pool").trim().toLowerCase();
  const sport = parseSport(sportInput);
  const aliasNote = sportInput !== sport ? `--sport ${sportInput} = ${sport}${sportInput.startsWith("futbol") || sportInput.startsWith("fútbol") ? "; para grama natural usa --sport natural" : ""}` : null;
  const date = parseDate(str(ctx.args, "date") ?? addDays(bogotaNow().date, 1));
  const from = minutes(str(ctx.args, "from"), 0);
  const to = minutes(str(ctx.args, "to"), 24 * 60);
  if (to <= from)
    fail("usage/bad-window", "--to debe ser mayor que --from.");
  const only = str(ctx.args, "provider");
  if (only && !PROVIDERS.some((p) => p.id === only))
    fail("usage/bad-arg", `Proveedor desconocido: ${only}.`, "Opciones: idrd, cefe.");
  const locality = str(ctx.args, "locality");
  const providers = PROVIDERS.filter((p) => (!only || p.id === only) && p.sports.includes(sport));
  const hits = [];
  const failed = [];
  const scanned = {};
  await Promise.all(providers.map(async (p) => {
    try {
      if (p.id === "idrd") {
        const window = { ...str(ctx.args, "from") ? { from: String(Math.floor(from / 60)) } : {}, ...str(ctx.args, "to") ? { to: String(Math.min(23, Math.ceil(to / 60))) } : {} };
        const r = await slotFind({ ...ctx, args: { ...ctx.args, _: [], sport, date, from: undefined, to: undefined, ...window, locality } });
        scanned.idrd = r.data.scanned;
        for (const x of r.data.results) {
          const lane = x.lane ? ` --lane ${x.lane.id}` : "";
          hits.push({
            provider: "idrd",
            id: `idrd:${x.court.id}`,
            kind: sport,
            name: `${x.court.parkName}${x.court.description ? ` · ${x.court.description}` : ""}`,
            where: x.court.locality,
            ...x.lane ? { lane: `${x.lane.id} (${x.lane.name} ${x.lane.level})` } : {},
            free: x.freeHours.map((h) => ({ start: hh(h), end: hh(h + 1), ...x.places !== undefined ? { places: x.places } : {} })),
            bookCommand: `cupo book idrd:${x.court.id} --date ${date} --hour ${x.freeHours[0]}${lane}`
          });
        }
      } else {
        if (locality && !"chapinero cefe centro felicidad".includes(locality.toLowerCase())) {
          scanned.cefe = 0;
          return;
        }
        const r = await cefeSlotFind({ ...ctx, args: { ...ctx.args, _: [], date, from: str(ctx.args, "from") ? hm(from) : undefined, to: str(ctx.args, "to") ? hm(Math.min(to, 23 * 60 + 59)) : undefined } });
        scanned.cefe = r.data.scanned;
        for (const x of r.data.results) {
          hits.push({
            provider: "cefe",
            id: `cefe:${x.pool.poolId}`,
            kind: "pool",
            name: `CEFE Chapinero · ${x.pool.name}`,
            where: "CHAPINERO",
            free: x.slots.map((s) => ({ start: s.time, end: s.end.slice(11, 16), places: s.free })),
            bookCommand: `cupo book cefe:${x.pool.poolId} --date ${date} --time ${x.slots[0].time}`
          });
        }
      }
    } catch (e) {
      failed.push({ provider: p.id, error: e instanceof Error ? e.message : String(e) });
    }
  }));
  hits.sort((a, b) => a.free[0].start.localeCompare(b.free[0].start) || a.name.localeCompare(b.name));
  const data = { date, sport, ...aliasNote ? { sportInput } : {}, window: { from: hm(from), to: hm(to) }, providers: providers.map((p) => p.id), scanned, results: hits, failed };
  return {
    data,
    human: () => {
      const span = from === 0 && to === 1440 ? "todo el día" : `${hm(from)}–${hm(to)}`;
      const head = bold(`${SPORTS[sport].label} · ${date} · ${span}`) + muted(` · ${providers.map((p) => `${p.name} (${scanned[p.id] ?? 0})`).join(" + ")}`) + (aliasNote ? `
${dim(`  ${aliasNote}`)}` : "");
      if (!hits.length)
        return `${head}

  Sin cupo en esa franja.${failed.length ? dim(`
  (${failed.map((f) => `${f.provider}: ${f.error}`).join("; ")})`) : ""}
  ${dim(`Prueba otro día: cupo find --sport ${sport} --date ${addDays(date, 1)}`)}`;
      return `${head}

${table(["Dónde", "Localidad", "Libre", "Reservar con"], hits.map((h) => [`${h.name}${h.lane ? muted(` · carril ${h.lane}`) : ""}`, h.where, ok(h.free.map((f) => `${f.start}${f.places !== undefined ? ` (${f.places})` : ""}`).join(" ")), strong(h.bookCommand.replace(/^cupo /, ""))]), [40, 12, 36, 60])}${failed.length ? warn(`

${failed.map((f) => `${f.provider} no respondió: ${f.error}`).join(`
`)}`) : ""}
${dim("Entre paréntesis: cupos cuando el espacio es compartido. `cupo book` muestra una vista previa antes de reservar.")}`;
    },
    nextSteps: hits[0] ? [{ command: hits[0].bookCommand, description: "vista previa de la reserva (no reserva nada)" }] : [{ command: `cupo find --sport ${sport} --date ${addDays(date, 1)}`, description: "probar otro día" }]
  };
}
async function book(ctx) {
  const raw = positional(ctx.args, 0, "id");
  const m = /^(idrd|cefe):(.+)$/.exec(raw);
  if (!m)
    fail("usage/bad-id", `El id debe llevar el proveedor: idrd:11537 o cefe:<poolId> (recibí ${raw}).`, "Los ids salen así de `cupo find`.");
  const [, provider, id] = m;
  const args = { ...ctx.args, _: [id, ...ctx.args._.slice(1)] };
  if (provider === "idrd") {
    const time = str(args, "time");
    if (time && !str(args, "hour")) {
      const mm = /^(\d{1,2}):(\d{2})$/.exec(time);
      if (mm)
        args.hour = mm[1];
    }
    return bookingCreate({ ...ctx, args });
  }
  const hour = str(args, "hour");
  if (hour && !str(args, "time"))
    args.time = /^\d{1,2}$/.test(hour) ? `${hour.padStart(2, "0")}:00` : hour;
  return cefeBookingCreate({ ...ctx, args });
}
async function providers(ctx) {
  const idrd = currentSession2(ctx.flags.profile);
  const cefe = currentSession(ctx.flags.profile);
  const data = PROVIDERS.map((p) => ({
    ...p,
    loggedIn: p.id === "idrd" ? Boolean(idrd) : Boolean(cefe),
    email: p.id === "idrd" ? idrd?.email ?? null : cefe?.email ?? null,
    commands: { find: `cupo find --provider ${p.id} --sport ${p.id === "cefe" ? "pool" : "tennis"} --date mañana`, all: `cupo ${p.id} --help` }
  }));
  return {
    data,
    human: () => data.map((p) => [
      `${p.loggedIn ? ok("●") : muted("○")} ${bold(p.name)} ${muted(p.web)}`,
      `   ${p.covers}`,
      `   ${muted("Deportes")} ${p.sports.join(" ")}`,
      `   ${p.loggedIn ? ok(`sesión: ${p.email}`) : `${muted("sin sesión")} → ${p.login}`}`
    ].join(`
`)).join(`

`) + `

${dim("Buscar en todos: cupo find --sport pool --date sab · Reservar: cupo book <id de find> · Detalle por proveedor: cupo idrd --help, cupo cefe --help")}`,
    nextSteps: [{ command: "cupo find --sport pool --date sab --from 6 --to 10", description: "cupo para nadar el sábado en la mañana, en todos los proveedores" }]
  };
}
// package.json
var package_default = {
  name: "cupo",
  version: "0.4.0",
  description: "Consigue cupo para hacer deporte en Bogotá desde la terminal: canchas, piscinas, asadores, gimnasios, coliseos y cursos del IDRD y del CEFE Chapinero. CLI agent-first, no oficial.",
  type: "module",
  private: true,
  bin: {
    cupo: "dist/cupo.js",
    idrd: "dist/cupo.js"
  },
  files: [
    "dist"
  ],
  engines: {
    node: ">=20"
  },
  scripts: {
    build: "bun build src/bin.ts --target=node --format=esm --outfile=dist/cupo.js && node scripts/shebang.mjs",
    dev: "bun src/bin.ts",
    typecheck: "tsc --noEmit",
    test: "bun test",
    check: "bun run typecheck && bun test && bun run build",
    "verify:dist": 'bun run build && git diff --quiet -- dist/ || (echo "dist/cupo.js no coincide con src/: haz commit del build" && exit 1)'
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
    url: "git+https://github.com/huayaney-exe/cupo-ciudadano-cli.git"
  },
  homepage: "https://github.com/huayaney-exe/cupo-ciudadano-cli#readme",
  keywords: [
    "cupo",
    "bogota",
    "idrd",
    "cefe",
    "cli",
    "agent",
    "piscina",
    "tenis",
    "reservas"
  ]
};

// src/commands/account.ts
var VERSION = package_default.version;
async function authLogin(ctx) {
  const profile = ctx.flags.profile;
  const email = str(ctx.args, "email") ?? knownEmail2(profile);
  if (!email)
    fail("usage/missing-flag", "Falta tu correo.", "Usa --email <correo> (se recuerda para la próxima).");
  const save = ctx.args.save === true;
  if (save && secretBackend() === "none")
    fail("usage/bad-flag", "CUPO_SECRETS=none: guardar la contraseña está deshabilitado.", "Quita CUPO_SECRETS o ponlo en keychain|file.");
  const password = await resolvePassword2({ stdin: Boolean(ctx.args.passwordStdin), noInput: ctx.flags.noInput, email });
  const session = await login3(profile, email, password, { save });
  const user = await me(session.accessToken).catch(() => null);
  const data = { email, expiresAt: session.expiresAt, refreshable: Boolean(session.refreshToken), passwordSaved: save ? session.savedTo ?? null : null, user };
  return {
    data,
    human: () => `${ok("✓")} Sesión iniciada como ${bold(email)}${user ? ` (${user.name})` : ""}
  ${muted(`Vence: ${session.expiresAt}`)}${session.savedTo ? `
  ${muted(`Contraseña guardada en ${session.savedTo}: no se volverá a pedir.`)}` : ""}`,
    nextSteps: [{ command: "cupo idrd find --date mañana --from 6 --to 9", description: "buscar canchas libres" }]
  };
}
async function authStatus(ctx) {
  const s = currentSession2(ctx.flags.profile);
  if (!s) {
    return {
      data: { loggedIn: false, email: storedEmail2(ctx.flags.profile) ?? null },
      human: () => `${warn("○")} Sin sesión. Corre ${bold("cupo idrd auth login --email <correo>")}`,
      nextSteps: [{ command: "cupo idrd auth login --email <correo>", description: "iniciar sesión" }]
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
  const passwordStored = passwordLocation2(s.email);
  const data = { loggedIn: user !== null, email: s.email, expiresAt: s.expiresAt, expired, refreshable: Boolean(s.refreshToken), passwordStored, liveCheck, user };
  return {
    data,
    human: () => user ? `${ok("●")} Sesión activa: ${bold(s.email)} (${user.name})
  ${muted(`Vence: ${s.expiresAt}${passwordStored ? ` · contraseña guardada (${passwordStored === "keychain" ? "Llavero" : envFilePath()}): se renueva sola` : " · al vencer pedirá la contraseña (guárdala con `auth login --save`)"}`)}` : `${danger("●")} Sesión guardada pero no válida: ${liveCheck}`
  };
}
async function authLogout(ctx) {
  const s = currentSession2(ctx.flags.profile);
  if (s)
    await logout(s.accessToken).catch(() => {
      return;
    });
  logoutLocal2(ctx.flags.profile);
  const email = s?.email ?? knownEmail2(ctx.flags.profile);
  const forgotten = ctx.args.forget === true && email ? forgetPassword2(email) : null;
  const forgot = Boolean(forgotten && (forgotten.file || forgotten.keychain));
  return { data: { loggedOut: true, passwordForgotten: forgot }, human: () => `${ok("✓")} Sesión cerrada y token local borrado.${forgot ? " Contraseña guardada eliminada." : ""}` };
}
async function bookingList(ctx) {
  const { token } = await accessToken(ctx.flags.profile);
  const remote = await listBookings(token);
  const local = localBookings(ctx.flags.profile).map(({ raw, ...rest }) => rest);
  const remoteIds = new Set(remote.map((r2) => String(r2.id)));
  const localStatus = (b) => {
    if (remoteIds.has(String(b.bookingId)))
      return { status: "pagada", detail: "confirmada en el portal" };
    const hold = b.holdUntil ? Date.parse(`${String(b.holdUntil).replace(" ", "T")}-05:00`) : NaN;
    if (Number.isFinite(hold) && hold < nowMs())
      return { status: "vencida", detail: `la retención venció el ${String(b.holdUntil).slice(0, 16)}; vuelve a reservar` };
    return { status: "pendiente", detail: `paga antes de las ${String(b.holdUntil ?? "").slice(11, 16)}: cupo idrd pay pse ${b.bookingId} --bank <código> --yes` };
  };
  const data = { remote, local: local.map((b) => ({ ...b, ...localStatus(b) })) };
  const r = (x, k) => x[k] === null || x[k] === undefined ? "" : String(x[k]);
  const hhmm2 = (t) => t.slice(0, 5);
  return {
    data,
    human: () => [
      bold(`Reservas en el portal: ${remote.length}`),
      ...remote.length ? [table(["Reserva", "Fecha", "Hora", "Espacio", "Parque", "Valor", "Pago"], remote.slice(0, 30).map((x) => {
        const o = x;
        return [r(o, "id"), r(o, "date"), `${hhmm2(r(o, "start_hour"))}–${hhmm2(r(o, "final_hour"))}`, r(o, "name"), r(o, "park"), r(o, "total_format").trim() || r(o, "total"), r(o, "status_bank") === "OK" ? ok("pagado") : r(o, "status_bank") || muted("—")];
      }), [8, 10, 11, 34, 28, 14, 10])] : [muted("  ninguna")],
      "",
      bold(`Creadas desde este equipo: ${local.length}`),
      ...data.local.map((b) => `  • ${b.bookingId}  cancha ${b.courtId}  ${b.date} ${b.startHour}–${b.finalHour}  $${b.amount}  ${b.status === "pagada" ? ok(`✓ ${b.detail}`) : b.status === "vencida" ? muted(`○ ${b.detail}`) : warn(`! ${b.detail}`)}`)
    ].join(`
`)
  };
}
async function payPending(ctx) {
  const { token } = await accessToken(ctx.flags.profile);
  const items = await pendingToPay(token);
  return {
    data: items,
    human: () => items.length === 0 ? `${ok("✓")} No tienes pagos pendientes.` : `${bold(`Pagos pendientes: ${items.length}`)}
${items.map((i) => `  • ${scalarLine(i)}`).join(`
`)}`,
    nextSteps: items.length ? [{ command: "cupo idrd pay pse <bookingId> --bank <código> --yes", description: "pagar una reserva creada desde este equipo" }] : []
  };
}
async function payHistory(ctx) {
  const { token } = await accessToken(ctx.flags.profile);
  const items = await paymentHistory(token);
  return {
    data: items,
    human: () => {
      if (items.length === 0)
        return "Sin pagos registrados.";
      const g = (x, k) => {
        const v = x[k];
        return v === null || v === undefined ? "" : String(v);
      };
      const status = (s) => s === "APROBADO" ? ok(s) : s === "FALLIDO" || s === "RECHAZADO" ? danger(s) : warn(s || "—");
      return `${bold(`Pagos: ${items.length}`)}
${table(["Fecha", "Concepto", "Valor", "Estado", "Reserva", "Código de pago"], items.slice(0, 50).map((i) => [(g(i, "payment_at") || g(i, "created_at")).slice(0, 16), g(i, "concept").replace(/^RESERVA /, ""), g(i, "total_format").trim() || g(i, "total"), status(g(i, "status")), g(i, "booking_id"), g(i, "payment_code")]), [16, 44, 16, 10, 8, 36])}
${dim("Comprobante de un pago aprobado: https://portalciudadano.idrd.gov.co/app/pagos/comprobante/<código de pago>")}`;
    },
    nextSteps: items[0] && items[0].payment_code ? [{ command: `cupo idrd pay status ${String(items[0].payment_code)}`, description: "detalle del pago más reciente" }] : []
  };
}
function scalarLine(x) {
  if (!x || typeof x !== "object")
    return String(x);
  return Object.entries(x).filter(([, v]) => v !== null && v !== undefined && typeof v !== "object").slice(0, 8).map(([k, v]) => `${muted(`${k}:`)} ${String(v)}`).join("  ");
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
      return { name: "idrd-publico", ok: courts.length > 0, detail: `${courts.length} canchas de tenis · ${Date.now() - t0} ms` };
    },
    async () => {
      const t0 = Date.now();
      const pools = await listPools();
      return { name: "cefe-publico", ok: pools.length > 0, detail: `${pools.length} piscinas · ${Date.now() - t0} ms` };
    },
    async () => {
      const s = currentSession(ctx.flags.profile);
      return { name: "cefe-sesion", ok: true, detail: s ? `${s.email} · vence ${s.expiresAt}` : "sin sesión (solo lectura disponible)" };
    },
    async () => {
      const s = currentSession2(ctx.flags.profile);
      if (!s)
        return { name: "idrd-sesion", ok: true, detail: "sin sesión (solo lectura disponible)" };
      const { token, refreshed } = await accessToken(ctx.flags.profile);
      const u = await me(token);
      return { name: "idrd-sesion", ok: true, detail: `${u.email} · vence ${s.expiresAt}${refreshed ? " · renovada" : ""}` };
    },
    async () => {
      const email = knownEmail2(ctx.flags.profile);
      const where = passwordLocation2(email);
      const insecure = envFileInsecure();
      return { name: "credenciales", ok: !insecure, detail: insecure ? `${envFilePath()} es legible por otros usuarios: chmod 600` : where ? `IDRD: contraseña guardada en ${where === "keychain" ? "el Llavero" : envFilePath()} (sesión se renueva sola)` : `IDRD: sin contraseña guardada (almacén: ${secretBackend()}); guárdala con \`cupo idrd auth login --save\`` };
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
    fail("usage/bad-arg", "Usa: cupo killswitch on|off|status");
  const state = getKillswitchState(appHome());
  return {
    data: state,
    human: () => state.active ? `${danger("■")} Killswitch ACTIVO: reservas y pagos bloqueados.` : `${ok("■")} Killswitch apagado.`
  };
}
async function schema() {
  const data = {
    schemaVersion: SCHEMA_VERSION,
    cli: "cupo",
    version: VERSION,
    envelope: {
      success: "{ok:true, schemaVersion, command, data, nextSteps[], meta?}",
      error: "{ok:false, schemaVersion, command, error:{code, message, hint?}}"
    },
    exitCodes: { ok: 0, unknown: 1, usage: 2, auth: 3, notFound: 4, refused: 5, upstream: 6 },
    env: ["CUPO_HOME", "CUPO_PROFILE", "CUPO_JSON", "CUPO_SECRETS", "IDRD_PASSWORD", "IDRD_EMAIL", "CEFE_PASSWORD", "CEFE_EMAIL", "NO_COLOR"],
    envFile: envFilePath(),
    globalFlags: GLOBAL_FLAGS,
    start: ["cupo providers", "cupo find --sport pool --date sab", "cupo book <id de find>"],
    providers: PROVIDERS.map((p) => ({ id: p.id, name: p.name, web: p.web, covers: p.covers, sports: p.sports, login: p.login })),
    commands: COMMANDS.map((c) => ({ ...c, provider: providerOf(c.name) }))
  };
  return { data, human: () => JSON.stringify(data, null, 2) };
}
var GROUPS = [["cupo", "El job (todos los proveedores)"], ["idrd", "IDRD · Portal Ciudadano"], ["cefe", "CEFE Chapinero"]];
function helpText(only) {
  const lines = [bold(only ? `cupo ${only}` : "cupo") + dim(only ? ` — ${GROUPS.find(([g]) => g === only)[1]} · parte de cupo` : " — consigue cupo para hacer deporte en Bogotá (IDRD + CEFE Chapinero), no oficial"), "", bold("Comandos:")];
  const w = Math.max(...COMMANDS.map((c) => c.name.length)) + 1;
  const groups = only ? GROUPS.filter(([g]) => g === only) : GROUPS;
  for (const [g, title] of groups) {
    lines.push("", dim(`# ${title}`));
    for (const c of COMMANDS.filter((x) => providerOf(x.name) === g))
      lines.push(`  ${c.name.padEnd(w)} ${c.summary}${c.trust === "T3" ? warn("  [irreversible]") : ""}`);
  }
  lines.push("", bold("Globales:"), ...GLOBAL_FLAGS.map((f) => `  ${f.flag.padEnd(20)} ${f.description}`));
  lines.push("", dim(`Detalle de un comando: cupo ${only ?? "idrd"} <comando> --help · Contrato para agentes: cupo schema${only ? " · Todo: cupo --help" : ""}`));
  return lines.join(`
`);
}
function welcomeText(profile) {
  const idrd = currentSession2(profile);
  const cefe = currentSession(profile);
  const row = (n, cmd, what) => `   ${n}. ${strong(cmd.padEnd(48))} ${muted(what)}`;
  return [
    bold("Para empezar:"),
    row(1, "cupo find --sport tennis --date sab --from 8", "busca cupo en todos los proveedores"),
    row(2, "cupo book <id de find>", "vista previa; con --yes reserva de verdad"),
    row(3, "cupo idrd auth login --email tu@correo --save", "entra una vez; la sesión se renueva sola"),
    "",
    `  ${muted("Sesión IDRD:")} ${idrd ? ok(idrd.email) : muted("sin sesión")}   ${muted("CEFE Chapinero:")} ${cefe ? ok(cefe.email) : muted("sin sesión")}`,
    `  ${muted("Todos los comandos: cupo --help · Por proveedor: cupo idrd --help, cupo cefe --help · Para agentes: cupo schema")}`
  ].join(`
`);
}
function suggestCommands(words, max = 3) {
  const typed = words.slice(0, 3).join(" ").toLowerCase();
  const dist = (a, b) => {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1;j <= b.length; j++)
      d[0][j] = j;
    for (let i = 1;i <= a.length; i++)
      for (let j = 1;j <= b.length; j++)
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  };
  const typedWords = words.slice(0, 3).map((w) => w.toLowerCase());
  const wordScore = (w, cw) => cw === w || w.length > 2 && cw.startsWith(w) ? 0 : dist(w, cw);
  const scored = COMMANDS.map((c) => {
    const cws = c.name.toLowerCase().split(" ");
    const score = typedWords.reduce((sum, w) => sum + Math.min(2, ...cws.map((cw) => wordScore(w, cw))), 0);
    return { name: c.name, score };
  }).filter((x) => x.score <= Math.max(1, typedWords.length)).sort((a, b) => a.score - b.score || a.name.length - b.name.length);
  return scored.slice(0, max).map((x) => x.name);
}
function commandHelp(name) {
  const c = COMMANDS.find((x) => x.name === name);
  const args = (c.args ?? []).map((a) => `<${a.name}>`).join(" ");
  return [
    `${bold(`cupo ${c.name}`)} ${args}`,
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

// src/core/update.ts
import { spawn as spawn2 } from "node:child_process";
import { existsSync as existsSync9, mkdirSync as mkdirSync5, readFileSync as readFileSync10, writeFileSync as writeFileSync3 } from "node:fs";
import { dirname as dirname2, join as join10, resolve } from "node:path";
var UPDATE_URL = "https://raw.githubusercontent.com/huayaney-exe/cupo-ciudadano-cli/main/package.json";
var UPDATE_TTL_MS = 24 * 3600000;
function updateCachePath() {
  return join10(appHome(), "update-check.json");
}
function updateChecksDisabled() {
  return Boolean(process.env.CUPO_NO_UPDATE_CHECK || process.env.CI || false);
}
function compareVersions(a, b) {
  const pa = a.replace(/^v/, "").split(/[.-]/).map((x) => Number(x) || 0);
  const pb = b.replace(/^v/, "").split(/[.-]/).map((x) => Number(x) || 0);
  for (let i = 0;i < 3; i++)
    if ((pa[i] ?? 0) !== (pb[i] ?? 0))
      return (pa[i] ?? 0) - (pb[i] ?? 0);
  return 0;
}
function readUpdateCache() {
  try {
    const file = updateCachePath();
    return existsSync9(file) ? JSON.parse(readFileSync10(file, "utf8")) : null;
  } catch {
    return null;
  }
}
function writeUpdateCache(cache) {
  mkdirSync5(appHome(), { recursive: true, mode: 448 });
  writeFileSync3(updateCachePath(), `${JSON.stringify(cache)}
`, { mode: 384 });
}
function repoDir(entry = process.argv[1] ?? "") {
  return resolve(dirname2(entry), "..");
}
function updateNotice(current, cache = readUpdateCache(), repo = repoDir()) {
  if (!cache?.latest || compareVersions(cache.latest, current) <= 0)
    return null;
  return `↑ cupo ${cache.latest} disponible (tienes ${current}). Actualiza: git -C ${repo} pull`;
}
function scheduleUpdateCheck(current, entry = process.argv[1]) {
  if (updateChecksDisabled() || !entry)
    return;
  const cache = readUpdateCache();
  if (cache && cache.current === current && Date.now() - Date.parse(cache.checkedAt) < UPDATE_TTL_MS)
    return;
  try {
    const child = spawn2(process.execPath, [entry, "__update-check"], { detached: true, stdio: "ignore", env: { ...process.env, CUPO_NO_UPDATE_CHECK: "" } });
    child.unref();
  } catch {}
}
async function runUpdateCheck(current, url = UPDATE_URL) {
  let cache = { checkedAt: new Date().toISOString(), current, latest: null };
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000), headers: { accept: "application/json", "user-agent": `cupo/${current}` } });
    if (!res.ok)
      throw new Error(`HTTP ${res.status}`);
    const pkg = await res.json();
    cache.latest = typeof pkg.version === "string" ? pkg.version : null;
  } catch (e) {
    cache = { ...cache, error: e instanceof Error ? e.message : String(e) };
  }
  writeUpdateCache(cache);
  return cache;
}

// src/cli.ts
import { existsSync as existsSync10, mkdirSync as mkdirSync6, writeFileSync as writeFileSync4 } from "node:fs";
import { join as join11 } from "node:path";

// src/commands/activities.ts
var fold3 = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
function ids(ctx, key) {
  const v = str(ctx.args, key);
  if (!v)
    return;
  const out = v.split(",").map((x) => Number(x.trim()));
  if (out.some((n) => !Number.isInteger(n) || n <= 0))
    fail("usage/bad-arg", `--${key} debe ser una lista de ids, ej. 43,27.`);
  return out;
}
function activityId(raw) {
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0)
    fail("usage/bad-id", `Id de actividad inválido: ${raw}.`, "Usa el id de `cupo idrd activity list`.");
  return n;
}
async function activityList(ctx) {
  let acts = await listActivities({ programIds: ids(ctx, "program"), stageIds: ids(ctx, "stage") });
  const text = str(ctx.args, "text") ?? str(ctx.args, "q");
  if (text)
    acts = acts.filter((a) => fold3(`${a.name} ${a.program} ${a.stage} ${a.parkName} ${a.address}`).includes(fold3(text)));
  const loc = str(ctx.args, "locality");
  if (loc)
    acts = acts.filter((a) => fold3(`${a.stage} ${a.parkName} ${a.address}`).includes(fold3(loc)));
  if (ctx.args.free)
    acts = acts.filter((a) => !a.paid);
  if (ctx.args.paid)
    acts = acts.filter((a) => a.paid);
  if (ctx.args.available)
    acts = acts.filter((a) => a.left > 0 && a.open && a.active);
  const age = str(ctx.args, "age") ? Number(str(ctx.args, "age")) : undefined;
  if (age !== undefined)
    acts = acts.filter((a) => (a.minAge ?? 0) <= age && age <= (a.maxAge ?? 200));
  acts.sort((a, b) => a.program.localeCompare(b.program) || a.name.localeCompare(b.name));
  const first = acts[0];
  return {
    data: acts,
    human: () => acts.length === 0 ? "No hay actividades con esos filtros." : `${bold(`Actividades: ${acts.length}`)}

${table(["ID", "Actividad", "Dónde", "Cuándo", "Edad", "Cupos", "Costo"], acts.map((a) => [
      strong(String(a.id)),
      a.name,
      a.stage || a.parkName,
      `${a.weekdays} ${a.hours}`.trim(),
      a.minAge !== null || a.maxAge !== null ? `${a.minAge ?? ""}–${a.maxAge ?? ""}` : "",
      a.left > 0 ? ok(`${a.left}/${a.quota}`) : muted(`0/${a.quota}`),
      a.paid ? `${a.rate} ${a.rateValue ?? ""}`.trim() : muted("gratis")
    ]), [7, 30, 24, 28, 7, 8, 12])}`,
    nextSteps: first ? [
      { command: `cupo idrd activity get ${first.id}`, description: "detalle, consentimientos y reglamento" },
      { command: `cupo idrd activity subscribe ${first.id} --person <profileId>`, description: "vista previa de la inscripción" }
    ] : [{ command: "cupo idrd activity programs", description: "ver programas con cupos" }]
  };
}
async function activityGet(ctx) {
  const id = activityId(positional(ctx.args, 0, "id"));
  const a = await getActivity(id);
  return {
    data: a,
    human: () => [
      bold(`${a.name} · ${a.program}`),
      `${muted("Dónde")}   ${a.stage || a.parkName} · ${a.address}`,
      `${muted("Cuándo")}  ${a.weekdays} ${a.hours} · ${a.startDate.slice(0, 10)} → ${a.endDate.slice(0, 10)}`,
      `${muted("Quién")}   ${a.minAge ?? "?"}–${a.maxAge ?? "?"} años${a.disability ? " · personas en situación de discapacidad" : ""}${a.teams ? " · por equipos" : ""}`,
      `${muted("Cupos")}   ${a.left} libres de ${a.quota} · ${a.open && a.active ? ok("inscripciones abiertas") : warn("inscripciones cerradas")}`,
      `${muted("Costo")}   ${a.paid ? `${a.rate} ${a.rateValue ?? ""}` : "gratis"}`,
      a.consent.length ? dim(`  ${a.consent.length} consentimiento(s) por aceptar (ver --json)`) : "",
      a.regulations.length ? dim(`  ${a.regulations.length} reglamento(s) (ver --json)`) : ""
    ].filter(Boolean).join(`
`),
    nextSteps: [{ command: `cupo idrd activity subscribe ${id} --person <profileId>`, description: "vista previa de la inscripción" }]
  };
}
async function activityPrograms() {
  const rows = await listPrograms();
  return {
    data: rows,
    human: () => rows.map((r) => `  ${strong(String(r.id).padEnd(4))} ${r.name}${r.count ? muted(`  (${r.count})`) : ""}`).join(`
`),
    nextSteps: [{ command: `cupo idrd activity list --program ${rows.find((r) => (r.count ?? 0) > 0)?.id ?? rows[0]?.id ?? 1}`, description: "actividades de un programa" }]
  };
}
async function activityStages() {
  const rows = await listStages();
  return {
    data: rows,
    human: () => rows.map((r) => `  ${strong(String(r.id).padEnd(4))} ${r.name}${r.parkName ? muted(` · ${r.parkName}`) : ""}${r.count ? muted(`  (${r.count})`) : ""}`).join(`
`),
    nextSteps: [{ command: `cupo idrd activity list --stage ${rows[0]?.id ?? 1}`, description: "actividades de un escenario" }]
  };
}
async function activityCategories() {
  const rows = await listCategories();
  return { data: rows, human: () => rows.map((r) => `  ${r.value.padEnd(22)} ${muted(r.name)}`).join(`
`) };
}
async function activityMine(ctx) {
  const { token } = await accessToken(ctx.flags.profile);
  const subs = await listSubscriptions(token);
  return {
    data: subs,
    human: () => subs.length === 0 ? "Sin inscripciones." : subs.map((s) => `  • ${JSON.stringify(s).slice(0, 160)}`).join(`
`)
  };
}
async function profileList(ctx) {
  const { token } = await accessToken(ctx.flags.profile);
  const [profiles, beneficiaries] = await Promise.all([listProfiles(token), listBeneficiaries(token).catch(() => [])]);
  const data = { profiles, beneficiaries };
  return {
    data,
    human: () => profiles.length === 0 ? "Sin perfiles. Completa tu perfil en el portal." : profiles.map((p) => `  ${strong(String(p.id ?? p.profile_id ?? "?").padEnd(8))} ${String(p.name ?? p.full_name ?? "")} ${muted(`doc ${String(p.document ?? "")}${p.age !== undefined ? ` · ${String(p.age)} años` : ""}${p.verified === false ? " · sin verificar" : ""}`)}`).join(`
`)
  };
}
function profileIdOf(p) {
  return Number(p.id ?? p.profile_id);
}
async function activitySubscribe(ctx) {
  const id = activityId(positional(ctx.args, 0, "id"));
  const profileId = Number(requireStr(ctx.args, "person", "--person"));
  if (!Number.isInteger(profileId) || profileId <= 0)
    fail("usage/bad-arg", "--person debe ser el id numérico de `cupo idrd profile list`.");
  const live = ctx.args.yes === true && !ctx.flags.dryRun;
  const intent = `activity${id}@profile${profileId}`;
  const { token } = await accessToken(ctx.flags.profile);
  const [a, profiles, subs] = await Promise.all([getActivity(id), listProfiles(token), listSubscriptions(token).catch(() => [])]);
  const person = profiles.find((p) => profileIdOf(p) === profileId);
  const age = person && person.age !== undefined && person.age !== null ? Number(person.age) : null;
  const already = subs.some((s) => Number(s.schedule_id ?? s.citizen_schedule_id ?? s.id) === id && Number(s.profile_id) === profileId);
  const k = getKillswitchState(appHome());
  const checks = [
    { name: "killswitch", ok: !k.active, detail: k.active ? `activo: ${k.reason}` : "apagado" },
    { name: "perfil", ok: Boolean(person), detail: person ? `${String(person.name ?? "")} (${String(person.document ?? "")})` : `no encontré el perfil ${profileId} en tu cuenta` },
    { name: "verificado", ok: !person || person.verified !== false, detail: person?.verified === false ? "el perfil no está verificado" : "ok" },
    { name: "inscripciones", ok: a.open && a.active, detail: a.open && a.active ? "abiertas" : "cerradas" },
    { name: "cupos", ok: a.left > 0, detail: `${a.left} libres de ${a.quota}` },
    { name: "edad", ok: age === null || (a.minAge ?? 0) <= age && age <= (a.maxAge ?? 200), detail: age === null ? "sin edad en el perfil" : `${age} años (${a.minAge ?? "?"}–${a.maxAge ?? "?"})` },
    { name: "repetida", ok: !already, detail: already ? "este perfil ya está inscrito" : "no estaba inscrito" }
  ];
  const ready = checks.every((c) => c.ok);
  const summary = `${a.name} · ${a.stage || a.parkName} · ${a.weekdays} ${a.hours}`;
  const body = { profile_id: profileId, terms: true, consent: a.consent.map((c) => c && typeof c === "object" && ("id" in c) ? c.id : c) };
  if (!live) {
    beginAudit(paths.audit(), { kind: "activity.subscribe", command: "activity subscribe", tier: "T2", profile: profileName(ctx.flags.profile), meta: { activityId: id, profileId, ready } }).dryRun();
    return {
      data: { dryRun: true, intent, ready, summary, request: { method: "POST", path: `/api/profiles/${profileId}/schedules/${id}`, body }, checks, consent: a.consent, regulations: a.regulations },
      human: () => [
        bold("Vista previa — no se inscribió a nadie"),
        `${muted("Qué")}  ${summary}`,
        "",
        ...checks.map((c) => `${c.ok ? ok("✓") : danger("✗")} ${c.name.padEnd(14)} ${muted(c.detail)}`),
        "",
        a.consent.length ? warn(`! Al confirmar aceptas ${a.consent.length} consentimiento(s) y los términos del IDRD.`) : "",
        ready ? `${dim("Para inscribir de verdad:")}
  cupo idrd activity subscribe ${id} --person ${profileId} --yes --confirm ${strong(intent)}` : danger("No se puede inscribir mientras haya checks en rojo.")
      ].filter(Boolean).join(`
`),
      nextSteps: ready ? [{ command: `cupo idrd activity subscribe ${id} --person ${profileId} --yes --confirm ${intent}`, description: "INSCRIPCIÓN REAL (se puede deshacer con activity unsubscribe)" }] : []
    };
  }
  if (k.active)
    fail("safety/killswitch", "Killswitch activo: escrituras bloqueadas.", "Desactívalo con `cupo killswitch off`.");
  const failed = checks.find((c) => !c.ok);
  if (failed)
    fail("safety/precheck", `No inscribo: ${failed.name} — ${failed.detail}`);
  await approveGate({ cliName: "cupo", flags: { json: ctx.flags.json, noInput: ctx.flags.noInput } }, { title: "Inscripción", summary }, { trust: "T3", yes: true, confirm: str(ctx.args, "confirm"), confirmAgainst: intent });
  const au = beginAudit(paths.audit(), { kind: "activity.subscribe", command: "activity subscribe", tier: "T2", profile: profileName(ctx.flags.profile), meta: { activityId: id, profileId } });
  try {
    const res = await subscribe(token, profileId, id, body);
    au.complete({ details: res.details });
    return {
      data: { activityId: id, profileId, message: res.message, subscriptionId: res.details },
      human: () => `${ok("✓")} ${res.message || "Preinscripción registrada."}${res.details ? ` ${muted(`(#${String(res.details)})`)}` : ""}
  ${dim("Revisa tu correo o `cupo idrd activity mine` para el estado.")}`,
      nextSteps: [{ command: "cupo idrd activity mine", description: "ver estado de la inscripción" }]
    };
  } catch (e) {
    au.fail({ error: e instanceof AppError ? e.code : String(e) });
    throw e;
  }
}
async function activityUnsubscribe(ctx) {
  const subId = positional(ctx.args, 0, "subscriptionId");
  const { token } = await accessToken(ctx.flags.profile);
  if (getKillswitchState(appHome()).active)
    fail("safety/killswitch", "Killswitch activo: escrituras bloqueadas.", "Desactívalo con `cupo killswitch off`.");
  await approveGate({ cliName: "cupo", flags: { json: ctx.flags.json, noInput: ctx.flags.noInput } }, { title: "Desinscribir", summary: `inscripción ${subId}` }, { trust: "T2", yes: ctx.args.yes === true });
  const au = beginAudit(paths.audit(), { kind: "activity.unsubscribe", command: "activity unsubscribe", tier: "T2", profile: profileName(ctx.flags.profile), meta: { subscriptionId: subId } });
  try {
    await unsubscribe(token, subId);
    au.complete({});
  } catch (e) {
    au.fail({ error: e instanceof AppError ? e.code : String(e) });
    throw e;
  }
  return { data: { subscriptionId: subId, unsubscribed: true }, human: () => `${ok("✓")} Inscripción ${subId} retirada.` };
}

// src/commands/gym.ts
function cop2(n) {
  const v = Number(n ?? 0);
  return Number.isFinite(v) ? v.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }) : String(n);
}
async function gymStatus(ctx) {
  const id = courtId(positional(ctx.args, 0, "id"));
  const { token } = await accessToken(ctx.flags.profile);
  const st = await gymMembershipStatus(token, id);
  const active = Boolean(st.active);
  let reservations = null;
  if (active && st.id !== undefined)
    reservations = await membershipReservations(token, String(st.id)).catch(() => null);
  const data = { gymId: id, active, status: st, reservations };
  return {
    data,
    human: () => active ? `${ok("●")} Mensualidad activa en el gimnasio ${bold(String(id))}${st.ends_at ? ` hasta ${st.ends_at}` : ""}${reservations ? `
  ${muted(`Reservas con la mensualidad: ${Array.isArray(reservations.items) ? reservations.items.length : "?"} · cambios esta semana: ${String(reservations.changes_this_week ?? 0)}`)}` : ""}` : `${warn("○")} Sin mensualidad activa en el gimnasio ${bold(String(id))}.`,
    nextSteps: active ? [{ command: `cupo idrd gym availability ${id}`, description: "cupos por día para usar la mensualidad" }] : [{ command: `cupo idrd gym quote ${id}`, description: "cuánto cuesta y qué vigencia tendría" }]
  };
}
async function gymQuote(ctx) {
  const id = courtId(positional(ctx.args, 0, "id"));
  const { token } = await accessToken(ctx.flags.profile);
  const q2 = await gymMembershipQuote(token, id);
  const data = { gymId: id, amount: Number(q2.amount ?? 0), validFrom: q2.valid_from ?? null, validTo: q2.valid_to ?? null, concept: q2.concept ?? null, quote: q2 };
  return {
    data,
    human: () => [
      bold(`Mensualidad · gimnasio ${id}`),
      `${muted("Valor")}     ${cop2(data.amount)}`,
      `${muted("Vigencia")}  ${data.validFrom ?? "?"} → ${data.validTo ?? "?"}`,
      data.concept ? `${muted("Concepto")}  ${String(data.concept)}` : ""
    ].filter(Boolean).join(`
`),
    nextSteps: [{ command: `cupo idrd gym buy ${id} --bank <código>`, description: "vista previa de la compra (no cobra nada)" }]
  };
}
async function gymAvailability(ctx) {
  const id = courtId(positional(ctx.args, 0, "id"));
  const { token } = await accessToken(ctx.flags.profile);
  const av = await gymMembershipAvailability(token, id);
  const days = Array.isArray(av.availability) ? av.availability : [];
  return {
    data: { gymId: id, days },
    human: () => days.length === 0 ? "El portal no publicó disponibilidad para la mensualidad." : days.map((d) => {
      const slots = Array.isArray(d.slots) ? d.slots : [];
      return `${bold(String(d.date))}
${slots.map((s) => `  ${Number(s.used ?? 0) >= Number(s.quota ?? 0) ? muted("○") : ok("●")} ${String(s.start_hour ?? s.start ?? "")} ${muted(`${String(s.used ?? 0)}/${String(s.quota ?? "?")}`)}`).join(`
`)}`;
    }).join(`
`)
  };
}
async function gymActive(ctx) {
  const { token } = await accessToken(ctx.flags.profile);
  const list = await gymMembershipActive(token);
  return { data: list, human: () => JSON.stringify(list, null, 2) };
}
async function gymBuy(ctx) {
  const id = courtId(positional(ctx.args, 0, "id"));
  const bank = str(ctx.args, "bank");
  const live = ctx.args.yes === true && !ctx.flags.dryRun;
  const intent = `gym${id}@membership`;
  const { token } = await accessToken(ctx.flags.profile);
  const [u, quote, status] = await Promise.all([me(token), gymMembershipQuote(token, id), gymMembershipStatus(token, id).catch(() => ({}))]);
  const amount = Number(quote.amount ?? 0);
  const k = getKillswitchState(appHome());
  const checks = [
    { name: "killswitch", ok: !k.active, detail: k.active ? `activo: ${k.reason}` : "apagado" },
    { name: "sesion", ok: u.hasProfile, detail: u.hasProfile ? u.email : `${u.email}: completa tu perfil en el portal` },
    { name: "mensualidad", ok: !status.active, detail: status.active ? `ya tienes una activa hasta ${String(status.ends_at ?? "?")}` : "sin mensualidad activa" },
    { name: "banco", ok: amount === 0 || Boolean(bank), detail: amount === 0 ? "gratis, no hace falta banco" : bank ? `PSE banco ${bank}` : "falta --bank <código> (cupo idrd pay banks)" }
  ];
  const ready = checks.every((c) => c.ok);
  const summary = `Mensualidad gimnasio ${id} · ${cop2(amount)} · ${String(quote.valid_from ?? "?")} → ${String(quote.valid_to ?? "?")}`;
  if (!live) {
    beginAudit(paths.audit(), { kind: "gym.membership.buy", command: "gym buy", tier: "T3", profile: profileName(ctx.flags.profile), meta: { gymId: id, amount, ready } }).dryRun();
    return {
      data: { dryRun: true, intent, ready, summary, amount, quote, checks, warning: "La compra crea una mensualidad y una orden de pago; el portal no permite cancelarla desde la API." },
      human: () => [
        bold("Vista previa — no se compró nada"),
        `${muted("Qué")}  ${summary}`,
        "",
        ...checks.map((c) => `${c.ok ? ok("✓") : danger("✗")} ${c.name.padEnd(13)} ${muted(c.detail)}`),
        "",
        ready ? `${dim("Para comprar de verdad:")}
  cupo idrd gym buy ${id}${bank ? ` --bank ${bank}` : ""} --yes --confirm ${strong(intent)}` : danger("No se puede comprar mientras haya checks en rojo.")
      ].join(`
`),
      nextSteps: ready ? [{ command: `cupo idrd gym buy ${id}${bank ? ` --bank ${bank}` : ""} --yes --confirm ${intent}`, description: "COMPRA REAL: crea la mensualidad y el link de pago" }] : []
    };
  }
  if (k.active)
    fail("safety/killswitch", "Killswitch activo: escrituras bloqueadas.", "Desactívalo con `cupo killswitch off`.");
  const failed = checks.find((c) => !c.ok);
  if (failed)
    fail("safety/precheck", `No compro: ${failed.name} — ${failed.detail}`);
  await approveGate({ cliName: "cupo", flags: { json: ctx.flags.json, noInput: ctx.flags.noInput } }, { title: "Compra de mensualidad", summary }, { trust: "T3", yes: true, confirm: str(ctx.args, "confirm"), confirmAgainst: intent });
  const a = beginAudit(paths.audit(), { kind: "gym.membership.buy", command: "gym buy", tier: "T3", profile: profileName(ctx.flags.profile), meta: { gymId: id, amount, bank: bank ?? null } });
  let membershipId = null;
  let payment = null;
  try {
    const created = await gymMembershipPurchase(token, id, { init: true });
    membershipId = created.membership_id === undefined || created.membership_id === null ? null : String(created.membership_id);
    const ip = await publicIp();
    const payload = membershipPaymentPayload(quote, u.profile, { membershipId, bankCode: amount === 0 ? "0" : bank, ip, email: u.email });
    const res = await transferBank(token, payload, amount === 0);
    const code = typeof res.payment === "string" ? res.payment : null;
    payment = { paymentCode: code, bankUrl: typeof res.bank_url === "string" ? res.bank_url : null, receiptUrl: code ? `${RECEIPT_BASE}${code}` : null };
    if (amount > 0 && !payment.bankUrl)
      fail("upstream/pse-unavailable", "PSE no devolvió link de pago.", "Intenta más tarde; la mensualidad quedó creada sin pagar.");
    a.complete({ membershipId, paymentCode: code });
  } catch (e) {
    a.fail({ error: e instanceof AppError ? e.code : String(e), membershipId });
    if (membershipId) {
      const err = e instanceof AppError ? e : new AppError("unknown", { name: "Unknown", human: String(e) });
      payment = { ok: false, error: { code: err.code, message: err.human } };
    } else
      throw e;
  }
  const data = { gymId: id, membershipId, amount, payment };
  return {
    data,
    human: () => [
      `${ok("✓")} Mensualidad creada${membershipId ? `: ${bold(membershipId)}` : ""} · ${summary}`,
      payment?.bankUrl ? `  ${bold("Link de pago PSE:")} ${String(payment.bankUrl)}` : "",
      payment && payment.ok === false ? danger(`  ✗ La mensualidad existe pero falló el pago: ${payment.error.message}`) : "",
      payment?.paymentCode ? dim(`  Cuando pagues: cupo idrd gym activate ${id} --code ${String(payment.paymentCode)}`) : ""
    ].filter(Boolean).join(`
`),
    nextSteps: payment?.paymentCode ? [
      { command: `cupo idrd pay status ${String(payment.paymentCode)}`, description: "ver si el pago quedó aprobado" },
      { command: `cupo idrd gym activate ${id} --code ${String(payment.paymentCode)}`, description: "activar la mensualidad con el pago aprobado" }
    ] : []
  };
}
async function gymActivate(ctx) {
  const id = courtId(positional(ctx.args, 0, "id"));
  const code = requireStr(ctx.args, "code");
  const { token } = await accessToken(ctx.flags.profile);
  await approveGate({ cliName: "cupo", flags: { json: ctx.flags.json, noInput: ctx.flags.noInput } }, { title: "Activar mensualidad", summary: `gimnasio ${id} · pago ${code}` }, { trust: "T2", yes: ctx.args.yes === true });
  const a = beginAudit(paths.audit(), { kind: "gym.membership.activate", command: "gym activate", tier: "T2", profile: profileName(ctx.flags.profile), meta: { gymId: id, code } });
  try {
    await gymMembershipPurchase(token, id, { payment_code: code });
    a.complete({});
  } catch (e) {
    a.fail({ error: e instanceof AppError ? e.code : String(e) });
    throw e;
  }
  const st = await gymMembershipStatus(token, id).catch(() => ({}));
  return {
    data: { gymId: id, active: Boolean(st.active), status: st },
    human: () => st.active ? `${ok("✓")} Mensualidad activada${st.ends_at ? ` hasta ${String(st.ends_at)}` : ""}.` : `${warn("!")} El portal aceptó el código pero aún no reporta la mensualidad activa.`,
    nextSteps: [{ command: `cupo idrd gym status ${id}`, description: "confirmar estado" }]
  };
}

// src/cli.ts
var HANDLERS = {
  find,
  book,
  providers,
  "idrd court list": courtList,
  "idrd court get": courtGet,
  "idrd court lanes": courtLanes,
  "idrd court sports": courtSports,
  "idrd slot list": slotList,
  "idrd slot find": slotFind,
  "idrd auth login": authLogin,
  "idrd auth status": authStatus,
  "idrd auth logout": authLogout,
  "idrd booking list": bookingList,
  "idrd booking create": bookingCreate,
  "idrd pay banks": payBanks,
  "idrd pay pse": payPse,
  "idrd pay status": payStatus,
  "idrd pay pending": payPending,
  "idrd pay history": payHistory,
  "idrd gym status": gymStatus,
  "idrd gym quote": gymQuote,
  "idrd gym availability": gymAvailability,
  "idrd gym active": gymActive,
  "idrd gym buy": gymBuy,
  "idrd gym activate": gymActivate,
  "idrd activity list": activityList,
  "idrd activity get": activityGet,
  "idrd activity programs": activityPrograms,
  "idrd activity stages": activityStages,
  "idrd activity categories": activityCategories,
  "idrd activity mine": activityMine,
  "idrd activity subscribe": activitySubscribe,
  "idrd activity unsubscribe": activityUnsubscribe,
  "idrd profile list": profileList,
  "cefe auth login": cefeLogin,
  "cefe auth status": cefeStatus,
  "cefe auth logout": cefeLogout,
  "cefe auth register": cefeRegister,
  "cefe me": cefeMe,
  "cefe pool list": cefePoolList,
  "cefe pool get": cefePoolGet,
  "cefe slot list": cefeSlotList,
  "cefe slot find": cefeSlotFind,
  "cefe booking create": cefeBookingCreate,
  "cefe booking list": cefeBookingList,
  "cefe booking cancel": cefeBookingCancel,
  "cefe course list": cefeCourseList,
  "cefe course get": cefeCourseGet,
  "cefe course mine": cefeCourseMine,
  "cefe course enroll": cefeCourseEnroll,
  "cefe class book": cefeClassBook,
  "cefe class cancel": cefeClassCancel,
  "cefe tournament list": cefeTournamentList,
  "cefe tournament get": cefeTournamentGet,
  "cefe tournament mine": cefeTournamentMine,
  "cefe tournament register": cefeTournamentRegister,
  "cefe tournament unregister": cefeTournamentUnregister,
  "cefe promo list": cefePromoList,
  doctor,
  killswitch,
  schema
};
var ALIASES2 = {
  "idrd find": ["idrd", "slot", "find"],
  "idrd space": ["idrd", "court"],
  "idrd activities": ["idrd", "activity"],
  "cefe find": ["cefe", "slot", "find"],
  "cefe pools": ["cefe", "pool", "list"],
  "cefe courses": ["cefe", "course", "list"]
};
async function main(argv) {
  const args = parseArgs(argv);
  const flags = parseGlobalFlags(args);
  let words = args._.slice();
  const two = words.slice(0, 2).join(" ");
  const alias = ALIASES2[two] ? { to: ALIASES2[two], n: 2 } : words[0] && ALIASES2[words[0]] ? { to: ALIASES2[words[0]], n: 1 } : undefined;
  if (alias)
    words = [...alias.to, ...words.slice(alias.n)];
  if (args.version) {
    process.stdout.write(isJson(flags) ? `${JSON.stringify({ ok: true, version: VERSION })}
` : `${VERSION}
`);
    return EXIT.ok;
  }
  if (words[0] === "__update-check") {
    await runUpdateCheck(VERSION);
    return EXIT.ok;
  }
  const human = !isJson(flags);
  if (human && !flags.quiet)
    scheduleUpdateCheck(VERSION);
  const welcomed = join11(appHome(), "welcomed");
  if (human && !flags.quiet && !args.noBanner && !process.env.CUPO_NO_BANNER && words.length > 0 && !existsSync10(welcomed)) {
    printBanner({ name: "cupo", version: VERSION, tagline: "Cupo para hacer deporte en Bogotá · IDRD + CEFE Chapinero · no oficial", gradient: ["#00B4D8", "#2E7D32"] });
    process.stderr.write(`${welcomeText(flags.profile)}

`);
    try {
      mkdirSync6(appHome(), { recursive: true, mode: 448 });
      writeFileSync4(welcomed, `${new Date().toISOString()}
`);
    } catch {}
  }
  const notice = () => {
    const n = human && !flags.quiet ? updateNotice(VERSION) : null;
    if (n)
      process.stderr.write(`
${n}
`);
  };
  if (words.length === 1 && (words[0] === "idrd" || words[0] === "cefe")) {
    const p = words[0];
    if (isJson(flags))
      process.stdout.write(`${JSON.stringify({ ok: true, schemaVersion: 1, command: p, data: { provider: p, commands: COMMANDS.filter((c) => providerOf(c.name) === p) }, nextSteps: [] })}
`);
    else
      process.stdout.write(`${helpText(p)}
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
      emitError("cupo", new AppError("usage/no-command", { name: "NoCommand", human: "Falta el comando.", hint: "Corre `cupo schema` para ver el contrato." }), flags);
      return EXIT.usage;
    }
    if (!args.noBanner)
      printBanner({ name: "cupo", version: VERSION, tagline: "Cupo para hacer deporte en Bogotá · IDRD + CEFE Chapinero · no oficial", gradient: ["#00B4D8", "#2E7D32"] });
    process.stderr.write(`${welcomeText(flags.profile)}
`);
    try {
      mkdirSync6(appHome(), { recursive: true, mode: 448 });
      writeFileSync4(welcomed, `${new Date().toISOString()}
`);
    } catch {}
    notice();
    return EXIT.ok;
  }
  const found = findCommand(words);
  const commandName = found?.spec.name ?? words.join(" ");
  if (!found) {
    const close = suggestCommands(words);
    const err = new AppError("usage/unknown-command", {
      name: "UnknownCommand",
      human: `Comando desconocido: ${words.join(" ")}`,
      hint: close.length ? `¿Quisiste decir: ${close.map((c) => `cupo ${c}`).join(" · ")}? Todos: cupo --help` : "Todos los comandos: cupo --help · Contrato para agentes: cupo schema"
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
    notice();
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
  process.stderr.write(`cupo: error inesperado: ${err instanceof Error ? err.message : String(err)}
`);
  process.exitCode = 1;
});
