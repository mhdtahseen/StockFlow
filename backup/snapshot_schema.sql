


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


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






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
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;


ALTER FUNCTION "public"."get_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_tenant_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid();
$$;


ALTER FUNCTION "public"."get_user_tenant_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


CREATE TABLE IF NOT EXISTS "public"."ledger" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "reference_id" "uuid",
    "amount" numeric(12,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "note" "text",
    CONSTRAINT "ledger_type_check" CHECK (("type" = ANY (ARRAY['MONEY_ADDED'::"text", 'FUNDS_PLEDGED'::"text", 'FUNDS_RELEASED'::"text", 'FUNDS_CONSUMED'::"text", 'PHONE_SALE'::"text", 'REPAIR_COST'::"text", 'WITHDRAWAL'::"text", 'PROFIT_WITHDRAWAL'::"text"])))
);


ALTER TABLE "public"."ledger" OWNER TO "postgres";


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
    CONSTRAINT "notifications_type_check" CHECK (("type" = ANY (ARRAY['PHONE_SOLD'::"text", 'ROLE_PROMOTED'::"text", 'LEDGER_ENTRY'::"text", 'SYSTEM_ALERT'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."phone_imeis" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "phone_id" "uuid" NOT NULL,
    "imei" "text" NOT NULL,
    "imei_status" "text" DEFAULT 'UNVERIFIED'::"text" NOT NULL,
    "imei_checked_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "imei_format_check" CHECK (("imei" ~ '^[0-9]{15}$'::"text")),
    CONSTRAINT "phone_imeis_imei_status_check" CHECK (("imei_status" = ANY (ARRAY['UNVERIFIED'::"text", 'CLEAN'::"text", 'BLACKLISTED'::"text", 'LOCKED'::"text", 'UNKNOWN'::"text"])))
);


ALTER TABLE "public"."phone_imeis" OWNER TO "postgres";


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
    CONSTRAINT "tenants_plan_check" CHECK (("plan" = ANY (ARRAY['free'::"text", 'pro'::"text", 'enterprise'::"text"])))
);


ALTER TABLE "public"."tenants" OWNER TO "postgres";


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



ALTER TABLE ONLY "public"."ledger"
    ADD CONSTRAINT "ledger_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."master_data"
    ADD CONSTRAINT "master_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."master_data"
    ADD CONSTRAINT "master_data_tenant_id_category_value_key" UNIQUE ("tenant_id", "category", "value");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."phone_imeis"
    ADD CONSTRAINT "phone_imeis_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."phones"
    ADD CONSTRAINT "phones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenant_requests"
    ADD CONSTRAINT "tenant_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_slug_key" UNIQUE ("slug");



CREATE INDEX "idx_catalog_colors_model" ON "public"."catalog_model_colors" USING "btree" ("model_id");



CREATE INDEX "idx_catalog_models_brand" ON "public"."catalog_models" USING "btree" ("brand");



CREATE INDEX "idx_cmv2_brand" ON "public"."catalog_models_v2" USING "btree" ("brand");



CREATE INDEX "idx_cmv2_model" ON "public"."catalog_models_v2" USING "gin" ("to_tsvector"('"english"'::"regconfig", "model"));



CREATE INDEX "idx_ledger_reference" ON "public"."ledger" USING "btree" ("reference_id");



CREATE INDEX "idx_ledger_tenant" ON "public"."ledger" USING "btree" ("tenant_id");



CREATE INDEX "idx_ledger_tenant_created" ON "public"."ledger" USING "btree" ("tenant_id", "created_at" DESC);



CREATE INDEX "idx_ledger_tenant_type" ON "public"."ledger" USING "btree" ("tenant_id", "type");



CREATE INDEX "idx_ledger_user" ON "public"."ledger" USING "btree" ("user_id");



CREATE INDEX "idx_master_data_lookup" ON "public"."master_data" USING "btree" ("tenant_id", "category");



CREATE UNIQUE INDEX "idx_phone_imeis_unique_per_tenant" ON "public"."phone_imeis" USING "btree" ("tenant_id", "imei");



CREATE INDEX "idx_phones_tenant" ON "public"."phones" USING "btree" ("tenant_id");



CREATE INDEX "idx_phones_tenant_created" ON "public"."phones" USING "btree" ("tenant_id", "created_at" DESC);



CREATE INDEX "idx_phones_tenant_status" ON "public"."phones" USING "btree" ("tenant_id", "status");



CREATE INDEX "idx_phones_user" ON "public"."phones" USING "btree" ("user_id");



CREATE INDEX "idx_profiles_role" ON "public"."profiles" USING "btree" ("role");



CREATE INDEX "idx_profiles_tenant" ON "public"."profiles" USING "btree" ("tenant_id");



CREATE OR REPLACE TRIGGER "before_insert_phone_imeis" BEFORE INSERT ON "public"."phone_imeis" FOR EACH ROW EXECUTE FUNCTION "public"."set_phone_imei_tenant"();



CREATE OR REPLACE TRIGGER "set_cmv2_updated_at" BEFORE UPDATE ON "public"."catalog_models_v2" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_phones_updated_at" BEFORE UPDATE ON "public"."phones" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_tenants_updated_at" BEFORE UPDATE ON "public"."tenants" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



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



CREATE OR REPLACE TRIGGER "trigger_update_timestamp_tenants" BEFORE UPDATE ON "public"."tenants" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."catalog_model_colors"
    ADD CONSTRAINT "catalog_model_colors_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "public"."catalog_models"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ledger"
    ADD CONSTRAINT "ledger_reference_id_fkey" FOREIGN KEY ("reference_id") REFERENCES "public"."phones"("id") ON DELETE SET NULL;



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



ALTER TABLE ONLY "public"."phone_imeis"
    ADD CONSTRAINT "phone_imeis_phone_id_fkey" FOREIGN KEY ("phone_id") REFERENCES "public"."phones"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."phone_imeis"
    ADD CONSTRAINT "phone_imeis_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."phones"
    ADD CONSTRAINT "phones_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."phones"
    ADD CONSTRAINT "phones_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



CREATE POLICY "Admin delete ledger" ON "public"."ledger" FOR DELETE USING ((("tenant_id" = "public"."get_user_tenant_id"()) AND ("public"."get_user_role"() = 'admin'::"text")));



CREATE POLICY "Admin manages tenant members" ON "public"."profiles" FOR UPDATE USING ((("tenant_id" = "public"."get_user_tenant_id"()) AND ("public"."get_user_role"() = 'admin'::"text")));



CREATE POLICY "Admin updates own tenant" ON "public"."tenants" FOR UPDATE USING ((("id" = "public"."get_user_tenant_id"()) AND ("public"."get_user_role"() = 'admin'::"text")));



CREATE POLICY "Admins can delete tenant ledger" ON "public"."ledger" FOR DELETE USING ((("tenant_id" = "public"."get_user_tenant_id"()) AND ("public"."get_user_role"() = 'admin'::"text")));



CREATE POLICY "Admins can delete tenant phones" ON "public"."phones" FOR DELETE USING ((("tenant_id" = "public"."get_user_tenant_id"()) AND ("public"."get_user_role"() = 'admin'::"text")));



CREATE POLICY "Allow authenticated read tenant_requests" ON "public"."tenant_requests" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated update tenant_requests" ON "public"."tenant_requests" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Allow public insert to tenant_requests" ON "public"."tenant_requests" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



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



CREATE POLICY "Delete tenant phones" ON "public"."phones" FOR DELETE USING ((("tenant_id" = "public"."get_user_tenant_id"()) AND ("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'manager'::"text"]))));



CREATE POLICY "Insert tenant ledger" ON "public"."ledger" FOR INSERT WITH CHECK ((("tenant_id" = "public"."get_user_tenant_id"()) AND ("auth"."uid"() = "user_id")));



CREATE POLICY "Insert tenant master data" ON "public"."master_data" FOR INSERT WITH CHECK ((("tenant_id" = "public"."get_user_tenant_id"()) AND ("auth"."uid"() = "user_id")));



CREATE POLICY "Insert tenant phones" ON "public"."phones" FOR INSERT WITH CHECK ((("tenant_id" = "public"."get_user_tenant_id"()) AND ("auth"."uid"() = "user_id")));



CREATE POLICY "Managers can manage tenant master data" ON "public"."master_data" USING ((("tenant_id" = "public"."get_user_tenant_id"()) AND ("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'manager'::"text"]))));



CREATE POLICY "Update tenant phones" ON "public"."phones" FOR UPDATE USING ((("tenant_id" = "public"."get_user_tenant_id"()) AND (("auth"."uid"() = "user_id") OR ("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'manager'::"text"])))));



CREATE POLICY "Users can delete IMEIs for their tenant" ON "public"."phone_imeis" FOR DELETE USING (("tenant_id" IN ( SELECT "p"."tenant_id"
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "Users can insert IMEIs for their tenant" ON "public"."phone_imeis" FOR INSERT WITH CHECK (("tenant_id" IN ( SELECT "p"."tenant_id"
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "Users can insert notifications for their tenant" ON "public"."notifications" FOR INSERT WITH CHECK (("tenant_id" = ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "Users can insert tenant ledger" ON "public"."ledger" FOR INSERT WITH CHECK (("tenant_id" = "public"."get_user_tenant_id"()));



CREATE POLICY "Users can insert tenant phones" ON "public"."phones" FOR INSERT WITH CHECK (("tenant_id" = "public"."get_user_tenant_id"()));



CREATE POLICY "Users can update IMEIs for their tenant" ON "public"."phone_imeis" FOR UPDATE USING (("tenant_id" IN ( SELECT "p"."tenant_id"
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "Users can update tenant phones" ON "public"."phones" FOR UPDATE USING (("tenant_id" = "public"."get_user_tenant_id"())) WITH CHECK (("tenant_id" = "public"."get_user_tenant_id"()));



CREATE POLICY "Users can update their own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view tenant ledger" ON "public"."ledger" FOR SELECT USING (("tenant_id" = "public"."get_user_tenant_id"()));



CREATE POLICY "Users can view tenant master data" ON "public"."master_data" FOR SELECT USING (("tenant_id" = "public"."get_user_tenant_id"()));



CREATE POLICY "Users can view tenant phones" ON "public"."phones" FOR SELECT USING (("tenant_id" = "public"."get_user_tenant_id"()));



CREATE POLICY "Users can view their own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own tenant" ON "public"."tenants" FOR SELECT USING (("id" = "public"."get_user_tenant_id"()));



CREATE POLICY "Users can view their tenant's IMEIs" ON "public"."phone_imeis" FOR SELECT USING (("tenant_id" IN ( SELECT "p"."tenant_id"
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "Users update own profile" ON "public"."profiles" FOR UPDATE USING ((("auth"."uid"() = "id") AND ("tenant_id" = "public"."get_user_tenant_id"()))) WITH CHECK ((("auth"."uid"() = "id") AND ("tenant_id" = "public"."get_user_tenant_id"())));



CREATE POLICY "Users view own tenant" ON "public"."tenants" FOR SELECT USING (("id" = "public"."get_user_tenant_id"()));



CREATE POLICY "View tenant ledger" ON "public"."ledger" FOR SELECT USING ((("tenant_id" = "public"."get_user_tenant_id"()) AND (("auth"."uid"() = "user_id") OR ("public"."get_user_role"() = ANY (ARRAY['admin'::"text", 'manager'::"text"])))));



CREATE POLICY "View tenant master data" ON "public"."master_data" FOR SELECT USING (("tenant_id" = "public"."get_user_tenant_id"()));



CREATE POLICY "View tenant members" ON "public"."profiles" FOR SELECT USING (("tenant_id" = "public"."get_user_tenant_id"()));



CREATE POLICY "View tenant phones" ON "public"."phones" FOR SELECT USING (("tenant_id" = "public"."get_user_tenant_id"()));



ALTER TABLE "public"."catalog_model_colors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."catalog_models" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."catalog_models_v2" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ledger" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."master_data" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."phone_imeis" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."phones" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tenant_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tenants" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notifications";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."get_top_issues"("limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_top_issues"("limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_top_issues"("limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_tenant_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_tenant_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_tenant_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_admin_on_phone_sale"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_admin_on_phone_sale"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_admin_on_phone_sale"() TO "service_role";



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



GRANT ALL ON TABLE "public"."ledger" TO "anon";
GRANT ALL ON TABLE "public"."ledger" TO "authenticated";
GRANT ALL ON TABLE "public"."ledger" TO "service_role";



GRANT ALL ON TABLE "public"."master_data" TO "anon";
GRANT ALL ON TABLE "public"."master_data" TO "authenticated";
GRANT ALL ON TABLE "public"."master_data" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."phone_imeis" TO "anon";
GRANT ALL ON TABLE "public"."phone_imeis" TO "authenticated";
GRANT ALL ON TABLE "public"."phone_imeis" TO "service_role";



GRANT ALL ON TABLE "public"."phones" TO "anon";
GRANT ALL ON TABLE "public"."phones" TO "authenticated";
GRANT ALL ON TABLE "public"."phones" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."tenant_requests" TO "anon";
GRANT ALL ON TABLE "public"."tenant_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."tenant_requests" TO "service_role";



GRANT ALL ON TABLE "public"."tenants" TO "anon";
GRANT ALL ON TABLE "public"."tenants" TO "authenticated";
GRANT ALL ON TABLE "public"."tenants" TO "service_role";









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































