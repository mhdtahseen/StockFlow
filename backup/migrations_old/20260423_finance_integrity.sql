-- Drop restrictive ledger type constraint to allow modern types
ALTER TABLE public.ledger DROP CONSTRAINT IF EXISTS ledger_type_check;

-- RLS for unit_registry and unit_lifecycle inserts (needed for some atomic flows)
CREATE POLICY "Allow authenticated insert" ON public.unit_registry 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  
CREATE POLICY "Allow tenant insert" ON public.unit_lifecycle 
  FOR INSERT WITH CHECK (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));


-- Replace create_purchase_order to accept p_payment_note and log platform_fee
CREATE OR REPLACE FUNCTION public.create_purchase_order(
  p_order_id uuid,
  p_counterparty_id uuid,
  p_channel text,
  p_platform_fee numeric,
  p_payment_mode text,
  p_initial_payment numeric,
  p_due_date date,
  p_notes text,
  p_items jsonb,
  p_payment_note text DEFAULT NULL::text
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_tenant_id UUID;
  v_user_id   UUID;
  v_payment_id UUID;
  v_total     NUMERIC(12,2) := 0;
  v_status    TEXT;
  v_item      JSONB;
BEGIN
  -- CHECK IDEMPOTENCY
  IF EXISTS (SELECT 1 FROM public.purchase_orders WHERE id = p_order_id) THEN
    SELECT total_amount, status INTO v_total, v_status FROM public.purchase_orders WHERE id = p_order_id;
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

  INSERT INTO public.purchase_orders (
    id, tenant_id, counterparty_id, acquisition_channel, platform_fee,
    phones_ordered, total_amount, amount_paid, status, payment_mode, due_date, notes
  )
  VALUES (
    p_order_id, v_tenant_id, p_counterparty_id, COALESCE(p_channel, 'DIRECT'), 
    COALESCE(p_platform_fee, 0), jsonb_array_length(p_items),
    v_total, GREATEST(p_initial_payment, 0), v_status,
    NULLIF(p_payment_mode,''), p_due_date, p_notes
  );

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO public.purchase_order_items (
      purchase_order_id, phone_id, purchase_price, status,
      brand, model, storage, color, ram, imei
    )
    VALUES (
      p_order_id, 
      (v_item->>'phone_id')::UUID, 
      (v_item->>'purchase_price')::NUMERIC, 
      'PENDING_INSPECTION',
      (v_item->>'brand'),
      (v_item->>'model'),
      (v_item->>'storage'),
      (v_item->>'color'),
      (v_item->>'ram'),
      (v_item->>'imei')
    );

    IF (v_item->>'phone_id') IS NOT NULL THEN
      UPDATE public.phones 
      SET purchase_order_id = p_order_id, purchase_price = (v_item->>'purchase_price')::NUMERIC, updated_at = now()
      WHERE id = (v_item->>'phone_id')::UUID AND tenant_id = v_tenant_id;
    END IF;
  END LOOP;

  IF COALESCE(p_platform_fee, 0) > 0 THEN
    INSERT INTO public.ledger (id, tenant_id, user_id, type, purchase_order_id, amount, payment_mode, note, created_at)
    VALUES (gen_random_uuid(), v_tenant_id, v_user_id, 'PLATFORM_FEE', p_order_id, -p_platform_fee, COALESCE(NULLIF(p_payment_mode,''), 'CASH'), 'Platform Fee Deduction', now());
  END IF;

  IF p_initial_payment > 0 THEN
    INSERT INTO public.supplier_payments (tenant_id, counterparty_id, total_paid, mode, note, recorded_by)
    VALUES (v_tenant_id, p_counterparty_id, p_initial_payment, COALESCE(NULLIF(p_payment_mode,''), 'CASH'), p_payment_note, v_user_id)
    RETURNING id INTO v_payment_id;

    INSERT INTO public.supplier_allocations (supplier_payment_id, purchase_order_id, amount_allocated)
    VALUES (v_payment_id, p_order_id, p_initial_payment);

    INSERT INTO public.ledger (id, tenant_id, user_id, type, purchase_order_id, supplier_payment_id, amount, payment_mode, note, created_at)
    VALUES (gen_random_uuid(), v_tenant_id, v_user_id, 'SUPPLIER_PAYMENT', p_order_id, v_payment_id, -p_initial_payment, NULLIF(p_payment_mode,''), COALESCE(p_payment_note, 'Advance Payment'), now());
  END IF;

  RETURN jsonb_build_object('order_id', p_order_id, 'total', v_total, 'status', v_status);
END;
$function$;

-- Replace create_trade_order to fix the RETURNING id issue, accept p_payment_note, and link payment to ledger properly
CREATE OR REPLACE FUNCTION public.create_trade_order(
  p_order_id uuid,
  p_counterparty_id uuid,
  p_order_type text,
  p_payment_mode text,
  p_initial_payment numeric,
  p_due_date date,
  p_notes text,
  p_items jsonb,
  p_payment_note text DEFAULT NULL::text
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_tenant_id UUID;
  v_user_id   UUID;
  v_total     NUMERIC(12,2) := 0;
  v_status    TEXT;
  v_item      JSONB;
  v_effective NUMERIC(12,2);
  v_new_payment_id UUID;
BEGIN
  -- CHECK IDEMPOTENCY
  IF EXISTS (SELECT 1 FROM public.sale_orders WHERE id = p_order_id) THEN
    SELECT total_amount, status INTO v_total, v_status FROM public.sale_orders WHERE id = p_order_id;
    RETURN jsonb_build_object('order_id', p_order_id, 'total', v_total, 'status', v_status, 'synced', true);
  END IF;

  SELECT tenant_id INTO v_tenant_id FROM public.profiles WHERE id = auth.uid();
  v_user_id := auth.uid();
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'No tenant'; END IF;

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

  INSERT INTO public.sale_orders (id, tenant_id, counterparty_id, order_type,
    total_amount, amount_paid, status, payment_mode, due_date, notes)
  VALUES (p_order_id, v_tenant_id, p_counterparty_id, p_order_type,
    v_total, GREATEST(p_initial_payment, 0), v_status,
    NULLIF(p_payment_mode,''), p_due_date, p_notes);

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_effective := (v_item->>'sale_price')::NUMERIC
                 - COALESCE((v_item->>'discount_amount')::NUMERIC, 0);

    INSERT INTO public.sale_order_items (sale_order_id, phone_id, sale_price,
      discount_amount, imei_snapshot, brand_snapshot, model_snapshot,
      storage_snapshot, color_snapshot)
    VALUES (p_order_id, (v_item->>'phone_id')::UUID, (v_item->>'sale_price')::NUMERIC,
      COALESCE((v_item->>'discount_amount')::NUMERIC, 0),
      ARRAY(SELECT jsonb_array_elements_text(v_item->'imei_snapshot')),
      v_item->>'brand', v_item->>'model', v_item->>'storage', v_item->>'color');

    UPDATE public.phones SET status = 'SOLD',
      sale_price = v_effective, sale_order_id = p_order_id, updated_at = now()
    WHERE id = (v_item->>'phone_id')::UUID AND tenant_id = v_tenant_id;
  END LOOP;

  IF p_initial_payment > 0 THEN
    INSERT INTO public.customer_payments (id, tenant_id, counterparty_id,
      total_received, mode, note, recorded_by)
    VALUES (gen_random_uuid(), v_tenant_id, p_counterparty_id,
      p_initial_payment, COALESCE(NULLIF(p_payment_mode,''), 'CASH'), p_payment_note, v_user_id)
    RETURNING id INTO v_new_payment_id;
    
    INSERT INTO public.payment_allocations (customer_payment_id, sale_order_id, amount_allocated)
    VALUES (v_new_payment_id, p_order_id, p_initial_payment);

    INSERT INTO public.ledger (id, tenant_id, user_id, type,
      sale_order_id, customer_payment_id, amount, payment_mode, note, created_at)
    VALUES (gen_random_uuid(), v_tenant_id, v_user_id, 'CUSTOMER_PAYMENT',
      p_order_id, v_new_payment_id, p_initial_payment, NULLIF(p_payment_mode,''), COALESCE(p_payment_note, 'Advance Payment'), now());
  END IF;

  RETURN jsonb_build_object('order_id', p_order_id, 'total', v_total, 'status', v_status);
EXCEPTION WHEN OTHERS THEN RAISE;
END;
$function$;

-- Update record_customer_payment for single-entry ledger
CREATE OR REPLACE FUNCTION public.record_customer_payment(
  p_counterparty_id uuid,
  p_total_received numeric,
  p_mode text,
  p_allocations jsonb,
  p_note text DEFAULT NULL::text,
  p_type text DEFAULT 'CUSTOMER_PAYMENT'::text
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_tenant_id UUID;
  v_user_id   UUID;
  v_payment_id UUID;
  v_alloc     JSONB;
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM public.profiles WHERE id = auth.uid();
  v_user_id := auth.uid();
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'No tenant'; END IF;

  INSERT INTO public.customer_payments (tenant_id, counterparty_id, total_received, mode, note, recorded_by)
  VALUES (v_tenant_id, p_counterparty_id, p_total_received, p_mode, p_note, v_user_id)
  RETURNING id INTO v_payment_id;

  -- SINGLE ENTRY LOGGING IN LEDGER FOR ENTIRE PAYMENT
  INSERT INTO public.ledger (tenant_id, user_id, type, amount, payment_mode, note, customer_payment_id)
  VALUES (v_tenant_id, v_user_id, COALESCE(p_type, 'CUSTOMER_PAYMENT'), p_total_received, p_mode, COALESCE(p_note, 'Customer Payment Received'), v_payment_id);

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
$function$;

-- Update record_supplier_payment for single-entry ledger
CREATE OR REPLACE FUNCTION public.record_supplier_payment(
  p_counterparty_id uuid,
  p_total_paid numeric,
  p_mode text,
  p_allocations jsonb,
  p_note text DEFAULT NULL::text,
  p_type text DEFAULT 'SUPPLIER_PAYMENT'::text
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_tenant_id UUID;
  v_user_id   UUID;
  v_payment_id UUID;
  v_alloc     JSONB;
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM public.profiles WHERE id = auth.uid();
  v_user_id := auth.uid();
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'No tenant'; END IF;

  INSERT INTO public.supplier_payments (tenant_id, counterparty_id, total_paid, mode, note, recorded_by)
  VALUES (v_tenant_id, p_counterparty_id, p_total_paid, p_mode, p_note, v_user_id)
  RETURNING id INTO v_payment_id;

  -- SINGLE ENTRY LOGGING IN LEDGER FOR ENTIRE PAYMENT
  INSERT INTO public.ledger (tenant_id, user_id, type, amount, payment_mode, note, supplier_payment_id)
  VALUES (v_tenant_id, v_user_id, COALESCE(p_type, 'SUPPLIER_PAYMENT'), -p_total_paid, p_mode, COALESCE(p_note, 'Supplier Payment Given'), v_payment_id);

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
$function$;
