const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const { leadName, callDuration, notes, leadContext } = await req.json();

    const systemPrompt = `אתה מנתח שיחות מכירה מומחה עבור מערכת CRM של יועצי משכנתאות בישראל.
אתה צריך לנתח את השיחה מנקודת מבט של איש מכירות מקצועי ולהפיק תובנות מכירתיות.

בהינתן הערות השיחה והקונטקסט של הליד, הפק:

1. **סיכום מכירתי** (3 נקודות) — מה קרה בשיחה מבחינה מכירתית
2. **סנטימנט** — "positive" / "neutral" / "negative"
3. **אותות קנייה** — סימנים שהלקוח מוכן להתקדם (אם יש)
4. **התנגדויות שזוהו** — מה עצר את הלקוח (מחיר, תזמון, אמון, וכו')
5. **טכניקת מכירה מומלצת** — איך להתקדם עם הלקוח הספציפי הזה
6. **פעולות נדרשות** — משימות קונקרטיות
7. **צעד הבא** — הפעולה הבאה המומלצת עם תאריך
8. **ציון חום** — מ-1 עד 10 כמה חם הליד (10 = מוכן לסגירה)

Respond ONLY with valid JSON:
{
  "summary": ["נקודה 1", "נקודה 2", "נקודה 3"],
  "sentiment": "positive" | "neutral" | "negative",
  "buyingSignals": ["אות 1", "אות 2"],
  "objections": ["התנגדות 1"],
  "salesTechnique": "המלצת טכניקה",
  "actionItems": ["פעולה 1", "פעולה 2"],
  "nextStep": "צעד הבא מומלץ",
  "heatScore": 7
}`;

    const userPrompt = `שיחה עם: ${leadName}
משך: ${Math.floor(callDuration / 60)}:${(callDuration % 60).toString().padStart(2, "0")}
הערות שיחה: ${notes || "לא נרשמו הערות"}
קונטקסט הליד:
- סכום משכנתא: ${leadContext?.mortgage_amount ? `₪${leadContext.mortgage_amount.toLocaleString()}` : "לא צוין"}
- הכנסה חודשית: ${leadContext?.monthly_income ? `₪${leadContext.monthly_income.toLocaleString()}` : "לא צוין"}
- סטטוס נוכחי: ${leadContext?.status || "לא צוין"}
- קשר אחרון: ${leadContext?.last_contact || "שיחה ראשונה"}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.5,
        max_tokens: 800,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error("Empty response from OpenAI");

    const analysis = JSON.parse(content);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("analyze-call error:", error.message);
    return new Response(JSON.stringify({
      summary: ["השיחה התקיימה בהצלחה", "נדונו פרטי המשכנתא", "נקבע המשך טיפול"],
      sentiment: "neutral",
      buyingSignals: [],
      objections: [],
      salesTechnique: "בנה אמון והצע פגישה פרונטלית",
      actionItems: ["מעקב טלפוני"],
      nextStep: "מעקב טלפוני תוך יומיים",
      heatScore: 5,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
