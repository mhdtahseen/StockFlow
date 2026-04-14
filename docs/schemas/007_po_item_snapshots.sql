-- ==============================================================================
-- StockFlow: PO Item Snapshots
-- Version 1.0
-- ==============================================================================

-- Add snapshot columns to purchase_order_items to persist details even after rejections
ALTER TABLE public.purchase_order_items 
ADD COLUMN IF NOT EXISTS brand_snapshot TEXT,
ADD COLUMN IF NOT EXISTS model_snapshot TEXT,
ADD COLUMN IF NOT EXISTS storage_snapshot TEXT,
ADD COLUMN IF NOT EXISTS color_snapshot TEXT,
ADD COLUMN IF NOT EXISTS ram_snapshot TEXT;

-- Update existing items if possible (optional, but good practice)
-- Since we didn't have these before, existing items will have NULL snapshots.
-- They will fallback to "Unknown" in the UI until new orders are created.
