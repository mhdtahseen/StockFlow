-- =====================================================================
-- Trade Network: Auto GST Synchronization
-- =====================================================================
-- Updates connect_by_trade_code and link_counterparty_to_tenant to
-- populate GSTIN automatically upon connection.
-- Adds a trigger on the tenants table to propagate gstin changes in
-- real-time to all linked counterparties.
-- =====================================================================

-- ── 1. Update connect_by_trade_code to copy GSTIN ─────────────────────
CREATE OR REPLACE FUNCTION public.connect_by_trade_code(
  p_trade_code    TEXT,
  p_type_for_me   TEXT, -- how I classify them
  p_type_for_them TEXT  -- how they should classify me
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_my_tenant_id        UUID;
  v_my_tenant_name      TEXT;
  v_my_tenant_gstin     TEXT;
  v_target              RECORD;
  v_existing_cp_id      UUID;
  v_my_cp_id            UUID;
  v_their_cp_id         UUID;
BEGIN
  -- Identify caller's tenant
  SELECT tenant_id INTO v_my_tenant_id
  FROM public.profiles WHERE id = auth.uid();
  IF v_my_tenant_id IS NULL THEN RAISE EXCEPTION 'No tenant found for current user'; END IF;

  SELECT name, gstin INTO v_my_tenant_name, v_my_tenant_gstin FROM public.tenants WHERE id = v_my_tenant_id;

  -- Resolve target tenant by trade code
  SELECT id, name, gstin INTO v_target
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
    (id, tenant_id, name, type, linked_tenant_id, gstin, created_at, updated_at)
  VALUES
    (v_my_cp_id, v_my_tenant_id, v_target.name, p_type_for_me, v_target.id, v_target.gstin, now(), now());

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
      (id, tenant_id, name, type, linked_tenant_id, gstin, created_at, updated_at)
    VALUES
      (v_their_cp_id, v_target.id, v_my_tenant_name, p_type_for_them, v_my_tenant_id, v_my_tenant_gstin, now(), now());
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

-- ── 2. Update link_counterparty_to_tenant to copy GSTIN ───────────────
CREATE OR REPLACE FUNCTION public.link_counterparty_to_tenant(
  p_counterparty_id UUID,
  p_trade_code      TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_my_tenant_id    UUID;
  v_target_tenant   RECORD;
  v_counterparty    RECORD;
BEGIN
  SELECT tenant_id INTO v_my_tenant_id FROM public.profiles WHERE id = auth.uid();
  IF v_my_tenant_id IS NULL THEN RAISE EXCEPTION 'No tenant'; END IF;

  -- Fetch the target tenant
  SELECT id, name, gstin INTO v_target_tenant
  FROM public.tenants
  WHERE UPPER(trade_code) = UPPER(p_trade_code)
    AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active business found with that Trade Code';
  END IF;

  -- Block self-linking
  IF v_target_tenant.id = v_my_tenant_id THEN
    RAISE EXCEPTION 'You cannot link to your own business';
  END IF;

  -- Verify counterparty belongs to calling tenant
  SELECT id INTO v_counterparty
  FROM public.counterparties
  WHERE id = p_counterparty_id AND tenant_id = v_my_tenant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Counterparty not found';
  END IF;

  -- Link it and copy target tenant's GSTIN if available
  UPDATE public.counterparties
  SET linked_tenant_id = v_target_tenant.id,
      gstin = COALESCE(v_target_tenant.gstin, gstin),
      updated_at = now()
  WHERE id = p_counterparty_id AND tenant_id = v_my_tenant_id;

  RETURN jsonb_build_object(
    'linked',      true,
    'tenant_id',   v_target_tenant.id,
    'tenant_name', v_target_tenant.name
  );
END;
$$;

-- ── 3. Add Trigger to Sync GSTIN updates ──────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_tenant_gstin_to_counterparties()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF (OLD.gstin IS DISTINCT FROM NEW.gstin) THEN
    UPDATE public.counterparties
    SET gstin = NEW.gstin,
        updated_at = now()
    WHERE linked_tenant_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_tenant_gstin_to_counterparties ON public.tenants;
CREATE TRIGGER trg_sync_tenant_gstin_to_counterparties
  AFTER UPDATE OF gstin ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_tenant_gstin_to_counterparties();
