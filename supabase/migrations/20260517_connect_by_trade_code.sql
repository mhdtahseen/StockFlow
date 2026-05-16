-- =====================================================================
-- Trade Network: QR Connect — mutual counterparty creation via Trade Code
-- =====================================================================
-- Adds:
--   • connect_by_trade_code(p_trade_code, p_type_for_me, p_type_for_them)
--     Creates a counterparty on BOTH sides, sets linked_tenant_id,
--     inserts a CONNECTION_ACCEPTED notification on the receiver's side.
--     Idempotent: returns existing counterparty if already linked.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.connect_by_trade_code(
  p_trade_code    TEXT,
  p_type_for_me   TEXT, -- how I classify them (CUSTOMER/WHOLESALER/RETAILER)
  p_type_for_them TEXT  -- how they should classify me (inverse)
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_my_tenant_id        UUID;
  v_my_tenant_name      TEXT;
  v_target              RECORD;
  v_existing_cp_id      UUID;
  v_my_cp_id            UUID;
  v_their_cp_id         UUID;
BEGIN
  -- Identify caller's tenant
  SELECT tenant_id INTO v_my_tenant_id
  FROM public.profiles WHERE id = auth.uid();
  IF v_my_tenant_id IS NULL THEN RAISE EXCEPTION 'No tenant found for current user'; END IF;

  SELECT name INTO v_my_tenant_name FROM public.tenants WHERE id = v_my_tenant_id;

  -- Resolve target tenant by trade code
  SELECT id, name INTO v_target
  FROM public.tenants
  WHERE UPPER(trade_code) = UPPER(p_trade_code)
    AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active Finventree business found with that Trade Code';
  END IF;

  -- Block self-connection
  IF v_target.id = v_my_tenant_id THEN
    RAISE EXCEPTION 'You cannot connect to your own business';
  END IF;

  -- Idempotency: check if counterparty already exists on my side for this tenant
  SELECT id INTO v_existing_cp_id
  FROM public.counterparties
  WHERE tenant_id = v_my_tenant_id
    AND linked_tenant_id = v_target.id
    AND deleted_at IS NULL
  LIMIT 1;

  IF v_existing_cp_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'counterparty_id',   v_existing_cp_id,
      'their_name',        v_target.name,
      'already_connected', true
    );
  END IF;

  -- ── Create counterparty on MY side ────────────────────────────────
  v_my_cp_id := gen_random_uuid();
  INSERT INTO public.counterparties
    (id, tenant_id, name, type, linked_tenant_id, created_at, updated_at)
  VALUES
    (v_my_cp_id, v_my_tenant_id, v_target.name, p_type_for_me, v_target.id, now(), now());

  -- ── Create counterparty on THEIR side (if not already present) ────
  SELECT id INTO v_their_cp_id
  FROM public.counterparties
  WHERE tenant_id = v_target.id
    AND linked_tenant_id = v_my_tenant_id
    AND deleted_at IS NULL
  LIMIT 1;

  IF v_their_cp_id IS NULL THEN
    v_their_cp_id := gen_random_uuid();
    INSERT INTO public.counterparties
      (id, tenant_id, name, type, linked_tenant_id, created_at, updated_at)
    VALUES
      (v_their_cp_id, v_target.id, v_my_tenant_name, p_type_for_them, v_my_tenant_id, now(), now());
  END IF;

  -- ── Notify the other business ─────────────────────────────────────
  INSERT INTO public.notifications
    (tenant_id, type, title, body, metadata, created_at)
  VALUES (
    v_target.id,
    'CONNECTION_ACCEPTED',
    'New Trade Connection',
    v_my_tenant_name || ' connected with your business on Finventree',
    jsonb_build_object(
      'counterparty_id',    v_their_cp_id,
      'their_tenant_id',    v_my_tenant_id,
      'their_tenant_name',  v_my_tenant_name
    ),
    now()
  );

  RETURN jsonb_build_object(
    'counterparty_id',   v_my_cp_id,
    'their_name',        v_target.name,
    'their_cp_id',       v_their_cp_id,
    'already_connected', false
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.connect_by_trade_code(TEXT, TEXT, TEXT) TO authenticated;
