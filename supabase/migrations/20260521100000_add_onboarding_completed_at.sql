-- Add onboarding tracking to profiles
-- NULL  = user has NOT completed onboarding
-- value = timestamp when onboarding was completed (or skipped)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ DEFAULT NULL;

-- Backfill all existing users so they don't see the onboarding flow.
-- Only backfill rows created before today's migration.
UPDATE profiles
SET onboarding_completed_at = NOW()
WHERE onboarding_completed_at IS NULL
  AND created_at < '2026-05-22T00:00:00Z';
