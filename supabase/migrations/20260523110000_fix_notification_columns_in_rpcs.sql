-- =====================================================================
-- Fix: "column body of relation notifications does not exist"
-- =====================================================================
-- The notifications table uses columns (message, reference_id) but
-- several RPC functions (connect_by_trade_code, create_transfer,
-- sync_transfer_status) were inserting into non-existent columns
-- (body, metadata). This migration:
--   1. Makes user_id nullable (tenant-wide notifications have no user target)
--   2. Adds a metadata JSONB column for structured event data
--   3. Expands the type CHECK to include trade/transfer notification types
--   4. Redefines all three broken functions with correct column names
-- =====================================================================

-- ── 1. Schema changes ────────────────────────────────────────────────

-- Allow tenant-wide notifications without a specific user target
ALTER TABLE public.notifications ALTER COLUMN user_id DROP NOT NULL;

-- Add metadata column for structured notification payloads
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Expand type CHECK to include trade network notification types
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (
  type = ANY (ARRAY[
    'PHONE_SOLD'::text,
    'ROLE_PROMOTED'::text,
    'LEDGER_ENTRY'::text,
    'SYSTEM_ALERT'::text,
    'PAYMENT_DUE'::text,
    'CONNECTION_ACCEPTED'::text,
    'TRANSFER_INBOUND'::text,
    'TRANSFER_UPDATE'::text
  ])
);

-- ── 2. Fix connect_by_trade_code ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.connect_by_trade_code(
  p_trade_code    TEXT,
  p_type_for_me   TEXT,
  p_type_for_them TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_my_tenant_id        UUID;
  v_my_tenant_name      TEXT;
  v_my_tenant_gstin     TEXT;
  v_target              RECORD;
  v_existing_cp_id      UUID;
  v_my_cp_id            UUID;
  v_their_cp_id         UUID;
BEGIN
  -- Identify caller's tenant
  SELECT tenant_id INTO v_my_tenant_id
  FROM public.profiles WHERE id = auth.uid();
  IF v_my_tenant_id IS NULL THEN RAISE EXCEPTION 'No tenant found for current user'; END IF;

  SELECT name, gstin INTO v_my_tenant_name, v_my_tenant_gstin FROM public.tenants WHERE id = v_my_tenant_id;

  -- Resolve target tenant by trade code
  SELECT id, name, gstin INTO v_target
  FROM public.tenants
  WHERE UPPER(trade_code) = UPPER(p_trade_code)
    AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active Finventree business found with that Trade Code';
  END IF;

  -- Block self-connection
  IF v_target.id = v_my_tenant_id THEN
    RAISE EXCEPTION 'You cannot connect to your own business';
  END IF;

  -- Idempotency: check if counterparty already exists on my side for this tenant
  SELECT id INTO v_existing_cp_id
  FROM public.counterparties
  WHERE tenant_id = v_my_tenant_id
    AND linked_tenant_id = v_target.id
    AND deleted_at IS NULL
  LIMIT 1;

  IF v_existing_cp_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'counterparty_id',   v_existing_cp_id,
      'their_name',        v_target.name,
      'already_connected', true
    );
  END IF;

  -- Create counterparty on MY side
  v_my_cp_id := gen_random_uuid();
  INSERT INTO public.counterparties
    (id, tenant_id, name, type, linked_tenant_id, gstin, created_at, updated_at)
  VALUES
    (v_my_cp_id, v_my_tenant_id, v_target.name, p_type_for_me, v_target.id, v_target.gstin, now(), now());

  -- Create counterparty on THEIR side (if not already present)
  SELECT id INTO v_their_cp_id
  FROM public.counterparties
  WHERE tenant_id = v_target.id
    AND linked_tenant_id = v_my_tenant_id
    AND deleted_at IS NULL
  LIMIT 1;

  IF v_their_cp_id IS NULL THEN
    v_their_cp_id := gen_random_uuid();
    INSERT INTO public.counterparties
      (id, tenant_id, name, type, linked_tenant_id, gstin, created_at, updated_at)
    VALUES
      (v_their_cp_id, v_target.id, v_my_tenant_name, p_type_for_them, v_my_tenant_id, v_my_tenant_gstin, now(), now());
  END IF;

  -- Notify the other business (correct columns: message + metadata)
  INSERT INTO public.notifications
    (tenant_id, type, title, message, metadata, created_at)
  VALUES (
    v_target.id,
    'CONNECTION_ACCEPTED',
    'New Trade Connection',
    v_my_tenant_name || ' connected with your business on Finventree',
    jsonb_build_object(
      'counterparty_id',    v_their_cp_id,
      'their_tenant_id',    v_my_tenant_id,
      'their_tenant_name',  v_my_tenant_name
    ),
    now()
  );

  RETURN jsonb_build_object(
    'counterparty_id',   v_my_cp_id,
    'their_name',        v_target.name,
    'their_cp_id',       v_their_cp_id,
    'already_connected', false
  );
END;
$$;

-- ── 3. Fix create_transfer ───────────────────────────────────────────
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

  -- Log a TRANSFER lifecycle event per device
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

  -- Notify the receiver (correct columns: message + metadata)
  INSERT INTO public.notifications
    (tenant_id, type, title, message, metadata, created_at)
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

-- ── 4. Fix sync_transfer_status ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_transfer_status(
  p_po_id UUID
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_receiver_tenant_id UUID;
  v_po                 RECORD;
  v_total_items        INT;
  v_accepted_items     INT;
  v_rejected_items     INT;
  v_new_transfer_status TEXT;
  v_sender_tenant_name  TEXT;
BEGIN
  SELECT tenant_id INTO v_receiver_tenant_id FROM public.profiles WHERE id = auth.uid();

  -- Fetch the PO
  SELECT * INTO v_po FROM public.purchase_orders
  WHERE id = p_po_id AND tenant_id = v_receiver_tenant_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'PO not found'; END IF;
  IF v_po.linked_transfer_id IS NULL THEN RETURN; END IF;

  -- Count items by status
  SELECT COUNT(*) INTO v_total_items
  FROM public.purchase_order_items WHERE purchase_order_id = p_po_id;

  SELECT COUNT(*) INTO v_accepted_items
  FROM public.purchase_order_items WHERE purchase_order_id = p_po_id AND status = 'ACCEPTED';

  SELECT COUNT(*) INTO v_rejected_items
  FROM public.purchase_order_items WHERE purchase_order_id = p_po_id AND status = 'REJECTED';

  -- Determine new transfer status
  IF v_accepted_items = v_total_items THEN
    v_new_transfer_status := 'ACCEPTED';
  ELSIF v_rejected_items = v_total_items THEN
    v_new_transfer_status := 'REJECTED';
  ELSE
    v_new_transfer_status := 'PARTIAL';
  END IF;

  -- Update the sender's SO
  UPDATE public.sale_orders
  SET transfer_status = v_new_transfer_status,
      updated_at      = now()
  WHERE id = v_po.linked_transfer_id;

  -- For REJECTED items: return phones to sender's inventory
  IF v_new_transfer_status IN ('REJECTED', 'PARTIAL') THEN
    UPDATE public.phones ph
    SET status     = 'IN_STOCK',
        updated_at = now()
    FROM public.sale_order_items soi
    JOIN public.purchase_order_items poi
      ON poi.imei = soi.imei_snapshot[1]
    WHERE soi.sale_order_id  = v_po.linked_transfer_id
      AND poi.purchase_order_id = p_po_id
      AND poi.status = 'REJECTED'
      AND ph.id = soi.phone_id;
  END IF;

  -- Notify the sender (correct columns: message + metadata)
  INSERT INTO public.notifications
    (tenant_id, type, title, message, metadata, created_at)
  SELECT
    so.tenant_id,
    'TRANSFER_UPDATE',
    CASE v_new_transfer_status
      WHEN 'ACCEPTED' THEN 'Transfer Accepted'
      WHEN 'REJECTED' THEN 'Transfer Rejected'
      ELSE 'Transfer Partially Accepted'
    END,
    CASE v_new_transfer_status
      WHEN 'ACCEPTED' THEN 'All devices accepted by the receiving business'
      WHEN 'REJECTED' THEN 'All devices were rejected — they will return to stock'
      ELSE v_accepted_items::TEXT || ' of ' || v_total_items::TEXT || ' devices accepted'
    END,
    jsonb_build_object(
      'po_id',          p_po_id,
      'so_id',          v_po.linked_transfer_id,
      'accepted',       v_accepted_items,
      'rejected',       v_rejected_items,
      'total',          v_total_items
    ),
    now()
  FROM public.sale_orders so
  WHERE so.id = v_po.linked_transfer_id;
END;
$$;

-- ── 5. Ensure INSERT policy exists for notifications (SECURITY DEFINER funcs bypass RLS,
--        but future direct inserts from authenticated users may need it) ──
-- No change needed — the functions use SECURITY DEFINER so RLS is bypassed.

-- ── 6. Grants ────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.connect_by_trade_code(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_transfer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_transfer_status(UUID) TO authenticated;
