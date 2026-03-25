import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Support both GET (verification) and POST (messages)
    if (req.method === "GET") {
      // WhatsApp/Meta verification challenge
      const url = new URL(req.url);
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      // You can set WHATSAPP_VERIFY_TOKEN as a secret for verification
      const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN") || "chitumit_verify";

      if (mode === "subscribe" && token === verifyToken) {
        return new Response(challenge, { status: 200, headers: corsHeaders });
      }
      return new Response("Forbidden", { status: 403, headers: corsHeaders });
    }

    // POST — incoming message
    const body = await req.json();
    console.log("Incoming WhatsApp payload:", JSON.stringify(body));

    // Extract message data (supports Meta Cloud API format and generic)
    let fromNumber = "";
    let messageBody = "";
    let messageType = "text";

    // Meta Cloud API format
    if (body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      const msg = body.entry[0].changes[0].value.messages[0];
      fromNumber = msg.from || "";
      messageBody = msg.text?.body || msg.caption || "";
      messageType = msg.type || "text";
    }
    // Twilio format
    else if (body?.From && body?.Body !== undefined) {
      fromNumber = body.From;
      messageBody = body.Body;
      messageType = body.MediaContentType0 ? "media" : "text";
    }
    // Generic fallback
    else {
      fromNumber = body.from || body.phone || body.sender || "unknown";
      messageBody = body.message || body.text || body.body || JSON.stringify(body);
      messageType = body.type || "text";
    }

    // Store in DB
    const { error } = await supabase.from("whatsapp_logs").insert({
      from_number: fromNumber,
      message_body: messageBody,
      message_type: messageType,
      direction: "inbound",
      status: "received",
      metadata: body,
    });

    if (error) {
      console.error("DB insert error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
