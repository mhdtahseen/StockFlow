-- Add logo_url and state_code columns to tenants
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS logo_url   TEXT,
  ADD COLUMN IF NOT EXISTS state_code TEXT;

COMMENT ON COLUMN public.tenants.logo_url   IS 'Cloudinary secure_url for the business logo';
COMMENT ON COLUMN public.tenants.state_code IS 'Two-letter state code derived from GSTIN or manually set';
