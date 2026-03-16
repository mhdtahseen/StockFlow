-- Run this in your Supabase SQL Editor

-- 1. Create the tenant_requests table
CREATE TABLE IF NOT EXISTS public.tenant_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    org_name text NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. Add Row Level Security (RLS) policies
ALTER TABLE public.tenant_requests ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to INSERT a new request (since they are signing up)
CREATE POLICY "Allow public insert to tenant_requests"
ON public.tenant_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow authenticated admins to view and update requests
-- Depending on your RLS strategy, you might restrict this to just YOUR user.
-- Here we allow any authenticated user to view/update for ease of the SuperAdmin Dashboard.
-- (In a true production app, add: `USING (auth.uid() IN (SELECT admin_id FROM ...))` )
CREATE POLICY "Allow authenticated read tenant_requests"
ON public.tenant_requests
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated update tenant_requests"
ON public.tenant_requests
FOR UPDATE
TO authenticated
USING (true);
