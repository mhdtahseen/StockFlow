-- ==========================================
-- AUTHENTICATION TRIGGERS & ONBOARDING
-- ==========================================

-- Trigger to gracefully handle a new user signup via Supabase Auth
-- Validates whether they are joining via an Invite (associate) or creating a new shop (admin)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists (for redeployments)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the execution trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
