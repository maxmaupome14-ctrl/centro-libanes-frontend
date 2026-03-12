# Centro Libanes -- Roadmap

---

## Milestone 1: Demo-Ready Soft Launch (COMPLETE)

Phases 1-7 delivered a working demo app wired to real backend data, deployed on Vercel + Railway.

| Phase | Name | Status |
|-------|------|--------|
| 1 | Backend Audit | Complete |
| 2 | Auth & Core Data Flow | Complete |
| 3 | Reservations & Catalog | Complete |
| 4 | Lockers & Billing | Complete |
| 5 | Family, Payments & Notifications | Complete |
| 6 | Staff & Admin Wiring | Complete |
| 7 | Polish, Seed & Demo Prep | Complete |

---

## Milestone 2: v2.0 Premium UX

**Milestone goal:** Transform the app from functional demo into a premium, platform-adaptive club experience. Every screen feels native to the platform it runs on. The credential card replaces the physical membership card. Booking rivals PlayTomic. The app greets you like the club does.

---

## Phases

- [ ] **Phase 8: Foundation** -- Theme system, auth flow fix, platform detection infrastructure, touch audit
- [ ] **Phase 9: Identity** -- Welcome animation, QR credential card, multi-profile switching
- [ ] **Phase 10: Booking UX** -- Time strip, court cards, staff picker, favorites
- [ ] **Phase 11: Platform Chrome + Hospitality** -- Platform-adaptive navigation, anniversary + greeting notifications

---

## Phase Details

### Phase 8: Foundation

**Goal:** The app has a working three-way theme system with no FOUC, a correct auth flow order, synchronous platform detection, and all existing touch bugs patched -- providing the infrastructure every subsequent phase depends on.

**Depends on:** Phase 7 (M1 complete)

**Requirements:** THEME-01, THEME-02, THEME-03, THEME-04, THEME-05, THEME-06, THEME-07, AUTH-01, PLAT-01, PLAT-02, PLAT-06, PLAT-07

**Success Criteria** (what must be TRUE when this phase is complete):
  1. User can toggle between light, dark, and auto theme from the profile page; the selected mode persists after closing and reopening the app
  2. On cold page load, the user sees the correct theme immediately -- no flash of the wrong palette for any preference (light, dark, or auto)
  3. Both light and dark palettes pass WCAG AA contrast ratio (4.5:1) for all body text
  4. Auth login follows the correct order: member number field -> password field -> profile selection screen (family chooser appears only after password validates)
  5. Platform (iOS / Android / web) is detected once at app start with no render flash; web defaults to iOS style

**Plans:** 3 plans

Plans:
- [ ] 08-01-PLAN.md -- CSS foundation: FOUC script, dual-theme token blocks, light palette, body transition
- [ ] 08-02-PLAN.md -- Theme and platform stores, hooks, AppProviders, ThemeToggle wired into App + Profile
- [ ] 08-03-PLAN.md -- Auth flow reorder (password before profiles) + touchAction audit on all motion.button

---

### Phase 9: Identity

**Goal:** Users see a premium welcome animation on their first login of the session, can view and expand their digital QR credential card, and can switch between family member profiles without re-entering a password.

**Depends on:** Phase 8

**Requirements:** AUTH-02, AUTH-03, AUTH-04, AUTH-05, PROF-01, PROF-02, PROF-03, PROF-04, QR-01, QR-02, QR-03, QR-04, QR-05, QR-06

**Success Criteria** (what must be TRUE when this phase is complete):
  1. On first login of a session, user sees a 2-second brand entrance animation (logo fade -> "Bienvenido, [Name]" -> credential card slide-up -> home); on subsequent in-session navigation the animation does not replay
  2. User with `prefers-reduced-motion` enabled sees a static welcome screen instead of the animation
  3. From the home dashboard, user can tap the credential card to reveal a full-screen view showing their photo/initials, member number, and a scannable QR code; the QR background is white to ensure readability
  4. In dark mode, the credential card displays an animated gold shimmer border
  5. User can switch to a different family member's profile from the navigation bar bottom sheet without entering a password; the active profile name/avatar is visible in the header throughout the app

**Plans:** TBD

---

### Phase 10: Booking UX

**Goal:** Members browse courts as visual cards, select time slots via a horizontal snap-scroll strip, choose a preferred staff member, save favorite courts, and confirm bookings in a bottom sheet -- matching the PlayTomic-style experience.

**Depends on:** Phase 8

**Requirements:** BOOK-01, BOOK-02, BOOK-03, BOOK-04, BOOK-05, BOOK-06, BOOK-07, BOOK-08, BOOK-09

**Success Criteria** (what must be TRUE when this phase is complete):
  1. Court and resource cards display a color-coded availability overlay (green / amber / red); user can star any court as a favorite and starred courts appear at the top of the list on next visit
  2. User can scroll horizontally through a time slot strip that snaps to each slot; each slot shows the time, price, and availability; scrolling the time strip does not conflict with vertical page scroll
  3. User can select multiple consecutive time slots in a single booking session
  4. User can choose a staff member via avatar cards with a "Sin preferencia" default option
  5. User sees a bottom sheet summary (court + time + staff + price) with a single "Confirmar" button before the booking is submitted

**Plans:** TBD

---

### Phase 11: Platform Chrome + Hospitality

**Goal:** iOS users see HIG-style large-title navigation with translucent tab bar; Android users see Material Design 3 top app bar with ripple feedback; all users receive time-aware and occasion-based greetings.

**Depends on:** Phase 9, Phase 10

**Requirements:** PLAT-03, PLAT-04, PLAT-05, HOSP-01, HOSP-02, HOSP-03, HOSP-04

**Success Criteria** (what must be TRUE when this phase is complete):
  1. On an iOS device (or web, which defaults to iOS), the app shows a translucent blur bottom tab bar, large collapsing title headers, and subtle highlight tap feedback on interactive elements
  2. On an Android device, the app shows a Material Design 3 top app bar, a bottom navigation bar with always-visible labels, and a ripple effect on interactive elements
  3. On any login, the greeting reflects the current time ("Buenos dias", "Buenas tardes", "Buenas noches") followed by the user's first name
  4. On a member's birthday, login shows a birthday greeting with a confetti animation
  5. On a member's club anniversary, an in-app card notification acknowledges the milestone (e.g., "1 ano como socio")

**Plans:** TBD

---

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 8. Foundation | 0/3 | Planning complete | -- |
| 9. Identity | 0/? | Not started | -- |
| 10. Booking UX | 0/? | Not started | -- |
| 11. Platform Chrome + Hospitality | 0/? | Not started | -- |

---

## Coverage

| Requirement | Phase | Description |
|-------------|-------|-------------|
| THEME-01 | 8 | Theme toggle (light / dark / auto) |
| THEME-02 | 8 | Theme persistence across sessions |
| THEME-03 | 8 | Dark mode muted luxury palette |
| THEME-04 | 8 | Light mode warm palette |
| THEME-05 | 8 | Smooth 200ms theme transitions |
| THEME-06 | 8 | FOUC blocking script in index.html |
| THEME-07 | 8 | WCAG AA contrast in both modes |
| AUTH-01 | 8 | Login order fix: number -> password -> profiles |
| PLAT-01 | 8 | Platform detection via Capacitor + UA |
| PLAT-02 | 8 | Synchronous platform detection (no flash) |
| PLAT-06 | 8 | Web defaults to iOS style |
| PLAT-07 | 8 | touchAction: manipulation audit on motion.button |
| AUTH-02 | 9 | Premium welcome animation on login |
| AUTH-03 | 9 | Animation completes under 2s, preloads data |
| AUTH-04 | 9 | Animation skips on subsequent same-session logins |
| AUTH-05 | 9 | Animation respects prefers-reduced-motion |
| PROF-01 | 9 | Profile switcher bottom sheet from nav bar |
| PROF-02 | 9 | Profile switcher shows role badges |
| PROF-03 | 9 | Active profile visible throughout app |
| PROF-04 | 9 | Profile switch without password re-entry |
| QR-01 | 9 | Full-screen credential card from home |
| QR-02 | 9 | Card shows photo/initials, name, member number, QR |
| QR-03 | 9 | QR encodes member ID for club entrance scan |
| QR-04 | 9 | Animated gold shimmer border in dark mode |
| QR-05 | 9 | UI dims/brightens for QR readability |
| QR-06 | 9 | "Anadir a Wallet" placeholder with coming-soon toast |
| BOOK-01 | 10 | Court cards with availability color overlay |
| BOOK-02 | 10 | Horizontal scroll-snap time strip |
| BOOK-03 | 10 | Time slots show time, price, availability |
| BOOK-04 | 10 | Multiple consecutive time slot selection |
| BOOK-05 | 10 | Unidad favorita star toggle, favorites first |
| BOOK-06 | 10 | Favorites persist in localStorage |
| BOOK-07 | 10 | Staff picker with avatar cards |
| BOOK-08 | 10 | Booking confirmation bottom sheet |
| BOOK-09 | 10 | Time strip uses CSS scroll-snap (not Framer drag) |
| PLAT-03 | 11 | iOS HIG navigation: blur tab bar, large titles |
| PLAT-04 | 11 | Android Material 3: top app bar, bottom nav |
| PLAT-05 | 11 | iOS highlight vs Android ripple tap feedback |
| HOSP-01 | 11 | Time-aware greeting on login |
| HOSP-02 | 11 | Birthday greeting + confetti |
| HOSP-03 | 11 | Anniversary notification |
| HOSP-04 | 11 | Hospitality as in-app cards only |

**Total: 42 requirements mapped across 4 phases. 0 orphans.**

---

*Last updated: 2026-03-11 -- Phase 8 plans created (3 plans, 2 waves)*
