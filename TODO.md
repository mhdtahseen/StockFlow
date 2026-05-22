# Finventree — Pending Features & Tasks

> Last updated: 22 May 2026 · Version: v2.7

---

## 🔴 Active: Push Notifications (Firebase / FCM)

Client hook, token registration, and Supabase infra are ready. Remaining steps:

- [ ] Create Firebase project at console.firebase.google.com
- [ ] Add Android app (`com.hyllos.finventree`) → download `google-services.json` → `apps/app/android/app/`
- [ ] Add iOS app (`com.hyllos.finventree`) → download `GoogleService-Info.plist` → `apps/app/ios/App/App/`
- [ ] Upload APNs auth key (`.p8`) to Firebase → Settings → Cloud Messaging → APNs
- [ ] Create Supabase edge function `send-push-native` — calls FCM HTTP v1 API with stored tokens
- [ ] Wire DB triggers (phone sold, role changed, payment received) to invoke edge function
- [ ] Test end-to-end on Android emulator + real iOS device

---

## 🔴 Active: Infrastructure

- [ ] **Bottom safe-area gap** (Android black strip + iOS inconsistency) — see notes at bottom of this file
- [ ] Android/iOS native build CI pipeline (Capacitor)
- [ ] Offline sync conflict resolution improvements
- [ ] Shared package (`packages/shared`) — export subscription/feature-flag TypeScript interfaces
- [ ] Soft delete on phones + orders (`deleted_at` column + RLS filtering) — customers already done

---

## 🔴 Active: App Improvements

- [ ] Real-time feature flag sync (Supabase Realtime on `feature_flags` instead of 15-min poll)
- [ ] Dynamic tier control from DB (admin changes tier mappings without frontend deploy)
- [ ] iOS camera permission string — update to mention QR scanning (currently only says IMEI)
- [ ] PostHog activation events (`activation.first_phone`, `first_order`, `first_payment`)
- [ ] PostHog surveys — NPS after 10th order; churn survey for dormant users
- [ ] Multi-language / i18n support

---

## 🔴 Active: Admin Panel

- [ ] **Pricing page rewrite** — replace free-text `subscription_plans.features` with structured 17 gate-key toggle grid synced to DB
- [ ] **Supervision UI** — search/filter, plan quotas (seats/phones), per-tenant feature access view, pagination, visual polish
- [ ] **Flags ↔ Pricing coherence** — pricing page shows killed flags (red strikethrough) when `enabled_globally = false`
- [ ] Remove `"free"` from `PLAN_OPTIONS` in supervision page (deprecated plan)

---

## 🟡 Backlog: Unbuilt Feature Gates

| Key | Tier | Description |
|-----|------|-------------|
| `bulk_invoice` | Enterprise | Multi-order batch PDF generation |
| `customer_pnl` | Pro+ | Per-customer P&L section (gate key exists, no UI) |
| `flow_repair` | Repair+ | Repair flow routing + nav |
| `flow_trade` | Starter+ | Trade flow routing (default) |
| `external_repair` | Pro+ | Send phone to external shop, `OUT_FOR_REPAIR` tracking |
| `phone_repair_link` | Hybrid/Enterprise | Link phone to repair ticket for COGS auto-update |
| `trade_network` V2 | Enterprise | IMEI lookup, push consent, realtime sync (Phase 1-3 shipped; V2 not started) |

---

## 🟡 Backlog: Repair Module

> Full spec: [docs/BRD_REPAIR_MODULE.md](docs/BRD_REPAIR_MODULE.md) · Version 1.1
> Estimated: ~12-13 weeks across 9 phases

### Phase 1 — Flow Gating & Routing
- [ ] Add `flow_trade` / `flow_repair` feature gates to `FEATURE_GATES` in `usePlan.ts`
- [ ] Tenant onboarding: new `flow` field selection (trade / repair / hybrid)
- [ ] Conditional bottom nav (Repair nav vs Trade nav) based on `usePlan('flow_repair')`
- [ ] Route guard for `/repairs/*` requiring `flow_repair`

### Phase 2 — Repair Ticket Core
- [ ] `RepairTicket` + `RepairIssue` + `RepairEvent` TypeScript interfaces (shared package)
- [ ] `repairsSlice` — CRUD actions for tickets, issues, events + Supabase sync middleware
- [ ] `NewRepairTicketSheet.tsx` — intake form (customer, device, IMEI scan, issues, est. cost, ETA)
- [ ] `RepairTicketDetail.tsx` — timeline, status stepper, issue list, payment section
- [ ] `RepairTicketList.tsx` — kanban / list with status filters

### Phase 3 — Customer Tracking
- [ ] FR-006: Public tracking page (`/track/[token]`) via Supabase token-auth edge function
- [ ] `repair-public-status` edge function
- [ ] Share tracking link from ticket detail (copy + WhatsApp)
- [ ] `repair-ticket-status-notify` edge function (trigger on status change)

### Phase 4 — Repair Invoicing
- [ ] `RepairInvoice` generation (PDF via `window.print`)
- [ ] `repair-invoice-pdf` edge function (optional server-side)
- [ ] Partial payment + payment status tracking on ticket
- [ ] Ledger integration — `REPAIR_INCOME` + `REPAIR_PARTS_EXPENSE` entry types

### Phase 5 — Hybrid Bridge
- [ ] `phone_repair_link` feature gate — gated to `hybrid` + `enterprise`
- [ ] "Create Repair Ticket from Phone" action in phone detail (hybrid only)
- [ ] Repair cost → `externalRepairCost` → effective COGS update on ticket close
- [ ] Hybrid dashboard widget: phones in repair, pending tickets

### Phase 6 — Billing & Plans
- [ ] Add `repair`, `repair_pro`, `hybrid` plan IDs to Razorpay + DB `subscription_plans`
- [ ] Admin pricing page: add 3 new plan rows with gate toggles
- [ ] Update `FEATURE_GATES` with `flow_repair`, `repair_cogs`, `phone_repair_link`

### Phase 7 — External Repair Tracking V1
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

### Phase 8 — Dashboard & Polish
- [ ] Repair dashboard (daily revenue, ticket counts, avg TAT, overdue)
- [ ] Hybrid dashboard (inventory value, phones in repair, pending tickets)
- [ ] Overdue dashboard widget: phones past expected return date
- [ ] Onboarding flow for new repair tenants

### Phase 9 — Trade Network V2
- [ ] `trade-network-imei-lookup` edge function — cross-tenant IMEI check on ticket create
- [ ] `trade-network-link-notify` edge function — push notification to trader on link offer
- [ ] Consent flow UI (trader accept/reject link from push notification)
- [ ] Realtime status sync (Supabase Realtime channel per linked pair)
- [ ] Auto-COGS fill on repair ticket invoiced
- [ ] Privacy audit — no cross-tenant data leaks beyond approved fields

---

## ⚪ Deferred / Low Priority

- [ ] Framer-motion page transitions (+20KB bundle)
- [ ] Skeleton loading states (requires `isSyncing` from `useOfflineSyncManager`)
- [ ] Pull-to-refresh native gesture
- [ ] Multi-Tenant Security Audit (Final RLS verification)
- [ ] Performance & PWA hardening

---

## 📝 Safe-Area Fix Notes

**Symptoms**: Android — black gap below bottom nav; iOS — extra white space at bottom.
**Root cause**: `env(safe-area-inset-bottom)` returns 0 on Android WebView < v140; `StatusBar.overlaysWebView` deprecated on Android 15+.
**Fix**: Capacitor 8 `SystemBars` API (`insetsHandling: 'css'`).

Files to change:
- `apps/app/capacitor.config.ts` — add `SystemBars: { insetsHandling: 'css', style: 'LIGHT' }`, remove deprecated `StatusBar.overlaysWebView` + `StatusBar.backgroundColor`
- `apps/app/src/context/ThemeContext.tsx` — replace `StatusBar.setBackgroundColor/setStyle` with `SystemBars.setStyle({ style: isDark ? SystemBarsStyle.Dark : SystemBarsStyle.Light })`
- `apps/app/src/components/layout/AppHeader.tsx` — `py-3` → `pb-3 pt-[calc(0.75rem+var(--safe-area-inset-top,env(safe-area-inset-top,0px)))]`
- `apps/app/src/components/layout/AppDrawer.tsx` — same top safe-area on drawer header
- `apps/app/src/components/layout/BottomNav.tsx` — `env(safe-area-inset-bottom,0px)` → `var(--safe-area-inset-bottom,env(safe-area-inset-bottom,0px))`
- `apps/app/android/app/src/main/res/values/styles.xml` — add `android:navigationBarColor=#FFFFFF` + `android:windowLightNavigationBar=true`
- Create `apps/app/android/app/src/main/res/values-night/styles.xml` — dark nav bar variant (`#0F172A` + `windowLightNavigationBar=false`)
