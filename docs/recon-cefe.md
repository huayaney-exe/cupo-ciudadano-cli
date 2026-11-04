# Recon: CEFE Chapinero (cefechapinero.com)

Date: 2026-11-04. Access: public reads anonymously, writes with the owner's own account. Planes: network (REST behind a Next.js SPA). Acceptance: replay of the SPA's own calls. Maximum consequence: creative + external (reservations hold capacity and can carry a payment; enrolments create pending payments). Every claim below is **observed** unless marked *inferred*.

**Not the IDRD.** The CEFE Chapinero runs its own platform ("Infracol"), not the IDRD Portal Ciudadano. That is why the IDRD portal never listed it.

## Stack

- Frontend: Next.js (app router), Redux Toolkit, Radix UI, Vercel. Pages: `/login`, `/register`, `/client/{dashboard,booking,reservations,courses,tournaments,promotions,profile}`; also `trainer`, `life_guard`, `admin` roles.
- Backend: AWS API Gateway `https://49jdz51sl6.execute-api.us-east-1.amazonaws.com/main` (DynamoDB-shaped records: `__typename`, `_version`, `_lastChangedAt`). Axios client, 30 s timeout, `Authorization: Bearer <token>` from `localStorage.InfracolToken`.
- Payments: Wompi checkout widget (card/PSE). Public key and an "integrity" value are shipped in the bundle; **not reproduced here** and not used by the CLI.

## Auth (observed in bundle)

| Call | Body | Response |
|---|---|---|
| `POST /auth/login` | `{email, password}` (email lower-cased) | `200 {token, user{userId, email, role, name, phone, estrato, dateOfBirth, credits, reservasDisponibles, dependents[], …}}`; `401` bad credentials |
| `POST /auth/register` | `{name, email, password, phone, identification, documentType, role, aceptaHabeasData}` | `201 {token, user}` |
| `POST /auth/forgot-password` `{email}` · `POST /auth/reset-password` `{email, verificationCode, newPassword}` · `POST /auth/change-password` `{email, currentPassword, newPassword}` | | `200` |
| `GET /users/{userId}` | | profile (auth) |
| `PUT /users/{userId}` | partial profile | (the SPA writes `credits`/`reservasDisponibles` from the client after booking) |

Token lifetime: *inferred* from JWT `exp` if present; no refresh endpoint exists.

## Pools and free-practice reservations

| Call | Auth | Observed |
|---|---|---|
| `GET /pools` | no | 3 pools: Recreativa Occidental (cap 20), Semiolímpica (cap 30), Recreativa Oriental (inactive). Fields `poolId, name, description, capacity, pricePerHour (0), isActive, schedules[{dayOfWeek, open, close}], imageUrl` |
| `GET /pools/{poolId}` | no | same record |
| `GET /schedules/{poolId}` | no | slot configuration: `default{slots[{time, capacity}], isClosed}`, `weekly{MONDAY..SUNDAY}`, `overrides[{date,…}]`. Priority in the SPA: override(date) > weekly[DAY] > default |
| `GET /pool-slots?poolId&date=YYYY-MM-DD` | no | `{slots[{date:"YYYY-MM-DDTHH:MM:SS", capacity, reservedCount, status:"OPEN"\|"CLOSED"}], count}`; records exist only for times with activity. Without `date` → 500 |
| `GET /pools/{id}/time-slots?date` · `GET /pools/{id}/availability?date&startTime&endTime` | 403 anonymously | *not used by the booking screen* |
| `POST /reservations` | yes | body `{poolId, poolName, poolImage, userId, email, startTime:"YYYY-MM-DDTHH:MM:SS", endTime, status:"pending"\|"confirmed", notes, price (COP), paymentMethod:"WOMPI"\|"EFECTIVO"\|"CREDITOS"\|undefined, dependents?[{name, documentType, identification, dateOfBirth, relationship}]}`. `status` is `confirmed` for CREDITOS/FREE, `pending` otherwise |
| `GET /reservations?userId=` · `GET /users/{id}/reservas?date=` or `?startDate&endDate[&status]` | yes | `{reservations[]}` with `poolId, poolName, userId_uuid, startTime, endTime, status (pending\|confirmed\|cancelled\|completed\|not_attended), price, paymentMethod, wompiReference, statusPayment, notes` |
| `DELETE /reservations/{poolId}_{userId_uuid}` | yes | cancel. Reservation id = `poolId + "_" + userId_uuid` |
| `PUT /reservations/{id}` `{status:"confirmed"}` or `{paymentMethod:"EFECTIVO"}` | yes | confirm / switch to pay-at-venue |

Rules enforced by the SPA (server authority unknown):
- Duration is fixed at 60 minutes. Available times come from the schedule config; a time is full when `reservedCount >= capacity` or the slot is `CLOSED`; today's past times are hidden.
- One reservation per user per day (`pending`, `confirmed` or `not_attended` blocks a second one).
- Profile must have `phone`, `estrato` and `dateOfBirth`.
- Price: free before 2026-11-05; from then 10,000 COP per person (holder + dependents) per hour, minus credits. The server does not return a price; the SPA sends the one it computed.
- Cancel allowed while `status ∈ {confirmed, pending}` and `startTime > now + 6 h`.
- Payment: WOMPI opens the checkout widget in the browser; EFECTIVO leaves `pending` to be paid at the venue; CREDITOS/FREE confirm immediately.

## Courses and classes

| Call | Auth | Observed |
|---|---|---|
| `GET /courses[?status=]` | no | 18 courses (`courseId, name, group, type:"course"\|"activity", description, duration (min), numberOfClasses, price, priceEstrato1_3, priceEstrato4_6, maxEnrollments, maxEnrollmentsPerUser, isFull, instructor, poolId, schedule[{day, startTime, endTime}], startDate, status`) |
| `GET /courses/{id}/availability?startDate&endDate` | no | `{courseId, courseName, maxEnrollments, dates[{date, classes[{classDateTime, maxCapacity, currentBookings, availableSlots, isAvailable}]}]}` |
| `GET /users/{id}/courses` | yes | enrolments (`courseId, status (PENDING\|CONFIRMED\|COMPLETED\|CANCELLED), paymentType (WOMPI\|CASH), paymentStatus, wompiReference, coursePrice, enrolledAt`) |
| `POST /courses/{courseId}/users/{userId}/enroll` | yes | `{status:"PENDING", paymentType:"CASH"\|"WOMPI", paymentStatus:"PENDING", coursePrice, wompiReference?}`; price by stratum (1–3 vs 4–6) |
| `PUT /courses/{courseId}/users/{userId}` (*inferred path from `updateUserCourse`*) | yes | `{status:"CANCELLED"}` to cancel; `{wompiReference, paymentType}` |
| `GET /users/{id}/class-bookings[?courseId&status&startDate&endDate]` | yes | class bookings (`userId_date`, `courseId`, `classDateTime`, `status CONFIRMED\|ATTENDED\|ABSENT`) |
| `POST /users/{id}/class-bookings` `{courseId, classDateTime:"YYYY-MM-DDTHH:MM:SS", status:"CONFIRMED"}` · `DELETE …/class-bookings` with body `{courseId, classDateTime}` | yes | book / cancel one class |

The SPA carries hard-coded gates: classes, enrolments and promotion purchases "disabled from 2026-07-30" and a July 15–29 blackout. On 2026-11-04 the web therefore refuses these actions; the backend's behaviour is *unverified*.

## Tournaments, promotions, ratings, documents

- `GET /tournaments[?status]` (auth), `GET /tournaments/{id}`, `GET /tournaments/{id}/competitions`, `POST|DELETE /tournaments/{id}/competitions/{cid}/register` `{dependentIdentification?, sex?, observation?}`, `GET /tournaments/my-registrations`. Tournament has `status ("registration_open" …)`, `registrationCloseAt`.
- `GET /promotions[?status]` (no auth; 1 active, `USAGE_PASS`, `RESTRICTED`), `GET /users/{id}/promotions`, `GET /promotions/{id}/eligibility`.
- `GET /ratings/pool/{id}/summary/public` (no auth; NPS summary), `POST /ratings`, `GET /ratings/check?reservationId`, `GET /ratings/user/{id}`.
- `GET /documents/{userId}`, `POST /documents/{userId}` (base64 upload: identity, health, stratum).
- `GET /users/stats` (auth).

## Not covered on purpose

Wompi checkout (browser widget with shipped keys), document upload, ratings survey, admin/trainer/life_guard surfaces, impersonation.
