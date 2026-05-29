-- =============================================================================
-- Fix: create_purchase_order was attempting to insert a jsonb array into the
--      issue_tags column of purchase_order_items, which is of type text[].
--      This caused the error:
--        column "issue_tags" is of type text[] but expression is of type jsonb
--
--      Fix: cast the jsonb array to a text array using jsonb_array_elements_text,
--      just like it was already doing for the phones table insert.
-- =============================================================================

CREATE OR REPLACE FUNCTION "public"."create_purchase_order"(
  "p_order_id"        uuid,
  "p_counterparty_id" uuid,
  "p_channel"         text,
  "p_platform_fee"    numeric,
  "p_payment_mode"    text,
  "p_initial_payment" numeric,
  "p_due_date"        date,
  "p_notes"           text,
  "p_items"           jsonb,
  "p_payment_note"    text    DEFAULT NULL,
  -- GST (all optional — defaults preserve pre-GST behaviour)
  "p_gst_enabled"     boolean DEFAULT FALSE,
  "p_gst_inclusive"   boolean DEFAULT TRUE,
  "p_gst_type"        text    DEFAULT NULL,
  "p_gst_rate"        numeric DEFAULT NULL,
  "p_subtotal"        numeric DEFAULT NULL,
  "p_cgst_amount"     numeric DEFAULT NULL,
  "p_sgst_amount"     numeric DEFAULT NULL,
  "p_igst_amount"     numeric DEFAULT NULL,
  "p_seller_gstin"    text    DEFAULT NULL
) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_tenant_id       UUID;
  v_user_id         UUID;
  v_payment_id      UUID;
  v_total           NUMERIC(12,2) := 0;
  v_status          TEXT;
  v_item            JSONB;
  v_phones_received INT := 0;
BEGIN
  -- Idempotency guard
  IF EXISTS (SELECT 1 FROM public.purchase_orders WHERE id = p_order_id) THEN
    SELECT total_amount, status INTO v_total, v_status
      FROM public.purchase_orders WHERE id = p_order_id;
    RETURN jsonb_build_object('order_id', p_order_id, 'total', v_total, 'status', v_status, 'synced', true);
  END IF;

  SELECT tenant_id INTO v_tenant_id FROM public.profiles WHERE id = auth.uid();
  v_user_id := auth.uid();
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'No tenant'; END IF;

  -- Calculate total from items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_total := v_total + (v_item->>'purchase_price')::NUMERIC;
  END LOOP;
  v_total := v_total + COALESCE(p_platform_fee, 0);

  v_status := CASE
    WHEN p_initial_payment <= 0 THEN 'AWAITING_RECEIPT'
    WHEN p_initial_payment >= v_total THEN 'SETTLED'
    ELSE 'PARTIAL'
  END;

  -- Count how many items are immediately accepted (AddDevices path)
  SELECT COUNT(*) INTO v_phones_received
    FROM jsonb_array_elements(p_items) AS elem
   WHERE (elem->>'item_status') = 'ACCEPTED';

  -- Insert order row
  INSERT INTO public.purchase_orders (
    id, tenant_id, counterparty_id, acquisition_channel, platform_fee,
    phones_ordered, phones_received, total_amount, amount_paid, status,
    payment_mode, due_date, notes
  ) VALUES (
    p_order_id, v_tenant_id, p_counterparty_id,
    COALESCE(p_channel, 'DIRECT'), COALESCE(p_platform_fee, 0),
    jsonb_array_length(p_items), v_phones_received, v_total,
    GREATEST(p_initial_payment, 0), v_status,
    NULLIF(p_payment_mode, ''), p_due_date, p_notes
  );

  -- GST: atomic UPDATE within same transaction
  IF p_gst_enabled THEN
    UPDATE public.purchase_orders SET
      gst_enabled   = TRUE,
      gst_inclusive = p_gst_inclusive,
      gst_type      = p_gst_type,
      gst_rate      = p_gst_rate,
      subtotal      = p_subtotal,
      cgst_amount   = p_cgst_amount,
      sgst_amount   = p_sgst_amount,
      igst_amount   = p_igst_amount,
      seller_gstin  = p_seller_gstin
    WHERE id = p_order_id;
  END IF;

  -- Insert items + handle phones (UPSERT for AddDevices, UPDATE for inspection path)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP

    -- Insert purchase_order_items row.
    -- item_status key drives the status column (defaults to PENDING_INSPECTION).
    INSERT INTO public.purchase_order_items (
      purchase_order_id, phone_id, purchase_price, status,
      brand, model, storage, color, ram, imei, issue_tags,
      hsn_code, gst_rate, taxable_value, cgst_amount, sgst_amount, igst_amount
    ) VALUES (
      p_order_id,
      (v_item->>'phone_id')::UUID,
      (v_item->>'purchase_price')::NUMERIC,
      COALESCE(v_item->>'item_status', 'PENDING_INSPECTION'),
      v_item->>'brand', v_item->>'model', v_item->>'storage',
      v_item->>'color',  v_item->>'ram',   v_item->>'imei',
      ARRAY(SELECT jsonb_array_elements_text(COALESCE((v_item->'issue_tags')::jsonb, '[]'::jsonb))),
      v_item->>'hsn_code',
      COALESCE((v_item->>'gst_rate')::NUMERIC,     NULL),
      COALESCE((v_item->>'taxable_value')::NUMERIC, NULL),
      COALESCE((v_item->>'cgst_amount')::NUMERIC,  NULL),
      COALESCE((v_item->>'sgst_amount')::NUMERIC,  NULL),
      COALESCE((v_item->>'igst_amount')::NUMERIC,  NULL)
    );

    -- Phone handling:
    -- If 'phone_status' key is present → AddDevices path: UPSERT phone into inventory.
    -- Otherwise → PurchaseOrders inspection path: just UPDATE existing phone (if any).
    IF (v_item->>'phone_status') IS NOT NULL AND (v_item->>'phone_id') IS NOT NULL THEN
      -- Atomically insert (or update if ID already exists due to optimistic local dispatch)
      INSERT INTO public.phones (
        id, tenant_id, purchase_order_id, brand, model, storage, color, ram,
        imeis, purchase_price, status, issue_tags, created_at, updated_at
      ) VALUES (
        (v_item->>'phone_id')::UUID,
        v_tenant_id,
        p_order_id,
        v_item->>'brand',
        v_item->>'model',
        v_item->>'storage',
        v_item->>'color',
        COALESCE(v_item->>'ram', 'N/A'),
        ARRAY(SELECT jsonb_array_elements_text(COALESCE((v_item->'imeis')::jsonb, '[]'::jsonb))),
        (v_item->>'purchase_price')::NUMERIC,
        v_item->>'phone_status',
        ARRAY(SELECT jsonb_array_elements_text(COALESCE((v_item->'issue_tags')::jsonb, '[]'::jsonb))),
        COALESCE((v_item->>'created_at')::TIMESTAMPTZ, NOW()),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        purchase_order_id = p_order_id,
        purchase_price    = EXCLUDED.purchase_price,
        status            = EXCLUDED.status,
        updated_at        = NOW();

    ELSIF (v_item->>'phone_id') IS NOT NULL THEN
      -- Inspection path: phone will be inserted later via certify_po_receipt.
      -- Only link the purchase_order_id if the phone already exists.
      UPDATE public.phones
        SET purchase_order_id = p_order_id,
        purchase_price    = (v_item->>'purchase_price')::NUMERIC,
        updated_at        = NOW()
      WHERE id = (v_item->>'phone_id')::UUID AND tenant_id = v_tenant_id;
    END IF;

  END LOOP;

  -- Platform fee ledger entry
  IF COALESCE(p_platform_fee, 0) > 0 THEN
    INSERT INTO public.ledger (
      tenant_id, user_id, type, purchase_order_id, amount, payment_mode, note
    ) VALUES (
      v_tenant_id, v_user_id, 'PLATFORM_FEE', p_order_id,
      -p_platform_fee, COALESCE(NULLIF(p_payment_mode, ''), 'CASH'), 'Platform Fee Deduction'
    );
  END IF;

  -- Initial payment ledger entries
  IF p_initial_payment > 0 THEN
    INSERT INTO public.supplier_payments (
      tenant_id, counterparty_id, total_paid, mode, note, recorded_by, type
    ) VALUES (
      v_tenant_id, p_counterparty_id, p_initial_payment,
      COALESCE(NULLIF(p_payment_mode, ''), 'CASH'), p_payment_note, v_user_id, 'ADVANCE'
    ) RETURNING id INTO v_payment_id;

    INSERT INTO public.supplier_allocations (
      supplier_payment_id, purchase_order_id, amount_allocated, note
    ) VALUES (v_payment_id, p_order_id, p_initial_payment, 'Advance Payment');

    INSERT INTO public.ledger (
      tenant_id, user_id, type, purchase_order_id,
      supplier_payment_id, amount, payment_mode, note
    ) VALUES (
      v_tenant_id, v_user_id, 'SUPPLIER_PAYMENT', p_order_id,
      v_payment_id, -p_initial_payment,
      NULLIF(p_payment_mode, ''), COALESCE(p_payment_note, 'Advance Payment')
    );
  END IF;

  RETURN jsonb_build_object('order_id', p_order_id, 'total', v_total, 'status', v_status);
END;
$$;
