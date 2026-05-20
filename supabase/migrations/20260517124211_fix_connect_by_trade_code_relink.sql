CREATE OR REPLACE FUNCTION public.connect_by_trade_code(
  p_trade_code  text,
  p_type_for_me text,
  p_type_for_them text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_my_tenant_id    UUID;
  v_my_tenant_name  TEXT;
  v_target          RECORD;
  v_my_cp_id        UUID;
  v_their_cp_id     UUID;
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

  -- ── MY SIDE ─────────────────────────────────────────────────────────────────
  -- 1. Already fully linked → return early (idempotent)
  SELECT id INTO v_my_cp_id
  FROM public.counterparties
  WHERE tenant_id = v_my_tenant_id
    AND linked_tenant_id = v_target.id
    AND deleted_at IS NULL
  LIMIT 1;

  IF v_my_cp_id IS NOT NULL THEN
    -- Already connected — just return the existing counterparty
    RETURN jsonb_build_object(
      'counterparty_id',   v_my_cp_id,
      'their_name',        v_target.name,
      'already_connected', true
    );
  END IF;

  -- 2. Counterparty exists but was previously unlinked (linked_tenant_id is NULL)
  --    → re-link the existing record instead of creating a duplicate
  SELECT id INTO v_my_cp_id
  FROM public.counterparties
  WHERE tenant_id       = v_my_tenant_id
    AND LOWER(name)     = LOWER(v_target.name)
    AND linked_tenant_id IS NULL
    AND deleted_at       IS NULL
  LIMIT 1;

  IF v_my_cp_id IS NOT NULL THEN
    -- Re-link existing record
    UPDATE public.counterparties
    SET linked_tenant_id = v_target.id,
        type             = p_type_for_me,
        updated_at       = now()
    WHERE id = v_my_cp_id;
  ELSE
    -- 3. No existing record at all → create fresh
    v_my_cp_id := gen_random_uuid();
    INSERT INTO public.counterparties
      (id, tenant_id, name, type, linked_tenant_id, created_at, updated_at)
    VALUES
      (v_my_cp_id, v_my_tenant_id, v_target.name, p_type_for_me, v_target.id, now(), now());
  END IF;

  -- ── THEIR SIDE ──────────────────────────────────────────────────────────────
  -- 1. Already linked on their side
  SELECT id INTO v_their_cp_id
  FROM public.counterparties
  WHERE tenant_id       = v_target.id
    AND linked_tenant_id = v_my_tenant_id
    AND deleted_at       IS NULL
  LIMIT 1;

  IF v_their_cp_id IS NULL THEN
    -- 2. Their side was previously unlinked → re-link
    SELECT id INTO v_their_cp_id
    FROM public.counterparties
    WHERE tenant_id       = v_target.id
      AND LOWER(name)     = LOWER(v_my_tenant_name)
      AND linked_tenant_id IS NULL
      AND deleted_at       IS NULL
    LIMIT 1;

    IF v_their_cp_id IS NOT NULL THEN
      UPDATE public.counterparties
      SET linked_tenant_id = v_my_tenant_id,
          type             = p_type_for_them,
          updated_at       = now()
      WHERE id = v_their_cp_id;
    ELSE
      -- 3. No existing record on their side → create fresh
      v_their_cp_id := gen_random_uuid();
      INSERT INTO public.counterparties
        (id, tenant_id, name, type, linked_tenant_id, created_at, updated_at)
      VALUES
        (v_their_cp_id, v_target.id, v_my_tenant_name, p_type_for_them, v_my_tenant_id, now(), now());
    END IF;
  END IF;

  -- Notify the other business
  INSERT INTO public.notifications
    (tenant_id, type, title, message, created_at)
  VALUES (
    v_target.id,
    'CONNECTION_ACCEPTED',
    'New Trade Connection',
    v_my_tenant_name || ' connected with your business on Finventree',
    now()
  );

  RETURN jsonb_build_object(
    'counterparty_id',   v_my_cp_id,
    'their_name',        v_target.name,
    'their_cp_id',       v_their_cp_id,
    'already_connected', false
  );
END;
$$;;
