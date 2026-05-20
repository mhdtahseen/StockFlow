-- Migration: Add optional GST fields to billing tables
-- All columns are nullable — existing rows are unaffected.

-- ── sale_orders ──────────────────────────────────────────────────────────────
ALTER TABLE sale_orders
  ADD COLUMN IF NOT EXISTS gst_enabled      BOOLEAN        DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS gst_type         TEXT           CHECK (gst_type IN ('CGST_SGST', 'IGST')),
  ADD COLUMN IF NOT EXISTS gst_rate         NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS subtotal         NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS cgst_amount      NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS sgst_amount      NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS igst_amount      NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS buyer_gstin      TEXT;

-- ── sale_order_items ─────────────────────────────────────────────────────────
ALTER TABLE sale_order_items
  ADD COLUMN IF NOT EXISTS hsn_code         TEXT,
  ADD COLUMN IF NOT EXISTS gst_rate         NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS taxable_value    NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS cgst_amount      NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS sgst_amount      NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS igst_amount      NUMERIC(12,2);

-- ── purchase_orders ──────────────────────────────────────────────────────────
ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS gst_enabled      BOOLEAN        DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS gst_type         TEXT           CHECK (gst_type IN ('CGST_SGST', 'IGST')),
  ADD COLUMN IF NOT EXISTS gst_rate         NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS subtotal         NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS cgst_amount      NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS sgst_amount      NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS igst_amount      NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS seller_gstin     TEXT;

-- ── purchase_order_items ─────────────────────────────────────────────────────
ALTER TABLE purchase_order_items
  ADD COLUMN IF NOT EXISTS hsn_code         TEXT,
  ADD COLUMN IF NOT EXISTS gst_rate         NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS taxable_value    NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS cgst_amount      NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS sgst_amount      NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS igst_amount      NUMERIC(12,2);

-- ── counterparties ───────────────────────────────────────────────────────────
ALTER TABLE counterparties
  ADD COLUMN IF NOT EXISTS gstin            TEXT,
  ADD COLUMN IF NOT EXISTS state            TEXT;
