# Backend Audit — Centro Libanés
**Audited:** 2026-03-06
**Backend repo:** `maxmaupome14-ctrl/centro-libanes-backend`
**Frontend repo:** `centro-libanes-frontend-main`

---

## Executive Summary

The backend is **substantially built** — every major feature area has route coverage. The primary blockers are:
1. **No seeded data** — Railway DB is likely empty; nothing will work until seed runs
2. **Three specific mismatches** between frontend expectations and backend behavior
3. **One security gap** — admin panel accessible to all staff, not admin-only
4. **Suspended member flow** — 403 not handled on frontend (silent failure)

---

## Endpoint Inventory

### Auth (`/api/auth`)
| Method | Path | Exists | Notes |
|---|---|---|---|
| POST | `/auth/select-profile` | ✅ | Enter member_number → get profiles list |
| POST | `/auth/login` | ✅ | profile_id + password/PIN → JWT |
| POST | `/auth/staff-login` | ✅ | username + password → staff JWT (dev fallback: 'staff123') |
| POST | `/auth/setup-pin` | ✅ | Set PIN for minor |
| POST | `/auth/set-password` | ✅ | Set/change adult password |

### Reservations (`/api/reservations`)
| Method | Path | Exists | Notes |
|---|---|---|---|
| GET | `/reservations/user` | ✅ | Upcoming reservations for logged-in profile |
| GET | `/reservations/pending-approvals` | ✅ | Requires `can_approve_reservations` permission |
| POST | `/reservations/book` | ✅ | Takes `service_id` OR `resource_id`, `date`, `start_time`, `end_time` |
| POST | `/reservations/:id/cancel` | ✅ | Late cancel (<2h) auto-creates penalty charge |
| POST | `/reservations/approvals/:id/approve` | ✅ | Requires permission |
| POST | `/reservations/approvals/:id/reject` | ✅ | Requires permission |

### Lockers (`/api/lockers`)
| Method | Path | Exists | Notes |
|---|---|---|---|
| GET | `/lockers?unit_name=X` | ✅ | Returns `is_available` field based on active rentals |
| GET | `/lockers/my` | ✅ | Active rentals for current user |
| POST | `/lockers/:id/rent` | ✅ | Creates LockerRental, billed quarterly |
| POST | `/lockers/:id/release` | ✅ | Cancels rental |

### Payments (`/api/payments`)
| Method | Path | Exists | Notes |
|---|---|---|---|
| GET | `/payments/pending` | ✅ | Pending payments for membership |
| GET | `/payments/:id/statement` | ✅ | Full statement with maintenance, lockers, enrollments, totals |
| POST | `/payments/create-intent` | ✅ | Returns `dev_mode: true` without STRIPE_SECRET_KEY |
| POST | `/payments/:id/confirm` | ✅ | Dev confirm — marks payment completed |
| POST | `/payments/webhook` | ✅ | Stripe webhook handler (no-ops without Stripe config) |

### Family/Membership (`/api/membership`)
| Method | Path | Exists | Notes |
|---|---|---|---|
| GET | `/membership/:id/beneficiaries` | ✅ | All active profiles in membership group |
| POST | `/membership/:id/beneficiaries` | ✅ | Create new family member |
| PATCH | `/membership/:id/beneficiaries/:pid` | ✅ | Update permissions/spending limit |
| DELETE | `/membership/:id/beneficiaries/:pid` | ✅ | Soft-deactivate + cancel future reservations |

### Catalog (`/api/catalog`)
| Method | Path | Exists | Notes |
|---|---|---|---|
| GET | `/catalog` | ✅ | Returns activities + services + resources combined, with `type` field |
| GET | `/catalog/activities/:id` | ✅ | Single activity detail with schedules + enrollment count |

### Events (`/api/events`)
| Method | Path | Exists | Notes |
|---|---|---|---|
| GET | `/events` | ✅ | Public — published upcoming events |
| GET | `/events/all` | ✅ | Staff only — all events |
| POST | `/events` | ✅ | Staff only — create event |
| PUT | `/events/:id` | ✅ | Staff only — update event |
| DELETE | `/events/:id` | ✅ | Staff only — delete event |

### Notifications (`/api/notifications`)
| Method | Path | Exists | Notes |
|---|---|---|---|
| GET | `/notifications/my` | ✅ | Returns `{ notifications[], unread_count }` |
| PATCH | `/notifications/:id/read` | ✅ | Mark single as read |
| POST | `/notifications/read-all` | ✅ | Mark all as read |

### Staff (`/api/staff`)
| Method | Path | Exists | Notes |
|---|---|---|---|
| GET | `/staff/me/appointments` | ✅ | Requires `requireStaffAuth` |
| GET | `/staff/me/week` | ✅ | Returns `{ counts: [0..5] }` Mon–Sat |

### Enrollments (`/api/enrollments`)
| Status | Unknown — not audited |

### Profile (`/api/profile`)
| Status | Unknown — not audited |

### Admin (`/api/admin`)
| Status | Unknown — not audited (large file, deferred to Phase 6) |

---

## Issues Found

### ISSUE-1 — No seed data [CRITICAL]
**Impact:** 100% of API calls return empty or 404 until the DB has data.
**Fix:** Run `prisma/seed.ts` against Railway DB after verifying `prisma/data/*.json` files exist.
**Assign to:** Phase 2

---

### ISSUE-2 — Suspended member gets 403, frontend doesn't handle it [HIGH]
**Impact:** If a member's `membership.status !== 'activa'`, `requireAuth` returns `{ error: 'suspension' }` with HTTP 403. The frontend axios interceptor only handles 401 (redirect to login), not 403. Result: every API call silently fails with an unhandled error.
**Fix:** Add 403 interception in `src/services/api.ts` — redirect to a "membership suspended" state or show a toast.
**Assign to:** Phase 2

---

### ISSUE-3 — Admin panel accessible to all staff [MEDIUM]
**Impact:** The `StaffRoute` guard in `App.tsx` checks `user.user_type === 'employee'`, which is true for ALL staff (peluquero, masajista, entrenador, admin). Any employee can navigate to `/admin`.
**Backend note:** Admin routes use `requireStaffAuth` which verifies the JWT type is `'staff'` — so the backend is protected — but the frontend shows admin UI to all employees.
**Fix:** Add role/admin check in `StaffRoute`, or add a separate `AdminRoute` that checks `user.role === 'admin'` or similar.
**Assign to:** Phase 2

---

### ISSUE-4 — Events CRUD in AdminView uses wrong auth token [MEDIUM]
**Impact:** Admin/staff users log in via `/auth/staff-login` → get a staff JWT. The `POST /events`, `PUT /events/:id`, `DELETE /events/:id` endpoints use `requireStaffAuth`. This should work if admin is a staff member.
**But:** If admin auth is eventually separated from staff auth (different token type), the events endpoints will need to be updated.
**Status:** OK for now, flag for future.

---

### ISSUE-5 — FamilyView calls `/api/membership/:id/beneficiaries` but passes wrong ID [MEDIUM]
**Impact:** FamilyView needs to pass `membership_id` (the group ID) not the profile ID. The `user.membership_id` in authStore is the right field — need to verify FamilyView actually uses this.
**Fix:** Verify FamilyView uses `user.membership_id` for the API call, not `user.id`.
**Assign to:** Phase 2 (verify only)

---

### ISSUE-6 — Reservation booking: frontend field mismatch [LOW]
**Impact:** The CatalogView sends booking data. Backend expects `service_id` OR `resource_id`. CatalogView combines both in `type: 'service' | 'activity' | 'resource'` format. Need to verify the booking payload correctly maps to the backend's expected fields.
**Assign to:** Phase 3

---

### ISSUE-7 — Events GET/ALL requires staff auth but AdminView loads it without staff token  [LOW]
**Impact:** AdminView uses `GET /api/events/all` (staff-only) for the admin events tab. Admin users have staff tokens so this should work. But the public `GET /api/events` doesn't require auth and the HomeView uses it — this is fine.
**Status:** OK.

---

## What's Actually Missing (No Endpoint)

| Frontend Feature | Missing Backend Endpoint |
|---|---|
| Admin: Membresías search | `GET /api/admin/members?search=X` — check admin.routes.ts |
| Admin: Finanzas | `GET /api/admin/charges` etc. — check admin.routes.ts |
| Admin: KPI dashboard | `GET /api/admin/stats` — check admin.routes.ts |
| Mark appointment status | `POST /api/staff/appointments/:id/status` — not found |

---

## Seed Status

**`prisma/seed.ts` exists** — loads from `prisma/data/*.json` files. Data files not confirmed to exist. The seed creates:
- Units (Hermes, etc.)
- Activities with schedules
- Services (spa, barbería, etc.)
- Staff members (with dev password 'staff123')
- Memberships + profiles (titulares, conyugues, hijos)

**Must verify:** Do `prisma/data/*.json` files exist in the repo? If not, manual seed SQL or inline seed data is needed.

---

## Next Steps (Priority Order)

1. Check `prisma/data/` directory for JSON seed files
2. Check `admin.routes.ts` for what endpoints exist
3. Fix ISSUE-2 (suspended member 403) in `api.ts`
4. Fix ISSUE-3 (admin role guard) in `App.tsx`
5. Run seed on Railway DB
6. Test end-to-end auth flow
