#!/usr/bin/env node
/**
 * One-time Razorpay plan setup script.
 *
 * Creates 6 Razorpay Plans (3 tiers × monthly/yearly), then writes the
 * resulting Razorpay plan_id values back to subscription_plans in the DB.
 *
 * Usage:
 *   export RAZORPAY_KEY_ID=rzp_test_xxxxx
 *   export RAZORPAY_KEY_SECRET=your_secret
 *   export $(grep SUPABASE_ACCESS_TOKEN apps/app/.env.local | xargs)
 *   node scripts/razorpay_setup_plans.mjs
 *
 * Safe to re-run — if a Razorpay plan already has the same amount/interval,
 * the script still writes whatever plan_id the API returns.
 */

const KEY_ID     = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF  = "lietpzxydupsxmlncrpi";

if (!KEY_ID || !KEY_SECRET) {
  console.error(
    "❌  RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set.\n" +
    "    export RAZORPAY_KEY_ID=rzp_test_xxxx\n" +
    "    export RAZORPAY_KEY_SECRET=your_secret"
  );
  process.exit(1);
}

if (!ACCESS_TOKEN) {
  console.error(
    "❌  SUPABASE_ACCESS_TOKEN not set.\n" +
    "    export $(grep SUPABASE_ACCESS_TOKEN apps/app/.env.local | xargs)"
  );
  process.exit(1);
}

// Razorpay amounts are in paise (INR × 100)
const PLANS = [
  { planId: "starter", period: "monthly", amount: 29900,   interval: 1, name: "StockFlow Starter Monthly"  },
  { planId: "starter", period: "yearly",  amount: 299000,  interval: 1, name: "StockFlow Starter Yearly"   },
  { planId: "pro",     period: "monthly", amount: 79900,   interval: 1, name: "StockFlow Pro Monthly"       },
  { planId: "pro",     period: "yearly",  amount: 799000,  interval: 1, name: "StockFlow Pro Yearly"        },
  { planId: "enterprise", period: "monthly", amount: 109900, interval: 1, name: "StockFlow Enterprise Monthly" },
  { planId: "enterprise", period: "yearly",  amount: 1099000, interval: 1, name: "StockFlow Enterprise Yearly" },
];

const auth = "Basic " + Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64");

async function createRazorpayPlan({ name, amount, period, interval }) {
  const res = await fetch("https://api.razorpay.com/v1/plans", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
    },
    body: JSON.stringify({
      period,      // "monthly" or "yearly"
      interval,    // 1 = every 1 period
      item: {
        name,
        amount,
        currency: "INR",
        description: name,
      },
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Razorpay error: ${JSON.stringify(body)}`);
  return body.id; // e.g. "plan_XXXXXXXXXXXX"
}

async function updateSupabasePlanId(planId, period, razorpayPlanId) {
  const column =
    period === "monthly" ? "razorpay_plan_id_monthly" : "razorpay_plan_id_yearly";
  const sql = `
    UPDATE public.subscription_plans
    SET ${column} = '${razorpayPlanId}', updated_at = now()
    WHERE id = '${planId}';
  `;
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
  if (!res.ok) throw new Error(`Supabase error: ${body.message ?? JSON.stringify(body)}`);
}

async function run() {
  console.log("Creating Razorpay plans and syncing IDs to Supabase…\n");

  for (const plan of PLANS) {
    try {
      const rzpId = await createRazorpayPlan(plan);
      await updateSupabasePlanId(plan.planId, plan.period, rzpId);
      console.log(`✅  ${plan.planId} (${plan.period}) → ${rzpId}`);
    } catch (err) {
      console.error(`❌  ${plan.planId} (${plan.period}):`, err.message);
    }
  }

  console.log("\nDone. Check your Razorpay Dashboard > Subscriptions > Plans to verify.");
}

run();
