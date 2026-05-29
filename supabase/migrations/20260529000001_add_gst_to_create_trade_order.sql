-- Migration: Add GST parameters to create_trade_order
-- Problem: supabaseApi.ts calls create_trade_order with 9 GST params
-- (p_gst_enabled, p_gst_inclusive, p_gst_type, p_gst_rate, p_subtotal,
--  p_cgst_amount, p_sgst_amount, p_igst_amount, p_buyer_gstin)
-- but the live DB function only has the original 9 base params.
-- The GST columns already exist on sale_orders and sale_order_items —
-- this migration only updates the RPC to accept and write them.
--
-- Drops the old overloads first to avoid ambiguous-function errors, then
-- creates a single canonical version that matches supabaseApi.ts exactly.

-- ── Drop old overloads ───────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.create_trade_order(uuid, uuid, text, text, numeric, date, text, jsonb, text);
DROP FUNCTION IF EXISTS public.create_trade_order(uuid, uuid, text, jsonb, numeric, text, date, text, text);

-- ── New canonical create_trade_order with GST support ───────────────────────
CREATE OR REPLACE FUNCTION public.create_trade_order(
  p_order_id        uuid,
  p_counterparty_id uuid,
  p_order_type      text,
  p_items           jsonb,
  p_initial_payment numeric,
  p_payment_mode    text,
  p_due_date        date    DEFAULT NULL,
  p_notes           text    DEFAULT NULL,
  p_payment_note    text    DEFAULT NULL,
  -- GST params (optional — defaults keep non-GST orders working unchanged)
  p_gst_enabled     boolean DEFAULT false,
  p_gst_inclusive   boolean DEFAULT true,
  p_gst_type        text    DEFAULT NULL,
  p_gst_rate        numeric DEFAULT NULL,
  p_subtotal        numeric DEFAULT NULL,
  p_cgst_amount     numeric DEFAULT NULL,
  p_sgst_amount     numeric DEFAULT NULL,
  p_igst_amount     numeric DEFAULT NULL,
  p_buyer_gstin     text    DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tenant_id      UUID;
  v_user_id        UUID;
  v_total          NUMERIC(12,2) := 0;
  v_status         TEXT;
  v_item           JSONB;
  v_effective      NUMERIC(12,2);
  v_new_payment_id UUID;
BEGIN
  -- ── Idempotency guard ──────────────────────────────────────────────────────
  IF EXISTS (SELECT 1 FROM public.sale_orders WHERE id = p_order_id) THEN
    SELECT total_amount, status INTO v_total, v_status
      FROM public.sale_orders WHERE id = p_order_id;
    RETURN jsonb_build_object('order_id', p_order_id, 'total', v_total, 'status', v_status, 'synced', true);
  END IF;

  SELECT tenant_id INTO v_tenant_id FROM public.profiles WHERE id = auth.uid();
  v_user_id := auth.uid();
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'No tenant'; END IF;

  -- ── Compute order total ────────────────────────────────────────────────────
  -- When GST is enabled the UI sends the grand total (incl. tax) directly via
  -- p_subtotal + tax amounts; use that to avoid double-counting.
  IF p_gst_enabled AND p_subtotal IS NOT NULL THEN
    -- grand total = subtotal + cgst + sgst + igst
    v_total := COALESCE(p_subtotal, 0)
             + COALESCE(p_cgst_amount, 0)
             + COALESCE(p_sgst_amount, 0)
             + COALESCE(p_igst_amount, 0);
  ELSE
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
      v_effective := (v_item->>'sale_price')::NUMERIC
                   - COALESCE((v_item->>'discount_amount')::NUMERIC, 0);
      v_total := v_total + v_effective;
    END LOOP;
  END IF;

  v_status := CASE
    WHEN p_initial_payment <= 0 THEN 'OPEN'
    WHEN p_initial_payment >= v_total THEN 'SETTLED'
    ELSE 'PARTIAL'
  END;

  -- ── Insert sale order ──────────────────────────────────────────────────────
  INSERT INTO public.sale_orders (
    id, tenant_id, counterparty_id, order_type,
    total_amount, amount_paid, status, payment_mode, due_date, notes
  ) VALUES (
    p_order_id, v_tenant_id, p_counterparty_id, p_order_type,
    v_total, GREATEST(p_initial_payment, 0), v_status,
    NULLIF(p_payment_mode, ''), p_due_date, p_notes
  );

  -- ── Write GST metadata (atomic UPDATE in same transaction) ─────────────────
  IF p_gst_enabled THEN
    UPDATE public.sale_orders SET
      gst_enabled  = TRUE,
      gst_type     = p_gst_type,
      gst_rate     = p_gst_rate,
      subtotal     = p_subtotal,
      cgst_amount  = p_cgst_amount,
      sgst_amount  = p_sgst_amount,
      igst_amount  = p_igst_amount,
      buyer_gstin  = p_buyer_gstin
    WHERE id = p_order_id;
  END IF;

  -- ── Insert line items ──────────────────────────────────────────────────────
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_effective := (v_item->>'sale_price')::NUMERIC
                 - COALESCE((v_item->>'discount_amount')::NUMERIC, 0);

    INSERT INTO public.sale_order_items (
      sale_order_id, phone_id, sale_price, discount_amount,
      imei_snapshot, brand_snapshot, model_snapshot, storage_snapshot, color_snapshot,
      -- Item-level GST (NULL when GST is disabled — COALESCE handles absent keys)
      hsn_code, gst_rate, taxable_value, cgst_amount, sgst_amount, igst_amount
    ) VALUES (
      p_order_id,
      (v_item->>'phone_id')::UUID,
      (v_item->>'sale_price')::NUMERIC,
      COALESCE((v_item->>'discount_amount')::NUMERIC, 0),
      ARRAY(SELECT jsonb_array_elements_text(v_item->'imei_snapshot')),
      v_item->>'brand', v_item->>'model', v_item->>'storage', v_item->>'color',
      v_item->>'hsn_code',
      COALESCE((v_item->>'gst_rate')::NUMERIC,      NULL),
      COALESCE((v_item->>'taxable_value')::NUMERIC,  NULL),
      COALESCE((v_item->>'cgst_amount')::NUMERIC,    NULL),
      COALESCE((v_item->>'sgst_amount')::NUMERIC,    NULL),
      COALESCE((v_item->>'igst_amount')::NUMERIC,    NULL)
    );

    -- Mark phone as SOLD and link to sale order
    UPDATE public.phones
      SET status        = 'SOLD',
          sale_price    = v_effective,
          sale_order_id = p_order_id,
          updated_at    = now()
    WHERE id = (v_item->>'phone_id')::UUID AND tenant_id = v_tenant_id;
  END LOOP;

  -- ── Record initial payment ─────────────────────────────────────────────────
  IF p_initial_payment > 0 THEN
    INSERT INTO public.customer_payments (
      id, tenant_id, counterparty_id, total_received, mode, note, recorded_by, type
    ) VALUES (
      gen_random_uuid(), v_tenant_id, p_counterparty_id,
      p_initial_payment,
      COALESCE(NULLIF(p_payment_mode, ''), 'CASH'),
      p_payment_note, v_user_id, 'ADVANCE'
    ) RETURNING id INTO v_new_payment_id;

    INSERT INTO public.payment_allocations (
      customer_payment_id, sale_order_id, amount_allocated, note
    ) VALUES (v_new_payment_id, p_order_id, p_initial_payment, 'Advance Payment');

    INSERT INTO public.ledger (
      tenant_id, user_id, type,
      sale_order_id, customer_payment_id,
      amount, payment_mode, note
    ) VALUES (
      v_tenant_id, v_user_id, 'CUSTOMER_PAYMENT',
      p_order_id, v_new_payment_id,
      p_initial_payment,
      NULLIF(p_payment_mode, ''),
      COALESCE(p_payment_note, 'Advance Payment')
    );
  END IF;

  RETURN jsonb_build_object('order_id', p_order_id, 'total', v_total, 'status', v_status);
END;
$function$;

-- Grant execute to all relevant roles
GRANT EXECUTE ON FUNCTION public.create_trade_order(uuid, uuid, text, jsonb, numeric, text, date, text, text, boolean, boolean, text, numeric, numeric, numeric, numeric, numeric, text) TO anon, authenticated, service_role;
