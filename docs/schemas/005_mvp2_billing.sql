-- ==============================================================================
-- StockFlow MVP 2: Billing, Purchasing, and Payments
-- Version 4.0 (Synchronized with LIVE)
-- ==============================================================================

-- 1. Counterparties (Customers/Suppliers)
CREATE TABLE IF NOT EXISTS public.counterparties (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  type             TEXT NOT NULL
    CHECK (type IN ('CUSTOMER','RETAILER','WHOLESALER','PLATFORM')),
  phone            TEXT,
  email            TEXT,
  platform_name    TEXT,
  linked_tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Sale Orders
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

-- 3. Sale Order Items
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

-- 4. Purchase Orders
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

-- 5. Purchase Order Items
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id   UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  phone_id            UUID REFERENCES public.phones(id) ON DELETE SET NULL,
  purchase_price      NUMERIC(12,2) NOT NULL CHECK (purchase_price > 0),
  status              TEXT NOT NULL DEFAULT 'PENDING_INSPECTION'
    CHECK (status IN ('PENDING_INSPECTION','ACCEPTED','REJECTED')),
  rejection_reason    TEXT
);

-- 6. Payments Logic
CREATE TABLE IF NOT EXISTS public.customer_payments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  counterparty_id  UUID NOT NULL REFERENCES public.counterparties(id) ON DELETE RESTRICT,
  total_received   NUMERIC(12,2) NOT NULL CHECK (total_received > 0),
  mode             TEXT NOT NULL CHECK (mode IN ('CASH','UPI','BANK_TRANSFER', 'CREDIT')),
  received_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  note             TEXT,
  recorded_by      UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT
);

-- 7. Payment Allocations (Linking payments to orders)
CREATE TABLE IF NOT EXISTS public.payment_allocations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_payment_id UUID NOT NULL REFERENCES public.customer_payments(id) ON DELETE CASCADE,
  sale_order_id    UUID NOT NULL REFERENCES public.sale_orders(id) ON DELETE CASCADE,
  amount_allocated NUMERIC(12,2) NOT NULL CHECK (amount_allocated > 0),
  note             TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Supplier Payments
CREATE TABLE IF NOT EXISTS public.supplier_payments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  counterparty_id  UUID NOT NULL REFERENCES public.counterparties(id) ON DELETE RESTRICT,
  total_paid       NUMERIC(12,2) NOT NULL CHECK (total_paid > 0),
  mode             TEXT NOT NULL CHECK (mode IN ('CASH','UPI','BANK_TRANSFER','CREDIT')),
  paid_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  note             TEXT,
  recorded_by      UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT
);

-- 9. Supplier Allocations
CREATE TABLE IF NOT EXISTS public.supplier_allocations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_payment_id UUID NOT NULL REFERENCES public.supplier_payments(id) ON DELETE CASCADE,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  amount_allocated NUMERIC(12,2) NOT NULL CHECK (amount_allocated > 0),
  note             TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INDEXES (Hardened)
CREATE INDEX IF NOT EXISTS idx_sale_orders_tenant ON public.sale_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant ON public.purchase_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_payments_tenant ON public.customer_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_tenant ON public.supplier_payments(tenant_id);

-- Helper functions for Billing (Hardened & Optimized)
CREATE OR REPLACE FUNCTION public.get_tenant_plan()
RETURNS TEXT AS $$
  -- Performance optimized via subquery inlining
  SELECT plan FROM public.tenants WHERE id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1);
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '';

CREATE OR REPLACE FUNCTION public.get_tenant_member_count()
RETURNS INT AS $$
  SELECT COUNT(*)::INT FROM public.profiles
  WHERE tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1) AND is_active = true;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '';

-- RLS POLICY RE-INIT
ALTER TABLE public.counterparties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cp_access" ON public.counterparties FOR ALL USING (tenant_id = get_user_tenant_id());
CREATE POLICY "so_access" ON public.sale_orders FOR ALL USING (tenant_id = get_user_tenant_id());
CREATE POLICY "po_access" ON public.purchase_orders FOR ALL USING (tenant_id = get_user_tenant_id());
CREATE POLICY "cp_pay_access" ON public.customer_payments FOR ALL USING (tenant_id = get_user_tenant_id());
CREATE POLICY "sp_pay_access" ON public.supplier_payments FOR ALL USING (tenant_id = get_user_tenant_id());

-- Trade Order RPC (Hardened)
CREATE OR REPLACE FUNCTION public.create_trade_order(
  p_order_id        UUID,
  p_counterparty_id UUID,
  p_order_type      TEXT,
  p_payment_mode    TEXT,
  p_initial_payment NUMERIC,
  p_due_date        DATE,
  p_notes           TEXT,
  p_items           JSONB,
  p_payment_note    TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id   UUID;
  v_total     NUMERIC(12,2) := 0;
  v_status    TEXT;
  v_item      JSONB;
  v_effective NUMERIC(12,2);
  v_so_id     UUID;
BEGIN
  -- Get context
  SELECT tenant_id INTO v_tenant_id FROM public.profiles WHERE id = auth.uid();
  v_user_id := auth.uid();
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'No tenant context found'; END IF;

  -- 1. Calculate Total
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_total := v_total + (v_item->>'sale_price')::NUMERIC;
  END LOOP;

  -- 2. Determine Initial Status
  v_status := CASE
    WHEN p_initial_payment <= 0 THEN 'OPEN'
    WHEN p_initial_payment >= v_total THEN 'SETTLED'
    ELSE 'PARTIAL'
  END;

  -- 3. Insert Sale Order
  INSERT INTO public.sale_orders (id, tenant_id, counterparty_id, order_type,
    total_amount, amount_paid, status, payment_mode, due_date, notes)
  VALUES (p_order_id, v_tenant_id, p_counterparty_id, p_order_type,
    v_total, GREATEST(p_initial_payment, 0), v_status,
    NULLIF(p_payment_mode,''), p_due_date, p_notes)
  RETURNING id INTO v_so_id;

  -- 4. Insert Items and Update Phone Status
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_effective := (v_item->>'sale_price')::NUMERIC;

    INSERT INTO public.sale_order_items (sale_order_id, phone_id, sale_price,
      brand_snapshot, model_snapshot, storage_snapshot, color_snapshot)
    VALUES (v_so_id, (v_item->>'phone_id')::UUID, v_effective,
      v_item->>'brand', v_item->>'model', v_item->>'storage', v_item->>'color');

    UPDATE public.phones SET 
      status = 'SOLD',
      sale_price = v_effective, 
      sale_order_id = v_so_id, 
      updated_at = now()
    WHERE id = (v_item->>'phone_id')::UUID AND tenant_id = v_tenant_id;
  END LOOP;

  -- 5. Record Payment if initial_payment > 0
  IF p_initial_payment > 0 THEN
    INSERT INTO public.ledger (tenant_id, user_id, type, sale_order_id, amount, payment_mode, note)
    VALUES (v_tenant_id, v_user_id, 'PHONE_SALE', v_so_id, p_initial_payment, p_payment_mode, p_payment_note);

    INSERT INTO public.customer_payments (tenant_id, counterparty_id, total_received, mode, recorded_by, note)
    VALUES (v_tenant_id, p_counterparty_id, p_initial_payment, COALESCE(NULLIF(p_payment_mode,''), 'CASH'), v_user_id, p_payment_note);
  END IF;

  RETURN jsonb_build_object('order_id', v_so_id, 'total', v_total, 'status', v_status);
END;
$$;
