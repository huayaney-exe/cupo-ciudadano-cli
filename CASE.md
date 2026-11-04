---
cli: cupo (formerly idrd)
target: Bogotá IDRD Portal Ciudadano — every bookable space (courts, pools per lane, grills, CEFE gyms by hour or membership, coliseums per sport), sport schools and programs with enrolment, account payments, PSE payment link
origin: discovered
terrain: B
built: 2026-11-03
status: internal
distribution: source (Node bundle via bun build, npm link)
---

# cupo

## What it does

Thirty-four commands over a Vue SPA's REST backend. Spaces: list every kind the
portal books (5 court sports, pools, grills, gyms, coliseums), read real
availability (reservable minus reserved; places for capacity spaces; blocks for
grills) for one space or scan all of them (pools lane by lane), preview and
create a booking, return the PSE `bank_url` for paid ones. Gyms: membership
status, quote, availability, purchase and activation. Activities: schools and
programs with filters, detail, programs, stages (the CEFE), categories,
profiles, enrol and un-enrol. Account: pending payments and history. Free
bookings are confirmed automatically. Payment itself stays with the human.

The second pass (same day) grew the surface from 15 to 34 commands after the
owner asked for 100% of the portal's services. The first pass had covered 50 of
320 courts (page 1 of a paginator) and one of three service families.

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
`bun build --target=node` emits a single 88 KB `dist/cupo.js` with a Node
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

- **Court lists were silently truncated to the first page.** Every list
  endpoint is a Laravel paginator (10 per page); recon's own fixture said
  `total: 88` for tennis but both recon and the build read `data` and ignored
  `meta`. The CLI scanned 50 of 320 courts and told a human there was nothing
  in Chapinero. The tell was five sports returning exactly 10 rows each. Fixed
  with `per_page` plus a `last_page` loop and two contract tests (a mock that
  caps pages, one that honours `per_page`).

- **Wrong host path read as a WAF.** The CEFE backend sits under an API
  Gateway stage (`…/main`); `new URL("/pools", base)` silently dropped it and
  every call got 403 "Forbidden", indistinguishable from a bot check. A
  header bisection was the wrong instinct (and was blocked); reading the URL
  the client actually built was the right one. Fixed in `request()`.

## Third pass: a second target in the same binary (2026-11-04)

The owner's CEFE Chapinero is not an IDRD facility; it runs its own platform.
Recon (`docs/recon-cefe.md`) came from the Next.js bundle's service classes
plus seven anonymous replays. Added as `cupo cefe …` (24 commands): pools and
per-slot places, bookings (T2, cancellable), courses and classes, tournaments,
promotions, profile. Writes mirror the SPA's payloads and are unexercised live.

## Fourth pass: rename to the job (2026-11-04)

With two providers the name `idrd` described a supplier, not the outcome.
Renamed to `cupo` ("conseguir cupo" is the Bogotá phrase for getting a place
in a pool, court or class). Three cross-provider commands were added above
the providers: `find` (every result carries its `bookCommand`), `book`
(routes by `idrd:`/`cefe:` id prefix), `providers` (the map). Provider
commands moved under `cupo idrd …` / `cupo cefe …`; the old binary name stays
as an alias and the old home and env names are still read. The mechanical
rename was one script over 143 command strings and 141 test argv arrays; the
two bugs it introduced (an arg named `id` became `idrd id`; envelope names got
double-prefixed) were caught by the suite in one run.

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
- Contract: `cupo schema`; shapes in `src/registry.ts`
- Agent manual: `skills/cupo/SKILL.md` (frontmatter validated)
- Tests: 99 pass, 0 fail across 9 files (unit, contract with mock portal, agent-first subprocess rules incl. real-TTY checks) — `bun run check`
- Linked globally (`npm link`) and run by name against the live portal for all
  nine space kinds, pool lanes, coliseum sports, activities, PSE banks, and a
  404 path
- Design and decisions: `DESIGN.md`; friction log: `friction.md`
