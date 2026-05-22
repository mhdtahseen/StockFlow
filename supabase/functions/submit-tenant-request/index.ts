import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { org_name, full_name, email, phone, device_fingerprint, user_agent: clientUA } = body;

    if (!org_name || !full_name || !email) {
      return new Response(
        JSON.stringify({ error: "org_name, full_name and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Capture IP from edge proxy headers (Cloudflare → x-forwarded-for → x-real-ip)
    const request_ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;

    const user_agent = clientUA || req.headers.get("user-agent") || null;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data, error } = await supabase
      .from("tenant_requests")
      .insert({
        org_name: org_name.trim(),
        full_name: full_name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim() || null,
        device_fingerprint: device_fingerprint || null,
        request_ip: request_ip,
        user_agent: user_agent,
        status: "pending",
      })
      .select("id, status")
      .single();

    if (error) {
      // Unique constraint on email — duplicate submission
      if (error.code === "23505") {
        return new Response(
          JSON.stringify({
            error:
              "A request with this email address already exists. Check your inbox for an invite, or contact support@finventree.com.",
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw error;
    }

    console.log(
      `[submit-tenant-request] New request ${data.id} from ${email} | ip=${request_ip} | fp=${device_fingerprint?.slice(0, 8)}...`
    );

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[submit-tenant-request] Error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
