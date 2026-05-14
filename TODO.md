# StockFlow — Pending Features & Tasks

> Last updated: 15 May 2026

---

## Unbuilt Feature Gate Keys

| Key | Tier | Description | Status |
|-----|------|-------------|--------|
| `bulk_invoice` | Enterprise | Multi-order batch PDF generation | Not started |
| `trade_network` | Enterprise | Dealer-to-dealer stock transfer | Not started |

---

## Feature Gates — No Widget-Level Enforcement

These gate keys exist in `FEATURE_GATES` and the DB, but lack granular UI enforcement beyond route-level guards.

| Key | Tier | Current Coverage | Needed |
|-----|------|-----------------|--------|
| `credit_tracking` | Pro+ | /ledger route guard only | Widget-level gating inside ledger |
| `receivables` | Pro+ | /ledger route guard only | Widget-level gating inside ledger |
| `customer_pnl` | Pro+ | /customers (starter feature) | Per-customer P&L section gating |

---

## Admin Panel

- [ ] **Pricing page rewrite** — replace free-text `subscription_plans.features` with structured 17 gate-key toggle grid synced to DB
- [ ] **Supervision UI refinement** — search/filter, plan quotas (seats/phones), per-tenant feature access view, pagination, visual polish
- [ ] **Flags ↔ Pricing coherence** — pricing page shows killed flags (red strikethrough) when `enabled_globally = false`
- [ ] Remove `"free"` from `PLAN_OPTIONS` in supervision page (deprecated plan)

---

## Infrastructure

- [ ] Payment integration (Razorpay/Stripe) — no checkout flow; upgrades point to external URL
- [ ] Push notification server-side triggers (only client hook `usePushNotifications` exists)
- [ ] Offline sync conflict resolution improvements
- [ ] Android/iOS native build CI pipeline (Capacitor)
- [ ] Shared package (`packages/shared`) — export subscription/feature-flag TypeScript interfaces

---

## App Improvements

- [ ] Real-time feature flag sync (Supabase realtime on `feature_flags` instead of 15-min poll)
- [ ] Dynamic tier control from DB (admin changes tier mappings without frontend deploy)
- [ ] Onboarding wizard for new tenants
- [ ] Multi-language / i18n support

---

## Completed (Recent)

- [x] Feature gate system redesign (Option B: layered DB flags + frontend tier mapping)
- [x] UpgradeModal replaces in-app /pricing redirects
- [x] Route-level guards (`GatedRoute` on /ledger, /analytics)
- [x] Dashboard navigation gating (wallet, purchases, sales, analytics cards)
- [x] Nav sidebar/drawer lock → showUpgrade modal
- [x] IMEI scanner gating (ImeiSection)
- [x] Catalog autofill gating (useDeviceCatalog hook)
- [x] Public sharing gating (OrderDetail, CustomerDetail)
- [x] Bulk orders / trade network gating (CreateOrderSheet)
- [x] DB migration: tier redesign, RLS policies, feature_flags seeding
- [x] Admin login page field-level validation
- [x] Admin panel expansion (financials, overdue, imei-lookup, shares pages)
- [x] PDF generation improvements (PrintableInvoice, window.print approach)
- [x] Loading spinners on share/download buttons
