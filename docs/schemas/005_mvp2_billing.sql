-- ==============================================================================
-- StockFlow MVP 2: Billing, Purchasing, and Payments
-- Version 4.0
-- ==============================================================================

-- P1-1: ALTER ledger
ALTER TABLE public.ledger
  ADD COLUMN IF NOT EXISTS phone_id UUID
    REFERENCES public.phones(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sale_order_id UUID,
  ADD COLUMN IF NOT EXISTS purchase_order_id UUID,
  ADD COLUMN IF NOT EXISTS payment_mode TEXT
    CHECK (payment_mode IN ('CASH','UPI','BANK_TRANSFER','CREDIT'));

-- P1-2: ALTER phones
ALTER TABLE public.phones
  ADD COLUMN IF NOT EXISTS sale_order_id UUID,
  ADD COLUMN IF NOT EXISTS purchase_order_id UUID;

-- P1-3: ALTER tenants
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'trial'
    CHECK (plan IN ('trial','starter','pro','enterprise','expired')),
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;

UPDATE public.tenants
  SET plan_expires_at = now() + INTERVAL '14 days'
  WHERE plan = 'trial' AND plan_expires_at IS NULL;

-- P1-4: counterparties
CREATE TABLE IF NOT EXISTS public.counterparties (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  type             TEXT NOT NULL
    CHECK (type IN ('CUSTOMER','RETAILER','ENTERPRISE','PLATFORM')),
  phone            TEXT,
  email            TEXT,
  platform_name    TEXT,
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

-- P1-5: sale_orders
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

ALTER TABLE public.ledger ADD CONSTRAINT fk_ledger_sale_order
  FOREIGN KEY (sale_order_id) REFERENCES public.sale_orders(id) ON DELETE SET NULL;
ALTER TABLE public.phones ADD CONSTRAINT fk_phones_sale_order
  FOREIGN KEY (sale_order_id) REFERENCES public.sale_orders(id) ON DELETE SET NULL;

-- P1-6: sale_order_items
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

-- P1-7: purchase_orders
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

ALTER TABLE public.ledger ADD CONSTRAINT fk_ledger_po
  FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE SET NULL;
ALTER TABLE public.phones ADD CONSTRAINT fk_phones_po
  FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE SET NULL;

-- P1-8: purchase_order_items
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

-- P1-9 through P1-12: Payment tables
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

-- P1-13: Helper functions
CREATE OR REPLACE FUNCTION public.get_tenant_plan()
RETURNS TEXT AS $$
  SELECT plan FROM public.tenants WHERE id = get_user_tenant_id();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_tenant_member_count()
RETURNS INT AS $$
  SELECT COUNT(*)::INT FROM public.profiles
  WHERE tenant_id = get_user_tenant_id() AND is_active = true;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- P1-14: RPC create_trade_order
CREATE OR REPLACE FUNCTION public.create_trade_order(
  p_order_id        UUID,
  p_counterparty_id UUID,
  p_order_type      TEXT,
  p_payment_mode    TEXT,
  p_initial_payment NUMERIC,
  p_due_date        DATE,
  p_notes           TEXT,
  p_items           JSONB,
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

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_effective := (v_item->>'sale_price')::NUMERIC
                 - COALESCE((v_item->>'discount_amount')::NUMERIC, 0);
    v_total := v_total + v_effective;
  END LOOP;

  v_status := CASE
    WHEN p_initial_payment <= 0 THEN 'OPEN'
    WHEN p_initial_payment >= v_total THEN 'SETTLED'
    ELSE 'PARTIAL'
  END;

  INSERT INTO public.sale_orders (id, tenant_id, counterparty_id, order_type,
    total_amount, amount_paid, status, payment_mode, due_date, notes)
  VALUES (p_order_id, v_tenant_id, p_counterparty_id, p_order_type,
    v_total, GREATEST(p_initial_payment, 0), v_status,
    NULLIF(p_payment_mode,''), p_due_date, p_notes);

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

    UPDATE public.phones SET status = 'SOLD',
      sale_price = v_effective, sale_order_id = p_order_id, updated_at = now()
    WHERE id = (v_item->>'phone_id')::UUID AND tenant_id = v_tenant_id;
  END LOOP;

  IF p_initial_payment > 0 THEN
    INSERT INTO public.ledger (id, tenant_id, user_id, type,
      sale_order_id, amount, payment_mode, created_at)
    VALUES (gen_random_uuid(), v_tenant_id, v_user_id, 'PHONE_SALE',
      p_order_id, p_initial_payment, NULLIF(p_payment_mode,''), now());

    INSERT INTO public.customer_payments (id, tenant_id, counterparty_id,
      total_received, mode, recorded_by)
    VALUES (gen_random_uuid(), v_tenant_id, p_counterparty_id,
      p_initial_payment, COALESCE(NULLIF(p_payment_mode,''), 'CASH'), v_user_id)
    RETURNING id INTO v_tenant_id;
  END IF;

  RETURN jsonb_build_object('order_id', p_order_id, 'total', v_total, 'status', v_status);
EXCEPTION WHEN OTHERS THEN RAISE;
END;
$$;

-- P1-18: Starter phone limit RLS
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

-- P1-19: Staff seat limit RLS
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

-- P1-20: pg_cron trial expiry
-- Note: Must enable pg_cron extension first
SELECT cron.schedule('expire-trials', '0 2 * * *', $$
  UPDATE public.tenants
  SET plan = 'expired'
  WHERE plan = 'trial'
    AND plan_expires_at IS NOT NULL
    AND plan_expires_at < now();
$$);
