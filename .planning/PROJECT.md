# Centro Libanés — Project Context

## What This Is
A mobile-first club management app for Centro Libanés, a Lebanese sports and social club in Mexico.
Members use it to manage reservations, lockers, family accounts, and payment status.
Staff use a separate dashboard to manage their agenda. Admins get a full back-office panel.

## Stack
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4 + Framer Motion + Zustand + React Router v7
- **Mobile wrapper:** Capacitor (iOS) — secondary target, Vercel PWA is primary
- **Backend:** Node.js + Express + Prisma + PostgreSQL — repo: `maxmaupome14-ctrl/centro-libanes-backend` (on Railway)
- **Auth:** JWT (Bearer token), stored in localStorage
- **Payments:** Mocked/simulated — no live Stripe yet
- **Hosting:** Vercel (frontend), Railway (backend + DB)

## Business Domain

### Users & Roles
- **Titular (member):** Head of household, pays the bill. `role: 'titular'`
- **Dependiente:** Family member under the titular's group (spouse, children)
- **Employee (staff):** Peluquero, Masajista, Entrenador — see their own agenda
- **Admin:** Full back-office access via `/admin`

### Key Business Rules
1. **Family groups:** One titular pays; dependientes share the membership. Pending maintenance fee blocks ALL reservations for the group.
2. **Monthly billing:** Locker rentals and no-show penalties are added as charges to the group's monthly statement — no per-transaction payment.
3. **No-show / late cancel:** Triggers a penalty charge on the monthly bill.
4. **Payment blocking:** If `isMaintenancePaid = false`, all booking actions are disabled but the app remains accessible.

### Core Features
| Feature | Frontend View | Status |
|---|---|---|
| Auth (login) | LoginView | Built |
| Home dashboard + credential card | HomeView | Built |
| Service catalog + booking | CatalogView | Built (UI complete) |
| Locker management | LockerView | Built (UI complete) |
| Family group + statement | FamilyView | Built |
| Payment / estado de cuenta | PaymentView | Built (mock flow) |
| Notifications | NotificationsView | Built |
| Member profile | ProfileView | Built |
| Employee daily agenda | EmployeeDashboard | Built |
| Admin back-office | AdminView | Built (9 tabs) |

## Current Milestone: v2.0 Premium UX

**Goal:** Transform the app from functional demo into a premium, platform-adaptive club experience focused on UI/UX excellence.

**Target features:**
- Platform-adaptive design (Apple HIG for iOS, Material Design 3 for Android)
- Dark/light/auto theme with muted luxury dark mode
- Auth flow fix (password before profiles) + premium welcome animation
- PlayTomic-inspired booking UX (time pickers, court selection, staff selection)
- Unidad favorita (save preferred courts/resources)
- Multi-profile switching (family members)
- QR code digital credential card
- Unreasonable hospitality (personalized welcome, birthday notifications)

**Design reference:** `docs/plans/2026-03-11-v2-ux-premium-design.md`

## Requirements

### Validated
- ✓ Auth login flow (member + staff) — existing
- ✓ Home dashboard with credential card — existing
- ✓ Service catalog + booking UI — existing
- ✓ Locker management UI — existing
- ✓ Family group + statement — existing
- ✓ Mock payment flow — existing
- ✓ Notifications view — existing
- ✓ Member profile — existing
- ✓ Employee dashboard — existing
- ✓ Admin panel (9 tabs) — existing
- ✓ Live deployment (Vercel + Railway + Supabase) — existing

### Active
- [ ] Platform-adaptive UI (iOS HIG / Android Material 3)
- [ ] Dark/light/auto theme system with muted luxury dark mode
- [ ] Auth flow fix + premium welcome animation
- [ ] PlayTomic-inspired booking UX
- [ ] Unidad favorita (preferred courts)
- [ ] Multi-profile switching
- [ ] QR code credential card
- [ ] Unreasonable hospitality notifications

### Out of Scope
- Tournament system — backend-heavy, future milestone
- Payment domiciliation — requires Stripe integration
- Calendar integration — native API, future milestone
- Guest invitations — new backend feature
- Strapi CMS — infrastructure change
- Locker floor-plan maps — design asset heavy
- Waitlist system — new backend feature
- Rating system — new backend feature
- Push notifications (native) — requires Capacitor

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Platform-adaptive (not one design) | Diego's explicit request; follows Apple HIG + Material 3 benchmarks | Two UI shells, shared logic |
| Muted luxury dark mode | Premium club feel without being flashy; dark slate + warm white + gold accents | Implemented via CSS custom properties |
| Premium welcome animation | "Unreasonable hospitality" — club entrance feel on login | Framer Motion 2s sequence |
| PlayTomic as booking UX reference | Diego's benchmark for court booking flow | Horizontal time strip, visual court cards |
| Web defaults to iOS style | Cleaner baseline for PWA users | `usePlatform()` fallback |

## Repos
- Frontend: `centro-libanes-frontend-main` (local + Vercel)
- Backend: `maxmaupome14-ctrl/centro-libanes-backend` (Railway)

## Target Users
Hundreds of club members (not thousands). Spanish-language UI throughout.

## Launch Target
Internal demo / soft launch with real club members. Not a public production launch.

---
*Last updated: 2026-03-11 after milestone v2.0 initialization*
