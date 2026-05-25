-- Migration: Return idempotency, refund validation, certification guard
--
-- 1. return_order: reject if already RETURNED, validate refund <= amount_paid
-- 2. certify_po_receipt: reject if PO is already SETTLED

-- ═══════════════════════════════════════════════════════════════════════
-- 1. Harden return_order with idempotency + refund cap
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION "public"."return_order"(
  "p_order_id"      uuid,
  "p_refund_amount" numeric DEFAULT 0,
  "p_payment_mode"  text    DEFAULT 'CASH'
) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path TO ''
AS $$
DECLARE
  v_tenant_id   UUID;
  v_user_id     UUID;
  v_status      TEXT;
  v_amount_paid NUMERIC;
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM public.profiles WHERE id = auth.uid();
  v_user_id := auth.uid();
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'No tenant'; END IF;

  -- Fetch current status + amount_paid
  SELECT status, amount_paid INTO v_status, v_amount_paid
  FROM public.sale_orders
  WHERE id = p_order_id AND tenant_id = v_tenant_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Idempotency guard
  IF v_status = 'RETURNED' THEN
    RAISE EXCEPTION 'Order already returned';
  END IF;

  -- Refund validation
  IF COALESCE(p_refund_amount, 0) > COALESCE(v_amount_paid, 0) THEN
    RAISE EXCEPTION 'Refund amount (%) exceeds paid amount (%)', p_refund_amount, v_amount_paid;
  END IF;

  -- Update order status
  UPDATE public.sale_orders
  SET status = 'RETURNED', updated_at = now()
  WHERE id = p_order_id AND tenant_id = v_tenant_id;

  -- Return all phones to IN_STOCK
  UPDATE public.phones
  SET status = 'IN_STOCK', sale_order_id = NULL, sale_price = NULL, updated_at = now()
  WHERE sale_order_id = p_order_id AND tenant_id = v_tenant_id;

  -- Record refund as negative CUSTOMER_PAYMENT (money going out)
  IF COALESCE(p_refund_amount, 0) > 0 THEN
    INSERT INTO public.ledger (
      tenant_id, user_id, type, sale_order_id, amount, payment_mode, note
    ) VALUES (
      v_tenant_id, v_user_id, 'CUSTOMER_PAYMENT', p_order_id,
      -p_refund_amount,
      NULLIF(p_payment_mode, ''),
      'REFUND - Sale Return (#' || UPPER(LEFT(p_order_id::text, 8)) || ')'
    );
  END IF;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════
-- 2. Guard certify_po_receipt against regressing SETTLED POs
-- ═══════════════════════════════════════════════════════════════════════
-- We wrap the existing certify_po_receipt with a status check.
-- First, get the current function body and add a guard at the top.

DO $$
DECLARE
  v_current_status TEXT;
BEGIN
  -- This DO block just validates the approach; actual guard is in the CREATE OR REPLACE below.
  NULL;
END;
$$;

-- Replace certify_po_receipt with status guard
CREATE OR REPLACE FUNCTION "public"."certify_po_receipt"(
  "p_order_id"    uuid,
  "p_status"      text,
  "p_items"       jsonb
) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path TO ''
AS $$
DECLARE
  v_tenant_id UUID;
  v_current_status TEXT;
  v_item JSONB;
  v_item_id UUID;
  v_phone_id UUID;
  v_price NUMERIC;
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM public.profiles WHERE id = auth.uid();
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'No tenant'; END IF;

  -- Guard: prevent regression of SETTLED POs
  SELECT status INTO v_current_status
  FROM public.purchase_orders
  WHERE id = p_order_id AND tenant_id = v_tenant_id;

  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'Purchase order not found';
  END IF;

  IF v_current_status = 'SETTLED' THEN
    RAISE EXCEPTION 'Cannot certify a settled PO; use edit instead';
  END IF;

  -- Process each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_id := (v_item->>'itemId')::UUID;

    IF (v_item->>'status') = 'ACCEPTED' THEN
      v_phone_id := (v_item->>'phoneId')::UUID;
      v_price := (v_item->>'purchasePrice')::NUMERIC;

      -- Update item status
      UPDATE public.purchase_order_items
      SET status = 'ACCEPTED', updated_at = NOW()
      WHERE id = v_item_id AND purchase_order_id = p_order_id;

      -- Update phone record
      IF v_phone_id IS NOT NULL THEN
        UPDATE public.phones
        SET purchase_price = v_price, status = 'IN_STOCK', updated_at = NOW()
        WHERE id = v_phone_id AND tenant_id = v_tenant_id;
      END IF;

    ELSIF (v_item->>'status') = 'REJECTED' THEN
      UPDATE public.purchase_order_items
      SET status = 'REJECTED', updated_at = NOW()
      WHERE id = v_item_id AND purchase_order_id = p_order_id;

    END IF;
  END LOOP;

  -- Recalculate PO totals and set status
  UPDATE public.purchase_orders
  SET
    status = p_status,
    phones_received = (
      SELECT COUNT(*)
      FROM public.purchase_order_items
      WHERE purchase_order_id = p_order_id AND status = 'ACCEPTED'
    ),
    total_amount = (
      SELECT COALESCE(SUM(purchase_price), 0)
      FROM public.purchase_order_items
      WHERE purchase_order_id = p_order_id AND status = 'ACCEPTED'
    ),
    updated_at = NOW()
  WHERE id = p_order_id AND tenant_id = v_tenant_id;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════
-- 3. Drop the now-redundant update_order_payment RPC
--    (all payment flows use record_customer_payment / settlement FIFO RPCs)
-- ═══════════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.update_order_payment(uuid, numeric, text);
