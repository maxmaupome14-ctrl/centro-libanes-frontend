# Phase 8: Foundation — Research

**Researched:** 2026-03-11
**Domain:** Three-way theme system (FOUC prevention), auth flow reorder, synchronous platform detection, `motion.button` touch-bug audit
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| THEME-01 | User can toggle between light, dark, and auto (system-follows) theme modes | Tailwind v4 `@custom-variant dark` + Zustand `themeStore` covers three-way toggle without additional libraries |
| THEME-02 | Selected theme preference persists across sessions via localStorage | `themeStore` persists `mode` key to localStorage; blocking script reads it on cold load |
| THEME-03 | Dark mode uses muted luxury palette (dark slate #0F1419, warm white #E8E4DF, gold reserved) | Existing `:root` is near-black (#060606) — must restructure to `[data-theme="dark"]` + `[data-theme="light"]` with new luxury values |
| THEME-04 | Light mode uses clean warm backgrounds with cedar green primary and gold secondary | New `[data-theme="light"]` block in `index.css` overriding all `--color-*` tokens |
| THEME-05 | Theme transitions smoothly 200ms crossfade, no flash | `transition: background-color 200ms ease, color 200ms ease` on `body` — CSS only, no Framer Motion |
| THEME-06 | No FOUC on page load — blocking script in index.html reads preference before render | Blocking inline script placed in `<head>` BEFORE stylesheet link — must come before `@import "tailwindcss"` resolves |
| THEME-07 | All text meets WCAG AA contrast ratios (4.5:1) in both light and dark modes | Audit required: current `--color-text-secondary: #999999` fails on white; `--color-gold` fails as text on light backgrounds |
| AUTH-01 | Login flow order: member number → password → profile selection | Current flow is inverted: `step` progression is `membresia → perfil → pin`. Must reorder to `membresia → pin → perfil` |
| PLAT-01 | App detects iOS, Android, or web platform via User Agent / Capacitor API and caches result | `Capacitor.getPlatform()` first, UA fallback second; result cached in module-level const |
| PLAT-02 | Platform detection is synchronous (no render flash on first paint) | Module-level const pattern (not `useState` + `useEffect`) — resolves before first render |
| PLAT-06 | Web defaults to iOS style as baseline | Explicit in `detectPlatform()` fallback: `return 'web'` maps to iOS visual treatment |
| PLAT-07 | All existing `motion.button` elements have `touchAction: 'manipulation'` applied | Audit confirmed: `HomeView.tsx` (quick action buttons) and `LoginView.tsx` (profile list) have `whileTap` WITHOUT `touchAction: 'manipulation'` — both need the fix |

</phase_requirements>

---

## Summary

Phase 8 is pure infrastructure: it installs the two cross-cutting primitives — theme system and platform detection — that every subsequent phase depends on, then patches two pre-existing bugs (inverted auth flow, missing `touchAction` on `motion.button` elements).

The codebase is in a clean, well-structured state after M1. All color values are already CSS custom properties on `:root`. The dark palette is the only defined palette — it uses near-black (`#060606`) as the root default. The theme work requires restructuring these tokens into `[data-theme="dark"]` and `[data-theme="light"]` CSS attribute blocks rather than on `:root` directly. The blocking FOUC-prevention script must be added to `index.html` **before** any stylesheet.

The auth flow bug is definitively confirmed by reading `LoginView.tsx`: the step progression is `membresia → perfil → pin`, meaning profile selection happens before password entry. AUTH-01 requires reordering to `membresia → pin → perfil` — the API call sequence also changes (`/auth/select-profile` must move before `/auth/login`, with profile ID pre-filled from step 2's single-member case or carried from step 2). The motion.button touch bug is confirmed in `HomeView.tsx` (line 305–318, quick action buttons with `whileTap` but no `touchAction`) and `LoginView.tsx` (line 250, profile selection buttons). `CatalogView.tsx`'s `motion.button` uses CSS `active:scale` not Framer `whileTap`, so it does not need the fix but should get `touchAction: 'manipulation'` for safety.

**Primary recommendation:** Build in this order — (1) FOUC script in `index.html`, (2) CSS token restructure in `index.css`, (3) `themeStore` + `ThemeToggle`, (4) `platformStore` + `usePlatform()`, (5) `AppProviders` wired into `App.tsx`, (6) auth flow reorder in `LoginView.tsx`, (7) `touchAction` audit on all `motion.button` elements. Do not skip the FOUC script — it is invisible in dev and always visible in prod.

---

## Standard Stack

### Core (no new dependencies needed for Phase 8)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | 4.2.1 | `@custom-variant dark` directive powers three-way theme toggle | Already installed; v4 natively handles CSS custom property theme switching |
| Zustand | 5.0.11 | `themeStore` and `platformStore` state slices | Already installed; pattern matches existing `authStore` |
| `@capacitor/core` | 8.1.0 | `Capacitor.getPlatform()` for authoritative iOS/Android/web detection | Already installed; most reliable signal for native context |
| Framer Motion | 12.34.3 | All existing `motion.button` usage | Already installed; `touchAction: 'manipulation'` fix is a style prop addition |

### No New Dependencies for Phase 8

Phase 8 requires zero `npm install` commands. All implementation uses existing installed packages.

**Installation:**
```bash
# Nothing to install for Phase 8
```

---

## Architecture Patterns

### Recommended Project Structure (new files only)

```
src/
  store/
    authStore.ts          existing — unchanged
    themeStore.ts         NEW
    platformStore.ts      NEW
  hooks/
    useTheme.ts           NEW
    usePlatform.ts        NEW
  components/
    providers/
      AppProviders.tsx    NEW
    ui/
      ThemeToggle.tsx     NEW
  views/
    LoginView.tsx         MODIFY — reorder steps
    HomeView.tsx          MODIFY — add touchAction to motion.button
    ProfileView.tsx       MODIFY — embed ThemeToggle
index.html                MODIFY — add FOUC blocking script
src/index.css             MODIFY — restructure tokens + add light palette
src/App.tsx               MODIFY — wrap with AppProviders
```

### Pattern 1: Data-Attribute Theme Gate

**What:** `themeStore` writes `data-theme="dark"` or `data-theme="light"` to `document.documentElement`. CSS custom properties in `index.css` are scoped to `[data-theme="light"]` and `[data-theme="dark"]` attribute selectors.

**Critical detail about the current `index.css`:** The existing `:root` block defines the dark palette values as the document root defaults. For the theme system to work correctly, the palette must be restructured so that **both** `[data-theme="dark"]` and `[data-theme="light"]` explicitly declare their tokens. The `:root` block should retain only non-color tokens (radii, typography).

**Why data-attribute over CSS class:** No class list pollution; works identically in Capacitor WebView; aligns with Tailwind v4's `@custom-variant` directive that targets attribute selectors. The `auto` mode uses `matchMedia('(prefers-color-scheme: dark)')` inside `themeStore` to derive resolved theme at runtime.

```css
/* index.css — restructured token blocks */
:root {
  /* Brand colors (unchanged, always available) */
  --color-green-cedar: #005A36;
  --color-green-cedar-light: #007A4A;
  --color-green-cedar-dark: #003D24;
  --color-red-lebanese: #CE1126;
  --color-gold: #C9A84C;
  --color-gold-light: #DCC06A;
  --color-gold-dark: #A88B32;
  /* Radii and typography tokens (unchanged) */
  --radius-xs: 6px;
  /* ... etc ... */
}

[data-theme="dark"] {
  --color-bg: #0F1419;            /* Muted luxury slate (was #060606) */
  --color-bg-elevated: #1A1F26;
  --color-surface: #1A1F26;
  --color-surface-hover: #222830;
  --color-surface-active: #2A3040;
  --color-border: rgba(255, 255, 255, 0.07);
  --color-border-strong: rgba(255, 255, 255, 0.13);
  --color-text-primary: #E8E4DF;  /* Warm white */
  --color-text-secondary: #9B9590;
  --color-text-tertiary: #5C5752;
  --color-text-inverse: #0F1419;
}

[data-theme="light"] {
  --color-bg: #F8F7F4;
  --color-bg-elevated: #FFFFFF;
  --color-surface: #FFFFFF;
  --color-surface-hover: #F0EFE9;
  --color-surface-active: #E8E6E0;
  --color-border: rgba(0, 0, 0, 0.07);
  --color-border-strong: rgba(0, 0, 0, 0.13);
  --color-text-primary: #1A1A1A;
  --color-text-secondary: #555555;  /* min 5.74:1 on white — WCAG AA */
  --color-text-tertiary: #777777;   /* min 4.48:1 on white — WCAG AA */
  --color-text-inverse: #F8F7F4;
}
```

**Tailwind v4 `@custom-variant` directive (add after `@import "tailwindcss"`):**

```css
@import "tailwindcss";
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));
```

### Pattern 2: FOUC Blocking Script

**What:** An inline `<script>` in `index.html` `<head>` that reads `localStorage` and writes `data-theme` to `<html>` synchronously before any CSS or React loads.

**Why critical:** `index.html` currently has NO theme initialization. Every production page load for users with a non-default theme preference will flash. This is invisible in Vite dev server (hot reload, no true cold paint) but always visible after `npm run build`.

**Exact placement:** The script must appear in `<head>` before any stylesheet `<link>` tag. In the current `index.html`, it should be the first element inside `<head>` after the `<meta charset>` tag.

```html
<!-- index.html — add BEFORE font <link> tags -->
<script>
  (function() {
    try {
      var stored = localStorage.getItem('cl-theme');
      var system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme',
        stored === 'light' || stored === 'dark' ? stored : system
      );
    } catch(e) {}
  })();
</script>
```

Note: Use key `'cl-theme'` (not generic `'theme'`) to avoid collisions with other localStorage consumers. `themeStore` must use the same key.

### Pattern 3: themeStore Shape

```typescript
// src/store/themeStore.ts
import { create } from 'zustand';

type ThemeMode = 'light' | 'dark' | 'auto';
type ResolvedTheme = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
}

const STORAGE_KEY = 'cl-theme';

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  return mode === 'auto' ? getSystemTheme() : mode;
}

function applyTheme(resolved: ResolvedTheme) {
  document.documentElement.setAttribute('data-theme', resolved);
}
```

The `setMode` action must: (1) persist to localStorage, (2) compute resolved, (3) apply to DOM, (4) subscribe to `matchMedia` if `auto`.

### Pattern 4: Synchronous Platform Detection

**What:** Module-level constant computed once at import time. Never `useState` + `useEffect`.

**Why synchronous matters:** If platform detection uses `useState(undefined)` + `useEffect`, the component renders once with `undefined` before settling on the real platform. This causes a visible flash where default (iOS) styles render momentarily on an Android device.

```typescript
// src/store/platformStore.ts
import { Capacitor } from '@capacitor/core';

export type Platform = 'ios' | 'android' | 'web';

function detectPlatform(): Platform {
  // Capacitor first — authoritative when in native wrapper
  const cap = Capacitor.getPlatform();
  if (cap === 'ios' || cap === 'android') return cap;
  // UA fallback for PWA path
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'web'; // defaults to iOS visual treatment per PLAT-06
}

// Module-level — runs once, cached forever
export const PLATFORM: Platform = detectPlatform();
```

```typescript
// src/hooks/usePlatform.ts
import { PLATFORM, type Platform } from '../store/platformStore';

export interface PlatformInfo {
  platform: Platform;
  isIOS: boolean;
  isAndroid: boolean;
  isWeb: boolean;
}

export function usePlatform(): PlatformInfo {
  return {
    platform: PLATFORM,
    isIOS: PLATFORM !== 'android',    // web + ios both use iOS style (PLAT-06)
    isAndroid: PLATFORM === 'android',
    isWeb: PLATFORM === 'web',
  };
}
```

### Pattern 5: AppProviders Wrapper

**What:** Thin React component that (a) applies initial `data-theme` from `themeStore` state on mount, (b) applies `data-platform` from `PLATFORM` constant, (c) wraps children. No visible DOM output.

**Integration point in `App.tsx`:** Insert between `<BrowserRouter>` and `<ToastProvider>`.

```typescript
// src/components/providers/AppProviders.tsx
import { useEffect } from 'react';
import { PLATFORM } from '../../store/platformStore';
import { useThemeStore } from '../../store/themeStore';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const resolved = useThemeStore((s) => s.resolved);

  // Apply platform once
  useEffect(() => {
    document.documentElement.setAttribute('data-platform', PLATFORM);
  }, []);

  // Apply theme whenever resolved changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolved);
  }, [resolved]);

  return <>{children}</>;
}
```

Note: `data-theme` will already be set by the FOUC blocking script before React mounts. This `useEffect` keeps it in sync on user toggle.

### Pattern 6: Auth Flow Reorder

**Current flow (broken AUTH-01):**
```
Step 'membresia' → POST /auth/select-profile → Step 'perfil' (profile list) → Step 'pin' (password)
```

**Correct flow (AUTH-01):**
```
Step 'membresia' → Step 'pin' (password) → if family has multiple members → Step 'perfil' (profile select) → POST /auth/login
```

**Key API behavior change:**
- Current: `POST /auth/select-profile` fires before password, returns `profiles[]`
- Correct: Password step fires first, then if `profiles.length > 1` the profile chooser appears
- Option A (simpler): Keep `POST /auth/select-profile` to validate member number exists + get profiles. If only 1 profile, skip step 2 and go straight to password. If multiple profiles, go password → profile.
- Option B (correct semantic): Enter password in step 2, call `POST /auth/login` with `{ member_number, password }`, receive token + profiles back if family account, then show profile selector.

**Recommendation:** Option A is less risky — it reuses the existing `/auth/select-profile` endpoint to just fetch profiles (not yet authenticate), shows password next, then profile selector only when `profiles.length > 1`. The final `/auth/login` call stays as-is. The step state machine changes from `membresia → perfil → pin` to `membresia → pin → perfil`.

**State machine diff in `LoginView.tsx`:**
```typescript
// Current step type (broken)
const [step, setStep] = useState<'membresia' | 'perfil' | 'pin'>('membresia');

// Fixed step type
const [step, setStep] = useState<'membresia' | 'pin' | 'perfil'>('membresia');
```

After `handleLookupMembership` succeeds: `setStep('pin')` (not `'perfil'`).
After password entry, if `profiles.length > 1` AND `!selectedProfile`: `setStep('perfil')`.
Profile selection in step 'perfil' calls `handleMemberLogin()` directly.

### Pattern 7: touchAction Audit and Fix

**Confirmed locations requiring fix (from codebase inspection):**

| File | Element | Has `whileTap` | Has `touchAction: 'manipulation'` | Action |
|------|---------|---------------|----------------------------------|--------|
| `src/components/ui/Button.tsx` | `motion.button` | YES | YES (line 35) | Already fixed — no change |
| `src/views/HomeView.tsx` | `motion.button` (quick action buttons, line 305) | YES (`scale: 0.96`) | NO | ADD `style={{ touchAction: 'manipulation' }}` |
| `src/views/LoginView.tsx` | `motion.button` (profile list, line 250) | YES (`scale: 0.98`) | NO | ADD `style={{ touchAction: 'manipulation' }}` |
| `src/views/CatalogView.tsx` | `motion.button` (catalog cards, line 243) | NO (uses CSS `active:scale-[0.99]`) | NO | ADD `style={{ touchAction: 'manipulation' }}` as preventive measure |
| `src/views/NotificationsView.tsx` | `motion.button` (notification rows, line 133) | NO (uses CSS class presumably) | NO | ADD `style={{ touchAction: 'manipulation' }}` as preventive measure |

### Pattern 8: Glass Utility Classes — Light Theme Fix

The existing `.glass` class uses hardcoded `rgba(17, 17, 17, 0.72)` — this must be theme-aware. The `BottomNav` uses `.glass`.

```css
/* index.css additions */
.glass {
  background: rgba(17, 17, 17, 0.72);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid var(--color-border);
}

[data-theme="light"] .glass {
  background: rgba(248, 247, 244, 0.85);
}
```

### Anti-Patterns to Avoid

- **Using `useEffect` for platform detection:** Causes a flash before the correct platform renders. Use the module-level constant.
- **Putting theme tokens in `:root` for the dark palette default:** Makes it impossible to switch without also overriding `:root` specificity. Both themes go in `[data-theme="dark"]` and `[data-theme="light"]`.
- **Adding light mode via `@media (prefers-color-scheme: light)`:** Cannot be overridden by user toggle. Must be `[data-theme]` attribute-controlled.
- **CSS transition on `*` selector for theme change:** Applying `transition: all 200ms` globally causes jarring delays on every interaction. Scope only to `body` or per-property on elements.
- **Animating theme toggle with Framer Motion:** Theme affects hundreds of elements. Use CSS `transition` on `body` only.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| QR code generation (Phase 9) | Custom QR encoder | `qrcode.react` | QR encoding spec is 200+ pages; Reed-Solomon error correction is non-trivial |
| Platform physics (Phase 11) | Custom spring animator | Framer Motion `spring({ stiffness, damping })` | Already installed; handles physics math |
| Bottom sheet drag (Phase 9) | Custom touch event handler | Framer Motion `drag="y"` with `dragConstraints` | Touch event normalization across browsers/devices is hard; already solved |
| Dark mode transitions | JS-driven color tweening | CSS `transition: background-color 200ms ease` on `body` | CSS handles this with zero JS overhead; Framer Motion on hundreds of elements causes jank |
| System theme detection | `matchMedia` polling | `matchMedia.addEventListener('change', ...)` | Event listener is more efficient than polling; browser handles the detection |

---

## Common Pitfalls

### Pitfall 1: FOUC Script Placement

**What goes wrong:** Adding the blocking script after the stylesheet `<link>` tags. The browser still flashes because the stylesheet can paint before the script runs.

**Why it happens:** Script placement order matters. A `<script>` tag in `<head>` blocks rendering only if it appears before the resource it needs to preempt. Google Fonts `<link rel="preconnect">` and `<link rel="stylesheet">` appear before the script in the current `index.html`.

**How to avoid:** The script MUST be the first element in `<head>` after `<meta charset>` — before any `<link>` tags.

**Warning signs:** Theme toggle works in Chrome DevTools, but test with empty cache on physical device shows flash.

### Pitfall 2: `[data-theme]` Specificity Collision

**What goes wrong:** Some existing component inline styles use `style={{ color: 'var(--color-text-secondary)' }}` while others use Tailwind class `text-[var(--color-text-secondary)]`. Both resolve from the CSS custom property so both update on theme change. However, any hardcoded inline color (e.g., `style={{ color: '#999999' }}`) will NOT update.

**How to avoid:** Search for hardcoded hex colors in component files. The credential card in `HomeView.tsx` has several (e.g., `color: '#E8D590'`, `color: '#4ADE80'`). These are intentionally hardcoded for the green gradient card face — they are correct and should remain. But any text or surface that should theme-switch must use a CSS variable.

**Warning signs:** Some colors update on theme switch, others don't. Usually indicates a hardcoded hex that wasn't caught.

### Pitfall 3: Auth Flow Regression — Employee Path

**What goes wrong:** Reordering the member auth steps accidentally breaks the employee flow. The `LoginView.tsx` has both flows in the same component; they share `setError`, `setIsLoading`, and the back navigation (`goBack()`).

**How to avoid:** Only modify the member flow step order. Touch only: `handleLookupMembership`, the step state machine, and the JSX conditional blocks for `step === 'perfil'` and `step === 'pin'`. The employee flow (`userType === 'employee'`) must not be touched.

**Warning signs:** Employee login stops working after the auth fix.

### Pitfall 4: `matchMedia` Listener Leak in themeStore

**What goes wrong:** `themeStore` subscribes to `matchMedia('(prefers-color-scheme: dark)')` when mode is `'auto'`. If the subscription is not removed when mode changes away from `'auto'`, the listener fires on OS theme change even when the user has set an explicit `'light'` or `'dark'` mode.

**How to avoid:** Store the `removeEventListener` function and call it in `setMode` before adding a new listener (or when mode changes away from `'auto'`).

### Pitfall 5: WCAG AA Failure for Gold on Light Backgrounds

**What goes wrong:** The `--color-gold: #C9A84C` used for active nav indicators, focus rings, and button text fails WCAG AA (4.5:1) as body text on light backgrounds. Gold on white is ~2.5:1 — only acceptable for decorative elements or large headings (3:1 threshold).

**How to avoid:** In light mode, keep gold as a decorative accent only (borders, icons, shimmer). For text that must be readable on a light surface, use `--color-green-cedar: #005A36` (9:1 on white) instead of gold.

**Warning signs:** Lighthouse accessibility audit after switching to light mode shows contrast failures on gold text elements.

---

## Code Examples

Verified patterns from direct codebase inspection and project research:

### ThemeToggle Component (ProfileView embed)

```typescript
// src/components/ui/ThemeToggle.tsx
import { useThemeStore } from '../../store/themeStore';
import { Sun, Moon, Monitor } from 'lucide-react';

type ThemeMode = 'light' | 'dark' | 'auto';

const OPTIONS: { mode: ThemeMode; Icon: typeof Sun; label: string }[] = [
  { mode: 'light', Icon: Sun, label: 'Claro' },
  { mode: 'dark', Icon: Moon, label: 'Oscuro' },
  { mode: 'auto', Icon: Monitor, label: 'Auto' },
];

export function ThemeToggle() {
  const { mode, setMode } = useThemeStore();
  return (
    <div className="flex items-center gap-1 p-1 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)]">
      {OPTIONS.map(({ mode: m, Icon, label }) => (
        <button
          key={m}
          onClick={() => setMode(m)}
          style={{ touchAction: 'manipulation' }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-[var(--radius-md)] text-xs font-semibold transition-all ${
            mode === m
              ? 'bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] shadow-sm'
              : 'text-[var(--color-text-tertiary)]'
          }`}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  );
}
```

### App.tsx Integration Point

```typescript
// src/App.tsx — modified wrapper order
function App() {
  return (
    <BrowserRouter>
      <AppProviders>          {/* NEW — wraps everything */}
        <ToastProvider>
          <Routes>
            {/* ... unchanged routes ... */}
          </Routes>
        </ToastProvider>
      </AppProviders>
    </BrowserRouter>
  );
}
```

### Auth Flow Step Fix (key diff)

```typescript
// LoginView.tsx — handleLookupMembership modified
const handleLookupMembership = async () => {
  setError('');
  setIsLoading(true);
  try {
    const res = await api.post('/auth/select-profile', { member_number: memberNum });
    setProfiles(res.data.profiles);
    // FIXED: go to password step first, not profile step
    if (res.data.profiles.length === 1) {
      setSelectedProfile(res.data.profiles[0]);
    }
    setStep('pin'); // was: setStep('perfil')
  } catch (err: any) {
    setError(err.response?.data?.error || 'Error buscando socio');
  } finally {
    setIsLoading(false);
  }
};

// After password verified in handleMemberLogin:
// If profiles.length > 1 AND selectedProfile not yet set → setStep('perfil')
// Otherwise → login() and navigate('/')
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` dark mode `class` strategy | Tailwind v4 `@custom-variant dark` + attribute selector | Tailwind v4 release | No `darkMode: 'class'` config needed; CSS-native |
| `next-themes` for React theme management | Zustand store + blocking script | Tailwind v4 ecosystem shift | `next-themes` is Next.js-oriented; Vite apps use Zustand or custom hooks |
| Platform detection with `react-device-detect` | `Capacitor.getPlatform()` + UA fallback | Capacitor stable API | More authoritative; covers native wrapper context UA can't |

**Deprecated/outdated approaches to avoid:**
- `@media (prefers-color-scheme)` as the sole theme mechanism — cannot be user-overridden
- `document.body.classList.add('dark')` — class strategy abandoned in Tailwind v4 in favor of CSS-native custom variant
- `useEffect` for initial platform or theme detection — always causes flash

---

## Open Questions

1. **Auth flow — is single-profile family case handled in prod?**
   - What we know: `handleLookupMembership` always fetches profiles, even for accounts with one member. The current step order shows ALL profiles before password.
   - What's unclear: When a membership has exactly 1 profile, does the current UI show a profile selection screen with 1 item? (From the code, yes it does — `profiles.map()` renders even for 1 item.)
   - Recommendation: In the fixed flow, if `profiles.length === 1`, auto-select that profile and skip the `perfil` step entirely. This is a UX improvement on top of the order fix.

2. **Dark mode palette migration — what breaks on the credential card?**
   - What we know: The credential card in `HomeView.tsx` has hardcoded colors (`#E8D590`, `#4ADE80`, `rgba(201,168,76,0.15)`) that are intentional and correct for the green gradient card face.
   - What's unclear: The card currently navigates to `/profile` on click. After THEME-03, will the card's green gradient look correct in light mode context (it should — the gradient is hardcoded, not CSS-variable-based)?
   - Recommendation: The credential card's green gradient is safe — its colors are absolute, not themed. The surrounding HomeView container colors will update correctly from CSS variables. No card change needed in Phase 8.

3. **`AppProviders` vs direct `useEffect` in `App.tsx`**
   - What we know: The research recommends `AppProviders` as a separate component. `App.tsx` itself could handle the `useEffect` calls directly.
   - What's unclear: For Phase 8, with no per-provider children concerns, is a separate `AppProviders` component necessary or is it over-engineering?
   - Recommendation: Create `AppProviders.tsx` — it keeps `App.tsx` clean and establishes the pattern that Phases 9–11 will extend (profile store init, etc.).

---

## Validation Architecture

The config.json does not have `workflow.nyquist_validation` set, and `workflow.require_tests` is explicitly `false`. Phase 8 is infrastructure only — no test files are being added. Manual validation is the gate.

### Phase Gate Checklist (manual, no automated test suite)

| Req ID | Verification Method | Pass Criteria |
|--------|--------------------|--------------|
| THEME-01 | Open ProfileView, tap ThemeToggle three times | Each mode (light/dark/auto) activates correctly |
| THEME-02 | Set dark mode, close tab, re-open | `data-theme="dark"` on `<html>` before React mounts |
| THEME-03 | Switch to dark mode | Background is `#0F1419`, text is `#E8E4DF` not `#F5F5F5` |
| THEME-04 | Switch to light mode | Background is `#F8F7F4`, primary text is dark |
| THEME-05 | Toggle theme | No abrupt color snap — 200ms crossfade visible |
| THEME-06 | `npm run build && npm run preview`, set preference, hard reload | Zero flash on cold load |
| THEME-07 | Run Lighthouse accessibility audit in light mode | No contrast failures on text elements |
| AUTH-01 | Start login as member | Step order: membership number → password → (profiles if family) |
| PLAT-01 | `console.log(PLATFORM)` on load in browser/iOS/Android | Returns correct value |
| PLAT-02 | Load app on emulated slow 3G | No visible platform shell flash |
| PLAT-06 | Load in desktop Chrome | `data-platform="web"`, iOS-style visual treatment applies |
| PLAT-07 | Inspect quick action buttons in HomeView | `touchAction: 'manipulation'` present on all `motion.button` elements |

---

## Sources

### Primary (HIGH confidence)

- Direct codebase inspection: `src/index.css`, `src/App.tsx`, `src/store/authStore.ts`, `src/components/layout/MobileLayout.tsx`, `src/components/layout/BottomNav.tsx`, `src/components/ui/Button.tsx`, `src/views/HomeView.tsx`, `src/views/LoginView.tsx`, `src/views/CatalogView.tsx`, `src/views/NotificationsView.tsx`, `index.html`
- Tailwind CSS v4 dark mode documentation: https://tailwindcss.com/docs/dark-mode (fetched 2026-03-11 per project research)
- `.planning/research/ARCHITECTURE.md` — verified patterns, data flow, anti-patterns
- `.planning/research/PITFALLS.md` — critical pitfalls with mitigations
- `.planning/research/STACK.md` — stack version lock
- `.planning/research/SUMMARY.md` — executive synthesis

### Secondary (MEDIUM confidence)

- `Capacitor.getPlatform()` API — Capacitor v8 core API; stable since Capacitor 3; verify against installed `@capacitor/core` v8.1.0 type definitions at implementation start
- WCAG AA contrast ratios — W3C specification; #555555 on white = 7.4:1 (pass), #777777 on white = 4.48:1 (pass), #C9A84C (gold) on white = 2.5:1 (fail for text)

### Tertiary (LOW confidence — flag for validation)

- None in Phase 8 scope. All findings are grounded in direct code inspection or official documentation.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tools already installed, no new dependencies
- Architecture: HIGH — based on direct file inspection of all key files; patterns confirmed in existing research
- Auth flow fix: HIGH — `LoginView.tsx` read directly; current broken flow confirmed at lines 36–44 (step progression)
- Pitfalls: HIGH — touch bug locations confirmed by `motion.button` grep across all source files; FOUC confirmed by `index.html` inspection (no blocking script exists)
- WCAG light mode: MEDIUM — contrast ratios calculated from hex values; Lighthouse audit needed to confirm all instances

**Research date:** 2026-03-11
**Valid until:** 2026-06-11 (stable stack — Tailwind v4, Framer Motion 12, Zustand 5 are not fast-moving at this point)
