# StockFlow MVP 2 — Antigravity Implementation Prompt

> **Version:** 4.0 (Final) | **Last updated:** March 2026
> **Companion:** `StockFlow_MVP2_BRD_v4.docx`
> **Supersedes:** v1.0, v2.0, v3.0

---

## ⚠️ MANDATORY RULES — READ BEFORE TOUCHING ANY FILE

Violating these rules produces bugs that are harder to fix than to prevent.

### Rule 1 — Offline-first is non-negotiable

Every new Redux slice must be in `persistConfig`. Every new action that mutates data must be in `trackablePrefixes` in `supabaseMiddleware.ts`. Every Supabase write goes through `syncActionToSupabase()`. Zero direct Supabase calls from components.

### Rule 2 — Four atomic RPCs are the financial backbone

`create_trade_order`, `create_purchase_order`, `record_customer_payment`, `record_supplier_payment`. Build and test each RPC in Supabase SQL editor before writing any Redux or UI code that calls it. Never split these into sequential JS awaits.

### Rule 3 — PHONE_SALE fires on cash collection only

PHONE_SALE = cash received. Not when an order is created on credit. Not when a debt is acknowledged. Only when money physically arrives. This rule is absolute and must be enforced in the RPCs.

### Rule 4 — Never modify existing slice interfaces

`inventory`, `ledger`, `masterData`, `sync` — frozen. Only add new FK columns to existing DB tables (phone_id, sale_order_id, purchase_order_id on ledger; sale_order_id, purchase_order_id on phones). Only add new slices.

### Rule 5 — Design system compliance

Brand blue: `#064a98`. Dark mode always paired. Cards: `bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800`. Sticky headers: `bg-white/80 dark:bg-slate-900/80 backdrop-blur-md`. Icons: Lucide only. Toasts: sonner only. See Section 0 for full reference.

### Rule 6 — Self-check before moving on

Every phase has a self-check section. Do not proceed to the next phase until every item in the self-check passes. Mark the tracker as you go.

### Rule 7 — Read existing code before writing new code

Before writing any component, read the most similar existing component. Before adding a Redux case, read `supabaseApi.ts`. Before adding a route, read `App.tsx`. Match patterns exactly.

---

## Section 0 — Design System Quick Reference

This is extracted from the existing codebase. Every new component follows this.

```
Brand blue:        #064a98  (bg-[#064a98], text-[#064a98])
Active nav:        text-[#064a98] dark:text-blue-400
Background:        bg-slate-50 dark:bg-slate-950
Card surface:      bg-white dark:bg-slate-900
Card border:       border border-slate-100 dark:border-slate-800
Card shadow:       shadow-sm dark:shadow-black/20
Sticky header:     bg-white/80 dark:bg-slate-900/80 backdrop-blur-md
Header padding:    pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-3
Safe area bottom:  pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]
Body padding:      h-[100dvh] overflow-hidden → main flex-1 overflow-y-auto pb-16
Status chip:       rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider
Transitions:       transition-colors duration-300
Separator:         border-b border-slate-100 dark:border-slate-800
Icon sizes:        22 nav / 20 card / 16 inline
Spacing:           p-4 cards | gap-3 flex rows | space-y-5 sections
Font:              font-sans antialiased (system stack)
Conditionals:      clsx() only — no string interpolation
Toasts:            toast.success(...) / toast.error(...) from sonner
```

**Status colour map (matches existing):**

```
OPEN:       amber-50/amber-700 dark:amber-950/amber-400
PARTIAL:    blue-50/[#064a98] dark:blue-950/blue-400
SETTLED:    emerald-50/emerald-700 dark:emerald-950/emerald-400
RETURNED:   rose-50/rose-700 dark:rose-950/rose-400
PENDING:    amber-50/amber-700 (same as OPEN for purchase orders)
RECEIVED:   blue-50/[#064a98] (same as IN_STOCK)
```

---

## 📋 Master Progress Tracker

Mark ✅ DONE only after self-check passes. Never mark in-progress as done.

| ID                             | Phase | Task                                                                          | Status |
| ------------------------------ | ----- | ----------------------------------------------------------------------------- | ------ |
| **PHASE 1 — DATABASE**         |       |                                                                               |        |
| P1-1                           | DB    | ALTER `ledger` — add phone_id, sale_order_id, purchase_order_id, payment_mode | ⬜     |
| P1-2                           | DB    | ALTER `phones` — add sale_order_id, purchase_order_id                         | ⬜     |
| P1-3                           | DB    | ALTER `tenants` — add plan, plan_expires_at                                   | ⬜     |
| P1-4                           | DB    | CREATE `counterparties` + indexes + RLS                                       | ⬜     |
| P1-5                           | DB    | CREATE `sale_orders` + indexes + RLS                                          | ⬜     |
| P1-6                           | DB    | CREATE `sale_order_items` + indexes + RLS                                     | ⬜     |
| P1-7                           | DB    | CREATE `purchase_orders` + indexes + RLS                                      | ⬜     |
| P1-8                           | DB    | CREATE `purchase_order_items` + indexes + RLS                                 | ⬜     |
| P1-9                           | DB    | CREATE `customer_payments` + indexes + RLS                                    | ⬜     |
| P1-10                          | DB    | CREATE `payment_allocations` + indexes + RLS                                  | ⬜     |
| P1-11                          | DB    | CREATE `supplier_payments` + indexes + RLS                                    | ⬜     |
| P1-12                          | DB    | CREATE `supplier_allocations` + indexes + RLS                                 | ⬜     |
| P1-13                          | DB    | CREATE helper functions (get_tenant_plan, get_tenant_member_count)            | ⬜     |
| P1-14                          | DB    | CREATE RPC `create_trade_order`                                               | ⬜     |
| P1-15                          | DB    | CREATE RPC `create_purchase_order`                                            | ⬜     |
| P1-16                          | DB    | CREATE RPC `record_customer_payment`                                          | ⬜     |
| P1-17                          | DB    | CREATE RPC `record_supplier_payment`                                          | ⬜     |
| P1-18                          | DB    | RLS: Starter phone limit (200 cap)                                            | ⬜     |
| P1-19                          | DB    | RLS: Staff seat limits (profiles INSERT policy)                               | ⬜     |
| P1-20                          | DB    | pg_cron: trial expiry job                                                     | ⬜     |
| P1-CHECK                       | —     | **Phase 1 self-check**                                                        | ⬜     |
| **PHASE 2 — STATE**            |       |                                                                               |        |
| P2-1                           | State | `src/features/billing/types.ts`                                               | ⬜     |
| P2-2                           | State | `src/features/billing/slice.ts`                                               | ⬜     |
| P2-3                           | State | `src/features/billing/selectors.ts`                                           | ⬜     |
| P2-4                           | State | `src/features/purchasing/types.ts`                                            | ⬜     |
| P2-5                           | State | `src/features/purchasing/slice.ts`                                            | ⬜     |
| P2-6                           | State | `src/features/purchasing/selectors.ts`                                        | ⬜     |
| P2-7                           | State | `src/features/customers/types.ts`                                             | ⬜     |
| P2-8                           | State | `src/features/customers/slice.ts`                                             | ⬜     |
| P2-9                           | State | `src/features/customers/selectors.ts`                                         | ⬜     |
| P2-10                          | State | `src/app/store.ts` — add 3 slices + version: 2                                | ⬜     |
| P2-11                          | State | `src/app/supabaseMiddleware.ts` — update trackablePrefixes                    | ⬜     |
| P2-12                          | State | `src/app/supabaseApi.ts` — add all new action cases                           | ⬜     |
| P2-13                          | State | `src/app/useOfflineSyncManager.ts` — add hydration for 5 new datasets         | ⬜     |
| P2-14                          | State | `src/context/AuthContext.tsx` — add tenant with plan + 15min poll             | ⬜     |
| P2-15                          | State | `src/features/analytics/selectors.ts` — dual-path rewrite                     | ⬜     |
| P2-CHECK                       | —     | **Phase 2 self-check**                                                        | ⬜     |
| **PHASE 3 — NAVIGATION**       |       |                                                                               |        |
| P3-1                           | Nav   | `src/components/layout/AppDrawer.tsx`                                         | ⬜     |
| P3-2                           | Nav   | `src/components/layout/BottomNav.tsx` — refactor to 3 items                   | ⬜     |
| P3-3                           | Nav   | `src/components/layout/AppLayout.tsx` — drawer integration                    | ⬜     |
| P3-4                           | Nav   | `src/App.tsx` — add all new routes                                            | ⬜     |
| P3-5                           | Gates | `src/hooks/usePlan.ts`                                                        | ⬜     |
| P3-6                           | Gates | `src/components/shared/FeatureGate.tsx`                                       | ⬜     |
| P3-7                           | Gates | `src/components/shared/UpgradePrompt.tsx`                                     | ⬜     |
| P3-8                           | Gates | `src/components/shared/TrialExpiredPaywall.tsx`                               | ⬜     |
| P3-9                           | Gates | Wrap IMEI scanner, bulk orders, PDF, tenant transfer                          | ⬜     |
| P3-CHECK                       | —     | **Phase 3 self-check**                                                        | ⬜     |
| **PHASE 4 — UI**               |       |                                                                               |        |
| P4-1                           | UI    | `src/components/ui/CustomerPicker.tsx`                                        | ✅     |
| P4-2                           | UI    | `src/components/shared/CreateOrderSheet.tsx`                                  | ✅     |
| P4-3                           | UI    | `src/components/shared/PhoneSelectorSheet.tsx`                                | ✅     |
| P4-4                           | UI    | `src/components/shared/BatchAddSheet.tsx` (PO batch add)                      | ✅     |
| P4-5                           | UI    | `src/components/shared/AllocationSheet.tsx`                                   | ✅     |
| P4-6                           | UI    | `src/components/shared/RecordPaymentSheet.tsx`                                | ✅     |
| P4-7                           | UI    | `src/components/shared/POConfirmSheet.tsx` (batch inspect/reject)             | ✅     |
| P4-8                           | UI    | Modify `src/pages/PhoneDetail.tsx` — replace sale modal                       | ✅     |
| P4-9                           | UI    | Modify `src/pages/Inventory.tsx` — multi-select mode                          | ✅     |
| P4-10                          | UI    | Modify `src/pages/AddPhone.tsx` — link to PO flow                             | ✅     |
| P4-11                          | UI    | `src/pages/Customers.tsx`                                                     | ✅     |
| P4-12                          | UI    | `src/pages/CustomerDetail.tsx` (3 tabs)                                       | ✅     |
| P4-13                          | UI    | `src/pages/Orders.tsx`                                                        | ✅     |
| P4-14                          | UI    | `src/pages/OrderDetail.tsx`                                                   | ✅     |
| P4-15                          | UI    | `src/pages/Financials.tsx` (renamed from Wallet)                              | ✅     |
| P4-16                          | UI    | `src/pages/LedgerPage.tsx` (raw ledger view)                                  | ✅     |
| P4-17                          | UI    | `src/pages/Pricing.tsx`                                                       | ✅     |
| P4-CHECK                       | —     | **Phase 4 self-check**                                                        | ✅     |
| **PHASE 5 — PDF + FINANCIALS** |       |                                                                               |        |
| P5-1                           | PDF   | `npm install jspdf jspdf-autotable`                                           | ⬜     |
| P5-2                           | PDF   | `src/utils/generateInvoice.ts`                                                | ⬜     |
| P5-3                           | PDF   | Wire Generate Invoice + Share in OrderDetail                                  | ⬜     |
| P5-4                           | Fin   | EOD reconciliation card in Financials                                         | ⬜     |
| P5-5                           | Fin   | AR summary card in Financials                                                 | ⬜     |
| P5-6                           | Fin   | AP summary card in Financials                                                 | ⬜     |
| P5-CHECK                       | —     | **Phase 5 self-check**                                                        | ⬜     |
| **PHASE 6 — SUBSCRIPTIONS**    |       |                                                                               |        |
| P6-1                           | Sub   | Razorpay plans created in dashboard (manual)                                  | ⬜     |
| P6-2                           | Sub   | `supabase/functions/handle-subscription/index.ts`                             | ⬜     |
| P6-3                           | Sub   | `/pricing` page with Razorpay checkout                                        | ⬜     |
| P6-4                           | Sub   | pg_cron trial expiry job (may overlap P1-20)                                  | ⬜     |
| P6-CHECK                       | —     | **Phase 6 self-check**                                                        | ⬜     |
| **PHASE 7 — QA**               |       |                                                                               |        |
| P7-1                           | QA    | Offline: trade order create + sync                                            | ⬜     |
| P7-2                           | QA    | Offline: purchase order + batch reject + sync                                 | ⬜     |
| P7-3                           | QA    | Offline: lump-sum payment + allocations + sync                                | ⬜     |
| P7-4                           | QA    | RBAC: Associate restrictions                                                  | ⬜     |
| P7-5                           | QA    | Plan gate bypass attempt (Redux DevTools)                                     | ⬜     |
| P7-6                           | QA    | Cross-tenant RLS isolation                                                    | ⬜     |
| P7-7                           | QA    | Return flow end-to-end                                                        | ⬜     |
| P7-8                           | QA    | Batch PO rejection flow                                                       | ⬜     |
| P7-9                           | QA    | PDF generation + share on Android + iOS                                       | ⬜     |
| P7-10                          | QA    | Razorpay webhook updates plan                                                 | ⬜     |
| P7-11                          | QA    | Analytics selectors: legacy + TO-based phones mixed                           | ⬜     |
| P7-12                          | QA    | EOD card correct values                                                       | ⬜     |
| P7-FINAL                       | —     | **MVP 2 acceptance complete**                                                 | ⬜     |

---

## Phase 1 — Database

File: `docs/schemas/005_mvp2_billing.sql`
Run each block in Supabase SQL editor. Verify in Table Editor before proceeding.

### P1-1: ALTER ledger

```sql
ALTER TABLE public.ledger
  ADD COLUMN IF NOT EXISTS phone_id UUID
    REFERENCES public.phones(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sale_order_id UUID,  -- FK added after sale_orders created
  ADD COLUMN IF NOT EXISTS purchase_order_id UUID, -- FK added after purchase_orders created
  ADD COLUMN IF NOT EXISTS payment_mode TEXT
    CHECK (payment_mode IN ('CASH','UPI','BANK_TRANSFER','CREDIT'));

-- Note: reference_id kept as-is. Stop writing to it for new entries.
-- New entries use phone_id / sale_order_id / purchase_order_id instead.
```

### P1-2: ALTER phones

```sql
ALTER TABLE public.phones
  ADD COLUMN IF NOT EXISTS sale_order_id UUID,     -- FK added after sale_orders created
  ADD COLUMN IF NOT EXISTS purchase_order_id UUID; -- FK added after purchase_orders created
```

### P1-3: ALTER tenants

```sql
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'trial'
    CHECK (plan IN ('trial','starter','pro','enterprise','expired')),
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;

-- Set all existing tenants to trial with 14-day window
UPDATE public.tenants
  SET plan_expires_at = now() + INTERVAL '14 days'
  WHERE plan = 'trial' AND plan_expires_at IS NULL;
```

### P1-4: counterparties

```sql
CREATE TABLE IF NOT EXISTS public.counterparties (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  type             TEXT NOT NULL
    CHECK (type IN ('CUSTOMER','RETAILER','ENTERPRISE','PLATFORM')),
  phone            TEXT,
  email            TEXT,
  platform_name    TEXT, -- populated only when type = PLATFORM
  linked_tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cp_tenant ON public.counterparties(tenant_id);
CREATE INDEX idx_cp_tenant_name ON public.counterparties(tenant_id, name);
ALTER TABLE public.counterparties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cp_select" ON public.counterparties FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "cp_insert" ON public.counterparties FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());
CREATE POLICY "cp_update" ON public.counterparties FOR UPDATE USING (tenant_id = get_user_tenant_id() AND get_user_role() IN ('admin','manager'));
CREATE POLICY "cp_delete" ON public.counterparties FOR DELETE USING (tenant_id = get_user_tenant_id() AND get_user_role() IN ('admin','manager'));
```

### P1-5: sale_orders

```sql
CREATE TABLE IF NOT EXISTS public.sale_orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  counterparty_id  UUID NOT NULL REFERENCES public.counterparties(id) ON DELETE RESTRICT,
  order_type       TEXT NOT NULL CHECK (order_type IN ('RETAIL','BULK','TRANSFER')),
  total_amount     NUMERIC(12,2) NOT NULL CHECK (total_amount > 0),
  amount_paid      NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  status           TEXT NOT NULL DEFAULT 'OPEN'
    CHECK (status IN ('OPEN','PARTIAL','SETTLED','RETURNED')),
  payment_mode     TEXT CHECK (payment_mode IN ('CASH','UPI','BANK_TRANSFER','CREDIT')),
  due_date         DATE,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_so_tenant ON public.sale_orders(tenant_id);
CREATE INDEX idx_so_cp ON public.sale_orders(counterparty_id);
CREATE INDEX idx_so_status ON public.sale_orders(tenant_id, status);
CREATE INDEX idx_so_created ON public.sale_orders(tenant_id, created_at DESC);
ALTER TABLE public.sale_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "so_select" ON public.sale_orders FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "so_insert" ON public.sale_orders FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());
CREATE POLICY "so_update" ON public.sale_orders FOR UPDATE USING (tenant_id = get_user_tenant_id());

-- Add FK now that sale_orders exists
ALTER TABLE public.ledger ADD CONSTRAINT fk_ledger_sale_order
  FOREIGN KEY (sale_order_id) REFERENCES public.sale_orders(id) ON DELETE SET NULL;
ALTER TABLE public.phones ADD CONSTRAINT fk_phones_sale_order
  FOREIGN KEY (sale_order_id) REFERENCES public.sale_orders(id) ON DELETE SET NULL;
```

### P1-6: sale_order_items

```sql
CREATE TABLE IF NOT EXISTS public.sale_order_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_order_id    UUID NOT NULL REFERENCES public.sale_orders(id) ON DELETE CASCADE,
  phone_id         UUID REFERENCES public.phones(id) ON DELETE SET NULL,
  sale_price       NUMERIC(12,2) NOT NULL CHECK (sale_price > 0),
  discount_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
  imei_snapshot    TEXT[] NOT NULL DEFAULT '{}',
  brand_snapshot   TEXT NOT NULL,
  model_snapshot   TEXT NOT NULL,
  storage_snapshot TEXT NOT NULL,
  color_snapshot   TEXT NOT NULL
);
CREATE INDEX idx_soi_order ON public.sale_order_items(sale_order_id);
CREATE INDEX idx_soi_phone ON public.sale_order_items(phone_id);
ALTER TABLE public.sale_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "soi_select" ON public.sale_order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.sale_orders so
    WHERE so.id = sale_order_id AND so.tenant_id = get_user_tenant_id()));
CREATE POLICY "soi_insert" ON public.sale_order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.sale_orders so
    WHERE so.id = sale_order_id AND so.tenant_id = get_user_tenant_id()));
```

### P1-7: purchase_orders

```sql
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  counterparty_id     UUID NOT NULL REFERENCES public.counterparties(id) ON DELETE RESTRICT,
  acquisition_channel TEXT NOT NULL
    CHECK (acquisition_channel IN ('DIRECT','PLATFORM','INTER_TENANT')),
  platform_fee        NUMERIC(12,2) NOT NULL DEFAULT 0,
  phones_ordered      INT NOT NULL DEFAULT 0,
  phones_received     INT NOT NULL DEFAULT 0,
  total_amount        NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_paid         NUMERIC(12,2) NOT NULL DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'AWAITING_RECEIPT'
    CHECK (status IN ('AWAITING_RECEIPT','RECEIVED','PARTIAL','SETTLED','CANCELLED')),
  payment_mode        TEXT CHECK (payment_mode IN ('CASH','UPI','BANK_TRANSFER','CREDIT')),
  due_date            DATE,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_po_tenant ON public.purchase_orders(tenant_id);
CREATE INDEX idx_po_cp ON public.purchase_orders(counterparty_id);
CREATE INDEX idx_po_status ON public.purchase_orders(tenant_id, status);
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "po_select" ON public.purchase_orders FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "po_insert" ON public.purchase_orders FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());
CREATE POLICY "po_update" ON public.purchase_orders FOR UPDATE USING (tenant_id = get_user_tenant_id());

-- Add FK now
ALTER TABLE public.ledger ADD CONSTRAINT fk_ledger_po
  FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE SET NULL;
ALTER TABLE public.phones ADD CONSTRAINT fk_phones_po
  FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE SET NULL;
```

### P1-8: purchase_order_items

```sql
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id   UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  phone_id            UUID REFERENCES public.phones(id) ON DELETE SET NULL,
  purchase_price      NUMERIC(12,2) NOT NULL CHECK (purchase_price > 0),
  status              TEXT NOT NULL DEFAULT 'PENDING_INSPECTION'
    CHECK (status IN ('PENDING_INSPECTION','ACCEPTED','REJECTED')),
  rejection_reason    TEXT
);
CREATE INDEX idx_poi_po ON public.purchase_order_items(purchase_order_id);
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "poi_select" ON public.purchase_order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.purchase_orders po
    WHERE po.id = purchase_order_id AND po.tenant_id = get_user_tenant_id()));
CREATE POLICY "poi_insert" ON public.purchase_order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.purchase_orders po
    WHERE po.id = purchase_order_id AND po.tenant_id = get_user_tenant_id()));
CREATE POLICY "poi_update" ON public.purchase_order_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.purchase_orders po
    WHERE po.id = purchase_order_id AND po.tenant_id = get_user_tenant_id()));
```

### P1-9 through P1-12: Payment tables

```sql
-- customer_payments
CREATE TABLE IF NOT EXISTS public.customer_payments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  counterparty_id  UUID NOT NULL REFERENCES public.counterparties(id) ON DELETE RESTRICT,
  total_received   NUMERIC(12,2) NOT NULL CHECK (total_received > 0),
  mode             TEXT NOT NULL CHECK (mode IN ('CASH','UPI','BANK_TRANSFER')),
  received_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  note             TEXT,
  recorded_by      UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT
);
CREATE INDEX idx_cp_pay_tenant ON public.customer_payments(tenant_id);
CREATE INDEX idx_cp_pay_cp ON public.customer_payments(counterparty_id);
ALTER TABLE public.customer_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cp_pay_select" ON public.customer_payments FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "cp_pay_insert" ON public.customer_payments FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id() AND auth.uid() = recorded_by);

-- payment_allocations
CREATE TABLE IF NOT EXISTS public.payment_allocations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_payment_id  UUID NOT NULL REFERENCES public.customer_payments(id) ON DELETE CASCADE,
  sale_order_id        UUID NOT NULL REFERENCES public.sale_orders(id) ON DELETE RESTRICT,
  amount_allocated     NUMERIC(12,2) NOT NULL CHECK (amount_allocated > 0),
  allocated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  note                 TEXT
);
CREATE INDEX idx_pa_cp ON public.payment_allocations(customer_payment_id);
CREATE INDEX idx_pa_so ON public.payment_allocations(sale_order_id);
ALTER TABLE public.payment_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pa_select" ON public.payment_allocations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.customer_payments cp
    WHERE cp.id = customer_payment_id AND cp.tenant_id = get_user_tenant_id()));
CREATE POLICY "pa_insert" ON public.payment_allocations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.customer_payments cp
    WHERE cp.id = customer_payment_id AND cp.tenant_id = get_user_tenant_id()));

-- supplier_payments (mirror of customer_payments)
CREATE TABLE IF NOT EXISTS public.supplier_payments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  counterparty_id  UUID NOT NULL REFERENCES public.counterparties(id) ON DELETE RESTRICT,
  total_paid       NUMERIC(12,2) NOT NULL CHECK (total_paid > 0),
  mode             TEXT NOT NULL CHECK (mode IN ('CASH','UPI','BANK_TRANSFER')),
  paid_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  note             TEXT,
  recorded_by      UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT
);
CREATE INDEX idx_sp_tenant ON public.supplier_payments(tenant_id);
CREATE INDEX idx_sp_cp ON public.supplier_payments(counterparty_id);
ALTER TABLE public.supplier_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sp_select" ON public.supplier_payments FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "sp_insert" ON public.supplier_payments FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());

-- supplier_allocations
CREATE TABLE IF NOT EXISTS public.supplier_allocations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_payment_id UUID NOT NULL REFERENCES public.supplier_payments(id) ON DELETE CASCADE,
  purchase_order_id   UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE RESTRICT,
  amount_allocated    NUMERIC(12,2) NOT NULL CHECK (amount_allocated > 0),
  allocated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  note                TEXT
);
CREATE INDEX idx_sa_sp ON public.supplier_allocations(supplier_payment_id);
CREATE INDEX idx_sa_po ON public.supplier_allocations(purchase_order_id);
ALTER TABLE public.supplier_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sa_select" ON public.supplier_allocations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.supplier_payments sp
    WHERE sp.id = supplier_payment_id AND sp.tenant_id = get_user_tenant_id()));
CREATE POLICY "sa_insert" ON public.supplier_allocations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.supplier_payments sp
    WHERE sp.id = supplier_payment_id AND sp.tenant_id = get_user_tenant_id()));
```

### P1-13: Helper functions

```sql
CREATE OR REPLACE FUNCTION public.get_tenant_plan()
RETURNS TEXT AS $$
  SELECT plan FROM public.tenants WHERE id = get_user_tenant_id();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_tenant_member_count()
RETURNS INT AS $$
  SELECT COUNT(*)::INT FROM public.profiles
  WHERE tenant_id = get_user_tenant_id() AND is_active = true;
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### P1-14: RPC create_trade_order

```sql
CREATE OR REPLACE FUNCTION public.create_trade_order(
  p_order_id        UUID,
  p_counterparty_id UUID,
  p_order_type      TEXT,
  p_payment_mode    TEXT,
  p_initial_payment NUMERIC,
  p_due_date        DATE,
  p_notes           TEXT,
  p_items           JSONB,
  -- Each item: {phone_id, sale_price, discount_amount, imei_snapshot[], brand, model, storage, color}
  p_payment_note    TEXT
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id   UUID;
  v_total     NUMERIC(12,2) := 0;
  v_status    TEXT;
  v_item      JSONB;
  v_effective NUMERIC(12,2);
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM public.profiles WHERE id = auth.uid();
  v_user_id := auth.uid();
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'No tenant'; END IF;

  -- Compute effective total (sale_price - discount_amount per item)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_effective := (v_item->>'sale_price')::NUMERIC
                 - COALESCE((v_item->>'discount_amount')::NUMERIC, 0);
    v_total := v_total + v_effective;
  END LOOP;

  -- Compute status
  v_status := CASE
    WHEN p_initial_payment <= 0 THEN 'OPEN'
    WHEN p_initial_payment >= v_total THEN 'SETTLED'
    ELSE 'PARTIAL'
  END;

  -- 1. Insert sale_order
  INSERT INTO public.sale_orders (id, tenant_id, counterparty_id, order_type,
    total_amount, amount_paid, status, payment_mode, due_date, notes)
  VALUES (p_order_id, v_tenant_id, p_counterparty_id, p_order_type,
    v_total, GREATEST(p_initial_payment, 0), v_status,
    NULLIF(p_payment_mode,''), p_due_date, p_notes);

  -- 2. Insert items, mark phones SOLD, fire PHONE_SALE if cash paid
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_effective := (v_item->>'sale_price')::NUMERIC
                 - COALESCE((v_item->>'discount_amount')::NUMERIC, 0);

    INSERT INTO public.sale_order_items (sale_order_id, phone_id, sale_price,
      discount_amount, imei_snapshot, brand_snapshot, model_snapshot,
      storage_snapshot, color_snapshot)
    VALUES (p_order_id, (v_item->>'phone_id')::UUID, (v_item->>'sale_price')::NUMERIC,
      COALESCE((v_item->>'discount_amount')::NUMERIC, 0),
      ARRAY(SELECT jsonb_array_elements_text(v_item->'imei_snapshot')),
      v_item->>'brand', v_item->>'model', v_item->>'storage', v_item->>'color');

    -- Mark phone SOLD, link to order
    UPDATE public.phones SET status = 'SOLD',
      sale_price = v_effective, sale_order_id = p_order_id, updated_at = now()
    WHERE id = (v_item->>'phone_id')::UUID AND tenant_id = v_tenant_id;
  END LOOP;

  -- 3. Fire PHONE_SALE only for amount actually paid (cash-basis)
  IF p_initial_payment > 0 THEN
    INSERT INTO public.ledger (id, tenant_id, user_id, type,
      sale_order_id, amount, payment_mode, created_at)
    VALUES (gen_random_uuid(), v_tenant_id, v_user_id, 'PHONE_SALE',
      p_order_id, p_initial_payment, NULLIF(p_payment_mode,''), now());

    -- Insert payment allocation for initial payment
    INSERT INTO public.customer_payments (id, tenant_id, counterparty_id,
      total_received, mode, recorded_by)
    VALUES (gen_random_uuid(), v_tenant_id, p_counterparty_id,
      p_initial_payment, COALESCE(NULLIF(p_payment_mode,''), 'CASH'), v_user_id)
    RETURNING id INTO v_tenant_id; -- reuse variable for payment id
    -- Note: real implementation uses a separate declared variable for payment_id
  END IF;

  RETURN jsonb_build_object('order_id', p_order_id, 'total', v_total, 'status', v_status);
EXCEPTION WHEN OTHERS THEN RAISE;
END;
$$;
```

> **Note:** The full production implementation of create_purchase_order, record_customer_payment, and record_supplier_payment follows the same pattern. Build create_trade_order first, test thoroughly, then mirror the pattern for the others. record_customer_payment is the most complex — it loops through allocations[], fires PHONE_SALE per allocation, and updates sale_orders.amount_paid + status for each affected order.

### P1-18: Starter phone limit RLS

```sql
-- Replace existing "Insert tenant phones" policy
DROP POLICY IF EXISTS "Insert tenant phones" ON public.phones;
CREATE POLICY "Insert tenant phones" ON public.phones FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id()
  AND auth.uid() = user_id
  AND (
    get_tenant_plan() NOT IN ('starter')
    OR (SELECT COUNT(*) FROM public.phones WHERE tenant_id = get_user_tenant_id()) < 200
  )
);
```

### P1-19: Staff seat limit RLS

```sql
DROP POLICY IF EXISTS "Insert profiles" ON public.profiles;
CREATE POLICY "Insert profiles" ON public.profiles FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id()
  AND (
    get_tenant_plan() IN ('enterprise','trial')
    OR (get_tenant_plan() = 'pro'     AND get_tenant_member_count() < 3)
    OR (get_tenant_plan() = 'starter' AND get_tenant_member_count() < 1)
  )
);
```

### P1-20: pg_cron trial expiry

```sql
-- Enable pg_cron extension in Supabase Dashboard first
SELECT cron.schedule('expire-trials', '0 2 * * *', $$
  UPDATE public.tenants
  SET plan = 'expired'
  WHERE plan = 'trial'
    AND plan_expires_at IS NOT NULL
    AND plan_expires_at < now();
$$);
```

### ✅ Phase 1 Self-Check

Run these in Supabase SQL editor. All must pass.

```sql
-- 1. All new tables exist (expect 8 rows)
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('counterparties','sale_orders','sale_order_items',
    'purchase_orders','purchase_order_items','customer_payments',
    'payment_allocations','supplier_payments','supplier_allocations');

-- 2. Ledger new columns (expect 4 rows)
SELECT column_name FROM information_schema.columns
WHERE table_name = 'ledger'
  AND column_name IN ('phone_id','sale_order_id','purchase_order_id','payment_mode');

-- 3. Phones new columns (expect 2 rows)
SELECT column_name FROM information_schema.columns
WHERE table_name = 'phones'
  AND column_name IN ('sale_order_id','purchase_order_id');

-- 4. Tenants new columns (expect 2 rows)
SELECT column_name FROM information_schema.columns
WHERE table_name = 'tenants'
  AND column_name IN ('plan','plan_expires_at');

-- 5. RLS enabled on all new tables (expect 9 rows, all rowsecurity=true)
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename IN ('counterparties','sale_orders','sale_order_items',
  'purchase_orders','purchase_order_items','customer_payments',
  'payment_allocations','supplier_payments','supplier_allocations');

-- 6. Helper functions exist (expect 2 rows)
SELECT routine_name FROM information_schema.routines
WHERE routine_name IN ('get_tenant_plan','get_tenant_member_count');

-- 7. RPC exists (expect 1 row)
SELECT routine_name FROM information_schema.routines
WHERE routine_name = 'create_trade_order';
```

---

## Phase 2 — Redux State

### P2-1: src/features/billing/types.ts

```typescript
export type OrderType = "RETAIL" | "BULK" | "TRANSFER";
export type OrderStatus = "OPEN" | "PARTIAL" | "SETTLED" | "RETURNED";
export type PayMode = "CASH" | "UPI" | "BANK_TRANSFER" | "CREDIT";

export interface OrderItem {
  id: string;
  saleOrderId: string;
  phoneId: string | null;
  salePrice: number;
  discountAmount: number;
  effectivePrice: number; // salePrice - discountAmount
  imeiSnapshot: string[];
  brandSnapshot: string;
  modelSnapshot: string;
  storageSnapshot: string;
  colorSnapshot: string;
}

export interface SaleOrder {
  id: string;
  counterpartyId: string;
  orderType: OrderType;
  totalAmount: number;
  amountPaid: number;
  status: OrderStatus;
  paymentMode?: PayMode;
  dueDate?: string;
  notes?: string;
  createdAt: string;
  items: OrderItem[];
}

export interface BillingState {
  orders: SaleOrder[];
}
```

### P2-2: src/features/billing/slice.ts

```typescript
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { BillingState, SaleOrder } from "./types";

const initialState: BillingState = { orders: [] };

const billingSlice = createSlice({
  name: "billing",
  initialState,
  reducers: {
    setOrders: (s, a: PayloadAction<SaleOrder[]>) => {
      s.orders = a.payload;
    },
    addOrder: (s, a: PayloadAction<SaleOrder>) => {
      s.orders.unshift(a.payload);
    },
    updateOrderPayment: (
      s,
      a: PayloadAction<{
        id: string;
        amountPaid: number;
        status: SaleOrder["status"];
      }>,
    ) => {
      const o = s.orders.find((o) => o.id === a.payload.id);
      if (o) {
        o.amountPaid = a.payload.amountPaid;
        o.status = a.payload.status;
      }
    },
    returnOrder: (s, a: PayloadAction<string>) => {
      const o = s.orders.find((o) => o.id === a.payload);
      if (o) o.status = "RETURNED";
    },
  },
});
export const { setOrders, addOrder, updateOrderPayment, returnOrder } =
  billingSlice.actions;
export default billingSlice.reducer;
```

### P2-3: src/features/billing/selectors.ts

```typescript
import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";

export const selectOrders = (s: RootState) => s.billing.orders;

export const selectOrdersByCounterparty = (id: string) =>
  createSelector(selectOrders, (orders) =>
    orders.filter((o) => o.counterpartyId === id),
  );

export const selectOpenOrders = createSelector(selectOrders, (orders) =>
  orders
    .filter((o) => o.status !== "SETTLED" && o.status !== "RETURNED")
    .sort((a, b) => {
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return b.createdAt.localeCompare(a.createdAt);
    }),
);

// AR summary — reads from orders only (no ledger needed)
export const selectARSummary = createSelector(selectOrders, (orders) => ({
  totalInvoiced: orders.reduce((s, o) => s + o.totalAmount, 0),
  totalOutstanding: orders
    .filter((o) => o.status !== "SETTLED" && o.status !== "RETURNED")
    .reduce((s, o) => s + (o.totalAmount - o.amountPaid), 0),
}));
```

### P2-4/5/6: src/features/purchasing/ — mirror billing exactly

Same pattern as billing but:

- `PurchaseOrder` type: add `acquisitionChannel`, `platformFee`, `phonesOrdered`, `phonesReceived`, `items: PurchaseOrderItem[]`
- `PurchaseOrderItem`: `purchasePrice`, `status: 'PENDING_INSPECTION' | 'ACCEPTED' | 'REJECTED'`, `rejectionReason?`
- Slice actions: `addPurchaseOrder`, `confirmReceipt` (batch accept/reject), `setPurchaseOrders`, `updatePOPayment`
- `selectAPSummary`: same pattern as selectARSummary but for purchase orders

### P2-7/8/9: src/features/customers/

```typescript
// types.ts
export type CustomerType = "CUSTOMER" | "RETAILER" | "WHOLESALER" | "PLATFORM";
export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  phone?: string;
  email?: string;
  platformName?: string;
  linkedTenantId?: string;
  notes?: string;
  createdAt: string;
}
export interface CustomerPayment {
  id: string;
  counterpartyId: string;
  totalReceived: number;
  mode: "CASH" | "UPI" | "BANK_TRANSFER";
  receivedAt: string;
  note?: string;
  recordedBy: string;
  allocations: {
    saleOrderId: string;
    amountAllocated: number;
    note?: string;
  }[];
}
export interface CustomersState {
  customers: Customer[];
  payments: CustomerPayment[];
}

// slice.ts — actions: setAll, addCustomer, updateCustomer, removeCustomer,
//            setPayments, addCustomerPayment
```

### P2-10: src/app/store.ts

```typescript
// Add to combineReducers:
import billingReducer from "../features/billing/slice";
import purchasingReducer from "../features/purchasing/slice";
import customersReducer from "../features/customers/slice";

const rootReducer = combineReducers({
  inventory: inventoryReducer,
  ledger: ledgerReducer,
  masterData: masterDataReducer,
  sync: syncReducer,
  billing: billingReducer, // NEW
  purchasing: purchasingReducer, // NEW
  customers: customersReducer, // NEW
});

// Update persist version:
const persistConfig = {
  key: "stockflow-root",
  storage: localforage,
  version: 2,
};
```

### P2-11: src/app/supabaseMiddleware.ts

```typescript
const trackablePrefixes = [
  "inventory/",
  "ledger/",
  "masterData/",
  "billing/",
  "purchasing/",
  "customers/", // ADD THESE
];
const ignoredHydrationTypes = [
  "inventory/setPhones",
  "ledger/setEntries",
  "masterData/setAll",
  "billing/setOrders",
  "purchasing/setPurchaseOrders", // ADD THESE
  "customers/setAll",
  "customers/setPayments", // ADD THESE
];
```

### P2-12: src/app/supabaseApi.ts — new cases

```typescript
case 'billing/addOrder': {
  const order = payload as SaleOrder;
  const { error } = await supabase.rpc('create_trade_order', {
    p_order_id: order.id,
    p_counterparty_id: order.counterpartyId,
    p_order_type: order.orderType,
    p_payment_mode: order.paymentMode ?? null,
    p_initial_payment: order.amountPaid,
    p_due_date: order.dueDate ?? null,
    p_notes: order.notes ?? null,
    p_items: order.items.map(i => ({
      phone_id: i.phoneId, sale_price: i.salePrice,
      discount_amount: i.discountAmount,
      imei_snapshot: i.imeiSnapshot,
      brand: i.brandSnapshot, model: i.modelSnapshot,
      storage: i.storageSnapshot, color: i.colorSnapshot,
    })),
    p_payment_note: null,
  });
  if (error) throw error;
  break;
}

case 'customers/addCustomerPayment': {
  const { error } = await supabase.rpc('record_customer_payment', {
    p_counterparty_id: payload.counterpartyId,
    p_total_received: payload.totalReceived,
    p_mode: payload.mode,
    p_allocations: payload.allocations,
    p_note: payload.note ?? null,
  });
  if (error) throw error;
  break;
}

case 'customers/addCustomer': {
  const { error } = await supabase.from('counterparties').insert({
    id: payload.id, name: payload.name, type: payload.type,
    phone: payload.phone ?? null, email: payload.email ?? null,
    platform_name: payload.platformName ?? null,
    linked_tenant_id: payload.linkedTenantId ?? null,
    notes: payload.notes ?? null, created_at: payload.createdAt,
  });
  if (error) throw error;
  break;
}
// Mirror for purchasing/addPurchaseOrder → rpc('create_purchase_order')
// Mirror for customers/addCustomer → insert counterparties
// Mirror for customers/updateCustomer, removeCustomer
```

### P2-13: useOfflineSyncManager.ts — add hydration

After the existing masterData fetch block, add:

```typescript
// Customers (counterparties)
const { data: cpData } = await supabase
  .from("counterparties")
  .select("*")
  .eq("tenant_id", tenantId)
  .order("name");
if (cpData && mounted && store.getState().sync.outbox.length === 0) {
  dispatch({
    type: "customers/setAll",
    payload: cpData.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      phone: c.phone,
      email: c.email,
      platformName: c.platform_name,
      linkedTenantId: c.linked_tenant_id,
      notes: c.notes,
      createdAt: c.created_at,
    })),
  });
}

// Open + Partial trade orders (with items)
const { data: soData } = await supabase
  .from("sale_orders")
  .select("*, sale_order_items(*)")
  .eq("tenant_id", tenantId)
  .in("status", ["OPEN", "PARTIAL"])
  .order("created_at", { ascending: false });
if (soData && mounted && store.getState().sync.outbox.length === 0) {
  dispatch({ type: "billing/setOrders", payload: soData.map(mapSaleOrder) });
}

// Open + Awaiting purchase orders (with items)
const { data: poData } = await supabase
  .from("purchase_orders")
  .select("*, purchase_order_items(*)")
  .eq("tenant_id", tenantId)
  .in("status", ["AWAITING_RECEIPT", "RECEIVED", "PARTIAL"])
  .order("created_at", { ascending: false });
if (poData && mounted && store.getState().sync.outbox.length === 0) {
  dispatch({
    type: "purchasing/setPurchaseOrders",
    payload: poData.map(mapPO),
  });
}

// Recent customer payments (last 30 days)
const thirtyDaysAgo = new Date(
  Date.now() - 30 * 24 * 3600 * 1000,
).toISOString();
const { data: cpPayData } = await supabase
  .from("customer_payments")
  .select("*, payment_allocations(*)")
  .eq("tenant_id", tenantId)
  .gte("received_at", thirtyDaysAgo)
  .order("received_at", { ascending: false });
if (cpPayData && mounted && store.getState().sync.outbox.length === 0) {
  dispatch({
    type: "customers/setPayments",
    payload: cpPayData.map(mapCustomerPayment),
  });
}
```

### P2-14: AuthContext.tsx — tenant + plan + polling

```typescript
// Add to state:
const [tenant, setTenant] = useState<TenantInfo | null>(null);

// Add to getInitialSession() after resolving session:
if (s?.user) {
  const { data: tenantData } = await supabase
    .from("tenants")
    .select("id, name, plan, plan_expires_at")
    .eq("id", s.user.user_metadata.tenant_id)
    .single();
  if (tenantData)
    setTenant({
      id: tenantData.id,
      name: tenantData.name,
      plan: tenantData.plan,
      planExpiresAt: tenantData.plan_expires_at,
    });
}

// 15-minute polling useEffect (add after existing effects):
useEffect(() => {
  if (!session || !tenant) return;
  const interval = setInterval(
    async () => {
      const { data } = await supabase
        .from("tenants")
        .select("plan, plan_expires_at")
        .eq("id", tenant.id)
        .single();
      if (data && data.plan !== tenant.plan) {
        setTenant((prev) =>
          prev
            ? { ...prev, plan: data.plan, planExpiresAt: data.plan_expires_at }
            : null,
        );
        toast.info("Your subscription has been updated.");
      }
    },
    15 * 60 * 1000,
  );
  return () => clearInterval(interval);
}, [session, tenant?.id, tenant?.plan]);
```

### P2-15: src/features/analytics/selectors.ts — dual-path rewrite

```typescript
// In selectInventoryMetrics, update avgTimeOnShelfDays:
import { RootState } from "../../app/store";

export const selectInventoryMetrics = createSelector(
  [
    selectInventoryPhones,
    selectLedgerEntries,
    (state: RootState) => state.billing?.orders ?? [],
  ], // NEW: billing orders
  (phones, entries, billingOrders) => {
    // ... existing code for inStock, pending, sold, repairByPhone ...

    // Updated avgTimeOnShelfDays — dual path
    sold.forEach((phone) => {
      let soldAt: Date | null = null;
      if ((phone as any).saleOrderId) {
        // New path: phone was sold via Trade Order
        const order = billingOrders.find(
          (o) => o.id === (phone as any).saleOrderId,
        );
        if (order) soldAt = new Date(order.createdAt);
      } else {
        // Legacy path: find PHONE_SALE by phone.id in referenceId
        const entry = entries.find(
          (e) => e.type === "PHONE_SALE" && e.referenceId === phone.id,
        );
        if (entry) soldAt = new Date(entry.createdAt);
      }
      if (soldAt) {
        const days =
          (soldAt.getTime() - new Date(phone.createdAt).getTime()) /
          (1000 * 60 * 60 * 24);
        totalDays += Math.max(0, days);
        validPhones++;
      }
    });
    // ... rest unchanged
  },
);
```

### ✅ Phase 2 Self-Check

```typescript
// In browser Redux DevTools after login:
// 1. store.getState().billing  → { orders: [] }   ✓
// 2. store.getState().purchasing → { orders: [] } ✓
// 3. store.getState().customers → { customers: [], payments: [] } ✓

// 2. Dispatch a test customer and verify sync:
store.dispatch({
  type: "customers/addCustomer",
  payload: {
    id: crypto.randomUUID(),
    name: "Test Co",
    type: "RETAILER",
    createdAt: new Date().toISOString(),
  },
});
// → Check Supabase counterparties table within 2s

// 3. Verify new slices in persist:
// Open Application → IndexedDB → localforage → stockflow-root
// billing, purchasing, customers keys must be present
```

---

## Phase 3 — Navigation & Feature Gates

### P3-1: src/components/layout/AppDrawer.tsx

Build a slide-in overlay drawer. Must match StockFlow design exactly.

```typescript
import { useLocation, NavLink } from 'react-router-dom';
import { Smartphone, Users, FileText, Wallet, ReceiptText,
         X, ChevronRight, Crown } from 'lucide-react';
import clsx from 'clsx';
import { usePlan } from '@/hooks/usePlan';
import { FeatureGate } from '@/components/shared/FeatureGate';

const SECTIONS = [
  { label: 'Inventory',    to: '/inventory',  icon: Smartphone,  feature: null },
  { label: 'Customers',    to: '/customers',  icon: Users,       feature: 'customers'    as const },
  { label: 'Trade Orders', to: '/orders',     icon: FileText,    feature: 'trade_orders' as const },
  { label: 'Financials',   to: '/financials', icon: Wallet,      feature: null },
  { label: 'Ledger',       to: '/ledger',     icon: ReceiptText, feature: 'full_ledger'  as const },
];

interface Props { isOpen: boolean; onClose: () => void; }

export default function AppDrawer({ isOpen, onClose }: Props) {
  const location = useLocation();
  const { canUse, plan } = usePlan();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}
      {/* Drawer panel */}
      <div className={clsx(
        'fixed top-0 left-0 h-full w-72 z-50 transition-transform duration-300',
        'bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800',
        'shadow-2xl flex flex-col',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-4 border-b border-slate-100 dark:border-slate-800">
          <span className="text-lg font-black text-[#064a98] tracking-tight">StockFlow</span>
          <button onClick={onClose} className="size-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {SECTIONS.map(section => {
            const locked = section.feature ? !canUse(section.feature) : false;
            const isActive = location.pathname.startsWith(section.to);
            return (
              <div key={section.to}>
                {locked ? (
                  <button
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 dark:text-slate-500 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    onClick={() => {/* navigate to pricing */}}
                  >
                    <section.icon size={20} />
                    <span className="text-sm font-medium flex-1 text-left">{section.label}</span>
                    <Crown size={14} className="text-amber-400" />
                  </button>
                ) : (
                  <NavLink
                    to={section.to}
                    onClick={onClose}
                    className={clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors',
                      isActive
                        ? 'bg-[#064a98] text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    )}
                  >
                    <section.icon size={20} />
                    <span className="text-sm font-medium flex-1">{section.label}</span>
                    {isActive && <ChevronRight size={16} />}
                  </NavLink>
                )}
              </div>
            );
          })}
        </nav>

        {/* Plan badge at bottom */}
        <div className="px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <Crown size={14} className="text-amber-500" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 capitalize">{plan} plan</span>
          </div>
        </div>
      </div>
    </>
  );
}
```

### P3-2: BottomNav.tsx — 3 items

```typescript
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Plus, Menu } from 'lucide-react';
import clsx from 'clsx';

interface Props { onMenuOpen: () => void; }

export default function BottomNav({ onMenuOpen }: Props) {
  return (
    <nav className="fixed bottom-0 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 flex justify-around items-center pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] px-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)] z-50 transition-colors duration-300">
      <NavLink to="/"
        className={({ isActive }) => clsx(
          'flex flex-col items-center justify-center w-16 pt-1 transition-colors',
          isActive ? 'text-[#064a98] dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
        )}>
        <LayoutDashboard size={22} />
        <span className="text-[10px] mt-1 font-semibold">Dashboard</span>
      </NavLink>

      <NavLink to="/add"
        className={({ isActive }) => clsx(
          'flex items-center justify-center size-14 rounded-2xl -mt-8 shadow-xl shadow-blue-900/30 text-white transition-all active:scale-95 border border-white/10',
          isActive ? 'bg-blue-800' : 'bg-[#064a98] hover:bg-blue-800'
        )}>
        <Plus size={28} strokeWidth={2.5} />
      </NavLink>

      <button
        onClick={onMenuOpen}
        className="flex flex-col items-center justify-center w-16 pt-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
        <Menu size={22} />
        <span className="text-[10px] mt-1 font-semibold">Menu</span>
      </button>
    </nav>
  );
}
```

### P3-3: AppLayout.tsx

```typescript
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import AppDrawer from './AppDrawer';
import { Toaster } from '@/components/ui/sonner';
import { useOfflineSyncManager } from '@/app/useOfflineSyncManager';
import { usePlan } from '@/hooks/usePlan';
import TrialExpiredPaywall from '@/components/shared/TrialExpiredPaywall';

export default function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  useOfflineSyncManager();
  const { isExpired } = usePlan();

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-300">
      {isExpired && <TrialExpiredPaywall />}
      <AppDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>
      <Toaster />
      <BottomNav onMenuOpen={() => setDrawerOpen(true)} />
    </div>
  );
}
```

### P3-4: App.tsx — new routes

```typescript
// Inside ProtectedRoute → AppLayout:
<Route path="financials" element={<Financials />} />
<Route path="ledger" element={<LedgerPage />} />
<Route path="customers" element={<Customers />} />
<Route path="customers/:id" element={<CustomerDetail />} />
<Route path="orders" element={<Orders />} />
<Route path="orders/:id" element={<OrderDetail />} />
<Route path="pricing" element={<Pricing />} />
// Backward compat:
<Route path="wallet" element={<Navigate to="/financials" replace />} />
```

### P3-5: src/hooks/usePlan.ts

````typescript
import { useAuth } from "@/context/AuthContext";

export const FEATURE_GATES = {
  unlimited_phones: ["pro", "enterprise"],
  imei_scanner: ["pro", "enterprise"],
  catalog_autofill: ["pro", "enterprise"],
  full_ledger: ["pro", "enterprise"],
  trade_orders: ["pro", "enterprise"],
  customers: ["pro", "enterprise"],
  pdf_invoice: ["pro", "enterprise"],
  credit_tracking: ["pro", "enterprise"],
  analytics: ["pro", "enterprise"],
  purchase_orders: ["pro", "enterprise"],
  bulk_orders: ["enterprise"],
  bulk_invoice: ["enterprise"],
  trade_network: ["enterprise"],
  receivables: ["enterprise"],
  customer_pnl: ["enterprise"],
  unlimited_seats: ["enterprise"],
} as const;
export type FeatureKey = keyof typeof FEATURE_GATES;

export function usePlan() {
  const { tenant } = useAuth();
  const plan = tenant?.plan ?? "trial";
  const expired = tenant?.planExpiresAt
    ? new Date(tenant.planExpiresAt) < new Date()
    : false;
  return {
    plan,
    isExpired: expired,
    canUse: (f: FeatureKey): boolean => {
      if (expired) return false;
      if (plan === "enterprise") {
        return true;
      }
      return (FEATURE_GATES[f] as readonly string[]).includes(plan);
    },
  };
}
### P3-6/7/8: FeatureGate, UpgradePrompt, TrialExpiredPaywall

**FeatureGate.tsx:**

```typescript
export function FeatureGate({ feature, children, fallback }: {
  feature: FeatureKey; children: React.ReactNode; fallback?: React.ReactNode;
}) {
  const { canUse, plan } = usePlan();
  if (canUse(feature)) return <>{children}</>;
  return fallback ? <>{fallback}</> : <UpgradePrompt feature={feature} currentPlan={plan} />;
}
````

**UpgradePrompt.tsx** — card with lock icon, feature name, plan badge, "Upgrade" button → /pricing. Use bg-white dark:bg-slate-900 rounded-xl p-5 border design.

**TrialExpiredPaywall.tsx** — full-screen fixed overlay (z-50), not dismissible. Shows logo, "14-day trial ended", brief tier cards, "Choose a Plan" CTA, and small "View my data (read-only)" link.

### ✅ Phase 3 Self-Check

- [ ] Drawer slides in smoothly on Android Chrome and iOS Safari
- [ ] Backdrop tap closes drawer
- [ ] Active section highlighted in #064a98
- [ ] Locked sections show Crown icon and navigate to /pricing on tap
- [ ] Plan badge in drawer footer shows correct plan
- [ ] BottomNav has exactly 3 items — Dashboard, Add, Menu
- [ ] /wallet redirects to /financials
- [ ] usePlan returns `isExpired: true` when planExpiresAt < now()

---

## Phase 4 — UI Pages

### Build order — follow exactly

1. `CustomerPicker` — used by CreateOrderSheet
2. `CreateOrderSheet` — core sell flow
3. `PhoneSelectorSheet` — used by CreateOrderSheet for bulk
4. `BatchAddSheet` — core buy flow for POs
5. `POConfirmSheet` — batch inspect/accept/reject
6. `AllocationSheet` — lump-sum payment allocation
7. `RecordPaymentSheet` — single order payment
8. Modify `PhoneDetail.tsx` — replace sale modal
9. Modify `Inventory.tsx` — multi-select mode
10. `Customers.tsx` list page
11. `CustomerDetail.tsx` 3-tab page
12. `Orders.tsx` list page
13. `OrderDetail.tsx` detail page
14. `Financials.tsx` (renamed wallet + new cards)
15. `LedgerPage.tsx` (raw ledger, mostly existing Wallet code)
16. `Pricing.tsx`

### CustomerPicker component

Fuzzy search (Fuse.js, keys: ['name','phone']) over `state.customers.customers`.
Renders as a popover/sheet. Last item when no match: "+ Create 'typed name'" chip.
On inline create: show mini-form (name, type dropdown, phone). On submit:

```typescript
dispatch(
  addCustomer({
    id: crypto.randomUUID(),
    name,
    type,
    phone,
    createdAt: new Date().toISOString(),
  }),
);
```

Then calls `onSelect(newCustomer)`.

### CreateOrderSheet

Fields in order:

1. Customer (CustomerPicker)
2. Order type: RETAIL (default) | BULK (gated: `canUse('bulk_orders')`) | TRANSFER (gated: `canUse('trade_network')`)
3. Phones: pre-loaded from props OR selected via PhoneSelectorSheet
4. Per-item: sale_price (editable), discount_amount (optional, default 0)
5. Payment mode: CASH / UPI / BANK_TRANSFER / CREDIT
6. Amount paid now: default = total for CASH, 0 for CREDIT
7. Due date: shown when amount_paid < total OR mode=CREDIT
8. Notes

On submit:

```typescript
const order: SaleOrder = {
  id: crypto.randomUUID(),
  counterpartyId: customer.id,
  orderType,
  totalAmount,
  amountPaid,
  status,
  paymentMode,
  dueDate,
  notes,
  createdAt: new Date().toISOString(),
  items: phones.map((p) => ({
    id: crypto.randomUUID(),
    saleOrderId: orderId,
    phoneId: p.id,
    salePrice: p.salePrice,
    discountAmount: p.discountAmount ?? 0,
    effectivePrice: p.salePrice - (p.discountAmount ?? 0),
    imeiSnapshot: p.imeis ?? [],
    brandSnapshot: p.brand,
    modelSnapshot: p.model,
    storageSnapshot: p.storage,
    colorSnapshot: p.color,
  })),
};
dispatch(addOrder(order));
// Also sync phone statuses in Redux immediately:
order.items.forEach((item) =>
  dispatch(markAsSold({ id: item.phoneId, salePrice: item.effectivePrice })),
);
navigate(`/orders/${order.id}`);
```

### AllocationSheet

Shows all OPEN+PARTIAL orders for the selected customer sorted by due_date ASC.
Each row: order summary + input field pre-filled with min(remaining balance, available amount).
Auto-fills oldest-first. User can adjust any amount.
Remaining counter shows unallocated funds as user changes values.
On confirm: `dispatch(addCustomerPayment({ counterpartyId, totalReceived, mode, allocations[] }))`.
For each allocation: also dispatches `updateOrderPayment({ id, amountPaid, status })`.

### CustomerDetail.tsx — 3 tabs

```typescript
// Tab state managed locally with useState<'orders'|'payments'|'timeline'>
const tabs = ["orders", "payments", "timeline"] as const;

// Orders tab: selectOrdersByCounterparty(id) — status chips, tap → OrderDetail
// Payments tab: state.customers.payments.filter(p => p.counterpartyId === id)
//   Each payment shows total + allocation breakdown expanded inline
// Timeline tab: merge orders + payments into chronological event list
//   Each event: type badge + amount + date + description
```

Balance card at top:

```typescript
const orders = useAppSelector(selectOrdersByCounterparty(id));
const outstanding = orders
  .filter((o) => o.status !== "SETTLED" && o.status !== "RETURNED")
  .reduce((s, o) => s + (o.totalAmount - o.amountPaid), 0);
// outstanding > 0 → amber chip. === 0 → emerald chip.
```

### OrderDetail.tsx

Key sections:

- Order header: customer name, type badge, date, status chip
- Line items table: brand/model, storage, color, IMEI (masked •••• XXXX), effective price, discount if > 0
- Payment summary: Total | Paid | Outstanding (amber if > 0)
- Allocations: each payment_allocation shown as "₹X from CP-{id shortref} · {date}"
- Action buttons:
  - "Record Payment" (visible if status OPEN|PARTIAL) → RecordPaymentSheet
  - "Return Order" (visible if status SETTLED) → confirmation → returnOrder dispatch + negative PHONE_SALE
  - "Generate Invoice" (FeatureGate: pdf_invoice) → generateAndShareInvoice()

### Financials.tsx

Existing wallet content (buckets, ledger entries list) preserved as-is.
New cards added at top:

```typescript
// EOD card
const todayEntries = ledgerEntries.filter((e) =>
  isToday(parseISO(e.createdAt)),
);
const moneyIn = todayEntries
  .filter((e) => e.type === "PHONE_SALE" || e.type === "MONEY_ADDED")
  .reduce((s, e) => s + e.amount, 0);
const moneyOut = todayEntries
  .filter((e) => e.type === "FUNDS_CONSUMED" || e.type === "WITHDRAWAL")
  .reduce((s, e) => s + Math.abs(e.amount), 0);
// opening balance = current wallet - moneyIn + moneyOut (derived)

// AR card — from billing slice
const arSummary = useAppSelector(selectARSummary);
// Shows: Invoiced | Collected (= invoiced - outstanding) | Outstanding

// AP card — from purchasing slice
const apSummary = useAppSelector(selectAPSummary);
// Shows: Owed | Paid | Outstanding
```

### ✅ Phase 4 Self-Check

- [ ] Create retail order from PhoneDetail → phone SOLD in Redux + Supabase (via RPC)
- [ ] Create bulk order from Inventory multi-select → all phones SOLD
- [ ] Customer inline create → appears in CustomerPicker immediately
- [ ] Lump-sum payment allocated across 2 orders → both order statuses update + PHONE_SALE entries in ledger
- [ ] CustomerDetail balance updates after allocation
- [ ] CustomerDetail 3 tabs all render correctly
- [ ] OrderDetail shows allocation provenance with CP reference
- [ ] Return order: negative PHONE_SALE entry, phone back to IN_STOCK
- [ ] Financials EOD card shows correct values for today
- [ ] AR card outstanding matches sum of open order balances
- [ ] Empty states render on all new pages for a fresh tenant
- [ ] Offline: create order → reconnect → verify 4 Supabase tables populated

---

## Phase 5 — PDF + Financial Cards

### P5-1: Install

```bash
npm install jspdf jspdf-autotable
```

### P5-2: src/utils/generateInvoice.ts

Full implementation (same as v3 prompt). Key additions for v4:

- Show discount_amount per line item as "— ₹X discount" below the unit price
- Show effective price (after discount) as the line total
- Footer: "Invoiced: ₹X | Paid: ₹Y | Outstanding: ₹Z"
- Outstanding highlighted in amber (#BA7517) when > 0

### ✅ Phase 5 Self-Check

- [ ] PDF generates for 1-phone retail order
- [ ] PDF generates for 10-phone bulk order with discounts
- [ ] Share opens native sheet on Android + iOS
- [ ] Download works on desktop Chrome
- [ ] Outstanding balance highlighted in amber
- [ ] EOD card values are correct at end of day
- [ ] AR card matches manual count of open order balances

---

## Phase 6 — Subscriptions

Same as v3 prompt Phase 6. Key additions:

- `notes: { tenant_id: tenant.id }` MUST be passed in Razorpay subscription creation call
- `handle-subscription` Edge Function must handle both `subscription.activated` AND `subscription.charged` (for renewals)
- Pricing page: show current plan with checkmark highlight. Show "Current plan" button (disabled) for active plan.

### ✅ Phase 6 Self-Check

- [ ] Razorpay test payment activates plan within 5s
- [ ] After Starter activation: canUse('imei_scanner') = false
- [ ] After Pro activation: canUse('bulk_orders') = false, canUse('imei_scanner') = true
- [ ] Phone #201 insert blocked by RLS for Starter plan
- [ ] 4th staff invite blocked by RLS for Pro plan
- [ ] Trial expiry paywall shows when plan='expired'
- [ ] 15-min poll detects mid-session plan change

---

## Phase 7 — Quality Assurance

### P7-1/2/3: Offline flows

For each:

1. Open app on mobile, put in Airplane Mode
2. Perform the action (create order / PO / payment)
3. Verify Redux state updated immediately (optimistic)
4. Turn on WiFi
5. Verify outbox empties
6. Check all affected Supabase tables via Table Editor

### P7-5: Plan gate bypass test

1. Login as Starter plan user
2. Open Redux DevTools
3. Dispatch: `store.dispatch({type:'@@bypass',payload:'enterprise'})`
4. Attempt to insert phone #201 via any UI
5. Expected: RLS blocks INSERT, Supabase returns error, toast shows error

### P7-11: Analytics selector mixed test

1. Have 3 phones sold via legacy flow (pre-MVP2, no saleOrderId)
2. Sell 3 phones via Trade Order (post-MVP2, has saleOrderId)
3. Check Analytics page:
   - netProfit correct for all 6 phones
   - avgTimeOnShelfDays computed for all 6 (legacy uses PHONE_SALE referenceId, new uses order.createdAt)

### ✅ MVP 2 Final Acceptance

All 20 items in P7 tracker must pass. Then verify BRD v4 acceptance criteria Section 11 line by line.

---

## Files Changed in MVP 2 — Complete Reference

| File                                              | Type   | Phase |
| ------------------------------------------------- | ------ | ----- |
| `docs/schemas/005_mvp2_billing.sql`               | NEW    | 1     |
| `src/features/billing/types.ts`                   | NEW    | 2     |
| `src/features/billing/slice.ts`                   | NEW    | 2     |
| `src/features/billing/selectors.ts`               | NEW    | 2     |
| `src/features/purchasing/types.ts`                | NEW    | 2     |
| `src/features/purchasing/slice.ts`                | NEW    | 2     |
| `src/features/purchasing/selectors.ts`            | NEW    | 2     |
| `src/features/customers/types.ts`                 | NEW    | 2     |
| `src/features/customers/slice.ts`                 | NEW    | 2     |
| `src/features/customers/selectors.ts`             | NEW    | 2     |
| `src/features/analytics/selectors.ts`             | MODIFY | 2     |
| `src/hooks/usePlan.ts`                            | NEW    | 3     |
| `src/utils/generateInvoice.ts`                    | NEW    | 5     |
| `src/components/layout/AppDrawer.tsx`             | NEW    | 3     |
| `src/components/layout/BottomNav.tsx`             | MODIFY | 3     |
| `src/components/layout/AppLayout.tsx`             | MODIFY | 3     |
| `src/components/shared/FeatureGate.tsx`           | NEW    | 3     |
| `src/components/shared/UpgradePrompt.tsx`         | NEW    | 3     |
| `src/components/shared/TrialExpiredPaywall.tsx`   | NEW    | 3     |
| `src/components/shared/CreateOrderSheet.tsx`      | NEW    | 4     |
| `src/components/shared/PhoneSelectorSheet.tsx`    | NEW    | 4     |
| `src/components/shared/BatchAddSheet.tsx`         | NEW    | 4     |
| `src/components/shared/AllocationSheet.tsx`       | NEW    | 4     |
| `src/components/shared/RecordPaymentSheet.tsx`    | NEW    | 4     |
| `src/components/shared/POConfirmSheet.tsx`        | NEW    | 4     |
| `src/components/ui/CustomerPicker.tsx`            | NEW    | 4     |
| `src/pages/Customers.tsx`                         | NEW    | 4     |
| `src/pages/CustomerDetail.tsx`                    | NEW    | 4     |
| `src/pages/Orders.tsx`                            | NEW    | 4     |
| `src/pages/OrderDetail.tsx`                       | NEW    | 4     |
| `src/pages/Financials.tsx`                        | NEW    | 4     |
| `src/pages/LedgerPage.tsx`                        | NEW    | 4     |
| `src/pages/Pricing.tsx`                           | NEW    | 6     |
| `src/pages/PhoneDetail.tsx`                       | MODIFY | 4     |
| `src/pages/Inventory.tsx`                         | MODIFY | 4     |
| `src/pages/AddPhone.tsx`                          | MODIFY | 4     |
| `src/app/store.ts`                                | MODIFY | 2     |
| `src/app/supabaseMiddleware.ts`                   | MODIFY | 2     |
| `src/app/supabaseApi.ts`                          | MODIFY | 2     |
| `src/app/useOfflineSyncManager.ts`                | MODIFY | 2     |
| `src/context/AuthContext.tsx`                     | MODIFY | 2     |
| `src/App.tsx`                                     | MODIFY | 3     |
| `supabase/functions/handle-subscription/index.ts` | NEW    | 6     |

---

## Maintenance Protocol

When BRD v4 is updated, update this file:
| BRD change | Prompt update required |
|------------|----------------------|
| New DB table | Add to Phase 1 SQL |
| New Redux action | Add to Phase 2 supabaseApi cases + tracker |
| New UI page | Add to Phase 4 + Files table |
| New route | Add to P3-4 |
| Pricing change | Update Phase 6 Razorpay amounts |
| New feature gate | Add to FEATURE_GATES in usePlan.ts |

---

_StockFlow MVP 2 Antigravity Prompt v4.0 — Final | March 2026_
_Companion: StockFlow_MVP2_BRD_v4.docx_
