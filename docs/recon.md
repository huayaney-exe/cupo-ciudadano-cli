---
type: surface-recon
target: https://portalciudadano.idrd.gov.co/parques/canchas-tenis (IDRD tennis-court booking)
created: 2026-11-03
access: mixed            # catalog + availability public; booking/payment need the citizen's own login
planes: [network]
primary-plane: network
acceptance: [enumeration, replay]
maximum-consequence: passive   # read-only recon; anonymous GETs only, no login/booking attempted
auth: oauth2-password-grant   # Laravel Passport, POST /oauth/token grant_type=password, client creds in bundle
official-surface: none         # no docs/openapi; contract mined from the Vue bundle
confidence: high               # endpoints replayed live anonymously; auth endpoint confirmed accepting the grant
---

# IDRD Portal Ciudadano — tennis courts, Recon

## Verdict

**Build it.** This is the clean opposite of the Colsubsidio target: a plain Vue SPA over a documented-shaped REST API with **OAuth2 password grant**. No browser automation, no captcha, no Imperva, no server-action proxy. A pure-HTTP CLI reaches everything: list courts, read availability by date, log in for a Bearer, book, pay via PSE. This is close to a *defined* contract rather than a discovered one — `cli-build` can run almost straight through.

## What it is

`portalciudadano.idrd.gov.co` is Bogotá's IDRD (Instituto Distrital de Recreación y Deporte) citizen portal — a Vue 2 (Vue CLI/webpack) SPA, nginx-served, catch-all routed. It books public park facilities: tennis, pádel, pickleball, synthetic/natural soccer fields, pools, gyms, coliseums. Backends:

| Var | Host | Role |
|---|---|---|
| `s` (AUTH_SERVER) | `portalciudadano-back.idrd.gov.co` | Auth (OAuth2), parks, schedules, bookings |
| `i`/`l` (PORTAL/PSE) | `portalcontratista-back.idrd.gov.co` | citizen-portal payments/programs, PSE gateway |
| — | `sim1.idrd.gov.co/SIM/...` | Legacy SIM (events, synthetic-field reservations) |

## Authentication — OAuth2 password grant (Laravel Passport)

Confirmed live. `POST https://portalciudadano-back.idrd.gov.co/oauth/token` with:
```json
{"grant_type":"password","client_id":"2","client_secret":"<in bundle>",
 "username":"<citizen email>","password":"<citizen password>"}
```
Bad creds → `401 {"error":"invalid_credentials"}`, so valid creds return an `access_token`. **No browser, no captcha.** The SPA ships the public client_id/client_secret and an `APPLICATION_KEY` (expected for a Passport password-grant public client; they gate on user creds, not client secrecy). Token then sent as `Authorization: Bearer` to the API. Other auth routes present: `/api/login`, `/api/register`, `/api/password/forgot|reset|change`, `/api/logout`, social login via `/oauth/token`.

> Note: client_id/secret are the app's public OAuth client, not user credentials — but keep them in the CLI's config/code the same way the SPA does, and never log the user's password or the issued token.

## Network contract (mined from bundle, key routes replayed anonymously)

Base `s = https://portalciudadano-back.idrd.gov.co`.

| Method | Path | Purpose | Auth | Verified |
|---|---|---|---|---|
| GET | `/api/parks/tennis-courts` | List tennis courts (also paddle/pickleball/natural/synthetic/pools/gyms/coliseum) | none | ✅ 200, 10 courts |
| GET | `/api/parks/{park_id}/details` | Park details (hours, contact, address) | none | ✅ 200 |
| GET | `/api/parks/{park_id}/endowments/{endowment_id}` | Court (endowment) detail | none | ✅ 200 |
| GET | `/api/parks/schedules/{endowment_id}?date=YYYY-MM-DD` | **Availability** — slots `{title,can,start,end,category:Disponible\|Reservado}` | none | ✅ 200, real slots |
| POST | `/oauth/token` | Login → Bearer | client+user | ✅ 401 on bad creds |
| GET | `/api/citizen-portal/bookings` | My bookings | Bearer | 500 anon (needs token) |
| GET | `/api/citizen-portal/public-schedules` | Public program schedules | none | ✅ 200 |
| POST | `/api/parks/schedules/{id}/payment` | Pay for a booking slot | Bearer | not exercised |
| POST | `/api/parks/schedules/freepayment/{id}` · `/validateFreePayment/{id}` | Free booking path (likely tennis) | Bearer | not exercised |
| GET | `/api/payment-gateway/parks` · `/banks` (on `l`) | PSE banks/gateway | Bearer | not exercised |

Court shape (real): `{park_endowment_id, id, endowment_id, park_id, park_name, park_address, park_code, locality, upz, tag:"tennisCourts", for_booking:1, image}`.
Availability slot (real): `{title:"Espacio Reservable", can:true, start, end, description:"Hora de uso 6:00 AM a 9:00 AM", category:"Disponible"}` vs `{can:false, category:"Reservado"}`. 1-hour granularity, mornings from 6:00.

## Authenticated pass — VERIFIED (2026-11-03, user's own account, pure HTTP)

- **Login:** `POST /oauth/token` (password grant) → **200**, `token_type: Bearer`, **`expires_in: 28800` (8 h)**, **refresh_token issued** → the CLI can refresh silently without the password. No browser, no captcha. Creds were read from a temp file, deleted before the network call; token kept in a 0600 file and deleted at the end of the session.
- **Token works:** `GET /api/user` → 200 (`id, name, email, is_verified, has_profile, profile…`); `GET /api/citizen-portal/bookings` → 200 (empty list).
- **Booking create (from lazy chunk `5505`, the scenario-booking component):**
  ```
  POST /api/parks/schedules/{park_endowment_id}/payment
  { "date":"YYYY-MM-DD", "start_hour":"6:00 AM", "final_hour":"7:00 AM",
    "sport_id":null, "lane":null, "document":"<profile document>",
    "is_a_responsible_adult_required":false }
  ```
  Hour ids are `"H:00 AM|PM"` (4 AM–10 PM). Response carries the booking incl. `amount`, `citizen_schedule_id`, payer fields. **`amount === 0` → free path**: `PUT /api/parks/schedules/validateFreePayment/{id}` (`data.isFree`) and `PUT /api/parks/schedules/freepayment/{id}`.
- **Paid path (PSE):** `GET {l}/api/payment-gateway/banks` → pick bank → `POST {l}/api/payment-gateway/transferBank` with payer data + `bank_id` + `ip_address` → **`data.bank_url`**: a bank-redirect URL. Unlike Colsubsidio, this **is a shareable payment link** the CLI can print/send. Status: `GET {l}/api/payment-gateway/status/{ref}`. Free-but-PSE-tracked variant: `transferBankFree`. DaviPlata alternative exists (OTP-based).
- **No cancel endpoint.** None of the 358 chunks contain a cancel/delete booking route or a "cancelar reserva" string. **A created booking cannot be undone from the API** → the CLI's `reserve` must be gated (dry-run default + explicit confirm).
- **Booking window:** tennis reservations open **Mondays from 9:00 a.m.** for the current week (`isMondayMaintenanceWindow`); past days are blocked client-side.
- **Not exercised (by user decision):** the actual `POST …/payment`. No booking was created. First real booking will confirm the response shape and whether tennis is free.

## Needs verification (one authenticated pass, pure curl — no browser)

1. Login round-trip: real `access_token`, its TTL, and whether refresh_token is issued.
2. The booking create call + payload (`park_endowment_id`, `date`, `hour`/`schedule_id`). Keys seen in bundle: `park_endowment_id, schedule_id, date, hour, amount`.
3. Whether tennis is **free** (`freepayment`/`validateFreePayment`) or **paid via PSE** — the `freepayment` route strongly suggests free public-court reservation; confirm.
4. If paid: the PSE redirect flow (`VUE_APP_PSE_REDIRECT=/app/pagos/comprobante/`) and whether it yields a shareable payment URL (PSE is a bank redirect, so likely yes — unlike Colsubsidio's session-bound checkout).
5. Rate limits: not measured; a handful of anonymous GETs hit no limit.

## Why this is a better CLI target than Colsubsidio

- **Auth is a single HTTP POST**, not a browser-driven Gigya→createToken→signin chain behind risk-based captcha.
- **Reads are fully public** (courts + availability), so the read-only CLI needs no auth at all.
- **No anti-bot** (plain nginx; plain curl works everywhere tested).
- **Booking is REST**, not a Next.js server-action proxy, so the whole flow is scriptable and testable with curl.
- If tennis booking is free, there's no payment-link problem at all — the CLI books end to end.
