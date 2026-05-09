-- ============================================================
-- FIFO Settlement RPCs
-- These functions perform FIFO bulk-allocation settlements
-- for both customer AR (record_customer_settlement_fifo)
-- and supplier AP (record_supplier_settlement_fifo).
-- They automatically walk through open/partial orders oldest-first
-- and allocate the payment until the amount is exhausted.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. record_customer_settlement_fifo
--    Accepts a lump-sum from a customer and allocates FIFO
--    across open/partial sale orders for that counterparty.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.record_customer_settlement_fifo(
  p_counterparty_id uuid,
  p_amount          numeric,
  p_mode            text,
  p_note            text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_tenant_id  UUID;
  v_user_id    UUID;
  v_payment_id UUID;
  v_remaining  NUMERIC := p_amount;
  v_order      RECORD;
  v_alloc      NUMERIC;
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM public.profiles WHERE id = auth.uid();
  v_user_id := auth.uid();
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'No tenant found for user'; END IF;
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;

  -- Create the customer payment record
  INSERT INTO public.customer_payments (tenant_id, counterparty_id, total_received, mode, note, recorded_by)
  VALUES (v_tenant_id, p_counterparty_id, p_amount, p_mode, COALESCE(p_note, 'FIFO Settlement'), v_user_id)
  RETURNING id INTO v_payment_id;

  -- Log a single ledger entry for the whole payment
  INSERT INTO public.ledger (tenant_id, user_id, type, amount, payment_mode, note, customer_payment_id)
  VALUES (v_tenant_id, v_user_id, 'CUSTOMER_PAYMENT', p_amount, p_mode,
          COALESCE(p_note, 'FIFO Settlement - Bulk AR Collection'), v_payment_id);

  -- FIFO walk: allocate across open/partial sale orders (oldest due date first)
  FOR v_order IN
    SELECT id, total_amount, amount_paid
    FROM public.sale_orders
    WHERE tenant_id = v_tenant_id
      AND counterparty_id = p_counterparty_id
      AND status IN ('OPEN', 'PARTIAL')
    ORDER BY COALESCE(due_date, created_at) ASC
  LOOP
    EXIT WHEN v_remaining <= 0;

    v_alloc := LEAST(v_order.total_amount - v_order.amount_paid, v_remaining);
    IF v_alloc <= 0 THEN CONTINUE; END IF;

    -- Record allocation
    INSERT INTO public.payment_allocations (customer_payment_id, sale_order_id, amount_allocated)
    VALUES (v_payment_id, v_order.id, v_alloc);

    -- Update order balance
    UPDATE public.sale_orders
    SET amount_paid = amount_paid + v_alloc,
        status = CASE
          WHEN amount_paid + v_alloc >= total_amount THEN 'SETTLED'
          ELSE 'PARTIAL'
        END
    WHERE id = v_order.id AND tenant_id = v_tenant_id;

    v_remaining := v_remaining - v_alloc;
  END LOOP;

  -- If there's leftover (overpayment / advance), log as ADVANCE_RECEIVED
  IF v_remaining > 0 THEN
    INSERT INTO public.ledger (tenant_id, user_id, type, amount, payment_mode, note, customer_payment_id)
    VALUES (v_tenant_id, v_user_id, 'ADVANCE_RECEIVED', v_remaining, p_mode,
            COALESCE(p_note, 'Advance / Excess Payment (Credit Holder)'), v_payment_id);
  END IF;

  RETURN jsonb_build_object(
    'payment_id', v_payment_id,
    'allocated',  p_amount - v_remaining,
    'advance',    v_remaining,
    'status',     'SUCCESS'
  );
END;
$function$;

-- ────────────────────────────────────────────────────────────
-- 2. record_supplier_settlement_fifo
--    Pays a supplier in bulk and allocates FIFO across
--    open/partial/received purchase orders.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.record_supplier_settlement_fifo(
  p_counterparty_id uuid,
  p_amount          numeric,
  p_mode            text,
  p_note            text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_tenant_id  UUID;
  v_user_id    UUID;
  v_payment_id UUID;
  v_remaining  NUMERIC := p_amount;
  v_order      RECORD;
  v_alloc      NUMERIC;
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM public.profiles WHERE id = auth.uid();
  v_user_id := auth.uid();
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'No tenant found for user'; END IF;
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;

  -- Create the supplier payment record
  INSERT INTO public.supplier_payments (tenant_id, counterparty_id, total_paid, mode, note, recorded_by)
  VALUES (v_tenant_id, p_counterparty_id, p_amount, p_mode, COALESCE(p_note, 'FIFO Settlement'), v_user_id)
  RETURNING id INTO v_payment_id;

  -- Log a single ledger entry for the whole payment (negative = cash out)
  INSERT INTO public.ledger (tenant_id, user_id, type, amount, payment_mode, note, supplier_payment_id)
  VALUES (v_tenant_id, v_user_id, 'SUPPLIER_PAYMENT', -p_amount, p_mode,
          COALESCE(p_note, 'FIFO Settlement - Bulk AP Payout'), v_payment_id);

  -- FIFO walk: allocate across awaiting_receipt/received/partial purchase orders
  FOR v_order IN
    SELECT id, total_amount, amount_paid
    FROM public.purchase_orders
    WHERE tenant_id = v_tenant_id
      AND counterparty_id = p_counterparty_id
      AND status IN ('AWAITING_RECEIPT', 'RECEIVED', 'PARTIAL')
    ORDER BY COALESCE(due_date, created_at) ASC
  LOOP
    EXIT WHEN v_remaining <= 0;

    v_alloc := LEAST(v_order.total_amount - v_order.amount_paid, v_remaining);
    IF v_alloc <= 0 THEN CONTINUE; END IF;

    -- Record allocation
    INSERT INTO public.supplier_allocations (supplier_payment_id, purchase_order_id, amount_allocated)
    VALUES (v_payment_id, v_order.id, v_alloc);

    -- Update order balance
    UPDATE public.purchase_orders
    SET amount_paid = amount_paid + v_alloc,
        status = CASE
          WHEN amount_paid + v_alloc >= total_amount THEN 'SETTLED'
          ELSE 'PARTIAL'
        END
    WHERE id = v_order.id AND tenant_id = v_tenant_id;

    v_remaining := v_remaining - v_alloc;
  END LOOP;

  RETURN jsonb_build_object(
    'payment_id', v_payment_id,
    'allocated',  p_amount - v_remaining,
    'unallocated', v_remaining,
    'status',     'SUCCESS'
  );
END;
$function$;
