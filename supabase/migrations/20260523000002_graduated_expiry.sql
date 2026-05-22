-- Migration: Graduated subscription expiry state machine
-- Replaces the instant plan='expired' hard-lock on subscription.halted with a graduated flow:
--   payment.failed  → full access + banner (no plan change)
--   subscription.halted → plan='grace'     (7 days full access + urgent banner)
--   cron after 7d   → plan='restricted'   (7 days read-only + banner)
--   cron after 14d  → plan='expired'      (full paywall, data kept forever)
-- Successful payment at any stage → flags cleared, plan restored.

-- 1. Add timing columns to tenants
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS plan_halted_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_failed_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMPTZ;

-- 2. Update the plan CHECK constraint to include 'grace' and 'restricted'
DO $$
DECLARE
  v_constraint TEXT;
BEGIN
  SELECT tc.constraint_name INTO v_constraint
  FROM information_schema.table_constraints tc
  JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
  WHERE tc.table_schema = 'public'
    AND tc.table_name   = 'tenants'
    AND tc.constraint_type = 'CHECK'
    AND cc.check_clause ILIKE '%plan%'
  LIMIT 1;

  IF v_constraint IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.tenants DROP CONSTRAINT ' || quote_ident(v_constraint);
  END IF;
END $$;

ALTER TABLE public.tenants
  ADD CONSTRAINT tenants_plan_check
  CHECK (plan IN (
    'free', 'trial',
    'starter', 'pro', 'wholesaler', 'enterprise',
    'grace', 'restricted',
    'expired'
  ));

-- 3. Graduated plan state machine function (runs hourly via cron)
CREATE OR REPLACE FUNCTION public.run_plan_state_machine()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- grace → restricted after 7 days from halt
  UPDATE public.tenants
  SET plan       = 'restricted',
      updated_at = now()
  WHERE plan           = 'grace'
    AND plan_halted_at IS NOT NULL
    AND plan_halted_at < now() - INTERVAL '7 days';

  -- restricted → expired (full paywall) after 14 days from halt
  UPDATE public.tenants
  SET plan       = 'expired',
      updated_at = now()
  WHERE plan           = 'restricted'
    AND plan_halted_at IS NOT NULL
    AND plan_halted_at < now() - INTERVAL '14 days';

  -- trial → expired when plan_expires_at has passed
  UPDATE public.tenants
  SET plan       = 'expired',
      updated_at = now()
  WHERE plan             = 'trial'
    AND plan_expires_at IS NOT NULL
    AND plan_expires_at  < now();

  -- cancelled/completed paid plans past their billing period end date
  UPDATE public.tenants
  SET plan       = 'expired',
      updated_at = now()
  WHERE plan IN ('starter', 'pro', 'wholesaler', 'enterprise')
    AND plan_expires_at IS NOT NULL
    AND plan_expires_at  < now();
END;
$$;

-- 4. Keep old function name as an alias for backward compatibility
CREATE OR REPLACE FUNCTION public.handle_expired_trials()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.run_plan_state_machine();
END;
$$;

-- 5. Schedule hourly cron for the state machine (idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'plan-state-machine') THEN
    PERFORM cron.unschedule('plan-state-machine');
  END IF;
END $$;
SELECT cron.schedule(
  'plan-state-machine',
  '0 * * * *',
  $$ SELECT public.run_plan_state_machine(); $$
);

-- 6. Schedule daily cron for lifecycle reminder emails at 9 AM UTC.
--    Calls the send-plan-reminder edge function via pg_net (must be enabled in Supabase Dashboard).
--    Replace <PROJECT_REF> and <ANON_KEY> with the actual values, OR add this via Dashboard manually.
--
--    SELECT cron.schedule(
--      'plan-reminders',
--      '0 9 * * *',
--      $$ SELECT net.http_post(
--           url  := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-plan-reminder',
--           headers := '{"Authorization": "Bearer <ANON_KEY>"}'::jsonb,
--           body    := '{}'::jsonb
--         ); $$
--    );
--
--    NOTE: This cron must be added manually via Dashboard > Database > Cron Jobs because it
--    requires your project-specific URL and anon key. The edge function gracefully no-ops
--    until MSG91_AUTH_KEY secret is also configured.
