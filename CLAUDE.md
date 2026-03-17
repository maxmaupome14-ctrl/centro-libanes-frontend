# Centro Libanés — Claude Code Instructions

## Stack
- React 19 + TypeScript + Vite + Tailwind CSS v4 + Framer Motion 12 + Zustand + Capacitor 8
- Backend: Node.js + Express + Prisma ORM + PostgreSQL + Stripe + JWT auth
- Backend path: `C:\Users\Nuebe\Documents\centro-libanes-backend`

## CRITICAL: Tailwind v4 HMR Constraint
Tailwind v4 HMR does NOT reliably compile utility classes. ALL layout/spacing MUST use inline `style={{}}` objects.

**Only safe classNames**: `card`, `card-elevated`, `card-interactive`, `section-header`, `glass`, `menu-row`, `animate-pulse`, `animate-spin`, `animate-ping`, `scrollbar-none`, `tap-feedback`, `app-container`

## Design System
- Dark mode primary: muted luxury (#0F1419 bg, #1A1F26 surfaces, gold #C9A84C accents for premium moments only)
- App width constraint: maxWidth 430px
- Font: Outfit (body) + Playfair Display (display)
- Spacing rhythm: 24px between sections, 16px horizontal padding, 8px grid
- Card radii: 16-20px, button radii: 12px
- All interactive elements need `touchAction: 'manipulation'` and `cursor: 'pointer'`

## Toast API
`const { showToast } = useToast()` — NOT `toast.show()`. Import from `../components/ui/Toast`.

## Code Splitting
Secondary views are lazy-loaded via `React.lazy()` in App.tsx. Primary nav views (Home, Catalog, Family, Profile) are eagerly loaded.

## Guest Pass System
- 3 passes per month included with membership
- When limit reached, show "Solicitar más pases" button that opens mailto to admin
- Backend enforces limit in `guest.routes.ts`
