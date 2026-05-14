-- Migration: sync subscription_plans.features with canonical gate keys
-- Replaces marketing-text feature lists with the structured gate-key arrays
-- that the admin pricing page and frontend FEATURE_GATES both reference.
-- After this migration the pricing page will show no "Out of Sync" badges.

-- ── Rename "Pro Business" → "Pro" ────────────────────────────────────────
UPDATE public.subscription_plans
SET   name = 'Pro', updated_at = now()
WHERE id = 'pro';

-- ── Starter: 4 keys ───────────────────────────────────────────────────────
UPDATE public.subscription_plans
SET
  features   = '["trade_orders","purchase_orders","customers","pdf_invoice"]'::jsonb,
  updated_at = now()
WHERE id = 'starter';

-- ── Pro: 14 keys (all Starter keys + 10 Pro-tier keys) ───────────────────
UPDATE public.subscription_plans
SET
  features   = '[
    "trade_orders",
    "purchase_orders",
    "customers",
    "pdf_invoice",
    "public_sharing",
    "imei_scanner",
    "catalog_autofill",
    "full_ledger",
    "analytics",
    "credit_tracking",
    "receivables",
    "customer_pnl",
    "unlimited_phones",
    "bulk_orders"
  ]'::jsonb,
  updated_at = now()
WHERE id = 'pro';

-- ── Enterprise: all 17 keys ───────────────────────────────────────────────
UPDATE public.subscription_plans
SET
  features   = '[
    "trade_orders",
    "purchase_orders",
    "customers",
    "pdf_invoice",
    "public_sharing",
    "imei_scanner",
    "catalog_autofill",
    "full_ledger",
    "analytics",
    "credit_tracking",
    "receivables",
    "customer_pnl",
    "unlimited_phones",
    "bulk_orders",
    "bulk_invoice",
    "trade_network",
    "unlimited_seats"
  ]'::jsonb,
  updated_at = now()
WHERE id = 'enterprise';
