# Centro Libanés — Requirements
## Milestone 2: v2.0 Premium UX

---

## Constraints & Assumptions

- **UX-only milestone** — no new backend models or endpoints (except profile switching coordination)
- **PWA primary target** — Capacitor/iOS secondary
- **Single new dependency** — `qrcode.react` only
- **Existing CSS custom properties** — theme system builds on current `--color-*` tokens
- **Spanish UI** — no internationalization
- **Soft launch scale** — hundreds of members, not thousands

---

## v2.0 Requirements

### Theme System (THEME)

- [ ] **THEME-01**: User can toggle between light, dark, and auto (system-follows) theme modes
- [ ] **THEME-02**: Selected theme preference persists across sessions via localStorage
- [ ] **THEME-03**: Dark mode uses muted luxury palette (dark slate #0F1419, warm white #E8E4DF, gold accents reserved for premium moments)
- [ ] **THEME-04**: Light mode uses clean warm backgrounds with cedar green primary and gold secondary
- [ ] **THEME-05**: Theme transitions smoothly between modes (200ms crossfade, no flash)
- [ ] **THEME-06**: No flash of unstyled content (FOUC) on page load — blocking script in index.html reads preference before render
- [ ] **THEME-07**: All text meets WCAG AA contrast ratios (4.5:1) in both light and dark modes

### Authentication Flow (AUTH)

- [ ] **AUTH-01**: Login flow follows correct order: member number → password → profile selection (if family has multiple members)
- [ ] **AUTH-02**: After successful login, user sees a premium welcome animation (brand fade → "Bienvenido, [Name]" → credential card slide-up → home transition)
- [ ] **AUTH-03**: Welcome animation completes in under 2 seconds and preloads home data during animation
- [ ] **AUTH-04**: Welcome animation skips on subsequent same-session logins
- [ ] **AUTH-05**: Welcome animation respects `prefers-reduced-motion` (shows static welcome instead)

### Platform Adaptation (PLAT)

- [ ] **PLAT-01**: App detects iOS, Android, or web platform via User Agent / Capacitor API and caches result
- [ ] **PLAT-02**: Platform detection is synchronous (no render flash on first paint)
- [ ] **PLAT-03**: iOS users see HIG-style navigation: bottom tab bar with translucent blur backdrop, large title headers
- [ ] **PLAT-04**: Android users see Material Design 3 navigation: top app bar, Material bottom nav with always-visible labels
- [ ] **PLAT-05**: iOS users get subtle highlight tap feedback; Android users get ripple effect on interactive elements
- [ ] **PLAT-06**: Web defaults to iOS style as baseline
- [ ] **PLAT-07**: All existing `motion.button` elements have `touchAction: 'manipulation'` applied (Samsung Fold touch bug fix audit)

### Booking UX (BOOK)

- [ ] **BOOK-01**: User can browse courts/resources as visual cards with availability color overlay (green/amber/red)
- [ ] **BOOK-02**: User can select time slots via horizontal scrollable time strip with snap points (PlayTomic-style)
- [ ] **BOOK-03**: Each time slot shows time, price, and availability status
- [ ] **BOOK-04**: User can select multiple consecutive time slots for extended bookings
- [ ] **BOOK-05**: User can mark courts/resources as "Unidad favorita" with star toggle; favorites appear first in list
- [ ] **BOOK-06**: Favorite courts persist in localStorage across sessions
- [ ] **BOOK-07**: User can select a specific staff member via avatar + name cards, with "Sin preferencia" as default
- [ ] **BOOK-08**: Booking confirmation appears as bottom sheet summary (court + time + staff + price) with single "Confirmar" button
- [ ] **BOOK-09**: Time strip uses CSS scroll-snap (not Framer Motion drag) to avoid touch conflicts with page scroll

### Multi-Profile Switching (PROF)

- [ ] **PROF-01**: User can switch between family member profiles via bottom sheet from navigation bar
- [ ] **PROF-02**: Profile switcher shows all family members with role badges (titular, dependiente)
- [ ] **PROF-03**: Active profile is visually indicated throughout the app (avatar/name in header)
- [ ] **PROF-04**: Switching profiles does not require re-entering password

### QR Credential Card (QR)

- [ ] **QR-01**: User can view full-screen digital credential card from home dashboard
- [ ] **QR-02**: Credential card displays member photo (or initials avatar), name, member number, and QR code
- [ ] **QR-03**: QR code encodes member ID for scanning at club entrance
- [ ] **QR-04**: Card has animated gold shimmer border in dark mode
- [ ] **QR-05**: Surrounding UI dims or brightens to improve QR readability (CSS filter fallback for PWA)
- [ ] **QR-06**: "Añadir a Wallet" button shows as placeholder with coming-soon toast

### Hospitality Notifications (HOSP)

- [ ] **HOSP-01**: User sees time-aware greeting on login ("Buenos días/tardes/noches, [Name]")
- [ ] **HOSP-02**: User sees birthday greeting with confetti animation on their birthday login
- [ ] **HOSP-03**: User sees membership anniversary notification ("1 año como socio") on anniversary date
- [ ] **HOSP-04**: All hospitality notifications are in-app cards, not push notifications

---

## Future Requirements (Deferred)

- Tournament system (brackets, registration, scoring)
- Payment domiciliation (automatic recurring payments)
- Calendar integration (sync reservations to phone calendar)
- Guest invitations (non-member day passes)
- Strapi CMS (content management for events/banners)
- Locker floor-plan maps (visual layout)
- Waitlist for full courts/classes
- Rating system (rate services/staff)
- Push notifications (native APNs/FCM)
- Apple/Google Wallet integration (real PassKit/Wallet API)
- Biometric authentication (Face ID / Touch ID)
- Weather-contextual activity suggestions

---

## Out of Scope (Explicit Exclusions)

- **Native push notifications** — requires Capacitor plugin + Apple provisioning + Firebase; in-app cards suffice
- **Wallet integration** — requires Apple/Google developer entitlements; placeholder button only
- **Biometric auth** — Capacitor native dependency; password/PIN flow is sufficient for soft launch
- **Social/activity feed** — high backend cost, no current user need
- **Gamification** — risk of feeling gimmicky against premium positioning
- **Real-time availability (websockets)** — polling on page load is sufficient at this scale
- **Multi-language** — all members are Spanish-speaking
- **Custom theme colors** — dilutes brand consistency
- **Onboarding tutorial** — good UX should be self-evident

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| THEME-01 | Phase 8 | Pending |
| THEME-02 | Phase 8 | Pending |
| THEME-03 | Phase 8 | Pending |
| THEME-04 | Phase 8 | Pending |
| THEME-05 | Phase 8 | Pending |
| THEME-06 | Phase 8 | Pending |
| THEME-07 | Phase 8 | Pending |
| AUTH-01 | Phase 8 | Pending |
| PLAT-01 | Phase 8 | Pending |
| PLAT-02 | Phase 8 | Pending |
| PLAT-06 | Phase 8 | Pending |
| PLAT-07 | Phase 8 | Pending |
| AUTH-02 | Phase 9 | Pending |
| AUTH-03 | Phase 9 | Pending |
| AUTH-04 | Phase 9 | Pending |
| AUTH-05 | Phase 9 | Pending |
| PROF-01 | Phase 9 | Pending |
| PROF-02 | Phase 9 | Pending |
| PROF-03 | Phase 9 | Pending |
| PROF-04 | Phase 9 | Pending |
| QR-01 | Phase 9 | Pending |
| QR-02 | Phase 9 | Pending |
| QR-03 | Phase 9 | Pending |
| QR-04 | Phase 9 | Pending |
| QR-05 | Phase 9 | Pending |
| QR-06 | Phase 9 | Pending |
| BOOK-01 | Phase 10 | Pending |
| BOOK-02 | Phase 10 | Pending |
| BOOK-03 | Phase 10 | Pending |
| BOOK-04 | Phase 10 | Pending |
| BOOK-05 | Phase 10 | Pending |
| BOOK-06 | Phase 10 | Pending |
| BOOK-07 | Phase 10 | Pending |
| BOOK-08 | Phase 10 | Pending |
| BOOK-09 | Phase 10 | Pending |
| PLAT-03 | Phase 11 | Pending |
| PLAT-04 | Phase 11 | Pending |
| PLAT-05 | Phase 11 | Pending |
| HOSP-01 | Phase 11 | Pending |
| HOSP-02 | Phase 11 | Pending |
| HOSP-03 | Phase 11 | Pending |
| HOSP-04 | Phase 11 | Pending |

---
*42 requirements across 7 categories for milestone v2.0*
*All 42 requirements mapped to phases 8–11*
*Last updated: 2026-03-11*
