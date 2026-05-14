-- ==========================================
-- ADMIN PANEL FEATURES: Audit Log, Feature Flags, Platform RPCs
-- ==========================================

-- 1. AUDIT LOG TABLE
-- Records all significant super-admin and system actions
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email TEXT,
  action      TEXT NOT NULL,            -- e.g. 'tenant.approved', 'tenant.suspended', 'flag.toggled'
  target_type TEXT,                     -- e.g. 'tenant', 'user', 'feature_flag'
  target_id   TEXT,                     -- UUID or identifier of the affected entity
  target_name TEXT,                     -- Human-readable name for quick display
  metadata    JSONB DEFAULT '{}',       -- Extra context (old_value, new_value, etc.)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor  ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- Only super-admins can read audit logs; no RLS updates by regular users
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin can read audit logs"
  ON public.audit_logs FOR SELECT
  USING (get_user_role() = 'super-admin');

CREATE POLICY "Super admin can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (get_user_role() = 'super-admin');

-- 2. FEATURE FLAGS TABLE
-- Global and per-tenant feature gate overrides
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key         TEXT NOT NULL UNIQUE,   -- e.g. 'billing', 'analytics', 'imei_scanner'
  display_name     TEXT NOT NULL,
  description      TEXT,
  enabled_globally BOOLEAN NOT NULL DEFAULT true,
  tenant_overrides JSONB DEFAULT '{}',     -- { "tenant_uuid": true/false }
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Super admin full access
CREATE POLICY "Super admin can manage feature flags"
  ON public.feature_flags FOR ALL
  USING (get_user_role() = 'super-admin');

-- Regular users can read flags (to check their own tenant overrides)
CREATE POLICY "Authenticated users can read feature flags"
  ON public.feature_flags FOR SELECT
  TO authenticated
  USING (true);

-- Seed default flags matching the app's FeatureKey enum
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

-- 3. PLATFORM ANALYTICS RPC (Revenue + Usage in one call)
-- Returns aggregate stats for the admin revenue dashboard
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
    ),
    'signups_by_month', (
      SELECT json_agg(row_to_json(sm))
      FROM (
        SELECT
          TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month,
          DATE_TRUNC('month', created_at) AS month_date,
          COUNT(*) AS count
        FROM public.tenants
        WHERE created_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month_date
      ) sm
    ),
    'expiring_soon', (
      SELECT json_agg(row_to_json(es))
      FROM (
        SELECT id, name, plan, plan_expires_at
        FROM public.tenants
        WHERE plan_expires_at IS NOT NULL
          AND plan_expires_at BETWEEN NOW() AND NOW() + INTERVAL '14 days'
          AND is_active = true
        ORDER BY plan_expires_at
      ) es
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

GRANT EXECUTE ON FUNCTION get_platform_revenue_stats() TO authenticated;

-- 4. USAGE ANALYTICS RPC
-- Per-tenant activity summary
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

-- 5. ONBOARDING FUNNEL RPC
CREATE OR REPLACE FUNCTION get_onboarding_funnel()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_requests',      (SELECT COUNT(*) FROM public.tenant_requests),
    'approved_requests',   (SELECT COUNT(*) FROM public.tenant_requests WHERE status = 'approved'),
    'rejected_requests',   (SELECT COUNT(*) FROM public.tenant_requests WHERE status = 'rejected'),
    'pending_requests',    (SELECT COUNT(*) FROM public.tenant_requests WHERE status = 'pending'),
    'total_tenants',       (SELECT COUNT(*) FROM public.tenants WHERE is_active = true),
    'tenants_with_phones', (
      SELECT COUNT(DISTINCT tenant_id) FROM public.phones
    ),
    'tenants_with_sales',  (
      SELECT COUNT(DISTINCT tenant_id) FROM public.phones WHERE status = 'SOLD'
    ),
    'avg_hours_to_first_phone', (
      SELECT ROUND(AVG(EXTRACT(EPOCH FROM (first_phone - t.created_at)) / 3600)::NUMERIC, 1)
      FROM public.tenants t
      JOIN (
        SELECT tenant_id, MIN(created_at) AS first_phone
        FROM public.phones
        GROUP BY tenant_id
      ) fp ON fp.tenant_id = t.id
    ),
    'recent_activations', (
      SELECT json_agg(row_to_json(ra))
      FROM (
        SELECT t.name, t.plan, t.created_at,
               MIN(ph.created_at) AS first_phone_at
        FROM public.tenants t
        JOIN public.phones ph ON ph.tenant_id = t.id
        GROUP BY t.id, t.name, t.plan, t.created_at
        ORDER BY t.created_at DESC
        LIMIT 10
      ) ra
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

GRANT EXECUTE ON FUNCTION get_onboarding_funnel() TO authenticated;

-- 6. SYSTEM HEALTH RPC (table row counts)
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
          n_dead_tup AS dead_rows,
          pg_size_pretty(pg_total_relation_size(relid)) AS total_size
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
          AND relname IN ('tenants','profiles','phones','ledger','tenant_requests',
                          'audit_logs','feature_flags','catalog_models_v2',
                          'sale_orders','sale_order_items','purchase_orders',
                          'purchase_order_items','wallets','wallet_transactions')
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
