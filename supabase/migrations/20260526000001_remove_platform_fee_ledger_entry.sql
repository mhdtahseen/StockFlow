-- Migration: Remove PLATFORM_FEE as a separate ledger entry type
--
-- Platform fees are part of the total purchase cost. They're already included
-- in purchase_orders.total_amount (items + platform_fee). Payments toward the PO
-- (SUPPLIER_PAYMENT entries) already cover the full amount including fees.
--
-- A separate PLATFORM_FEE ledger entry was double-counting the fee as an expense.
-- Additionally, the ledger check constraint doesn't allow 'PLATFORM_FEE', causing
-- PO creation to fail when platform_fee > 0.
--
-- The platform_fee column on purchase_orders remains as display/reporting metadata.

-- 1. Remove any orphaned PLATFORM_FEE ledger rows (double-counted expenses)
DELETE FROM public.ledger WHERE type = 'PLATFORM_FEE';

-- 2. Fix create_purchase_order: remove PLATFORM_FEE ledger INSERT
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
  v_tenant_id  UUID;
  v_user_id    UUID;
  v_payment_id UUID;
  v_total      NUMERIC(12,2) := 0;
  v_status     TEXT;
  v_item       JSONB;
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

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_total := v_total + (v_item->>'purchase_price')::NUMERIC;
  END LOOP;
  v_total := v_total + COALESCE(p_platform_fee, 0);

  v_status := CASE
    WHEN p_initial_payment <= 0 THEN 'AWAITING_RECEIPT'
    WHEN p_initial_payment >= v_total THEN 'SETTLED'
    ELSE 'PARTIAL'
  END;

  -- Insert order row
  INSERT INTO public.purchase_orders (
    id, tenant_id, counterparty_id, acquisition_channel, platform_fee,
    phones_ordered, total_amount, amount_paid, status, payment_mode, due_date, notes
  ) VALUES (
    p_order_id, v_tenant_id, p_counterparty_id,
    COALESCE(p_channel, 'DIRECT'), COALESCE(p_platform_fee, 0),
    jsonb_array_length(p_items), v_total, GREATEST(p_initial_payment, 0),
    v_status, NULLIF(p_payment_mode, ''), p_due_date, p_notes
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

  -- Insert items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO public.purchase_order_items (
      purchase_order_id, phone_id, purchase_price, status,
      brand, model, storage, color, ram, imei, issue_tags,
      hsn_code, gst_rate, taxable_value, cgst_amount, sgst_amount, igst_amount
    ) VALUES (
      p_order_id,
      (v_item->>'phone_id')::UUID,
      (v_item->>'purchase_price')::NUMERIC,
      'PENDING_INSPECTION',
      v_item->>'brand', v_item->>'model', v_item->>'storage',
      v_item->>'color',  v_item->>'ram',   v_item->>'imei',
      COALESCE((v_item->>'issue_tags')::jsonb, '[]'::jsonb),
      v_item->>'hsn_code',
      COALESCE((v_item->>'gst_rate')::NUMERIC,     NULL),
      COALESCE((v_item->>'taxable_value')::NUMERIC, NULL),
      COALESCE((v_item->>'cgst_amount')::NUMERIC,  NULL),
      COALESCE((v_item->>'sgst_amount')::NUMERIC,  NULL),
      COALESCE((v_item->>'igst_amount')::NUMERIC,  NULL)
    );

    IF (v_item->>'phone_id') IS NOT NULL THEN
      UPDATE public.phones
        SET purchase_order_id = p_order_id,
            purchase_price    = (v_item->>'purchase_price')::NUMERIC,
            updated_at        = now()
      WHERE id = (v_item->>'phone_id')::UUID AND tenant_id = v_tenant_id;
    END IF;
  END LOOP;

  -- Platform fee: NOT recorded as separate ledger entry.
  -- It is part of total_amount and settles through SUPPLIER_PAYMENT entries.
  -- The purchase_orders.platform_fee column preserves the fee for display/reporting.

  -- Initial payment
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

ALTER FUNCTION public.create_purchase_order(uuid, uuid, text, numeric, text, numeric, date, text, jsonb, text, boolean, boolean, text, numeric, numeric, numeric, numeric, numeric, text)
  OWNER TO postgres;

-- 3. Fix edit_purchase_order: remove PLATFORM_FEE ledger UPDATE
CREATE OR REPLACE FUNCTION public.edit_purchase_order(
  p_order_id       UUID,
  p_counterparty_id UUID,
  p_channel        TEXT,
  p_platform_fee   NUMERIC,
  p_due_date       DATE,
  p_notes          TEXT,
  p_items          JSONB
) RETURNS JSONB
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_tenant_id     UUID;
  v_user_id       UUID;
  v_editor_name   TEXT;
  v_po            RECORD;
  v_old_item      RECORD;
  v_item          JSONB;
  v_item_id       UUID;
  v_new_total     NUMERIC(12,2) := 0;
  v_new_status    TEXT;
  v_diff          JSONB := '{}'::JSONB;
  v_items_added   JSONB := '[]'::JSONB;
  v_items_removed JSONB := '[]'::JSONB;
  v_items_changed JSONB := '[]'::JSONB;
  v_incoming_ids  UUID[];
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM public.profiles WHERE id = auth.uid();
  v_user_id := auth.uid();
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'No tenant'; END IF;

  -- Lock + fetch existing PO
  SELECT * INTO v_po FROM public.purchase_orders
  WHERE id = p_order_id AND tenant_id = v_tenant_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Purchase order not found'; END IF;
  IF v_po.deleted_at IS NOT NULL THEN RAISE EXCEPTION 'Cannot edit a deleted purchase order'; END IF;
  IF v_po.status = 'CANCELLED' THEN RAISE EXCEPTION 'Cannot edit a cancelled purchase order'; END IF;

  -- Editor name for audit
  SELECT full_name INTO v_editor_name FROM public.profiles WHERE id = v_user_id;

  -- ── Diff: top-level field changes ──────────────────────────────────
  IF v_po.counterparty_id <> p_counterparty_id THEN
    v_diff := v_diff || jsonb_build_object('counterparty_id',
      jsonb_build_object('old', v_po.counterparty_id, 'new', p_counterparty_id));
  END IF;
  IF COALESCE(v_po.platform_fee, 0) <> COALESCE(p_platform_fee, 0) THEN
    v_diff := v_diff || jsonb_build_object('platform_fee',
      jsonb_build_object('old', v_po.platform_fee, 'new', p_platform_fee));
  END IF;
  IF COALESCE(v_po.notes, '') <> COALESCE(p_notes, '') THEN
    v_diff := v_diff || jsonb_build_object('notes',
      jsonb_build_object('old', v_po.notes, 'new', p_notes));
  END IF;
  IF COALESCE(v_po.due_date::TEXT, '') <> COALESCE(p_due_date::TEXT, '') THEN
    v_diff := v_diff || jsonb_build_object('due_date',
      jsonb_build_object('old', v_po.due_date, 'new', p_due_date));
  END IF;
  IF COALESCE(v_po.acquisition_channel, '') <> COALESCE(p_channel, '') THEN
    v_diff := v_diff || jsonb_build_object('acquisition_channel',
      jsonb_build_object('old', v_po.acquisition_channel, 'new', p_channel));
  END IF;

  -- ── Collect incoming item IDs ───────────────────────────────────────
  SELECT ARRAY(
    SELECT (elem->>'id')::UUID
    FROM jsonb_array_elements(p_items) AS elem
    WHERE elem->>'id' IS NOT NULL
  ) INTO v_incoming_ids;

  -- ── Check: block removal of items with existing phones ─────────────
  FOR v_old_item IN
    SELECT poi.id, poi.brand, poi.model, poi.purchase_price
    FROM public.purchase_order_items poi
    WHERE poi.purchase_order_id = p_order_id
      AND poi.phone_id IS NOT NULL
      AND poi.id <> ALL(COALESCE(v_incoming_ids, ARRAY[]::UUID[]))
  LOOP
    RAISE EXCEPTION 'Cannot remove item (% %) — phone already exists in inventory. Remove the phone first.',
      v_old_item.brand, v_old_item.model;
  END LOOP;

  -- ── Remove items not in incoming list (only allowed if no phone) ────
  FOR v_old_item IN
    SELECT id, brand, model, purchase_price
    FROM public.purchase_order_items
    WHERE purchase_order_id = p_order_id
      AND id <> ALL(COALESCE(v_incoming_ids, ARRAY[]::UUID[]))
  LOOP
    DELETE FROM public.purchase_order_items WHERE id = v_old_item.id;
    v_items_removed := v_items_removed || jsonb_build_array(
      jsonb_build_object('brand', v_old_item.brand, 'model', v_old_item.model,
                         'price', v_old_item.purchase_price));
  END LOOP;

  -- ── Upsert items ────────────────────────────────────────────────────
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_item_id := (v_item->>'id')::UUID;

    IF v_item_id IS NOT NULL THEN
      FOR v_old_item IN
        SELECT * FROM public.purchase_order_items WHERE id = v_item_id
      LOOP
        IF v_old_item.purchase_price <> (v_item->>'purchase_price')::NUMERIC THEN
          v_items_changed := v_items_changed || jsonb_build_array(jsonb_build_object(
            'brand', v_old_item.brand, 'model', v_old_item.model,
            'old_price', v_old_item.purchase_price,
            'new_price', (v_item->>'purchase_price')::NUMERIC
          ));
          IF v_old_item.phone_id IS NOT NULL THEN
            UPDATE public.phones
            SET purchase_price = (v_item->>'purchase_price')::NUMERIC,
                updated_at = now()
            WHERE id = v_old_item.phone_id AND tenant_id = v_tenant_id;
          END IF;
        END IF;
      END LOOP;

      UPDATE public.purchase_order_items
      SET purchase_price = (v_item->>'purchase_price')::NUMERIC,
          brand          = COALESCE(v_item->>'brand', brand),
          model          = COALESCE(v_item->>'model', model),
          storage        = COALESCE(v_item->>'storage', storage),
          color          = COALESCE(v_item->>'color', color),
          ram            = COALESCE(v_item->>'ram', ram),
          imei           = COALESCE(v_item->>'imei', imei),
          issue_tags     = COALESCE((v_item->>'issue_tags')::JSONB, issue_tags::JSONB),
          updated_at     = now()
      WHERE id = v_item_id AND purchase_order_id = p_order_id;

    ELSE
      INSERT INTO public.purchase_order_items
        (purchase_order_id, purchase_price, brand, model, storage, color, ram, imei, issue_tags)
      VALUES (
        p_order_id,
        (v_item->>'purchase_price')::NUMERIC,
        v_item->>'brand', v_item->>'model', v_item->>'storage', v_item->>'color',
        v_item->>'ram', v_item->>'imei',
        COALESCE((v_item->>'issue_tags')::JSONB, '[]'::JSONB)
      );
      v_items_added := v_items_added || jsonb_build_array(jsonb_build_object(
        'brand', v_item->>'brand', 'model', v_item->>'model',
        'price', (v_item->>'purchase_price')::NUMERIC
      ));
    END IF;

    v_new_total := v_new_total + (v_item->>'purchase_price')::NUMERIC;
  END LOOP;

  -- Add platform fee to total
  v_new_total := v_new_total + COALESCE(p_platform_fee, 0);

  -- ── Recalculate payment status ──────────────────────────────────────
  v_new_status := CASE
    WHEN v_po.status = 'AWAITING_RECEIPT' AND v_po.amount_paid = 0 THEN 'AWAITING_RECEIPT'
    WHEN v_po.status = 'AWAITING_RECEIPT' AND v_po.amount_paid > 0 AND v_po.amount_paid < v_new_total THEN 'PARTIAL'
    WHEN v_po.status = 'AWAITING_RECEIPT' AND v_po.amount_paid >= v_new_total THEN 'SETTLED'
    WHEN v_po.amount_paid = 0 THEN 'RECEIVED'
    WHEN v_po.amount_paid >= v_new_total THEN 'SETTLED'
    ELSE 'PARTIAL'
  END;

  -- ── Update PO ───────────────────────────────────────────────────────
  UPDATE public.purchase_orders
  SET counterparty_id      = p_counterparty_id,
      acquisition_channel  = COALESCE(p_channel, acquisition_channel),
      platform_fee         = COALESCE(p_platform_fee, platform_fee),
      due_date             = p_due_date,
      notes                = p_notes,
      total_amount         = v_new_total,
      phones_ordered       = jsonb_array_length(p_items),
      status               = v_new_status,
      updated_at           = now()
  WHERE id = p_order_id AND tenant_id = v_tenant_id;

  -- Platform fee change is reflected in total_amount above.
  -- No separate ledger entry to update — fees settle via SUPPLIER_PAYMENT.

  -- ── Build diff document ─────────────────────────────────────────────
  IF jsonb_array_length(v_items_added) > 0 THEN
    v_diff := v_diff || jsonb_build_object('items_added', v_items_added);
  END IF;
  IF jsonb_array_length(v_items_removed) > 0 THEN
    v_diff := v_diff || jsonb_build_object('items_removed', v_items_removed);
  END IF;
  IF jsonb_array_length(v_items_changed) > 0 THEN
    v_diff := v_diff || jsonb_build_object('items_changed', v_items_changed);
  END IF;

  -- ── Insert audit row (only if something changed) ────────────────────
  IF v_diff <> '{}'::JSONB THEN
    INSERT INTO public.order_edits (tenant_id, order_id, order_type, edited_by, edited_by_name, diff)
    VALUES (v_tenant_id, p_order_id, 'PO', v_user_id, v_editor_name, v_diff);
  END IF;

  RETURN jsonb_build_object(
    'order_id', p_order_id,
    'new_total', v_new_total,
    'new_status', v_new_status,
    'diff', v_diff
  );
END;
$$;

ALTER FUNCTION public.edit_purchase_order(UUID, UUID, TEXT, NUMERIC, DATE, TEXT, JSONB)
  OWNER TO postgres;

-- 4. Drop the dead 7-param overload (from remove_pledge_types migration).
--    Frontend calls the 19-param GST signature; this one is never invoked.
DROP FUNCTION IF EXISTS public.create_purchase_order(uuid, uuid, uuid, jsonb, numeric, text, uuid);
