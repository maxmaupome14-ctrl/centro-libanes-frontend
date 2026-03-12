# Technology Stack — v2.0 Premium UX

**Project:** Centro Libanés Frontend
**Milestone:** v2.0 Premium UX (platform-adaptive design, theming, QR, enhanced animations)
**Researched:** 2026-03-11
**Scope:** NEW additions only — existing validated stack not re-researched

---

## Existing Stack (Do Not Change)

| Technology | Version | Status |
|------------|---------|--------|
| React | 19.2.0 | Locked |
| TypeScript | 5.9.3 | Locked |
| Vite | 7.3.1 | Locked |
| Tailwind CSS | 4.2.1 | Locked |
| Framer Motion | 12.34.3 | Locked — already covers all animation needs |
| Zustand | 5.0.11 | Locked |
| React Router | 7.13.1 | Locked |
| Capacitor (core + iOS) | 8.1.0 | Locked — already installed |
| date-fns | 4.1.0 | Locked — covers birthday/greeting logic |
| clsx + tailwind-merge | 2.1.1 / 3.5.0 | Locked — covers conditional class logic |
| lucide-react | 0.575.0 | Locked — icon set |

---

## Recommended Stack Additions

### Only ONE new dependency is needed

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| qrcode.react | ^4.2.0 | SVG QR code generation for digital credential card | Lightweight, zero runtime dependencies, renders pure SVG (scalable at any size, themeable via CSS), React 19 compatible, the dominant React QR library with 2M+ weekly downloads |

That is the complete list of new dependencies. Everything else is built with existing tools.

---

## How Each Feature Is Implemented Without New Libraries

### Platform Detection

**Tool:** `@capacitor/core` (already installed, v8.1.0)

`Capacitor.getPlatform()` returns `'ios' | 'android' | 'web'` — this is a stable API since Capacitor 3. On web/PWA it returns `'web'`; inside the Capacitor iOS wrapper it returns `'ios'`.

For the PWA path (Vercel deployment), supplement with `navigator.userAgent` parsing as a fallback to detect mobile Safari (which should receive iOS HIG styling even without the native wrapper):

```ts
// src/hooks/usePlatform.ts
import { Capacitor } from '@capacitor/core';

type Platform = 'ios' | 'android' | 'web';

function detectPlatform(): Platform {
  const cap = Capacitor.getPlatform();
  if (cap === 'ios' || cap === 'android') return cap;
  // PWA fallback: treat mobile Safari as iOS
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'web'; // desktop browser → iOS style per design decision
}
```

Result is cached in a module-level const (won't change mid-session). Platform class applied to `<html>` element (`platform-ios` / `platform-android` / `platform-web`) for CSS targeting.

**Confidence:** HIGH — Capacitor.getPlatform() is a documented, stable core API.

---

### Theme System (Light / Dark / Auto)

**Tool:** Tailwind CSS v4 + CSS custom properties (already in `index.css`)

Tailwind v4 supports three-way theme toggling natively via `@custom-variant dark` in CSS and `window.matchMedia('(prefers-color-scheme: dark)')` for the auto/system path.

**Implementation approach:**

1. Define `@custom-variant dark` in `index.css` targeting `[data-theme=dark]` attribute on `<html>`:

```css
@import "tailwindcss";
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));
```

2. A `useTheme()` hook in Zustand stores the mode (`'light' | 'dark' | 'auto'`) in localStorage and writes `data-theme` to `document.documentElement`.

3. Auto mode subscribes to `window.matchMedia('(prefers-color-scheme: dark)')` and syncs `data-theme` in real time.

4. CSS custom properties for dark mode variants are added to `index.css` under `[data-theme=dark]` — builds directly on the existing `:root` variable system already in place.

5. Theme transitions: `transition: background-color 200ms ease, color 200ms ease` on `body` — CSS only, no JS needed for the crossfade.

**No new library needed.** Tailwind v4 `@custom-variant` + existing CSS variable system handles the full requirement.

**Confidence:** HIGH — verified against official Tailwind v4 dark mode documentation.

---

### Premium Welcome Animation (2-second orchestrated sequence)

**Tool:** Framer Motion 12.34.3 (already installed)

Framer Motion 12 provides everything required:
- `useAnimate()` hook for imperative, orchestrated multi-step sequences with precise timing control
- `AnimatePresence` for enter/exit transitions between auth and home
- `variants` + `staggerChildren` for the credential card slide-up
- `useReducedMotion()` to respect `prefers-reduced-motion` accessibility setting

The 2-second welcome sequence (fade to brand color → name with gold shimmer → credential card slide-up → transition to home) is a standard Framer Motion `useAnimate()` imperative sequence — no additional library needed.

**Confidence:** HIGH — framer-motion v12 is installed and these APIs exist in v10+.

---

### PlayTomic-Inspired Booking UX (Horizontal Time Strip, Court Cards)

**Tool:** Native CSS `overflow-x: scroll` + `scroll-snap-type` + Framer Motion drag gestures (already installed)

The horizontal time strip is a CSS scroll-snap container with `scroll-snap-type: x mandatory` on the container and `scroll-snap-align: start` on each slot. No date-picker library needed — custom slot components built with Tailwind.

For the bottom sheet summary: Framer Motion `drag="y"` with `dragConstraints` is the standard pattern for mobile bottom sheets — no separate sheet library needed.

The existing `date-fns` v4 handles all date arithmetic (slot availability windows, formatting).

**Confidence:** HIGH — standard CSS scroll-snap + existing Framer Motion handles this.

---

### Multi-Profile Switching

**Tool:** Zustand (already installed)

The family group API already returns dependientes in the auth context. Multi-profile switching requires:
1. Extending `authStore` to hold `activeProfile` and `profiles[]`
2. A profile switcher bottom sheet (Framer Motion `drag="y"` pattern)

No new library. Pure Zustand state update.

**Confidence:** HIGH — straightforward state management pattern.

---

### QR Code Credential Card

**Tool:** `qrcode.react` (NEW — only addition)

**Why `qrcode.react` over alternatives:**

| Option | Verdict |
|--------|---------|
| `qrcode.react` | RECOMMENDED — SVG output, zero dependencies, React 19 compatible, actively maintained, exposes `<QRCodeSVG>` and `<QRCodeCanvas>` named exports |
| `react-qr-code` | VIABLE alternative — also SVG, but smaller community, less actively maintained |
| `qr-code-styling` | OVERKILL — adds gradient/logo styling but requires canvas, heavier, not React-native |
| Native `qrcode` (node) | WRONG — server-side library, not for browser React components |
| Manually building QR from scratch | NEVER — QR encoding is complex, error-prone |

Use `<QRCodeSVG value={memberNumber} />` — SVG scales perfectly on retina displays and works with the existing CSS theme system (foreground/background can be CSS color values).

Screen brightness auto-increase when QR is displayed: use `window.screen.orientation` lock + a simple effect that calls `screen.brightness` if available (Capacitor Screen plugin, optional enhancement). For the web PWA, document this as a best-effort feature.

**Confidence for qrcode.react:** MEDIUM — widely known as the dominant option, but exact v4.x version could not be verified via official source due to tool restrictions. Recommend `npm install qrcode.react` and check the installed version is 4.x (React 19 peer dep).

---

### Unreasonable Hospitality (Birthday, Time-Aware Greetings)

**Tool:** `date-fns` v4 (already installed)

```ts
import { isSameDay, getHours } from 'date-fns';

const isBirthday = isSameDay(
  new Date(user.birthdate),
  new Date() // compare month+day only
);

const greeting = getHours(new Date()) < 12
  ? 'Buenos días'
  : getHours(new Date()) < 19
  ? 'Buenas tardes'
  : 'Buenas noches';
```

Birthday confetti particles: Framer Motion `motion.div` with randomized `x/y/rotate` initial values and `animate` to fall — no confetti library needed for a subtle, premium implementation. (Avoid `canvas-confetti` — overkill for a single in-app moment.)

**Confidence:** HIGH — pure date-fns + Framer Motion.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| QR code | qrcode.react | react-qr-code | Smaller community; qrcode.react has broader React version history |
| QR code | qrcode.react | qr-code-styling | Canvas-based, heavier, overkill for credential card |
| Platform detection | Capacitor.getPlatform() + UA | react-device-detect (npm) | Extra dependency for what Capacitor already provides natively |
| Platform detection | Capacitor.getPlatform() + UA | capacitor-device plugin | Overkill — getPlatform() is on the core, no plugin needed |
| Theme system | Tailwind v4 @custom-variant + Zustand | next-themes | next-themes is Next.js-oriented; overkill for a Vite app |
| Theme system | Tailwind v4 @custom-variant + Zustand | @radix-ui/themes | Full component library, not a theme primitive; conflicts with existing custom component system |
| Bottom sheet | Framer Motion drag | react-spring bottom sheet | Adds spring physics library that duplicates Framer Motion |
| Bottom sheet | Framer Motion drag | vaul (drawer) | Viable but adds 15KB dependency; Framer Motion already handles this |
| Animations | Framer Motion (existing) | GSAP | Overkill and conflicts with existing Framer Motion usage |
| Horizontal time strip | CSS scroll-snap + Tailwind | react-horizontal-scrolling-menu | Extra dependency for what CSS scroll-snap handles natively |
| Time/date logic | date-fns (existing) | dayjs, luxon | Already have date-fns installed; don't add second date library |

---

## What NOT to Add

| Library | Why Excluded |
|---------|-------------|
| Material UI / MUI | App uses custom component system; MUI would require full migration and adds 300KB+ |
| Radix UI | Useful primitives, but the app already has custom components; adding mid-project creates inconsistency |
| React Spring | Duplicates Framer Motion, which is already installed at v12 |
| canvas-confetti | Overkill for birthday moment; Framer Motion particles give more design control |
| react-device-detect | Redundant — Capacitor.getPlatform() covers the same need with a more authoritative source |
| next-themes | Built for Next.js App Router; Tailwind v4 @custom-variant with Zustand is the correct Vite pattern |
| Any icon library beyond lucide-react | lucide-react 0.575 already covers all needed icons |
| Stripe | Explicitly out of scope for v2.0 |
| @capacitor/screen-brightness | Optional progressive enhancement only — do not block QR feature on this |

---

## Installation

```bash
# Only new dependency for v2.0
npm install qrcode.react
```

If using TypeScript types (qrcode.react ships its own types since v3):
```bash
# Types are bundled — no @types/qrcode.react needed
```

---

## Integration Notes for Existing Stack

### Tailwind v4 + Theme System

The existing `index.css` already defines CSS custom properties in `:root`. The theme system extends this by:
1. Adding `@custom-variant dark` directive after `@import "tailwindcss"` in `index.css`
2. Adding a `[data-theme=dark]` block overriding `--color-bg`, `--color-bg-elevated`, `--color-surface`, `--color-text-*`, etc.
3. Light mode palette goes into `[data-theme=light]` block (current `:root` values are dark — need to restructure)

**Note:** The current `index.css` `:root` defines dark palette values as defaults. The theme restructure must explicitly define both `[data-theme=light]` and `[data-theme=dark]` blocks, with a `:root` fallback that matches system default.

### Framer Motion + Platform Variants

Platform-specific motion feels (iOS physics vs Material ripple) are implemented by:
- iOS: `spring({ stiffness: 300, damping: 30 })` — snappy, physical
- Android: `easeOut` with shorter duration + ripple via CSS `::after` pseudo-element
- Pass platform to motion props via `usePlatform()` hook result

### Capacitor + QR Screen Brightness

`@capacitor/screen-brightness` can be conditionally imported only when running in native context:
```ts
if (Capacitor.isNativePlatform()) {
  const { ScreenBrightness } = await import('@capacitor/screen-brightness');
  await ScreenBrightness.setBrightness({ brightness: 1.0 });
}
```
Do not add this as a hard dependency unless native QR scan UX is validated.

---

## Sources

| Source | URL | Confidence |
|--------|-----|------------|
| Tailwind CSS v4 dark mode docs | https://tailwindcss.com/docs/dark-mode | HIGH — official docs, fetched 2026-03-11 |
| Tailwind CSS v4 blog / what's new | https://tailwindcss.com/blog/tailwindcss-v4 | HIGH — official source, fetched 2026-03-11 |
| Framer Motion version | package-lock.json (installed v12.34.3) | HIGH — from project lockfile |
| Capacitor version | package-lock.json (installed v8.1.0) | HIGH — from project lockfile |
| Capacitor.getPlatform() API | Training data (Capacitor 3-8 core API, stable) | MEDIUM — not verified via live fetch due to tool restrictions |
| qrcode.react recommendation | Training data (dominant React QR library) | MEDIUM — npm stats not verifiable via live fetch; verify version on install |
| date-fns API | package-lock.json (installed v4.1.0) | HIGH — from project lockfile |
