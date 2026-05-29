-- Fix: Make cancel_sale_order idempotent
-- If the order is already CANCELLED, return silently instead of throwing an error.
-- This prevents the UI outbox from getting stuck in an infinite retry loop if the
-- first RPC call succeeds but the network drops before the client receives the 2xx response.

CREATE OR REPLACE FUNCTION public.cancel_sale_order(p_order_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $$
DECLARE
  v_tenant_id UUID;
  v_status    TEXT;
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM public.profiles WHERE id = auth.uid();
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'No tenant'; END IF;

  SELECT status INTO v_status
  FROM public.sale_orders
  WHERE id = p_order_id AND tenant_id = v_tenant_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_status = 'RETURNED' THEN
    RAISE EXCEPTION 'Order already RETURNED and cannot be cancelled';
  END IF;

  -- Idempotency check: if already cancelled, just return success
  IF v_status = 'CANCELLED' THEN
    RETURN;
  END IF;

  -- Set status to CANCELLED
  UPDATE public.sale_orders
  SET status = 'CANCELLED', updated_at = now()
  WHERE id = p_order_id AND tenant_id = v_tenant_id;

  -- Restock all phones
  UPDATE public.phones
  SET status = 'IN_STOCK', sale_order_id = NULL, sale_price = NULL, updated_at = now()
  WHERE sale_order_id = p_order_id AND tenant_id = v_tenant_id;

  -- Void all linked ledger entries
  UPDATE public.ledger
  SET is_voided = TRUE
  WHERE sale_order_id = p_order_id AND tenant_id = v_tenant_id AND is_voided = FALSE;
END;
$$;
