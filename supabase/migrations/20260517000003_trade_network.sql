-- =====================================================================
-- Trade Network: Phase 1 + 2 + 3
-- =====================================================================
-- Adds:
--   • trade_code on tenants (auto-generated 6-char unique code)
--   • transfer_status + linked_transfer_id on sale_orders
--   • linked_transfer_id on purchase_orders
--   • RPC lookup_tenant_by_trade_code
--   • RPC link_counterparty_to_tenant
--   • RPC unlink_counterparty
--   • RPC create_transfer (creates mirror PO on receiver's tenant)
--   • RPC sync_transfer_status (called after certify_po_receipt)
-- =====================================================================

-- ── 1. trade_code column ─────────────────────────────────────────────

-- Helper: generates a random 6-char uppercase alphanumeric code
CREATE OR REPLACE FUNCTION public.generate_trade_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- no 0/O/1/I confusion
  code  TEXT := '';
  i     INT;
BEGIN
  FOR i IN 1..6 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::INT, 1);
  END LOOP;
  RETURN code;
END;
$$;

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS trade_code TEXT;

-- Generate codes for existing tenants that don't have one
DO $$
DECLARE
  t RECORD;
  new_code TEXT;
  attempts INT;
BEGIN
  FOR t IN SELECT id FROM public.tenants WHERE trade_code IS NULL LOOP
    attempts := 0;
    LOOP
      new_code := public.generate_trade_code();
      -- Check uniqueness
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.tenants WHERE trade_code = new_code);
      attempts := attempts + 1;
      IF attempts > 100 THEN RAISE EXCEPTION 'Could not generate unique trade code'; END IF;
    END LOOP;
    UPDATE public.tenants SET trade_code = new_code WHERE id = t.id;
  END LOOP;
END;
$$;

-- Enforce uniqueness + non-null
ALTER TABLE public.tenants
  ALTER COLUMN trade_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS tenants_trade_code_key ON public.tenants (trade_code);

-- Trigger: auto-generate trade_code on new tenant insert
CREATE OR REPLACE FUNCTION public.assign_trade_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
  attempts INT := 0;
BEGIN
  IF NEW.trade_code IS NULL THEN
    LOOP
      new_code := public.generate_trade_code();
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.tenants WHERE trade_code = new_code);
      attempts := attempts + 1;
      IF attempts > 100 THEN RAISE EXCEPTION 'Could not generate unique trade code'; END IF;
    END LOOP;
    NEW.trade_code := new_code;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_trade_code ON public.tenants;
CREATE TRIGGER trg_assign_trade_code
  BEFORE INSERT ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.assign_trade_code();

-- ── 2. transfer_status + linked_transfer_id on sale_orders ───────────

ALTER TABLE public.sale_orders
  ADD COLUMN IF NOT EXISTS transfer_status TEXT
    CHECK (transfer_status IN ('PENDING', 'ACCEPTED', 'PARTIAL', 'REJECTED')),
  ADD COLUMN IF NOT EXISTS linked_transfer_id UUID; -- FK to PO on receiver's side

ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS linked_transfer_id UUID; -- FK to SO on sender's side

-- ── 3. RPC: lookup_tenant_by_trade_code ──────────────────────────────
-- Public — returns minimal info only (no sensitive data)
CREATE OR REPLACE FUNCTION public.lookup_tenant_by_trade_code(
  p_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tenant RECORD;
BEGIN
  SELECT id, name, trade_code INTO v_tenant
  FROM public.tenants
  WHERE UPPER(trade_code) = UPPER(p_code)
    AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  RETURN jsonb_build_object(
    'found',       true,
    'tenant_id',   v_tenant.id,
    'name',        v_tenant.name,
    'trade_code',  v_tenant.trade_code
  );
END;
$$;

-- ── 4. RPC: link_counterparty_to_tenant ──────────────────────────────
CREATE OR REPLACE FUNCTION public.link_counterparty_to_tenant(
  p_counterparty_id UUID,
  p_trade_code      TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_my_tenant_id    UUID;
  v_target_tenant   RECORD;
  v_counterparty    RECORD;
BEGIN
  SELECT tenant_id INTO v_my_tenant_id FROM public.profiles WHERE id = auth.uid();
  IF v_my_tenant_id IS NULL THEN RAISE EXCEPTION 'No tenant'; END IF;

  -- Fetch the target tenant
  SELECT id, name INTO v_target_tenant
  FROM public.tenants
  WHERE UPPER(trade_code) = UPPER(p_trade_code)
    AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active business found with that Trade Code';
  END IF;

  -- Block self-linking
  IF v_target_tenant.id = v_my_tenant_id THEN
    RAISE EXCEPTION 'You cannot link to your own business';
  END IF;

  -- Verify counterparty belongs to calling tenant
  SELECT id INTO v_counterparty
  FROM public.counterparties
  WHERE id = p_counterparty_id AND tenant_id = v_my_tenant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Counterparty not found';
  END IF;

  -- Link it
  UPDATE public.counterparties
  SET linked_tenant_id = v_target_tenant.id,
      updated_at = now()
  WHERE id = p_counterparty_id AND tenant_id = v_my_tenant_id;

  RETURN jsonb_build_object(
    'linked',      true,
    'tenant_id',   v_target_tenant.id,
    'tenant_name', v_target_tenant.name
  );
END;
$$;

-- ── 5. RPC: unlink_counterparty ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.unlink_counterparty(
  p_counterparty_id UUID
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_my_tenant_id UUID;
BEGIN
  SELECT tenant_id INTO v_my_tenant_id FROM public.profiles WHERE id = auth.uid();
  IF v_my_tenant_id IS NULL THEN RAISE EXCEPTION 'No tenant'; END IF;

  UPDATE public.counterparties
  SET linked_tenant_id = NULL,
      updated_at = now()
  WHERE id = p_counterparty_id AND tenant_id = v_my_tenant_id;
END;
$$;

-- ── 6. RPC: create_transfer ───────────────────────────────────────────
-- Called after a TRANSFER sale order is committed on the sender's side.
-- Creates a mirror PO on the receiver's tenant.
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
  v_so                 RECORD;
  v_counterparty       RECORD;
  v_receiver_tenant_id UUID;
  v_mirror_cp_id       UUID;
  v_new_po_id          UUID;
  v_item               RECORD;
  v_so_item            RECORD;
BEGIN
  SELECT tenant_id INTO v_sender_tenant_id FROM public.profiles WHERE id = auth.uid();
  IF v_sender_tenant_id IS NULL THEN RAISE EXCEPTION 'No tenant'; END IF;

  SELECT name INTO v_sender_tenant_name FROM public.tenants WHERE id = v_sender_tenant_id;

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

  -- Copy SO items as PO items (price = effective_price on SO)
  INSERT INTO public.purchase_order_items
    (purchase_order_id, phone_id, purchase_price, brand, model, storage, color, ram, imei, status, created_at)
  SELECT
    v_new_po_id,
    NULL, -- new phone, not yet in receiver's inventory
    soi.effective_price,
    soi.brand_snapshot,
    soi.model_snapshot,
    soi.storage_snapshot,
    soi.color_snapshot,
    NULL,
    soi.imei_snapshot[1], -- first IMEI if multi
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

-- ── 7. RPC: sync_transfer_status ─────────────────────────────────────
-- Called after the receiver completes inspection (certify_po_receipt).
-- Updates the sender's SO transfer_status based on item acceptance.
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
  IF v_po.linked_transfer_id IS NULL THEN RETURN; END IF; -- not a transfer PO, nothing to do

  -- Count items by status
  SELECT
    COUNT(*)                                          INTO v_total_items
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
  WHERE id = v_po.linked_transfer_id; -- cross-tenant update (SECURITY DEFINER allows this)

  -- For REJECTED items: return phones to sender's inventory (IN_STOCK)
  IF v_new_transfer_status IN ('REJECTED', 'PARTIAL') THEN
    -- Find SO items that correspond to rejected PO items by matching imei/model
    -- The cleanest linkage: use imei_snapshot on SO items vs imei on PO items
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

  -- Notify the sender
  SELECT t.name INTO v_sender_tenant_name
  FROM public.sale_orders so
  JOIN public.tenants t ON t.id = so.tenant_id
  WHERE so.id = v_po.linked_transfer_id;

  INSERT INTO public.notifications
    (tenant_id, type, title, body, metadata, created_at)
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

-- ── Permissions ──────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.lookup_tenant_by_trade_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.link_counterparty_to_tenant(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlink_counterparty(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_transfer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_transfer_status(UUID) TO authenticated;
