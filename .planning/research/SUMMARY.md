# Research Summary — Centro Libanés v2.0 Premium UX

**Project:** Centro Libanés Frontend
**Domain:** Premium sports & social club mobile app (PWA + Capacitor/iOS)
**Milestone:** v2.0 — Platform-adaptive design, theming, QR credential, premium animations
**Researched:** 2026-03-11
**Confidence:** HIGH

---

## Executive Summary

Centro Libanés v2.0 is a UX elevation milestone on a working React 19 + Tailwind 4 + Framer Motion 12 + Capacitor 8 app — not a greenfield build. The app already has a dark color system, glassmorphism, Zustand auth, multi-step login, and a booking flow. The v2 work refines and extends all of this using exclusively the existing stack, with **one new dependency**: `qrcode.react` for the digital credential card. Every other requirement — platform detection, three-way theming, premium animations, horizontal booking UX, multi-profile switching, birthday personalization — is achievable with libraries already installed.

The recommended approach centers on four infrastructure primitives that must land first: `themeStore`, `platformStore`, their hooks, and a blocking inline script in `index.html` that prevents theme flash on cold load. These are invisible to the user but are hard dependencies for every subsequent feature. Once the infrastructure layer exists, all surface features (welcome animation, QR card, booking UX redesign, hospitality notifications) can be built in any order without blocking each other. The architecture is clean: two new Zustand stores, an `AppProviders` wrapper, and a clear CSS `data-attribute` contract that keeps platform and theme state out of component props entirely.

The primary risks are not technical complexity but implementation discipline: theme flash of unstyled content if the inline script is skipped, Framer Motion touch bugs if `touchAction: 'manipulation'` is not applied universally, scroll conflict in the horizontal time strip if Framer drag is used instead of CSS `overflow-x`, and JWT scope ambiguity if profile switching is treated as a display-only concern. All four have documented, straightforward mitigations. None require library changes or architectural pivots.

---

## Key Findings

### 1. One New Dependency — Everything Else Is Already Installed

The entire v2.0 milestone requires only `qrcode.react ^4.2.0` as a new dependency. Platform detection (`Capacitor.getPlatform()`), theming (Tailwind v4 `@custom-variant` + CSS custom properties), animations (Framer Motion 12 `useAnimate`, `useReducedMotion`, `rotateY`), booking UX (CSS `scroll-snap`), and personalization logic (`date-fns` v4) are all covered by the existing locked stack. Any impulse to add `next-themes`, `react-device-detect`, `vaul`, `react-spring`, or a second icon library should be rejected — each is either redundant or in conflict with what is already installed.

**New dependency:**
- `qrcode.react ^4.2.0` — SVG QR generation for digital credential card; React 19 compatible, zero dependencies, 2M+ weekly downloads

**Key existing tools confirmed for v2 use:**
- `Capacitor.getPlatform()` — authoritative platform detection, covers iOS/Android/web in one call
- Tailwind v4 `@custom-variant dark` — three-way theme toggle without additional library
- Framer Motion 12 `useAnimate()` — imperative orchestrated sequences for the 2s welcome animation
- CSS `scroll-snap-type: x mandatory` — horizontal time strip with no drag library needed
- `date-fns` `isSameDay` + `getHours` — birthday and time-aware greeting, pure client-side

See: `.planning/research/STACK.md`

---

### 2. Feature Prioritization — 4 Phases, 15 Features

Features divide into four natural phases based on dependency order. Phases 1–3 are the MVP for demo/soft launch. Phase 4 is a polish pass.

**Table stakes (must have for app to feel complete):**
- Auth flow fix: number → password → profiles (currently inverted — this is broken UX)
- Dark/light/auto theme with persistence
- Platform-appropriate gestures (iOS swipe-back, Android ripple)
- Safe area handling (iOS home indicator)
- Skeleton loading states applied uniformly
- WCAG AA contrast ratios in light mode

**Differentiators (make it premium):**
- Muted luxury dark mode palette (`#0F1419` / `#1A1F26` / `#E8E4DF` / gold)
- Premium 2s welcome animation (brand entrance sequence)
- PlayTomic-style horizontal time strip for booking
- Visual court cards with availability overlay
- QR code digital credential card (replaces physical card)
- Multi-profile switching without re-auth
- Birthday + time-aware greeting ("Feliz cumpleaños, Michele")
- Staff selection with avatar cards

**Defer to v2.1+:**
- Native push notifications (APNs/FCM) — infrastructure cost exceeds demo value
- Apple/Google Wallet integration — requires developer entitlements
- Biometric auth — current PIN flow is sufficient for launch
- Real-time availability via WebSockets — polling on view load is sufficient at this scale
- Weather-contextual suggestions — requires external API integration

See: `.planning/research/FEATURES.md`

---

### 3. Architecture — 3 New Stores, 1 Wrapper, CSS Data-Attribute Contract

The v2 architecture introduces a minimal but complete infrastructure layer. The insertion point is a new `AppProviders` component placed between `BrowserRouter` and `ToastProvider` in `App.tsx` — a thin wrapper that initialises stores and writes `data-theme` and `data-platform` to `<html>`. No routing changes. No new pages. No changes to `authStore`, `api.ts`, or any existing data-fetching logic.

**New stores (Zustand slices):**
- `themeStore` — `light | dark | auto` mode, persisted to `localStorage`, `matchMedia` listener for auto
- `platformStore` — detected once at app mount, never changes, read-only after init
- `profileStore` — active family profile for credential card + greeting (distinct from `authStore`)

**New hooks:**
- `usePlatform()` — synchronous module-level constant, returns `{ platform, isIOS, isAndroid, isWeb }`
- `useTheme()` — reads `themeStore`, returns `{ theme, resolvedTheme, setTheme }`

**Key architectural patterns:**
- CSS `data-theme` attribute drives all color switching — no React re-renders for theme changes
- CSS `data-platform` attribute handles platform-specific visual tokens in content components
- Platform branching in JS is limited to exactly 4 navigation chrome components (BottomNav, NavBar, ActionSheet, FAB); content components never import `usePlatform()`
- `WelcomeAnimation` lives inside `LoginView`, not at app level — fires only on explicit login, never on page refresh

**Files untouched:** `authStore.ts`, `api.ts`, `lib/utils.ts`, all view data-fetching logic, routing, admin/employee views, Vercel/Vite/Capacitor config.

See: `.planning/research/ARCHITECTURE.md`

---

### 4. Theme Flash Is the Most Invisible-in-Dev / Visible-in-Prod Bug

The single most important implementation detail in the entire milestone is a 10-line inline script in `index.html`. Without it, every user whose theme preference differs from the default sees a dark-to-light (or light-to-dark) flash on every cold page load. This is invisible during development (fast HMR reload, no true cold paint) and always visible in production. It must be treated as a hard prerequisite to shipping the theme system, not an afterthought.

```html
<!-- index.html, in <head> before any stylesheet -->
<script>
  (function() {
    try {
      var stored = localStorage.getItem('theme');
      var system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme',
        stored === 'auto' || !stored ? system : stored
      );
    } catch(e) {}
  })();
</script>
```

---

### 5. Four Critical Pitfalls With Clear Mitigations

The research identified 4 critical pitfalls (class: "causes rewrites or broken devices"), all with established solutions:

| Pitfall | Prevention |
|---------|------------|
| **C-1: UA platform detection is unreliable** | Always check `Capacitor.getPlatform()` first; UA is secondary signal only |
| **C-2: Theme FOUC on cold load** | Blocking inline script in `index.html` before any stylesheet |
| **C-3: Framer Motion `whileTap` double-fires on Samsung Fold** | `touchAction: 'manipulation'` on every `motion.button` — audit all existing instances in Phase 1 |
| **C-4: Horizontal time strip conflicts with vertical scroll** | Use CSS `overflow-x: auto` + `scroll-snap`, not Framer Motion `drag="x"` |

See: `.planning/research/PITFALLS.md`

---

## Implications for Roadmap

The dependency graph from ARCHITECTURE.md and FEATURES.md converges on a clear 4-phase structure. Phases 1–2 are pure infrastructure with minimal visible output. Phases 3–4 are the features members will actually use.

---

### Phase 1: Infrastructure Foundation

**Rationale:** `themeStore`, `platformStore`, `AppProviders`, and their hooks are hard dependencies for every surface feature. Nothing in phases 2–4 can be correctly built without them. The auth flow fix also belongs here because it is a prerequisite for the welcome animation and profile switching.

**Delivers:**
- `themeStore` + `useTheme()` hook
- `platformStore` + `usePlatform()` hook (synchronous, module-level — no flash)
- `AppProviders` wrapper wired into `App.tsx`
- Blocking inline script in `index.html` (FOUC prevention)
- `index.css` `[data-theme="light"]` block with muted luxury palette
- `index.css` `[data-theme="dark"]` block with updated slate palette
- `ThemeToggle` component in ProfileView
- Auth flow order fix: member number → password → profile select
- `touchAction: 'manipulation'` audit on all existing `motion.button` elements
- `prefers-reduced-motion` utility established

**Addresses:** Table stakes: auth flow fix, dark/light/auto theme, theme persistence
**Avoids:** C-2 (FOUC), U-2 (platform flash from async detection), T-2 (Tailwind v4 CSS collision), T-3 (Zustand race on auth hydration)
**Research flag:** No additional research needed — all patterns are well-documented and verified

---

### Phase 2: Identity Features

**Rationale:** With infrastructure in place, the highest-value user-facing features — the digital credential card, multi-profile switching, and the welcome animation — can land. These are the flagship features of v2.0 and the most important for the demo. The welcome animation depends on the auth flow fix (Phase 1). The QR card depends on theme tokens (Phase 1 CSS vars). Profile switching depends on correct auth sequence (Phase 1 fix).

**Delivers:**
- `profileStore` + family API integration (`/family/members` fetch once on auth)
- `CredentialCard` component extracted from `HomeView` into standalone component
- `QRCode.tsx` component using `qrcode.react` (`<QRCodeSVG>`)
- Credential card flip animation (Framer Motion `rotateY`) — front: membership card, back: QR
- CSS brightness fallback for QR visibility (white background when QR active)
- `ProfileSwitcher` bottom sheet (Framer Motion `drag="y"`)
- Active profile indicator in navigation header
- `WelcomeAnimation` in `LoginView` — 2s orchestrated Framer Motion sequence
- Birthday greeting variant + time-aware "Buenos días/tardes/noches" in welcome sequence
- Session flag preventing welcome animation replay on in-session navigation

**Addresses:** QR credential card, multi-profile switching, premium welcome animation, birthday + time-aware greeting
**Avoids:** U-4 (JWT scope mismatch — raise with backend before implementing switcher), P-2 (animation re-trigger on route change), U-1 (auth flow + animation as atomic change)
**Research flag:** Verify `/family/members` endpoint exists and returns expected shape (check `backend-audit.md`)

---

### Phase 3: Booking UX Redesign

**Rationale:** The booking improvements are the most complex new components (`TimeStrip`, `CourtCard`, `StaffPicker`) and are independent of identity features. They depend only on the adaptive Button primitive (Phase 1) and platform tokens (Phase 1). Building them after identity features ensures the component patterns are established before tackling the highest-complexity work.

**Delivers:**
- `TimeStrip.tsx` — horizontal CSS scroll-snap time slot picker (replaces `TIME_SLOTS` map in CatalogView)
- `CourtCard.tsx` — visual court/resource selector with photo placeholder, availability color coding
- `StaffPicker.tsx` — avatar card staff selection with "sin preferencia" default
- "Unidad favorita" star toggle on court cards with `localStorage` persistence
- Starred courts sorted first in CatalogView
- Booking confirmation bottom sheet summary
- `Button.tsx` platform variant (iOS pill / Material rounded)

**Addresses:** PlayTomic-style time strip, visual court cards, staff selection, saved favorite courts
**Avoids:** C-4 (horizontal drag/scroll conflict — use CSS scroll-snap, not Framer drag), C-3 (touch bugs — `touchAction: pan-x` on time strip container)
**Research flag:** Test on physical Android device before marking done — scroll conflicts are invisible on desktop

---

### Phase 4: Platform Chrome + Polish

**Rationale:** Platform-adaptive navigation chrome (iOS large-title header, Android top app bar, platform-specific ripple) is last because it requires all content to be complete to verify it integrates correctly. The hospitality notifications (anniversary, consistent skeleton states) are low-effort additions that round out the polish pass.

**Delivers:**
- `NavBar.tsx` — iOS large-title collapsing navigation header
- `BottomNav.tsx` modifications — Android variant with top app bar and ripple feedback
- `MobileLayout.tsx` — iOS status bar top padding, full safe-area audit
- Android Material ripple via CSS `:active` pseudo-element (not Framer Motion)
- Glassmorphism performance audit — Android fallback to solid semi-transparent background
- Membership anniversary in-app notification card
- Uniform skeleton loading state audit across all views
- WCAG AA contrast audit for light mode text colors

**Addresses:** Platform-adaptive navigation, Android ripple, anniversary milestone, polish pass
**Avoids:** T-1 (component explosion — only 4 chrome components are platform-split), P-4 (concurrent route animations — opacity fade only for tab nav), P-1 (glassmorphism scroll jank on Android)
**Research flag:** No additional research needed — patterns are established; Android device testing is the critical gate

---

### Phase Ordering Rationale

- **Infrastructure before features:** `themeStore` and `platformStore` are consumed by every component added in phases 2–4. Building features first means immediately refactoring them to consume the store once it lands.
- **Identity before booking:** The credential card and welcome animation are the demo centerpieces. De-risking them early means the booking UX (highest complexity) is isolated to its own phase.
- **Chrome last:** Platform navigation chrome is the riskiest for component explosion (pitfall T-1). Building it last means the content layer is stable and the boundary can be enforced cleanly.
- **Auth fix is Phase 1, not Phase 2:** The broken auth flow (profiles before password) blocks the welcome animation trigger point, the profile switching UX, and the birthday personalization. It is a prerequisite for three other features — it must land first.

### Research Flags

**Phases needing deeper research before planning:**
- **Phase 2 (Profile Switching):** The `/family/members` API endpoint — confirm it exists, returns `[{ id, member_number, first_name, role }]`, and that the JWT scope question has a backend answer before implementing `switchProfile`. Check `backend-audit.md` for current endpoint status.
- **Phase 3 (Booking):** The staff availability API — confirm whether staff filtering is by time slot or by resource, and what the response shape is. The current CatalogView does not appear to have staff selection at all.

**Phases with standard patterns (skip additional research):**
- **Phase 1:** Theme system (Tailwind v4 official docs confirmed), platform detection (Capacitor stable API), Framer Motion (v12 installed and confirmed).
- **Phase 4:** Platform chrome patterns are well-documented in iOS HIG and Material Design 3; no library research needed.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All recommendations grounded in installed `package.json` versions; only `qrcode.react` is unverified in live npm (version 4.x assumed) — verify on install |
| Features | HIGH | Directly derived from codebase analysis + explicit design spec; no speculative claims |
| Architecture | HIGH | Direct code inspection of all key files; Tailwind v4 confirmed via official docs; Capacitor API MEDIUM (training knowledge, not live-fetched) |
| Pitfalls | HIGH | C-3 (Samsung Fold touch bug) confirmed by existing `Button.tsx` fix already in codebase; all others grounded in direct code inspection |

**Overall confidence: HIGH**

### Gaps to Address During Implementation

- **`qrcode.react` version:** Install and confirm the installed version is 4.x (React 19 peer dep). If 3.x installs instead, verify React 19 compatibility before proceeding.
- **`/family/members` endpoint shape:** Verified against `backend-audit.md` but not re-confirmed in this research pass. Confirm `profiles[]` array structure before `profileStore` implementation.
- **Staff availability API:** No staff selection exists in the current booking flow. Before building `StaffPicker.tsx`, confirm endpoint existence and filtering logic with backend team.
- **`Capacitor.getPlatform()` in v8.1.0:** Platform detection relies on this API being stable in the installed version. Verify against local `@capacitor/core` type definitions at Phase 1 start.
- **Profile switching JWT scope:** Must be resolved with backend before Phase 2. Options: (a) dedicated `/auth/switch-profile` endpoint returning new JWT, or (b) re-auth flow with pre-filled member number. Do not implement switcher without this answer.

---

## Sources

### Primary (HIGH confidence)
- `package.json` / `package-lock.json` — locked versions for all existing dependencies
- Tailwind CSS v4 dark mode documentation: https://tailwindcss.com/docs/dark-mode (fetched 2026-03-11)
- Tailwind CSS v4 blog: https://tailwindcss.com/blog/tailwindcss-v4 (fetched 2026-03-11)
- Direct codebase inspection: `src/App.tsx`, `src/index.css`, `src/store/authStore.ts`, `src/components/layout/MobileLayout.tsx`, `src/components/layout/BottomNav.tsx`, `src/components/ui/Button.tsx`, `src/views/HomeView.tsx`, `src/views/LoginView.tsx`, `src/views/CatalogView.tsx`
- Design spec: `docs/plans/2026-03-11-v2-ux-premium-design.md`
- Project context: `.planning/PROJECT.md`
- Backend audit: `.planning/research/backend-audit.md`

### Secondary (MEDIUM confidence)
- `qrcode.react` — training knowledge (dominant React QR library, 2M+ weekly downloads); version 4.x compatibility assumed — verify on install
- `Capacitor.getPlatform()` API — training knowledge for Capacitor 3–8 core API (stable); verify against installed v8.1.0 type definitions
- iOS Human Interface Guidelines — navigation patterns, safe areas, gesture conventions
- Material Design 3 — top app bar, FAB, ripple, navigation components
- PlayTomic / Courtside booking UX patterns — domain knowledge

---

*Research completed: 2026-03-11*
*Ready for roadmap: yes*
