-- ============================================================
-- Migration: Razorpay recurring billing integration
-- ============================================================
-- 1. Update subscription_plans with new prices
-- 2. Add Razorpay plan ID columns to subscription_plans
-- 3. Create tenant_subscriptions table (subscription lifecycle)
-- 4. Create subscription_payments table (payment history)
-- ============================================================

-- ── 1. Update plan prices ────────────────────────────────────
UPDATE public.subscription_plans
SET price_monthly = 299.00, price_yearly = 2990.00, updated_at = now()
WHERE id = 'starter';

UPDATE public.subscription_plans
SET price_monthly = 799.00, price_yearly = 7990.00, updated_at = now()
WHERE id = 'pro';

UPDATE public.subscription_plans
SET price_monthly = 1099.00, price_yearly = 10990.00, updated_at = now()
WHERE id = 'enterprise';

-- ── 2. Add Razorpay plan ID columns ─────────────────────────
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS razorpay_plan_id_monthly TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_plan_id_yearly  TEXT;

-- ── 3. tenant_subscriptions ──────────────────────────────────
-- Links a tenant to their active Razorpay subscription.
-- Status mirrors Razorpay's subscription lifecycle.
CREATE TABLE IF NOT EXISTS public.tenant_subscriptions (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id                   TEXT        NOT NULL REFERENCES public.subscription_plans(id),
  billing_period            TEXT        NOT NULL CHECK (billing_period IN ('monthly', 'yearly')),
  razorpay_subscription_id  TEXT        NOT NULL UNIQUE,
  razorpay_customer_id      TEXT,
  -- Status mirrors Razorpay: created → authenticated → active → pending → halted → cancelled/completed
  status                    TEXT        NOT NULL DEFAULT 'created'
                              CHECK (status IN ('created','authenticated','active','pending','halted','cancelled','completed','expired')),
  trial_end                 TIMESTAMPTZ,
  current_start             TIMESTAMPTZ,
  current_end               TIMESTAMPTZ,
  -- The charge amount including the 2% platform fee surcharge (in INR)
  last_charged_amount       NUMERIC(12,2),
  cancel_at_cycle_end       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant_id
  ON public.tenant_subscriptions(tenant_id);

CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_status
  ON public.tenant_subscriptions(status);

-- ── 4. subscription_payments ─────────────────────────────────
-- Each successful or failed charge against a subscription.
CREATE TABLE IF NOT EXISTS public.subscription_payments (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_subscription_id    UUID        NOT NULL REFERENCES public.tenant_subscriptions(id) ON DELETE CASCADE,
  razorpay_payment_id       TEXT        NOT NULL UNIQUE,
  razorpay_invoice_id       TEXT,
  -- Amount paid by the customer (base plan amount + 2% surcharge), in INR
  amount                    NUMERIC(12,2) NOT NULL,
  -- Razorpay's own fee for this transaction
  razorpay_fee              NUMERIC(12,2),
  razorpay_tax              NUMERIC(12,2),
  currency                  TEXT        NOT NULL DEFAULT 'INR',
  status                    TEXT        NOT NULL
                              CHECK (status IN ('captured','failed','refunded')),
  method                    TEXT, -- card / upi / netbanking / wallet
  paid_at                   TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscription_id
  ON public.subscription_payments(tenant_subscription_id);

-- ── 5. RLS ───────────────────────────────────────────────────
ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

-- Tenants can read their own subscription rows
CREATE POLICY "tenant_read_own_subscription"
  ON public.tenant_subscriptions FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Tenants can read their own payment rows
CREATE POLICY "tenant_read_own_payments"
  ON public.subscription_payments FOR SELECT
  TO authenticated
  USING (
    tenant_subscription_id IN (
      SELECT ts.id FROM public.tenant_subscriptions ts
      JOIN public.profiles p ON p.tenant_id = ts.tenant_id
      WHERE p.id = auth.uid()
    )
  );

-- Service role (edge functions) has full access — handled by Supabase default
-- Super-admin full access
CREATE POLICY "super_admin_full_access_subscriptions"
  ON public.tenant_subscriptions
  USING (public.get_user_role() = 'super-admin');

CREATE POLICY "super_admin_full_access_payments"
  ON public.subscription_payments
  USING (public.get_user_role() = 'super-admin');

-- ── 6. updated_at trigger ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_tenant_subscriptions_updated_at ON public.tenant_subscriptions;
CREATE TRIGGER set_tenant_subscriptions_updated_at
  BEFORE UPDATE ON public.tenant_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
