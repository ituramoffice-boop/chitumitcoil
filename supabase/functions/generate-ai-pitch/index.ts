import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { clientName, mortgageStatus, missingCoverage, score } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `אתה סוכן ביטוח מקצועי ומנוסה בישראל. תפקידך לייצר הצעת מכירה (Pitch) קצרה, משכנעת ואישית ללקוח.
הפיץ' צריך לכלול:
1. פתיחה אישית עם שם הלקוח
2. זיהוי הפער הביטוחי הספציפי שלו
3. הסבר קצר למה זה קריטי (עם דוגמה מהחיים)
4. הצעה קונקרטית עם יתרון ברור
5. סיום עם Call-to-Action חזק

כתוב בעברית, בטון מקצועי אך חם ואישי. אורך: 4-6 משפטים. אל תכלול כותרת.`;

    const userPrompt = `צור הצעת מכירה (AI Pitch) עבור הלקוח הבא:
- שם: ${clientName}
- סטטוס משכנתא: ${mortgageStatus}
- כיסויים חסרים: ${missingCoverage.join(", ")}
- ציון הזדמנות: ${score}/100`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "מגבלת קצב — נסה שוב בעוד מספר שניות" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "נדרש חיוב — הוסף קרדיטים בהגדרות" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "שגיאה ביצירת הפיץ'" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const pitch = data.choices?.[0]?.message?.content || "לא הצלחנו לייצר פיץ'. נסה שוב.";

    return new Response(JSON.stringify({ pitch }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-ai-pitch error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
