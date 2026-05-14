-- Refinement of PO Receipt Integrity (v2.8.2)
-- Fixes Foreign Key constraint ordering and array mapping robustness

CREATE OR REPLACE FUNCTION certify_po_receipt(
  p_order_id UUID,
  p_items JSONB,
  p_status TEXT,
  p_phones_received INT, -- Recalculated below
  p_total_amount NUMERIC, -- Recalculated below
  p_tenant_id UUID,
  p_user_id UUID
) RETURNS VOID AS $$
DECLARE
  r RECORD;
BEGIN
  -- 1. Insert into inventory (phones) FIRST
  -- This is required because purchase_order_items.phone_id depends on phones.id (Foreign Key)
  INSERT INTO phones (
    id, tenant_id, user_id, brand, model, ram, storage, color, 
    imeis, purchase_price, sale_price, status, issue_tags, 
    purchase_order_id, created_at, updated_at
  )
  SELECT 
    (val->'phone'->>'id')::UUID,
    p_tenant_id,
    p_user_id,
    val->'phone'->>'brand',
    val->'phone'->>'model',
    COALESCE(val->'phone'->>'ram', 'N/A'),
    val->'phone'->>'storage',
    val->'phone'->>'color',
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(val->'phone'->'imeis', '[]'::jsonb))),
    (val->'phone'->>'purchasePrice')::NUMERIC,
    (val->'phone'->>'salePrice')::NUMERIC,
    val->'phone'->>'status',
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(val->'phone'->'issueTags', '[]'::jsonb))),
    p_order_id,
    COALESCE((val->'phone'->>'createdAt')::TIMESTAMPTZ, NOW()),
    NOW()
  FROM jsonb_array_elements(p_items) AS val
  WHERE val->>'status' = 'ACCEPTED' AND val ? 'phone'
  ON CONFLICT (id) DO UPDATE SET
    updated_at = NOW();

  -- 2. Update individual order items
  FOR r IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    id UUID,
    status TEXT,
    "phoneId" UUID,
    "rejectionReason" TEXT,
    "purchasePrice" NUMERIC,
    brand TEXT,
    model TEXT,
    storage TEXT,
    color TEXT,
    ram TEXT,
    imei TEXT,
    "issueTags" JSONB
  ) LOOP
    UPDATE purchase_order_items
    SET 
      status = r.status,
      phone_id = CASE WHEN r.status = 'ACCEPTED' THEN r."phoneId" ELSE NULL END,
      rejection_reason = r."rejectionReason",
      purchase_price = r."purchasePrice",
      brand = r.brand,
      model = r.model,
      storage = r.storage,
      color = r.color,
      ram = r.ram,
      imei = r.imei,
      issue_tags = ARRAY(SELECT jsonb_array_elements_text(COALESCE(r."issueTags", '[]'::jsonb))),
      updated_at = NOW()
    WHERE id = r.id;
  END LOOP;

  -- 3. Update Purchase Order Status and Totals (RECALCULATED)
  UPDATE purchase_orders
  SET 
    status = p_status,
    phones_received = (
      SELECT COUNT(*) 
      FROM purchase_order_items 
      WHERE purchase_order_id = p_order_id AND status = 'ACCEPTED'
    ),
    total_amount = (
      SELECT COALESCE(SUM(purchase_price), 0)
      FROM purchase_order_items 
      WHERE purchase_order_id = p_order_id AND status = 'ACCEPTED'
    ),
    updated_at = NOW()
  WHERE id = p_order_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

