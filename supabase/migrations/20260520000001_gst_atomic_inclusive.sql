-- ─────────────────────────────────────────────────────────────────────────────
-- GST Atomicity + Inclusive/Exclusive Mode
--
-- 1. Add gst_inclusive column to sale_orders and purchase_orders
-- 2. Rewrite create_trade_order (latest v2) — GST params inline, item-level GST
-- 3. Rewrite create_purchase_order (latest v3) — same pattern
--
-- All new GST params default to NULL/FALSE so existing non-GST calls are unaffected.
-- Item-level GST is passed as additional JSON keys in p_items — no new params needed.
-- ─────────────────────────────────────────────────────────────────────────────

-- Step 1: Schema columns --------------------------------------------------

ALTER TABLE public.sale_orders
  ADD COLUMN IF NOT EXISTS gst_inclusive BOOLEAN DEFAULT TRUE;

ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS gst_inclusive BOOLEAN DEFAULT TRUE;


-- Step 2: create_trade_order — match v2 signature exactly, append GST params -

CREATE OR REPLACE FUNCTION "public"."create_trade_order"(
  "p_order_id"        uuid,
  "p_counterparty_id" uuid,
  "p_order_type"      text,
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
  "p_buyer_gstin"     text    DEFAULT NULL
) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path TO ''
AS $$
DECLARE
  v_tenant_id      UUID;
  v_user_id        UUID;
  v_total          NUMERIC(12,2) := 0;
  v_status         TEXT;
  v_item           JSONB;
  v_effective      NUMERIC(12,2);
  v_new_payment_id UUID;
BEGIN
  -- Idempotency guard
  IF EXISTS (SELECT 1 FROM public.sale_orders WHERE id = p_order_id) THEN
    SELECT total_amount, status INTO v_total, v_status
      FROM public.sale_orders WHERE id = p_order_id;
    RETURN jsonb_build_object('order_id', p_order_id, 'total', v_total, 'status', v_status, 'synced', true);
  END IF;

  SELECT tenant_id INTO v_tenant_id FROM public.profiles WHERE id = auth.uid();
  v_user_id := auth.uid();
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'No tenant'; END IF;

  -- Compute total from items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_effective := (v_item->>'sale_price')::NUMERIC
                 - COALESCE((v_item->>'discount_amount')::NUMERIC, 0);
    v_total := v_total + v_effective;
  END LOOP;

  v_status := CASE
    WHEN p_initial_payment <= 0 THEN 'OPEN'
    WHEN p_initial_payment >= v_total THEN 'SETTLED'
    ELSE 'PARTIAL'
  END;

  -- Insert order row
  INSERT INTO public.sale_orders (
    id, tenant_id, counterparty_id, order_type,
    total_amount, amount_paid, status, payment_mode, due_date, notes
  ) VALUES (
    p_order_id, v_tenant_id, p_counterparty_id, p_order_type,
    v_total, GREATEST(p_initial_payment, 0), v_status,
    NULLIF(p_payment_mode, ''), p_due_date, p_notes
  );

  -- GST: single atomic UPDATE in the same transaction (no separate client call needed)
  IF p_gst_enabled THEN
    UPDATE public.sale_orders SET
      gst_enabled   = TRUE,
      gst_inclusive = p_gst_inclusive,
      gst_type      = p_gst_type,
      gst_rate      = p_gst_rate,
      subtotal      = p_subtotal,
      cgst_amount   = p_cgst_amount,
      sgst_amount   = p_sgst_amount,
      igst_amount   = p_igst_amount,
      buyer_gstin   = p_buyer_gstin
    WHERE id = p_order_id;
  END IF;

  -- Insert items — item-level GST extracted from p_items JSON keys (COALESCE → NULL if absent)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_effective := (v_item->>'sale_price')::NUMERIC
                 - COALESCE((v_item->>'discount_amount')::NUMERIC, 0);

    INSERT INTO public.sale_order_items (
      sale_order_id, phone_id, sale_price, discount_amount,
      imei_snapshot, brand_snapshot, model_snapshot, storage_snapshot, color_snapshot,
      hsn_code, gst_rate, taxable_value, cgst_amount, sgst_amount, igst_amount
    ) VALUES (
      p_order_id,
      (v_item->>'phone_id')::UUID,
      (v_item->>'sale_price')::NUMERIC,
      COALESCE((v_item->>'discount_amount')::NUMERIC, 0),
      ARRAY(SELECT jsonb_array_elements_text(v_item->'imei_snapshot')),
      v_item->>'brand', v_item->>'model', v_item->>'storage', v_item->>'color',
      v_item->>'hsn_code',
      COALESCE((v_item->>'gst_rate')::NUMERIC,     NULL),
      COALESCE((v_item->>'taxable_value')::NUMERIC, NULL),
      COALESCE((v_item->>'cgst_amount')::NUMERIC,  NULL),
      COALESCE((v_item->>'sgst_amount')::NUMERIC,  NULL),
      COALESCE((v_item->>'igst_amount')::NUMERIC,  NULL)
    );

    UPDATE public.phones
      SET status = 'SOLD', sale_price = v_effective,
          sale_order_id = p_order_id, updated_at = now()
    WHERE id = (v_item->>'phone_id')::UUID AND tenant_id = v_tenant_id;
  END LOOP;

  -- Initial payment ledger entries
  IF p_initial_payment > 0 THEN
    INSERT INTO public.customer_payments (
      id, tenant_id, counterparty_id, total_received, mode, note, recorded_by
    ) VALUES (
      gen_random_uuid(), v_tenant_id, p_counterparty_id,
      p_initial_payment, COALESCE(NULLIF(p_payment_mode, ''), 'CASH'),
      p_payment_note, v_user_id
    ) RETURNING id INTO v_new_payment_id;

    INSERT INTO public.payment_allocations (customer_payment_id, sale_order_id, amount_allocated)
    VALUES (v_new_payment_id, p_order_id, p_initial_payment);

    INSERT INTO public.ledger (
      id, tenant_id, user_id, type,
      sale_order_id, customer_payment_id, amount, payment_mode, note, created_at
    ) VALUES (
      gen_random_uuid(), v_tenant_id, v_user_id, 'CUSTOMER_PAYMENT',
      p_order_id, v_new_payment_id, p_initial_payment,
      NULLIF(p_payment_mode, ''), COALESCE(p_payment_note, 'Advance Payment'), now()
    );
  END IF;

  RETURN jsonb_build_object('order_id', p_order_id, 'total', v_total, 'status', v_status);
EXCEPTION WHEN OTHERS THEN RAISE;
END;
$$;


-- Step 3: create_purchase_order — match v3 signature exactly, append GST params

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
  -- GST (all optional)
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

  -- Insert items — item-level GST from p_items JSON (COALESCE → NULL if absent)
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
