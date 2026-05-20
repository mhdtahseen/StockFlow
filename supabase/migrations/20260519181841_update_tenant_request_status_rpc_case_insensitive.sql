CREATE OR REPLACE FUNCTION public.check_request_status(input_email text)
RETURNS TABLE (status text, org_name text, created_at timestamptz)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT tr.status::text, tr.org_name, tr.created_at
  FROM public.tenant_requests tr
  WHERE lower(tr.email) = lower(trim(input_email))
  ORDER BY tr.created_at DESC
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_request_status(text) TO anon, authenticated;;
