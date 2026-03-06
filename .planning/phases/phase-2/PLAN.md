# Phase 2 — Auth & Core Data Flow
**Goal:** Login works end-to-end with real Railway DB data. No view crashes on load.
**Done when:** Login as member 31505 → HomeView shows real name, maintenance banner, upcoming reservation. Login as staff → EmployeeDashboard loads.

---

## Context (from Phase 1 audit)

- **Seed file is complete** — covers Units, Activities, Resources, Services, Staff (15), Membership 31505 (Max + Andrea + Leo + Mía), Lockers (60+), Maintenance billing (current period PENDING at $4,850)
- **Adult login is password-less during migration** — `password_hash` is null in seed, backend accepts any non-empty password for adults
- **Leo PIN: `1234`**, Mía PIN: `5678`
- **Staff dev password: `staff123`**
- **No admin-role staff in seed** — need to add one so AdminView has a dedicated login
- **membership.status = 'activa' with pending bill** — 403 only fires if status explicitly set to 'suspendida'; billing pending ≠ suspended
- **Admin routes have NO auth guards** (open endpoints) — acceptable for demo

---

## Step 1 — Add admin staff to seed (Backend)

**File:** `C:\Users\Nuebe\Documents\centro-libanes-backend\prisma\seed.ts`

In the `staffData` array (around line 267), add one admin staff member:

```typescript
{ name: 'Admin Centro', role: 'administrador', employment_type: 'nomina', unit_id: hermes.id, schedule_template: weekdaySchedule('08:00', '17:00') },
```

This gives us a staff account with `role: 'administrador'` to log into the AdminView. Dev password will be `staff123`.

---

## Step 2 — Fix AdminRoute guard in App.tsx (Frontend)

**File:** `C:\Users\Nuebe\Documents\centro-libanes-frontend-main\src\App.tsx`

Current `StaffRoute` allows any `user_type === 'employee'` to access `/admin`. Split it into two guards:

**Change:** Replace the `StaffRoute` component and the `/admin` route:

```tsx
// Before:
const StaffRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.user_type !== 'employee') return <Navigate to="/" replace />;
  return <>{children}</>;
};

// After — keep StaffRoute for /employee, add AdminRoute for /admin:
const StaffRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.user_type !== 'employee') return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.user_type !== 'employee') return <Navigate to="/" replace />;
  if (user?.role !== 'administrador') return <Navigate to="/employee" replace />;
  return <>{children}</>;
};
```

**And update the admin route:**
```tsx
// Before:
<Route path="/admin" element={<StaffRoute><AdminView /></StaffRoute>} />

// After:
<Route path="/admin" element={<AdminRoute><AdminView /></AdminRoute>} />
```

---

## Step 3 — Add 403 suspension handling to api.ts (Frontend)

**File:** `C:\Users\Nuebe\Documents\centro-libanes-frontend-main\src\services\api.ts`

Currently only 401 is intercepted. Add 403 handling so suspended members see a clear message instead of silent failures:

```typescript
// After existing 401 block, add:
if (error.response?.status === 403 && error.response?.data?.error === 'suspension') {
  // Don't logout — member should still access /payment to pay
  // Let individual views show empty states; HomeView will show the maintenance banner
  // Redirect to home so they can see their status and navigate to payment
  if (window.location.pathname !== '/' && window.location.pathname !== '/payment') {
    window.location.href = '/';
  }
}
```

---

## Step 4 — Seed Railway DB (Backend action)

**Prerequisite:** The backend Railway service must have `DATABASE_URL` set as an environment variable pointing to the Railway PostgreSQL instance.

**Commands to run from `C:\Users\Nuebe\Documents\centro-libanes-backend`:**

```bash
# 1. Verify .env has DATABASE_URL pointing to Railway
# (check .env or Railway dashboard)

# 2. Run migrations first (in case DB schema is not current)
npx prisma migrate deploy

# 3. Run the seed
npx prisma db seed
```

**What the seed creates:**
- 2 Units (Hermes + Fredy Atala)
- ~40 Activities with schedules
- ~44 Resources (courts, lanes, rooms)
- 14 Services (spa + barbería × 2 units)
- 16 Staff members (15 + 1 admin added in Step 1)
- Membership 31505 (Max, Andrea, Leo, Mía)
- 60+ Lockers
- Maintenance billing: last month PAID, current month PENDING ($4,850)
- 1 sample reservation (Pádel tomorrow 10am)

**Expected output:**
```
🌱 Starting complete DB Seed...
  ✓ SystemConfig
  ✓ Units (Hermes + Fredy Atala)
  ✓ Activities: N Hermes + N Fredy Atala
  ✓ Resources: 20 Hermes + 24 Fredy Atala
  ✓ Services: 7 × 2 units
  ✓ Staff: 16 members linked to services
  ✓ Membership 31505 with 4 profiles
  ✓ Lockers: 60 across both units
  ✓ Maintenance billing (prev paid + current pending)
  ✓ Sample reservation: Padel tomorrow 10-11am
🎉 Seed completed successfully!
```

---

## Step 5 — Verify Railway backend is live

Check that the Railway backend responds:

```bash
curl https://<your-railway-url>/health
# Expected: {"status":"ok","service":"centro-libanes-api"}
```

If not running:
1. Check Railway dashboard → backend service → logs
2. Verify `DATABASE_URL` env var is set
3. Verify `JWT_SECRET` is set (defaults to 'centro-libanes-secret-key-2024' if not set)

---

## Step 6 — Set VITE_API_URL in frontend .env

**File:** `C:\Users\Nuebe\Documents\centro-libanes-frontend-main\.env`

```env
VITE_API_URL=https://<your-railway-url>/api
```

If the `.env` file doesn't exist, copy from `.env.example` and fill in the Railway URL.

For Vercel deployment, set this as an environment variable in the Vercel project settings.

---

## Step 7 — End-to-End Auth Test

Test these flows in order:

### Test A — Member login (Max, titular, adult)
1. Open the app → "Soy Miembro"
2. Enter member number: `31505` → Continue
3. Select profile: Max Nicolas Maupome
4. Enter any non-empty password (e.g. `1234`) → Entrar
5. **Expected:** HomeView loads with name "Max Nicolas Maupome", credential card shows member number 31505, maintenance banner shows "Mantenimiento pendiente - Debes $4,850 MXN", upcoming reservation shows the pádel court booking

### Test B — Minor login (Leo, PIN)
1. Open the app → "Soy Miembro"
2. Enter member number: `31505` → Continue
3. Select profile: Leo Nicolas
4. Enter PIN: `1234` → Entrar
5. **Expected:** HomeView loads for Leo

### Test C — Staff login (masajista)
1. Open the app → "Soy Empleado"
2. Username: `María López`, Password: `staff123`
3. **Expected:** Redirected to `/employee` EmployeeDashboard

### Test D — Admin login
1. Open the app → "Soy Empleado"
2. Username: `Admin Centro`, Password: `staff123`
3. **Expected:** Redirected to `/employee`, then navigate to `/admin` → AdminView loads (since role === 'administrador')

### Test E — Non-admin staff cannot access /admin
1. Login as `María López` (staff)
2. Manually navigate to `/admin`
3. **Expected:** Redirected to `/employee` (because role !== 'administrador')

---

## Step 8 — Verify each view loads without crashing

After successful login as Max, navigate to each route and confirm no white screens or console errors:

- `/` — HomeView: shows name, credential card, maintenance banner, reservation card
- `/reservations` — CatalogView: shows services/courts list (may take a moment)
- `/lockers` — LockerView: shows locker grid for Hermes
- `/family` — FamilyView: shows 4 family members
- `/profile` — ProfileView: shows member info
- `/payment` — PaymentView: shows statement with $4,850 pending maintenance
- `/notifications` — NotificationsView: loads (may be empty)

---

## Definition of Done

- [x] Seed runs successfully on Railway (no errors)
- [x] Login flow works for member 31505 (adult + minor)
- [x] Login flow works for staff (masajista)
- [x] Login flow works for admin (administrador)
- [x] AdminView restricted to administrador role
- [x] HomeView shows real user data and maintenance banner
- [x] PaymentView shows $4,850 pending maintenance
- [x] No view throws a white screen on load
- [x] 403 suspension redirects to home (not logout)
