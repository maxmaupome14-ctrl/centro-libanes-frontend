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

## Repos
- Frontend: `centro-libanes-frontend-main` (local + Vercel)
- Backend: `maxmaupome14-ctrl/centro-libanes-backend` (Railway)

## Target Users
Hundreds of club members (not thousands). Spanish-language UI throughout.

## Launch Target
Internal demo / soft launch with real club members. Not a public production launch.
