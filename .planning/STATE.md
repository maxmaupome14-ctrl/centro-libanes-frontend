# Centro Libanés — Project State

## Current Milestone

**M2 — v2.0 Premium UX**

## Current Position

Phase: 8 — Foundation
Plan: Not started
Status: Roadmap created, ready for planning
Last activity: 2026-03-11 — v2.0 roadmap (phases 8–11) created

Progress: [Phase 8 of 11] [||||........] 0% of M2

## Completed Milestones

- **M1 — Demo-Ready Soft Launch** (2026-03-06 → complete)
  - Phase 1 — Backend Audit
  - Phase 2 — Auth & Core Data Flow
  - Phase 3 — Reservations & Catalog
  - Phase 4 — Lockers & Billing
  - Phase 5 — Family, Payments & Notifications
  - Phase 6 — Staff & Admin Wiring
  - Phase 7 — Polish, Seed & Demo Prep
  - App deployed: Vercel + Railway + Supabase
  - Demo member: Michele Kuri Hanud (socio #0001, password 1234)

## M2 Phase Overview

| Phase | Name | Status |
|-------|------|--------|
| 8 | Foundation | Not started |
| 9 | Identity | Not started |
| 10 | Booking UX | Not started |
| 11 | Platform Chrome + Hospitality | Not started |

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Phase numbering starts at 8 | M1 ended at Phase 7; v2.0 continues sequence |
| Foundation before features | themeStore + platformStore are hard deps for all surface features |
| Auth fix in Phase 8, not 9 | Broken auth order blocks welcome animation, profile switching, birthday greeting — must land first |
| Identity before Booking | Credential card + welcome animation are demo centerpieces; de-risk them before highest-complexity booking work |
| Platform chrome last | Navigation chrome is the highest component-explosion risk; content must be stable first |
| CSS scroll-snap for time strip | Framer Motion drag="x" conflicts with vertical page scroll on mobile; CSS overflow-x + scroll-snap is the correct approach |
| Time-aware greetings in Phase 11 | HOSP-01 appears simple but depends on correct profile (PROF) and platform context (PLAT) being settled first |

## Critical Implementation Notes

- **FOUC prevention:** Blocking inline script must go in `index.html` `<head>` BEFORE any stylesheet. Invisible in dev, always visible in prod.
- **Platform detection:** Must be synchronous / module-level constant. Async detection causes a render flash on first paint.
- **touch bug audit:** All existing `motion.button` elements need `touchAction: 'manipulation'` — search codebase in Phase 8 before adding new buttons.
- **Profile switching + JWT:** Before implementing `switchProfile` (Phase 9), confirm backend answer: dedicated `/auth/switch-profile` endpoint or re-auth with pre-filled member number. Do not build switcher without this answer.
- **Staff availability API:** Before building `StaffPicker.tsx` (Phase 10), confirm endpoint shape with backend. Current CatalogView has no staff selection.
- **qrcode.react:** Only new dependency in M2. Install and confirm v4.x (React 19 peer dep). If v3.x installs, verify compatibility before proceeding.

## Accumulated Context

- Stack: React 19 + Vite + Tailwind v4 + Framer Motion 12 + Zustand + Capacitor 8
- Auth: JWT (Bearer), localStorage. `POST /auth/select-profile` → `POST /auth/login`
- Staff auth: `POST /auth/staff-login`
- Backend: Express + Prisma + PostgreSQL (Supabase), deployed on Railway
- Frontend: Vercel
- Design reference: `docs/plans/2026-03-11-v2-ux-premium-design.md`
- Research: `.planning/research/SUMMARY.md`, `.planning/research/ARCHITECTURE.md`, `.planning/research/FEATURES.md`, `.planning/research/PITFALLS.md`

## Key File Locations

- Frontend: `C:\Users\Nuebe\Documents\centro-libanes-frontend-main\`
- Backend: `C:\Users\Nuebe\Documents\centro-libanes-backend\`
- Design doc: `docs/plans/2026-03-11-v2-ux-premium-design.md`
- Roadmap: `.planning/ROADMAP.md`
- Requirements: `.planning/REQUIREMENTS.md`

---
*Last updated: 2026-03-11*
