#!/usr/bin/env node
/**
 * Sync subscription_plans with canonical gate-key arrays.
 * Uses the Supabase Management API — requires only SUPABASE_ACCESS_TOKEN.
 *
 * Run once:
 *   node scripts/sync_plan_gate_keys.mjs
 *
 * The token is read from SUPABASE_ACCESS_TOKEN in the environment.
 * It is already present in apps/app/.env.local — load it first:
 *   export $(grep SUPABASE_ACCESS_TOKEN apps/app/.env.local | xargs)
 *   node scripts/sync_plan_gate_keys.mjs
 */

const PROJECT_REF = "lietpzxydupsxmlncrpi";
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error(
    "❌  SUPABASE_ACCESS_TOKEN env var is not set.\n" +
    "    Load it from your .env.local:\n" +
    "    export $(grep SUPABASE_ACCESS_TOKEN apps/app/.env.local | xargs)\n" +
    "    node scripts/sync_plan_gate_keys.mjs"
  );
  process.exit(1);
}

async function runSQL(sql) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ query: sql }),
    }
  );
  const body = await res.json();
  if (!res.ok) throw new Error(body.message ?? JSON.stringify(body));
  return body;
}

const SQL = `
-- Rename Pro Business → Pro
UPDATE public.subscription_plans
SET   name = 'Pro', updated_at = now()
WHERE id = 'pro';

-- Starter: 4 keys
UPDATE public.subscription_plans
SET   features = '["trade_orders","purchase_orders","customers","pdf_invoice"]'::jsonb,
      updated_at = now()
WHERE id = 'starter';

-- Pro: 14 keys
UPDATE public.subscription_plans
SET   features = '["trade_orders","purchase_orders","customers","pdf_invoice","public_sharing","imei_scanner","catalog_autofill","full_ledger","analytics","credit_tracking","receivables","customer_pnl","unlimited_phones","bulk_orders"]'::jsonb,
      updated_at = now()
WHERE id = 'pro';

-- Enterprise: 17 keys
UPDATE public.subscription_plans
SET   features = '["trade_orders","purchase_orders","customers","pdf_invoice","public_sharing","imei_scanner","catalog_autofill","full_ledger","analytics","credit_tracking","receivables","customer_pnl","unlimited_phones","bulk_orders","bulk_invoice","trade_network","unlimited_seats"]'::jsonb,
      updated_at = now()
WHERE id = 'enterprise';
`;

async function run() {
  console.log("Running SQL via Supabase Management API…");
  try {
    await runSQL(SQL);
    console.log("✅  All three plans updated (name + features)");
  } catch (err) {
    console.error("❌  Query failed:", err.message);
    process.exit(1);
  }
}

run();

