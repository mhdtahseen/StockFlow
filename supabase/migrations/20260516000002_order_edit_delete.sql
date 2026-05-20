-- =====================================================================
-- ORDER EDIT + SOFT DELETE
-- ---------------------------------------------------------------------
-- Adds:
--   1. deleted_at column to purchase_orders + sale_orders (soft delete)
--   2. order_edits audit table (JSON diff per edit, shown in timeline)
--   3. Updated SELECT RLS policies to exclude soft-deleted orders
--   4. edit_purchase_order() RPC  — full item/price/supplier edit
--   5. soft_delete_purchase_order() RPC — settled-only guard
--   6. edit_sale_order() RPC      — full item/price/customer edit
--   7. soft_delete_sale_order() RPC — settled-only guard + phone restock
-- =====================================================================

-- ── 1. SOFT-DELETE COLUMNS ──────────────────────────────────────────

ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE public.sale_orders
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Indexes for filtering active orders efficiently
CREATE INDEX IF NOT EXISTS idx_po_deleted
  ON public.purchase_orders (tenant_id, deleted_at)
  WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_so_deleted
  ON public.sale_orders (tenant_id, deleted_at)
  WHERE deleted_at IS NOT NULL;

-- ── 2. ORDER EDITS AUDIT TABLE ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.order_edits (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID        NOT NULL REFERENCES public.tenants(id),
  order_id      UUID        NOT NULL,   -- FK to either purchase_orders or sale_orders (no FK constraint — cross-table)
  order_type    TEXT        NOT NULL,   -- 'PO' | 'SO'
  edited_by     UUID        NOT NULL REFERENCES public.profiles(id),
  edited_by_name TEXT,                  -- denormalised snapshot of editor's full_name
  diff          JSONB       NOT NULL,   -- { field: { old, new }, items_added: [], items_removed: [], items_changed: [] }
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT order_edits_order_type_check CHECK (order_type IN ('PO', 'SO'))
);

ALTER TABLE public.order_edits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "oe_select" ON public.order_edits
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "oe_insert" ON public.order_edits
  FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE INDEX IF NOT EXISTS idx_order_edits_order
  ON public.order_edits (order_id, created_at DESC);

-- ── 3. UPDATE SELECT POLICIES: EXCLUDE SOFT-DELETED ORDERS ──────────

-- purchase_orders
DROP POLICY IF EXISTS "po_select" ON public.purchase_orders;
CREATE POLICY "po_select" ON public.purchase_orders
  FOR SELECT USING (
    tenant_id = public.get_user_tenant_id()
    AND deleted_at IS NULL
  );

-- sale_orders
DROP POLICY IF EXISTS "so_select" ON public.sale_orders;
CREATE POLICY "so_select" ON public.sale_orders
  FOR SELECT USING (
    tenant_id = public.get_user_tenant_id()
    AND deleted_at IS NULL
  );

-- ── 4. RPC: edit_purchase_order ──────────────────────────────────────
-- Edits items, prices, counterparty, platform fee, notes, due_date.
-- Rules:
--   • Cannot edit CANCELLED or soft-deleted POs.
--   • Cannot remove items that have an associated phone (receipt already done).
--   • Price changes on items with phones propagate to phones.purchase_price.
--   • totalAmount and payment_status are recalculated.
--   • Inserts a row into order_edits with a JSON diff.
--
-- p_items structure:
--   [{ id?: string,          -- existing item UUID (omit for new items)
--      purchase_price: number,
--      brand: string, model: string, storage: string, color: string,
--      ram?: string, imei?: string, issue_tags?: string[] }]
--   Items present in the DB but absent from p_items are treated as removals.

CREATE OR REPLACE FUNCTION public.edit_purchase_order(
  p_order_id       UUID,
  p_counterparty_id UUID,
  p_channel        TEXT,
  p_platform_fee   NUMERIC,
  p_due_date       DATE,
  p_notes          TEXT,
  p_items          JSONB   -- array of item objects (see above)
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
      -- Update existing item
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

    ELSE
      -- New item
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

-- ── 5. RPC: soft_delete_purchase_order ──────────────────────────────
-- Guard: only allowed if the PO is SETTLED (amountPaid >= totalAmount).
-- Sets deleted_at; does NOT delete any related records.

CREATE OR REPLACE FUNCTION public.soft_delete_purchase_order(
  p_order_id UUID
) RETURNS VOID
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_tenant_id UUID;
  v_po        RECORD;
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM public.profiles WHERE id = auth.uid();
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'No tenant'; END IF;

  SELECT * INTO v_po FROM public.purchase_orders
  WHERE id = p_order_id AND tenant_id = v_tenant_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Purchase order not found'; END IF;
  IF v_po.deleted_at IS NOT NULL THEN RAISE EXCEPTION 'Purchase order is already archived'; END IF;
  IF v_po.status <> 'SETTLED' THEN
    RAISE EXCEPTION 'Cannot archive a purchase order with outstanding balance. Status: %', v_po.status;
  END IF;

  UPDATE public.purchase_orders
  SET deleted_at = now(), updated_at = now()
  WHERE id = p_order_id AND tenant_id = v_tenant_id;
END;
$$;

ALTER FUNCTION public.soft_delete_purchase_order(UUID) OWNER TO postgres;

-- ── 6. RPC: edit_sale_order ──────────────────────────────────────────
-- Edits items, prices, discounts, counterparty, notes, due_date.
-- Rules:
--   • Cannot edit RETURNED or soft-deleted SOs.
--   • Cannot remove items — phone is SOLD; use returnOrder instead.
--   • Price changes propagate: SO item sale_price updated, SO totalAmount recalc.
--   • Inserts order_edits audit row.
--
-- p_items structure:
--   [{ id: string,           -- existing sale_order_item UUID (required for SO edits)
--      sale_price: number,
--      discount_amount: number }]

CREATE OR REPLACE FUNCTION public.edit_sale_order(
  p_order_id        UUID,
  p_counterparty_id UUID,
  p_due_date        DATE,
  p_notes           TEXT,
  p_items           JSONB   -- array of { id, sale_price, discount_amount }
) RETURNS JSONB
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_tenant_id     UUID;
  v_user_id       UUID;
  v_editor_name   TEXT;
  v_so            RECORD;
  v_old_item      RECORD;
  v_item          JSONB;
  v_item_id       UUID;
  v_new_total     NUMERIC(12,2) := 0;
  v_new_status    TEXT;
  v_effective     NUMERIC(12,2);
  v_diff          JSONB := '{}'::JSONB;
  v_items_changed JSONB := '[]'::JSONB;
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM public.profiles WHERE id = auth.uid();
  v_user_id := auth.uid();
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'No tenant'; END IF;

  SELECT * INTO v_so FROM public.sale_orders
  WHERE id = p_order_id AND tenant_id = v_tenant_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Sale order not found'; END IF;
  IF v_so.deleted_at IS NOT NULL THEN RAISE EXCEPTION 'Cannot edit a deleted sale order'; END IF;
  IF v_so.status = 'RETURNED' THEN RAISE EXCEPTION 'Cannot edit a returned sale order'; END IF;

  SELECT full_name INTO v_editor_name FROM public.profiles WHERE id = v_user_id;

  -- ── Diff: top-level field changes ──────────────────────────────────
  IF v_so.counterparty_id <> p_counterparty_id THEN
    v_diff := v_diff || jsonb_build_object('counterparty_id',
      jsonb_build_object('old', v_so.counterparty_id, 'new', p_counterparty_id));
  END IF;
  IF COALESCE(v_so.notes, '') <> COALESCE(p_notes, '') THEN
    v_diff := v_diff || jsonb_build_object('notes',
      jsonb_build_object('old', v_so.notes, 'new', p_notes));
  END IF;
  IF COALESCE(v_so.due_date::TEXT, '') <> COALESCE(p_due_date::TEXT, '') THEN
    v_diff := v_diff || jsonb_build_object('due_date',
      jsonb_build_object('old', v_so.due_date, 'new', p_due_date));
  END IF;

  -- ── Update items ─────────────────────────────────────────────────────
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_item_id := (v_item->>'id')::UUID;
    IF v_item_id IS NULL THEN RAISE EXCEPTION 'All SO items must have an id for edits'; END IF;

    FOR v_old_item IN
      SELECT * FROM public.sale_order_items WHERE id = v_item_id AND sale_order_id = p_order_id
    LOOP
      IF v_old_item.sale_price <> (v_item->>'sale_price')::NUMERIC
         OR v_old_item.discount_amount <> COALESCE((v_item->>'discount_amount')::NUMERIC, 0)
      THEN
        v_items_changed := v_items_changed || jsonb_build_array(jsonb_build_object(
          'item_id', v_item_id,
          'brand_snapshot', v_old_item.brand_snapshot,
          'model_snapshot', v_old_item.model_snapshot,
          'old_price', v_old_item.sale_price,
          'new_price', (v_item->>'sale_price')::NUMERIC,
          'old_discount', v_old_item.discount_amount,
          'new_discount', COALESCE((v_item->>'discount_amount')::NUMERIC, 0)
        ));
      END IF;
    END LOOP;

    UPDATE public.sale_order_items
    SET sale_price      = (v_item->>'sale_price')::NUMERIC,
        discount_amount = COALESCE((v_item->>'discount_amount')::NUMERIC, 0)
    WHERE id = v_item_id AND sale_order_id = p_order_id;

    v_effective := (v_item->>'sale_price')::NUMERIC
                 - COALESCE((v_item->>'discount_amount')::NUMERIC, 0);
    v_new_total := v_new_total + v_effective;
  END LOOP;

  -- ── Recalculate payment status ──────────────────────────────────────
  v_new_status := CASE
    WHEN v_so.amount_paid <= 0 THEN 'OPEN'
    WHEN v_so.amount_paid >= v_new_total THEN 'SETTLED'
    ELSE 'PARTIAL'
  END;

  -- ── Update SO ───────────────────────────────────────────────────────
  UPDATE public.sale_orders
  SET counterparty_id = p_counterparty_id,
      due_date        = p_due_date,
      notes           = p_notes,
      total_amount    = v_new_total,
      status          = v_new_status,
      updated_at      = now()
  WHERE id = p_order_id AND tenant_id = v_tenant_id;

  -- ── Build diff document ─────────────────────────────────────────────
  IF jsonb_array_length(v_items_changed) > 0 THEN
    v_diff := v_diff || jsonb_build_object('items_changed', v_items_changed);
  END IF;

  -- ── Insert audit row ─────────────────────────────────────────────────
  IF v_diff <> '{}'::JSONB THEN
    INSERT INTO public.order_edits (tenant_id, order_id, order_type, edited_by, edited_by_name, diff)
    VALUES (v_tenant_id, p_order_id, 'SO', v_user_id, v_editor_name, v_diff);
  END IF;

  RETURN jsonb_build_object(
    'order_id', p_order_id,
    'new_total', v_new_total,
    'new_status', v_new_status,
    'diff', v_diff
  );
END;
$$;

ALTER FUNCTION public.edit_sale_order(UUID, UUID, DATE, TEXT, JSONB) OWNER TO postgres;

-- ── 7. RPC: soft_delete_sale_order ──────────────────────────────────
-- Guard: only allowed if the SO is SETTLED.
-- Sets deleted_at; restores linked phones back to IN_STOCK.

CREATE OR REPLACE FUNCTION public.soft_delete_sale_order(
  p_order_id UUID
) RETURNS VOID
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_tenant_id UUID;
  v_so        RECORD;
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM public.profiles WHERE id = auth.uid();
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'No tenant'; END IF;

  SELECT * INTO v_so FROM public.sale_orders
  WHERE id = p_order_id AND tenant_id = v_tenant_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Sale order not found'; END IF;
  IF v_so.deleted_at IS NOT NULL THEN RAISE EXCEPTION 'Sale order is already archived'; END IF;
  IF v_so.status <> 'SETTLED' THEN
    RAISE EXCEPTION 'Cannot archive a sale order with outstanding balance. Status: %', v_so.status;
  END IF;

  -- Restore phones linked to this sale order back to IN_STOCK
  UPDATE public.phones
  SET status         = 'IN_STOCK',
      sale_order_id  = NULL,
      updated_at     = now()
  WHERE sale_order_id = p_order_id AND tenant_id = v_tenant_id;

  UPDATE public.sale_orders
  SET deleted_at = now(), updated_at = now()
  WHERE id = p_order_id AND tenant_id = v_tenant_id;
END;
$$;

ALTER FUNCTION public.soft_delete_sale_order(UUID) OWNER TO postgres;
