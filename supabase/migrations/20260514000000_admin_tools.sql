-- ==========================================
-- ADMIN TOOL RPCs
-- ==========================================

-- 1. IMEI / DEVICE SEARCH ACROSS PLATFORM
CREATE OR REPLACE FUNCTION search_imei(p_query TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
  v_unit_id UUID;
BEGIN
  SELECT ur.id INTO v_unit_id
  FROM public.unit_registry ur
  WHERE ur.imei1 ILIKE '%' || p_query || '%'
     OR (ur.imei2 IS NOT NULL AND ur.imei2 ILIKE '%' || p_query || '%')
  LIMIT 1;

  SELECT json_build_object(
    'unit', (
      SELECT row_to_json(u)
      FROM (
        SELECT
          ur.id,
          ur.brand,
          ur.model,
          ur.storage,
          ur.color,
          ur.ram,
          ur.imei1,
          ur.imei2,
          ur.created_at,
          (
            SELECT t.name
            FROM public.tenants t
            JOIN public.phones ph ON ph.tenant_id = t.id
            WHERE ph.imeis @> ARRAY[ur.imei1]
               OR (ur.imei2 IS NOT NULL AND ph.imeis @> ARRAY[ur.imei2])
            LIMIT 1
          ) AS current_tenant_name,
          (
            SELECT ph.status
            FROM public.phones ph
            WHERE ph.imeis @> ARRAY[ur.imei1]
               OR (ur.imei2 IS NOT NULL AND ph.imeis @> ARRAY[ur.imei2])
            LIMIT 1
          ) AS current_status,
          (
            SELECT t.plan
            FROM public.tenants t
            JOIN public.phones ph ON ph.tenant_id = t.id
            WHERE ph.imeis @> ARRAY[ur.imei1]
               OR (ur.imei2 IS NOT NULL AND ph.imeis @> ARRAY[ur.imei2])
            LIMIT 1
          ) AS current_tenant_plan
        FROM public.unit_registry ur
        WHERE ur.id = v_unit_id
      ) u
    ),
    'lifecycle', (
      SELECT json_agg(row_to_json(lc) ORDER BY (lc).event_date ASC)
      FROM (
        SELECT
          ul.event_type,
          ul.event_date,
          ul.label,
          t.name AS tenant_name
        FROM public.unit_lifecycle ul
        LEFT JOIN public.tenants t ON t.id = ul.tenant_id
        WHERE ul.unit_id = v_unit_id
        ORDER BY ul.event_date ASC
      ) lc
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

GRANT EXECUTE ON FUNCTION search_imei(TEXT) TO authenticated;


-- 2. PLATFORM FINANCIAL STATS
CREATE OR REPLACE FUNCTION get_platform_financial_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'gmv',               (SELECT COALESCE(SUM(total_amount), 0) FROM public.sale_orders),
    'total_ar',          (SELECT COALESCE(SUM(total_amount - amount_paid), 0) FROM public.sale_orders WHERE status IN ('OPEN', 'PARTIAL')),
    'total_ap',          (SELECT COALESCE(SUM(total_amount - amount_paid), 0) FROM public.purchase_orders WHERE status IN ('AWAITING_RECEIPT', 'RECEIVED', 'PARTIAL')),
    'total_sales',       (SELECT COUNT(*) FROM public.sale_orders),
    'total_purchases',   (SELECT COUNT(*) FROM public.purchase_orders),
    'settled_sales',     (SELECT COUNT(*) FROM public.sale_orders WHERE status = 'SETTLED'),
    'total_inventory_value', (SELECT COALESCE(SUM(purchase_price), 0) FROM public.phones WHERE status = 'IN_STOCK'),
    'payment_modes', (
      SELECT COALESCE(json_agg(row_to_json(pm)), '[]'::json)
      FROM (
        SELECT payment_mode, COUNT(*) AS count, COALESCE(SUM(total_amount), 0) AS volume
        FROM public.sale_orders
        WHERE payment_mode IS NOT NULL
        GROUP BY payment_mode
        ORDER BY volume DESC
      ) pm
    ),
    'top_tenants_by_gmv', (
      SELECT COALESCE(json_agg(row_to_json(tt)), '[]'::json)
      FROM (
        SELECT t.name, t.plan, COALESCE(SUM(so.total_amount), 0) AS gmv, COUNT(so.id) AS order_count
        FROM public.tenants t
        JOIN public.sale_orders so ON so.tenant_id = t.id
        GROUP BY t.id, t.name, t.plan
        ORDER BY gmv DESC
        LIMIT 10
      ) tt
    ),
    'monthly_gmv', (
      SELECT COALESCE(json_agg(row_to_json(mg)), '[]'::json)
      FROM (
        SELECT
          TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month,
          DATE_TRUNC('month', created_at) AS month_date,
          COALESCE(SUM(total_amount), 0) AS gmv,
          COUNT(*) AS orders
        FROM public.sale_orders
        WHERE created_at > NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at) ASC
      ) mg
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

GRANT EXECUTE ON FUNCTION get_platform_financial_stats() TO authenticated;


-- 3. OVERDUE ORDERS ACROSS PLATFORM
CREATE OR REPLACE FUNCTION get_overdue_orders()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'overdue_sales', (
      SELECT COALESCE(json_agg(row_to_json(os)), '[]'::json)
      FROM (
        SELECT
          so.id,
          so.status,
          so.total_amount,
          so.amount_paid,
          (so.total_amount - so.amount_paid) AS outstanding,
          so.due_date,
          so.created_at,
          EXTRACT(DAY FROM (NOW() - so.due_date::TIMESTAMPTZ))::INT AS days_overdue,
          t.name  AS tenant_name,
          t.plan  AS tenant_plan,
          c.name  AS counterparty_name,
          c.phone AS counterparty_phone
        FROM public.sale_orders so
        JOIN public.tenants      t ON t.id = so.tenant_id
        JOIN public.counterparties c ON c.id = so.counterparty_id
        WHERE so.due_date IS NOT NULL
          AND so.due_date < CURRENT_DATE
          AND so.status IN ('OPEN', 'PARTIAL')
        ORDER BY days_overdue DESC
        LIMIT 100
      ) os
    ),
    'overdue_purchases', (
      SELECT COALESCE(json_agg(row_to_json(op)), '[]'::json)
      FROM (
        SELECT
          po.id,
          po.status,
          po.total_amount,
          po.amount_paid,
          (po.total_amount - po.amount_paid) AS outstanding,
          po.due_date,
          po.created_at,
          EXTRACT(DAY FROM (NOW() - po.due_date::TIMESTAMPTZ))::INT AS days_overdue,
          t.name  AS tenant_name,
          t.plan  AS tenant_plan,
          c.name  AS counterparty_name,
          c.phone AS counterparty_phone
        FROM public.purchase_orders po
        JOIN public.tenants        t ON t.id = po.tenant_id
        JOIN public.counterparties c ON c.id = po.counterparty_id
        WHERE po.due_date IS NOT NULL
          AND po.due_date < CURRENT_DATE
          AND po.status IN ('AWAITING_RECEIPT', 'RECEIVED', 'PARTIAL')
        ORDER BY days_overdue DESC
        LIMIT 100
      ) op
    ),
    'summary', (
      SELECT json_build_object(
        'total_overdue_sales',      (SELECT COUNT(*) FROM public.sale_orders WHERE due_date IS NOT NULL AND due_date < CURRENT_DATE AND status IN ('OPEN','PARTIAL')),
        'total_overdue_purchases',  (SELECT COUNT(*) FROM public.purchase_orders WHERE due_date IS NOT NULL AND due_date < CURRENT_DATE AND status IN ('AWAITING_RECEIPT','RECEIVED','PARTIAL')),
        'total_ar_overdue',         (SELECT COALESCE(SUM(total_amount - amount_paid),0) FROM public.sale_orders WHERE due_date IS NOT NULL AND due_date < CURRENT_DATE AND status IN ('OPEN','PARTIAL')),
        'total_ap_overdue',         (SELECT COALESCE(SUM(total_amount - amount_paid),0) FROM public.purchase_orders WHERE due_date IS NOT NULL AND due_date < CURRENT_DATE AND status IN ('AWAITING_RECEIPT','RECEIVED','PARTIAL'))
      )
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

GRANT EXECUTE ON FUNCTION get_overdue_orders() TO authenticated;
