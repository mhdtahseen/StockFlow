-- Migration: push_notifications_v2
-- Adds per-platform push subscription support so a user can have both a web
-- (VAPID) and a native (FCM/APNs) subscription simultaneously.

-- 1. Add new columns
ALTER TABLE public.user_push_subscriptions
  ADD COLUMN IF NOT EXISTS platform     TEXT        DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS native_token TEXT,
  ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ DEFAULT now();

-- 2. Back-fill platform + native_token from existing subscription JSONB
UPDATE public.user_push_subscriptions
SET
  platform = CASE
    WHEN subscription->>'native' = 'true' AND subscription->>'platform' = 'ios'     THEN 'ios'
    WHEN subscription->>'native' = 'true'                                            THEN 'android'
    ELSE 'web'
  END,
  native_token = CASE
    WHEN subscription->>'native' = 'true' THEN subscription->>'token'
    ELSE NULL
  END;

-- 3. Drop the old per-user unique constraint (one row per user regardless of platform)
ALTER TABLE public.user_push_subscriptions
  DROP CONSTRAINT IF EXISTS user_push_subscriptions_user_id_key;

-- 4. Add new unique constraint: one row per (user, platform)
ALTER TABLE public.user_push_subscriptions
  ADD CONSTRAINT user_push_subscriptions_user_platform_key UNIQUE (user_id, platform);

-- 5. Index for fast platform-filtered queries from the Edge Function
CREATE INDEX IF NOT EXISTS idx_user_push_subs_platform
  ON public.user_push_subscriptions (platform);
