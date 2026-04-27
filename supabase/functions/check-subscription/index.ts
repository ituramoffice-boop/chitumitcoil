import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Helper: mask a token for safe logging (show only prefix/suffix + length)
  const maskToken = (t: string | null | undefined): string => {
    if (!t) return "<empty>";
    const len = t.length;
    if (len <= 12) return `<short:len=${len}>`;
    return `${t.slice(0, 6)}...${t.slice(-4)} (len=${len})`;
  };

  // Helper: classify the token type for diagnostics
  const classifyToken = (t: string, anon: string, pub: string): string => {
    if (!t) return "empty";
    if (t === anon) return "anon_key";
    if (t === pub) return "publishable_key";
    const parts = t.split(".");
    if (parts.length !== 3) return `non_jwt(parts=${parts.length})`;
    try {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
      return `jwt(role=${payload.role ?? "?"}, sub=${payload.sub ? "present" : "missing"}, email=${payload.email ?? "?"}, exp=${payload.exp ?? "?"})`;
    } catch (e) {
      return `jwt_unparseable(${(e as Error).message})`;
    }
  };

  const reqId = crypto.randomUUID().slice(0, 8);
  console.log(`[check-subscription:${reqId}] === Incoming request ===`);
  console.log(`[check-subscription:${reqId}] method=${req.method} url=${req.url}`);

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    const apikeyHeader = req.headers.get("apikey");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const pubKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
    const token = authHeader?.replace("Bearer ", "") ?? "";

    console.log(`[check-subscription:${reqId}] Authorization header present=${!!authHeader} masked=${maskToken(token)}`);
    console.log(`[check-subscription:${reqId}] apikey header masked=${maskToken(apikeyHeader)}`);
    console.log(`[check-subscription:${reqId}] token classification=${classifyToken(token, anonKey, pubKey)}`);

    // If there is no token, or the token is just the anon/publishable key, return unsubscribed (no user signed in)
    const unsubscribed = (reason: string) => {
      console.log(`[check-subscription:${reqId}] -> unsubscribed (reason=${reason})`);
      return new Response(
        JSON.stringify({ subscribed: false, product_id: null, subscription_end: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    };

    if (!token) return unsubscribed("no_token");
    if (token === anonKey) return unsubscribed("token_equals_anon_key");
    if (token === pubKey) return unsubscribed("token_equals_publishable_key");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      anonKey,
      { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } }
    );

    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError) {
      console.log(`[check-subscription:${reqId}] getClaims error: ${claimsError.message ?? JSON.stringify(claimsError)}`);
      return unsubscribed("claims_error");
    }
    if (!claimsData?.claims) {
      console.log(`[check-subscription:${reqId}] getClaims returned no claims`);
      return unsubscribed("no_claims");
    }

    const userEmail = claimsData.claims.email as string | undefined;
    console.log(`[check-subscription:${reqId}] claims.sub=${claimsData.claims.sub ?? "missing"} email=${userEmail ?? "missing"}`);
    if (!userEmail) return unsubscribed("missing_email_in_claims");
    const user = { email: userEmail };

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      return new Response(JSON.stringify({ subscribed: false, product_id: null, subscription_end: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return new Response(JSON.stringify({ subscribed: false, product_id: null, subscription_end: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sub = subscriptions.data[0];
    return new Response(JSON.stringify({
      subscribed: true,
      product_id: sub.items.data[0].price.product,
      subscription_end: new Date(sub.current_period_end * 1000).toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`[check-subscription:${reqId}] EXCEPTION:`, (error as Error).message, (error as Error).stack);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
