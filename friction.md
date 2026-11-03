# friction.md — idrd build (2026-11-03)

Appended as it happened. Feeds the case file and corrections to `cli-build` / `cligentic`.

- **Phase 0 classification: discovered.** Recon report existed before the build; started from it, not from the portal.
- **Recon over-reported availability.** The first manual scan counted `can:true` windows as free. Live data shows "Espacio Reservado" windows stacked on top of "Espacio Reservable" ones; 11537 Wed 06–08 looked free and was fully booked. Fixed in `availability.ts` with a test built from the live fixture. Lesson for `surface-recon`: when a calendar endpoint returns overlapping categories, the free set is a difference, not a filter — verify by contrast against the portal UI before reporting slots to a human.
- **Schedule endpoint ignores the date for the week.** `?date=2026-11-12` returns the current week (11-03..11-09). Booking is only possible inside the published week; enforced as a rule and surfaced in `slot list` (`outsidePublishedWeek`).
- **Portal rules live in prose.** Max 2 h/day, 4 h/week, 24 h advance are only in the `requirements` markdown of each court. Encoded in `rules.ts` as pre-checks; the server stays authoritative.
- **cligentic `prompt-secret` writes its label to stdout.** With stdin a TTY and stdout piped (`idrd auth login | jq`), the label corrupts the JSON. Patched to stderr (hybrid). Worth an upstream fix.
- **cligentic `argv` swallows the next positional after a boolean flag** (`--json 11537` → `json="11537"`). Wrapped with a boolean pre-pass. Worth an upstream option (`booleans: [...]`).
- **cligentic `json-mode` vs the skill's envelope.** `emit()` writes arrays as NDJSON and puts next steps on stderr; `cli-build` asks for `nextSteps` inside the structured output. Chose the envelope; the two references disagree and should be reconciled.
- **cligentic `global-flags` uses generic env names** (`CLI_JSON`, `CLI_PROFILE`), which collide across CLIs on the same machine. Renamed per CLI.
- **cligentic `killswitch.assertKillswitchOff` throws a plain `Error`** — no code, no hint, no exit mapping. Used the state getter instead.
- **Double-encoded UTF-8 from the portal** (`NÂ° 1`, and cp1252 variants like `PEÃ‘ALOSA`). `cleanText` repairs only when the re-decode is valid UTF-8.
- **No cancel endpoint anywhere.** Changed the trust design from T2 to T3 for `booking create`.
- **The SPA sends a hardcoded IP to PSE when its IP lookup fails.** Rejected that behavior: the CLI uses the real public IP or stops.
- **Test harness deadlock.** `spawnSync` in a bun test blocks the event loop, so an in-process `Bun.serve` mock never answers → 90 s timeouts. Switched to `Bun.spawn`. macOS `script` (to get a real TTY) waits on stdin unless it is `/dev/null`, and echoes `^D\b\b` at the start of output.
- **zsh glob ate `--include=*.ts`** in the Phase 5 grep, producing "0 call sites" for everything — a false wiring alarm. Quote the pattern. The skill's "grep for the call site" check should mention this.
- **Human output review caught what tests could not:** per-hour lists truncated ("4:00 PM, 5:00 PM, …") → compact ranges ("4–10 PM"); a rule summary that matched "máximo" inside a damages paragraph; an English "Next steps:" header in an otherwise Spanish CLI.
- **Phase 4 not exercised live by design.** No credentials during the autonomous build and the owner chose not to create a booking (irreversible). Contract tests cover the gates; first real booking is the remaining verification.
- **Self-review: a created booking could vanish from the output** when the follow-up payment step failed. Irreversible writes need their id reported even on partial failure. Fixed + test. This belongs in `cli-build` Phase 4 as a rule: after an irreversible write succeeds, nothing downstream may turn the result into an error that hides it.
- **Pre-publish scan found the portal's web-client secret hardcoded** in `api.ts`. Not a user credential (every browser gets it), but a public repo should not republish it and a literal breaks on rotation. Replaced with discovery from `chunk-common.<hash>.js` + 7-day cache + re-discovery on `invalid_client` + env override. A pre-publish secret/PII grep belongs in `cli-build` Phase 6 before "ship".
