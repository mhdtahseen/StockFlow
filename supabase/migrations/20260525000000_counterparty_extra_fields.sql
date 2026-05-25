-- Add missing counterparty fields that exist in frontend but not DB
-- These were previously stored only in Redux and lost on reinstall/clear

ALTER TABLE public.counterparties
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS pincode TEXT,
  ADD COLUMN IF NOT EXISTS aadhaar_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS aadhaar_last4 TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Index for tag filtering (GIN supports @> containment queries)
CREATE INDEX IF NOT EXISTS idx_counterparties_tags
  ON public.counterparties USING GIN (tags);

-- Constraint: aadhaar_last4 must be exactly 4 digits if present
ALTER TABLE public.counterparties
  ADD CONSTRAINT counterparties_aadhaar_last4_check
  CHECK (aadhaar_last4 IS NULL OR aadhaar_last4 ~ '^\d{4}$');

-- Constraint: pincode must be 6 digits if present
ALTER TABLE public.counterparties
  ADD CONSTRAINT counterparties_pincode_check
  CHECK (pincode IS NULL OR pincode ~ '^\d{6}$');
