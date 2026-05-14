import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── Auth: require valid app session JWT ──────────────────
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

    // ── Generate a magic link token for this user ────────────
    // This creates a single-use, short-lived OTP token tied to the user's email.
    // The web pricing page will exchange it via supabase.auth.verifyOtp().
    const { data: linkData, error: linkError } =
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: user.email!,
        options: {
          // After session is established, stay on the pricing page
          redirectTo: "https://finventree.com/pricing",
        },
      });

    if (linkError || !linkData) {
      throw new Error(`Failed to generate handoff token: ${linkError?.message}`);
    }

    // Extract the token_hash and type from the generated link
    // The URL looks like: ...?token_hash=xxx&type=magiclink
    const url       = new URL(linkData.properties.action_link);
    const tokenHash = url.searchParams.get("token_hash");
    const type      = url.searchParams.get("type") ?? "magiclink";

    if (!tokenHash) throw new Error("No token_hash in generated link");

    return new Response(
      JSON.stringify({ token_hash: tokenHash, type }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[auth-handoff]", message);
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
