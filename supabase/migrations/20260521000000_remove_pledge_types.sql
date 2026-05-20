-- Migration: Remove pledge/lien ledger entry types and migrate existing data
-- The FUNDS_PLEDGED, FUNDS_RELEASED, FUNDS_CONSUMED types are obsolete.
-- All phones now enter inventory via Purchase Orders, which record SUPPLIER_PAYMENT directly.

-- 1. Migrate existing FUNDS_CONSUMED entries to SUPPLIER_PAYMENT
UPDATE public.ledger
SET type = 'SUPPLIER_PAYMENT'
WHERE type = 'FUNDS_CONSUMED';

-- 2. Delete orphaned FUNDS_PLEDGED and FUNDS_RELEASED entries (escrow that no longer applies)
DELETE FROM public.ledger
WHERE type IN ('FUNDS_PLEDGED', 'FUNDS_RELEASED');

-- 3. Drop the old type check constraint (if it exists) and add an updated one
ALTER TABLE public.ledger
  DROP CONSTRAINT IF EXISTS ledger_type_check;

ALTER TABLE public.ledger
  ADD CONSTRAINT ledger_type_check CHECK (
    type = ANY (ARRAY[
      'MONEY_ADDED', 'CAPITAL_INJECTION', 'CUSTOMER_PAYMENT',
      'SUPPLIER_PAYMENT', 'PHONE_SALE', 'REPAIR_COST',
      'WITHDRAWAL', 'PROFIT_WITHDRAWAL', 'INVENTORY_ADJUSTMENT',
      'DEBT_PLEDGED', 'DEBT_SETTLEMENT', 'ADVANCE_RECEIVED',
      'ADVANCE_SUPPLIER', 'OPERATIONAL_EXPENSE'
    ])
  );

-- 4. Update create_purchase_order RPC to use SUPPLIER_PAYMENT instead of FUNDS_CONSUMED
-- (Patching the function inline — replaces the single ledger INSERT inside the RPC)
CREATE OR REPLACE FUNCTION public.create_purchase_order(
  p_tenant_id uuid,
  p_user_id uuid,
  p_counterparty_id uuid,
  p_items jsonb,
  p_initial_payment numeric DEFAULT 0,
  p_payment_mode text DEFAULT 'CASH',
  p_order_id uuid DEFAULT gen_random_uuid()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id uuid := p_tenant_id;
  v_user_id   uuid := p_user_id;
  v_item      jsonb;
  v_total     numeric := 0;
  v_status    text;
  v_payment_id uuid;
BEGIN
  -- Insert the purchase order header
  INSERT INTO public.purchase_orders (id, tenant_id, user_id, counterparty_id, status, created_at, updated_at)
  VALUES (p_order_id, v_tenant_id, v_user_id, p_counterparty_id, 'OPEN', now(), now());

  -- Insert each line item and optionally link phones
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.purchase_order_items (
      id, tenant_id, purchase_order_id, brand, model, storage, color,
      purchase_price, status, created_at, updated_at
    ) VALUES (
      COALESCE((v_item->>'id')::uuid, gen_random_uuid()),
      v_tenant_id,
      p_order_id,
      v_item->>'brand',
      v_item->>'model',
      v_item->>'storage',
      v_item->>'color',
      (v_item->>'purchase_price')::numeric,
      COALESCE(v_item->>'status', 'PENDING'),
      now(), now()
    );

    v_total := v_total + (v_item->>'purchase_price')::numeric;

    IF (v_item->>'phone_id') IS NOT NULL THEN
      UPDATE public.phones
      SET purchase_order_id = p_order_id, purchase_price = (v_item->>'purchase_price')::NUMERIC, updated_at = now()
      WHERE id = (v_item->>'phone_id')::UUID AND tenant_id = v_tenant_id;
    END IF;
  END LOOP;

  v_status := CASE WHEN p_initial_payment >= v_total THEN 'PAID' ELSE 'OPEN' END;

  UPDATE public.purchase_orders SET total = v_total, status = v_status, updated_at = now()
  WHERE id = p_order_id;

  IF p_initial_payment > 0 THEN
    -- Use SUPPLIER_PAYMENT (replaces legacy FUNDS_CONSUMED)
    INSERT INTO public.ledger (id, tenant_id, user_id, type, purchase_order_id, amount, payment_mode, created_at)
    VALUES (gen_random_uuid(), v_tenant_id, v_user_id, 'SUPPLIER_PAYMENT', p_order_id, -p_initial_payment, NULLIF(p_payment_mode,''), now());

    INSERT INTO public.supplier_payments (tenant_id, counterparty_id, total_paid, mode, recorded_by)
    VALUES (v_tenant_id, p_counterparty_id, p_initial_payment, COALESCE(NULLIF(p_payment_mode,''), 'CASH'), v_user_id)
    RETURNING id INTO v_payment_id;

    INSERT INTO public.supplier_allocations (supplier_payment_id, purchase_order_id, amount_allocated)
    VALUES (v_payment_id, p_order_id, p_initial_payment);
  END IF;

  RETURN jsonb_build_object('order_id', p_order_id, 'total', v_total, 'status', v_status);
END;
$$;
