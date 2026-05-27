-- =============================================================================
-- Fix: get_tenant_plan and get_tenant_member_count had SET search_path TO ''
--      (empty) which caused Postgres to fail to resolve the unqualified call
--      to get_user_tenant_id() inside their bodies, producing:
--        "function get_user_tenant_id() does not exist"
--      (or the misspelled variant in some error messages)
--
--      Root cause: Supabase's "no search_path" security hardening was applied
--      to these two functions but their bodies were NOT updated to use the
--      fully-qualified public.get_user_tenant_id() call.
--
--      Fix: set search_path TO 'public' so unqualified calls resolve correctly,
--      OR fully-qualify the inner call. We use search_path = 'public' to match
--      the existing style of get_user_tenant_id() itself.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_tenant_plan()
  RETURNS text
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  SELECT plan FROM public.tenants WHERE id = public.get_user_tenant_id();
$$;

CREATE OR REPLACE FUNCTION public.get_tenant_member_count()
  RETURNS integer
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::INT FROM public.profiles
  WHERE tenant_id = public.get_user_tenant_id() AND is_active = true;
$$;

-- Ensure both are callable by authenticated users (RLS policies reference them)
GRANT EXECUTE ON FUNCTION public.get_tenant_plan() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_member_count() TO authenticated;

-- Reload PostgREST schema cache so API picks up the updated definitions
NOTIFY pgrst, 'reload schema';
