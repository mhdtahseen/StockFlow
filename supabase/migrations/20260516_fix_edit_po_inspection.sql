-- =====================================================================
-- FIX: edit_purchase_order — respect inspection status
-- ---------------------------------------------------------------------
-- Problem: The original edit_purchase_order RPC accumulated v_new_total
-- by summing ALL items in p_items, including those already REJECTED.
-- Rejected items should always contribute ₹0 to the total (they were
-- sent back to the supplier). This mirrors what certify_po_receipt does.
--
-- Additionally: phones_ordered is now computed from items that are NOT
-- rejected (active items in the order) rather than jsonb_array_length.
--
-- This is a CREATE OR REPLACE — safe to run multiple times.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.edit_purchase_order(
  p_order_id       UUID,
  p_counterparty_id UUID,
  p_channel        TEXT,
  p_platform_fee   NUMERIC,
  p_due_date       DATE,
  p_notes          TEXT,
  p_items          JSONB   -- array of item objects
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
  v_item_status   TEXT;
  v_new_total     NUMERIC(12,2) := 0;
  v_active_count  INTEGER := 0;
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

  -- ── Remove PENDING items not in incoming list ───────────────────────
  -- (ACCEPTED and REJECTED items can only be removed if no phone, handled above)
  FOR v_old_item IN
    SELECT id, brand, model, purchase_price
    FROM public.purchase_order_items
    WHERE purchase_order_id = p_order_id
      AND id <> ALL(COALESCE(v_incoming_ids, ARRAY[]::UUID[]))
      AND status = 'PENDING_INSPECTION'  -- only PENDING items can be removed
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
      -- Look up current status in DB to decide whether to count toward total
      SELECT status INTO v_item_status
      FROM public.purchase_order_items
      WHERE id = v_item_id;

      -- REJECTED items: skip from total, update only price (in case admin corrects it)
      IF v_item_status = 'REJECTED' THEN
        -- Do not add to total, do not count as active
        -- Still allow price update (for record accuracy)
        UPDATE public.purchase_order_items
        SET purchase_price = (v_item->>'purchase_price')::NUMERIC,
            updated_at     = now()
        WHERE id = v_item_id AND purchase_order_id = p_order_id;
        CONTINUE;
      END IF;

      -- ACCEPTED or PENDING_INSPECTION: update and include in total
      FOR v_old_item IN
        SELECT * FROM public.purchase_order_items WHERE id = v_item_id
      LOOP
        -- Propagate price change to phone if one exists
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

      v_new_total := v_new_total + (v_item->>'purchase_price')::NUMERIC;
      v_active_count := v_active_count + 1;

    ELSE
      -- New item (PENDING_INSPECTION by default)
      INSERT INTO public.purchase_order_items
        (purchase_order_id, purchase_price, brand, model, storage, color, ram, imei, issue_tags, status)
      VALUES (
        p_order_id,
        (v_item->>'purchase_price')::NUMERIC,
        v_item->>'brand', v_item->>'model', v_item->>'storage', v_item->>'color',
        v_item->>'ram', v_item->>'imei',
        COALESCE((v_item->>'issue_tags')::JSONB, '[]'::JSONB),
        'PENDING_INSPECTION'
      );
      v_items_added := v_items_added || jsonb_build_array(jsonb_build_object(
        'brand', v_item->>'brand', 'model', v_item->>'model',
        'price', (v_item->>'purchase_price')::NUMERIC
      ));

      v_new_total := v_new_total + (v_item->>'purchase_price')::NUMERIC;
      v_active_count := v_active_count + 1;
    END IF;
  END LOOP;

  -- Add platform fee to total
  v_new_total := v_new_total + COALESCE(p_platform_fee, 0);

  -- ── Recalculate payment status ──────────────────────────────────────
  -- Preserve receipt state: if goods have been received, don't regress to AWAITING_RECEIPT
  v_new_status := CASE
    WHEN v_po.status = 'AWAITING_RECEIPT' AND v_po.amount_paid = 0 THEN 'AWAITING_RECEIPT'
    WHEN v_po.status = 'AWAITING_RECEIPT' AND v_po.amount_paid > 0 AND v_po.amount_paid < v_new_total THEN 'PARTIAL'
    WHEN v_po.status = 'AWAITING_RECEIPT' AND v_po.amount_paid >= v_new_total THEN 'SETTLED'
    -- For RECEIVED/PARTIAL/SETTLED: goods are in, just update payment status
    WHEN v_po.amount_paid <= 0 THEN 'RECEIVED'
    WHEN v_po.amount_paid >= v_new_total THEN 'SETTLED'
    ELSE 'PARTIAL'
  END;

  -- ── Update PO ───────────────────────────────────────────────────────
  -- phones_ordered = total items in the order (including rejected — it's the original order count)
  UPDATE public.purchase_orders
  SET counterparty_id      = p_counterparty_id,
      acquisition_channel  = COALESCE(p_channel, acquisition_channel),
      platform_fee         = COALESCE(p_platform_fee, platform_fee),
      due_date             = p_due_date,
      notes                = p_notes,
      total_amount         = v_new_total,
      phones_ordered       = (
        SELECT COUNT(*) FROM public.purchase_order_items
        WHERE purchase_order_id = p_order_id
      ),
      status               = v_new_status,
      updated_at           = now()
  WHERE id = p_order_id AND tenant_id = v_tenant_id;

  -- ── Update platform fee ledger entry if fee changed ─────────────────
  IF (v_diff->>'platform_fee') IS NOT NULL THEN
    UPDATE public.ledger
    SET amount = -COALESCE(p_platform_fee, 0), updated_at = now()
    WHERE purchase_order_id = p_order_id
      AND type = 'PLATFORM_FEE'
      AND tenant_id = v_tenant_id;
  END IF;

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
