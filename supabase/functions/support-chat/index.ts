import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const SYSTEM_PROMPT = `You are a support assistant for Finventree (also called StockFlow), a mobile phone inventory management app used by small mobile shops in India.

The app helps shop owners:
- Track phone inventory with IMEI, brand, model, purchase price, and status (In Stock / Pending / Sold)
- Create Purchase Orders (buying from suppliers) and Sales Orders (selling to customers)
- Manage customers and suppliers with full ledger balances
- View analytics, profit margins, and financial reports
- Works as a PWA on mobile and has a native Android/iOS app via Capacitor

Key UI elements:
- Dashboard: net cash flow, purchases, sales, avg profit, stock count
- + button (large blue circle, bottom center): quickly add a phone from anywhere
- ☰ hamburger icon (top left): opens full navigation drawer
- Bottom navigation: Dashboard (left) | + FAB (center) | Inventory (right)
- Navigation drawer sections: Operations (Inventory, Purchase Orders, Sales Orders), Finance & CRM (Ledger, Analytics, Customers), Account (Profile, Team, Settings)

Rules:
- Answer in 2-4 sentences maximum. Be concise and practical.
- Use simple language — users may not be tech-savvy.
- Use **bold** for UI element names (e.g. **+ button**, **Menu**, **Inventory**).
- If the question is about billing or plans, direct to Menu → Upgrade Plan.
- If you genuinely don't know, respond: "I'm not sure about that. Please email support@finventree.com and we'll help you within 24 hours."
- Never invent features that don't exist.
- Do not respond to questions unrelated to the app.`;

// Extract meaningful keywords from a question string
function extractKeywords(text: string): string[] {
  const stopwords = new Set([
    "a","an","the","is","it","in","on","at","to","for","of","and","or","but",
    "how","what","why","when","where","do","does","can","i","my","me","we",
    "you","your","this","that","with","from","be","was","are","have","has",
    "not","no","so","if","up","out","get","go","by","as","its","into",
  ]);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopwords.has(w));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const { question } = await req.json();
    if (!question || typeof question !== "string" || question.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: "Question is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const q = question.trim().slice(0, 400); // cap input length
    const keywords = extractKeywords(q);

    // ── 1. Check response cache ─────────────────────────────────────────────
    if (keywords.length > 0) {
      const { data: cached } = await supabase
        .from("support_responses")
        .select("id, answer")
        .overlaps("keywords", keywords)
        .order("hit_count", { ascending: false })
        .limit(1)
        .single();

      if (cached?.answer) {
        // Increment hit counter (fire-and-forget)
        supabase
          .from("support_responses")
          .update({ hit_count: supabase.rpc("increment", { row_id: cached.id }) })
          .eq("id", cached.id)
          .then(() => {});

        return new Response(
          JSON.stringify({ answer: cached.answer, source: "cache" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // ── 2. Rate limit check ─────────────────────────────────────────────────
    const now = new Date();
    const { data: limiter } = await supabase
      .from("rate_limiter")
      .select("count, window_start")
      .eq("key", "gemini")
      .single();

    if (limiter) {
      const windowAge = (now.getTime() - new Date(limiter.window_start).getTime()) / 1000;
      if (windowAge < 60 && limiter.count >= 12) {
        // Over limit — return fallback
        return new Response(
          JSON.stringify({
            answer: null,
            fallback: true,
            message: "Our AI assistant is busy right now. Please check the FAQ below or email support@finventree.com.",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Reset window or increment
      if (windowAge >= 60) {
        await supabase
          .from("rate_limiter")
          .update({ count: 1, window_start: now.toISOString() })
          .eq("key", "gemini");
      } else {
        await supabase
          .from("rate_limiter")
          .update({ count: limiter.count + 1 })
          .eq("key", "gemini");
      }
    }

    // ── 3. Call Gemini ──────────────────────────────────────────────────────
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: q }] }],
        generationConfig: { maxOutputTokens: 200, temperature: 0.3 },
      }),
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      console.error("Gemini error:", err);
      throw new Error("Gemini API error");
    }

    const geminiData = await geminiRes.json();
    const answer =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ??
      "I'm not sure about that. Please email support@finventree.com and we'll help you within 24 hours.";

    // ── 4. Cache the answer ─────────────────────────────────────────────────
    if (keywords.length > 0) {
      await supabase.from("support_responses").insert({
        question_pattern: q,
        keywords,
        answer,
      });
    }

    return new Response(
      JSON.stringify({ answer, source: "gemini" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("support-chat error:", err);
    return new Response(
      JSON.stringify({
        answer: null,
        fallback: true,
        message: "Something went wrong. Please email support@finventree.com for help.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
