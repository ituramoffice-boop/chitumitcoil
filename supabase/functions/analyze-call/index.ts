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

## מה להפיק:

1. **אבחון מכירתי** (3 נקודות) — לא סיכום, אלא אבחון: מה קרה *מכירתית* בשיחה
2. **סנטימנט** — "positive" / "neutral" / "negative"  
3. **ציון חום** (1-10) — 1=קר כקרח, 5=מתעניין, 7=חם, 9=מוכן לחתום, 10=תסגור עכשיו!
4. **אותות קנייה** — סימנים שהליד מוכן. אם אין — כתוב "לא זוהו אותות קנייה"
5. **התנגדויות (גלויות + סמויות)** — מה אמר הליד ומה הוא *באמת* התכוון
6. **משפט הסגירה** — המשפט האחד שצריך להגיד בשיחה הבאה כדי לסגור
7. **טקטיקה מומלצת** — טכניקת מכירה ספציפית (FOMO, Social Proof, Urgency, Pain Point, וכו')
8. **פעולות נדרשות** — מה לעשות עכשיו, בלי בולשיט
9. **צעד הבא** — מתי ומה

Respond ONLY with valid JSON:
{
  "summary": ["אבחון 1", "אבחון 2", "אבחון 3"],
  "sentiment": "positive" | "neutral" | "negative",
  "heatScore": 7,
  "buyingSignals": ["אות 1"],
  "objections": ["התנגדות גלויה: ...", "התנגדות סמויה: ..."],
  "closingLine": "המשפט שיסגור את העסקה",
  "salesTechnique": "שם הטקטיקה + הסבר קצר",
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
        temperature: 0.7,
        max_tokens: 1000,
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
      summary: ["השיחה התקיימה — אין מספיק דאטה לאבחון מדויק", "צריך שיחת מעקב כדי למפות את הליד", "בינתיים — ליד פושר, דורש חימום"],
      sentiment: "neutral",
      heatScore: 4,
      buyingSignals: ["לא זוהו אותות קנייה"],
      objections: ["התנגדות סמויה: לא ברור אם יש דחיפות אמיתית"],
      closingLine: "תשמע, יש לי חלון של 48 שעות לנעול לך ריבית מעולה — אחרי זה אני לא יכול להבטיח כלום",
      salesTechnique: "FOMO + Urgency — צור לחץ זמן עדין עם ערך אמיתי",
      actionItems: ["שלח סיכום בוואטסאפ תוך שעה", "קבע שיחה שנייה תוך 48 שעות"],
      nextStep: "שיחת מעקב מחר — לפתוח עם ערך חדש",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
