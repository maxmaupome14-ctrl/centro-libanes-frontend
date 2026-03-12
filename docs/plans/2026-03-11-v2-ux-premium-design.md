# Centro Libanés V2 — Premium UX Design

## Milestone Goal

Transform the Centro Libanés app from a functional demo into a premium, platform-adaptive club experience. Focus on UI/UX polish — no new backend-heavy features.

## Scope

### In Scope
- Platform-adaptive design (Apple HIG for iOS, Material Design 3 for Android)
- Dark/light/auto theme with muted luxury dark mode
- Auth flow fix (password before profiles) + premium welcome animation
- PlayTomic-inspired booking UX (time pickers, court selection, staff selection)
- Unidad favorita (save preferred courts/resources)
- Multi-profile switching (family members)
- QR code digital credential card
- Unreasonable hospitality (personalized welcome, birthday notifications)

### Out of Scope (Future Milestones)
- Tournament system
- Payment domiciliation
- Calendar integration
- Guest invitations
- Strapi CMS
- Locker floor-plan maps
- Waitlist system
- Rating system
- Push notifications (native)

---

## Design Decisions

### 1. Platform-Adaptive Design

Detect platform via User Agent. Serve different UI shells:

**iOS (Apple HIG):**
- SF Pro font stack (system font on iOS, fallback Inter on web)
- Bottom tab bar navigation (fixed, translucent blur backdrop)
- iOS-style back swipe gestures
- Translucent navigation bars with blur effect
- Subtle, physics-based animations
- Large title headers that collapse on scroll

**Android (Material Design 3):**
- Roboto font stack (system font on Android)
- Top app bar with hamburger/back
- FAB (floating action button) for primary actions
- Ripple touch feedback on all interactive elements
- Material You dynamic color extraction from brand palette
- Bottom navigation bar (Material style — labels always visible)

**Implementation approach:**
- `usePlatform()` hook detects iOS/Android/web
- Platform-specific component variants: `<NavBar>`, `<TabBar>`, `<Button>`
- Shared business logic, split presentation layer
- CSS custom properties switch per platform
- Web defaults to iOS style (cleaner baseline)

### 2. Theme System — Muted Luxury Dark Mode

**Three modes:** Light / Dark / Auto (system-follows)

**Light mode (current baseline):**
- White/off-white backgrounds
- Cedar green (`--color-green-cedar`) primary
- Gold (`--color-gold`) secondary/accent
- Standard contrast ratios

**Dark mode — Muted Luxury:**
- Dark slate backgrounds (`#0F1419`, `#1A1F26`) — not pure black
- Desaturated cedar green for subtle accents
- Gold reserved for premium moments only:
  - Credential card shimmer
  - Welcome animation accent
  - Active tab indicator
  - CTA buttons on key flows
- Warm white text (`#E8E4DF`) instead of pure `#FFF`
- Subtle surface elevation via slightly lighter slate tones
- Dark leather/brushed metal feel — premium without flashy

**Implementation:**
- CSS custom properties for all colors
- `prefers-color-scheme` media query for auto
- Manual toggle stored in localStorage
- Smooth transition between modes (200ms opacity crossfade)
- Theme provider wraps app root

### 3. Auth Flow — Premium Club Entrance

**Current (broken):** Member number → shows profiles → asks password
**Fixed flow:** Member number → password → shows profiles (if family) → enter

**Welcome animation sequence (2 seconds max):**
1. Password accepted → screen fades to brand color
2. "Bienvenido, Michele" with subtle gold shimmer on name
3. Credential card slides up from bottom (like presenting at club entrance)
4. Card settles → transitions to home dashboard

**Birthday/special occasion variant:**
- If member's birthday: confetti particles + "Feliz cumpleaños" before welcome
- If first login of the day: warm "Buenos días/tardes/noches" based on time

**Technical:**
- Framer Motion orchestrated sequence
- Preload home data during animation (no perceived loading)
- Skip animation on subsequent logins within same session
- Respect `prefers-reduced-motion`

### 4. Booking UX — PlayTomic-Inspired

**Current:** Basic date picker + time slots
**Target:** Fluid, visual booking experience

**Court/resource selection:**
- Visual cards with court photos (or illustrated placeholders)
- Availability overlay: green (open), amber (few slots), red (full)
- "Unidad favorita" star toggle on each court — starred courts appear first

**Time picker redesign:**
- Horizontal scrollable time strip (like PlayTomic)
- Each slot shows: time, price, availability
- Selected slot highlights with brand color
- Multi-slot selection for extended bookings

**Staff selection:**
- Avatar + name cards for available staff
- "Sin preferencia" option as default
- Staff availability updates based on selected time

**Confirmation:**
- Bottom sheet summary: court + time + staff + price
- Single "Confirmar" button
- Success animation: calendar icon with checkmark

### 5. Multi-Profile Switching

**When family has multiple members:**
- Profile avatar in top nav (or header)
- Tap to open profile switcher (bottom sheet)
- Shows all family members with role badges
- Switch without re-entering password (already authenticated as family)
- Visual indicator of active profile throughout app

### 6. QR Code Credential Card

**Digital member card:**
- Full-screen card view from home dashboard
- Member photo (or initials avatar), name, member number
- QR code encodes member ID (scannable at club entrance)
- Subtle animated gradient border (gold shimmer in dark mode)
- "Añadir a Wallet" button (future: Apple/Google Wallet integration)
- Brightness auto-increases when QR is displayed

### 7. Unreasonable Hospitality Notifications

**Personalized touches:**
- Birthday greeting on login (date from profile)
- "Buenos días/tardes/noches, [Name]" time-aware welcome
- Milestone celebrations: "1 año como socio" anniversary
- Weather-based suggestions: "Hace buen día — las canchas al aire libre están disponibles"
- In-app notification cards, not push (push is out of scope)

---

## Technical Architecture

### Platform Detection
```
usePlatform() → 'ios' | 'android' | 'web'
  - navigator.userAgent parsing
  - Cached in memory (won't change mid-session)
  - CSS class on <html>: platform-ios | platform-android | platform-web
```

### Theme Provider
```
useTheme() → { mode, setMode, colors }
  - Reads system preference
  - localStorage override
  - Applies CSS custom properties
  - Transitions managed via CSS
```

### Component Strategy
```
<PlatformButton />  → renders iOS or Material button
<PlatformNavBar />  → renders HIG or Material nav
<PlatformTabBar />  → renders iOS tabs or Material bottom nav
<PlatformSheet />   → renders iOS action sheet or Material bottom sheet
```

Shared components (cards, forms, content) stay universal. Only chrome/navigation adapts.

---

## Benchmarks

- **Apple HIG:** https://developer.apple.com/design/human-interface-guidelines
- **Material Design 3:** https://m3.material.io
- **PlayTomic:** Booking flow UX reference (time strip, court cards)
