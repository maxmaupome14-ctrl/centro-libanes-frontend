# Centro Libanés — Requirements
## Milestone 1: Demo-Ready (Soft Launch)

---

## Constraints & Assumptions

- Payment is **simulated** — no live Stripe integration
- Target platform is **Vercel PWA** (not Capacitor/iOS yet)
- Backend exists but is **unaudited** — must verify endpoints before building on them
- Spanish UI throughout; code in English
- Hundreds of members, not thousands — no special scale requirements
- No hard deadline confirmed

---

## Functional Requirements

### FR-1: Authentication
- Members log in with member number + password (or email + password)
- Employees log in with a credential that routes them to `/employee`
- JWT persisted in localStorage; auto-logout on 401
- Session survives page refresh

### FR-2: Home Dashboard
- Display member credential card (name, number, role badge, status)
- Show maintenance fee status (al corriente / pendiente) with amount
- Show upcoming reservations (from real API)
- Show upcoming club events (from real API)
- Quick-action buttons: Reservar, Lockers, Mi Perfil

### FR-3: Reservations (CatalogView)
- Browse bookable services: canchas (courts), clases (classes), spa services
- Filter by category
- Select date + time slot + staff (where applicable)
- Confirm booking — writes to backend
- Booking is blocked (UI disabled) when maintenance fee is pendiente
- View and cancel upcoming reservations
- Late cancellation / no-show triggers a pending charge on the family bill

### FR-4: Lockers (LockerView)
- Browse available lockers by zone (Hermes / others)
- See locker size and monthly cost
- Book a locker — adds a recurring charge to monthly statement
- View active locker rentals
- Cancel locker rental

### FR-5: Family Group (FamilyView)
- View all members in the family group
- View monthly statement (cuotas, lockers, penalizaciones)
- Titular can approve/deny pending family member actions
- Tab: familia | estado de cuenta | aprobaciones

### FR-6: Payments (PaymentView)
- Display full monthly statement with line items
- Show total due
- Simulate payment (dev mode / mock confirm)
- After payment, status updates to "al corriente" in the app

### FR-7: Notifications (NotificationsView)
- List user notifications with read/unread state
- Mark as read

### FR-8: Profile (ProfileView)
- Display user info (name, member number, role)
- Navigate to family/statement views
- Logout

### FR-9: Employee Dashboard
- View today's appointments
- View weekly agenda
- Mark appointment status (attended / no-show)

### FR-10: Admin Panel (AdminView)
- **God View:** KPI summary (active members, revenue, reservations today)
- **Eventos:** Create / edit / delete club events
- **Membresías:** Search and view member accounts
- **Lockers:** See all locker assignments, release lockers
- **Finanzas:** View pending charges, record payments, add penalties
- **Agenda Staff:** View staff schedules
- **Catálogo CRM:** Manage bookable services/resources
- **Sistema:** System config (no-show policy, pricing, etc.)

---

## Non-Functional Requirements

### NFR-1: API Contract
- All frontend views must use real backend endpoints (no hardcoded mock data)
- API failures must degrade gracefully (empty state, not crash)

### NFR-2: Auth Security
- 401 from any endpoint auto-redirects to login (except /auth/* endpoints)
- Admin route `/admin` and `/employee` require appropriate role check

### NFR-3: Mobile-First UI
- All views must be usable on a 390px wide phone screen
- Bottom navigation must be accessible above iOS safe area

### NFR-4: Performance
- Initial load < 3s on a typical mobile connection
- No blocking spinners on secondary data (skeleton / empty states preferred)

---

## Out of Scope (Milestone 1)

- Live Stripe payment processing
- Push notifications (native)
- Capacitor iOS build / App Store submission
- Email notifications
- Multi-language (EN) support
- Public-facing marketing pages
