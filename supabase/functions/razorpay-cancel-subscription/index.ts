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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── Auth ─────────────────────────────────────────────────
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

    // ── Resolve tenant ───────────────────────────────────────
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();
    if (profileError || !profile) throw new Error("Profile not found");

    // ── Find active subscription ─────────────────────────────
    const { data: ts, error: tsError } = await supabase
      .from("tenant_subscriptions")
      .select("id, razorpay_subscription_id, status, current_end, plan_id")
      .eq("tenant_id", profile.tenant_id)
      .in("status", ["active", "authenticated", "created", "pending"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (tsError || !ts) throw new Error("No active subscription found");
    if (ts.status === "cancelled") throw new Error("Subscription is already cancelled");

    // ── Cancel at cycle end via Razorpay API ─────────────────
    const cancelRes = await fetch(
      `https://api.razorpay.com/v1/subscriptions/${ts.razorpay_subscription_id}/cancel`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: RAZORPAY_AUTH,
        },
        body: JSON.stringify({
          cancel_at_cycle_end: 1, // 1 = keep active until billing period ends
        }),
      }
    );
    const cancelBody = await cancelRes.json();
    if (!cancelRes.ok) throw new Error(`Razorpay cancel failed: ${JSON.stringify(cancelBody)}`);

    // ── Update local DB ──────────────────────────────────────
    await supabase
      .from("tenant_subscriptions")
      .update({
        status:              "cancelled",
        cancel_at_cycle_end: true,
        updated_at:          new Date().toISOString(),
      })
      .eq("id", ts.id);

    // Tenant plan stays as-is until cycle end — the webhook (subscription.completed)
    // or the expire_trial_plans cron will flip it to 'expired' when plan_expires_at passes.

    return new Response(
      JSON.stringify({
        cancelled: true,
        activeUntil: ts.current_end,
        message: `Your ${ts.plan_id} plan stays active until ${new Date(ts.current_end).toLocaleDateString("en-IN")}. No future charges will be made.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[razorpay-cancel-subscription]", message);
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
