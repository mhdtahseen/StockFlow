-- Migration: Add missing updated_at column to purchase_order_items (v2.8.2)
-- This column is required for the atomic certify_po_receipt RPC to function correctly.

ALTER TABLE public.purchase_order_items 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Optional: Add a comment for better documentation
COMMENT ON COLUMN public.purchase_order_items.updated_at IS 'Timestamp of the last status update during inspection/certification.';
