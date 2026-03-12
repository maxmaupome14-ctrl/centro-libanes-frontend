# Feature Landscape — Centro Libanés v2.0 Premium UX

**Domain:** Premium sports & social club mobile app (PWA + Capacitor/iOS)
**Milestone:** v2.0 — Transform functional demo into a premium, platform-adaptive experience
**Researched:** 2026-03-11
**Confidence:** HIGH (based on codebase analysis + design spec + domain knowledge of iOS HIG, Material Design 3, and club/sports booking apps)

---

## Context: What Already Exists

This is a subsequent milestone on a working app. The existing foundation is solid:

- Dark-only color system already implemented (`#060606` background, `--color-gold` accents, glassmorphism)
- Bottom tab navigation working (4 tabs: Inicio, Reservar, Familia, Perfil)
- Framer Motion already installed and used throughout (stagger animations, slide transitions)
- Credential card with shimmer animation already on HomeView
- Multi-step login flow already built (lobby → member number → profile select → password/PIN)
- Booking flow exists (CatalogView with time slots, service/resource selection)
- Zustand auth store already manages user state

The v2.0 work is **UX elevation**, not greenfield. Every feature here refines or extends what exists — it does not replace backend integration.

---

## Feature Landscape

The 8 target features cluster into four domains:

1. **Platform shell** — iOS HIG + Material Design 3 adaptive navigation and interaction patterns
2. **Theme system** — Light/dark/auto with muted luxury palette
3. **Auth + onboarding** — Fixed flow, premium welcome sequence, multi-profile switching
4. **Booking UX** — PlayTomic-inspired court/time/staff selection, saved favorites
5. **Identity features** — QR credential card, unreasonable hospitality notifications

---

## Table Stakes

Features users expect from a modern club app. Missing = product feels unfinished or low-quality.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Correct auth flow (number → password → profiles) | The current flow is broken — shows profiles before password. Standard expectation: authenticate first, then select. | Low | Fix to existing flow, not new feature. Auth store already has all needed data. |
| Dark mode support | The current design is dark-only but has no light mode. Any modern app is expected to respect `prefers-color-scheme`. Members on iOS expect system-matched UI. | Medium | CSS custom properties are already scoped to `:root` — adding `[data-theme="light"]` overrides is the mechanism. Smooth transitions needed. |
| Theme persistence | User sets light/dark preference, it persists on next open. Standard in every app since 2019. | Low | `localStorage` key + read on init. Already patterns exist in codebase for this. |
| Platform-appropriate navigation gestures | iOS users expect swipe-back to work. Android users expect the back button and ripple feedback. Without these, the app feels like a website, not an app. | Medium | Requires `usePlatform()` hook + CSS class on `<html>` + conditional components. |
| Tap feedback on interactive elements | Every tap on Android needs ripple. iOS needs subtle highlight. Bare `<button>` with no feedback feels broken. | Low | Can be CSS-only for most cases. Framer Motion `whileTap` already used in HomeView. |
| Bottom safe area handling | On iOS, content must not be obscured by the home indicator (34px). The current `pb-safe` class exists but needs system-wide application. | Low | Already partially done — needs audit for completeness. |
| Readable text in both light and dark modes | Light mode needs dark text. Dark mode needs light text. Contrast ratios must pass WCAG AA (4.5:1 for body text). | Medium | All text currently uses CSS custom properties (`--color-text-primary` etc.) — light mode vars needed. |
| Loading skeleton states | Every data-fetching view needs skeleton loaders, not blank space. HomeView already has animated skeletons for events; needs consistent application. | Low | Pattern already exists — apply uniformly. |

---

## Differentiators

Features that elevate Centro Libanés above a generic club management tool. These create the "premium club" feel that makes members proud to use the app.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Muted luxury dark mode (slate + warm white + gold) | The existing dark mode is pure black (`#060606`). The v2 vision is dark slate (`#0F1419`, `#1A1F26`) with warm white text (`#E8E4DF`) — a deliberate premium aesthetic more like a private club than a utility app. | Medium | CSS var swap. The palette is fully specified in the design doc. Not just dark/light toggle — the dark palette itself is a design statement. |
| Premium welcome animation (2s entrance sequence) | Competitors show a spinner and a dashboard. Centro Libanés will show a branded entrance: brand color fade → "Bienvenido, [Name]" with gold shimmer → credential card slides up from bottom → transition to home. This is the "walking into the club" moment. | Medium | Framer Motion orchestrated sequence. Requires `useAnimationSequence` or staggered `variants`. Must skip on subsequent same-session logins and respect `prefers-reduced-motion`. |
| Birthday + time-aware greeting on login | "Feliz cumpleaños, Michele" with confetti on the member's birthday. "Buenos días / tardes / noches" based on time of day. These small personalizations communicate that the app knows and cares about the member — the opposite of a corporate portal. | Low | Birthday from `user.birthday` field (needs backend verification). Time detection is client-side. In-app notification card, not push. |
| PlayTomic-style horizontal time strip for booking | Current booking shows a flat list of time slots. PlayTomic's horizontal scrollable strip shows time + availability + price in a fluid gesture — significantly faster to scan and select. This is a known UX superiority for court/resource booking. | High | New component (`<TimeStripPicker />`). Requires horizontal scroll with snap points, selection state, multi-slot support. Will replace the current `TIME_SLOTS` map in CatalogView. |
| Visual court cards with availability overlay | Static list of service/resource names → visual cards with photo placeholder, availability color coding (green/amber/red), and "Unidad favorita" star toggle. Members can visually scan courts instead of reading a list. | High | New `<CourtCard />` component. Requires image handling (placeholder illustrations for initial release), availability state from API, and localStorage-persisted favorites. |
| "Unidad favorita" (saved preferred courts) | Star toggle on each court/resource. Starred courts appear first in the list. One-tap to re-book your usual court without searching. This is especially valuable for members who always book the same padel court. | Low | `localStorage` key (array of resource IDs). No backend needed initially. Sort function in CatalogView. |
| Staff selection with avatar cards | Current flow has no staff selection UI. PlayTomic model: avatar + name cards for available staff at the selected time. "Sin preferencia" default. Staff avatars make the booking feel personal — you're booking with a specific coach, not just a time slot. | Medium | Requires staff availability API or filtering logic. Avatar initials fallback (no photo requirement). Bottom sheet or inline cards. |
| Multi-profile switching without re-auth | Family members sharing one membership can switch profiles via a bottom sheet from the nav bar — without logging out and re-entering credentials. The family is already authenticated as a group; profile switching is a UX layer over existing auth architecture. | Medium | Profile switcher bottom sheet. Active profile indicator in header/nav. State lives in Zustand auth store. Profile data is already fetched during login (`profiles[]` array in LoginView). |
| QR code digital credential card | Full-screen credential card with QR encoding the member ID. Auto-brightness increase when QR displayed. Gold shimmer border in dark mode. This replaces the need to carry a physical card and enables touchless check-in at club facilities. | Medium | `qrcode` or `react-qr-code` library (small, well-maintained). Full-screen modal from HomeView. `screen.brightness` API for brightness (Capacitor plugin needed for native; CSS filter fallback for web). |
| Platform-adaptive navigation chrome | iOS shell: bottom tab bar with translucent blur, large title headers that collapse on scroll, back swipe gesture. Android shell: top app bar with back arrow, ripple feedback, Material bottom nav with always-visible labels. The app adapts its chrome to feel native on each platform. | High | `usePlatform()` hook + `<PlatformNavBar />` / `<PlatformTabBar />` conditional components. CSS class on `<html>`. The existing `BottomNav` component is already iOS-style — Android variant is new. |
| Membership anniversary milestone notification | "1 año como socio" in-app notification on membership anniversary. Rarer than birthday, but higher perceived value — signals the club tracks long-term relationships. | Low | Requires `membership.start_date` from backend. In-app notification card on login. |
| Weather-contextual activity suggestions | "Hace buen día — las canchas al aire libre están disponibles" — a contextual suggestion surfaced in the app based on current weather. | Medium | Requires weather API (e.g., Open-Meteo, free). Not in current scope but noted. **Recommended to defer.** |

---

## Anti-Features

Features to deliberately NOT build in this milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Native push notifications (APNs / FCM) | Requires Capacitor Push plugin, Apple developer provisioning profile setup, backend notification service (or Firebase), and app store submission. This is a 2–3 day integration for the infrastructure alone, separate from UX value. | In-app notification cards (already built in NotificationsView) are sufficient for the hospitality moments. |
| Apple Wallet / Google Wallet integration | PassKit API for iOS requires Apple developer entitlements and a signed pass certificate. Google Wallet requires service account setup. Both are non-trivial and out of scope for a demo/soft launch. | Add "Añadir a Wallet" button as UI placeholder that shows a coming-soon toast. The QR card itself provides the functional value. |
| Biometric authentication (Face ID / Touch ID) | Capacitor's `@capacitor-community/biometric-auth` plugin works well but adds native dependency management. For a soft launch, the existing password/PIN flow is sufficient. Biometrics would be a v3 feature with clear user value. | The current `<Fingerprint />` icon in the login button is cosmetic — keep it as decoration. Do not wire up actual biometric auth. |
| Social/activity feed | Building a community feed (member check-ins, activity photos, etc.) requires new backend models, moderation, and significant design work. No clubs at this scale need social features for launch. | The Events section in HomeView satisfies the "what's happening" need without social complexity. |
| Gamification (points, badges, leaderboards) | High implementation cost for uncertain engagement payoff at a club of hundreds of members who know each other socially. Risk of feeling gimmicky against the premium positioning. | The "unreasonable hospitality" notifications achieve the recognition goal without gamification mechanics. |
| Real-time court availability (websockets) | Polling on page load is sufficient for a club with hundreds of members. WebSocket implementation adds infrastructure complexity (persistent connections, Railway scaling) for marginal UX gain at this scale. | Use fresh API fetch each time the booking view opens, with a manual refresh mechanism. |
| Multi-language support (English) | The club is in Mexico, the members are Spanish-speaking, and all current UI is Spanish. Internationalization infrastructure (i18n libraries, translation files) adds significant ongoing maintenance burden for no current user need. | Keep Spanish-only. |
| Onboarding tutorial / walkthrough | New features should be self-evident from good UX design. Tutorials signal the UI is confusing. Build the booking UX so clearly that no tutorial is needed. | If help is needed, a single "?" icon linking to a simple FAQ is sufficient. |
| Custom theme color picker (per-user) | The premium brand identity depends on consistent use of cedar green + gold. User-customizable colors would dilute the brand and create support burden. | The three-mode theme (light/dark/auto) is the right level of user control. |

---

## Feature Dependencies

```
Platform detection (usePlatform() hook)
  └─ Platform-adaptive navigation chrome (requires platform signal)
  └─ Platform-specific touch feedback (ripple vs. highlight)

Auth flow fix (number → password → profiles)
  └─ Multi-profile switching (depends on corrected auth sequence)
  └─ Premium welcome animation (depends on correct post-auth trigger point)
      └─ Birthday greeting variant (sub-sequence of welcome animation)
      └─ Time-aware greeting (sub-sequence of welcome animation)

Theme system (CSS custom properties + provider)
  └─ Muted luxury dark mode palette (the dark variant of the theme system)
  └─ Light mode (the light variant of the theme system)
  └─ Theme toggle persistence (depends on theme provider)
  └─ QR credential card gold shimmer in dark mode (consumes theme context)

Booking UX redesign (visual court cards + time strip)
  └─ Staff selection UI (depends on court/time selection being done first)
  └─ "Unidad favorita" star toggle (attaches to court cards)
      └─ Starred courts sorted first (depends on favorites being stored)
  └─ Booking bottom sheet confirmation (summarizes all selections)

Multi-profile switching
  └─ Active profile indicator in nav (shows who is active)
  └─ Profile switcher bottom sheet (the switching mechanism)
  → requires profiles[] already in Zustand auth store (already there from login)

QR code credential card
  → depends on: theme system (dark mode shimmer border)
  → depends on: member ID being available in auth store (already there)
  → depends on: qrcode library installation
```

---

## Feature Prioritization Matrix

Ordered by: (user impact × implementation speed) — highest value per effort first.

| Priority | Feature | Impact | Effort | Phase Recommendation |
|----------|---------|--------|--------|---------------------|
| 1 | Auth flow fix (number → password → profiles) | HIGH — broken UX blocks everything downstream | Low | Phase 1 |
| 2 | Theme system (light/dark/auto + CSS vars) | HIGH — dark-only is incomplete; light mode is expected | Medium | Phase 1 |
| 3 | Muted luxury dark mode palette | HIGH — core brand differentiator, dark palette is the premium moment | Low (once theme system exists) | Phase 1 (with #2) |
| 4 | Premium welcome animation | HIGH — first impression, "unreasonable hospitality" defining moment | Medium | Phase 2 |
| 5 | Multi-profile switching | HIGH — family groups are the core business model | Medium | Phase 2 |
| 6 | QR code credential card | HIGH — replaces physical card, tangible value | Medium | Phase 2 |
| 7 | Platform detection + usePlatform() hook | MEDIUM — foundation for all adaptive chrome | Low | Phase 2 |
| 8 | Platform-adaptive navigation chrome | MEDIUM — iOS shell refinement + Android shell new | High | Phase 3 |
| 9 | PlayTomic-style time strip picker | HIGH for bookings — the core booking UX upgrade | High | Phase 3 |
| 10 | Visual court cards with availability overlay | HIGH for bookings — replaces flat list | High | Phase 3 |
| 11 | Staff selection UI | MEDIUM — enhances booking but not blocking | Medium | Phase 3 |
| 12 | "Unidad favorita" (saved courts) | MEDIUM — convenience, fast to build | Low | Phase 3 (with court cards) |
| 13 | Birthday + time-aware greeting | HIGH for hospitality perception — low effort | Low | Phase 4 |
| 14 | Membership anniversary notification | LOW-MEDIUM — nice, low effort | Low | Phase 4 |
| 15 | Platform-adaptive touch feedback (ripple) | LOW — polish detail | Low | Phase 4 (polish pass) |

---

## MVP Recommendation

For the soft launch demo, prioritize phases 1–3 (items 1–12 above). This delivers:

- A working, beautiful auth flow with premium entrance animation
- Full light/dark theming with the luxury dark mode
- A booking experience that genuinely competes with PlayTomic
- QR credential card and multi-profile switching (flagship features)

Defer to a polish pass (Phase 4):
- Hospitality notifications (low effort but not blocking)
- Ripple feedback (Android-specific polish)
- Anniversary milestone (requires backend date field verification)

---

## Notes on Existing Code Quality

The existing codebase has strong bones for this upgrade:

- `--color-*` CSS custom properties are used consistently — adding theme variants is straightforward
- Framer Motion is installed and actively used — welcome animation is a natural extension
- The `profiles[]` array is already fetched and stored during login — profile switching has data it needs
- `user.member_number` and `user.id` are already in the auth store — QR code has its payload
- `TIME_SLOTS` in CatalogView is a plain array — replacing it with the time strip component is a clean swap
- The `BottomNav` is already iOS-style — the platform detection work refines it rather than replacing it

The main new complexity in v2.0 is the `usePlatform()` hook system (branch logic throughout the UI) and the `<TimeStripPicker />` component (most complex new component in the milestone).

---

## Sources

- Codebase analysis: `src/views/HomeView.tsx`, `src/views/LoginView.tsx`, `src/views/CatalogView.tsx`
- Design spec: `docs/plans/2026-03-11-v2-ux-premium-design.md`
- Project context: `.planning/PROJECT.md`
- Backend audit: `.planning/research/backend-audit.md`
- Domain knowledge: iOS Human Interface Guidelines (navigation patterns, safe areas, gesture conventions)
- Domain knowledge: Material Design 3 (top app bar, FAB, ripple, navigation components)
- Domain knowledge: PlayTomic, Courtside, and comparable sports booking app UX patterns
- Confidence level for all items: HIGH (grounded in existing code + explicit design spec; no speculative claims)
