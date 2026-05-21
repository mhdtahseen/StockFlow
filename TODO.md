# StockFlow — Pending Features & Tasks

> Last updated: 22 May 2026

---

## Repair Module (BRD: `docs/BRD_REPAIR_MODULE.md`)

> Full spec in [docs/BRD_REPAIR_MODULE.md](docs/BRD_REPAIR_MODULE.md) · Version 1.1

### Phase 1 — Flow Gating & Routing (Week 1)
- [ ] Add `flow_trade` / `flow_repair` feature gates to `FEATURE_GATES` in `usePlan.ts`
- [ ] Tenant onboarding: new `flow` field selection (trade / repair / hybrid)
- [ ] Conditional bottom nav (Repair nav vs Trade nav) based on `usePlan('flow_repair')`
- [ ] Route guard for `/repairs/*` requiring `flow_repair`

### Phase 2 — Repair Ticket Core (Week 2-3)
- [ ] `RepairTicket` + `RepairIssue` + `RepairEvent` TypeScript interfaces (shared package)
- [ ] `repairsSlice` — CRUD actions for tickets, issues, events + Supabase sync middleware
- [ ] `NewRepairTicketSheet.tsx` — intake form (customer, device, IMEI scan, issues, est. cost, ETA)
- [ ] `RepairTicketDetail.tsx` — timeline, status stepper, issue list, payment section
- [ ] `RepairTicketList.tsx` — kanban / list with status filters

### Phase 3 — Customer Tracking (Week 4)
- [ ] FR-006: Public tracking page (`/track/[token]`) via Supabase token-auth edge function
- [ ] `repair-public-status` edge function
- [ ] Share tracking link from ticket detail (copy + WhatsApp)
- [ ] `repair-ticket-status-notify` edge function (trigger on status change)

### Phase 4 — Repair Invoicing (Week 5-6)
- [ ] `RepairInvoice` generation (PDF via `window.print`)
- [ ] `repair-invoice-pdf` edge function (optional server-side)
- [ ] Partial payment + payment status tracking on ticket
- [ ] Ledger integration — `REPAIR_INCOME` + `REPAIR_PARTS_EXPENSE` entry types

### Phase 5 — Hybrid Bridge (Week 7-8)
- [ ] `phone_repair_link` feature gate — gated to `hybrid` + `enterprise`
- [ ] "Create Repair Ticket from Phone" action in phone detail (hybrid only)
- [ ] Repair cost → `externalRepairCost` → effective COGS update on ticket close
- [ ] Hybrid dashboard widget: phones in repair, pending tickets

### Phase 6 — Billing & Plans (Week 9)
- [ ] Add `repair`, `repair_pro`, `hybrid` plan IDs to Razorpay + DB `subscription_plans`
- [ ] Admin pricing page: add 3 new plan rows with gate toggles
- [ ] Update `FEATURE_GATES` with `flow_repair`, `repair_cogs`, `phone_repair_link`

### Phase 7 — External Repair Tracking V1 (Week 10-12)
- [ ] Add `OUT_FOR_REPAIR` to `PhoneStatus` enum
- [ ] `sendToExternalRepair` + `markExternalRepairReturned` actions in inventory slice
- [ ] `SendToExternalRepairSheet.tsx` — shop name, issues, cost, ETA, tracking URL
- [ ] `MarkRepairReturnedSheet.tsx` — actual cost, notes, date
- [ ] Phone detail: external repair card + Track button + Mark Returned
- [ ] Inventory list: `OUT_FOR_REPAIR` badge + filter
- [ ] Block SO creation for `OUT_FOR_REPAIR` phones
- [ ] Dashboard widget: "X phones out for repair"
- [ ] `external_repair_records` Supabase migration + RLS (`docs/BRD_REPAIR_MODULE.md §7.3`)
- [ ] `external_repair` feature gate — gated to `pro`, `hybrid`, `enterprise`

### Phase 8 — Dashboard & Polish (Week 12-13)
- [ ] Repair dashboard (daily revenue, ticket counts, avg TAT, overdue)
- [ ] Hybrid dashboard (inventory value, phones in repair, pending tickets)
- [ ] Overdue dashboard widget: phones past expected return date
- [ ] Onboarding flow for new repair tenants

### Phase 9 — Trade Network V2 (Future)
- [ ] `trade-network-imei-lookup` edge function — cross-tenant IMEI check on ticket create
- [ ] `trade-network-link-notify` edge function — push notification to trader on link offer
- [ ] Consent flow UI (trader accept/reject link from push notification)
- [ ] Realtime status sync (Supabase Realtime channel per linked pair)
- [ ] Auto-COGS fill on repair ticket invoiced
- [ ] Privacy audit — no cross-tenant data leaks beyond approved fields
- [ ] `trade_network` feature gate — enterprise only

---

## Unbuilt Feature Gate Keys

| Key | Tier | Description | Status |
|-----|------|-------------|--------|
| `bulk_invoice` | Enterprise | Multi-order batch PDF generation | Not started |
| `trade_network` | Enterprise | Cross-tenant repair sync (Trade Network V2) | Gate exists, feature not built |
| `customer_pnl` | Pro+ | Per-customer P&L section | Gate key exists, no UI surface yet |
| `flow_repair` | Repair+ | Repair flow routing + nav | Not started |
| `flow_trade` | Starter+ | Trade flow routing (default) | Not started |
| `external_repair` | Pro+ | Send phone to external shop, OUT_FOR_REPAIR tracking | Not started |
| `phone_repair_link` | Hybrid/Enterprise | Link phone to repair ticket for COGS auto-update | Not started |

---

## Push Notifications (Firebase / FCM)

Client hook and Supabase infra are ready. Remaining steps:

- [ ] Create Firebase project at console.firebase.google.com
- [ ] Add Android app (`com.hyllos.finventree`) → download `google-services.json` → `apps/app/android/app/`
- [ ] Add iOS app (`com.hyllos.finventree`) → download `GoogleService-Info.plist` → `apps/app/ios/App/App/`
- [ ] Upload APNs auth key (`.p8`) to Firebase → Settings → Cloud Messaging → APNs
- [ ] Create Supabase edge function `send-push-native` — calls FCM HTTP v1 API with stored tokens
- [ ] Wire DB triggers (phone sold, role changed, payment received) to invoke edge function
- [ ] Test end-to-end on Android emulator + real iOS device

**Already done:**
- [x] `@capacitor/push-notifications` installed + configured in `capacitor.config.ts`
- [x] `usePushNotifications.ts` hook — registers native FCM/APNs tokens + web VAPID
- [x] `user_push_subscriptions` table + upsert on registration
- [x] `send-push-broadcast` edge function (web push via VAPID only)
- [x] `notifications` table + `notify_admin_on_phone_sale()` DB trigger

---

## Admin Panel

- [ ] **Pricing page rewrite** — replace free-text `subscription_plans.features` with structured 17 gate-key toggle grid synced to DB
- [ ] **Supervision UI refinement** — search/filter, plan quotas (seats/phones), per-tenant feature access view, pagination, visual polish
- [ ] **Flags ↔ Pricing coherence** — pricing page shows killed flags (red strikethrough) when `enabled_globally = false`
- [ ] Remove `"free"` from `PLAN_OPTIONS` in supervision page (deprecated plan)

---

## Infrastructure

- [x] ~~Payment integration (Razorpay)~~ — plans synced, subscription flow + 6-month trial working
- [ ] Push notification server-side triggers — **see Firebase section above**
- [ ] Offline sync conflict resolution improvements
- [ ] Android/iOS native build CI pipeline (Capacitor)
- [ ] Shared package (`packages/shared`) — export subscription/feature-flag TypeScript interfaces
- [ ] Soft delete on customers, phones, orders (`deleted_at` column + RLS filtering)

---

## Analytics (PostHog)

- [x] SDK integrated — autocapture OFF, 10% session recording sample
- [x] `posthog.identify()` on sign-in (email, role, tenant_id); `reset()` on sign-out
- [x] `$pageview` on every route change via `PageViewTracker`
- [x] `phone.added/deleted`, `order.created`, `payment.logged` (in/out), `customer.added/deleted`
- [x] `imei.scanned`, `invoice.generated`, `share_link.created`
- [x] `order.settled` when payment status → SETTLED
- [x] `sync.failed` with action + error code on every Supabase sync failure
- [x] `upgrade_gate.hit` with feature key on every upgrade modal trigger
- [ ] Activation events (`activation.first_phone`, `first_order`, `first_payment`)
- [ ] PostHog surveys — NPS after 10th order; churn survey for dormant users

---

## App Improvements

- [ ] Real-time feature flag sync (Supabase realtime on `feature_flags` instead of 15-min poll)
- [ ] Dynamic tier control from DB (admin changes tier mappings without frontend deploy)
- [x] ~~Onboarding wizard for new tenants~~ — 3-step setup form (business name, first phone, first team member)
- [ ] Multi-language / i18n support

---

## Completed (Recent)

- [x] PostHog analytics integration (full event pipeline + session recording)
- [x] Cloudflare Pages deploy for web app (`finventree-web`)
- [x] 6-month trial period (approve-tenant + razorpay-create-subscription)
- [x] Extend Trial button in admin supervision panel
- [x] Razorpay plan IDs synced to DB (6 plans)
- [x] Auth handoff — seamless app → web token exchange via edge function
- [x] FeatureGate component: `hidden` + `badge` modes with pointer-intercept overlay
- [x] BatchAddSheet gate (`bulk_orders` checked at `addRow()`)
- [x] Device cap enforced (`unlimited_phones` — Starter capped at 100 devices)
- [x] Seat limit enforced (`unlimited_seats` — Starter 1, Pro 10, Enterprise unlimited)
- [x] Receivables/credit gate (FeatureGate badge on AR/AP balance cards)
- [x] AppDrawer — amber PRO pill badge on locked nav items
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
- [x] **Onboarding flow** — `Onboarding.tsx` 3-step setup form (business name, first phone, first team member invite); `OnboardingGate` in `App.tsx`; `onboarding_completed_at` column in `profiles`; DB migration applied to production
- [x] **FeatureTour** — 10-slide modal with mobile PWA-style screen mockups (AppHeader + content + BottomNav chrome); `finventree_feature_tour_shown` localStorage gate; PostHog tracking
- [x] **CoachMarks** — react-joyride v3 step highlights on Dashboard metrics, + FAB, and hamburger menu icon; custom `CoachTip` tooltip with progress dots; fires after FeatureTour completes; custom event bridge so coach marks appear immediately when FeatureTour is dismissed mid-way
- [x] **Bottom nav redesign** — changed from Dashboard / + / Menu to **Dashboard / + / Inventory**; hamburger moved exclusively to AppHeader
- [x] Developer reset button in Profile page (clears both onboarding localStorage keys + nulls `onboarding_completed_at` in DB)
