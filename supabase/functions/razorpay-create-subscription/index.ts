import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RAZORPAY_KEY_ID     = Deno.env.get("RAZORPAY_KEY_ID")     ?? "";
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";
const RAZORPAY_AUTH       = "Basic " + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

// Razorpay charges 2% + 18% GST on that fee = 2.36% total.
// This entire cost is passed through to the customer as a surcharge.
const PLATFORM_FEE_RATE = 0.0236;

// 14-day free trial
const TRIAL_DAYS = 14;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── Auth: require valid Supabase JWT ─────────────────────
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) throw new Error("Unauthorized");

    // ── Parse body ───────────────────────────────────────────
    const { planId, billingPeriod } = await req.json() as {
      planId: string;
      billingPeriod: "monthly" | "yearly";
    };

    if (!planId || !billingPeriod) throw new Error("planId and billingPeriod are required");
    if (!["monthly", "yearly"].includes(billingPeriod)) throw new Error("billingPeriod must be monthly or yearly");

    // ── Look up tenant from profile ──────────────────────────
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("tenant_id, full_name, email")
      .eq("id", user.id)
      .single();
    if (profileError || !profile) throw new Error("Profile not found");

    const tenantId = profile.tenant_id;

    // ── Look up plan + Razorpay plan ID ──────────────────────
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("id, name, price_monthly, price_yearly, razorpay_plan_id_monthly, razorpay_plan_id_yearly")
      .eq("id", planId)
      .eq("is_active", true)
      .single();
    if (planError || !plan) throw new Error(`Plan '${planId}' not found`);

    const rzpPlanId = billingPeriod === "monthly"
      ? plan.razorpay_plan_id_monthly
      : plan.razorpay_plan_id_yearly;

    if (!rzpPlanId) {
      throw new Error(`Razorpay plan ID not configured for ${planId}/${billingPeriod}. Run scripts/razorpay_setup_plans.mjs first.`);
    }

    // ── Calculate amount with 2% surcharge ───────────────────
    const baseAmount = billingPeriod === "monthly"
      ? Number(plan.price_monthly)
      : Number(plan.price_yearly);
    const feeAmount   = Math.round(baseAmount * PLATFORM_FEE_RATE * 100) / 100;
    const totalAmount = Math.round((baseAmount + feeAmount) * 100); // paise

    // ── Create or find Razorpay Customer ─────────────────────
    const customerEmail = profile.email ?? user.email ?? "";
    const customerName  = profile.full_name ?? customerEmail;

    let rzpCustomerId: string;
    {
      // Search for existing customer by email
      const searchRes = await fetch(
        `https://api.razorpay.com/v1/customers?email=${encodeURIComponent(customerEmail)}`,
        { headers: { Authorization: RAZORPAY_AUTH } }
      );
      const searchBody = await searchRes.json();
      const existing = searchBody?.items?.[0];

      if (existing?.id) {
        rzpCustomerId = existing.id;
      } else {
        const createRes = await fetch("https://api.razorpay.com/v1/customers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: RAZORPAY_AUTH,
          },
          body: JSON.stringify({
            name: customerName,
            email: customerEmail,
            fail_existing: 0,
          }),
        });
        const createBody = await createRes.json();
        if (!createRes.ok) throw new Error(`Failed to create Razorpay customer: ${JSON.stringify(createBody)}`);
        rzpCustomerId = createBody.id;
      }
    }

    // ── Create Razorpay Subscription ─────────────────────────
    const trialStartAt = Math.floor(Date.now() / 1000);
    const trialEndAt   = trialStartAt + TRIAL_DAYS * 24 * 60 * 60;

    const subRes = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: RAZORPAY_AUTH,
      },
      body: JSON.stringify({
        plan_id:        rzpPlanId,
        customer_id:    rzpCustomerId,
        total_count:    0,          // infinite recurring
        quantity:       1,
        start_at:       trialEndAt, // first charge after trial
        addons: [
          {
            item: {
              name:     "Payment Processing Fee",
              amount:   Math.round(feeAmount * 100), // paise
              currency: "INR",
            },
          },
        ],
        notes: {
          tenant_id:      tenantId,
          plan_id:        planId,
          billing_period: billingPeriod,
        },
      }),
    });
    const subBody = await subRes.json();
    if (!subRes.ok) throw new Error(`Failed to create Razorpay subscription: ${JSON.stringify(subBody)}`);

    const rzpSubId  = subBody.id;
    const shortUrl  = subBody.short_url;
    const trialEnd  = new Date(trialEndAt * 1000).toISOString();

    // ── Insert into tenant_subscriptions ────────────────────
    const { error: insertError } = await supabase
      .from("tenant_subscriptions")
      .insert({
        tenant_id:                tenantId,
        plan_id:                  planId,
        billing_period:           billingPeriod,
        razorpay_subscription_id: rzpSubId,
        razorpay_customer_id:     rzpCustomerId,
        status:                   "created",
        trial_end:                trialEnd,
        last_charged_amount:      baseAmount + feeAmount,
      });
    if (insertError) throw new Error(`DB insert failed: ${insertError.message}`);

    return new Response(
      JSON.stringify({
        subscriptionId: rzpSubId,
        shortUrl,
        trialEnd,
        amountPaise:    totalAmount,
        baseAmountPaise: Math.round(baseAmount * 100),
        feePaise:       Math.round(feeAmount * 100),
        currency:       "INR",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[razorpay-create-subscription]", message);
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
