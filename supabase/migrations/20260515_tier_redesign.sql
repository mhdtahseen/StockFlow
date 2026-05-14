-- =============================================================================
-- Migration: 20260515_tier_redesign.sql
-- Tier redesign:
--   - Starter: 1 user, 100 phones (down from 200)
--   - Pro:     10 users (up from 3), unlimited phones
--   - Enterprise: unlimited
--   - free/wholesaler tenants migrated → expired
--   - Add all 17 feature keys to feature_flags table
-- =============================================================================

-- 1. Update RLS: "Insert profiles"
--    Starter stays at 1 member. Pro increased from 3 → 10.
--    Remove wholesaler from unrestricted list (free/wholesaler no longer valid tiers).
DROP POLICY IF EXISTS "Insert profiles" ON public.profiles;
CREATE POLICY "Insert profiles" ON public.profiles FOR INSERT WITH CHECK (
  tenant_id = public.get_user_tenant_id()
  AND (
    -- Trial and Enterprise: unlimited seats
    public.get_tenant_plan() = ANY (ARRAY['trial', 'enterprise'])
    -- Pro: up to 10 members
    OR (public.get_tenant_plan() = 'pro' AND public.get_tenant_member_count() < 10)
    -- Starter: solo operator, 1 user max
    OR (public.get_tenant_plan() = 'starter' AND public.get_tenant_member_count() < 1)
  )
);

-- 2. Update RLS: "Insert tenant phones"
--    Starter phone cap: 200 → 100.
DROP POLICY IF EXISTS "Insert tenant phones" ON public.phones;
CREATE POLICY "Insert tenant phones" ON public.phones FOR INSERT WITH CHECK (
  tenant_id = public.get_user_tenant_id()
  AND auth.uid() = user_id
  AND (
    -- Trial, Pro, Enterprise: unlimited phones
    public.get_tenant_plan() = ANY (ARRAY['trial', 'pro', 'enterprise'])
    -- Starter: capped at 100
    OR (
      public.get_tenant_plan() = 'starter'
      AND (SELECT COUNT(*) FROM public.phones p WHERE p.tenant_id = public.get_user_tenant_id()) < 100
    )
  )
);

-- 3. Migrate free/wholesaler tenants → expired
UPDATE public.tenants
SET plan = 'expired', updated_at = now()
WHERE plan IN ('free', 'wholesaler');

-- 4. Update subscription_plans seed to reflect new feature set
--    (upsert — id is the primary key)
INSERT INTO public.subscription_plans (id, name, price_monthly, price_yearly, currency, description, features, is_active)
VALUES
  ('starter',    'Starter',       999,   9990,  'INR',
   'For solo shop owners getting started with digital inventory.',
   '["1 User", "100 Phone Limit", "Sales & Purchase Orders", "Customer Directory", "PDF Invoices"]'::jsonb,
   true),
  ('pro',        'Pro Business',  2499,  24990, 'INR',
   'Everything a serious single-shop needs to run efficiently.',
   '["10 Users", "Unlimited Phones", "IMEI Scanner", "Advanced P&L Ledger", "Analytics", "Credit Tracking", "Public Share Links", "Multi-device Orders"]'::jsonb,
   true),
  ('enterprise', 'Enterprise',    9999,  99990, 'INR',
   'Custom limits and dealer collaboration for high-volume operations.',
   '["Unlimited Users", "Bulk Invoices", "Dealer Trade Network", "SLA Guarantee", "Dedicated Support"]'::jsonb,
   true)
ON CONFLICT (id) DO UPDATE SET
  name          = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly  = EXCLUDED.price_yearly,
  description   = EXCLUDED.description,
  features      = EXCLUDED.features,
  updated_at    = now();

-- Remove deprecated plans from the table
DELETE FROM public.subscription_plans WHERE id IN ('free');

-- 5. Sync all 17 feature keys into feature_flags
--    Uses ON CONFLICT DO NOTHING so existing global toggles are preserved.
INSERT INTO public.feature_flags (flag_key, display_name, description, enabled_globally)
VALUES
  -- Starter tier
  ('trade_orders',     'Sales Orders',              'Sale order creation and management',                      true),
  ('purchase_orders',  'Purchase Orders',           'Purchase order creation and management',                  true),
  ('customers',        'Customer Directory',        'Customer and supplier contact management',                true),
  ('pdf_invoice',      'PDF Invoice Generation',    'Generate and download professional PDF invoices',         true),
  -- Pro tier
  ('public_sharing',   'Public Share Links',        'Share invoices/POs via public link (no login required)',  true),
  ('imei_scanner',     'IMEI Barcode Scanner',      'Camera-based IMEI/serial number scanning',                true),
  ('catalog_autofill', 'Global Device Catalog',     'Auto-fill device specs from global registry',            true),
  ('full_ledger',      'Advanced P&L Ledger',       'Real-time profit/loss and full financial ledger',         true),
  ('analytics',        'Advanced Analytics',        'Revenue trends, top sellers and customer behaviour',      true),
  ('credit_tracking',  'Credit Tracking',           'Track outstanding credit balances',                       true),
  ('receivables',      'Net Receivables Dashboard', 'Real-time view of who owes you money',                   true),
  ('customer_pnl',     'Customer-level P&L',        'Profit and loss breakdown per customer',                  true),
  ('unlimited_phones', 'Unlimited Inventory',       'Remove the 100-phone cap',                               true),
  ('bulk_orders',      'Multi-device Sale Orders',  'Add multiple devices to a single sale order',            true),
  -- Enterprise tier
  ('bulk_invoice',     'Bulk PDF Invoices',         'Batch PDF generation for multiple orders (coming soon)',  true),
  ('trade_network',    'Dealer Trade Network',      'Trade stock with verified dealers on the network (coming soon)', true),
  ('unlimited_seats',  'Unlimited Team Seats',      'No per-seat limits for large teams',                     true)
ON CONFLICT (flag_key) DO NOTHING;
