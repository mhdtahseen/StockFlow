-- =============================================================================
-- Fix: Missing 'type' column on customer_payments and supplier_payments
--
-- Several RPCs (create_purchase_order, record_supplier_payment, etc.) were 
-- written to insert a 'type' value (e.g., 'ADVANCE' or 'SETTLEMENT') into the 
-- customer_payments and supplier_payments tables, but the column was never
-- actually added to the schema.
--
-- This migration adds the missing 'type' columns.
-- =============================================================================

ALTER TABLE public.supplier_payments
  ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('ADVANCE', 'SETTLEMENT')) DEFAULT 'ADVANCE';

ALTER TABLE public.customer_payments
  ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('ADVANCE', 'SETTLEMENT')) DEFAULT 'ADVANCE';
