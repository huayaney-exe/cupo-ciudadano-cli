---
name: idrd
description: "Operate the unofficial `idrd` CLI for Bogotá's IDRD Portal Ciudadano: find free public tennis, pádel, pickleball and soccer slots, inspect a court, book it behind an explicit confirmation gate, and get the PSE payment link. Use when the user wants to find or reserve an IDRD park court, check availability for a day/time, or pay an IDRD booking."
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

| Command | What it returns |
|---|---|
| `idrd find --date <d> [--sport tennis\|padel\|pickleball\|synthetic\|natural] [--from H] [--to H] [--locality X]` | `data.results[] = {court, freeHours[]}` across all bookable courts |
| `idrd slot list <courtId> --date <d> [--free]` | `data.slots[] = {hour, start, end, available}`, `freeRuns`, `weekDates` |
| `idrd court list [--sport] [--locality] [--all]` | `data[] = {id, parkName, locality, address, bookable, …}` |
| `idrd court get <courtId>` | park hours, surface, lighting, full rules text (`endowment.rules`) |
| `idrd auth login --email <e>` / `auth status` / `auth logout` | session state; status makes a live call |
| `idrd booking create <courtId> --date <d> --hour <h> [--hours 1\|2] [--bank <code>]` | **preview** `{dryRun:true, ready, intent, checks[]}` |
| `… --yes --confirm <intent>` | **live** `{booking:{bookingId, amount, free, …}, payment}` |
| `idrd pay banks` | `[{code, name}]` |
| `idrd pay pse <bookingId> --bank <code> --yes [--open]` | `{bankUrl, paymentCode}` |
| `idrd pay status <code>` · `idrd booking list` · `idrd doctor` · `idrd killswitch on\|off\|status` | |

Dates: `YYYY-MM-DD`, `hoy`, `mañana`, or `lun…dom` (next occurrence, today included). Hours: `6`, `6am`, `"6:00 AM"`, `18`, `6pm`. Times are Bogotá local.

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

## Limits

- The portal publishes one week at a time; future weeks open Mondays at 9:00 a.m.
- The live booking response shape is implemented from the portal's own frontend code but had not been exercised with a real booking at release time (see `DESIGN.md`).
- The 4 h/week cap is enforced by the portal, not pre-checked by the CLI.
