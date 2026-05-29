-- Add unit_lifecycle logging for RESTOCKED/RETURNED phones when a sale order is cancelled
-- Uses a hybrid approach:
-- If cancelled within 24 hours, it assumes a clerical error and deletes the SOLD event.
-- If cancelled after 24 hours, it logs a RETURNED event to preserve the audit trail.

CREATE OR REPLACE FUNCTION public.cancel_sale_order(p_order_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $$
DECLARE
  v_tenant_id       UUID;
  v_tenant_name     TEXT;
  v_tenant_location TEXT;
  v_status          TEXT;
  v_created_at      TIMESTAMPTZ;
  v_phone_record    RECORD;
  v_unit_id         UUID;
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM public.profiles WHERE id = auth.uid();
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'No tenant'; END IF;

  SELECT name, address INTO v_tenant_name, v_tenant_location
  FROM public.tenants WHERE id = v_tenant_id;

  SELECT status, created_at INTO v_status, v_created_at
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

  -- Handle unit_lifecycle for all restocked phones
  FOR v_phone_record IN
    SELECT p.imeis, p.sale_price
    FROM public.phones p
    WHERE p.sale_order_id = p_order_id AND p.tenant_id = v_tenant_id
  LOOP
    SELECT id INTO v_unit_id
    FROM public.unit_registry
    WHERE (imei1 = ANY(v_phone_record.imeis) OR imei2 = ANY(v_phone_record.imeis))
    LIMIT 1;

    IF v_unit_id IS NOT NULL THEN
      IF now() - v_created_at <= interval '24 hours' THEN
        -- Cancelled within 24 hours: Erase the last SOLD event
        DELETE FROM public.unit_lifecycle
        WHERE id = (
          SELECT id FROM public.unit_lifecycle 
          WHERE unit_id = v_unit_id AND event_type = 'SOLD' AND tenant_id = v_tenant_id
          ORDER BY event_date DESC LIMIT 1
        );
      ELSE
        -- Cancelled after 24 hours: Append a RETURNED event
        INSERT INTO public.unit_lifecycle (unit_id, event_type, tenant_id, label, price, location)
        VALUES (
          v_unit_id,
          'RETURNED',
          v_tenant_id,
          COALESCE(v_tenant_name, 'Authorized Partner'),
          v_phone_record.sale_price,
          v_tenant_location
        );
      END IF;
    END IF;
  END LOOP;

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
