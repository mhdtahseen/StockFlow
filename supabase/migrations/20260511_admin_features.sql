-- ==========================================
-- ADMIN PANEL INFRASTRUCTURE (CONSOLIDATED)
-- ==========================================

-- 1. AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email TEXT,
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   TEXT,
  target_name TEXT,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin can manage audit logs"
  ON public.audit_logs FOR ALL
  USING (get_user_role() = 'super-admin');

-- 2. FEATURE FLAGS TABLE
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key         TEXT NOT NULL UNIQUE,
  display_name     TEXT NOT NULL,
  description      TEXT,
  enabled_globally BOOLEAN NOT NULL DEFAULT true,
  tenant_overrides JSONB DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin can manage feature flags"
  ON public.feature_flags FOR ALL
  USING (get_user_role() = 'super-admin');

CREATE POLICY "Authenticated users can read feature flags"
  ON public.feature_flags FOR SELECT
  TO authenticated
  USING (true);

-- 3. SEED DATA

-- Default Feature Flags
INSERT INTO public.feature_flags (flag_key, display_name, description, enabled_globally) VALUES
  ('analytics',        'Analytics',          'Dashboard analytics and charts',            true),
  ('billing',          'Billing',            'Billing, invoices and payment tracking',     true),
  ('purchasing',       'Purchasing',         'Purchase order management',                  true),
  ('wallet',           'Wallet',             'Internal wallet and ledger features',        true),
  ('masterData',       'Master Data',        'Brand/model/storage master data management', true),
  ('imei_scanner',     'IMEI Scanner',       'Camera-based IMEI/serial number scanning',   true),
  ('public_sharing',   'Public Sharing',     'Share invoice/PO links publicly',            true),
  ('push_notifications','Push Notifications','Mobile push notification delivery',          true)
ON CONFLICT (flag_key) DO NOTHING;

-- Default Subscription Plans (if not already seeded)
INSERT INTO public.subscription_plans (id, name, price_monthly, price_yearly, currency, description, features, is_active)
VALUES 
    ('free', 'Free Tier', 0, 0, 'INR', 'Perfect for small shops just starting out.', ARRAY['1 User', 'Basic Inventory', 'Manual Sync'], true),
    ('starter', 'Starter', 999, 9990, 'INR', 'For growing businesses with dedicated staff.', ARRAY['3 Users', 'Advanced Reporting', 'Bulk Import'], true),
    ('pro', 'Pro', 2499, 24990, 'INR', 'Full featured platform for serious players.', ARRAY['10 Users', 'AI Analytics', 'Multi-location', 'Priority Support'], true),
    ('enterprise', 'Enterprise', 9999, 99990, 'INR', 'Custom limits and dedicated infrastructure.', ARRAY['Unlimited Users', 'API Access', 'Custom Domain', 'SLA Guarantee'], true)
ON CONFLICT (id) DO NOTHING;

-- 4. ANALYTICS RPCS

-- Usage Analytics (MATCHES UI)
CREATE OR REPLACE FUNCTION get_platform_usage_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'tenant_activity', (
      SELECT json_agg(row_to_json(ta))
      FROM (
        SELECT
          t.id,
          t.name,
          t.plan,
          t.is_active,
          t.created_at,
          COUNT(DISTINCT pr.id)                                              AS user_count,
          COUNT(DISTINCT ph.id)                                              AS total_phones,
          COUNT(DISTINCT ph.id) FILTER (WHERE ph.status = 'IN_STOCK')       AS phones_in_stock,
          COUNT(DISTINCT ph.id) FILTER (WHERE ph.status = 'SOLD')           AS phones_sold,
          COUNT(DISTINCT l.id)                                               AS ledger_entries,
          MAX(ph.created_at)                                                 AS last_phone_added,
          MAX(l.created_at)                                                  AS last_ledger_entry
        FROM public.tenants t
        LEFT JOIN public.profiles pr ON pr.tenant_id = t.id
        LEFT JOIN public.phones   ph ON ph.tenant_id = t.id
        LEFT JOIN public.ledger    l ON l.tenant_id  = t.id
        GROUP BY t.id, t.name, t.plan, t.is_active, t.created_at
        ORDER BY total_phones DESC
      ) ta
    ),
    'platform_totals', (
      SELECT json_build_object(
        'tenants',  (SELECT COUNT(*) FROM public.tenants),
        'users',    (SELECT COUNT(*) FROM public.profiles),
        'phones',   (SELECT COUNT(*) FROM public.phones),
        'sold',     (SELECT COUNT(*) FROM public.phones WHERE status = 'SOLD'),
        'ledger',   (SELECT COUNT(*) FROM public.ledger)
      )
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

GRANT EXECUTE ON FUNCTION get_platform_usage_stats() TO authenticated;

-- Revenue Stats
CREATE OR REPLACE FUNCTION get_platform_revenue_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'plan_distribution', (
      SELECT json_agg(row_to_json(pd))
      FROM (
        SELECT plan, COUNT(*) AS count
        FROM public.tenants
        WHERE is_active = true
        GROUP BY plan
        ORDER BY count DESC
      ) pd
    ),
    'total_active_tenants', (
      SELECT COUNT(*) FROM public.tenants WHERE is_active = true
    ),
    'total_suspended_tenants', (
      SELECT COUNT(*) FROM public.tenants WHERE is_active = false
    )
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

GRANT EXECUTE ON FUNCTION get_platform_revenue_stats() TO authenticated;

-- System Health
CREATE OR REPLACE FUNCTION get_system_health()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'table_stats', (
      SELECT json_agg(row_to_json(ts))
      FROM (
        SELECT
          relname AS table_name,
          n_live_tup AS live_rows,
          pg_size_pretty(pg_total_relation_size(relid)) AS total_size
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
          AND relname IN ('tenants','profiles','phones','ledger','tenant_requests','audit_logs','feature_flags')
        ORDER BY n_live_tup DESC
      ) ts
    ),
    'db_size', (
      SELECT pg_size_pretty(pg_database_size(current_database()))
    )
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

GRANT EXECUTE ON FUNCTION get_system_health() TO authenticated;
