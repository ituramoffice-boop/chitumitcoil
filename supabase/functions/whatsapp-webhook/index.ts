import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Dynamic system prompts per persona mode
const SYSTEM_PROMPTS: Record<string, string> = {
  sales: `אתה נציג מכירות מקצועי של חיתומית — פלטפורמת משכנתאות חכמה.
המטרה שלך: לזהות הזדמנויות, לסגור עסקאות ולהפנות לידים ליועץ.
דבר בעברית טבעית, תהיה חם ומשכנע. השתמש בטכניקות מכירה עדינות.
אם הלקוח מתעניין במשכנתא — אסוף שם, טלפון וסכום מבוקש.
תמיד סיים עם קריאה לפעולה ברורה.`,

  consultant: `אתה יועץ משכנתאות מומחה של חיתומית.
המטרה שלך: לספק מידע מקצועי, לנתח מצב פיננסי ולהדריך לקוחות.
דבר בעברית מקצועית אך נגישה. הסבר מונחים פיננסיים בפשטות.
אם נשאלת על ריביות או תנאים — ציין שהם משתנים ושיועץ אנושי יוכל לתת הצעה מדויקת.
אל תתחייב לתנאים ספציפיים.`,

  support: `אתה נציג שירות לקוחות של חיתומית.
המטרה שלך: לענות על שאלות, לפתור בעיות ולהפנות לגורם המתאים.
דבר בעברית ידידותית ותמציתית. אם אינך יודע תשובה — אמור שתעביר לנציג אנושי.
שעות פעילות: א-ה 09:00-18:00.`,
};

const DEFAULT_MODE = "consultant";

// Extract message from various WhatsApp provider formats
function extractMessage(body: any): { fromNumber: string; messageBody: string; messageType: string } {
  // Meta Cloud API format
  if (body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
    const msg = body.entry[0].changes[0].value.messages[0];
    return {
      fromNumber: msg.from || "",
      messageBody: msg.text?.body || msg.caption || "",
      messageType: msg.type || "text",
    };
  }
  // Twilio format
  if (body?.From && body?.Body !== undefined) {
    return {
      fromNumber: body.From,
      messageBody: body.Body,
      messageType: body.MediaContentType0 ? "media" : "text",
    };
  }
  // Generic fallback
  return {
    fromNumber: body.from || body.phone || body.sender || "unknown",
    messageBody: body.message || body.text || body.body || JSON.stringify(body),
    messageType: body.type || "text",
  };
}

const FALLBACK_PHRASES = [
  "מצטער, המערכת אינה זמינה",
  "אירעה שגיאה",
  "המערכת עמוסה",
  "לא הצלחתי לעבד",
  "נציג אנושי ייצור איתך קשר",
  "אירעה שגיאה טכנית",
];

const ESCALATION_MESSAGE = `שלום 👋
נראה שאני מתקשה לעזור לך כרגע.
אני מעביר אותך לנציג אנושי שייצור איתך קשר בהקדם האפשרי.
תודה על הסבלנות! 🙏`;

const CONSECUTIVE_FAIL_THRESHOLD = 3;

// Check if a message is a fallback/error response
function isFallbackResponse(message: string): boolean {
  return FALLBACK_PHRASES.some((phrase) => message.includes(phrase));
}

// Count consecutive AI failures for a given number
async function getConsecutiveFailures(supabase: any, fromNumber: string): Promise<number> {
  const { data } = await supabase
    .from("whatsapp_logs")
    .select("direction, message_body, status")
    .eq("from_number", fromNumber)
    .eq("direction", "outbound")
    .order("created_at", { ascending: false })
    .limit(CONSECUTIVE_FAIL_THRESHOLD);

  if (!data || data.length === 0) return 0;

  let failures = 0;
  for (const log of data) {
    if (log.status === "fallback" || isFallbackResponse(log.message_body || "")) {
      failures++;
    } else {
      break; // streak broken
    }
  }
  return failures;
}

// Fetch recent conversation history for context
async function getConversationHistory(supabase: any, fromNumber: string, limit = 10): Promise<Array<{ role: string; content: string }>> {
  const { data } = await supabase
    .from("whatsapp_logs")
    .select("direction, message_body")
    .eq("from_number", fromNumber)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data || data.length === 0) return [];

  return data.reverse().map((log: any) => ({
    role: log.direction === "inbound" ? "user" : "assistant",
    content: log.message_body || "",
  }));
}

// Fetch active AI config (persona mode + system context)
async function getAIConfig(supabase: any): Promise<{ mode: string; extraContext: string }> {
  const { data } = await supabase
    .from("whatsapp_ai_config")
    .select("persona_mode, system_context")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    mode: data?.persona_mode || DEFAULT_MODE,
    extraContext: data?.system_context || "",
  };
}

// Build the full system prompt with mode + extra context
function buildSystemPrompt(mode: string, extraContext: string): string {
  const basePrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS[DEFAULT_MODE];
  if (!extraContext) return basePrompt;
  return `${basePrompt}\n\nעדכונים ומידע נוסף מהמערכת:\n${extraContext}`;
}

// Call AI via Lovable AI Gateway
async function callAI(systemPrompt: string, conversationMessages: Array<{ role: string; content: string }>, currentMessage: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    console.error("LOVABLE_API_KEY is not configured");
    return "מצטער, המערכת אינה זמינה כרגע. נציג אנושי ייצור איתך קשר בהקדם.";
  }

  const messages = [
    { role: "system", content: systemPrompt },
    ...conversationMessages,
    { role: "user", content: currentMessage },
  ];

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        max_tokens: 500,
      }),
    });

    if (response.status === 429) {
      console.warn("AI rate limited");
      return "המערכת עמוסה כרגע, אנא נסה שוב בעוד דקה.";
    }
    if (response.status === 402) {
      console.warn("AI credits exhausted");
      return "מצטער, המערכת אינה זמינה כרגע. נציג אנושי ייצור איתך קשר בהקדם.";
    }
    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return "מצטער, אירעה שגיאה. נציג אנושי ייצור איתך קשר בהקדם.";
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "מצטער, לא הצלחתי לעבד את ההודעה.";
  } catch (err) {
    console.error("AI call error:", err);
    return "מצטער, אירעה שגיאה טכנית. נציג אנושי ייצור איתך קשר בהקדם.";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // GET — WhatsApp/Meta verification challenge
    if (req.method === "GET") {
      const url = new URL(req.url);
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");
      const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN") || "chitumit_verify";

      if (mode === "subscribe" && token === verifyToken) {
        return new Response(challenge, { status: 200, headers: corsHeaders });
      }
      return new Response("Forbidden", { status: 403, headers: corsHeaders });
    }

    // POST — incoming WhatsApp message
    const body = await req.json();
    console.log("Incoming WhatsApp payload:", JSON.stringify(body).slice(0, 500));

    const { fromNumber, messageBody, messageType } = extractMessage(body);

    // 1. Log inbound message
    const { error: inboundError } = await supabase.from("whatsapp_logs").insert({
      from_number: fromNumber,
      message_body: messageBody,
      message_type: messageType,
      direction: "inbound",
      status: "received",
      metadata: body,
    });

    if (inboundError) {
      console.error("DB insert error (inbound):", inboundError);
    }

    // 2. Only process text messages for AI response
    if (messageType !== "text" || !messageBody.trim()) {
      return new Response(JSON.stringify({ success: true, ai_response: null }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Check consecutive failures — escalate if threshold reached
    const priorFailures = await getConsecutiveFailures(supabase, fromNumber);
    if (priorFailures >= CONSECUTIVE_FAIL_THRESHOLD) {
      console.log(`Escalating to human agent for ${fromNumber} (${priorFailures} consecutive failures)`);

      await supabase.from("whatsapp_logs").insert({
        from_number: fromNumber,
        message_body: ESCALATION_MESSAGE,
        message_type: "text",
        direction: "outbound",
        status: "escalated",
        metadata: { reason: "consecutive_failures", failure_count: priorFailures },
      });

      // Create a notification for the admin/consultant
      // Find an admin to notify
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin")
        .limit(1);

      if (adminRoles?.[0]?.user_id) {
        await supabase.from("notifications").insert({
          user_id: adminRoles[0].user_id,
          title: "⚠️ WhatsApp — העברה לנציג אנושי",
          body: `הלקוח ${fromNumber} הועבר לטיפול אנושי לאחר ${priorFailures} כישלונות רצופים של הבוט.`,
          type: "warning",
          link: "/admin/whatsapp-ai",
        });
      }

      return new Response(JSON.stringify({
        success: true,
        ai_response: ESCALATION_MESSAGE,
        escalated: true,
        persona_mode: "escalated",
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Fetch AI config (persona mode + system context)
    const aiConfig = await getAIConfig(supabase);
    console.log(`AI mode: ${aiConfig.mode}`);

    // 5. Build system prompt
    const systemPrompt = buildSystemPrompt(aiConfig.mode, aiConfig.extraContext);

    // 6. Fetch conversation history for context
    const conversationHistory = await getConversationHistory(supabase, fromNumber);

    // 7. Call AI
    const aiResponse = await callAI(systemPrompt, conversationHistory, messageBody);
    console.log(`AI response (${aiConfig.mode}): ${aiResponse.slice(0, 200)}`);

    // 8. Determine if this is a fallback response
    const isFailure = isFallbackResponse(aiResponse);

    // 9. Log AI response as outbound
    const { error: outboundError } = await supabase.from("whatsapp_logs").insert({
      from_number: fromNumber,
      message_body: aiResponse,
      message_type: "text",
      direction: "outbound",
      status: isFailure ? "fallback" : "sent",
      metadata: { persona_mode: aiConfig.mode, model: "google/gemini-3-flash-preview", is_fallback: isFailure },
    });

    if (outboundError) {
      console.error("DB insert error (outbound):", outboundError);
    }

    // 10. Return AI response
    return new Response(JSON.stringify({
      success: true,
      ai_response: aiResponse,
      persona_mode: aiConfig.mode,
      is_fallback: isFailure,
    }), {
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
