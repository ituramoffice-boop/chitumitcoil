import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { base64, mime_type, text } = await req.json();

    if (!base64 && !text) {
      return new Response(
        JSON.stringify({ error: "Either base64 image or text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const systemPrompt = `אתה מומחה לביטוח ישראלי. נתח את תלוש השכר הזה וזהה:
1) כפל ביטוחי (במיוחד בריאות/ניתוחים)
2) סכום החיסכון החודשי האפשרי
3) המלצות.
החזר JSON בלבד בפורמט הבא:
{
  "duplications": [{"type": "סוג הכפל", "details": "פרטים", "monthly_cost": 0}],
  "potential_monthly_savings": 0,
  "recommendations": ["המלצה 1", "המלצה 2"],
  "summary": "תקציר קצר"
}`;

    const userContent: any[] = [
      { type: "text", text: text || "נתח את תלוש השכר המצורף." },
    ];

    if (base64) {
      userContent.push({
        type: "image_url",
        image_url: { url: `data:${mime_type || "image/jpeg"};base64,${base64}` },
      });
    }

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("OpenAI error:", aiResponse.status, errText);
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${aiResponse.status}` }),
        { status: aiResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "{}";

    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch {
      analysis = { raw: content, error: "Failed to parse AI response" };
    }

    return new Response(JSON.stringify({ success: true, analysis }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-payslip error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
