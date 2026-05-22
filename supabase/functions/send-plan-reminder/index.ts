/**
 * send-plan-reminder — Sends lifecycle email reminders to tenants at key checkpoints.
 *
 * Designed to be called by a pg_cron job (or manually via the Supabase dashboard):
 *   SELECT cron.schedule('plan-reminders', '0 9 * * *', $$ SELECT net.http_post(...) $$);
 *
 * Email transport: MSG91 transactional email.
 * Set MSG91_AUTH_KEY in Supabase Edge Function secrets.
 * Until configured, emails are logged only (no failure).
 *
 * Reminder schedule (no data deletion — data is kept forever):
 *   trial    -14d / -7d / -3d / -1d
 *   grace    day 0 / day 5
 *   restricted day 7 / day 11
 *   expired  day 14
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MSG91_AUTH_KEY = Deno.env.get("MSG91_AUTH_KEY");
const SUPPORT_EMAIL  = "support@finventree.com";
const FROM_EMAIL     = "noreply@finventree.com";
const FROM_NAME      = "Finventree";
const PRICING_URL    = "https://finventree.com/pricing";

// ─── Email delivery ───────────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, bodyHtml: string): Promise<void> {
  if (!MSG91_AUTH_KEY) {
    console.log(`[send-plan-reminder] MSG91 not configured — would send to ${to}: "${subject}"`);
    return;
  }
  const res = await fetch("https://api.msg91.com/api/v5/email/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "authkey": MSG91_AUTH_KEY,
    },
    body: JSON.stringify({
      recipients: [{ to: [{ email: to }] }],
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject,
      body_html: bodyHtml,
    }),
  });
  if (!res.ok) {
    console.error(`[send-plan-reminder] MSG91 error for ${to}:`, await res.text());
  } else {
    console.log(`[send-plan-reminder] ✓ sent to ${to}: "${subject}"`);
  }
}

// ─── Templates ────────────────────────────────────────────────────────────────

function wrap(content: string): string {
  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1e293b;">
    <img src="https://app.finventree.com/logo.svg" alt="Finventree" style="height:36px;margin-bottom:24px;">
    ${content}
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0;">
    <p style="color:#94a3b8;font-size:12px;">Finventree · <a href="mailto:${SUPPORT_EMAIL}" style="color:#94a3b8;">${SUPPORT_EMAIL}</a></p>
  </body></html>`;
}

function ctaBtn(url: string, label: string, color = "#2563eb"): string {
  return `<a href="${url}" style="display:inline-block;background:${color};color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">${label}</a>`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysFromNow(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Fetch all tenants that might need a reminder, joined with their admin email
    const { data: tenants, error } = await supabase
      .from("tenants")
      .select("id, name, plan, plan_expires_at, plan_halted_at, payment_failed_at, last_reminder_sent_at, profiles!inner(email, role)")
      .eq("is_active", true)
      .in("plan", ["trial", "grace", "restricted", "expired"]);

    if (error) throw error;

    let sent = 0;

    for (const tenant of tenants ?? []) {
      // deno-lint-ignore no-explicit-any
      const adminEmail = (tenant as any).profiles?.find((p: any) => p.role === "admin")?.email;
      if (!adminEmail) continue;

      const lastSent  = tenant.last_reminder_sent_at ? new Date(tenant.last_reminder_sent_at).getTime() : 0;
      const hoursSince = (Date.now() - lastSent) / 3600000;

      let subject  = "";
      let bodyHtml = "";
      let doSend   = false;

      // ── Trial reminders ─────────────────────────────────────────────────────
      if (tenant.plan === "trial" && tenant.plan_expires_at && hoursSince > 48) {
        const daysLeft = daysFromNow(tenant.plan_expires_at);
        if (daysLeft === 14) {
          subject  = "Your Finventree trial ends in 14 days";
          bodyHtml = wrap(`
            <h2 style="color:#0f172a;">Your free trial ends in <strong>14 days</strong></h2>
            <p>Your 6-month trial expires on <strong>${fmtDate(tenant.plan_expires_at)}</strong>.</p>
            <p>Choose a plan before your trial ends to keep adding inventory and processing sales.</p>
            ${ctaBtn(PRICING_URL, "View Plans")}
          `);
          doSend = true;
        } else if (daysLeft === 7) {
          subject  = "7 days left on your Finventree trial";
          bodyHtml = wrap(`
            <h2 style="color:#0f172a;"><strong>7 days</strong> remaining on your trial</h2>
            <p>Your trial expires on <strong>${fmtDate(tenant.plan_expires_at)}</strong>.</p>
            <p>After expiry your account will be fully suspended. Your data is never deleted — subscribe to restore access.</p>
            ${ctaBtn(PRICING_URL, "Choose a Plan")}
          `);
          doSend = true;
        } else if (daysLeft === 3) {
          subject  = "3 days left — your Finventree trial ends soon";
          bodyHtml = wrap(`
            <h2 style="color:#dc2626;">Only <strong>3 days</strong> left</h2>
            <p>Your Finventree trial expires on <strong>${fmtDate(tenant.plan_expires_at)}</strong>.</p>
            ${ctaBtn(PRICING_URL, "Subscribe Now", "#dc2626")}
          `);
          doSend = true;
        } else if (daysLeft === 1) {
          subject  = "Tomorrow is the last day of your Finventree trial";
          bodyHtml = wrap(`
            <h2 style="color:#dc2626;">Your trial ends <strong>tomorrow</strong></h2>
            <p>This is your final reminder. After expiry, your account will be suspended — but your data will always be here when you're ready to come back.</p>
            ${ctaBtn(PRICING_URL, "Subscribe Now", "#dc2626")}
          `);
          doSend = true;
        }
      }

      // ── Grace period reminders ───────────────────────────────────────────────
      else if (tenant.plan === "grace" && tenant.plan_halted_at) {
        const days = daysSince(tenant.plan_halted_at);
        if (days === 0 && hoursSince > 2) {
          subject  = "Action required: Finventree subscription payment failed";
          bodyHtml = wrap(`
            <h2 style="color:#dc2626;">Payment failed — act within 7 days</h2>
            <p>We couldn't process your Finventree subscription payment.</p>
            <p>You have <strong>7 days of full access</strong> remaining. After that, your account switches to read-only mode.</p>
            ${ctaBtn(PRICING_URL, "Renew Subscription", "#dc2626")}
          `);
          doSend = true;
        } else if (days === 5 && hoursSince > 20) {
          subject  = "2 days until your Finventree account becomes read-only";
          bodyHtml = wrap(`
            <h2 style="color:#dc2626;">2 days left before read-only mode</h2>
            <p>Your subscription payment is still outstanding. In 2 days, you'll be able to view your data but not make any changes.</p>
            ${ctaBtn(PRICING_URL, "Renew Now", "#dc2626")}
          `);
          doSend = true;
        }
      }

      // ── Restricted mode reminders ────────────────────────────────────────────
      else if (tenant.plan === "restricted" && tenant.plan_halted_at) {
        const days = daysSince(tenant.plan_halted_at);
        if (days === 7 && hoursSince > 20) {
          subject  = "Your Finventree account is now in read-only mode";
          bodyHtml = wrap(`
            <h2 style="color:#dc2626;">Account is now read-only</h2>
            <p>Your subscription payment is still overdue. You can view all your data but cannot add or edit anything.</p>
            <p>You have <strong>7 more days</strong> before the account is fully suspended. Your data is always kept safe.</p>
            ${ctaBtn(PRICING_URL, "Renew Subscription", "#dc2626")}
          `);
          doSend = true;
        } else if (days === 11 && hoursSince > 20) {
          subject  = "Final warning: Finventree account suspends in 3 days";
          bodyHtml = wrap(`
            <h2 style="color:#dc2626;">Account suspending in 3 days</h2>
            <p>Your Finventree account will be fully suspended in <strong>3 days</strong>.</p>
            <p>Your data is permanently safe and will never be deleted — but you'll need to renew to access it.</p>
            ${ctaBtn(PRICING_URL, "Renew Now", "#dc2626")}
            <p style="color:#64748b;font-size:14px;margin-top:16px;">Questions? <a href="mailto:${SUPPORT_EMAIL}" style="color:#2563eb;">${SUPPORT_EMAIL}</a></p>
          `);
          doSend = true;
        }
      }

      // ── Suspended reminders ──────────────────────────────────────────────────
      else if (tenant.plan === "expired" && tenant.plan_halted_at) {
        const days = daysSince(tenant.plan_halted_at);
        if (days === 14 && hoursSince > 20) {
          subject  = "Your Finventree account has been suspended";
          bodyHtml = wrap(`
            <h2 style="color:#dc2626;">Account suspended</h2>
            <p>Your Finventree account has been suspended due to an outstanding payment.</p>
            <p><strong>Your data is completely safe</strong> and will never be deleted. Renew your subscription anytime to restore full access immediately.</p>
            ${ctaBtn(PRICING_URL, "Reactivate Account", "#2563eb")}
            <p style="color:#64748b;font-size:14px;margin-top:16px;">Need help? <a href="mailto:${SUPPORT_EMAIL}" style="color:#2563eb;">${SUPPORT_EMAIL}</a></p>
          `);
          doSend = true;
        }
      }

      if (doSend && subject && bodyHtml) {
        await sendEmail(adminEmail, subject, bodyHtml);
        await supabase
          .from("tenants")
          .update({ last_reminder_sent_at: new Date().toISOString() })
          .eq("id", tenant.id);
        sent++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[send-plan-reminder] Error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
