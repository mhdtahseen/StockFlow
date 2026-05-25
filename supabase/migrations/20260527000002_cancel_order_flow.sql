-- Migration: Cancel Order Flow
--
-- Adds cancel_sale_order and cancel_purchase_order RPCs.
-- Cancel is distinct from soft-delete (archive):
--   - Cancel sets status = 'CANCELLED' (user-visible)
--   - Voids all linked ledger entries
--   - For SO: restocks phones
--   - For PO: restocks phones that were already received

-- ═══════════════════════════════════════════════════════════════════════
-- 1. cancel_sale_order
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION "public"."cancel_sale_order"(
  "p_order_id" uuid
) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER
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

  IF v_status IN ('CANCELLED', 'RETURNED') THEN
    RAISE EXCEPTION 'Order already % and cannot be cancelled', v_status;
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

-- ═══════════════════════════════════════════════════════════════════════
-- 2. cancel_purchase_order
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION "public"."cancel_purchase_order"(
  "p_order_id" uuid
) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path TO ''
AS $$
DECLARE
  v_tenant_id UUID;
  v_status    TEXT;
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM public.profiles WHERE id = auth.uid();
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'No tenant'; END IF;

  SELECT status INTO v_status
  FROM public.purchase_orders
  WHERE id = p_order_id AND tenant_id = v_tenant_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Purchase order not found';
  END IF;

  IF v_status = 'CANCELLED' THEN
    RAISE EXCEPTION 'Order already cancelled';
  END IF;

  -- Set status to CANCELLED
  UPDATE public.purchase_orders
  SET status = 'CANCELLED', updated_at = now()
  WHERE id = p_order_id AND tenant_id = v_tenant_id;

  -- Restock any phones that were received for this PO
  UPDATE public.phones
  SET status = 'IN_STOCK', purchase_order_id = NULL, updated_at = now()
  WHERE purchase_order_id = p_order_id AND tenant_id = v_tenant_id;

  -- Void all linked ledger entries
  UPDATE public.ledger
  SET is_voided = TRUE
  WHERE purchase_order_id = p_order_id AND tenant_id = v_tenant_id AND is_voided = FALSE;
END;
$$;
