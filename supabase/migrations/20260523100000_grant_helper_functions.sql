-- Ensure core RLS helper functions exist and are callable by authenticated/anon roles.
-- These functions are used in RLS policies across multiple tables.
-- Missing GRANT EXECUTE causes "function does not exist" errors from PostgREST.

-- Re-create with OR REPLACE to ensure the latest definition is live
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Grant execute so PostgREST can call them on behalf of authenticated users.
-- Without these, RLS policies that reference these functions fail with
-- "function does not exist" even though the function is defined.
GRANT EXECUTE ON FUNCTION public.get_user_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tenant_id() TO anon;

GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO anon;
