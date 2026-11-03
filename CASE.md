---
cli: idrd
target: Bogotá IDRD Portal Ciudadano — public park courts (tennis, pádel, pickleball, soccer), availability, booking, PSE payment link
origin: discovered
terrain: B
built: 2026-11-03
status: internal
distribution: source (Node bundle via bun build, npm link)
---

# idrd

## What it does

Fifteen commands over a Vue SPA's REST backend: list courts per sport, read real
availability (reservable minus reserved) for one court or scan all of them,
log in with the portal's OAuth password grant, preview and create a booking,
and return the PSE `bank_url` for paid bookings. Free bookings are confirmed
automatically. Payment itself stays with the human.

## Contract origin

Discovered. `surface-recon` ran first (`docs/recon.md`) and the build started
from it. The contract came from the portal's own bundle: an
endpoint table in the common chunk, and the booking/payment payloads in lazy
chunk `5505` (358 lazy chunks downloaded to find it). Auth was verified live
with the owner's account before the build; the write path was not exercised
live by the owner's decision (bookings are irreversible).

Recon got one thing wrong that the build caught: availability. The first scan
read `can:true` windows as free; the endpoint stacks reserved windows on top
of reservable ones, so the free set is a difference. A court reported as free
at 6 am was fully booked. The fix came with a test built from the live fixture,
and the owner was told the earlier report was wrong.

## Distribution choice

Source, for one person and their agents. Written against Node's API surface;
`bun build --target=node` emits a single 88 KB `dist/idrd.js` with a Node
shebang, so `npm link` works without Bun at runtime — avoiding the
runtime-specific-shebang defect the skill documents in the corpus.

## Blocks adopted

cligentic registered under `package.json.registries`; no `components.json`
created. 16 blocks installed: 10 adopted, 6 hybrid, 6 considered and
rejected. Full table in `DESIGN.md`. The hybrids are the interesting part:

| Block | Why hybrid |
|---|---|
| prompt-secret | label written to stdout; corrupts piped JSON → stderr |
| argv | `--json 11537` swallows the positional → boolean pre-pass |
| json-mode / next-steps | NDJSON + steps on stderr vs the skill's "nextSteps in structured output" → one envelope |
| global-flags | generic `CLI_*` env names → `IDRD_*` |
| killswitch | `assertKillswitchOff` throws a codeless `Error` → state getter + coded error |
| doctor | `renderDoctor` bypasses the envelope → own render |

## Safety

Graded per command, not per project. Reads are T0. `booking create` is T3
because the portal has no cancel endpoint: preview by default, live only with
`--yes --confirm <intent>`, where the intent binds court, date, hour and
duration. Both modes re-read the schedule and apply the portal's prose rules
(2 h/day, 24 h advance, current week, Monday 9 am) on the real path. Audit
`pending` is written before the POST — a contract test reads the audit file
from inside the mock at the moment it receives the POST. Killswitch blocks all
writes. The password is never persisted (a test greps every file in the home).

One deliberate deviation from the target's own client: when its IP lookup
fails, the portal's SPA sends a hardcoded IP to the payment gateway. The CLI
refuses instead.

## What broke

- **The Phase 5 wiring check lied.** zsh expanded `--include=*.ts` as a glob,
  grep searched nothing, and every block reported zero call sites. Quoting the
  pattern showed all 24 wired. A wiring check that can silently return zero is
  worse than none; the skill should say "quote the include pattern".
- **Test deadlock.** `spawnSync` blocked the event loop that served the
  in-process mock portal → 90 s timeouts. `Bun.spawn` fixed it. Getting a real
  TTY on macOS needed `script -q /dev/null` with stdin from `/dev/null`, plus
  stripping the `^D\b\b` it echoes.
- **A created booking could disappear from the output.** Self-review found
  that if the free-confirmation or PSE step failed after the booking POST
  succeeded, the command errored and the booking id — of something that cannot
  be cancelled — was lost. Now the booking is always reported, the payment step
  failure sits next to it, and the retry command is the next step. Test added.
- **Double-encoded UTF-8 upstream** (`NÂ° 1`, cp1252 `PEÃ‘ALOSA`). Repaired
  only when the re-decode is valid, so correct text is never touched.

## What the human-output pass caught that 63 green tests did not

- Per-hour lists ("4:00 PM, 5:00 PM, 6:00 PM…") truncated at column width →
  compact ranges ("4–10 PM").
- A "rules" summary that matched `máximo` inside a damages-liability paragraph.
- An English `Next steps:` header (from the block) in a Spanish CLI.
- A window label reading `00:00–24:00` instead of "todo el día".

## Before publishing

The first draft hardcoded the portal's public OAuth web-client secret. It is
served to every browser, so it is not the user's credential — but a public
repo should not republish it, and a hardcoded value breaks when the portal
rotates it. Replaced with runtime discovery from the portal's own frontend
file, a 7-day 0600 cache, one re-discovery on `invalid_client`, and an env
override. Verified live, plus three contract tests.

## What I would do differently

Compute availability as a set difference from the first recon scan, and verify
it against the portal UI by contrast before telling a human a slot is free.

Capture one real booking response during recon (with explicit consent and a
slot the human actually wants) so the write path is verified rather than
derived from frontend code.

## Evidence

- Code: `src` (CLI), `src/cli` (cligentic blocks)
- Contract: `idrd schema`; shapes in `src/registry.ts`
- Agent manual: `skills/idrd/SKILL.md` (frontmatter validated)
- Tests: 66 pass, 0 fail across 6 files (unit, contract with mock portal, agent-first subprocess rules incl. real-TTY checks) — `bun run check`
- Linked globally (`npm link`) and run by name against the live portal for all
  five sports, PSE banks, and a 404 path
- Design and decisions: `DESIGN.md`; friction log: `friction.md`
