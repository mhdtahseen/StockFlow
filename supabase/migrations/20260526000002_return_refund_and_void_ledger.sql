-- Migration: Sale return refund entry + ledger is_voided column for soft-delete
--
-- GAP 2: return_order now accepts a refund amount and creates a negative
--         CUSTOMER_PAYMENT ledger entry so refunds are tracked financially.
--
-- GAP 5: Add is_voided column to ledger. soft_delete_purchase_order and
--         soft_delete_sale_order now void linked ledger entries so they
--         don't count in wallet/analytics after deletion.

-- ═══════════════════════════════════════════════════════════════════════
-- 1. Add is_voided column to ledger
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE public.ledger
  ADD COLUMN IF NOT EXISTS is_voided BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_ledger_is_voided
  ON public.ledger (tenant_id, is_voided)
  WHERE is_voided = FALSE;

-- ═══════════════════════════════════════════════════════════════════════
-- 2. Fix return_order: accept refund amount, record ledger entry
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
  v_tenant_id UUID;
  v_user_id   UUID;
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM public.profiles WHERE id = auth.uid();
  v_user_id := auth.uid();
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'No tenant'; END IF;

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

ALTER FUNCTION public.return_order(uuid, numeric, text) OWNER TO postgres;

-- Drop the old 1-param overload so there's no ambiguity
DROP FUNCTION IF EXISTS public.return_order(uuid);

-- ═══════════════════════════════════════════════════════════════════════
-- 3. Fix soft_delete_purchase_order: void linked ledger entries
-- ═══════════════════════════════════════════════════════════════════════
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

  -- Void all ledger entries linked to this PO
  UPDATE public.ledger
  SET is_voided = TRUE
  WHERE purchase_order_id = p_order_id AND tenant_id = v_tenant_id;

  UPDATE public.purchase_orders
  SET deleted_at = now(), updated_at = now()
  WHERE id = p_order_id AND tenant_id = v_tenant_id;
END;
$$;

ALTER FUNCTION public.soft_delete_purchase_order(UUID) OWNER TO postgres;

-- ═══════════════════════════════════════════════════════════════════════
-- 4. Fix soft_delete_sale_order: void linked ledger entries
-- ═══════════════════════════════════════════════════════════════════════
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

  -- Void all ledger entries linked to this SO
  UPDATE public.ledger
  SET is_voided = TRUE
  WHERE sale_order_id = p_order_id AND tenant_id = v_tenant_id;

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
