-- DROP EXISTING FUNCTIONS TO ALLOW SIGNATURE MODIFICATIONS
DROP FUNCTION IF EXISTS public.record_customer_payment(uuid, numeric, text, jsonb, text);
DROP FUNCTION IF EXISTS public.record_customer_payment(uuid, numeric, text, jsonb, text, text);
DROP FUNCTION IF EXISTS public.record_customer_settlement_fifo(uuid, numeric, text, text);
DROP FUNCTION IF EXISTS public.record_supplier_payment(uuid, numeric, text, jsonb, text);
DROP FUNCTION IF EXISTS public.record_supplier_payment(uuid, numeric, text, jsonb, text, text);
DROP FUNCTION IF EXISTS public.record_supplier_settlement_fifo(uuid, numeric, text, text);

-- 1. RECORD CUSTOMER PAYMENT
CREATE OR REPLACE FUNCTION public.record_customer_payment(
  p_counterparty_id uuid,
  p_total_received numeric,
  p_mode text,
  p_allocations jsonb,
  p_note text DEFAULT NULL::text,
  p_type text DEFAULT 'CUSTOMER_PAYMENT'::text,
  p_payment_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id   UUID;
  v_payment_id UUID;
  v_alloc     JSONB;
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM public.profiles WHERE id = auth.uid();
  v_user_id := auth.uid();
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'No tenant'; END IF;

  v_payment_id := COALESCE(p_payment_id, gen_random_uuid());

  INSERT INTO public.customer_payments (id, tenant_id, counterparty_id, total_received, mode, note, recorded_by, type)
  VALUES (v_payment_id, v_tenant_id, p_counterparty_id, p_total_received, p_mode, p_note, v_user_id,
    CASE WHEN p_type = 'DEBT_SETTLEMENT' THEN 'SETTLEMENT' ELSE 'ADVANCE' END);

  -- SINGLE ENTRY LOGGING IN LEDGER FOR ENTIRE PAYMENT
  INSERT INTO public.ledger (tenant_id, user_id, type, amount, payment_mode, note, customer_payment_id)
  VALUES (v_tenant_id, v_user_id, p_type, p_total_received, p_mode, COALESCE(p_note, 'Customer Payment Received'), v_payment_id);

  FOR v_alloc IN SELECT * FROM jsonb_array_elements(p_allocations) LOOP
    INSERT INTO public.payment_allocations (customer_payment_id, sale_order_id, amount_allocated, note)
    VALUES (v_payment_id, (v_alloc->>'saleOrderId')::UUID, (v_alloc->>'amountAllocated')::NUMERIC, v_alloc->>'note');

    UPDATE public.sale_orders
    SET 
      amount_paid = amount_paid + (v_alloc->>'amountAllocated')::NUMERIC,
      status = CASE
        WHEN amount_paid + (v_alloc->>'amountAllocated')::NUMERIC >= total_amount THEN 'SETTLED'
        ELSE 'PARTIAL'
      END
    WHERE id = (v_alloc->>'saleOrderId')::UUID AND tenant_id = v_tenant_id;
  END LOOP;

  RETURN jsonb_build_object('payment_id', v_payment_id, 'status', 'SUCCESS');
END;
$$;

-- 2. RECORD CUSTOMER SETTLEMENT FIFO
CREATE OR REPLACE FUNCTION public.record_customer_settlement_fifo(
  p_counterparty_id uuid,
  p_amount numeric,
  p_mode text,
  p_note text DEFAULT NULL::text,
  p_payment_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  v_payment_id := COALESCE(p_payment_id, gen_random_uuid());

  INSERT INTO public.customer_payments (id, tenant_id, counterparty_id, total_received, mode, note, recorded_by)
  VALUES (v_payment_id, v_tenant_id, p_counterparty_id, p_amount, p_mode, COALESCE(p_note, 'FIFO Settlement'), v_user_id);

  INSERT INTO public.ledger (tenant_id, user_id, type, amount, payment_mode, note, customer_payment_id)
  VALUES (v_tenant_id, v_user_id, 'CUSTOMER_PAYMENT', p_amount, p_mode,
          COALESCE(p_note, 'FIFO Settlement - Bulk AR Collection'), v_payment_id);

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

    INSERT INTO public.payment_allocations (customer_payment_id, sale_order_id, amount_allocated)
    VALUES (v_payment_id, v_order.id, v_alloc);

    UPDATE public.sale_orders
    SET amount_paid = amount_paid + v_alloc,
        status = CASE
          WHEN amount_paid + v_alloc >= total_amount THEN 'SETTLED'
          ELSE 'PARTIAL'
        END
    WHERE id = v_order.id AND tenant_id = v_tenant_id;

    v_remaining := v_remaining - v_alloc;
  END LOOP;

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
$$;

-- 3. RECORD SUPPLIER PAYMENT
CREATE OR REPLACE FUNCTION public.record_supplier_payment(
  p_counterparty_id uuid,
  p_total_paid numeric,
  p_mode text,
  p_allocations jsonb,
  p_note text DEFAULT NULL::text,
  p_type text DEFAULT 'SUPPLIER_PAYMENT'::text,
  p_payment_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id   UUID;
  v_payment_id UUID;
  v_alloc     JSONB;
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM public.profiles WHERE id = auth.uid();
  v_user_id := auth.uid();
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'No tenant'; END IF;

  v_payment_id := COALESCE(p_payment_id, gen_random_uuid());

  INSERT INTO public.supplier_payments (id, tenant_id, counterparty_id, total_paid, mode, note, recorded_by, type)
  VALUES (v_payment_id, v_tenant_id, p_counterparty_id, p_total_paid, p_mode, p_note, v_user_id,
    CASE WHEN p_type = 'SUPPLIER_SETTLEMENT' THEN 'SETTLEMENT' ELSE 'ADVANCE' END);

  -- SINGLE ENTRY LOGGING IN LEDGER FOR ENTIRE PAYMENT
  INSERT INTO public.ledger (tenant_id, user_id, type, amount, payment_mode, note, supplier_payment_id)
  VALUES (v_tenant_id, v_user_id, p_type, -p_total_paid, p_mode, COALESCE(p_note, 'Supplier Payment Given'), v_payment_id);

  FOR v_alloc IN SELECT * FROM jsonb_array_elements(p_allocations) LOOP
    INSERT INTO public.supplier_allocations (supplier_payment_id, purchase_order_id, amount_allocated, note)
    VALUES (v_payment_id, (v_alloc->>'purchaseOrderId')::UUID, (v_alloc->>'amountAllocated')::NUMERIC, v_alloc->>'note');

    UPDATE public.purchase_orders
    SET 
      amount_paid = amount_paid + (v_alloc->>'amountAllocated')::NUMERIC,
      status = CASE
        WHEN amount_paid + (v_alloc->>'amountAllocated')::NUMERIC >= total_amount THEN 'SETTLED'
        ELSE 'PARTIAL'
      END
    WHERE id = (v_alloc->>'purchaseOrderId')::UUID AND tenant_id = v_tenant_id;
  END LOOP;

  RETURN jsonb_build_object('payment_id', v_payment_id, 'status', 'SUCCESS');
END;
$$;

-- 4. RECORD SUPPLIER SETTLEMENT FIFO
CREATE OR REPLACE FUNCTION public.record_supplier_settlement_fifo(
  p_counterparty_id uuid,
  p_amount numeric,
  p_mode text,
  p_note text DEFAULT NULL::text,
  p_payment_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  v_payment_id := COALESCE(p_payment_id, gen_random_uuid());

  INSERT INTO public.supplier_payments (id, tenant_id, counterparty_id, total_paid, mode, note, recorded_by)
  VALUES (v_payment_id, v_tenant_id, p_counterparty_id, p_amount, p_mode, COALESCE(p_note, 'FIFO Settlement'), v_user_id);

  INSERT INTO public.ledger (tenant_id, user_id, type, amount, payment_mode, note, supplier_payment_id)
  VALUES (v_tenant_id, v_user_id, 'SUPPLIER_PAYMENT', -p_amount, p_mode,
          COALESCE(p_note, 'FIFO Settlement - Bulk AP Payout'), v_payment_id);

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

    INSERT INTO public.supplier_allocations (supplier_payment_id, purchase_order_id, amount_allocated)
    VALUES (v_payment_id, v_order.id, v_alloc);

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
$$;
