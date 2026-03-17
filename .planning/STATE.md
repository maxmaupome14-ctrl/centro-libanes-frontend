# Centro Libanés — Project State

## Current Milestone

**M2 — v2.0 Premium UX** — COMPLETE

## Current Position

Phase: 11 — Platform Chrome + Hospitality (COMPLETE)
Status: All 4 phases implemented and TypeScript verified
Last activity: 2026-03-11 — All M2 phases (8-11) executed

Progress: [Phase 11 of 11] [████████████] 100% of M2

## Completed Milestones

- **M1 — Demo-Ready Soft Launch** (2026-03-06 → complete)
  - Phases 1–7 delivered
  - App deployed: Vercel + Railway + Supabase
  - Demo member: Michele Kuri Hanud (socio #0001, password 1234)

- **M2 — v2.0 Premium UX** (2026-03-11 → complete)
  - Phase 8 — Foundation: FOUC prevention, dual-theme CSS tokens, Zustand theme/platform stores, ThemeToggle, auth flow fix, touch audit
  - Phase 9 — Identity: Welcome animation with time-aware greeting + birthday confetti, QR credential card modal with shimmer border, multi-profile switching via bottom sheet
  - Phase 10 — Booking UX: Horizontal scroll-snap time strip, multi-slot selection, court card favorites with star toggle, staff picker, availability color overlay, enhanced confirmation bottom sheet
  - Phase 11 — Platform Chrome + Hospitality: iOS/Android adaptive BottomNav, Android TopBar, platform tap feedback CSS, anniversary card, birthday detection

## M2 Phase Overview

| Phase | Name | Status |
|-------|------|--------|
| 8 | Foundation | Complete |
| 9 | Identity | Complete |
| 10 | Booking UX | Complete |
| 11 | Platform Chrome + Hospitality | Complete |

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Phase numbering starts at 8 | M1 ended at Phase 7; v2.0 continues sequence |
| Foundation before features | themeStore + platformStore are hard deps for all surface features |
| Auth fix in Phase 8, not 9 | Broken auth order blocks welcome animation, profile switching, birthday greeting |
| Identity before Booking | Credential card + welcome animation are demo centerpieces |
| Platform chrome last | Navigation chrome is highest component-explosion risk; content must be stable first |
| CSS scroll-snap for time strip | Framer Motion drag conflicts with vertical page scroll on mobile |
| Profile switching stores credentials in memory | No dedicated backend endpoint; re-calls /auth/login with stored password |
| Birthday/anniversary detection via API | User object doesn't include dates; fetches from /profile/me endpoint |

## Key File Locations

- Frontend: `C:\Users\Nuebe\Documents\centro-libanes-frontend-main\`
- Backend: `C:\Users\Nuebe\Documents\centro-libanes-backend\`
- Design doc: `docs/plans/2026-03-11-v2-ux-premium-design.md`

## New Files Created (M2)

### Phase 8
- `src/store/themeStore.ts` — Zustand theme store
- `src/store/platformStore.ts` — Platform detection constant
- `src/hooks/useTheme.ts`, `src/hooks/usePlatform.ts` — Hooks
- `src/components/providers/AppProviders.tsx` — Provider wrapper
- `src/components/ui/ThemeToggle.tsx` — Three-way toggle

### Phase 9
- `src/views/WelcomeView.tsx` — Login animation
- `src/components/credential/CredentialCardModal.tsx` — QR card
- `src/components/ui/ProfileSwitcher.tsx` — Profile switcher

### Phase 10
- `src/hooks/useFavorites.ts` — Favorites store

### Phase 11
- `src/components/layout/TopBar.tsx` — Android top bar
- `src/components/ui/HospitalityCard.tsx` — Anniversary card

---
*Last updated: 2026-03-11*
