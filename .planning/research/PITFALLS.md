# Domain Pitfalls — Platform-Adaptive UX & Premium Animations

**Project:** Centro Libanés v2.0 Premium UX
**Domain:** Adding platform-adaptive design, theme system, and premium animations to an existing React + Tailwind + Framer Motion app
**Researched:** 2026-03-11
**Confidence:** HIGH (based on direct codebase analysis + known Framer Motion touch behavior patterns)

---

## Critical Pitfalls

Mistakes in this category cause rewrites, broken devices, or inaccessible UI.

---

### Pitfall C-1: User Agent Platform Detection Is Unreliable for PWA Context

**What goes wrong:**
`navigator.userAgent` parsing cannot distinguish between "iOS Safari PWA (added to home screen)" and "iOS Safari browser tab." Both report identical UA strings. An Android Chrome user accessing the PWA from the browser gets the same UA as a standalone installed app. If `usePlatform()` branches hard on UA, the wrong design shell renders on a meaningful slice of users.

**Why it happens:**
UA strings are set by the browser/OS, not the install context. A PWA running in standalone mode on iOS reports the same UA as Safari browser. The `navigator.standalone` property exists on iOS Safari but is only `true` when actually installed as a PWA — it doesn't affect Android.

**Consequences:**
- iOS users accessing via browser tab may get "iOS shell" while Android tablet users get "Android shell" when they expected something else
- Samsung Galaxy Fold in "cover screen" mode vs "open screen" has different viewport widths but the same UA — platform shell could be correct while layout breaks
- "Web defaults to iOS style" fallback (documented in v2 design doc) is the right call but only works if the fallback is explicit, not inferred

**Prevention:**
Use a multi-signal detection approach, not UA alone:

```typescript
function detectPlatform(): 'ios' | 'android' | 'web' {
  const ua = navigator.userAgent;
  // Check Capacitor first (most reliable when running in native wrapper)
  if (window.Capacitor?.getPlatform) {
    return window.Capacitor.getPlatform() as 'ios' | 'android';
  }
  // UA checks as secondary signal only
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'web'; // explicit fallback to iOS shell per v2 design decision
}
```

Cache the result in a module-level variable (not re-evaluated per render). Apply `data-platform="ios|android|web"` to `<html>` once on app init — CSS can then scope platform styles without JavaScript per-component checks.

**Warning signs:**
- `usePlatform()` called inside render functions (performance) or re-evaluated on route changes (correctness)
- Platform detection logic spread across multiple components instead of one hook
- No fallback behavior when UA parsing returns ambiguous results

**Phase:** Platform detection hook must be implemented in Phase 1 of v2 (foundation phase). All subsequent platform-adaptive components depend on it being correct.

---

### Pitfall C-2: Theme System Flash of Unstyled Content (FOUC) on First Load

**What goes wrong:**
The existing app uses CSS custom properties defined on `:root` and Tailwind classes. When a theme system is added, there is a window between when JavaScript loads and when the theme preference is read from `localStorage` and applied. During this window, the page renders with the default (wrong) theme — causing a visible flash.

**Why it happens:**
React renders after JS parses and executes. Reading `localStorage` and applying CSS custom properties via a React context/provider happens after the initial paint. The existing `index.html` has no theme initialization script, so the first paint always uses the default CSS values.

**Current codebase state:**
`index.css` defines all colors on `:root` with only one color set (dark mode values hardcoded). When a light mode is added, any user who has previously selected light mode will see a dark flash before React runs.

**Consequences:**
- Jarring flash on every page load for users whose preference differs from default
- On slow connections (club WiFi, mobile data), the flash lasts longer
- Particularly bad on the credential card — the shimmer animation starts before theme is correct

**Prevention:**
Add a blocking inline script to `index.html` that reads `localStorage` and applies the `data-theme` attribute to `<html>` *before* React loads:

```html
<!-- index.html, inside <head> before any stylesheet -->
<script>
  (function() {
    try {
      var stored = localStorage.getItem('theme');
      var system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      var theme = stored || 'auto';
      document.documentElement.setAttribute('data-theme',
        theme === 'auto' ? system : theme
      );
    } catch(e) {}
  })();
</script>
```

Then drive all theme colors from `[data-theme="dark"]` and `[data-theme="light"]` CSS selectors rather than JS-applied inline styles.

**Warning signs:**
- Theme stored in React state or context with no synchronous initialization
- `useEffect` used to apply theme (always runs after paint)
- `document.documentElement.style.setProperty` called from a component (timing problem)

**Phase:** Must be done in the same phase that adds the theme toggle. Cannot be deferred — it's invisible during development (local fast reload) but always visible in production.

---

### Pitfall C-3: Framer Motion `whileTap` Touch Issues on Foldable / Multi-Touch Devices

**What goes wrong:**
This is a known issue in this specific codebase. `motion.button` with `whileTap` scale triggers incorrectly on Samsung Galaxy Fold and other foldable devices. The symptom: button fires multiple touch events or the scale animation gets "stuck" in a scaled-down state when the user lifts their finger during a concurrent touch gesture.

**Root cause:**
Framer Motion's `whileTap` uses pointer events to track the "tap" gesture. On foldable devices in cover/open screen modes, the touch coordinate system can shift mid-gesture during screen rotation. Additionally, some Samsung firmware versions emit both `touchstart` and `pointerdown` events for the same touch, causing double-trigger of the tap handler.

**Current status:**
The `Button.tsx` component already has the fix applied: `style={{ touchAction: 'manipulation' }}`. This is correct and prevents browser-level pan/zoom interpretation, reducing spurious events. However, this fix is only on `<Button>`. The codebase has bare `<motion.button>` elements in `HomeView.tsx` (quick action buttons, profile list items in LoginView) that do NOT have `touchAction: 'manipulation'`.

**Consequences without fix:**
- Double-tap booking action fires twice (creates duplicate reservation)
- Profile selection in login flow selects wrong profile on fold
- Scale animation stays at 0.96 leaving button visually "pressed"

**Prevention:**
Apply `touchAction: 'manipulation'` universally to all `motion.button` elements. Create a helper or extend the `Button` component so it's impossible to use `motion.button` with `whileTap` without the fix:

```typescript
// Canonical pattern — use everywhere
<motion.button
  whileTap={{ scale: 0.96 }}
  style={{ touchAction: 'manipulation' }}
  // ...
/>
```

Add an ESLint rule or code review checklist item: "No `motion.button` with `whileTap` without `touchAction: manipulation`."

For the new Material ripple (Android platform), implement ripple as a CSS `:active` state rather than a Framer Motion animation — pure CSS ripples are immune to touch event duplication.

**Warning signs:**
- New interactive `motion.button` elements added during v2 work without `touchAction: 'manipulation'`
- Horizontal scrollable time strips (PlayTomic booking UX) using `motion.div` drag without `dragDirectionLock` and `touchAction: 'pan-y'`

**Phase:** Audit every existing `motion.button` in Phase 1 (foundation). Apply fix before adding new interactive elements. The booking time strip (new component) needs extra care.

---

### Pitfall C-4: Horizontal Drag/Scroll Conflict in Booking Time Strip

**What goes wrong:**
The PlayTomic-inspired horizontal time strip involves a horizontally scrollable list of time slots. If implemented with Framer Motion `drag="x"`, it conflicts with the parent `main` scroll container which has `overflow-y: auto`. On iOS Safari and Chrome Android, the browser cannot simultaneously honor both vertical scroll and horizontal drag — it picks one, often the wrong one.

**Why it happens:**
Touch events have a single direction lock per gesture. When the user touches the time strip diagonally (even slightly), the browser must decide: is this a vertical scroll or horizontal drag? With Framer Motion drag, this decision races against the browser's own scroll handling.

**Current codebase state:**
`body` has `touch-action: pan-x pan-y` which is permissive (allows both). The `main` scroll container in `MobileLayout.tsx` has no explicit `touch-action`. A horizontal drag element inside a vertical scroll container is the classic conflict.

**Consequences:**
- Time strip randomly refuses to scroll horizontally (vertical scroll wins)
- Vertical page scroll triggers inside the time strip unexpectedly
- On Samsung Fold, the issue is amplified because the hinge area has different touch sensitivity

**Prevention:**
Use CSS `overflow-x: auto` + `scroll-snap` on the time strip container instead of Framer Motion drag. This delegates to native browser scroll which handles the conflict correctly:

```css
.time-strip {
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-x; /* critical: tells browser this is horizontal */
}
.time-slot {
  scroll-snap-align: start;
}
```

If Framer Motion drag is needed for physics-based momentum, set `dragDirectionLock={true}` and wrap the strip in a container with `touch-action: pan-x`.

**Warning signs:**
- Using `motion.div drag="x"` inside a `overflow-y: auto` container
- Not setting `touchAction` on draggable elements
- Testing only on desktop browser (no conflict visible — only fails on physical mobile)

**Phase:** Booking UX phase. Must test on physical Android device before considering done.

---

## Technical Debt Patterns

Mistakes that don't break immediately but accumulate into a rewrite.

---

### Pitfall T-1: Component Explosion from Platform Branching

**What goes wrong:**
A `<PlatformButton>` component starts with 10 lines and a simple `if (platform === 'ios')` check. Six months later it has 150 lines, 8 props, and two teams arguing about which props apply to which platform. The "shared logic, split presentation" model from the v2 design doc is correct in principle but requires discipline to prevent the split layer from leaking into business logic.

**Pattern that causes this:**
```typescript
// Starts reasonable
function PlatformNavBar({ title }) {
  const platform = usePlatform();
  if (platform === 'android') return <MaterialNavBar title={title} />;
  return <IOSNavBar title={title} />;
}

// Six months later
function PlatformNavBar({ title, showBack, onBack, actions, tintColor,
  androidElevation, iosBlur, iosLargeTitle, androidCollapsible, ... }) {
```

**Prevention:**
Keep platform-split components to navigation chrome only: `BottomNav`, `TopAppBar`, `ActionSheet`, `FAB`. All content components (cards, forms, booking flow) remain platform-agnostic. If a content component needs platform-specific behavior, use a CSS class on `<html>` driven by `data-platform`:

```css
/* Better than JS branching in content components */
[data-platform="android"] .booking-card {
  border-radius: 12px; /* Material */
}
[data-platform="ios"] .booking-card {
  border-radius: 18px; /* HIG */
}
```

Define and document the boundary in the platform layer before writing any component: "these 4 components are platform-split, everything else is shared."

**Warning signs:**
- Content components importing `usePlatform()`
- More than 5 platform-split components
- Props named `iosXxx` or `androidXxx` on any component

**Phase:** Foundation phase. Establish the boundary in the `usePlatform()` hook PR — document which components are in scope for platform splitting and which are not.

---

### Pitfall T-2: Tailwind v4 + CSS Custom Properties Theme Collision

**What goes wrong:**
The project uses Tailwind CSS v4 (confirmed in `package.json`: `"tailwindcss": "^4.2.1"`). Tailwind v4 changed how design tokens are defined — it uses CSS custom properties natively and deprecates `tailwind.config.js` theme extension. The existing `index.css` already defines all colors as CSS custom properties on `:root`. If a theme system adds a second set of property definitions (e.g., `[data-theme="light"]` overrides), there can be specificity conflicts with Tailwind's own generated custom properties.

**Specific risk in this codebase:**
The existing code uses both `bg-[var(--color-surface)]` (Tailwind arbitrary value with CSS var) and `style={{ background: 'var(--color-surface)' }}` (inline style). When the theme switches, both should update — but only if the CSS custom property on the correct selector (`:root` or `[data-theme]`) changes. Inline styles take precedence over classes, which means `style={{ background: 'var(--color-bg)' }}` will correctly follow theme changes, but `bg-[var(--color-bg)]` might not in all cases.

**Prevention:**
- Define all theme-variant colors under `[data-theme="dark"]` and `[data-theme="light"]` selectors, not on `:root` directly
- Keep `--color-*` variable names identical between themes; only the values change
- Avoid mixing inline `style={{ color: 'var(--x)' }}` and Tailwind class `text-[var(--x)]` for the same property — pick one convention per property

**Warning signs:**
- Theme toggle works in Chromium DevTools but not in production build
- Some colors update on theme switch, others don't
- `:root` has both light and dark values defined simultaneously

**Phase:** Theme system phase. Verify in production build (Vite minification can occasionally reorder CSS), not just dev server.

---

### Pitfall T-3: Zustand Auth Store Not Hydrated Before Platform/Theme Init

**What goes wrong:**
`authStore.ts` initializes synchronously from `localStorage` on module load. If the theme provider or platform detection reads user preferences from the same store (e.g., to personalize welcome animation), there's a race: the store is hydrated, but the component tree may not have rendered yet. This isn't a current problem but becomes one when the welcome animation needs user data (name for "Bienvenido, [Name]") before the home API calls return.

**Prevention:**
Keep platform detection and theme initialization completely independent of auth state. Neither `usePlatform()` nor `useTheme()` should read from `authStore`. User-specific personalization (birthday greeting, time-aware welcome) should be computed inside the welcome animation component itself, after auth confirms the user, not at app initialization.

**Phase:** Auth flow / welcome animation phase.

---

## Performance Traps

Mistakes that feel fine during development and fail in production on real hardware.

---

### Pitfall P-1: Glassmorphism `backdrop-filter` on Scroll-Heavy Layouts

**What goes wrong:**
`backdrop-filter: blur(24px)` is GPU-accelerated but creates a compositor layer for every element that uses it. The existing codebase already uses `.glass` (the bottom nav) and `.glass-light` classes with `backdrop-filter`. If the v2 work adds more glassmorphic surfaces (bottom sheets, modal overlays, booking card backgrounds), scrolling performance degrades on mid-range Android devices.

**Why it happens:**
Each `backdrop-filter` element forces the browser to sample the area behind it at every frame. With multiple blurred elements in view simultaneously, the fill rate cost exceeds what budget-tier GPUs can handle at 60fps.

**Known risk in this codebase:**
The bottom nav already uses glassmorphism. The v2 plan adds:
- Platform nav bar (iOS-style translucent header)
- Bottom sheets (booking confirmation, profile switcher)
- QR card modal

That's potentially 3-4 simultaneous `backdrop-filter` elements, which is problematic on Android.

**Prevention:**
- Limit `backdrop-filter` to one element visible at a time (nav bar OR bottom sheet, not both)
- On Android platform, fall back to a solid semi-transparent background instead of blur: `[data-platform="android"] .glass { backdrop-filter: none; background: rgba(26,31,38,0.95); }`
- Avoid `backdrop-filter` on elements that animate (scale/translate) — animating a blurred layer is very expensive
- Test on a mid-range Android device (Moto G, Samsung A series) before shipping

**Warning signs:**
- Janky scroll on HomeView after adding platform nav bar
- DevTools "Rendering" panel shows more than 2 compositor layers from blur effects
- Frame rate drops below 60fps when bottom sheet opens

**Phase:** Platform chrome phase (nav bar) and booking phase (bottom sheet). Verify on physical Android after each.

---

### Pitfall P-2: Staggered Framer Motion Animations Re-Triggering on Route Change

**What goes wrong:**
HomeView uses a stagger pattern where each section animates in with increasing delay (f(0), f(0.05), f(0.10), f(0.22), f(0.28), f(0.33)). When the user navigates away and back, the entire stagger sequence replays. With the v2 welcome animation added on top of this, returning to home after booking flows triggers: welcome animation + 6-stage home stagger = ~1.5 seconds of motion every time.

**Why it happens:**
React Router v7 unmounts and remounts route components on navigation by default. Framer Motion `initial` state is reset on mount. Without a "has animated" flag, the sequence always runs.

**Current state:**
`MobileLayout.tsx` scrolls to top on route change (`mainRef.current?.scrollTo`). This is correct UX behavior but does not suppress re-animations.

**Consequences:**
- Motion sickness risk for users with vestibular disorders (violates `prefers-reduced-motion` if not implemented)
- Feels sluggish on returning to home after booking
- Welcome animation should only play once per session, not on every `/` visit

**Prevention:**
- Use a session-scoped flag (Zustand or module variable) to track "has played welcome animation"
- For page stagger animations, check `prefers-reduced-motion` and skip if true:

```typescript
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const animProps = prefersReduced ? {} : f(delay);
```

- Consider `layoutId` based persistent components for the bottom nav to prevent it from re-animating on route change

**Warning signs:**
- `initial` prop set on route-level motion components without a "hasAnimated" guard
- Welcome animation component not checking session storage for "already played" flag
- `prefers-reduced-motion` not checked anywhere in codebase (currently it is not — grep confirms no such check exists)

**Phase:** Animation foundation phase. Implement `prefers-reduced-motion` support before adding any new motion, not after.

---

### Pitfall P-3: QR Code Screen Brightness API Availability

**What goes wrong:**
The v2 design doc specifies "brightness auto-increases when QR is displayed." The Screen Brightness API is not a standard Web API — it requires either a native wrapper (Capacitor plugin) or a visual approximation (white overlay on the screen). Calling a non-existent API silently fails, leaving the QR potentially unreadable in bright environments.

**Current project context:**
The PWA is the primary target, Capacitor iOS is secondary. On the PWA path, there is no Screen Brightness API. `@capacitor/core` is installed but the app is currently a PWA-first deployment.

**Consequences:**
- QR code unreadable in sunlight (common at an outdoor club)
- Native brightness control only works in Capacitor build, not on Vercel PWA
- Club staff scanners may fail — affects check-in workflow

**Prevention:**
Use a CSS-based brightness approximation for the PWA path:

```css
/* When QR is displayed, force white page background */
.qr-overlay-active body {
  background: white !important;
}
.qr-modal {
  background: white;
  padding: 32px;
}
/* High contrast QR on white background is always readable */
```

For Capacitor, wrap brightness control in a try/catch that gracefully falls back to the CSS approach. Additionally:
- Generate QR with high error correction level (Level H: 30%) for scanning resilience
- Ensure QR module size is at least 4px on screen (test at phone-to-scanner distances)
- White quiet zone around QR is mandatory (scanner rejection without it)

**Warning signs:**
- Any call to `window.screen.brightness` or similar without feature detection
- QR implementation tested only on desktop browser (always bright screen — issue not visible)
- No fallback when Capacitor plugin is unavailable

**Phase:** QR credential card phase. Implement CSS brightness approach first, add Capacitor enhancement only if PWA approach proves insufficient during testing.

---

### Pitfall P-4: Multiple Concurrent Framer Motion Animations on Route Transition

**What goes wrong:**
AnimatePresence is already used in LoginView for step transitions. If v2 adds route-level AnimatePresence (page transitions between tabs), the animation budget adds up: page exit animation + new page enter animation + bottom nav active indicator transition + any ongoing shimmer animations in cards. On low-end devices this causes frame drops visible as stuttering during navigation.

**Prevention:**
- Route transitions should be minimal: opacity fade only (no scale, no translate) for tab navigation
- Use `mode="wait"` on AnimatePresence for route transitions to prevent exit + enter running simultaneously
- Disable route transition animations entirely when `prefers-reduced-motion: reduce`
- The shimmer on the credential card (`animation: shimmer 4s ease-in-out infinite`) uses CSS animation, not Framer Motion — this is correct and should stay CSS

**Phase:** Platform chrome phase when tab navigation is redesigned.

---

## UX Pitfalls

Mistakes that produce technically correct but experientially broken flows.

---

### Pitfall U-1: Two Auth Flow Versions Coexisting During Migration

**What goes wrong:**
The v2 design doc specifies fixing the auth flow order: currently it's "member number → profiles → password." The fix is "member number → password → profiles." This is a breaking UX change. If the migration is done partially — e.g., the password step is moved but the welcome animation is not yet added — there's a phase where the flow is technically different but the premium feel isn't there yet, which could confuse the client during demo.

**Prevention:**
Treat the auth flow fix and welcome animation as one atomic change. Do not ship "fixed flow without animation" to a demo environment. Keep the auth change on a branch until the full sequence (new flow + welcome animation + credential card reveal) is complete.

**Phase:** Auth flow phase. Coordinate so flow fix and animation land together.

---

### Pitfall U-2: Platform-Adaptive Design Inconsistency Visible in Split-Second

**What goes wrong:**
If `usePlatform()` is called inside components (vs. at app root), there's a brief render where the component renders with the wrong platform shell before the hook resolves and re-renders. Even if detection is synchronous (it should be — UA parsing is synchronous), if the hook is implemented with `useState` + `useEffect`, it will render once with `undefined` platform before settling.

**Prevention:**
Implement `usePlatform()` as a pure synchronous computation:

```typescript
// WRONG — causes flash
function usePlatform() {
  const [platform, setPlatform] = useState<'ios'|'android'|'web'>('web');
  useEffect(() => { setPlatform(detect()); }, []);
  return platform;
}

// CORRECT — synchronous, no extra render
const PLATFORM = detectPlatform(); // module-level, runs once

function usePlatform() {
  return PLATFORM;
}
```

**Phase:** Foundation phase (platform detection hook).

---

### Pitfall U-3: Light Mode Color Accessibility Gaps

**What goes wrong:**
The current codebase is dark-mode only — all colors are designed against a near-black `#060606` background. When light mode is added, many of the existing color values will fail WCAG AA contrast ratios. Examples:
- `--color-text-tertiary: #555555` on white: contrast ratio ~7:1 (passes) but on `#F5F5F5` background it's lower
- Gold `#C9A84C` on white: contrast ratio ~2.5:1 — fails for text, acceptable for decorative only
- Cedar green `#005A36` on white: ~9:1 (passes for text)

The credential card uses white text on green gradient — this works in dark mode but in light mode context the card still has a dark gradient so it's fine. However, the maintenance status card uses `var(--color-text-secondary)` (#999999) for descriptive text — on a light surface this would be `#999` on `#FFF` = 2.85:1 which fails WCAG AA for body text.

**Prevention:**
Before implementing light mode colors, audit every `--color-text-*` variable against the planned light backgrounds:
- `--color-text-secondary` in light mode must be at least `#666666` on white for 5.74:1 ratio
- Gold text on light backgrounds: use only for decorative/large headings, not for body text or icons

Implement contrast testing as part of the light mode phase, not as an afterthought. The `prefers-color-scheme: light` styles should be reviewed in accessibility tooling before merge.

**Phase:** Theme system phase. Address before light mode ships.

---

### Pitfall U-4: Profile Switcher Session Scope Ambiguity

**What goes wrong:**
The multi-profile switching feature allows switching between family members without re-entering passwords. The existing `authStore` stores one `user` object in `localStorage`. If profile switching is implemented by simply updating `authStore.user`, two problems arise:
1. The JWT token in `localStorage` is for the original profile — API calls after switching will authenticate as the original profile, not the switched-to profile
2. If the user closes and reopens the app, they restore as the last switched profile, but with the original JWT — meaning they may see data for the wrong person

**Prevention:**
Profile switching must either:
a) Call `/auth/login` with `profile_id` + stored credentials (requires cached credentials — avoid storing passwords)
b) Or use a "switch profile" endpoint that accepts the family JWT and returns a new JWT for the selected profile — requires backend support

The safest PWA approach: switch profiles by clearing the current session and starting a new auth flow for the selected profile. Store only the member_number (not password) to pre-fill Step 1 for a smoother re-auth.

**Phase:** Profile switching phase. Raise with backend team before implementing to ensure endpoint support.

---

## "Looks Done But Isn't" Checklist

Signs that a feature appears complete in development but has latent issues.

| Symptom | Hidden Problem | How to Catch |
|---------|---------------|--------------|
| Theme toggle works in DevTools | FOUC on production cold load | Test with empty cache on physical device |
| Platform detection returns correct value in Chrome DevTools mobile emulation | Fails on real Samsung Fold cover screen | Test on physical foldable or BrowserStack |
| Framer Motion animations smooth in Chrome on MacBook | Jank on mid-range Android (Snapdragon 665 class) | Record in DevTools Performance on throttled device |
| QR code scans on desktop screen | Unreadable outdoors on phone screen | Test in direct sunlight |
| Welcome animation plays correctly once | Replays on every home navigation | Navigate away and back 3 times during testing |
| Light mode looks correct | Gold text fails WCAG AA on light backgrounds | Run Lighthouse accessibility audit after theme switch |
| Bottom nav glassmorphism looks premium | Scroll jank when multiple backdrop-filter elements visible | Scroll fast on physical Android while bottom sheet open |
| whileTap scale animation works on iPhone | Double-trigger on Samsung Fold | Test `motion.button` interactions on foldable |
| Horizontal time strip scrolls correctly in browser | Conflicts with vertical scroll on real mobile | Test diagonal scroll gestures on physical device |
| Platform shell renders correctly | Flash of wrong platform on slow 3G | Test with network throttling on cold cache |

---

## Pitfall-to-Phase Mapping

| Phase Topic | Likely Pitfall | Required Mitigation |
|-------------|---------------|---------------------|
| Platform detection hook (`usePlatform`) | C-1 (UA unreliability), U-2 (flash from async detection) | Synchronous module-level detection, multi-signal (Capacitor first) |
| Theme system (dark/light/auto) | C-2 (FOUC), T-2 (Tailwind v4 collision), U-3 (light mode contrast) | Blocking inline script in `index.html`, CSS-custom-property-only approach, contrast audit |
| Auth flow fix + welcome animation | T-3 (Zustand race), U-1 (partial migration), P-2 (re-trigger on navigation) | Atomic change (flow + animation together), session flag for "already played" |
| Platform chrome (nav bar, tab bar) | T-1 (component explosion), P-4 (concurrent animations), P-1 (glassmorphism perf) | Strict boundary (only 4 chrome components split), fade-only route transitions, Android blur fallback |
| Booking UX (time strip) | C-4 (drag/scroll conflict), C-3 (touch issues), P-4 (animation budget) | CSS overflow-x over Framer drag, `touchAction: pan-x` on strip |
| Interactive booking elements | C-3 (Samsung Fold touch) | `touchAction: 'manipulation'` on every `motion.button` — audit before shipping |
| QR credential card | P-3 (brightness API missing) | CSS white background fallback, high error correction QR, test outdoors |
| Multi-profile switching | U-4 (JWT scope mismatch) | Backend alignment on token scope before implementing switcher |
| All new animations | P-2 (motion sickness) | `prefers-reduced-motion` check on every Framer Motion component — implement foundation utility first, apply everywhere |

---

## Sources

- Direct codebase analysis: `src/index.css`, `src/App.tsx`, `src/components/ui/Button.tsx`, `src/components/layout/MobileLayout.tsx`, `src/components/layout/BottomNav.tsx`, `src/views/HomeView.tsx`, `src/views/LoginView.tsx`, `src/store/authStore.ts`
- Known fix already applied: `Button.tsx` line 35 — `style={{ touchAction: 'manipulation' }}` — confirms Samsung Fold issue was real and the mitigation is the correct approach
- Design spec: `docs/plans/2026-03-11-v2-ux-premium-design.md`
- Project context: `.planning/PROJECT.md`
- Framer Motion v12 (installed: `^12.34.3`) — whileTap behavior is consistent with v11/v12
- Tailwind CSS v4 (`^4.2.1`) — CSS custom property native support changes token definition approach vs v3
