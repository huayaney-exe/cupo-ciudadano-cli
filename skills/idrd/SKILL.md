---
name: idrd
description: "Operate the unofficial `idrd` CLI for Bogotá's IDRD Portal Ciudadano, covering every service the portal offers: find free slots in public courts (tennis, pádel, pickleball, soccer), pools (per lane, with places), grills (whole-day blocks), CEFE gyms (hourly places or monthly membership) and coliseums (per sport); book behind an explicit confirmation gate and get the PSE payment link; browse sport schools and programs (Escuelas de mi Barrio, Deporte de 0 a 100, CEFE activities) and enrol a profile; read pending payments and history. Also operates the separate CEFE Chapinero platform (cefechapinero.com) under `idrd cefe …`: pool places per 60-minute slot, free-practice bookings (cancellable), swimming courses and classes, tournaments, promotions. Use when the user mentions IDRD, a Bogotá public park, a CEFE, CEFE Chapinero, a court, pool, grill, gym or sports school."
---

# idrd

Agent manual for the `idrd` CLI. Install (Node >= 20, no Bun needed): `git clone https://github.com/huayaney-exe/portal-ciudadano-cli.git && cd portal-ciudadano-cli && npm link`, then `idrd doctor`.

## Ground rules

- **Bookings cannot be cancelled** (the portal has no cancel endpoint). Never run a live `booking create` unless the human explicitly asked for that exact court, date and hour in this conversation. Preview first, show the preview to the human, then execute.
- **You never pay.** For paid bookings, hand the human the `bankUrl`. Do not open it on their behalf unless asked.
- Never ask the human to paste their password into chat. Login uses `IDRD_PASSWORD` from their environment, `--password-stdin`, or the interactive no-echo prompt in their own terminal.

## Output contract

Piped or `--json`: exactly one JSON object on stdout.

```json
{"ok":true,"schemaVersion":1,"command":"slot find","data":{…},"nextSteps":[{"command":"…","description":"…"}]}
{"ok":false,"schemaVersion":1,"command":"booking create","error":{"code":"slot/unavailable","message":"…","hint":"…"}}
```

Exit codes: `0` ok · `1` unknown · `2` usage or portal rule · `3` auth (login needed) · `4` not found · `5` refused (approval missing, killswitch, slot taken) · `6` portal/network.
Runtime contract: `idrd schema`. Per-command help: `idrd <cmd> --help --json`.

## Commands

Space kinds (`--sport`): `tennis` `padel` `pickleball` `synthetic` `natural` `pool` `grill` `gym` `coliseum` (Spanish aliases work: `piscina`, `asador`, `gimnasio`, `coliseo`). `idrd space …` is an alias of `idrd court …`.

| Command | What it returns |
|---|---|
| `idrd find --date <d> [--sport <kind>] [--from H] [--to H] [--locality X] [--sport-id N]` | `data.results[] = {court, lane?, freeHours[], places?}` across every bookable space of that kind; pools are scanned lane by lane |
| `idrd slot list <id> --date <d> [--free] [--lane N] [--sport-id N] [--document D]` | `data.kind`, `slots[] = {hour, available, quota?, used?}`, `blocks[] = {from, to, available}`, `freeRuns`, `weekDates` |
| `idrd court list [--sport] [--locality] [--all]` | `data[] = {id, parkName, locality, address, sport, bookable, …}` — all pages |
| `idrd court get <id>` | `kind`, park hours, surface, rules; `lanes[]` for pools, `sports[]` for coliseums |
| `idrd court lanes <poolId>` / `idrd court sports <coliseumId>` | `[{id, name, level, direction, quota}]` / `[{id, name}]` |
| `idrd auth login --email <e>` / `auth status` / `auth logout` | session state; status makes a live call |
| `idrd booking create <id> --date <d> [--hour <h>] [--hours n] [--lane N] [--sport-id N] [--document D] [--adult-document-type T --adult-document N --adult-name "X"] [--bank <code>]` | **preview** `{dryRun:true, ready, intent, checks[]}` |
| `… --yes --confirm <intent>` | **live** `{booking:{bookingId, amount, free, lane, sportId, …}, payment}` |
| `idrd pay banks` · `idrd pay pse <bookingId> --bank <code> --yes [--open]` · `idrd pay status <code>` | banks · `{bankUrl, paymentCode}` · gateway status |
| `idrd pay pending` · `idrd pay history` · `idrd booking list` | account payments and bookings (auth) |
| `idrd gym status <gymId>` · `gym quote <gymId>` · `gym availability <gymId>` · `gym active` | membership state, price and validity, places per day (auth) |
| `idrd gym buy <gymId> --bank <code>` → `… --yes --confirm gym<id>@membership` | **preview** / **live** `{membershipId, payment{bankUrl, paymentCode}}` |
| `idrd gym activate <gymId> --code <paymentCode> --yes` | activates the membership after PSE approves |
| `idrd activity list [--program ids] [--stage ids] [--text X] [--locality X] [--age N] [--free\|--paid] [--available]` | `data[] = {id, program, name, stage, weekdays, hours, minAge, maxAge, quota, left, paid, open, consent[]}` — all pages |
| `idrd activity get <id>` · `activity programs` · `activity stages` · `activity categories` | detail · programs with counts · stages (the CEFE are stages) · sport categories |
| `idrd profile list` · `idrd activity mine` | account profiles (holder + beneficiaries) · current enrolments (auth) |
| `idrd activity subscribe <activityId> --person <profileId>` → `… --yes --confirm activity<a>@profile<p>` | **preview** `{ready, checks[], consent[]}` / **live** `{subscriptionId}` |
| `idrd activity unsubscribe <subscriptionId> --yes` | removes an enrolment |
| `idrd doctor` · `idrd killswitch on\|off\|status` · `idrd schema` | |

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
idrd find --date mie --from 6 --to 9 --json
idrd find --date vie --from 6 --to 9 --json
```
Report court, park, locality and free ranges. If nothing is free, try other days or `--sport padel`.

**"Book it"** (only after the human picked court + date + hour)
```bash
idrd booking create 11537 --date 2026-11-06 --hour 16 --json     # read data.ready and data.checks
# show the human: where, when, checks, and that it cannot be cancelled
idrd booking create 11537 --date 2026-11-06 --hour 16 --yes --confirm 11537@2026-11-06T16x1 --json
```
- `data.booking.free == true` → confirmed; share `data.payment.receiptUrl`.
- Paid → `idrd pay banks`, ask which bank, then `idrd pay pse <bookingId> --bank <code> --yes --json` and give the human `data.bankUrl`. The portal holds the booking only a few minutes for payment.
- One-shot when the human already named the bank: add `--bank <code>` to the live `booking create`.

**Errors to handle**
- `auth/required`, `auth/expired` (exit 3) → ask the human to run `idrd auth login` in their terminal.
- `rule/violation` (exit 2) → explain the rule (max 2 h/day, 4 h/week, 24 h advance, only the published week, Mondays open at 9 am).
- `slot/unavailable` (exit 5) → re-run `idrd slot list` and offer alternatives.
- `approval/confirm-mismatch` → the intent changed; re-run the preview and use its new intent.
- `safety/killswitch` → the human disabled writes on purpose; do not turn it off yourself.

**"Is there a lane at a pool on Saturday morning?"**
```bash
idrd find --sport pool --date sab --from 6 --to 10 --json     # every pool, every lane, places per hour
idrd slot list 16893 --lane 3 --date sab --json
```

**"Enrol my kid in a swimming school at the CEFE"**
```bash
idrd activity stages --json                 # CEFE TUNAL = 1, FONTANAR = 2, SAN CRISTOBAL = 3 …
idrd activity list --stage 3 --age 8 --available --json
idrd profile list --json                    # pick the child's profile id
idrd activity subscribe <activityId> --person <profileId> --json          # preview: checks, consents to accept
idrd activity subscribe <activityId> --person <profileId> --yes --confirm activity<a>@profile<p> --json
```
Show the human the consents listed in the preview before confirming. Enrolments can be undone with `activity unsubscribe`.

## CEFE Chapinero (`idrd cefe …`)

Different platform and account (cefechapinero.com). Password from `CEFE_PASSWORD`, `--password-stdin` or the TTY prompt; session in `~/.idrd/cefe/`. No refresh: `auth/expired` → ask the human to run `idrd cefe auth login`.

| Command | What it returns |
|---|---|
| `idrd cefe pool list [--all]` · `cefe pool get <pool>` | pools (`poolId`, capacity, hours); detail with slot config and public rating. `<pool>` is a poolId or a name fragment (`semiolimpica`) |
| `idrd cefe slot list <pool> --date <d> [--free]` | `slots[] = {time, start, end, capacity, reserved, free, available}`, `priceEstimate` |
| `idrd cefe find --date <d> [--from HH:MM --to HH:MM]` | free slots across active pools |
| `idrd cefe auth login --email <e>` · `auth status` · `auth logout` · `cefe me` | session; `me` lists dependents (1-based for `--dependent`) and `missingForBooking` |
| `idrd cefe booking create <pool> --date <d> --time HH:MM [--dependent 1,2] [--pay efectivo\|wompi\|creditos] [--notes X]` | **preview** `{ready, checks[], price, pay, request}`; `--yes` → **live** `{reservation{id, status}, payUrl?}` |
| `idrd cefe booking list [--upcoming] [--date\|--from --to] [--status]` · `cefe booking cancel <id> --yes` | reservations with `cancellable`; cancel allowed > 6 h before start |
| `idrd cefe course list [--text X] [--available]` · `cefe course get <course> [--from --to]` · `cefe course mine` | courses with stratum prices; classes with places; enrolments + booked classes |
| `idrd cefe course enroll <course> [--pay efectivo\|wompi]` · `cefe class book <course> --date <d>` · `cefe class cancel <course> --date <d> --yes` | preview first; `--yes` executes. The web has these disabled since 2026-07-30: the `portal` check is red and live refuses |
| `idrd cefe tournament list\|get <id>\|mine` · `cefe tournament register <id> --competition <c> [--dependent doc] [--sex M\|F] --yes` · `… unregister … --yes` | tournaments and competitions (auth) |
| `idrd cefe promo list` · `idrd cefe auth register … --accept-habeas-data` | promotions (purchase on the website); account creation (consent flag required) |

Rules the CLI checks before a booking: slot published that day, places ≥ people, one reservation per day, profile has phone, stratum and birth date. Price: free before 2026-11-05, then 10,000 COP per person per hour. Payment stays with the human: `efectivo` at the venue, `wompi` on cefechapinero.com. Everything behind login is implemented from the site's own code and unverified live; read the error's message if the server disagrees.

## Limits

- The portal publishes one week at a time; future weeks open Mondays at 9:00 a.m.
- Not exercised live (implemented from the portal's own frontend code, covered by contract tests against a mock): the booking POST response, PSE transfers, gym membership purchase/activation, activity subscribe/unsubscribe. The first real run of each confirms the shape; errors carry the portal's message.
- The 4 h/week cap is enforced by the portal, not pre-checked by the CLI.
- Not covered: Daviplata payment (PSE only), the recreation calendar (`/api/recreation`), social programs and the contractor portal.
