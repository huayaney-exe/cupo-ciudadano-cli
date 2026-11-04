# idrd — design record

## Phase 0: contract origin — **discovered**

The CLI wraps a system we do not control (IDRD Portal Ciudadano). Recon ran first and this build starts from [`docs/recon.md`](docs/recon.md). Every endpoint, field name and payload here was observed live or read from the portal's own Vue bundle (lazy chunk `5505`, the scenario-booking component). Nothing is guessed: where a call could not be exercised live, it is listed under *Unverified* below.

## Phase 1: distribution — **Node bundle, linked from source**

- Audience: the owner and the owner's agents, on one Mac. Not published.
- Written against Node's API surface only (`fs`, `path`, `os`, `crypto`, global `fetch`), so the target is a build decision.
- `bun build --target=node` → `dist/idrd.js` with a `#!/usr/bin/env node` shebang, so installing does not require Bun (the corpus failure the skill warns about). Bun is a dev tool only (build + tests).
- **The built bundle is committed** (`dist/idrd.js`, ~146 KB, dependencies inlined). Install is `git clone` + `npm link` with only Node: no Bun, no build step. The first README said "no Bun needed" while its install block ran `bun install && bun run build` — contradicted by the instructions themselves. Trade-off: `dist/` can drift from `src/`; `bun run verify:dist` rebuilds and fails if the committed bundle differs.
- Install: `git clone … && cd portal-ciudadano-cli && npm link`.

## Phase 2: command surface

Noun-verb, English verbs agents already know (`list`, `get`, `create`), Spanish human output. Shorthand for the 90% operation: `idrd find` = `idrd slot find`.

| Command | Trust | Auth | Notes |
|---|---|---|---|
| `court list` / `court get` / `court lanes` / `court sports` | T0 | no | public; 9 space kinds (5 court sports, pools, grills, gyms, coliseums), every page |
| `slot list` / `slot find` (`find`) | T0 | no | availability = reservable − reserved; pools per lane with places; grills as blocks; coliseums per sport |
| `auth login` / `status` / `logout` | T1/T0/T1 | — | OAuth password grant, 8 h token, refresh token |
| `booking list` | T0 | yes | portal + local ledger |
| `booking create` | **T3** | yes | preview by default; `--yes --confirm <intent>` to execute; **irreversible**. Intent binds space, date, hour, duration, lane and sport |
| `pay pending` / `pay history` | T0 | yes | account payments |
| `gym status` / `quote` / `availability` / `active` | T0 | yes | CEFE gym membership reads |
| `gym buy` | **T3** | yes | creates the membership and the PSE order; `--yes --confirm gym<id>@membership` |
| `gym activate` | T2 | yes | posts the approved payment code |
| `activity list` / `get` / `programs` / `stages` / `categories` | T0 | no | schools and programs, every page |
| `activity mine` / `profile list` | T0 | yes | |
| `activity subscribe` | T2 (gated like T3) | yes | enrols a profile; accepts the activity's consents; reversible |
| `activity unsubscribe` | T2 | yes | |
| `pay banks` | T0 | no | public |
| `pay pse` | **T2** | yes | creates the PSE order, returns `bank_url`; `--yes` required |
| `pay status` | T0 | yes | |
| `doctor`, `schema`, `killswitch` | T0/T0/T1 | no | |

JSON contract: one object per invocation on stdout.

```
success: {ok:true, schemaVersion:1, command, data, nextSteps[], meta?}
error:   {ok:false, schemaVersion:1, command, error:{code, message, hint?}}
exit:    0 ok · 1 unknown · 2 usage/rule · 3 auth · 4 not found · 5 refused (approval, killswitch, slot taken) · 6 upstream/network
```

Per-command `data` shapes live in `src/registry.ts` (`output` field) and are served at runtime by `idrd schema`.

## Phase 4: safety, sized to the damage

The damage is real and asymmetric: **the portal has no cancel endpoint** (none in 358 chunks), a booking occupies a public slot other citizens could use, and a paid booking moves money through PSE. So:

- **Shape 3 + Shape 1 hybrid.** `booking create` is T3: without `--yes` it only previews. With `--yes` it additionally requires `--confirm <intent>` where the intent (`11537@2026-11-06T16x1`) is printed by the preview and binds court, date, hour and duration. Two differently-named flags with a domain-specific value cannot be typed by accident or pattern-filled.
- **Freshness-bounded preflight, on the real path.** Both preview and live re-read the court's schedule *at that moment*, apply the portal's published rules (`src/idrd/rules.ts`: max 2 continuous hours, 24 h advance, current week only, Monday 9 am opening) and check the session with a live `/api/user` call. Live refuses if any check is red — even with full confirmation.
- **Audit before, not after.** `beginAudit()` writes a `pending` record before the POST, then `ok`/`error` with the same `audit_id`. Day-bucketed JSONL in `~/.idrd/audit/`, mode 0600, no tokens or PII. A contract test asserts the pending record is on disk at the moment the mock receives the POST.
- **Killswitch.** `idrd killswitch on` (or `touch ~/.idrd/KILLSWITCH`) blocks every write regardless of flags.
- **Payment stays human.** The CLI never touches card or bank credentials. For paid bookings it returns the PSE `bank_url`; the human pays at their bank. Free bookings are confirmed through `transferBankFree` automatically as part of the same approved intent (that is what the portal's own UI does).
- **Web client, not hardcoded.** The portal's OAuth password grant needs its public web client id/secret, which every browser receives in `chunk-common.<hash>.js`. The CLI discovers them from that file at login (`src/idrd/webclient.ts`), caches them for 7 days (0600), re-discovers once on `invalid_client` (rotation), and honors `IDRD_CLIENT_ID`/`IDRD_CLIENT_SECRET`. Nothing is republished in this repo.
- **Secrets.** Password comes from `IDRD_PASSWORD`, `--password-stdin`, or a no-echo TTY prompt; it is never persisted (contract test greps every file under `IDRD_HOME`). Token stored 0600. Without TTY and without a password source, login fails fast with exit 3 — it never hangs.
- **Untrusted text.** Every upstream string goes through `cleanText` (strips ANSI, control and bidi characters, caps length, repairs double-encoded UTF-8) before it reaches an agent.
- **Real IP only.** PSE requires the payer's public IP. The portal's SPA falls back to a hardcoded IP when lookup fails; this CLI refuses instead of sending an address that is not the user's.

## Phase 3: cligentic blocks

Registered under `package.json.registries` (no `components.json` created). Installed to `src/cli/{agent,foundation,platform,safety}`.

| Block | Decision | Reason |
|---|---|---|
| argv | **hybrid** | Adopted, but wrapped: it parses `--json tennis` as `json="tennis"`. `src/core/args.ts` rewrites known boolean flags to `--flag=true` first. |
| global-flags | **hybrid** | Env vars renamed `CLI_JSON/CLI_PROFILE` → `IDRD_JSON/IDRD_PROFILE` to avoid collisions. |
| detect | adopt | `detectMode`/`shouldColor` are the single TTY/NO_COLOR decision. |
| json-mode | **hybrid** | Its `emit()` writes arrays as NDJSON and errors as `{ok,error}`; the published contract here is one envelope object with `nextSteps` inline and `error.code`. Kept transitively (next-steps, trust-ladder depend on it); `src/core/output.ts` owns emission. |
| next-steps | **hybrid** | Machine mode: steps go inside the envelope (stdout) rather than NDJSON on stderr, per the skill's "nextSteps in structured output". Human mode uses the block; header translated to Spanish. |
| trust-ladder | adopt | `approveGate` T3 (`--confirm` must equal intent) for `booking create`, T2 for `pay pse`. Throws structured errors in non-TTY — never prompts. |
| audit-lifecycle | adopt | pending → ok/error around every write. |
| session | adopt | token persistence, atomic, 0600. |
| config | adopt | stores the email identifier per profile. |
| atomic-write | adopt | via session/config and the local booking ledger. |
| error-map | adopt | `AppError` with code/hint; exit codes derived from the code family in `src/core/errors.ts`. |
| killswitch | **hybrid** | Uses `getKillswitchState`/`turnKillswitch*`; not `assertKillswitchOff`, which throws a plain `Error` with no code or exit mapping. |
| doctor | **hybrid** | `runDoctor` adopted; `renderDoctor` replaced to keep the envelope contract. |
| prompt-secret | **hybrid** | Adopted, but its label went to **stdout**, which would corrupt piped JSON. Patched to stderr. |
| style | adopt | semantic colors + visible-width padding for tables. |
| banner | adopt | TTY bare invoke only, on stderr. |
| open-url | adopt | `pay pse --open`. |
| copy-clipboard | reject | Not needed: the link is printed and in JSON. |
| notify-os | reject | No long-running watch command yet. |
| telemetry | reject | Personal tool; no value and a privacy cost. |
| api-key-wizard | reject | Auth is an OAuth password grant, not an API key. |
| skill-installer-prompt | reject | Interactive post-init prompt that changes the user environment; the agent manual ships as `skills/idrd/SKILL.md` instead. |
| xdg-paths | reject | One local home (`~/.idrd`, overridable with `IDRD_HOME`) is simpler for a single-machine tool. |

## Phase 5: wiring (grep-verified)

Every adopted symbol has a call site outside `src/cli/` (checked with grep on 2026-11-03): `parseArgv`, `parseGlobalFlags`, `detectMode`, `emitNextSteps`, `approveGate` ×2, `beginAudit`, `loadSession`/`saveSession`/`clearSession`, `loadConfig`/`saveConfig`, `AppError`, `runDoctor`, `promptSecret`, `shouldColor`, `printBanner`, `openUrl`, `getKillswitchState`, `turnKillswitchOn/Off`, `atomicWriteJson`, `visibleWidth`/`padVisible`/`truncateVisible`.

## Space kinds (added 2026-11-03, evening)

The portal's booking screen decides its form from `details.details.endowment`: `PISCINA` → pool (lane required, `quota`/`used_quota` per hour, CEFE pools take a beneficiary document and a responsible adult), `ASADERO` → grill (one published block per day), `OTRO(MÓDULO)` → gym (places per hour, or membership), `POLIDEPORTIVO` → coliseum (`sport_id` in the calendar query and the booking). `src/idrd/sports.ts` encodes the same mapping (`sportFromEndowment`) so `booking create` never needs to be told the kind. Capacity spaces reuse the reservable-minus-reserved difference: the server flips a full hour to `can:false` and keeps the numbers, which `hourSlots` carries through. Rules: the 2 h / 24 h prose rules apply to courts only; other kinds must fit inside one published block (`checkBookingRules({court:false, maxHours})`).

Activities are a different object (`/api/citizen-portal/public-schedules`): programs × stages × schedules with quotas, ages, price and consents. The portal filters by `program_id[]`/`stage_id[]`; everything else is filtered client-side after reading every page. Enrolment is `POST /api/profiles/{profileId}/schedules/{activityId}` with `{profile_id, terms, consent[]}`; removal is `DELETE /api/profiles/subscriptions/{id}`. `--person` (not `--profile`, which is the global account flag) names the profile.

## Verified vs unverified


**Verified live (anonymous), 2026-11-03:** web-client discovery from the portal frontend; lists for all 9 kinds read in full through the Laravel paginator (`per_page`/`meta.last_page`): 320 courts (167 reservable), 12 pools (10), 35 grills (31), 5 gyms, 4 coliseums; pool lanes and per-lane calendars with quotas (37 lanes scanned in one `find`); grill blocks; coliseum sports and calendars with `sport_id`; gym hourly quotas; activities (74, 2 pages), programs, stages, categories, activity detail; park and endowment details; the reservable-minus-reserved computation; PSE banks; error mapping (404 → exit 4). Gym membership, profiles, subscriptions and payments endpoints answer 401 anonymously, as expected.

**Verified live with the owner's account (2026-11-03, pure HTTP, before this build):** password grant (8 h + refresh token), `/api/user`, `/api/citizen-portal/bookings`.

**Implemented from the bundle, not exercised live** (no credentials available during the autonomous build, and the owner chose not to create a real booking):
- `POST /api/parks/schedules/{id}/payment` response shape (fields taken from the component that consumes it).
- `transferBankFree` / `transferBank` / `status` responses.
- The refresh grant (standard Passport; the SPA never uses it).
- Booking for non-tennis scenarios (synthetic fields may route through the legacy SIM system).
- The 4 h/week cap across the whole park system is not checked client-side (needs the shape of a non-empty `bookings` response).
- Gym membership: `status`/`quote`/`availability` response fields (`active`, `ends_at`, `amount`, `valid_from`, `valid_to`, `park_id`, `service_id`, `concept`, `availability[]`) and the purchase flow (`{init:true}` → `membership_id`; PSE payload with `membership_id` and no `reservationId`; `{payment_code}` to activate), all read from the SPA.
- Activities: `/api/profiles/list` and `/api/profiles/subscriptions` shapes, the subscribe body, and the DELETE.
- `/api/citizen-portal/pending-to-pay` and `/api/citizen-portal/payments` shapes (returned raw).

All of these are covered by contract tests against a mock that mirrors the observed shapes. The first real booking will confirm them; see `README.md` → "Primera reserva real".
