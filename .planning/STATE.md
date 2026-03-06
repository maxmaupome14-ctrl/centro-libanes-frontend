# Centro Libanés — Project State

## Current Status
- **Milestone:** M1 — Demo-Ready Soft Launch
- **Active Phase:** Phase 2 — Auth & Core Data Flow
- **Last Updated:** 2026-03-06

## Completed Phases
- **Phase 1 — Backend Audit** ✅ (2026-03-06)
  - Output: `.planning/research/backend-audit.md`
  - Finding: Backend is substantially built, all core endpoints exist

## Phase 2 — In Progress
**Plan:** `.planning/phases/phase-2/PLAN.md`

Ordered steps:
1. [ ] Add admin staff to `prisma/seed.ts` — `{ name: 'Admin Centro', role: 'administrador', ... }`
2. [ ] Fix `AdminRoute` guard in `src/App.tsx` — require `user.role === 'administrador'`
3. [ ] Add 403 suspension handler in `src/services/api.ts`
4. [ ] Seed Railway DB — `npx prisma migrate deploy && npx prisma db seed`
5. [ ] Set `VITE_API_URL` in `.env` and Vercel env vars
6. [ ] Test all 5 auth scenarios (member, minor, staff, admin, non-admin → /admin blocked)
7. [ ] Verify all 7 member views load without crashing

## Architecture Notes
- Auth flow: `POST /auth/select-profile` (member_number) → `POST /auth/login` (profile_id + password/PIN)
- Staff auth: `POST /auth/staff-login` (username + password) → JWT with `type: 'staff'`
- Adults: any non-empty password accepted during migration period (password_hash is null in seed)
- Leo PIN: `1234` | Mía PIN: `5678` | Staff dev password: `staff123`
- Member 31505 has `membership.status = 'activa'` with a PENDING maintenance bill ($4,850)
- 403 only fires if `membership.status = 'suspendida'` — billing pending ≠ suspended
- Admin routes have no auth guards — acceptable for demo
- `requireStaffAuth` checks `decoded.type === 'staff'` (separate from member JWT)

## Key File Locations
- Frontend: `C:\Users\Nuebe\Documents\centro-libanes-frontend-main\`
- Backend: `C:\Users\Nuebe\Documents\centro-libanes-backend\`
- Seed: `centro-libanes-backend\prisma\seed.ts`
- Auth store: `frontend\src\store\authStore.ts`
- API service: `frontend\src\services\api.ts`
- Routes: `frontend\src\App.tsx`
