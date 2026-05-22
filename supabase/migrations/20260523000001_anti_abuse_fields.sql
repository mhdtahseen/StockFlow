-- Migration: Anti-abuse tracking fields for tenant requests and tenants
-- Phase 1: Collect device fingerprint, phone, and request IP at signup time.
-- OTP phone verification is DEFERRED pending DLT registration.

-- 1. Extend tenant_requests with anti-abuse capture fields
ALTER TABLE public.tenant_requests
  ADD COLUMN IF NOT EXISTS phone              TEXT,
  ADD COLUMN IF NOT EXISTS device_fingerprint TEXT,
  ADD COLUMN IF NOT EXISTS request_ip         INET,
  ADD COLUMN IF NOT EXISTS user_agent         TEXT;

-- 2. Prevent the same email from submitting multiple non-rejected requests
--    (case-insensitive, partial index so rejected emails can re-apply)
CREATE UNIQUE INDEX IF NOT EXISTS tenant_requests_email_unique_active
  ON public.tenant_requests (lower(email))
  WHERE (status <> 'rejected');

-- 3. Add signup provenance columns to tenants (immutable after creation, for abuse review)
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS signup_phone              TEXT,
  ADD COLUMN IF NOT EXISTS signup_device_fingerprint TEXT,
  ADD COLUMN IF NOT EXISTS signup_ip                 INET;
