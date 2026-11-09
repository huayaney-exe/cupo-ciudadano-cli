---
name: cupo
description: "Operate `cupo`, the unofficial CLI that finds and books places to do sport in Bogotá across public providers: the IDRD Portal Ciudadano (320 courts, pools per lane, grills, CEFE gyms, coliseums, sport schools) and the CEFE Chapinero (pools per 60-minute slot, swimming courses, tournaments). Use when the user wants to find a free slot, book a court, pool lane, grill, gym or class, enrol in a sport school, pay or cancel a booking, or mentions IDRD, a Bogotá park, a CEFE or CEFE Chapinero. Start with `cupo find` and `cupo book`; provider detail lives under `cupo idrd …` and `cupo cefe …`."
---

# cupo

Agent manual for the `cupo` CLI (formerly `idrd`; that name still works as an alias). Install (Node >= 20, no Bun needed): `git clone https://github.com/huayaney-exe/cupo-ciudadano-cli.git && cd cupo-ciudadano-cli && npm link`, then `cupo doctor`.

## The job in three commands

| Step | Command | Returns |
|---|---|---|
| Where is there a place? | `cupo find --sport <kind> --date <d> [--from H --to H] [--locality X] [--provider idrd\|cefe]` | `results[] = {provider, id ("idrd:11537" \| "cefe:<poolId>"), kind, name, where, lane?, free[]{start,end,places?}, bookCommand}`; `scanned{}`, `failed[]` |
| Book it | `cupo book <id> --date <d> (--hour H \| --time HH:MM) [provider flags] [--yes [--confirm <intent>]]` | the provider's preview, then its live result. IDRD is irreversible and needs `--confirm`; CEFE is cancellable (6 h) and needs only `--yes` |
| What covers what? | `cupo providers` · `cupo schema` | providers with coverage, sports, session state and login command; the full versioned contract with `start`, `providers`, and a `provider` per command |

Run `bookCommand` from a `find` result as-is: it already carries the right provider, id, date, hour and lane. Default sport is `pool`, default date is tomorrow.

## Ground rules

- **Bookings cannot be cancelled** (the portal has no cancel endpoint). Never run a live `booking create` unless the human explicitly asked for that exact court, date and hour in this conversation. Preview first, show the preview to the human, then execute.
- **You never pay.** For paid bookings, hand the human the `bankUrl`. Do not open it on their behalf unless asked.
- Never ask the human to paste their password into chat. Login uses `IDRD_PASSWORD` from their environment, `--password-stdin`, a password saved with `auth login --save` (macOS Keychain or `~/.cupo/env`, 0600), or the interactive no-echo prompt in their own terminal. Sessions last 8 h (IDRD) / 12 h (CEFE) and the IDRD portal revokes refresh tokens: with a saved password the CLI logs in again by itself, so ask the human to run `cupo idrd auth login --save` once instead of logging in every session.

## Output contract

Piped or `--json`: exactly one JSON object on stdout.

```json
{"ok":true,"schemaVersion":1,"command":"slot find","data":{…},"nextSteps":[{"command":"…","description":"…"}]}
{"ok":false,"schemaVersion":1,"command":"booking create","error":{"code":"slot/unavailable","message":"…","hint":"…"}}
```

Exit codes: `0` ok · `1` unknown · `2` usage or portal rule · `3` auth (login needed) · `4` not found · `5` refused (approval missing, killswitch, slot taken) · `6` portal/network.
Runtime contract: `cupo schema`. Per-command help: `idrd <cmd> --help --json`.

## Commands

Space kinds (`--sport`): `tennis` `padel` `pickleball` `synthetic` `natural` `pool` `grill` `gym` `coliseum` (Spanish aliases work: `piscina`, `asador`, `gimnasio`, `coliseo`). `cupo idrd space …` is an alias of `cupo idrd court …`.

| Command | What it returns |
|---|---|
| `cupo idrd find --date <d> [--sport <kind>] [--from H] [--to H] [--locality X] [--sport-id N]` | `data.results[] = {court, lane?, freeHours[], places?}` across every bookable space of that kind; pools are scanned lane by lane |
| `cupo idrd slot list <id> --date <d> [--free] [--lane N] [--sport-id N] [--document D]` | `data.kind`, `slots[] = {hour, available, quota?, used?}`, `blocks[] = {from, to, available}`, `freeRuns`, `weekDates` |
| `cupo idrd court list [--sport] [--locality] [--all]` | `data[] = {id, parkName, locality, address, sport, bookable, …}` — all pages |
| `cupo idrd court get <id>` | `kind`, park hours, surface, rules; `lanes[]` for pools, `sports[]` for coliseums |
| `cupo idrd court lanes <poolId>` / `cupo idrd court sports <coliseumId>` | `[{id, name, level, direction, quota}]` / `[{id, name}]` |
| `cupo idrd auth login --email <e> [--save]` / `auth status` / `auth logout [--forget]` | session state; status makes a live call |
| `cupo idrd booking create <id> --date <d> [--hour <h>] [--hours n] [--lane N] [--sport-id N] [--document D] [--adult-document-type T --adult-document N --adult-name "X"] [--bank <code>]` | **preview** `{dryRun:true, ready, intent, checks[]}` |
| `… --yes --confirm <intent>` | **live** `{booking:{bookingId, amount, free, lane, sportId, …}, payment}` |
| `cupo idrd pay banks` · `cupo idrd pay pse <bookingId> --bank <code> --yes [--open]` · `cupo idrd pay status <code>` | banks · `{bankUrl, paymentCode}` · gateway status |
| `cupo idrd pay pending` · `cupo idrd pay history` · `cupo idrd booking list` | account payments and bookings (auth) |
| `cupo idrd gym status <gymId>` · `gym quote <gymId>` · `gym availability <gymId>` · `gym active` | membership state, price and validity, places per day (auth) |
| `cupo idrd gym buy <gymId> --bank <code>` → `… --yes --confirm gym<id>@membership` | **preview** / **live** `{membershipId, payment{bankUrl, paymentCode}}` |
| `cupo idrd gym activate <gymId> --code <paymentCode> --yes` | activates the membership after PSE approves |
| `cupo idrd activity list [--program ids] [--stage ids] [--text X] [--locality X] [--age N] [--free\|--paid] [--available]` | `data[] = {id, program, name, stage, weekdays, hours, minAge, maxAge, quota, left, paid, open, consent[]}` — all pages |
| `cupo idrd activity get <id>` · `activity programs` · `activity stages` · `activity categories` | detail · programs with counts · stages (the CEFE are stages) · sport categories |
| `cupo idrd profile list` · `cupo idrd activity mine` | account profiles (holder + beneficiaries) · current enrolments (auth) |
| `cupo idrd activity subscribe <activityId> --person <profileId>` → `… --yes --confirm activity<a>@profile<p>` | **preview** `{ready, checks[], consent[]}` / **live** `{subscriptionId}` |
| `cupo idrd activity unsubscribe <subscriptionId> --yes` | removes an enrolment |
| `cupo doctor` · `cupo killswitch on\|off\|status` · `cupo schema` | |

Dates: `YYYY-MM-DD`, `hoy`, `mañana`, or `lun…dom` (next occurrence, today included). Hours: `6`, `6am`, `"6:00 AM"`, `18`, `6pm`. Times are Bogotá local.

How each kind differs:
- **Courts**: exclusive by the hour; max 2 h, 24 h in advance, published week only.
- **Pools**: `--lane` is mandatory (the portal returns an empty calendar without it); `quota`/`used` give places per hour; CEFE pools accept a beneficiary `--document` and, for ages 5–12, the three `--adult-*` flags (the portal then creates a twin booking for the adult).
- **Grills**: one published block per day (e.g. 8 AM–4 PM); `booking create` without `--hour` takes the first free block whole.
- **Gyms** (CEFE "OTRO(MÓDULO)"): hourly with places, or a monthly membership via `gym *`.
- **Coliseums**: `--sport-id` from `court sports` is mandatory to book; multi-hour blocks (12–2 PM) must be booked inside one block.

## Workflows

**"Find me tennis before work this week"**
```bash
cupo idrd find --date mie --from 6 --to 9 --json
cupo idrd find --date vie --from 6 --to 9 --json
```
Report court, park, locality and free ranges. If nothing is free, try other days or `--sport padel`.

**"Book it"** (only after the human picked court + date + hour)
```bash
cupo idrd booking create 11537 --date 2026-11-06 --hour 16 --json     # read data.ready and data.checks
# show the human: where, when, checks, and that it cannot be cancelled
cupo idrd booking create 11537 --date 2026-11-06 --hour 16 --yes --confirm 11537@2026-11-06T16x1 --json
```
- `data.booking.free == true` → confirmed; share `data.payment.receiptUrl`.
- Paid → `cupo idrd pay banks`, ask which bank, then `cupo idrd pay pse <bookingId> --bank <code> --yes --json` and give the human `data.bankUrl`. The portal holds the booking only a few minutes for payment.
- One-shot when the human already named the bank: add `--bank <code>` to the live `booking create`.

**Errors to handle**
- `auth/required`, `auth/expired` (exit 3) → ask the human to run `cupo idrd auth login --save` in their terminal (once; afterwards the session renews itself). `auth status` reports `passwordStored`.
- `usage/unknown-command` (exit 2) → `hint` lists the closest command names; `cupo idrd --json` / `cupo cefe --json` return that provider's command specs; `cupo schema` the whole contract.
- `rule/violation` (exit 2) → explain the rule (max 2 h/day, 4 h/week, 24 h advance, only the published week, Mondays open at 9 am).
- `slot/unavailable` (exit 5) → re-run `cupo idrd slot list` and offer alternatives.
- `approval/confirm-mismatch` → the intent changed; re-run the preview and use its new intent.
- `safety/killswitch` → the human disabled writes on purpose; do not turn it off yourself.

**"Is there a lane at a pool on Saturday morning?"**
```bash
cupo idrd find --sport pool --date sab --from 6 --to 10 --json     # every pool, every lane, places per hour
cupo idrd slot list 16893 --lane 3 --date sab --json
```

**"Enrol my kid in a swimming school at the CEFE"**
```bash
cupo idrd activity stages --json                 # CEFE TUNAL = 1, FONTANAR = 2, SAN CRISTOBAL = 3 …
cupo idrd activity list --stage 3 --age 8 --available --json
cupo idrd profile list --json                    # pick the child's profile id
cupo idrd activity subscribe <activityId> --person <profileId> --json          # preview: checks, consents to accept
cupo idrd activity subscribe <activityId> --person <profileId> --yes --confirm activity<a>@profile<p> --json
```
Show the human the consents listed in the preview before confirming. Enrolments can be undone with `activity unsubscribe`.

## CEFE Chapinero (`cupo cefe …`)

Different platform and account (cefechapinero.com). Password from `CEFE_PASSWORD`, `--password-stdin`, a saved one (`auth login --save`) or the TTY prompt; session in `~/.cupo/cefe/`. No refresh endpoint: with a saved password the CLI logs in again by itself; otherwise `auth/expired` → ask the human to run `cupo cefe auth login`.

| Command | What it returns |
|---|---|
| `cupo cefe pool list [--all]` · `cefe pool get <pool>` | pools (`poolId`, capacity, hours); detail with slot config and public rating. `<pool>` is a poolId or a name fragment (`semiolimpica`) |
| `cupo cefe slot list <pool> --date <d> [--free]` | `slots[] = {time, start, end, capacity, reserved, free, available}`, `priceEstimate` |
| `cupo cefe find --date <d> [--from HH:MM --to HH:MM]` | free slots across active pools |
| `cupo cefe auth login --email <e>` · `auth status` · `auth logout` · `cefe me` | session; `me` lists dependents (1-based for `--dependent`) and `missingForBooking` |
| `cupo cefe booking create <pool> --date <d> --time HH:MM [--dependent 1,2] [--pay efectivo\|wompi\|creditos] [--notes X]` | **preview** `{ready, checks[], price, pay, request}`; `--yes` → **live** `{reservation{id, status}, payUrl?}` |
| `cupo cefe booking list [--upcoming] [--date\|--from --to] [--status]` · `cefe booking cancel <id> --yes` | reservations with `cancellable`; cancel allowed > 6 h before start |
| `cupo cefe course list [--text X] [--available]` · `cefe course get <course> [--from --to]` · `cefe course mine` | courses with stratum prices; classes with places; enrolments + booked classes |
| `cupo cefe course enroll <course> [--pay efectivo\|wompi]` · `cefe class book <course> --date <d>` · `cefe class cancel <course> --date <d> --yes` | preview first; `--yes` executes. The web has these disabled since 2026-07-30: the `portal` check is red and live refuses |
| `cupo cefe tournament list\|get <id>\|mine` · `cefe tournament register <id> --competition <c> [--dependent doc] [--sex M\|F] --yes` · `… unregister … --yes` | tournaments and competitions (auth) |
| `cupo cefe promo list` · `cupo cefe auth register … --accept-habeas-data` | promotions (purchase on the website); account creation (consent flag required) |

Rules the CLI checks before a booking: slot published that day, places ≥ people, one reservation per day, profile has phone, stratum and birth date. Price: free before 2026-11-05, then 10,000 COP per person per hour. Payment stays with the human: `efectivo` at the venue, `wompi` on cefechapinero.com. Everything behind login is implemented from the site's own code and unverified live; read the error's message if the server disagrees.

## Limits

- The portal publishes one week at a time; future weeks open Mondays at 9:00 a.m.
- Exercised live (2026-11-06, agent-driven): `idrd booking create --yes --confirm` for a paid tennis court, `idrd pay pse --bank 1007 --yes`, `idrd pay status <paymentCode>` → `Aprobado`, `idrd pay history`, `idrd pay pending`, `idrd booking list`. The hold after `booking create` lasts 15 minutes; `pay status` takes the payment code or the booking number (resolved through the payment history); a bank rejection shows as `FALLIDO`/`NOT_AUTHORIZED` in `pay history` with no charge.
- Not exercised live (implemented from the portal's own frontend code, covered by contract tests against a mock): gym membership purchase/activation, activity subscribe/unsubscribe. The first real run of each confirms the shape; errors carry the portal's message.
- The 4 h/week cap is enforced by the portal, not pre-checked by the CLI.
- Not covered: Daviplata payment (PSE only), the recreation calendar (`/api/recreation`), social programs and the contractor portal.
