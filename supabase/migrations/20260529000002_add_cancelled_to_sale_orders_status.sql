-- Fix: sale_orders_status_check constraint was missing 'CANCELLED'
-- The cancel_sale_order RPC writes status='CANCELLED' but the constraint
-- only allowed: OPEN, PARTIAL, SETTLED, RETURNED.

ALTER TABLE public.sale_orders
  DROP CONSTRAINT sale_orders_status_check;

ALTER TABLE public.sale_orders
  ADD CONSTRAINT sale_orders_status_check
  CHECK (status = ANY (ARRAY['OPEN'::text, 'PARTIAL'::text, 'SETTLED'::text, 'RETURNED'::text, 'CANCELLED'::text]));
