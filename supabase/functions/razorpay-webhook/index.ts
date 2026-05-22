import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

// Razorpay webhook events we care about
type RazorpayEvent =
  | "subscription.authenticated"
  | "subscription.activated"
  | "subscription.charged"
  | "subscription.pending"
  | "subscription.halted"
  | "subscription.cancelled"
  | "subscription.completed"
  | "subscription.updated"
  | "payment.captured"
  | "payment.failed";

const WEBHOOK_SECRET = Deno.env.get("RAZORPAY_WEBHOOK_SECRET") ?? "";

// Verify Razorpay webhook signature
async function verifySignature(body: string, signature: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const expected = Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return expected === signature;
}

serve(async (req) => {
  // Razorpay sends POST only
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  // Verify signature if webhook secret is configured
  if (WEBHOOK_SECRET) {
    const valid = await verifySignature(rawBody, signature);
    if (!valid) {
      console.error("[razorpay-webhook] Invalid signature");
      return new Response("Unauthorized", { status: 401 });
    }
  }

  let payload: { event: RazorpayEvent; payload: Record<string, unknown> };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const { event } = payload;
  console.log(`[razorpay-webhook] Received: ${event}`);

  try {
    switch (event) {
      case "subscription.authenticated": {
        await handleAuthenticated(supabase, payload.payload);
        break;
      }
      case "subscription.activated": {
        await handleActivated(supabase, payload.payload);
        break;
      }
      case "subscription.charged": {
        await handleCharged(supabase, payload.payload);
        break;
      }
      case "subscription.pending": {
        await handleStatusUpdate(supabase, payload.payload, "pending");
        break;
      }
      case "subscription.halted": {
        await handleHalted(supabase, payload.payload);
        break;
      }
      case "payment.failed": {
        await handlePaymentFailed(supabase, payload.payload);
        break;
      }
      case "subscription.cancelled": {
        await handleCancelled(supabase, payload.payload);
        break;
      }
      case "subscription.completed": {
        await handleCompleted(supabase, payload.payload);
        break;
      }
      default:
        console.log(`[razorpay-webhook] Unhandled event: ${event}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[razorpay-webhook] Handler error for ${event}:`, msg);
    // Return 200 anyway so Razorpay doesn't keep retrying for non-critical errors
    return new Response(JSON.stringify({ received: true, error: msg }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

// ── Helpers ──────────────────────────────────────────────────────────────────

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

function getSubscription(webhookPayload: Record<string, unknown>) {
  // deno-lint-ignore no-explicit-any
  const sub = (webhookPayload as any)?.subscription?.entity;
  if (!sub?.id) throw new Error("No subscription entity in webhook payload");
  return sub;
}

function getPayment(webhookPayload: Record<string, unknown>) {
  // deno-lint-ignore no-explicit-any
  const payment = (webhookPayload as any)?.payment?.entity;
  return payment ?? null;
}

async function getTenantSubscription(supabase: SupabaseClient, rzpSubId: string) {
  const { data, error } = await supabase
    .from("tenant_subscriptions")
    .select("id, tenant_id, plan_id, status, trial_end")
    .eq("razorpay_subscription_id", rzpSubId)
    .single();
  if (error || !data) throw new Error(`tenant_subscription not found for ${rzpSubId}`);
  return data;
}

async function setTenantPlan(
  supabase: SupabaseClient,
  tenantId: string,
  plan: string,
  planExpiresAt: string | null
) {
  const { error } = await supabase
    .from("tenants")
    .update({ plan, plan_expires_at: planExpiresAt, updated_at: new Date().toISOString() })
    .eq("id", tenantId);
  if (error) throw new Error(`setTenantPlan failed: ${error.message}`);
}

async function handleAuthenticated(supabase: SupabaseClient, webhookPayload: Record<string, unknown>) {
  const sub = getSubscription(webhookPayload);
  const { id: tsId } = await getTenantSubscription(supabase, sub.id);

  await supabase
    .from("tenant_subscriptions")
    .update({ status: "authenticated", updated_at: new Date().toISOString() })
    .eq("id", tsId);

  console.log(`[webhook] subscription.authenticated: ${sub.id}`);
}

async function handleActivated(supabase: SupabaseClient, webhookPayload: Record<string, unknown>) {
  const sub = getSubscription(webhookPayload);
  const ts  = await getTenantSubscription(supabase, sub.id);

  const currentEnd = sub.current_end
    ? new Date(sub.current_end * 1000).toISOString()
    : null;
  const currentStart = sub.current_start
    ? new Date(sub.current_start * 1000).toISOString()
    : null;

  await supabase
    .from("tenant_subscriptions")
    .update({
      status:        "active",
      current_start: currentStart,
      current_end:   currentEnd,
      updated_at:    new Date().toISOString(),
    })
    .eq("id", ts.id);

  // Activate tenant plan immediately
  await setTenantPlan(supabase, ts.tenant_id, ts.plan_id, currentEnd);
  console.log(`[webhook] subscription.activated: tenant ${ts.tenant_id} → ${ts.plan_id}`);
}

async function handleCharged(supabase: SupabaseClient, webhookPayload: Record<string, unknown>) {
  const sub     = getSubscription(webhookPayload);
  const payment = getPayment(webhookPayload);
  const ts      = await getTenantSubscription(supabase, sub.id);

  const currentEnd = sub.current_end
    ? new Date(sub.current_end * 1000).toISOString()
    : null;
  const currentStart = sub.current_start
    ? new Date(sub.current_start * 1000).toISOString()
    : null;

  // Update subscription dates
  await supabase
    .from("tenant_subscriptions")
    .update({
      status:               "active",
      current_start:        currentStart,
      current_end:          currentEnd,
      last_charged_amount:  payment ? (payment.amount / 100) : null,
      updated_at:           new Date().toISOString(),
    })
    .eq("id", ts.id);

  // Record payment (idempotent — UNIQUE constraint on razorpay_payment_id)
  if (payment?.id) {
    const { error: paymentError } = await supabase
      .from("subscription_payments")
      .upsert({
        tenant_subscription_id: ts.id,
        razorpay_payment_id:    payment.id,
        razorpay_invoice_id:    payment.invoice_id ?? null,
        amount:                 payment.amount / 100,
        razorpay_fee:           payment.fee ? payment.fee / 100 : null,
        razorpay_tax:           payment.tax ? payment.tax / 100 : null,
        currency:               payment.currency ?? "INR",
        status:                 payment.status === "captured" ? "captured" : "failed",
        method:                 payment.method ?? null,
        paid_at:                payment.created_at
                                  ? new Date(payment.created_at * 1000).toISOString()
                                  : new Date().toISOString(),
      }, { onConflict: "razorpay_payment_id", ignoreDuplicates: true });

    if (paymentError) {
      // Log but don't throw — the subscription status update already went through
      console.error("[webhook] subscription_payments insert error:", paymentError.message);
    }
  }

  // Ensure tenant plan is active and expiry extended
  await setTenantPlan(supabase, ts.tenant_id, ts.plan_id, currentEnd);

  // Clear any payment failure / grace flags — subscription is healthy again
  await supabase
    .from("tenants")
    .update({
      payment_failed_at: null,
      plan_halted_at:    null,
      updated_at:        new Date().toISOString(),
    })
    .eq("id", ts.tenant_id);

  console.log(`[webhook] subscription.charged: tenant ${ts.tenant_id} → plan extended to ${currentEnd}, flags cleared`);
}

async function handleStatusUpdate(
  supabase: SupabaseClient,
  webhookPayload: Record<string, unknown>,
  status: string
) {
  const sub = getSubscription(webhookPayload);
  const { id: tsId } = await getTenantSubscription(supabase, sub.id);
  await supabase
    .from("tenant_subscriptions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", tsId);
  console.log(`[webhook] subscription status → ${status}: ${sub.id}`);
}

async function handleHalted(supabase: SupabaseClient, webhookPayload: Record<string, unknown>) {
  const sub = getSubscription(webhookPayload);
  const ts  = await getTenantSubscription(supabase, sub.id);

  await supabase
    .from("tenant_subscriptions")
    .update({ status: "halted", updated_at: new Date().toISOString() })
    .eq("id", ts.id);

  // Start grace period instead of immediately suspending:
  //   grace (7 days full access) → restricted (7 days read-only) → expired (paywall)
  //   Cron job run_plan_state_machine() handles the transitions.
  const { error } = await supabase
    .from("tenants")
    .update({
      plan:           "grace",
      plan_halted_at: new Date().toISOString(),
      updated_at:     new Date().toISOString(),
    })
    .eq("id", ts.tenant_id);
  if (error) throw new Error(`handleHalted tenant update failed: ${error.message}`);

  console.log(`[webhook] subscription.halted: tenant ${ts.tenant_id} → grace period started`);
}

async function handlePaymentFailed(supabase: SupabaseClient, webhookPayload: Record<string, unknown>) {
  // payment.failed fires for every retry attempt (up to 3).
  // We only set payment_failed_at on the first failure — idempotent via IS NULL check.
  const payment = getPayment(webhookPayload);
  if (!payment?.subscription_id) {
    console.log("[webhook] payment.failed: no subscription_id, skipping");
    return;
  }

  const ts = await getTenantSubscription(supabase, payment.subscription_id);

  // Only record the first failure
  const { data: tenant } = await supabase
    .from("tenants")
    .select("payment_failed_at")
    .eq("id", ts.tenant_id)
    .single();

  if (tenant?.payment_failed_at) {
    console.log(`[webhook] payment.failed: tenant ${ts.tenant_id} already flagged, skipping`);
    return;
  }

  await supabase
    .from("tenants")
    .update({
      payment_failed_at: new Date().toISOString(),
      updated_at:        new Date().toISOString(),
    })
    .eq("id", ts.tenant_id);

  console.log(`[webhook] payment.failed: tenant ${ts.tenant_id} → payment_failed_at set`);
  // TODO: trigger send-plan-reminder for immediate "payment failed" email
}

async function handleCancelled(supabase: SupabaseClient, webhookPayload: Record<string, unknown>) {
  const sub = getSubscription(webhookPayload);
  const ts  = await getTenantSubscription(supabase, sub.id);

  // current_end tells us until when the plan stays valid
  const currentEnd = sub.current_end
    ? new Date(sub.current_end * 1000).toISOString()
    : null;

  await supabase
    .from("tenant_subscriptions")
    .update({
      status:              "cancelled",
      cancel_at_cycle_end: true,
      current_end:         currentEnd,
      updated_at:          new Date().toISOString(),
    })
    .eq("id", ts.id);

  // Keep plan active until the period they paid for ends
  // The expire_trial_plans cron (already in DB) will flip it to 'expired'
  // when plan_expires_at passes.
  await setTenantPlan(supabase, ts.tenant_id, ts.plan_id, currentEnd);
  console.log(`[webhook] subscription.cancelled: tenant ${ts.tenant_id} → plan until ${currentEnd}`);
}

async function handleCompleted(supabase: SupabaseClient, webhookPayload: Record<string, unknown>) {
  // Treat like cancelled — subscription ran its full term
  await handleCancelled(supabase, webhookPayload);
}
