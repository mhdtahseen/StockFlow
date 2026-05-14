


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."lifecycle_event_type" AS ENUM (
    'PURCHASED',
    'SOLD',
    'REPAIR',
    'TRANSFER'
);


ALTER TYPE "public"."lifecycle_event_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."broadcast_system_notification"("p_title" "text", "p_message" "text", "p_target_role" "text" DEFAULT 'all'::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_user_record RECORD;
BEGIN
  FOR v_user_record IN 
    SELECT p.id as profile_id, p.tenant_id 
    FROM public.profiles p
    WHERE 
      (p_target_role = 'all') OR 
      (p_target_role = 'admin' AND p.role IN ('admin', 'super-admin')) OR
      (p_target_role = 'super-admin' AND p.role = 'super-admin') OR
      (p_target_role = p.role)
  LOOP
    INSERT INTO public.notifications (user_id, tenant_id, title, message, type)
    VALUES (v_user_record.profile_id, v_user_record.tenant_id, p_title, p_message, 'SYSTEM_ALERT');
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."broadcast_system_notification"("p_title" "text", "p_message" "text", "p_target_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."certify_po_receipt"("p_order_id" "uuid", "p_items" "jsonb", "p_status" "text", "p_phones_received" integer, "p_total_amount" numeric, "p_tenant_id" "uuid", "p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  r RECORD;
BEGIN
  -- 1. Insert into inventory (phones) FIRST
  -- This is required because purchase_order_items.phone_id depends on phones.id (Foreign Key)
  INSERT INTO phones (
    id, tenant_id, user_id, brand, model, ram, storage, color, 
    imeis, purchase_price, sale_price, status, issue_tags, 
    purchase_order_id, created_at, updated_at
  )
  SELECT 
    (val->'phone'->>'id')::UUID,
    p_tenant_id,
    p_user_id,
    val->'phone'->>'brand',
    val->'phone'->>'model',
    COALESCE(val->'phone'->>'ram', 'N/A'),
    val->'phone'->>'storage',
    val->'phone'->>'color',
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(val->'phone'->'imeis', '[]'::jsonb))),
    (val->'phone'->>'purchasePrice')::NUMERIC,
    (val->'phone'->>'salePrice')::NUMERIC,
    val->'phone'->>'status',
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(val->'phone'->'issueTags', '[]'::jsonb))),
    p_order_id,
    COALESCE((val->'phone'->>'createdAt')::TIMESTAMPTZ, NOW()),
    NOW()
  FROM jsonb_array_elements(p_items) AS val
  WHERE val->>'status' = 'ACCEPTED' AND val ? 'phone'
  ON CONFLICT (id) DO UPDATE SET
    updated_at = NOW();

  -- 2. Update individual order items
  FOR r IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    id UUID,
    status TEXT,
    "phoneId" UUID,
    "rejectionReason" TEXT,
    "purchasePrice" NUMERIC,
    brand TEXT,
    model TEXT,
    storage TEXT,
    color TEXT,
    ram TEXT,
    imei TEXT,
    "issueTags" JSONB
  ) LOOP
    UPDATE purchase_order_items
    SET 
      status = r.status,
      phone_id = CASE WHEN r.status = 'ACCEPTED' THEN r."phoneId" ELSE NULL END,
      rejection_reason = r."rejectionReason",
      purchase_price = r."purchasePrice",
      brand = r.brand,
      model = r.model,
      storage = r.storage,
      color = r.color,
      ram = r.ram,
      imei = r.imei,
      issue_tags = ARRAY(SELECT jsonb_array_elements_text(COALESCE(r."issueTags", '[]'::jsonb))),
      updated_at = NOW()
    WHERE id = r.id;
  END LOOP;

  -- 3. Update Purchase Order Status and Totals (RECALCULATED)
  UPDATE purchase_orders
  SET 
    status = p_status,
    phones_received = (
      SELECT COUNT(*) 
      FROM purchase_order_items 
      WHERE purchase_order_id = p_order_id AND status = 'ACCEPTED'
    ),
    total_amount = (
      SELECT COALESCE(SUM(purchase_price), 0)
      FROM purchase_order_items 
      WHERE purchase_order_id = p_order_id AND status = 'ACCEPTED'
    ),
    updated_at = NOW()
  WHERE id = p_order_id;

END;
$$;


ALTER FUNCTION "public"."certify_po_receipt"("p_order_id" "uuid", "p_items" "jsonb", "p_status" "text", "p_phones_received" integer, "p_total_amount" numeric, "p_tenant_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_purchase_order"("p_order_id" "uuid", "p_counterparty_id" "uuid", "p_items" "jsonb", "p_initial_payment" numeric, "p_payment_mode" "text", "p_platform_fee" numeric, "p_payment_note" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id   UUID;
  v_total     NUMERIC(12,2) := 0;
  v_status    TEXT;
  v_item      JSONB;
  v_payment_id UUID;
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM public.profiles WHERE id = auth.uid();
  v_user_id := auth.uid();
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'No tenant'; END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_total := v_total + (v_item->>'purchase_price')::NUMERIC;
  END LOOP;

  v_status := CASE
    WHEN p_initial_payment <= 0 THEN 'OPEN'
    WHEN p_initial_payment >= v_total THEN 'SETTLED'
    ELSE 'PARTIAL'
  END;

  INSERT INTO public.purchase_orders (id, tenant_id, counterparty_id, total_amount, amount_paid, status, platform_fee)
  VALUES (p_order_id, v_tenant_id, p_counterparty_id, v_total, GREATEST(p_initial_payment, 0), v_status, p_platform_fee);

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO public.phones (id, tenant_id, purchase_order_id, brand, model, storage, color, ram, imei, purchase_price, status)
    VALUES ((v_item->>'phone_id')::UUID, v_tenant_id, p_order_id, v_item->>'brand', v_item->>'model', v_item->>'storage', v_item->>'color', v_item->>'ram', v_item->>'imei', (v_item->>'purchase_price')::NUMERIC, 'AVAILABLE');
  END LOOP;

  IF p_platform_fee > 0 THEN
    INSERT INTO public.ledger (id, tenant_id, user_id, type, reference_id, amount, payment_mode, note, created_at)
    VALUES (gen_random_uuid(), v_tenant_id, v_user_id, 'OPERATIONAL_EXPENSE', p_order_id, -p_platform_fee, COALESCE(NULLIF(p_payment_mode,''), 'CASH'), 'Platform Fee Deduction', now());
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
$$;


ALTER FUNCTION "public"."create_purchase_order"("p_order_id" "uuid", "p_counterparty_id" "uuid", "p_items" "jsonb", "p_initial_payment" numeric, "p_payment_mode" "text", "p_platform_fee" numeric, "p_payment_note" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_purchase_order"("p_order_id" "uuid", "p_counterparty_id" "uuid", "p_channel" "text", "p_platform_fee" numeric, "p_payment_mode" "text", "p_initial_payment" numeric, "p_due_date" "date", "p_notes" "text", "p_items" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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

  IF p_initial_payment > 0 THEN
    INSERT INTO public.ledger (id, tenant_id, user_id, type, purchase_order_id, amount, payment_mode, created_at)
    VALUES (gen_random_uuid(), v_tenant_id, v_user_id, 'FUNDS_CONSUMED', p_order_id, -p_initial_payment, NULLIF(p_payment_mode,''), now());

    INSERT INTO public.supplier_payments (tenant_id, counterparty_id, total_paid, mode, recorded_by)
    VALUES (v_tenant_id, p_counterparty_id, p_initial_payment, COALESCE(NULLIF(p_payment_mode,''), 'CASH'), v_user_id)
    RETURNING id INTO v_payment_id;

    INSERT INTO public.supplier_allocations (supplier_payment_id, purchase_order_id, amount_allocated)
    VALUES (v_payment_id, p_order_id, p_initial_payment);
  END IF;

  RETURN jsonb_build_object('order_id', p_order_id, 'total', v_total, 'status', v_status);
END;
$$;


ALTER FUNCTION "public"."create_purchase_order"("p_order_id" "uuid", "p_counterparty_id" "uuid", "p_channel" "text", "p_platform_fee" numeric, "p_payment_mode" "text", "p_initial_payment" numeric, "p_due_date" "date", "p_notes" "text", "p_items" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_purchase_order"("p_order_id" "uuid", "p_counterparty_id" "uuid", "p_channel" "text", "p_platform_fee" numeric, "p_payment_mode" "text", "p_initial_payment" numeric, "p_due_date" "date", "p_notes" "text", "p_items" "jsonb", "p_payment_note" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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

  INSERT INTO public.purchase_orders (id, tenant_id, counterparty_id, acquisition_channel, platform_fee, phones_ordered, total_amount, amount_paid, status, payment_mode, due_date, notes)
  VALUES (p_order_id, v_tenant_id, p_counterparty_id, COALESCE(p_channel, 'DIRECT'), COALESCE(p_platform_fee, 0), jsonb_array_length(p_items), v_total, GREATEST(p_initial_payment, 0), v_status, NULLIF(p_payment_mode,''), p_due_date, p_notes);

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO public.purchase_order_items (purchase_order_id, phone_id, purchase_price, status, brand, model, storage, color, ram, imei, issue_tags)
    VALUES (p_order_id, (v_item->>'phone_id')::UUID, (v_item->>'purchase_price')::NUMERIC, 'PENDING_INSPECTION', v_item->>'brand', v_item->>'model', v_item->>'storage', v_item->>'color', v_item->>'ram', v_item->>'imei', COALESCE((v_item->>'issue_tags')::jsonb, '[]'::jsonb));

    IF (v_item->>'phone_id') IS NOT NULL THEN
      UPDATE public.phones SET purchase_order_id = p_order_id, purchase_price = (v_item->>'purchase_price')::NUMERIC, updated_at = now()
      WHERE id = (v_item->>'phone_id')::UUID AND tenant_id = v_tenant_id;
    END IF;
  END LOOP;

  -- Platform Fee Ledger Entry
  IF COALESCE(p_platform_fee, 0) > 0 THEN
    INSERT INTO public.ledger (tenant_id, user_id, type, purchase_order_id, amount, payment_mode, note)
    VALUES (v_tenant_id, v_user_id, 'PLATFORM_FEE', p_order_id, -p_platform_fee, COALESCE(NULLIF(p_payment_mode,''), 'CASH'), 'Platform Fee Deduction');
  END IF;

  -- Initial Payment Ledger Entry
  IF p_initial_payment > 0 THEN
    INSERT INTO public.supplier_payments (tenant_id, counterparty_id, total_paid, mode, note, recorded_by, type)
    VALUES (v_tenant_id, p_counterparty_id, p_initial_payment, COALESCE(NULLIF(p_payment_mode,''), 'CASH'), p_payment_note, v_user_id, 'ADVANCE')
    RETURNING id INTO v_payment_id;

    INSERT INTO public.supplier_allocations (supplier_payment_id, purchase_order_id, amount_allocated, note)
    VALUES (v_payment_id, p_order_id, p_initial_payment, 'Advance Payment');

    INSERT INTO public.ledger (tenant_id, user_id, type, purchase_order_id, supplier_payment_id, amount, payment_mode, note)
    VALUES (v_tenant_id, v_user_id, 'SUPPLIER_PAYMENT', p_order_id, v_payment_id, -p_initial_payment, NULLIF(p_payment_mode,''), COALESCE(p_payment_note, 'Advance Payment'));
  END IF;

  RETURN jsonb_build_object('order_id', p_order_id, 'total', v_total, 'status', v_status);
END;
$$;


ALTER FUNCTION "public"."create_purchase_order"("p_order_id" "uuid", "p_counterparty_id" "uuid", "p_channel" "text", "p_platform_fee" numeric, "p_payment_mode" "text", "p_initial_payment" numeric, "p_due_date" "date", "p_notes" "text", "p_items" "jsonb", "p_payment_note" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_trade_order"("p_order_id" "uuid", "p_counterparty_id" "uuid", "p_order_type" "text", "p_items" "jsonb", "p_initial_payment" numeric, "p_payment_mode" "text", "p_due_date" "date" DEFAULT NULL::"date", "p_notes" "text" DEFAULT NULL::"text", "p_payment_note" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
    v_effective := (v_item->>'sale_price')::NUMERIC - COALESCE((v_item->>'discount_amount')::NUMERIC, 0);
    v_total := v_total + v_effective;
  END LOOP;

  v_status := CASE
    WHEN p_initial_payment <= 0 THEN 'OPEN'
    WHEN p_initial_payment >= v_total THEN 'SETTLED'
    ELSE 'PARTIAL'
  END;

  INSERT INTO public.sale_orders (id, tenant_id, counterparty_id, order_type, total_amount, amount_paid, status, payment_mode, due_date, notes)
  VALUES (p_order_id, v_tenant_id, p_counterparty_id, p_order_type, v_total, GREATEST(p_initial_payment, 0), v_status, NULLIF(p_payment_mode,''), p_due_date, p_notes);

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_effective := (v_item->>'sale_price')::NUMERIC - COALESCE((v_item->>'discount_amount')::NUMERIC, 0);

    INSERT INTO public.sale_order_items (sale_order_id, phone_id, sale_price, discount_amount, imei_snapshot, brand_snapshot, model_snapshot, storage_snapshot, color_snapshot)
    VALUES (p_order_id, (v_item->>'phone_id')::UUID, (v_item->>'sale_price')::NUMERIC, COALESCE((v_item->>'discount_amount')::NUMERIC, 0),
      ARRAY(SELECT jsonb_array_elements_text(v_item->'imei_snapshot')),
      v_item->>'brand', v_item->>'model', v_item->>'storage', v_item->>'color');

    UPDATE public.phones SET status = 'SOLD', sale_price = v_effective, sale_order_id = p_order_id, updated_at = now()
    WHERE id = (v_item->>'phone_id')::UUID AND tenant_id = v_tenant_id;
  END LOOP;

  IF p_initial_payment > 0 THEN
    INSERT INTO public.customer_payments (id, tenant_id, counterparty_id, total_received, mode, note, recorded_by, type)
    VALUES (gen_random_uuid(), v_tenant_id, p_counterparty_id, p_initial_payment, COALESCE(NULLIF(p_payment_mode,''), 'CASH'), p_payment_note, v_user_id, 'ADVANCE')
    RETURNING id INTO v_new_payment_id;
    
    INSERT INTO public.payment_allocations (customer_payment_id, sale_order_id, amount_allocated, note)
    VALUES (v_new_payment_id, p_order_id, p_initial_payment, 'Advance Payment');

    INSERT INTO public.ledger (tenant_id, user_id, type, sale_order_id, customer_payment_id, amount, payment_mode, note)
    VALUES (v_tenant_id, v_user_id, 'CUSTOMER_PAYMENT', p_order_id, v_new_payment_id, p_initial_payment, NULLIF(p_payment_mode,''), COALESCE(p_payment_note, 'Advance Payment'));
  END IF;

  RETURN jsonb_build_object('order_id', p_order_id, 'total', v_total, 'status', v_status);
END;
$$;


ALTER FUNCTION "public"."create_trade_order"("p_order_id" "uuid", "p_counterparty_id" "uuid", "p_order_type" "text", "p_items" "jsonb", "p_initial_payment" numeric, "p_payment_mode" "text", "p_due_date" "date", "p_notes" "text", "p_payment_note" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_trade_order"("p_order_id" "uuid", "p_counterparty_id" "uuid", "p_order_type" "text", "p_payment_mode" "text", "p_initial_payment" numeric, "p_due_date" "date", "p_notes" "text", "p_items" "jsonb", "p_payment_note" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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
$$;


ALTER FUNCTION "public"."create_trade_order"("p_order_id" "uuid", "p_counterparty_id" "uuid", "p_order_type" "text", "p_payment_mode" "text", "p_initial_payment" numeric, "p_due_date" "date", "p_notes" "text", "p_items" "jsonb", "p_payment_note" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_log_sale_lifecycle"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE v_unit_id UUID;
BEGIN
    IF NEW.status = 'SOLD' AND OLD.status != 'SOLD' THEN
        SELECT id INTO v_unit_id FROM public.unit_registry WHERE imei1 = ANY(NEW.imeis) OR imei2 = ANY(NEW.imeis) LIMIT 1;
        IF v_unit_id IS NOT NULL THEN
            INSERT INTO public.unit_lifecycle (unit_id, event_type, tenant_id, label) VALUES (v_unit_id, 'SOLD', NEW.tenant_id, 'Authorized Partner');
        END IF;
    END IF;
    RETURN NEW;
END; $$;


ALTER FUNCTION "public"."fn_log_sale_lifecycle"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_sync_unit_registry"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE v_unit_id UUID;
BEGIN
    SELECT id INTO v_unit_id FROM public.unit_registry WHERE imei1 = ANY(NEW.imeis) OR imei2 = ANY(NEW.imeis) LIMIT 1;
    IF v_unit_id IS NULL THEN
        INSERT INTO public.unit_registry (brand, model, storage, color, ram, imei1, imei2)
        VALUES (NEW.brand, NEW.model, NEW.storage, NEW.color, NEW.ram, NEW.imeis[1], 
               CASE WHEN array_length(NEW.imeis, 1) > 1 THEN NEW.imeis[2] ELSE NULL END)
        RETURNING id INTO v_unit_id;
    ELSE
        UPDATE public.unit_registry SET brand = NEW.brand, model = NEW.model, storage = NEW.storage, color = NEW.color, ram = NEW.ram, updated_at = now() WHERE id = v_unit_id;
    END IF;
    INSERT INTO public.unit_lifecycle (unit_id, event_type, tenant_id, label) VALUES (v_unit_id, 'PURCHASED', NEW.tenant_id, 'Authorized Partner');
    RETURN NEW;
END; $$;


ALTER FUNCTION "public"."fn_sync_unit_registry"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_shared_order"("share_token" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    share_record RECORD;
    order_data JSONB;
    tenant_data JSONB;
    counterparty_data JSONB;
BEGIN
    -- 1. Get the sharing record
    SELECT * INTO share_record 
    FROM public_shares 
    WHERE token = share_token;

    -- Return NULL only if the token itself is missing or explicitly expired
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    IF share_record.expires_at < now() THEN
        RETURN NULL;
    END IF;

    -- 2. Fetch Order Data based on Type
    IF share_record.order_type = 'SALE' THEN
        SELECT jsonb_build_object(
            'id', o.id,
            'status', o.status,
            'totalAmount', o.total_amount,
            'amountPaid', o.amount_paid,
            'createdAt', o.created_at,
            'orderType', o.order_type,
            'type', 'SALE',
            'items', (
                SELECT jsonb_agg(jsonb_build_object(
                    'id', i.id,
                    'brandSnapshot', i.brand_snapshot,
                    'modelSnapshot', i.model_snapshot,
                    'storageSnapshot', i.storage_snapshot,
                    'colorSnapshot', i.color_snapshot,
                    'effectivePrice', (COALESCE(i.sale_price, 0) - COALESCE(i.discount_amount, 0))
                )) FROM sale_order_items i WHERE i.sale_order_id = o.id
            )
        ) INTO order_data
        FROM sale_orders o WHERE o.id = share_record.order_id;
    ELSE
        SELECT jsonb_build_object(
            'id', o.id,
            'status', o.status,
            'totalAmount', o.total_amount,
            'amountPaid', o.amount_paid,
            'createdAt', o.created_at,
            'type', 'PURCHASE',
            'items', (
                SELECT jsonb_agg(jsonb_build_object(
                    'id', i.id,
                    'brand', i.brand,
                    'model', i.model,
                    'storage', i.storage,
                    'color', i.color,
                    'ram', i.ram,
                    'imei', i.imei,
                    'purchasePrice', COALESCE(i.purchase_price, 0),
                    'status', i.status
                )) FROM purchase_order_items i WHERE i.purchase_order_id = o.id
            )
        ) INTO order_data
        FROM purchase_orders o WHERE o.id = share_record.order_id;
    END IF;

    -- 3. Tenant info
    SELECT jsonb_build_object(
        'name', name,
        'address', address,
        'phone', phone,
        'gstin', gstin
    ) INTO tenant_data 
    FROM tenants WHERE id = share_record.tenant_id;

    -- 4. Counterparty (Removing invalid address column)
    SELECT jsonb_build_object(
        'name', COALESCE(cp.name, 'Valued Partner'),
        'address', null, -- Address does not exist in counterparties table
        'phone', cp.phone
    ) INTO counterparty_data
    FROM (
        -- For SALE orders
        SELECT c.name, c.phone 
        FROM counterparties c 
        JOIN sale_orders o ON o.counterparty_id = c.id
        WHERE o.id = share_record.order_id AND share_record.order_type = 'SALE'
        
        UNION ALL
        
        -- For PURCHASE orders
        SELECT c.name, c.phone 
        FROM counterparties c 
        JOIN purchase_orders o ON o.counterparty_id = c.id
        WHERE o.id = share_record.order_id AND share_record.order_type = 'PURCHASE'
    ) cp
    LIMIT 1;

    -- Fallback for counterparty if the union returned nothing
    IF counterparty_data IS NULL THEN
        counterparty_data := jsonb_build_object('name', 'Valued Partner', 'address', null, 'phone', null);
    END IF;

    -- If the order itself was missing
    IF order_data IS NULL THEN
        RETURN jsonb_build_object(
            'error', 'ORDER_NOT_FOUND',
            'expires_at', share_record.expires_at
        );
    END IF;

    RETURN jsonb_build_object(
        'order', order_data,
        'tenant', tenant_data,
        'counterparty', counterparty_data,
        'expires_at', share_record.expires_at
    );
END;
$$;


ALTER FUNCTION "public"."get_shared_order"("share_token" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_tenant_member_count"() RETURNS integer
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT COUNT(*)::INT FROM public.profiles
  WHERE tenant_id = get_user_tenant_id() AND is_active = true;
$$;


ALTER FUNCTION "public"."get_tenant_member_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_tenant_plan"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT plan FROM public.tenants WHERE id = get_user_tenant_id();
$$;


ALTER FUNCTION "public"."get_tenant_plan"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_top_issues"("limit_count" integer) RETURNS TABLE("issue" "text")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    tag as issue
  FROM phones, unnest(issue_tags) as tag
  GROUP BY tag
  ORDER BY count(*) DESC
  LIMIT limit_count;
END;
$$;


ALTER FUNCTION "public"."get_top_issues"("limit_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_role"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT (SELECT role FROM public.profiles WHERE id = auth.uid());
$$;


ALTER FUNCTION "public"."get_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_tenant_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT (SELECT tenant_id FROM public.profiles WHERE id = auth.uid());
$$;


ALTER FUNCTION "public"."get_user_tenant_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_expired_trials"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.tenants
    SET plan = 'expired',
        updated_at = now()
    WHERE plan = 'trial' 
    AND plan_expires_at < now();
END;
$$;


ALTER FUNCTION "public"."handle_expired_trials"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_tenant_id UUID;
  v_slug TEXT;
  v_org_name TEXT;
BEGIN
  -- 1. Check if user was invited (tenant_id implicitly passed via metadata on signup)
  v_tenant_id := (NEW.raw_user_meta_data->>'tenant_id')::UUID;

  -- 2. If no invite exists, create a brand NEW tenant for them to Administer
  IF v_tenant_id IS NULL THEN
    v_org_name := COALESCE(NEW.raw_user_meta_data->>'org_name', split_part(NEW.email, '@', 1) || '''s Shop');
    v_slug := lower(regexp_replace(v_org_name, '[^a-zA-Z0-9]+', '-', 'g'));
    
    -- Ensure the generated slug is totally unique by suffixing random numbers if needed
    WHILE EXISTS (SELECT 1 FROM public.tenants WHERE slug = v_slug) LOOP
        v_slug := v_slug || '-' || floor(random() * 1000)::text;
    END LOOP;

    INSERT INTO public.tenants (name, slug)
    VALUES (v_org_name, v_slug)
    RETURNING id INTO v_tenant_id;
  END IF;

  -- 3. Create the profile attached to their respective tenant
  INSERT INTO public.profiles (id, tenant_id, email, full_name, role)
  VALUES (
    NEW.id,
    v_tenant_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    CASE WHEN NEW.raw_user_meta_data->>'tenant_id' IS NULL
         THEN 'admin'    -- new tenant creator = admin
         ELSE 'associate' -- invited user = associate
    END
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT role IN ('admin', 'super-admin') FROM public.profiles WHERE id = auth.uid();
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_super_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT (SELECT role = 'super-admin' FROM public.profiles WHERE id = auth.uid());
$$;


ALTER FUNCTION "public"."is_super_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."link_phone_to_po"("p_purchase_order_id" "uuid", "p_phone_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM public.profiles WHERE id = auth.uid();
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'No tenant'; END IF;

  IF NOT EXISTS (SELECT 1 FROM public.phones WHERE id = p_phone_id AND tenant_id = v_tenant_id) THEN
    RAISE EXCEPTION 'Phone not found or access denied';
  END IF;

  UPDATE public.phones 
  SET purchase_order_id = p_purchase_order_id, updated_at = now()
  WHERE id = p_phone_id AND tenant_id = v_tenant_id;

  IF NOT EXISTS (SELECT 1 FROM public.purchase_order_items WHERE purchase_order_id = p_purchase_order_id AND phone_id = p_phone_id) THEN
    INSERT INTO public.purchase_order_items (
      purchase_order_id, phone_id, purchase_price, status, 
      brand, model, storage, ram, color, imei
    )
    SELECT 
      p_purchase_order_id, p_phone_id, purchase_price, 'ACCEPTED',
      brand, model, storage, ram, color, (CASE WHEN array_length(imeis, 1) > 0 THEN imeis[1] ELSE NULL END)
    FROM public.phones WHERE id = p_phone_id;
  END IF;
END;
$$;


ALTER FUNCTION "public"."link_phone_to_po"("p_purchase_order_id" "uuid", "p_phone_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."link_phone_to_to"("p_phone_id" "uuid", "p_sale_order_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM public.profiles WHERE id = auth.uid();
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'No tenant'; END IF;

  -- Ensure phone belongs to tenant
  IF NOT EXISTS (SELECT 1 FROM public.phones WHERE id = p_phone_id AND tenant_id = v_tenant_id) THEN
    RAISE EXCEPTION 'Phone not found or access denied';
  END IF;

  -- Link phone in phones table
  UPDATE public.phones 
  SET sale_order_id = p_sale_order_id, status = 'SOLD', updated_at = now()
  WHERE id = p_phone_id AND tenant_id = v_tenant_id;

  -- Mirror in sale_order_items (if not already exists)
  IF NOT EXISTS (SELECT 1 FROM public.sale_order_items WHERE sale_order_id = p_sale_order_id AND phone_id = p_phone_id) THEN
    INSERT INTO public.sale_order_items (sale_order_id, phone_id, sale_price, brand_snapshot, model_snapshot, storage_snapshot, color_snapshot)
    SELECT p_sale_order_id, p_phone_id, sale_price, brand, model, storage, color
    FROM public.phones WHERE id = p_phone_id;
  END IF;
END;
$$;


ALTER FUNCTION "public"."link_phone_to_to"("p_phone_id" "uuid", "p_sale_order_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_po_item_accepted"("p_purchase_order_id" "uuid", "p_phone_id" "uuid", "p_final_price" numeric) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM public.profiles WHERE id = auth.uid();
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'No tenant'; END IF;

  -- Update PO item
  UPDATE public.purchase_order_items
  SET status = 'ACCEPTED', purchase_price = p_final_price
  WHERE purchase_order_id = p_purchase_order_id AND phone_id = p_phone_id;

  -- Update Phone to IN_STOCK
  UPDATE public.phones
  SET status = 'IN_STOCK', purchase_price = p_final_price, updated_at = now()
  WHERE id = p_phone_id AND tenant_id = v_tenant_id;
  
  -- Re-calculate PO totals
  UPDATE public.purchase_orders
  SET total_amount = (SELECT SUM(purchase_price) FROM public.purchase_order_items WHERE purchase_order_id = p_purchase_order_id AND status = 'ACCEPTED') + COALESCE(platform_fee, 0),
      phones_received = (SELECT COUNT(*) FROM public.purchase_order_items WHERE purchase_order_id = p_purchase_order_id AND status = 'ACCEPTED')
  WHERE id = p_purchase_order_id;
END;
$$;


ALTER FUNCTION "public"."mark_po_item_accepted"("p_purchase_order_id" "uuid", "p_phone_id" "uuid", "p_final_price" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_po_item_accepted"("p_item_id" "uuid", "p_purchase_order_id" "uuid", "p_phone_id" "uuid", "p_final_price" numeric) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM public.profiles WHERE id = auth.uid();
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'No tenant'; END IF;

  UPDATE public.purchase_order_items
  SET status = 'ACCEPTED', purchase_price = p_final_price, phone_id = p_phone_id
  WHERE id = p_item_id AND purchase_order_id = p_purchase_order_id;

  UPDATE public.phones
  SET status = 'IN_STOCK', 
      purchase_price = p_final_price, 
      purchase_order_id = p_purchase_order_id,
      updated_at = now()
  WHERE id = p_phone_id AND tenant_id = v_tenant_id;
  
  UPDATE public.purchase_orders
  SET total_amount = (SELECT SUM(purchase_price) FROM public.purchase_order_items WHERE purchase_order_id = p_purchase_order_id AND status = 'ACCEPTED') + COALESCE(platform_fee, 0),
      phones_received = (SELECT COUNT(*) FROM public.purchase_order_items WHERE purchase_order_id = p_purchase_order_id AND status = 'ACCEPTED')
  WHERE id = p_purchase_order_id;
END;
$$;


ALTER FUNCTION "public"."mark_po_item_accepted"("p_item_id" "uuid", "p_purchase_order_id" "uuid", "p_phone_id" "uuid", "p_final_price" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_po_item_rejected"("p_item_id" "uuid", "p_purchase_order_id" "uuid", "p_reason" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_tenant_id UUID;
  v_phone_id UUID;
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM public.profiles WHERE id = auth.uid();
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'No tenant'; END IF;

  SELECT phone_id INTO v_phone_id FROM public.purchase_order_items WHERE id = p_item_id;

  UPDATE public.purchase_order_items
  SET status = 'REJECTED', rejection_reason = p_reason
  WHERE id = p_item_id AND purchase_order_id = p_purchase_order_id;

  IF v_phone_id IS NOT NULL THEN
    UPDATE public.phones
    SET purchase_order_id = NULL, updated_at = now()
    WHERE id = v_phone_id AND tenant_id = v_tenant_id;
  END IF;
  
  UPDATE public.purchase_orders
  SET total_amount = (SELECT SUM(purchase_price) FROM public.purchase_order_items WHERE purchase_order_id = p_purchase_order_id AND status = 'ACCEPTED') + COALESCE(platform_fee, 0),
      phones_received = (SELECT COUNT(*) FROM public.purchase_order_items WHERE purchase_order_id = p_purchase_order_id AND status = 'ACCEPTED')
  WHERE id = p_purchase_order_id;
END;
$$;


ALTER FUNCTION "public"."mark_po_item_rejected"("p_item_id" "uuid", "p_purchase_order_id" "uuid", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_admin_on_phone_sale"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    admin_user_id UUID;
    seller_name TEXT;
BEGIN
    -- Only trigger when status changes to 'Sold'
    IF NEW.status = 'SOLD' AND OLD.status != 'SOLD' THEN
        
        -- Get the name of the associate who sold it
        SELECT full_name INTO seller_name FROM public.profiles WHERE id = auth.uid();

        -- Find the admin of this tenant
        SELECT id INTO admin_user_id FROM public.profiles 
        WHERE tenant_id = NEW.tenant_id AND role = 'admin' LIMIT 1;
        
        -- If an admin exists (and isn't the one who sold it), alert them!
        IF admin_user_id IS NOT NULL THEN
            INSERT INTO public.notifications (tenant_id, user_id, type, title, message, reference_id)
            VALUES (
                NEW.tenant_id, 
                admin_user_id, 
                'PHONE_SOLD', 
                'Item Sold by Team', 
                COALESCE(seller_name, 'An associate') || ' just sold a ' || NEW.brand || ' ' || NEW.model || ' for ₹' || NEW.sale_price,
                NEW.id
            );
        END IF;

    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_admin_on_phone_sale"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_customer_payment"("p_counterparty_id" "uuid", "p_total_received" numeric, "p_mode" "text", "p_allocations" "jsonb", "p_note" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
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

  INSERT INTO public.customer_payments (tenant_id, counterparty_id, total_received, mode, note, recorded_by)
  VALUES (v_tenant_id, p_counterparty_id, p_total_received, p_mode, p_note, v_user_id)
  RETURNING id INTO v_payment_id;

  -- SINGLE ENTRY LOGGING IN LEDGER FOR ENTIRE PAYMENT
  INSERT INTO public.ledger (tenant_id, user_id, type, amount, payment_mode, note, customer_payment_id)
  VALUES (v_tenant_id, v_user_id, 'CUSTOMER_PAYMENT', p_total_received, p_mode, COALESCE(p_note, 'Customer Payment Received'), v_payment_id);

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


ALTER FUNCTION "public"."record_customer_payment"("p_counterparty_id" "uuid", "p_total_received" numeric, "p_mode" "text", "p_allocations" "jsonb", "p_note" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_customer_payment"("p_counterparty_id" "uuid", "p_total_received" numeric, "p_mode" "text", "p_allocations" "jsonb", "p_note" "text" DEFAULT NULL::"text", "p_type" "text" DEFAULT 'CUSTOMER_PAYMENT'::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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

  INSERT INTO public.customer_payments (tenant_id, counterparty_id, total_received, mode, note, recorded_by, type)
  VALUES (v_tenant_id, p_counterparty_id, p_total_received, p_mode, p_note, v_user_id,
    CASE WHEN p_type = 'DEBT_SETTLEMENT' THEN 'SETTLEMENT' ELSE 'ADVANCE' END)
  RETURNING id INTO v_payment_id;

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


ALTER FUNCTION "public"."record_customer_payment"("p_counterparty_id" "uuid", "p_total_received" numeric, "p_mode" "text", "p_allocations" "jsonb", "p_note" "text", "p_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_customer_settlement_fifo"("p_counterparty_id" "uuid", "p_amount" numeric, "p_mode" "text", "p_note" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
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

  INSERT INTO public.customer_payments (tenant_id, counterparty_id, total_received, mode, note, recorded_by)
  VALUES (v_tenant_id, p_counterparty_id, p_amount, p_mode, COALESCE(p_note, 'FIFO Settlement'), v_user_id)
  RETURNING id INTO v_payment_id;

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


ALTER FUNCTION "public"."record_customer_settlement_fifo"("p_counterparty_id" "uuid", "p_amount" numeric, "p_mode" "text", "p_note" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_supplier_payment"("p_counterparty_id" "uuid", "p_total_paid" numeric, "p_mode" "text", "p_allocations" "jsonb", "p_note" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
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

  INSERT INTO public.supplier_payments (tenant_id, counterparty_id, total_paid, mode, note, recorded_by)
  VALUES (v_tenant_id, p_counterparty_id, p_total_paid, p_mode, p_note, v_user_id)
  RETURNING id INTO v_payment_id;

  -- SINGLE ENTRY LOGGING IN LEDGER FOR ENTIRE PAYMENT
  INSERT INTO public.ledger (tenant_id, user_id, type, amount, payment_mode, note, supplier_payment_id)
  VALUES (v_tenant_id, v_user_id, 'SUPPLIER_PAYMENT', -p_total_paid, p_mode, COALESCE(p_note, 'Supplier Payment Given'), v_payment_id);

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


ALTER FUNCTION "public"."record_supplier_payment"("p_counterparty_id" "uuid", "p_total_paid" numeric, "p_mode" "text", "p_allocations" "jsonb", "p_note" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_supplier_payment"("p_counterparty_id" "uuid", "p_total_paid" numeric, "p_mode" "text", "p_allocations" "jsonb", "p_note" "text" DEFAULT NULL::"text", "p_type" "text" DEFAULT 'SUPPLIER_PAYMENT'::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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

  INSERT INTO public.supplier_payments (tenant_id, counterparty_id, total_paid, mode, note, recorded_by, type)
  VALUES (v_tenant_id, p_counterparty_id, p_total_paid, p_mode, p_note, v_user_id,
    CASE WHEN p_type = 'SUPPLIER_SETTLEMENT' THEN 'SETTLEMENT' ELSE 'ADVANCE' END)
  RETURNING id INTO v_payment_id;

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


ALTER FUNCTION "public"."record_supplier_payment"("p_counterparty_id" "uuid", "p_total_paid" numeric, "p_mode" "text", "p_allocations" "jsonb", "p_note" "text", "p_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_supplier_settlement_fifo"("p_counterparty_id" "uuid", "p_amount" numeric, "p_mode" "text", "p_note" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
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

  INSERT INTO public.supplier_payments (tenant_id, counterparty_id, total_paid, mode, note, recorded_by)
  VALUES (v_tenant_id, p_counterparty_id, p_amount, p_mode, COALESCE(p_note, 'FIFO Settlement'), v_user_id)
  RETURNING id INTO v_payment_id;

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


ALTER FUNCTION "public"."record_supplier_settlement_fifo"("p_counterparty_id" "uuid", "p_amount" numeric, "p_mode" "text", "p_note" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."return_order"("p_order_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM public.profiles WHERE id = auth.uid();
  
  -- Update order status
  UPDATE public.sale_orders
  SET status = 'RETURNED', updated_at = now()
  WHERE id = p_order_id AND tenant_id = v_tenant_id;

  -- Return all phones to IN_STOCK
  UPDATE public.phones
  SET status = 'IN_STOCK', sale_order_id = NULL, sale_price = NULL, updated_at = now()
  WHERE sale_order_id = p_order_id AND tenant_id = v_tenant_id;
END;
$$;


ALTER FUNCTION "public"."return_order"("p_order_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_creator_context"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- If inserted via Auth Session, force the authenticated context
  IF auth.uid() IS NOT NULL THEN
    NEW.user_id := auth.uid();
    
    SELECT tenant_id INTO NEW.tenant_id
    FROM public.profiles
    WHERE id = auth.uid();
  END IF;

  -- Validation: Ensure we have a tenant_id at the end
  IF NEW.tenant_id IS NULL THEN
    RAISE EXCEPTION 'Missing tenant_id for insertion into %', TG_TABLE_NAME;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_creator_context"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_phone_imei_tenant"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  SELECT tenant_id INTO NEW.tenant_id
  FROM public.profiles
  WHERE id = auth.uid();

  IF NEW.tenant_id IS NULL THEN
    RAISE EXCEPTION 'Could not determine tenant_id for current user';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_phone_imei_tenant"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_row_defaults"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  -- 1. Auto-fill user_id from auth.uid() if empty
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;

  -- 2. Auto-fill tenant_id from the user's profile if empty
  IF NEW.tenant_id IS NULL THEN
    SELECT tenant_id INTO NEW.tenant_id
    FROM public.profiles
    WHERE id = auth.uid();
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_row_defaults"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_tenant_context"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- If tenant_id is not provided and we have a session, fill it
  IF NEW.tenant_id IS NULL AND auth.uid() IS NOT NULL THEN
    SELECT tenant_id INTO NEW.tenant_id
    FROM public.profiles
    WHERE id = auth.uid();
  END IF;

  -- Validation
  IF NEW.tenant_id IS NULL THEN
    RAISE EXCEPTION 'Missing tenant_id for insertion into %', TG_TABLE_NAME;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_tenant_context"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_order_payment"("p_order_id" "uuid", "p_amount_paid" numeric, "p_status" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  UPDATE public.sale_orders
  SET amount_paid = p_amount_paid, status = p_status, updated_at = now()
  WHERE id = p_order_id;
END;
$$;


ALTER FUNCTION "public"."update_order_payment"("p_order_id" "uuid", "p_amount_paid" numeric, "p_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."catalog_model_colors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "model_id" "uuid" NOT NULL,
    "label" "text" NOT NULL,
    "hex" "text" NOT NULL
);


ALTER TABLE "public"."catalog_model_colors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."catalog_models" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "brand" "text" NOT NULL,
    "model" "text" NOT NULL,
    "storage" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "ram" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."catalog_models" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."catalog_models_v2" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "brand" "text" NOT NULL,
    "model" "text" NOT NULL,
    "storage" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "ram" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "colors" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "gsmarena_url" "text",
    "verified" boolean DEFAULT false NOT NULL,
    "last_scraped" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."catalog_models_v2" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."counterparties" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "phone" "text",
    "email" "text",
    "platform_name" "text",
    "linked_tenant_id" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "counterparties_type_check" CHECK (("type" = ANY (ARRAY['CUSTOMER'::"text", 'RETAILER'::"text", 'WHOLESALER'::"text", 'PLATFORM'::"text"])))
);


ALTER TABLE "public"."counterparties" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "counterparty_id" "uuid" NOT NULL,
    "total_received" numeric(12,2) NOT NULL,
    "mode" "text" NOT NULL,
    "received_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "note" "text",
    "recorded_by" "uuid" NOT NULL,
    CONSTRAINT "customer_payments_mode_check" CHECK (("mode" = ANY (ARRAY['CASH'::"text", 'UPI'::"text", 'BANK_TRANSFER'::"text"]))),
    CONSTRAINT "customer_payments_total_received_check" CHECK (("total_received" > (0)::numeric))
);


ALTER TABLE "public"."customer_payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ledger" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "reference_id" "uuid",
    "amount" numeric(12,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "note" "text",
    "phone_id" "uuid",
    "sale_order_id" "uuid",
    "purchase_order_id" "uuid",
    "payment_mode" "text",
    "customer_payment_id" "uuid",
    "supplier_payment_id" "uuid",
    "settlement_count" integer,
    CONSTRAINT "enforce_repair_phone_link" CHECK ((("type" <> 'REPAIR_COST'::"text") OR ("reference_id" IS NOT NULL))),
    CONSTRAINT "ledger_payment_mode_check" CHECK (("payment_mode" = ANY (ARRAY['CASH'::"text", 'UPI'::"text", 'BANK_TRANSFER'::"text", 'CREDIT'::"text"])))
);


ALTER TABLE "public"."ledger" OWNER TO "postgres";


COMMENT ON COLUMN "public"."ledger"."settlement_count" IS 'Count of orders/bills settled in this transaction (for bulk payments)';



CREATE TABLE IF NOT EXISTS "public"."master_data" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "value" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "master_data_category_check" CHECK (("category" = ANY (ARRAY['brand'::"text", 'model'::"text", 'ram'::"text", 'storage'::"text", 'color'::"text", 'issue_tag'::"text"])))
);


ALTER TABLE "public"."master_data" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "reference_id" "uuid",
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "notifications_type_check" CHECK (("type" = ANY (ARRAY['PHONE_SOLD'::"text", 'ROLE_PROMOTED'::"text", 'LEDGER_ENTRY'::"text", 'SYSTEM_ALERT'::"text", 'PAYMENT_DUE'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_allocations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_payment_id" "uuid" NOT NULL,
    "sale_order_id" "uuid" NOT NULL,
    "amount_allocated" numeric(12,2) NOT NULL,
    "allocated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "note" "text",
    CONSTRAINT "payment_allocations_amount_allocated_check" CHECK (("amount_allocated" > (0)::numeric))
);


ALTER TABLE "public"."payment_allocations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."phones" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "brand" "text" NOT NULL,
    "model" "text" NOT NULL,
    "ram" "text" DEFAULT 'N/A'::"text" NOT NULL,
    "storage" "text" NOT NULL,
    "color" "text" NOT NULL,
    "purchase_price" numeric(12,2) NOT NULL,
    "sale_price" numeric(12,2),
    "status" "text" DEFAULT 'PENDING'::"text" NOT NULL,
    "issue_tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "imeis" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "sale_order_id" "uuid",
    "purchase_order_id" "uuid",
    CONSTRAINT "phones_purchase_price_check" CHECK (("purchase_price" > (0)::numeric)),
    CONSTRAINT "phones_status_check" CHECK (("status" = ANY (ARRAY['PENDING'::"text", 'IN_STOCK'::"text", 'SOLD'::"text"])))
);


ALTER TABLE "public"."phones" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "email" "text",
    "full_name" "text" DEFAULT ''::"text" NOT NULL,
    "avatar_url" "text",
    "role" "text" DEFAULT 'associate'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['super-admin'::"text", 'admin'::"text", 'manager'::"text", 'associate'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."public_shares" (
    "token" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "order_type" "text" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '30 days'::interval) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "public_shares_order_type_check" CHECK (("order_type" = ANY (ARRAY['SALE'::"text", 'PURCHASE'::"text"])))
);


ALTER TABLE "public"."public_shares" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "purchase_order_id" "uuid" NOT NULL,
    "phone_id" "uuid",
    "purchase_price" numeric(12,2) NOT NULL,
    "status" "text" DEFAULT 'PENDING_INSPECTION'::"text" NOT NULL,
    "rejection_reason" "text",
    "brand" "text",
    "model" "text",
    "storage" "text",
    "color" "text",
    "ram" "text",
    "imei" "text",
    "issue_tags" "text"[] DEFAULT '{}'::"text"[],
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "purchase_order_items_purchase_price_check" CHECK (("purchase_price" > (0)::numeric)),
    CONSTRAINT "purchase_order_items_status_check" CHECK (("status" = ANY (ARRAY['PENDING_INSPECTION'::"text", 'ACCEPTED'::"text", 'REJECTED'::"text"])))
);


ALTER TABLE "public"."purchase_order_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."purchase_order_items" IS 'Stores the manifest/pending items for a Purchase Order. Columns align with the phones table for seamless lifecycle management.';



COMMENT ON COLUMN "public"."purchase_order_items"."issue_tags" IS 'Stores condition tags/issues identified during PO inspection, providing an audit trail for both accepted and rejected units.';



CREATE TABLE IF NOT EXISTS "public"."purchase_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "counterparty_id" "uuid" NOT NULL,
    "acquisition_channel" "text" NOT NULL,
    "platform_fee" numeric(12,2) DEFAULT 0 NOT NULL,
    "phones_ordered" integer DEFAULT 0 NOT NULL,
    "phones_received" integer DEFAULT 0 NOT NULL,
    "total_amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "amount_paid" numeric(12,2) DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'AWAITING_RECEIPT'::"text" NOT NULL,
    "payment_mode" "text",
    "due_date" "date",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "purchase_orders_acquisition_channel_check" CHECK (("acquisition_channel" = ANY (ARRAY['DIRECT'::"text", 'PLATFORM'::"text", 'INTER_TENANT'::"text"]))),
    CONSTRAINT "purchase_orders_payment_mode_check" CHECK (("payment_mode" = ANY (ARRAY['CASH'::"text", 'UPI'::"text", 'BANK_TRANSFER'::"text", 'CREDIT'::"text"]))),
    CONSTRAINT "purchase_orders_status_check" CHECK (("status" = ANY (ARRAY['AWAITING_RECEIPT'::"text", 'RECEIVED'::"text", 'PARTIAL'::"text", 'SETTLED'::"text", 'CANCELLED'::"text"])))
);


ALTER TABLE "public"."purchase_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sale_order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sale_order_id" "uuid" NOT NULL,
    "phone_id" "uuid",
    "sale_price" numeric(12,2) NOT NULL,
    "discount_amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "imei_snapshot" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "brand_snapshot" "text" NOT NULL,
    "model_snapshot" "text" NOT NULL,
    "storage_snapshot" "text" NOT NULL,
    "color_snapshot" "text" NOT NULL,
    CONSTRAINT "sale_order_items_sale_price_check" CHECK (("sale_price" > (0)::numeric))
);


ALTER TABLE "public"."sale_order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sale_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "counterparty_id" "uuid" NOT NULL,
    "order_type" "text" NOT NULL,
    "total_amount" numeric(12,2) NOT NULL,
    "amount_paid" numeric(12,2) DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'OPEN'::"text" NOT NULL,
    "payment_mode" "text",
    "due_date" "date",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "sale_orders_amount_paid_check" CHECK (("amount_paid" >= (0)::numeric)),
    CONSTRAINT "sale_orders_order_type_check" CHECK (("order_type" = ANY (ARRAY['RETAIL'::"text", 'BULK'::"text", 'TRANSFER'::"text"]))),
    CONSTRAINT "sale_orders_payment_mode_check" CHECK (("payment_mode" = ANY (ARRAY['CASH'::"text", 'UPI'::"text", 'BANK_TRANSFER'::"text", 'CREDIT'::"text"]))),
    CONSTRAINT "sale_orders_status_check" CHECK (("status" = ANY (ARRAY['OPEN'::"text", 'PARTIAL'::"text", 'SETTLED'::"text", 'RETURNED'::"text"]))),
    CONSTRAINT "sale_orders_total_amount_check" CHECK (("total_amount" > (0)::numeric))
);


ALTER TABLE "public"."sale_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscription_plans" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "price_monthly" numeric(12,2) DEFAULT 0 NOT NULL,
    "price_yearly" numeric(12,2) DEFAULT 0 NOT NULL,
    "currency" "text" DEFAULT 'INR'::"text" NOT NULL,
    "description" "text",
    "features" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."subscription_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."supplier_allocations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "supplier_payment_id" "uuid" NOT NULL,
    "purchase_order_id" "uuid" NOT NULL,
    "amount_allocated" numeric(12,2) NOT NULL,
    "allocated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "note" "text",
    CONSTRAINT "supplier_allocations_amount_allocated_check" CHECK (("amount_allocated" > (0)::numeric))
);


ALTER TABLE "public"."supplier_allocations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."supplier_payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "counterparty_id" "uuid" NOT NULL,
    "total_paid" numeric(12,2) NOT NULL,
    "mode" "text" NOT NULL,
    "paid_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "note" "text",
    "recorded_by" "uuid" NOT NULL,
    CONSTRAINT "supplier_payments_mode_check" CHECK (("mode" = ANY (ARRAY['CASH'::"text", 'UPI'::"text", 'BANK_TRANSFER'::"text"]))),
    CONSTRAINT "supplier_payments_total_paid_check" CHECK (("total_paid" > (0)::numeric))
);


ALTER TABLE "public"."supplier_payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_announcements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "type" "text" DEFAULT 'info'::"text",
    "target_role" "text" DEFAULT 'all'::"text",
    "is_active" boolean DEFAULT true,
    "starts_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "display_type" "text" DEFAULT 'banner'::"text" NOT NULL,
    CONSTRAINT "system_announcements_display_type_check" CHECK (("display_type" = ANY (ARRAY['banner'::"text", 'notification'::"text"]))),
    CONSTRAINT "system_announcements_target_role_check" CHECK (("target_role" = ANY (ARRAY['all'::"text", 'admin'::"text", 'super-admin'::"text"]))),
    CONSTRAINT "system_announcements_type_check" CHECK (("type" = ANY (ARRAY['info'::"text", 'warning'::"text", 'success'::"text", 'critical'::"text", 'feature'::"text"])))
);


ALTER TABLE "public"."system_announcements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenant_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_name" "text" NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "tenant_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."tenant_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "plan" "text" DEFAULT 'free'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "plan_expires_at" timestamp with time zone,
    "address" "text",
    "gstin" "text",
    "phone" "text",
    "suspended_until" timestamp with time zone,
    CONSTRAINT "tenants_plan_check" CHECK (("plan" = ANY (ARRAY['trial'::"text", 'starter'::"text", 'pro'::"text", 'wholesaler'::"text", 'enterprise'::"text", 'free'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."tenants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."unit_lifecycle" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "unit_id" "uuid",
    "event_type" "public"."lifecycle_event_type" NOT NULL,
    "event_date" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid",
    "label" "text"
);


ALTER TABLE "public"."unit_lifecycle" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."unit_registry" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "brand" "text" NOT NULL,
    "model" "text" NOT NULL,
    "storage" "text",
    "color" "text",
    "ram" "text",
    "imei1" "text",
    "imei2" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."unit_registry" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_push_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "subscription" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_push_subscriptions" OWNER TO "postgres";


ALTER TABLE ONLY "public"."catalog_model_colors"
    ADD CONSTRAINT "catalog_model_colors_model_id_label_key" UNIQUE ("model_id", "label");



ALTER TABLE ONLY "public"."catalog_model_colors"
    ADD CONSTRAINT "catalog_model_colors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."catalog_models"
    ADD CONSTRAINT "catalog_models_brand_model_key" UNIQUE ("brand", "model");



ALTER TABLE ONLY "public"."catalog_models"
    ADD CONSTRAINT "catalog_models_brand_model_unique" UNIQUE ("brand", "model");



ALTER TABLE ONLY "public"."catalog_models"
    ADD CONSTRAINT "catalog_models_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."catalog_models_v2"
    ADD CONSTRAINT "catalog_models_v2_brand_model_key" UNIQUE ("brand", "model");



ALTER TABLE ONLY "public"."catalog_models_v2"
    ADD CONSTRAINT "catalog_models_v2_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."counterparties"
    ADD CONSTRAINT "counterparties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_payments"
    ADD CONSTRAINT "customer_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ledger"
    ADD CONSTRAINT "ledger_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."master_data"
    ADD CONSTRAINT "master_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."master_data"
    ADD CONSTRAINT "master_data_tenant_id_category_value_key" UNIQUE ("tenant_id", "category", "value");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_allocations"
    ADD CONSTRAINT "payment_allocations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."phones"
    ADD CONSTRAINT "phones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."public_shares"
    ADD CONSTRAINT "public_shares_pkey" PRIMARY KEY ("token");



ALTER TABLE ONLY "public"."purchase_order_items"
    ADD CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sale_order_items"
    ADD CONSTRAINT "sale_order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sale_orders"
    ADD CONSTRAINT "sale_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_plans"
    ADD CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."supplier_allocations"
    ADD CONSTRAINT "supplier_allocations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."supplier_payments"
    ADD CONSTRAINT "supplier_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_announcements"
    ADD CONSTRAINT "system_announcements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenant_requests"
    ADD CONSTRAINT "tenant_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."unit_lifecycle"
    ADD CONSTRAINT "unit_lifecycle_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."unit_registry"
    ADD CONSTRAINT "unit_registry_imei1_key" UNIQUE ("imei1");



ALTER TABLE ONLY "public"."unit_registry"
    ADD CONSTRAINT "unit_registry_imei2_key" UNIQUE ("imei2");



ALTER TABLE ONLY "public"."unit_registry"
    ADD CONSTRAINT "unit_registry_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_push_subscriptions"
    ADD CONSTRAINT "user_push_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_push_subscriptions"
    ADD CONSTRAINT "user_push_subscriptions_user_id_key" UNIQUE ("user_id");



CREATE INDEX "idx_catalog_colors_model" ON "public"."catalog_model_colors" USING "btree" ("model_id");



CREATE INDEX "idx_catalog_models_brand" ON "public"."catalog_models" USING "btree" ("brand");



CREATE INDEX "idx_cmv2_brand" ON "public"."catalog_models_v2" USING "btree" ("brand");



CREATE INDEX "idx_cmv2_model" ON "public"."catalog_models_v2" USING "gin" ("to_tsvector"('"english"'::"regconfig", "model"));



CREATE INDEX "idx_counterparties_tenant_id" ON "public"."counterparties" USING "btree" ("tenant_id");



CREATE INDEX "idx_cp_pay_cp" ON "public"."customer_payments" USING "btree" ("counterparty_id");



CREATE INDEX "idx_cp_pay_tenant" ON "public"."customer_payments" USING "btree" ("tenant_id");



CREATE INDEX "idx_cp_tenant" ON "public"."counterparties" USING "btree" ("tenant_id");



CREATE INDEX "idx_cp_tenant_name" ON "public"."counterparties" USING "btree" ("tenant_id", "name");



CREATE INDEX "idx_customer_payments_tenant_id" ON "public"."customer_payments" USING "btree" ("tenant_id");



CREATE INDEX "idx_ledger_reference" ON "public"."ledger" USING "btree" ("reference_id");



CREATE INDEX "idx_ledger_tenant" ON "public"."ledger" USING "btree" ("tenant_id");



CREATE INDEX "idx_ledger_tenant_created" ON "public"."ledger" USING "btree" ("tenant_id", "created_at" DESC);



CREATE INDEX "idx_ledger_tenant_id" ON "public"."ledger" USING "btree" ("tenant_id");



CREATE INDEX "idx_ledger_tenant_type" ON "public"."ledger" USING "btree" ("tenant_id", "type");



CREATE INDEX "idx_ledger_user" ON "public"."ledger" USING "btree" ("user_id");



CREATE INDEX "idx_master_data_lookup" ON "public"."master_data" USING "btree" ("tenant_id", "category");



CREATE INDEX "idx_pa_cp" ON "public"."payment_allocations" USING "btree" ("customer_payment_id");



CREATE INDEX "idx_pa_so" ON "public"."payment_allocations" USING "btree" ("sale_order_id");



CREATE INDEX "idx_phones_tenant" ON "public"."phones" USING "btree" ("tenant_id");



CREATE INDEX "idx_phones_tenant_created" ON "public"."phones" USING "btree" ("tenant_id", "created_at" DESC);



CREATE INDEX "idx_phones_tenant_id" ON "public"."phones" USING "btree" ("tenant_id");



CREATE INDEX "idx_phones_tenant_status" ON "public"."phones" USING "btree" ("tenant_id", "status");



CREATE INDEX "idx_phones_user" ON "public"."phones" USING "btree" ("user_id");



CREATE INDEX "idx_phones_user_id" ON "public"."phones" USING "btree" ("user_id");



CREATE INDEX "idx_po_cp" ON "public"."purchase_orders" USING "btree" ("counterparty_id");



CREATE INDEX "idx_po_status" ON "public"."purchase_orders" USING "btree" ("tenant_id", "status");



CREATE INDEX "idx_po_tenant" ON "public"."purchase_orders" USING "btree" ("tenant_id");



CREATE INDEX "idx_poi_po" ON "public"."purchase_order_items" USING "btree" ("purchase_order_id");



CREATE INDEX "idx_profiles_role" ON "public"."profiles" USING "btree" ("role");



CREATE INDEX "idx_profiles_tenant" ON "public"."profiles" USING "btree" ("tenant_id");



CREATE INDEX "idx_profiles_tenant_id" ON "public"."profiles" USING "btree" ("tenant_id");



CREATE INDEX "idx_purchase_orders_tenant_id" ON "public"."purchase_orders" USING "btree" ("tenant_id");



CREATE INDEX "idx_sa_po" ON "public"."supplier_allocations" USING "btree" ("purchase_order_id");



CREATE INDEX "idx_sa_sp" ON "public"."supplier_allocations" USING "btree" ("supplier_payment_id");



CREATE INDEX "idx_sale_orders_tenant_id" ON "public"."sale_orders" USING "btree" ("tenant_id");



CREATE INDEX "idx_so_cp" ON "public"."sale_orders" USING "btree" ("counterparty_id");



CREATE INDEX "idx_so_created" ON "public"."sale_orders" USING "btree" ("tenant_id", "created_at" DESC);



CREATE INDEX "idx_so_status" ON "public"."sale_orders" USING "btree" ("tenant_id", "status");



CREATE INDEX "idx_so_tenant" ON "public"."sale_orders" USING "btree" ("tenant_id");



CREATE INDEX "idx_soi_order" ON "public"."sale_order_items" USING "btree" ("sale_order_id");



CREATE INDEX "idx_soi_phone" ON "public"."sale_order_items" USING "btree" ("phone_id");



CREATE INDEX "idx_sp_cp" ON "public"."supplier_payments" USING "btree" ("counterparty_id");



CREATE INDEX "idx_sp_tenant" ON "public"."supplier_payments" USING "btree" ("tenant_id");



CREATE INDEX "idx_supplier_payments_tenant_id" ON "public"."supplier_payments" USING "btree" ("tenant_id");



CREATE INDEX "system_announcements_active_idx" ON "public"."system_announcements" USING "btree" ("is_active", "starts_at", "expires_at");



CREATE OR REPLACE TRIGGER "set_cmv2_updated_at" BEFORE UPDATE ON "public"."catalog_models_v2" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_phones_updated_at" BEFORE UPDATE ON "public"."phones" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_tenants_updated_at" BEFORE UPDATE ON "public"."tenants" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at_purchase_orders" BEFORE UPDATE ON "public"."purchase_orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at_sale_orders" BEFORE UPDATE ON "public"."sale_orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "tr_log_sale_lifecycle" AFTER UPDATE OF "status" ON "public"."phones" FOR EACH ROW EXECUTE FUNCTION "public"."fn_log_sale_lifecycle"();



CREATE OR REPLACE TRIGGER "tr_sync_unit_registry" AFTER INSERT ON "public"."phones" FOR EACH ROW EXECUTE FUNCTION "public"."fn_sync_unit_registry"();



CREATE OR REPLACE TRIGGER "trg_set_ledger_defaults" BEFORE INSERT ON "public"."ledger" FOR EACH ROW EXECUTE FUNCTION "public"."set_row_defaults"();



CREATE OR REPLACE TRIGGER "trg_set_master_data_defaults" BEFORE INSERT ON "public"."master_data" FOR EACH ROW EXECUTE FUNCTION "public"."set_row_defaults"();



CREATE OR REPLACE TRIGGER "trg_set_notifications_defaults" BEFORE INSERT ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."set_row_defaults"();



CREATE OR REPLACE TRIGGER "trg_set_phones_defaults" BEFORE INSERT ON "public"."phones" FOR EACH ROW EXECUTE FUNCTION "public"."set_row_defaults"();



CREATE OR REPLACE TRIGGER "trigger_notify_phone_sale" AFTER UPDATE ON "public"."phones" FOR EACH ROW EXECUTE FUNCTION "public"."notify_admin_on_phone_sale"();



CREATE OR REPLACE TRIGGER "trigger_set_context_ledger" BEFORE INSERT ON "public"."ledger" FOR EACH ROW EXECUTE FUNCTION "public"."set_creator_context"();



CREATE OR REPLACE TRIGGER "trigger_set_context_master_data" BEFORE INSERT ON "public"."master_data" FOR EACH ROW EXECUTE FUNCTION "public"."set_creator_context"();



CREATE OR REPLACE TRIGGER "trigger_set_context_notifications" BEFORE INSERT ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."set_tenant_context"();



CREATE OR REPLACE TRIGGER "trigger_set_context_phones" BEFORE INSERT ON "public"."phones" FOR EACH ROW EXECUTE FUNCTION "public"."set_creator_context"();



CREATE OR REPLACE TRIGGER "trigger_update_timestamp_phones" BEFORE UPDATE ON "public"."phones" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_update_timestamp_profiles" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."catalog_model_colors"
    ADD CONSTRAINT "catalog_model_colors_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "public"."catalog_models"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."counterparties"
    ADD CONSTRAINT "counterparties_linked_tenant_id_fkey" FOREIGN KEY ("linked_tenant_id") REFERENCES "public"."tenants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."counterparties"
    ADD CONSTRAINT "counterparties_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_payments"
    ADD CONSTRAINT "customer_payments_counterparty_id_fkey" FOREIGN KEY ("counterparty_id") REFERENCES "public"."counterparties"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."customer_payments"
    ADD CONSTRAINT "customer_payments_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."customer_payments"
    ADD CONSTRAINT "customer_payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ledger"
    ADD CONSTRAINT "fk_ledger_po" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ledger"
    ADD CONSTRAINT "fk_ledger_sale_order" FOREIGN KEY ("sale_order_id") REFERENCES "public"."sale_orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."phones"
    ADD CONSTRAINT "fk_phones_po" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."phones"
    ADD CONSTRAINT "fk_phones_sale_order" FOREIGN KEY ("sale_order_id") REFERENCES "public"."sale_orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ledger"
    ADD CONSTRAINT "ledger_customer_payment_id_fkey" FOREIGN KEY ("customer_payment_id") REFERENCES "public"."customer_payments"("id");



ALTER TABLE ONLY "public"."ledger"
    ADD CONSTRAINT "ledger_phone_id_fkey" FOREIGN KEY ("phone_id") REFERENCES "public"."phones"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ledger"
    ADD CONSTRAINT "ledger_reference_id_fkey" FOREIGN KEY ("reference_id") REFERENCES "public"."phones"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ledger"
    ADD CONSTRAINT "ledger_supplier_payment_id_fkey" FOREIGN KEY ("supplier_payment_id") REFERENCES "public"."supplier_payments"("id");



ALTER TABLE ONLY "public"."ledger"
    ADD CONSTRAINT "ledger_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ledger"
    ADD CONSTRAINT "ledger_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."master_data"
    ADD CONSTRAINT "master_data_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."master_data"
    ADD CONSTRAINT "master_data_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_allocations"
    ADD CONSTRAINT "payment_allocations_customer_payment_id_fkey" FOREIGN KEY ("customer_payment_id") REFERENCES "public"."customer_payments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_allocations"
    ADD CONSTRAINT "payment_allocations_sale_order_id_fkey" FOREIGN KEY ("sale_order_id") REFERENCES "public"."sale_orders"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."phones"
    ADD CONSTRAINT "phones_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."phones"
    ADD CONSTRAINT "phones_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_order_items"
    ADD CONSTRAINT "purchase_order_items_phone_id_fkey" FOREIGN KEY ("phone_id") REFERENCES "public"."phones"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."purchase_order_items"
    ADD CONSTRAINT "purchase_order_items_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_counterparty_id_fkey" FOREIGN KEY ("counterparty_id") REFERENCES "public"."counterparties"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sale_order_items"
    ADD CONSTRAINT "sale_order_items_phone_id_fkey" FOREIGN KEY ("phone_id") REFERENCES "public"."phones"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sale_order_items"
    ADD CONSTRAINT "sale_order_items_sale_order_id_fkey" FOREIGN KEY ("sale_order_id") REFERENCES "public"."sale_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sale_orders"
    ADD CONSTRAINT "sale_orders_counterparty_id_fkey" FOREIGN KEY ("counterparty_id") REFERENCES "public"."counterparties"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."sale_orders"
    ADD CONSTRAINT "sale_orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."supplier_allocations"
    ADD CONSTRAINT "supplier_allocations_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."supplier_allocations"
    ADD CONSTRAINT "supplier_allocations_supplier_payment_id_fkey" FOREIGN KEY ("supplier_payment_id") REFERENCES "public"."supplier_payments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."supplier_payments"
    ADD CONSTRAINT "supplier_payments_counterparty_id_fkey" FOREIGN KEY ("counterparty_id") REFERENCES "public"."counterparties"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."supplier_payments"
    ADD CONSTRAINT "supplier_payments_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."supplier_payments"
    ADD CONSTRAINT "supplier_payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."system_announcements"
    ADD CONSTRAINT "system_announcements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."unit_lifecycle"
    ADD CONSTRAINT "unit_lifecycle_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."unit_registry"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_push_subscriptions"
    ADD CONSTRAINT "user_push_subscriptions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."user_push_subscriptions"
    ADD CONSTRAINT "user_push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



CREATE POLICY "Admin delete ledger" ON "public"."ledger" FOR DELETE USING ((("tenant_id" = "public"."get_user_tenant_id"()) AND ("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'super-admin'::"text"]))));



CREATE POLICY "Admin manages tenant members" ON "public"."profiles" FOR UPDATE USING ((("tenant_id" = "public"."get_user_tenant_id"()) AND ("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'super-admin'::"text"])))) WITH CHECK ((("tenant_id" = "public"."get_user_tenant_id"()) AND ("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'super-admin'::"text"]))));



CREATE POLICY "Admin updates own tenant" ON "public"."tenants" FOR UPDATE TO "authenticated" USING (("id" = ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'super-admin'::"text"])))))) WITH CHECK (("id" = ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'super-admin'::"text"]))))));



CREATE POLICY "Admins can delete tenant ledger" ON "public"."ledger" FOR DELETE USING ((("tenant_id" = "public"."get_user_tenant_id"()) AND ("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'super-admin'::"text"]))));



CREATE POLICY "Admins can delete tenant phones" ON "public"."phones" FOR DELETE USING ((("tenant_id" = "public"."get_user_tenant_id"()) AND ("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'super-admin'::"text"]))));



CREATE POLICY "Allow authenticated insert" ON "public"."unit_registry" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Allow authenticated read tenant_requests" ON "public"."tenant_requests" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated update tenant_requests" ON "public"."tenant_requests" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Allow global read on lifecycle" ON "public"."unit_lifecycle" FOR SELECT USING (true);



CREATE POLICY "Allow global read on registry" ON "public"."unit_registry" FOR SELECT USING (true);



CREATE POLICY "Allow public insert to tenant_requests" ON "public"."tenant_requests" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Allow tenant insert" ON "public"."unit_lifecycle" FOR INSERT WITH CHECK (("tenant_id" = ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "Anonymous users can read valid shares" ON "public"."public_shares" FOR SELECT USING (("expires_at" > "now"()));



CREATE POLICY "Anyone can read active announcements" ON "public"."system_announcements" FOR SELECT USING ((("is_active" = true) AND (("starts_at" <= "now"()) OR ("starts_at" IS NULL)) AND (("expires_at" >= "now"()) OR ("expires_at" IS NULL))));



CREATE POLICY "Anyone can read catalog colors" ON "public"."catalog_model_colors" FOR SELECT USING (true);



CREATE POLICY "Anyone can read catalog models" ON "public"."catalog_models" FOR SELECT USING (true);



CREATE POLICY "Anyone can view catalog colors" ON "public"."catalog_model_colors" FOR SELECT USING (true);



CREATE POLICY "Anyone can view catalog models" ON "public"."catalog_models" FOR SELECT USING (true);



CREATE POLICY "Anyone reads catalog_models_v2" ON "public"."catalog_models_v2" FOR SELECT USING (true);



CREATE POLICY "Authenticated users can delete catalog colors" ON "public"."catalog_model_colors" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can delete catalog models" ON "public"."catalog_models" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can insert catalog colors" ON "public"."catalog_model_colors" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can insert catalog models" ON "public"."catalog_models" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can update catalog colors" ON "public"."catalog_model_colors" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can update catalog models" ON "public"."catalog_models" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Delete own master data" ON "public"."master_data" FOR DELETE USING ((("tenant_id" = "public"."get_user_tenant_id"()) AND ("auth"."uid"() = "user_id")));



CREATE POLICY "Delete tenant phones" ON "public"."phones" FOR DELETE USING ((("tenant_id" = "public"."get_user_tenant_id"()) AND ("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'manager'::"text", 'super-admin'::"text"]))));



CREATE POLICY "Insert profiles" ON "public"."profiles" FOR INSERT WITH CHECK ((("tenant_id" = "public"."get_user_tenant_id"()) AND (("public"."get_tenant_plan"() = ANY (ARRAY['wholesaler'::"text", 'trial'::"text", 'enterprise'::"text"])) OR (("public"."get_tenant_plan"() = 'pro'::"text") AND ("public"."get_tenant_member_count"() < 3)) OR (("public"."get_tenant_plan"() = 'starter'::"text") AND ("public"."get_tenant_member_count"() < 1)))));



CREATE POLICY "Insert tenant ledger" ON "public"."ledger" FOR INSERT WITH CHECK ((("tenant_id" = "public"."get_user_tenant_id"()) AND ("auth"."uid"() = "user_id")));



CREATE POLICY "Insert tenant master data" ON "public"."master_data" FOR INSERT WITH CHECK ((("tenant_id" = "public"."get_user_tenant_id"()) AND ("auth"."uid"() = "user_id")));



CREATE POLICY "Insert tenant phones" ON "public"."phones" FOR INSERT WITH CHECK ((("tenant_id" = "public"."get_user_tenant_id"()) AND ("auth"."uid"() = "user_id") AND (("public"."get_tenant_plan"() = ANY (ARRAY['wholesaler'::"text", 'trial'::"text", 'pro'::"text", 'enterprise'::"text"])) OR (("public"."get_tenant_plan"() = 'starter'::"text") AND (( SELECT "count"(*) AS "count"
   FROM "public"."phones" "p"
  WHERE ("p"."tenant_id" = "public"."get_user_tenant_id"())) < 200)))));



CREATE POLICY "Managers can manage tenant master data" ON "public"."master_data" USING ((("tenant_id" = "public"."get_user_tenant_id"()) AND ("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'manager'::"text", 'super-admin'::"text"]))));



CREATE POLICY "Super-admin deletes profiles" ON "public"."profiles" FOR DELETE USING ("public"."is_super_admin"());



CREATE POLICY "Super-admin deletes tenants" ON "public"."tenants" FOR DELETE USING ("public"."is_super_admin"());



CREATE POLICY "Super-admin manages all profiles" ON "public"."profiles" FOR UPDATE USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());



CREATE POLICY "Super-admin updates all tenants" ON "public"."tenants" FOR UPDATE USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());



CREATE POLICY "Super-admin views all profiles" ON "public"."profiles" FOR SELECT USING ("public"."is_super_admin"());



CREATE POLICY "Super-admin views all tenants" ON "public"."tenants" FOR SELECT USING ("public"."is_super_admin"());



CREATE POLICY "Super-admins can do everything on announcements" ON "public"."system_announcements" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'super-admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'super-admin'::"text")))));



CREATE POLICY "Tenants can manage their shared links" ON "public"."public_shares" TO "authenticated" USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())))) WITH CHECK (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "Update tenant phones" ON "public"."phones" FOR UPDATE USING ((("tenant_id" = "public"."get_user_tenant_id"()) AND (("auth"."uid"() = "user_id") OR ("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'manager'::"text"])))));



CREATE POLICY "Users can delete their own notifications" ON "public"."notifications" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own subscriptions" ON "public"."user_push_subscriptions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert notifications for their tenant" ON "public"."notifications" FOR INSERT WITH CHECK (("tenant_id" = ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "Users can insert tenant ledger" ON "public"."ledger" FOR INSERT WITH CHECK (("tenant_id" = "public"."get_user_tenant_id"()));



CREATE POLICY "Users can insert tenant phones" ON "public"."phones" FOR INSERT WITH CHECK (("tenant_id" = "public"."get_user_tenant_id"()));



CREATE POLICY "Users can insert their own subscriptions" ON "public"."user_push_subscriptions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update tenant phones" ON "public"."phones" FOR UPDATE USING (("tenant_id" = "public"."get_user_tenant_id"())) WITH CHECK (("tenant_id" = "public"."get_user_tenant_id"()));



CREATE POLICY "Users can update their own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own subscriptions" ON "public"."user_push_subscriptions" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view tenant ledger" ON "public"."ledger" FOR SELECT USING (("tenant_id" = "public"."get_user_tenant_id"()));



CREATE POLICY "Users can view tenant master data" ON "public"."master_data" FOR SELECT USING (("tenant_id" = "public"."get_user_tenant_id"()));



CREATE POLICY "Users can view tenant phones" ON "public"."phones" FOR SELECT USING (("tenant_id" = "public"."get_user_tenant_id"()));



CREATE POLICY "Users can view their own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own subscriptions" ON "public"."user_push_subscriptions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users update own profile" ON "public"."profiles" FOR UPDATE USING ((("auth"."uid"() = "id") AND ("tenant_id" = "public"."get_user_tenant_id"()))) WITH CHECK ((("auth"."uid"() = "id") AND ("tenant_id" = "public"."get_user_tenant_id"())));



CREATE POLICY "Users view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users view own tenant" ON "public"."tenants" FOR SELECT TO "authenticated" USING (("id" = ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "View tenant ledger" ON "public"."ledger" FOR SELECT USING ((("tenant_id" = "public"."get_user_tenant_id"()) AND (("auth"."uid"() = "user_id") OR ("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'manager'::"text", 'super-admin'::"text"])))));



CREATE POLICY "View tenant master data" ON "public"."master_data" FOR SELECT USING (("tenant_id" = "public"."get_user_tenant_id"()));



CREATE POLICY "View tenant members" ON "public"."profiles" FOR SELECT USING (("tenant_id" = "public"."get_user_tenant_id"()));



CREATE POLICY "View tenant phones" ON "public"."phones" FOR SELECT USING (("tenant_id" = "public"."get_user_tenant_id"()));



ALTER TABLE "public"."catalog_model_colors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."catalog_models" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."catalog_models_v2" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."counterparties" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cp_delete" ON "public"."counterparties" FOR DELETE USING ((("tenant_id" = "public"."get_user_tenant_id"()) AND ("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'super-admin'::"text"]))));



CREATE POLICY "cp_insert" ON "public"."counterparties" FOR INSERT WITH CHECK (("tenant_id" = "public"."get_user_tenant_id"()));



CREATE POLICY "cp_pay_insert" ON "public"."customer_payments" FOR INSERT WITH CHECK ((("tenant_id" = "public"."get_user_tenant_id"()) AND ("auth"."uid"() = "recorded_by")));



CREATE POLICY "cp_pay_select" ON "public"."customer_payments" FOR SELECT USING (("tenant_id" = "public"."get_user_tenant_id"()));



CREATE POLICY "cp_select" ON "public"."counterparties" FOR SELECT USING (("tenant_id" = "public"."get_user_tenant_id"()));



CREATE POLICY "cp_update" ON "public"."counterparties" FOR UPDATE USING ((("tenant_id" = "public"."get_user_tenant_id"()) AND ("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'associate'::"text"]))));



ALTER TABLE "public"."customer_payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ledger" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."master_data" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pa_insert" ON "public"."payment_allocations" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."customer_payments" "cp"
  WHERE (("cp"."id" = "payment_allocations"."customer_payment_id") AND ("cp"."tenant_id" = "public"."get_user_tenant_id"())))));



CREATE POLICY "pa_select" ON "public"."payment_allocations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."customer_payments" "cp"
  WHERE (("cp"."id" = "payment_allocations"."customer_payment_id") AND ("cp"."tenant_id" = "public"."get_user_tenant_id"())))));



ALTER TABLE "public"."payment_allocations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."phones" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "po_insert" ON "public"."purchase_orders" FOR INSERT WITH CHECK (("tenant_id" = "public"."get_user_tenant_id"()));



CREATE POLICY "po_select" ON "public"."purchase_orders" FOR SELECT USING (("tenant_id" = "public"."get_user_tenant_id"()));



CREATE POLICY "po_update" ON "public"."purchase_orders" FOR UPDATE USING ((("tenant_id" = "public"."get_user_tenant_id"()) AND ("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'manager'::"text", 'super-admin'::"text"])))) WITH CHECK ((("tenant_id" = "public"."get_user_tenant_id"()) AND ("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'manager'::"text", 'super-admin'::"text"]))));



CREATE POLICY "poi_insert" ON "public"."purchase_order_items" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."purchase_orders" "po"
  WHERE (("po"."id" = "purchase_order_items"."purchase_order_id") AND ("po"."tenant_id" = "public"."get_user_tenant_id"())))));



CREATE POLICY "poi_select" ON "public"."purchase_order_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."purchase_orders" "po"
  WHERE (("po"."id" = "purchase_order_items"."purchase_order_id") AND ("po"."tenant_id" = "public"."get_user_tenant_id"())))));



CREATE POLICY "poi_update" ON "public"."purchase_order_items" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."purchase_orders" "po"
  WHERE (("po"."id" = "purchase_order_items"."purchase_order_id") AND ("po"."tenant_id" = "public"."get_user_tenant_id"())))));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public_read_plans" ON "public"."subscription_plans" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."public_shares" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchase_order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchase_orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sa_insert" ON "public"."supplier_allocations" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."supplier_payments" "sp"
  WHERE (("sp"."id" = "supplier_allocations"."supplier_payment_id") AND ("sp"."tenant_id" = "public"."get_user_tenant_id"())))));



CREATE POLICY "sa_select" ON "public"."supplier_allocations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."supplier_payments" "sp"
  WHERE (("sp"."id" = "supplier_allocations"."supplier_payment_id") AND ("sp"."tenant_id" = "public"."get_user_tenant_id"())))));



ALTER TABLE "public"."sale_order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sale_orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "so_insert" ON "public"."sale_orders" FOR INSERT WITH CHECK (("tenant_id" = "public"."get_user_tenant_id"()));



CREATE POLICY "so_select" ON "public"."sale_orders" FOR SELECT USING (("tenant_id" = "public"."get_user_tenant_id"()));



CREATE POLICY "so_update" ON "public"."sale_orders" FOR UPDATE USING ((("tenant_id" = "public"."get_user_tenant_id"()) AND ("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'manager'::"text", 'super-admin'::"text"])))) WITH CHECK ((("tenant_id" = "public"."get_user_tenant_id"()) AND ("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'manager'::"text", 'super-admin'::"text"]))));



CREATE POLICY "soi_insert" ON "public"."sale_order_items" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."sale_orders" "so"
  WHERE (("so"."id" = "sale_order_items"."sale_order_id") AND ("so"."tenant_id" = "public"."get_user_tenant_id"())))));



CREATE POLICY "soi_select" ON "public"."sale_order_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."sale_orders" "so"
  WHERE (("so"."id" = "sale_order_items"."sale_order_id") AND ("so"."tenant_id" = "public"."get_user_tenant_id"())))));



CREATE POLICY "sp_insert" ON "public"."supplier_payments" FOR INSERT WITH CHECK (("tenant_id" = "public"."get_user_tenant_id"()));



CREATE POLICY "sp_select" ON "public"."supplier_payments" FOR SELECT USING (("tenant_id" = "public"."get_user_tenant_id"()));



ALTER TABLE "public"."subscription_plans" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "super_admin_full_access" ON "public"."subscription_plans" USING (("public"."get_user_role"() = 'super-admin'::"text"));



CREATE POLICY "super_admin_ledger_access" ON "public"."ledger" FOR SELECT USING (("public"."get_user_role"() = 'super-admin'::"text"));



CREATE POLICY "super_admin_phone_access" ON "public"."phones" FOR SELECT USING (("public"."get_user_role"() = 'super-admin'::"text"));



CREATE POLICY "super_admin_profile_access" ON "public"."profiles" USING (("public"."get_user_role"() = 'super-admin'::"text"));



CREATE POLICY "super_admin_tenant_delete" ON "public"."tenants" FOR DELETE USING (("public"."get_user_role"() = 'super-admin'::"text"));



CREATE POLICY "super_admin_tenant_supervision" ON "public"."tenants" FOR SELECT USING (("public"."get_user_role"() = 'super-admin'::"text"));



CREATE POLICY "super_admin_tenant_update" ON "public"."tenants" FOR UPDATE USING (("public"."get_user_role"() = 'super-admin'::"text"));



ALTER TABLE "public"."supplier_allocations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."supplier_payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_announcements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tenant_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tenants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."unit_lifecycle" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."unit_registry" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_push_subscriptions" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notifications";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."system_announcements";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































GRANT ALL ON FUNCTION "public"."broadcast_system_notification"("p_title" "text", "p_message" "text", "p_target_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."broadcast_system_notification"("p_title" "text", "p_message" "text", "p_target_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."broadcast_system_notification"("p_title" "text", "p_message" "text", "p_target_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."certify_po_receipt"("p_order_id" "uuid", "p_items" "jsonb", "p_status" "text", "p_phones_received" integer, "p_total_amount" numeric, "p_tenant_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."certify_po_receipt"("p_order_id" "uuid", "p_items" "jsonb", "p_status" "text", "p_phones_received" integer, "p_total_amount" numeric, "p_tenant_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."certify_po_receipt"("p_order_id" "uuid", "p_items" "jsonb", "p_status" "text", "p_phones_received" integer, "p_total_amount" numeric, "p_tenant_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_purchase_order"("p_order_id" "uuid", "p_counterparty_id" "uuid", "p_items" "jsonb", "p_initial_payment" numeric, "p_payment_mode" "text", "p_platform_fee" numeric, "p_payment_note" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_purchase_order"("p_order_id" "uuid", "p_counterparty_id" "uuid", "p_items" "jsonb", "p_initial_payment" numeric, "p_payment_mode" "text", "p_platform_fee" numeric, "p_payment_note" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_purchase_order"("p_order_id" "uuid", "p_counterparty_id" "uuid", "p_items" "jsonb", "p_initial_payment" numeric, "p_payment_mode" "text", "p_platform_fee" numeric, "p_payment_note" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_purchase_order"("p_order_id" "uuid", "p_counterparty_id" "uuid", "p_channel" "text", "p_platform_fee" numeric, "p_payment_mode" "text", "p_initial_payment" numeric, "p_due_date" "date", "p_notes" "text", "p_items" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_purchase_order"("p_order_id" "uuid", "p_counterparty_id" "uuid", "p_channel" "text", "p_platform_fee" numeric, "p_payment_mode" "text", "p_initial_payment" numeric, "p_due_date" "date", "p_notes" "text", "p_items" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_purchase_order"("p_order_id" "uuid", "p_counterparty_id" "uuid", "p_channel" "text", "p_platform_fee" numeric, "p_payment_mode" "text", "p_initial_payment" numeric, "p_due_date" "date", "p_notes" "text", "p_items" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_purchase_order"("p_order_id" "uuid", "p_counterparty_id" "uuid", "p_channel" "text", "p_platform_fee" numeric, "p_payment_mode" "text", "p_initial_payment" numeric, "p_due_date" "date", "p_notes" "text", "p_items" "jsonb", "p_payment_note" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_purchase_order"("p_order_id" "uuid", "p_counterparty_id" "uuid", "p_channel" "text", "p_platform_fee" numeric, "p_payment_mode" "text", "p_initial_payment" numeric, "p_due_date" "date", "p_notes" "text", "p_items" "jsonb", "p_payment_note" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_purchase_order"("p_order_id" "uuid", "p_counterparty_id" "uuid", "p_channel" "text", "p_platform_fee" numeric, "p_payment_mode" "text", "p_initial_payment" numeric, "p_due_date" "date", "p_notes" "text", "p_items" "jsonb", "p_payment_note" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_trade_order"("p_order_id" "uuid", "p_counterparty_id" "uuid", "p_order_type" "text", "p_items" "jsonb", "p_initial_payment" numeric, "p_payment_mode" "text", "p_due_date" "date", "p_notes" "text", "p_payment_note" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_trade_order"("p_order_id" "uuid", "p_counterparty_id" "uuid", "p_order_type" "text", "p_items" "jsonb", "p_initial_payment" numeric, "p_payment_mode" "text", "p_due_date" "date", "p_notes" "text", "p_payment_note" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_trade_order"("p_order_id" "uuid", "p_counterparty_id" "uuid", "p_order_type" "text", "p_items" "jsonb", "p_initial_payment" numeric, "p_payment_mode" "text", "p_due_date" "date", "p_notes" "text", "p_payment_note" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_trade_order"("p_order_id" "uuid", "p_counterparty_id" "uuid", "p_order_type" "text", "p_payment_mode" "text", "p_initial_payment" numeric, "p_due_date" "date", "p_notes" "text", "p_items" "jsonb", "p_payment_note" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_trade_order"("p_order_id" "uuid", "p_counterparty_id" "uuid", "p_order_type" "text", "p_payment_mode" "text", "p_initial_payment" numeric, "p_due_date" "date", "p_notes" "text", "p_items" "jsonb", "p_payment_note" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_trade_order"("p_order_id" "uuid", "p_counterparty_id" "uuid", "p_order_type" "text", "p_payment_mode" "text", "p_initial_payment" numeric, "p_due_date" "date", "p_notes" "text", "p_items" "jsonb", "p_payment_note" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_log_sale_lifecycle"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_log_sale_lifecycle"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_log_sale_lifecycle"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_sync_unit_registry"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_sync_unit_registry"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_sync_unit_registry"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_shared_order"("share_token" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_shared_order"("share_token" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_shared_order"("share_token" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_tenant_member_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_tenant_member_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_tenant_member_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_tenant_plan"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_tenant_plan"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_tenant_plan"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_top_issues"("limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_top_issues"("limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_top_issues"("limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_tenant_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_tenant_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_tenant_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_expired_trials"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_expired_trials"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_expired_trials"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."link_phone_to_po"("p_purchase_order_id" "uuid", "p_phone_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."link_phone_to_po"("p_purchase_order_id" "uuid", "p_phone_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."link_phone_to_po"("p_purchase_order_id" "uuid", "p_phone_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."link_phone_to_to"("p_phone_id" "uuid", "p_sale_order_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."link_phone_to_to"("p_phone_id" "uuid", "p_sale_order_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."link_phone_to_to"("p_phone_id" "uuid", "p_sale_order_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_po_item_accepted"("p_purchase_order_id" "uuid", "p_phone_id" "uuid", "p_final_price" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."mark_po_item_accepted"("p_purchase_order_id" "uuid", "p_phone_id" "uuid", "p_final_price" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_po_item_accepted"("p_purchase_order_id" "uuid", "p_phone_id" "uuid", "p_final_price" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_po_item_accepted"("p_item_id" "uuid", "p_purchase_order_id" "uuid", "p_phone_id" "uuid", "p_final_price" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."mark_po_item_accepted"("p_item_id" "uuid", "p_purchase_order_id" "uuid", "p_phone_id" "uuid", "p_final_price" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_po_item_accepted"("p_item_id" "uuid", "p_purchase_order_id" "uuid", "p_phone_id" "uuid", "p_final_price" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_po_item_rejected"("p_item_id" "uuid", "p_purchase_order_id" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_po_item_rejected"("p_item_id" "uuid", "p_purchase_order_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_po_item_rejected"("p_item_id" "uuid", "p_purchase_order_id" "uuid", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_admin_on_phone_sale"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_admin_on_phone_sale"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_admin_on_phone_sale"() TO "service_role";



GRANT ALL ON FUNCTION "public"."record_customer_payment"("p_counterparty_id" "uuid", "p_total_received" numeric, "p_mode" "text", "p_allocations" "jsonb", "p_note" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."record_customer_payment"("p_counterparty_id" "uuid", "p_total_received" numeric, "p_mode" "text", "p_allocations" "jsonb", "p_note" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_customer_payment"("p_counterparty_id" "uuid", "p_total_received" numeric, "p_mode" "text", "p_allocations" "jsonb", "p_note" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."record_customer_payment"("p_counterparty_id" "uuid", "p_total_received" numeric, "p_mode" "text", "p_allocations" "jsonb", "p_note" "text", "p_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."record_customer_payment"("p_counterparty_id" "uuid", "p_total_received" numeric, "p_mode" "text", "p_allocations" "jsonb", "p_note" "text", "p_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_customer_payment"("p_counterparty_id" "uuid", "p_total_received" numeric, "p_mode" "text", "p_allocations" "jsonb", "p_note" "text", "p_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."record_customer_settlement_fifo"("p_counterparty_id" "uuid", "p_amount" numeric, "p_mode" "text", "p_note" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."record_customer_settlement_fifo"("p_counterparty_id" "uuid", "p_amount" numeric, "p_mode" "text", "p_note" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_customer_settlement_fifo"("p_counterparty_id" "uuid", "p_amount" numeric, "p_mode" "text", "p_note" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."record_supplier_payment"("p_counterparty_id" "uuid", "p_total_paid" numeric, "p_mode" "text", "p_allocations" "jsonb", "p_note" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."record_supplier_payment"("p_counterparty_id" "uuid", "p_total_paid" numeric, "p_mode" "text", "p_allocations" "jsonb", "p_note" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_supplier_payment"("p_counterparty_id" "uuid", "p_total_paid" numeric, "p_mode" "text", "p_allocations" "jsonb", "p_note" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."record_supplier_payment"("p_counterparty_id" "uuid", "p_total_paid" numeric, "p_mode" "text", "p_allocations" "jsonb", "p_note" "text", "p_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."record_supplier_payment"("p_counterparty_id" "uuid", "p_total_paid" numeric, "p_mode" "text", "p_allocations" "jsonb", "p_note" "text", "p_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_supplier_payment"("p_counterparty_id" "uuid", "p_total_paid" numeric, "p_mode" "text", "p_allocations" "jsonb", "p_note" "text", "p_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."record_supplier_settlement_fifo"("p_counterparty_id" "uuid", "p_amount" numeric, "p_mode" "text", "p_note" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."record_supplier_settlement_fifo"("p_counterparty_id" "uuid", "p_amount" numeric, "p_mode" "text", "p_note" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_supplier_settlement_fifo"("p_counterparty_id" "uuid", "p_amount" numeric, "p_mode" "text", "p_note" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."return_order"("p_order_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."return_order"("p_order_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."return_order"("p_order_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_creator_context"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_creator_context"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_creator_context"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_phone_imei_tenant"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_phone_imei_tenant"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_phone_imei_tenant"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_row_defaults"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_row_defaults"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_row_defaults"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_tenant_context"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_tenant_context"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_tenant_context"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_order_payment"("p_order_id" "uuid", "p_amount_paid" numeric, "p_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_order_payment"("p_order_id" "uuid", "p_amount_paid" numeric, "p_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_order_payment"("p_order_id" "uuid", "p_amount_paid" numeric, "p_status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";
























GRANT ALL ON TABLE "public"."catalog_model_colors" TO "anon";
GRANT ALL ON TABLE "public"."catalog_model_colors" TO "authenticated";
GRANT ALL ON TABLE "public"."catalog_model_colors" TO "service_role";



GRANT ALL ON TABLE "public"."catalog_models" TO "anon";
GRANT ALL ON TABLE "public"."catalog_models" TO "authenticated";
GRANT ALL ON TABLE "public"."catalog_models" TO "service_role";



GRANT ALL ON TABLE "public"."catalog_models_v2" TO "anon";
GRANT ALL ON TABLE "public"."catalog_models_v2" TO "authenticated";
GRANT ALL ON TABLE "public"."catalog_models_v2" TO "service_role";



GRANT ALL ON TABLE "public"."counterparties" TO "anon";
GRANT ALL ON TABLE "public"."counterparties" TO "authenticated";
GRANT ALL ON TABLE "public"."counterparties" TO "service_role";



GRANT ALL ON TABLE "public"."customer_payments" TO "anon";
GRANT ALL ON TABLE "public"."customer_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_payments" TO "service_role";



GRANT ALL ON TABLE "public"."ledger" TO "anon";
GRANT ALL ON TABLE "public"."ledger" TO "authenticated";
GRANT ALL ON TABLE "public"."ledger" TO "service_role";



GRANT ALL ON TABLE "public"."master_data" TO "anon";
GRANT ALL ON TABLE "public"."master_data" TO "authenticated";
GRANT ALL ON TABLE "public"."master_data" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."payment_allocations" TO "anon";
GRANT ALL ON TABLE "public"."payment_allocations" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_allocations" TO "service_role";



GRANT ALL ON TABLE "public"."phones" TO "anon";
GRANT ALL ON TABLE "public"."phones" TO "authenticated";
GRANT ALL ON TABLE "public"."phones" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."public_shares" TO "anon";
GRANT ALL ON TABLE "public"."public_shares" TO "authenticated";
GRANT ALL ON TABLE "public"."public_shares" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_order_items" TO "anon";
GRANT ALL ON TABLE "public"."purchase_order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_order_items" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_orders" TO "anon";
GRANT ALL ON TABLE "public"."purchase_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_orders" TO "service_role";



GRANT ALL ON TABLE "public"."sale_order_items" TO "anon";
GRANT ALL ON TABLE "public"."sale_order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."sale_order_items" TO "service_role";



GRANT ALL ON TABLE "public"."sale_orders" TO "anon";
GRANT ALL ON TABLE "public"."sale_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."sale_orders" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_plans" TO "anon";
GRANT ALL ON TABLE "public"."subscription_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_plans" TO "service_role";



GRANT ALL ON TABLE "public"."supplier_allocations" TO "anon";
GRANT ALL ON TABLE "public"."supplier_allocations" TO "authenticated";
GRANT ALL ON TABLE "public"."supplier_allocations" TO "service_role";



GRANT ALL ON TABLE "public"."supplier_payments" TO "anon";
GRANT ALL ON TABLE "public"."supplier_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."supplier_payments" TO "service_role";



GRANT ALL ON TABLE "public"."system_announcements" TO "anon";
GRANT ALL ON TABLE "public"."system_announcements" TO "authenticated";
GRANT ALL ON TABLE "public"."system_announcements" TO "service_role";



GRANT ALL ON TABLE "public"."tenant_requests" TO "anon";
GRANT ALL ON TABLE "public"."tenant_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."tenant_requests" TO "service_role";



GRANT ALL ON TABLE "public"."tenants" TO "anon";
GRANT ALL ON TABLE "public"."tenants" TO "authenticated";
GRANT ALL ON TABLE "public"."tenants" TO "service_role";



GRANT ALL ON TABLE "public"."unit_lifecycle" TO "anon";
GRANT ALL ON TABLE "public"."unit_lifecycle" TO "authenticated";
GRANT ALL ON TABLE "public"."unit_lifecycle" TO "service_role";



GRANT ALL ON TABLE "public"."unit_registry" TO "anon";
GRANT ALL ON TABLE "public"."unit_registry" TO "authenticated";
GRANT ALL ON TABLE "public"."unit_registry" TO "service_role";



GRANT ALL ON TABLE "public"."user_push_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."user_push_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_push_subscriptions" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































