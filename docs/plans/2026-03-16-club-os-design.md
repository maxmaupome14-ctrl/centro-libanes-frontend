# Club Operating System — Design Vision

**Date:** 2026-03-16
**Status:** Draft — brainstorming output, pending validation

---

## The Core Thesis

Centro Libanés runs on paper, phone calls, and palm scanners. The app doesn't replace any of that — it becomes the **operating system** the club can't function without. Every transaction, every booking, every access event flows through the app. Once it's embedded, removing it would mean going back to chaos.

## Three Layers

### Layer 1: The Wallet (Estado de Cuenta)

**What it does:** Every charge the club generates — membership fees, locker rentals, parking, guest passes, maintenance fees, tournament entries, service bookings — lives in one place. Members see their balance. Cashiers at kiosks confirm payments through the app.

**Why it hooks them:**
- Members stop calling the front desk to ask "what do I owe?"
- Cashiers get a digital confirmation flow instead of handwritten receipts
- Club management gets real-time financial visibility for the first time
- The parking guy (Max's friend) scans a QR or taps a button instead of writing license plates on paper — keeps his job, digitizes his workflow

**Revenue model:** The club already collects these fees. The app just makes the money flow visible and trackable. No new charges — just transparency that creates dependency.

### Layer 2: The Marketplace

**What it does:** Independent service providers (barbers, masajistas) use the app as their booking + payment platform. Members book and pay through the app. The club takes a commission on every transaction.

**Why it hooks them:**
- Barbers/masajistas get a steady stream of bookings without managing their own scheduling
- Members get convenience (no more calling/texting barbers directly)
- Club earns commission on revenue that currently bypasses them entirely
- Staff management: admin assigns which employees work which services
- Rating system creates accountability and quality competition

**Revenue model:** Commission on service transactions. Currently these providers charge clients directly and the club may or may not see a cut. The app formalizes this.

### Layer 3: The Gatekeeper

**What it does:** Nothing happens at the club without the app knowing. Guest passes require app approval. Locker assignments go through the app. Tournament registration is app-only. New member onboarding starts in the app.

**Why it hooks them:**
- Guest passes: 3/month included, tracked digitally, no more paper guest lists
- Access backup: QR code when the palm scanner fails (doesn't replace the turnstile, just backs it up)
- Controlled onboarding: new members, family additions, girlfriend/concubina additions (requires documentation for non-family)
- Tournament management: registration, brackets, results — all in-app
- Waitlist system for popular time slots

**Revenue model:** Guest passes beyond the 3/month limit could be premium. Tournament entry fees flow through the app. Every controlled access point is a potential monetization point.

---

## Membership Tiers (Current Club Structure)

| Tier | Description |
|------|-------------|
| Individual | Single member |
| Familiar | Family membership (titular + dependents) |
| Single-club | Access to one sede only (Hermes OR Fredy Atala) |
| Multi-club | Access to both sedes |
| Patronal | Premium/founding member tier |

**Key rule:** One monthly payment, made by the titular (main account holder). Family members are dependents under the titular's account.

## What We Don't Touch

- **Palm-scanning turnstile** — works fine, QR is backup only
- **Restaurant** — separate operator, out of scope
- **The ladies at the kiosks** — they keep their jobs, the app just gives them a screen to confirm payments
- **Parking guy** — keeps his job, gets a digital tool

## What Makes This a Million Dollar App

The club becomes **operationally dependent** on the app within 3 months:
1. **Month 1:** Wallet + booking system live. Members start checking balances and booking services.
2. **Month 2:** All service providers onboarded. Commission tracking starts. Admin panel becomes the management hub.
3. **Month 3:** Guest passes, tournaments, waitlists all app-only. There's no going back.

The app isn't a nice-to-have — it becomes the infrastructure. The club literally cannot operate without it.

---

## Implementation Priority (Next Steps)

1. **Staff-service assignment in admin** — admin can assign employees to their sections (building now)
2. **Estado de Cuenta (Wallet)** — member balance view, payment history, pending charges
3. **Cashier confirmation flow** — kiosk staff confirms payments via the app
4. **Commission tracking** — track and report on marketplace commissions
5. **QR access backup** — generate member QR codes for turnstile fallback
6. **Enhanced guest pass flow** — digital approval + tracking for front desk
