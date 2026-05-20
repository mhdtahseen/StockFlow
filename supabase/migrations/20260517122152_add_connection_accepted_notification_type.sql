
-- Add CONNECTION_ACCEPTED to notifications type check constraint
-- The connect_by_trade_code() RPC inserts this type but the constraint was never updated.
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type = ANY (ARRAY[
    'PHONE_SOLD'::text,
    'ROLE_PROMOTED'::text,
    'LEDGER_ENTRY'::text,
    'SYSTEM_ALERT'::text,
    'PAYMENT_DUE'::text,
    'CONNECTION_ACCEPTED'::text
  ]));
;
