-- ─────────────────────────────────────────────────────────────────────────────
-- Device History Enrichment
--
-- Changes:
--   1. Add `price` and `location` columns to unit_lifecycle (internal analytics
--      only — not exposed in the app UI).
--   2. fn_sync_unit_registry — write real tenant name + purchase_price + address
--      instead of the hardcoded 'Authorized Partner' label.
--   3. fn_log_sale_lifecycle — same enrichment for SOLD events.
--   4. create_transfer — log a TRANSFER lifecycle event per device when a
--      trade-network transfer is initiated.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Extend unit_lifecycle table
ALTER TABLE public.unit_lifecycle
  ADD COLUMN IF NOT EXISTS price    NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS location TEXT;

-- 2. fn_sync_unit_registry — enrich PURCHASED events
CREATE OR REPLACE FUNCTION public.fn_sync_unit_registry()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_unit_id         UUID;
  v_tenant_name     TEXT;
  v_tenant_location TEXT;
BEGIN
  SELECT id INTO v_unit_id
  FROM public.unit_registry
  WHERE imei1 = ANY(NEW.imeis) OR imei2 = ANY(NEW.imeis)
  LIMIT 1;

  IF v_unit_id IS NULL THEN
    INSERT INTO public.unit_registry (brand, model, storage, color, ram, imei1, imei2)
    VALUES (
      NEW.brand, NEW.model, NEW.storage, NEW.color, NEW.ram,
      NEW.imeis[1],
      CASE WHEN array_length(NEW.imeis, 1) > 1 THEN NEW.imeis[2] ELSE NULL END
    )
    RETURNING id INTO v_unit_id;
  ELSE
    UPDATE public.unit_registry
    SET brand = NEW.brand, model = NEW.model, storage = NEW.storage,
        color = NEW.color, ram = NEW.ram, updated_at = now()
    WHERE id = v_unit_id;
  END IF;

  SELECT name, address INTO v_tenant_name, v_tenant_location
  FROM public.tenants
  WHERE id = NEW.tenant_id;

  INSERT INTO public.unit_lifecycle (unit_id, event_type, tenant_id, label, price, location)
  VALUES (
    v_unit_id,
    'PURCHASED',
    NEW.tenant_id,
    COALESCE(v_tenant_name, 'Authorized Partner'),
    NEW.purchase_price,
    v_tenant_location
  );

  RETURN NEW;
END;
$$;

ALTER FUNCTION public.fn_sync_unit_registry() OWNER TO postgres;

-- 3. fn_log_sale_lifecycle — enrich SOLD events
CREATE OR REPLACE FUNCTION public.fn_log_sale_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_unit_id         UUID;
  v_tenant_name     TEXT;
  v_tenant_location TEXT;
BEGIN
  IF NEW.status = 'SOLD' AND OLD.status != 'SOLD' THEN
    SELECT id INTO v_unit_id
    FROM public.unit_registry
    WHERE imei1 = ANY(NEW.imeis) OR imei2 = ANY(NEW.imeis)
    LIMIT 1;

    IF v_unit_id IS NOT NULL THEN
      SELECT name, address INTO v_tenant_name, v_tenant_location
      FROM public.tenants
      WHERE id = NEW.tenant_id;

      INSERT INTO public.unit_lifecycle (unit_id, event_type, tenant_id, label, price, location)
      VALUES (
        v_unit_id,
        'SOLD',
        NEW.tenant_id,
        COALESCE(v_tenant_name, 'Authorized Partner'),
        NEW.sale_price,
        v_tenant_location
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

ALTER FUNCTION public.fn_log_sale_lifecycle() OWNER TO postgres;

-- 4. create_transfer — log TRANSFER lifecycle events per device
CREATE OR REPLACE FUNCTION public.create_transfer(
  p_sale_order_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sender_tenant_id   UUID;
  v_sender_tenant_name TEXT;
  v_sender_location    TEXT;
  v_so                 RECORD;
  v_counterparty       RECORD;
  v_receiver_tenant_id UUID;
  v_mirror_cp_id       UUID;
  v_new_po_id          UUID;
  v_item               RECORD;
  v_so_item            RECORD;
  v_transfer_unit_id   UUID;
BEGIN
  SELECT tenant_id INTO v_sender_tenant_id FROM public.profiles WHERE id = auth.uid();
  IF v_sender_tenant_id IS NULL THEN RAISE EXCEPTION 'No tenant'; END IF;

  SELECT name, address INTO v_sender_tenant_name, v_sender_location
  FROM public.tenants WHERE id = v_sender_tenant_id;

  -- Fetch the sale order
  SELECT so.*, c.linked_tenant_id, c.name AS counterparty_name
  INTO v_so
  FROM public.sale_orders so
  JOIN public.counterparties c ON c.id = so.counterparty_id
  WHERE so.id = p_sale_order_id
    AND so.tenant_id = v_sender_tenant_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Sale order not found'; END IF;
  IF v_so.order_type <> 'TRANSFER' THEN RAISE EXCEPTION 'Order is not a TRANSFER type'; END IF;
  IF v_so.linked_tenant_id IS NULL THEN RAISE EXCEPTION 'Counterparty is not linked to a StockFlow business'; END IF;
  IF v_so.linked_transfer_id IS NOT NULL THEN RAISE EXCEPTION 'Transfer already initiated for this order'; END IF;

  v_receiver_tenant_id := v_so.linked_tenant_id;

  -- Get or create a mirror counterparty on the receiver's side pointing back to sender
  SELECT id INTO v_mirror_cp_id
  FROM public.counterparties
  WHERE tenant_id = v_receiver_tenant_id
    AND linked_tenant_id = v_sender_tenant_id
  LIMIT 1;

  IF v_mirror_cp_id IS NULL THEN
    v_mirror_cp_id := gen_random_uuid();
    INSERT INTO public.counterparties
      (id, tenant_id, name, type, linked_tenant_id, created_at, updated_at)
    VALUES
      (v_mirror_cp_id, v_receiver_tenant_id, v_sender_tenant_name, 'WHOLESALER', v_sender_tenant_id, now(), now());
  END IF;

  -- Create the mirror PO on the receiver's side
  v_new_po_id := gen_random_uuid();
  INSERT INTO public.purchase_orders
    (id, tenant_id, counterparty_id, acquisition_channel, platform_fee, total_amount,
     amount_paid, status, phones_ordered, phones_received,
     linked_transfer_id, created_at, updated_at)
  SELECT
    v_new_po_id,
    v_receiver_tenant_id,
    v_mirror_cp_id,
    'INTER_TENANT',
    0,
    so.total_amount,
    0,
    'AWAITING_RECEIPT',
    COUNT(soi.id),
    0,
    p_sale_order_id,
    now(),
    now()
  FROM public.sale_orders so
  JOIN public.sale_order_items soi ON soi.sale_order_id = so.id
  WHERE so.id = p_sale_order_id
  GROUP BY so.id, so.total_amount;

  -- Copy SO items as PO items
  INSERT INTO public.purchase_order_items
    (purchase_order_id, phone_id, purchase_price, brand, model, storage, color, ram, imei, status, created_at)
  SELECT
    v_new_po_id,
    NULL,
    soi.effective_price,
    soi.brand_snapshot,
    soi.model_snapshot,
    soi.storage_snapshot,
    soi.color_snapshot,
    NULL,
    soi.imei_snapshot[1],
    'PENDING_INSPECTION',
    now()
  FROM public.sale_order_items soi
  WHERE soi.sale_order_id = p_sale_order_id;

  -- Link the SO back to the mirror PO
  UPDATE public.sale_orders
  SET linked_transfer_id = v_new_po_id,
      transfer_status    = 'PENDING',
      updated_at         = now()
  WHERE id = p_sale_order_id AND tenant_id = v_sender_tenant_id;

  -- ── Log a TRANSFER lifecycle event per device ──────────────────────────────
  FOR v_so_item IN
    SELECT soi.imei_snapshot[1] AS imei, soi.effective_price AS price
    FROM public.sale_order_items soi
    WHERE soi.sale_order_id = p_sale_order_id
      AND soi.imei_snapshot[1] IS NOT NULL
  LOOP
    SELECT id INTO v_transfer_unit_id
    FROM public.unit_registry
    WHERE imei1 = v_so_item.imei OR imei2 = v_so_item.imei
    LIMIT 1;

    IF v_transfer_unit_id IS NOT NULL THEN
      INSERT INTO public.unit_lifecycle (unit_id, event_type, tenant_id, label, price, location)
      VALUES (
        v_transfer_unit_id,
        'TRANSFER',
        v_sender_tenant_id,
        v_sender_tenant_name,
        v_so_item.price,
        v_sender_location
      );
    END IF;
  END LOOP;
  -- ─────────────────────────────────────────────────────────────────────────

  -- Notify the receiver
  INSERT INTO public.notifications
    (tenant_id, type, title, body, metadata, created_at)
  VALUES (
    v_receiver_tenant_id,
    'TRANSFER_INBOUND',
    'Incoming Transfer',
    'New stock transfer from ' || v_sender_tenant_name,
    jsonb_build_object(
      'po_id',             v_new_po_id,
      'sender_tenant_id',  v_sender_tenant_id,
      'sender_name',       v_sender_tenant_name
    ),
    now()
  );

  RETURN jsonb_build_object(
    'po_id',              v_new_po_id,
    'receiver_tenant_id', v_receiver_tenant_id
  );
END;
$$;

ALTER FUNCTION public.create_transfer(UUID) OWNER TO postgres;
