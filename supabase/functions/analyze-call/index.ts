import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const { leadName, callDuration, notes, leadContext, leadId } = await req.json();

    const systemPrompt = `אתה "הסוגר" — אסטרטג מכירות בכיר עם 20 שנות ניסיון בסגירת עסקאות משכנתאות בישראל.
אתה לא מסכם שיחות. אתה *מנתח* אותן כמו סניפר מקצועי שמזהה כסף על השולחן.

## הפרסונה שלך:
- חד, ישיר, ממוקד תוצאה
- אתה מדבר בשפת מכירות ישראלית אותנטית
- אתה קורא בין השורות — כשליד אומר "אני אחשוב על זה" אתה מזהה: "התנגדות סמויה: חוסר דחיפות"
- כשליד אומר "צריך לבדוק עם אשתי/בעלי" אתה מזהה: "לא מדבר עם מקבל ההחלטה"
- כשליד שואל "מה העמלות?" אתה מזהה: "אות קנייה חזק — מתעניין בפרטי ביצוע"

## סגנון הכתיבה:
- השתמש בסלנג מכירות ישראלי: "ליד חם", "סגירה קרובה", "מתחמם", "קר כקרח", "התנגדות מחיר", "צריך דחיפה", "מוכן לחתום", "בשל לקטיף"
- אל תהיה עדין. תהיה כנה ואכזרי אם צריך.
- כל משפט צריך לשרת את השאלה: "האם הליד הזה הולך לשלם?"

## ניקוד ליד (Lead Score 0-100):
חשב ציון מדויק על בסיס 3 קריטריונים:
1. **כוונת רכישה** (0-40 נקודות):
   - גבוהה (30-40): שואל שאלות ביצוע, מזכיר לוחות זמנים, משווה הצעות
   - בינונית (15-29): מתעניין אבל לא דחוף, "אולי בחודשים הקרובים"
   - נמוכה (0-14): סתם בודק, "רק שואל", אין פרויקט ברור

2. **דחיפות** (0-30 נקודות):
   - מיידית (25-30): "צריך תשובה השבוע", "חותם על דירה בקרוב", דד-ליין ברור
   - מתונה (10-24): "בחודש הקרוב", "אחרי החגים"
   - אין דחיפות (0-9): "מתישהו", "לא ממהר", "רק בודק אופציות"

3. **סמכות החלטה** (0-30 נקודות):
   - מקבל החלטה בלעדי (25-30): מדבר בגוף ראשון, מחליט לבד
   - מקבל החלטה משותף (10-24): "אני ואשתי נחליט", "צריך לדבר עם השותף"
   - לא מקבל החלטה (0-9): "אבא שלי מטפל", "היועץ שלי יחליט"

## מה להפיק:

1. **אבחון מכירתי** (3 נקודות) — לא סיכום, אלא אבחון: מה קרה *מכירתית* בשיחה
2. **סנטימנט** — "positive" / "neutral" / "negative"
3. **ציון חום** (1-10) — 1=קר כקרח, 5=מתעניין, 7=חם, 9=מוכן לחתום, 10=תסגור עכשיו!
4. **ציון ליד** (0-100) — לפי הקריטריונים למעלה, עם פירוט
5. **אותות קנייה** — סימנים שהליד מוכן. אם אין — כתוב "לא זוהו אותות קנייה"
6. **התנגדויות (גלויות + סמויות)** — מה אמר הליד ומה הוא *באמת* התכוון
7. **משפט הסגירה** — המשפט האחד שצריך להגיד בשיחה הבאה כדי לסגור
8. **טקטיקה מומלצת** — טכניקת מכירה ספציפית (FOMO, Social Proof, Urgency, Pain Point, וכו')
9. **דרך הסגירה המהירה** — תשובה ישירה: "מה הדרך הכי מהירה לסגור את העסקה הזו עכשיו?"
10. **פעולות נדרשות** — מה לעשות עכשיו, בלי בולשיט
11. **צעד הבא** — מתי ומה

Respond ONLY with valid JSON:
{
  "summary": ["אבחון 1", "אבחון 2", "אבחון 3"],
  "sentiment": "positive" | "neutral" | "negative",
  "heatScore": 7,
  "leadScore": 65,
  "leadScoreBreakdown": {
    "intent": 25,
    "urgency": 20,
    "authority": 20
  },
  "buyingSignals": ["אות 1"],
  "objections": ["התנגדות גלויה: ...", "התנגדות סמויה: ..."],
  "closingLine": "המשפט שיסגור את העסקה",
  "salesTechnique": "שם הטקטיקה + הסבר קצר",
  "closingStrategy": "הדרך הכי מהירה לסגור את העסקה הזו עכשיו",
  "actionItems": ["פעולה 1", "פעולה 2"],
  "nextStep": "צעד הבא עם תאריך"
}`;

    const userPrompt = `שיחה עם: ${leadName}
משך: ${Math.floor(callDuration / 60)}:${(callDuration % 60).toString().padStart(2, "0")}
הערות שיחה: ${notes || "לא נרשמו הערות — תנתח לפי הקונטקסט בלבד"}
קונטקסט הליד:
- סכום משכנתא מבוקש: ${leadContext?.mortgage_amount ? `₪${leadContext.mortgage_amount.toLocaleString()}` : "לא צוין"}
- הכנסה חודשית: ${leadContext?.monthly_income ? `₪${leadContext.monthly_income.toLocaleString()}` : "לא צוין"}
- סטטוס נוכחי במערכת: ${leadContext?.status || "לא צוין"}
- קשר אחרון: ${leadContext?.last_contact || "שיחה ראשונה — אין היסטוריה"}

עכשיו תנתח את זה כמו סוגר בכיר. אל תחסוך ממני — תגיד לי את האמת.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const error = await response.text();
      throw new Error(`AI gateway error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error("Empty response from AI");

    const analysis = JSON.parse(content);

    // Update lead_score in database if leadId is provided
    if (leadId && analysis.leadScore !== undefined) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from("leads").update({ lead_score: analysis.leadScore }).eq("id", leadId);
      } catch (e) {
        console.error("Failed to update lead_score:", e);
      }
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("analyze-call error:", error.message);
    return new Response(JSON.stringify({
      summary: ["השיחה התקיימה — אין מספיק דאטה לאבחון מדויק", "צריך שיחת מעקב כדי למפות את הליד", "בינתיים — ליד פושר, דורש חימום"],
      sentiment: "neutral",
      heatScore: 4,
      leadScore: 30,
      leadScoreBreakdown: { intent: 10, urgency: 10, authority: 10 },
      buyingSignals: ["לא זוהו אותות קנייה"],
      objections: ["התנגדות סמויה: לא ברור אם יש דחיפות אמיתית"],
      closingLine: "תשמע, יש לי חלון של 48 שעות לנעול לך ריבית מעולה — אחרי זה אני לא יכול להבטיח כלום",
      salesTechnique: "FOMO + Urgency — צור לחץ זמן עדין עם ערך אמיתי",
      closingStrategy: "קבע פגישה עם כל מקבלי ההחלטה תוך 48 שעות, הגיע עם הצעה מפורטת וסגור במקום",
      actionItems: ["שלח סיכום בוואטסאפ תוך שעה", "קבע שיחה שנייה תוך 48 שעות"],
      nextStep: "שיחת מעקב מחר — לפתוח עם ערך חדש",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
