# Centro Libanés — Roadmap
## Milestone 1: Demo-Ready Soft Launch

---

## Phase Overview

| # | Name | Goal | Depends On |
|---|---|---|---|
| 1 | Backend Audit | Know exactly what exists vs. what's missing | — |
| 2 | Auth & Core Data Flow | Login works end-to-end with real DB | Phase 1 |
| 3 | Reservations & Catalog | Members can book and view reservations | Phase 2 |
| 4 | Lockers & Billing | Lockers bookable, statement shows real charges | Phase 2 |
| 5 | Family, Payments & Notifications | Full account view with mock payment | Phase 4 |
| 6 | Staff & Admin Wiring | Employee dashboard + Admin panel functional | Phase 2 |
| 7 | Polish, Seed & Demo Prep | Real data seeded, edge cases handled, demo-ready | Phase 3–6 |

---

## Phase 1 — Backend Audit

**Goal:** Map every endpoint that exists in the backend repo against every API call the frontend makes. Produce a gap list.

**Steps:**
1. Clone/pull `maxmaupome14-ctrl/centro-libanes-backend`
2. List all Express routes (grep for `router.get`, `router.post`, etc.)
3. List all API calls in the frontend (`src/services/api.ts` + all views)
4. Create a comparison table: endpoint | exists | response shape matches frontend | notes
5. Identify missing endpoints and mismatched response shapes

**Output:** `.planning/research/backend-audit.md`

**Done when:** Every frontend API call is mapped to a backend route status (exists / missing / broken)

---

## Phase 2 — Auth & Core Data Flow

**Goal:** A member can log in with real credentials, see their credential card, and the app doesn't crash on any view.

**Steps:**
1. Fix any auth endpoint mismatches (login response must return `user` shape matching `authStore.ts`)
2. Ensure `membership_id`, `member_number`, `role`, `user_type`, `first_name`, `last_name` are returned on login
3. Verify JWT middleware works on all protected routes
4. Wire HomeView: real reservations, real maintenance status, real events
5. Fix any 500/404 errors on page load across all views (return empty arrays, not errors)
6. Seed at least one test member account + one admin account in Railway DB

**Done when:** Login → Home shows real user data with no console errors on any view

---

## Phase 3 — Reservations & Catalog

**Goal:** Members can browse, book, and cancel reservations against real backend data.

**Steps:**
1. Verify/build `GET /services` (or `/catalog`) — returns services/resources with category, type, price
2. Verify/build `GET /reservations/user` — returns member's upcoming reservations
3. Verify/build `POST /reservations` — creates a reservation with date, time, serviceId, staffId
4. Verify/build `DELETE /reservations/:id` or cancel endpoint
5. Verify no-show/late-cancel logic triggers a `MonthlyCharge` record
6. Test booking-blocked state when `isMaintenancePaid = false`
7. Seed services and staff in Railway DB

**Done when:** Full reservation round-trip works (browse → book → cancel → no-show charge) with real data

---

## Phase 4 — Lockers & Billing

**Goal:** Members can rent a locker and see it appear on their monthly statement.

**Steps:**
1. Verify/build `GET /lockers?unit_name=X` — returns locker list with status and size
2. Verify/build `GET /lockers/my` — returns member's active locker rentals
3. Verify/build `POST /lockers/:id/rent` — creates LockerRent + MonthlyCharge for recurring fee
4. Verify/build `DELETE /lockers/:id/rent` (or cancel endpoint)
5. Verify `GET /payments/:membershipId/statement` returns correct shape:
   - `maintenance[]`, `lockers[]`, `penalties[]`, `totals` with `total_due`
6. Seed some lockers in the DB

**Done when:** Locker rental flow works end-to-end and the charge appears on the statement

---

## Phase 5 — Family, Payments & Notifications

**Goal:** The family tab shows real group data, the payment flow works (mock), and notifications appear.

**Steps:**
1. Verify/build `GET /membership/:id/family` — returns family group members
2. Verify/build `GET /notifications/my` — returns notifications with `unread_count`
3. Verify/build `POST /notifications/:id/read`
4. Verify mock payment flow:
   - `POST /payments/create-intent` returns `{ payment_id, dev_mode: true }`
   - `POST /payments/:id/confirm` marks maintenance charge as paid
   - HomeView maintenance status updates after payment
5. Verify/build family approval endpoints (`GET /membership/approvals`, `POST /membership/approvals/:id/approve|reject`)

**Done when:** Full payment round-trip works in dev mode and family view shows real member data

---

## Phase 6 — Staff & Admin Wiring

**Goal:** Employees see their real agenda. Admin panel tabs show real data.

**Steps:**
1. Verify/build `GET /staff/me/appointments` and `GET /staff/me/week`
2. Verify/build `POST /staff/appointments/:id/status` (mark completed/no-show)
3. Admin — God View: `GET /admin/stats` (total members, revenue, today's reservations)
4. Admin — Membresías: `GET /admin/members?search=X`
5. Admin — Finanzas: `GET /admin/charges`, `POST /admin/charges/:id/pay`, `POST /admin/penalties`
6. Admin — Lockers: `GET /admin/lockers`, `POST /admin/lockers/:id/release`
7. Admin — Catálogo: CRUD for services and resources
8. Events CRUD already partially wired — verify and fix if needed

**Done when:** Employee dashboard and 6 key admin tabs show real data without errors

---

## Phase 7 — Polish, Seed & Demo Prep

**Goal:** App is demo-ready with realistic data, clean UX, and no embarrassing bugs.

**Steps:**
1. Seed Railway DB with realistic data:
   - 5–10 member accounts (titular + dependientes)
   - 3–5 staff accounts
   - Real services: canchas de tenis, piscina, clases de yoga, spa, etc.
   - Active lockers (some occupied, some free)
   - Sample past + upcoming reservations
   - One member with pending maintenance fee (to demo blocking)
2. Mobile UI audit: test every view at 390px, fix overflow/scroll issues
3. Error state audit: every API failure shows a clean empty state (not a white screen)
4. Loading state audit: every async view shows a skeleton/spinner
5. Fix any remaining console errors or TypeScript warnings
6. End-to-end demo walkthrough: login as member → book → pay → view family → logout → login as admin

**Done when:** A 10-minute demo walkthrough completes without crashes or blank screens

---

## Milestone 2 (Future — not planned yet)
- Live Stripe integration
- Push notifications
- Capacitor iOS build
- App Store submission
