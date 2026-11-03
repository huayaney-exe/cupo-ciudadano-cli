/**
 * Upstream free text (park names, requirement text, error messages) is
 * untrusted: it reaches an agent's context. Strip control and ANSI escapes,
 * collapse whitespace, and cap length so it reads as data, not instructions.
 */
const ANSI = /\x1b\[[0-9;?]*[ -/]*[@-~]/g;
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩]/g;

/**
 * Some portal strings arrive UTF-8-encoded twice ("NÂ° 1" for "N° 1").
 * Re-decode only when the result is clean, so correct text is never touched.
 */
/**
 * Some portal strings arrive UTF-8-encoded twice ("NÂ° 1" for "N° 1"),
 * sometimes through Windows-1252 ("PEÃ‘ALOSA"). Re-decode only when the
 * result is valid UTF-8, so correct text is never touched.
 */
const CP1252: Record<string, number> = {
  "€": 0x80, "‚": 0x82, "ƒ": 0x83, "„": 0x84, "…": 0x85, "†": 0x86, "‡": 0x87, "ˆ": 0x88, "‰": 0x89,
  "Š": 0x8a, "‹": 0x8b, "Œ": 0x8c, "Ž": 0x8e, "‘": 0x91, "’": 0x92, "“": 0x93, "”": 0x94, "•": 0x95,
  "–": 0x96, "—": 0x97, "˜": 0x98, "™": 0x99, "š": 0x9a, "›": 0x9b, "œ": 0x9c, "ž": 0x9e, "Ÿ": 0x9f,
};

export function fixMojibake(s: string): string {
  if (!/[ÃÂ][\u0080-\u00BF€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]/.test(s)) return s;
  const bytes: number[] = [];
  for (const ch of s) {
    const code = ch.codePointAt(0)!;
    if (code <= 0xff) bytes.push(code);
    else if (CP1252[ch] !== undefined) bytes.push(CP1252[ch]!);
    else return s;
  }
  const repaired = Buffer.from(bytes).toString("utf8");
  return repaired.includes("\uFFFD") ? s : repaired;
}

export function cleanText(value: unknown, max = 500): string {
  if (value === null || value === undefined) return "";
  let s = fixMojibake(String(value)).replace(ANSI, "").replace(CONTROL, "");
  s = s.replace(/\s+/g, " ").trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/** Same as cleanText but keeps line breaks (for multi-line rules text). */
export function cleanBlock(value: unknown, max = 4000): string {
  if (value === null || value === undefined) return "";
  let s = fixMojibake(String(value)).replace(ANSI, "").replace(CONTROL, "");
  s = s.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}
