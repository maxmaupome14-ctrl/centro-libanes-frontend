# Architecture Patterns: Platform-Adaptive Premium UX

**Domain:** Mobile-first PWA + Capacitor iOS club management app
**Researched:** 2026-03-11
**Overall confidence:** HIGH (based on direct codebase inspection + official Tailwind v4 docs)

---

## System Overview

The existing app is a single React tree rooted in `App.tsx` → `BrowserRouter` → route shell. The member app wraps all authenticated member routes under `MobileLayout` (which renders `BottomNav` + `<Outlet>`). The platform-adaptive milestone adds two cross-cutting concerns — **platform identity** and **theme mode** — that must be made available to the entire component tree without prop-drilling.

The cleanest integration point is a new `AppProviders` wrapper inserted between `App.tsx`'s `BrowserRouter` and `ToastProvider`. Every other component reads platform/theme state from Zustand stores; no component owns or manages that state directly.

### Existing structure (condensed)

```
App.tsx
  BrowserRouter
    ToastProvider
      Routes
        /login → LoginView
        /employee → EmployeeDashboard
        MobileLayout (member shell)
          BottomNav
          <Outlet> → HomeView | CatalogView | LockerView | FamilyView | ProfileView | PaymentView | NotificationsView
        /admin → AdminView
```

### Target structure after milestone

```
App.tsx
  BrowserRouter
    AppProviders            ← NEW: wraps ThemeProvider + PlatformProvider
      ToastProvider
        Routes
          ... (unchanged routes)
```

`AppProviders` is a thin composition root — it renders no DOM. It initialises the `themeStore` and `platformStore` on mount and applies the `data-theme` and `data-platform` attributes to `document.documentElement`.

---

## Component Responsibilities

| Component / Module | Responsibility | Communicates With |
|--------------------|---------------|-------------------|
| `src/store/themeStore.ts` (NEW) | Persists `theme: 'light' \| 'dark' \| 'auto'`, derives resolved theme from `prefers-color-scheme`, writes `data-theme` to `<html>` | `useThemeStore` hook used by ThemeToggle, AppProviders |
| `src/store/platformStore.ts` (NEW) | Detects and stores `platform: 'ios' \| 'android' \| 'web'`, writes `data-platform` to `<html>` | `usePlatform` hook used by layout components, adaptive components |
| `src/store/profileStore.ts` (NEW) | Holds `activeProfile: User` (selected family member), `profiles: User[]`, `switchProfile(id)` | `useProfileStore` used by HomeView credential card, BottomNav avatar |
| `src/hooks/usePlatform.ts` (NEW) | Reads `platformStore`, returns `{ platform, isIOS, isAndroid, isWeb }` | All platform-branching components |
| `src/hooks/useTheme.ts` (NEW) | Reads `themeStore`, returns `{ theme, resolvedTheme, setTheme }` | ThemeToggle, AppProviders |
| `src/components/providers/AppProviders.tsx` (NEW) | Mounts stores, applies HTML attributes, renders children | themeStore, platformStore |
| `src/components/layout/MobileLayout.tsx` (MODIFY) | Add iOS top safe-area padding (status bar); delegate to `NavBar` or `TabBar` based on platform | platformStore, BottomNav |
| `src/components/layout/BottomNav.tsx` (MODIFY) | Become `TabBar` for iOS style; Android gets a different visual treatment | platformStore |
| `src/components/layout/NavBar.tsx` (NEW) | iOS-style large title navigation header for views that need it | platformStore, React Router location |
| `src/components/ui/Button.tsx` (MODIFY) | Add `platform` prop (or auto-detect via hook) to switch between iOS pill shape / Material 3 filled style | platformStore |
| `src/components/ui/CredentialCard.tsx` (EXTRACT + MODIFY) | Extract from HomeView inline JSX into standalone component; add QR code tab / flip | profileStore |
| `src/components/ui/QRCode.tsx` (NEW) | Renders QR code canvas from `member_number`; uses `qrcode` npm package | receives `value: string` prop |
| `src/components/ui/ThemeToggle.tsx` (NEW) | Three-way toggle (light/dark/auto); writes to themeStore | themeStore |
| `src/components/ui/ProfileSwitcher.tsx` (NEW) | Sheet/popover showing family member list; calls `switchProfile` | profileStore, FamilyView data |
| `src/components/booking/TimeStrip.tsx` (NEW) | Horizontal scrollable time slot picker (PlayTomic pattern) | Receives slots as props, calls onSelect |
| `src/components/booking/CourtCard.tsx` (NEW) | Visual court/resource selector card | Receives court data as props |
| `src/views/HomeView.tsx` (MODIFY) | Replace inline credential card with `<CredentialCard>`, add welcome animation wrapper | profileStore, themeStore |

---

## Recommended Project Structure

Only new directories/files shown. Existing files that are modified are marked `(MODIFY)`.

```
src/
  store/
    authStore.ts              (existing)
    themeStore.ts             NEW
    platformStore.ts          NEW
    profileStore.ts           NEW
  hooks/
    usePlatform.ts            NEW
    useTheme.ts               NEW
  components/
    providers/
      AppProviders.tsx        NEW
    layout/
      MobileLayout.tsx        MODIFY
      BottomNav.tsx           MODIFY  (rename to TabBar internally or keep name)
      NavBar.tsx              NEW     (iOS large-title style header)
    ui/
      Button.tsx              MODIFY
      Card.tsx                (existing, likely untouched)
      CredentialCard.tsx      NEW     (extracted + enhanced from HomeView)
      QRCode.tsx              NEW
      ThemeToggle.tsx         NEW
      ProfileSwitcher.tsx     NEW
      WelcomeAnimation.tsx    NEW     (Framer Motion entrance sequence)
    booking/
      TimeStrip.tsx           NEW
      CourtCard.tsx           NEW
      StaffPicker.tsx         NEW
  views/
    HomeView.tsx              MODIFY
    CatalogView.tsx           MODIFY  (inject new booking components)
    LoginView.tsx             MODIFY  (add WelcomeAnimation post-login)
    ProfileView.tsx           MODIFY  (add ThemeToggle, profile switching)
```

---

## Architectural Patterns

### Pattern 1: Data-Attribute Theme Gate

**What:** `themeStore` writes `data-theme="dark"` or `data-theme="light"` to `document.documentElement`. CSS custom properties in `index.css` are scoped to `[data-theme="light"]` and `:root` (dark default). Tailwind v4's `@custom-variant dark` targets `[data-theme=dark]`.

**Why this over class-based:** The app already uses only CSS custom properties for colors — no Tailwind color utilities. The `data-theme` attribute avoids class list pollution and works identically in Capacitor WebView (same DOM). The `auto` mode uses a `matchMedia('(prefers-color-scheme: light)')` listener inside `themeStore` to derive the resolved theme at runtime.

**Implementation shape:**

```css
/* index.css — extend existing :root block */
:root {
  /* existing dark palette stays as default */
}

[data-theme="light"] {
  --color-bg: #F8F7F4;
  --color-bg-elevated: #FFFFFF;
  --color-surface: #FFFFFF;
  --color-surface-hover: #F0EFE9;
  --color-border: rgba(0, 0, 0, 0.07);
  --color-text-primary: #1A1A1A;
  --color-text-secondary: #555555;
  --color-text-tertiary: #999999;
}
```

```typescript
// themeStore.ts shape
type ThemeMode = 'light' | 'dark' | 'auto';
interface ThemeState {
  mode: ThemeMode;
  resolved: 'light' | 'dark';   // computed from mode + OS pref
  setMode: (m: ThemeMode) => void;
}
```

The store applies `document.documentElement.setAttribute('data-theme', resolved)` on every `resolved` change. Components never touch the DOM directly.

### Pattern 2: Data-Attribute Platform Gate

**What:** `platformStore` detects platform once on mount, writes `data-platform="ios"` (or `android` / `web`) to `document.documentElement`. Components use the `usePlatform()` hook for branching, not conditional CSS.

**Detection strategy:**

1. Check `window.Capacitor?.getPlatform()` — available when running inside Capacitor WebView (iOS/Android native).
2. If `window.Capacitor` is undefined (pure PWA/browser), fall back to `web`.
3. Web browsers that are iOS Safari (PWA on iPhone) still report `web` because Capacitor is not active — the app will render iOS-style by default per the project decision in `PROJECT.md`: "Web defaults to iOS style."

```typescript
// platformStore.ts shape
type Platform = 'ios' | 'android' | 'web';
interface PlatformState {
  platform: Platform;
}
// Resolved once, never changes after mount. No actions needed.
```

`usePlatform()` returns `{ platform, isIOS, isAndroid, isWeb }`. `isIOS` is true for both native iOS and web (fallback).

### Pattern 3: Variant-Prop Component Branching

**What:** Platform-adaptive components (Button, BottomNav, NavBar) accept an optional `platformVariant` prop but default to reading from `usePlatform()`. This keeps call sites clean while allowing forced overrides in tests or Storybook.

**Button example (modification to existing):**

```typescript
// The existing Button already uses variant + size.
// Add a platformVariant that overrides border-radius:
// iOS: rounded-full (pill)
// Android/Material 3: rounded-[var(--radius-sm)] (less rounded)
const platformRadius: Record<Platform, string> = {
  ios: 'rounded-full',
  android: 'rounded-[var(--radius-sm)]',
  web: 'rounded-full',  // iOS default per project decision
};
```

Do not create separate `IOSButton` and `AndroidButton` components. One `Button` with a branch is simpler and keeps the existing import path unchanged.

### Pattern 4: Zustand Slice Separation

**What:** Do not bloat `authStore`. Each cross-cutting concern gets its own store slice.

- `authStore` — authentication only (existing, unchanged)
- `themeStore` — theme mode + resolution
- `platformStore` — platform detection (set once, read many)
- `profileStore` — active profile within a family group (depends on `authStore.user`)

`profileStore` reads the authenticated user's family data. It calls `api.get('/family/members')` once on initialisation (after auth) and caches the member list. The `switchProfile` action updates `activeProfile`, which HomeView's credential card and greeting section read.

### Pattern 5: QR Code as Pure Display Component

**What:** `QRCode.tsx` renders a `<canvas>` element using the `qrcode` npm package (`npm install qrcode @types/qrcode`). It receives a `value` string prop and optional `size` and `fgColor` / `bgColor` props.

**Why `qrcode` over `react-qr-code`:** The `qrcode` package produces a canvas (not SVG inline), which allows the credential card to show a clean scannable QR with no DOM nesting. It is also smaller in bundle size when tree-shaken to the `QRCode.toCanvas` method.

**Integration in CredentialCard:** The card gets a two-state toggle — card face (existing) and QR back (new). A Framer Motion `rotateY` animation (card flip) transitions between them. The flip is triggered by a tap on the QR icon button in the card corner.

### Pattern 6: WelcomeAnimation as Route-Level Gate

**What:** After login completes and `authStore.isAuthenticated` becomes true, `LoginView` does NOT immediately navigate. Instead it renders `WelcomeAnimation` which plays a 1.5–2s Framer Motion sequence (logo reveal + name greeting + club entrance metaphor), then calls `navigate('/')` at sequence end via `onAnimationComplete`.

**Why at the view level, not app level:** Keeping the animation inside `LoginView` means it only plays on explicit login, not on page refresh (where the user is already authenticated and hits `/` directly via ProtectedRoute). This is the correct hospitality moment.

---

## Data Flow

### Theme State Flow

```
User taps ThemeToggle
  → themeStore.setMode('dark')
    → if mode === 'auto': subscribe to matchMedia listener
    → compute resolved: 'dark'
    → document.documentElement.setAttribute('data-theme', 'dark')
      → CSS custom properties switch globally
        → all components using var(--color-*) re-render with new values
          (no React re-render needed — CSS handles it)
    → persist mode to localStorage

On app boot (AppProviders mount):
  → read localStorage 'theme-mode' → themeStore.setMode(saved || 'dark')
```

React components only re-render when they explicitly subscribe to `themeStore` (e.g., `ThemeToggle` to show current state). The rest of the UI updates via CSS cascade, not React.

### Platform State Flow

```
AppProviders mounts (once)
  → platformStore detects: window.Capacitor?.getPlatform() ?? 'web'
  → document.documentElement.setAttribute('data-platform', platform)
  → store freezes (no further updates)

Components call usePlatform()
  → read platformStore.platform
  → return { platform, isIOS: platform !== 'android', isAndroid: platform === 'android', isWeb: platform === 'web' }
```

No subscriptions needed after initial detection. `usePlatform()` can use `useRef` internally for a zero-overhead read once the store is populated.

### Profile Switch Flow

```
Auth login succeeds
  → authStore.login(user, token)
  → profileStore.init(user)  ← called by AppProviders useEffect watching authStore.isAuthenticated
    → api.get('/family/members')
    → set profiles = [titular, ...dependientes]
    → set activeProfile = titular (or last-used from localStorage)

User taps ProfileSwitcher
  → profileStore.switchProfile(memberId)
    → set activeProfile = profiles.find(p => p.id === memberId)
    → persist activeProfile.id to localStorage

HomeView reads useProfileStore().activeProfile
  → renders credential card for activeProfile
  → renders greeting for activeProfile.first_name
```

`authStore` is the authoritative identity for API calls (JWT token). `profileStore.activeProfile` is display-only — it changes what the UI shows, but API calls still use `authStore.token`.

### QR Code Data Flow

```
CredentialCard renders
  → reads activeProfile.member_number
  → passes to QRCode as value prop
  → QRCode calls qrcode.toCanvas(canvasRef.current, value, options)
    → canvas draws QR synchronously (no async needed for small strings)

Card face vs QR back:
  → local state: cardFace: 'front' | 'back'
  → tap QR icon → setCardFace('back')
  → Framer Motion rotateY 0→180
  → tap back → setCardFace('front') → rotateY 180→0
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Prop-Drilling Platform and Theme

**What goes wrong:** Passing `platform` and `theme` as props through MobileLayout → HomeView → CredentialCard.
**Why bad:** Every intermediate component becomes coupled. Adding a new deep component requires touching all parents.
**Instead:** Read from stores directly at the component that needs the value. `usePlatform()` and `useTheme()` can be called at any depth.

### Anti-Pattern 2: Platform Branching with Separate Component Trees

**What goes wrong:** `{isIOS ? <IOSBottomNav /> : <AndroidBottomNav />}` at the layout level.
**Why bad:** Duplicate component logic, two files to maintain for every adaptive element, structural divergence that makes shared animation state impossible.
**Instead:** Single `BottomNav` component with conditional class application. Branch on visual tokens (border-radius, shadow, background opacity) not on structure. The tab list, routing logic, and active-state highlight logic stay in one place.

### Anti-Pattern 3: Putting Theme Logic Inside index.css Directly

**What goes wrong:** Adding `@media (prefers-color-scheme: light)` blocks to `index.css` instead of a store-controlled `data-theme`.
**Why bad:** The app needs user-overridable theme (light/dark/auto). A media-query-only approach cannot be overridden programmatically. The user's preference would be ignored if they explicitly set "dark" but their OS is in light mode.
**Instead:** Use `data-theme` attribute controlled by `themeStore`. The store's `auto` mode still listens to `matchMedia` but a user-set `light` or `dark` overrides it.

### Anti-Pattern 4: Fetching Family Members Inside Components

**What goes wrong:** Each component that needs family data fetches independently (e.g., CredentialCard, ProfileSwitcher, HomeView all call `api.get('/family/members')`).
**Why bad:** Redundant network calls on every mount. Race conditions if multiple components mount simultaneously. Stale data if one component updates and others don't.
**Instead:** `profileStore` fetches once on auth, caches in Zustand. Components subscribe to the store.

### Anti-Pattern 5: Animating Theme Transitions with Framer Motion

**What goes wrong:** Using Framer Motion `animate` on every element when theme changes.
**Why bad:** Theme toggle should be instant or use a single CSS transition on `background-color` and `color`. Applying JS-driven animation to hundreds of elements causes jank.
**Instead:** Add `transition: background-color 200ms ease, color 200ms ease, border-color 200ms ease` to `body` in `index.css`. The CSS cascade handles smooth theme transitions without any JS animation overhead.

---

## Build Order (Phase Dependencies)

This is the dependency graph that should drive roadmap phase ordering:

```
1. themeStore + platformStore + AppProviders
   (Everything else depends on platform detection and theme being available)

2. index.css light theme tokens + data-theme wiring
   (Theme tokens must exist before any component uses them)

3. usePlatform() + useTheme() hooks
   (Hooks wrap stores; must exist before components use them)

4. MobileLayout + BottomNav modifications
   (Shell must be adaptive before views matter)

5. Button.tsx platform variant
   (Core primitive; booking components need an adaptive Button)

6. profileStore + ProfileSwitcher
   (Requires auth to be working; HomeView needs profiles before credential card upgrade)

7. CredentialCard extraction + QRCode component
   (Depends on profileStore.activeProfile)

8. WelcomeAnimation in LoginView
   (Depends on nothing new; can be built any time after auth works)

9. Booking components (TimeStrip, CourtCard, StaffPicker)
   (Depends on adaptive Button, platform tokens; independent of credential card)

10. NavBar component
    (Can be added per-view as needed; depends on platform detection)
```

Phases 1–3 are pure infrastructure and must be completed before any visible UI work in phases 4+. They have zero user-visible output on their own but unblock everything else.

---

## Integration Points with Existing Architecture

### What is NOT touched

| Existing file | Reason unchanged |
|---------------|-----------------|
| `authStore.ts` | Authentication logic is complete and stable |
| `services/api.ts` | HTTP client is correct; no changes needed |
| `lib/utils.ts` | `cn()` utility is reused as-is |
| All view data-fetching logic | API calls and state within views stay unchanged |
| React Router v7 route structure | No routing changes; new layout features sit inside existing shells |
| `AdminView.tsx`, `EmployeeDashboard.tsx` | Out of scope for UX milestone |
| `vercel.json`, `vite.config.ts`, `capacitor.config.ts` | No infra changes |

### CSS Custom Properties Strategy

The existing `index.css` already uses 100% CSS custom properties for color. This is the correct foundation. The light theme is added as a `[data-theme="light"]` block that overrides the same variable names. No existing component class names change — they all resolve from `var(--color-*)` which will automatically reflect the active theme.

The `glass` and `glass-light` utility classes in `index.css` use hardcoded `rgba(17, 17, 17, 0.72)` — these need light-theme variants. The cleanest approach is to convert them to classes that use CSS variables, or to add `[data-theme="light"] .glass { background: rgba(255,255,255,0.72); }` overrides.

### Framer Motion Compatibility

The existing `motion.button` usage in `Button.tsx` and `motion.div` usage throughout views is compatible with the new milestone. Framer Motion 12 (the installed version) supports all planned animations. The WelcomeAnimation sequence and the credential card flip use standard `motion.div` with `animate` and `variants` props — no new Framer Motion APIs are required.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Existing codebase integration points | HIGH | Direct code inspection of all key files |
| Theme system (data-theme + CSS custom props) | HIGH | Confirmed via Tailwind v4 official docs |
| Platform detection via Capacitor | MEDIUM | Capacitor docs unreachable; API confirmed from training knowledge (`Capacitor.getPlatform()`); verify against installed `@capacitor/core` v8.1.0 type definitions |
| QR code generation (`qrcode` package) | MEDIUM | Package well-established; canvas API usage confirmed from training knowledge; verify `@types/qrcode` installation before build |
| profileStore / family member fetch | MEDIUM | Backend endpoint `/family/members` existence should be verified against `backend-audit.md` before phase begins |
| Framer Motion card flip animation | HIGH | `rotateY` on `motion.div` with `perspective` is standard Framer Motion API |

---

## Sources

- Direct codebase inspection: `src/App.tsx`, `src/index.css`, `src/store/authStore.ts`, `src/components/layout/MobileLayout.tsx`, `src/components/layout/BottomNav.tsx`, `src/components/ui/Button.tsx`, `src/views/HomeView.tsx`, `package.json`
- Tailwind CSS v4 dark mode documentation: https://tailwindcss.com/docs/dark-mode (fetched 2026-03-11)
- Project context: `.planning/PROJECT.md`
- Capacitor Device API: training knowledge (Capacitor v8, `@capacitor/core` v8.1.0 installed — verify `Capacitor.getPlatform()` against local type definitions)
