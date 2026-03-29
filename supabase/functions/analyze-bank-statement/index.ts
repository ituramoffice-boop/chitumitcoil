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
    const { base64, mime_type, text, images, payslip_analysis } = await req.json();

    const imageList: { base64: string; mime_type: string }[] = images
      ? images
      : base64
        ? [{ base64, mime_type: mime_type || "image/jpeg" }]
        : [];

    if (imageList.length === 0 && !text) {
      return new Response(
        JSON.stringify({ error: "Either images or text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    // Build cross-reference instruction if payslip data exists
    let crossRefInstruction = "";
    if (payslip_analysis?.salary?.net_salary) {
      crossRefInstruction = `

7. הצלבה עם תלוש שכר (Cross-Reference):
   קיים תלוש שכר קודם עם שכר נטו: ₪${payslip_analysis.salary.net_salary}.
   - השווה את "זיכוי משכורת" בדף הבנק לשכר הנטו מהתלוש.
   - אם יש פער מעל 5%, דווח בשדה salary_verification.discrepancy_amount ו-discrepancy_alert.
   - עדכן matches_payslip ל-false אם יש פער, ו-cross_reference_status ל-"red" אם הפער מעל 10%, "yellow" אם 5-10%.`;
    }

    const systemPrompt = `אתה מומחה לניתוח דפי חשבון בנק ישראלי עם 20 שנות ניסיון כרואה חשבון בכיר. נתח את דף החשבון ותחזיר JSON בלבד.

⚠️ מילות מפתח לזיהוי בעברית:
- תשלומי משכנתא: "משכנתא", "החזר משכנתא", "הלוואת דיור"
- הלוואות: "החזר הלוואה", "הלוואה", "תשלום הלוואה", "מימון"
- ביטוח: "פרמיה", "ביטוח", "פרמיית ביטוח"
- הכנסה: "זיכוי משכורת", "העברת משכורת", "שכר"
- העברות קבועות: "העברה קבועה", "הוראת קבע"

⚠️ זיהוי מוסדות פיננסיים בעברית:
- בנקים: לאומי, הפועלים, דיסקונט, מזרחי טפחות, הבינלאומי, יהב, אגוד, מסד, מרכנתיל
- חברות ביטוח: מנורה, מבטחים, הראל, מגדל, כלל, הפניקס, אלטשולר שחם, מיטב דש, איילון, פסגות, הכשרה

החזר JSON בלבד עם המבנה הבא:

{
  "personal": {
    "account_holder": "שם בעל החשבון",
    "bank_name": "שם הבנק",
    "account_number": "4 ספרות אחרונות בלבד"
  },
  "salary_verification": {
    "net_deposits": [0],
    "average_monthly_deposit": 0,
    "matches_payslip": true,
    "discrepancy_amount": 0,
    "discrepancy_alert": "תיאור הפער אם קיים"
  },
  "mortgage": {
    "detected": true,
    "monthly_payment": 0,
    "bank_name": "שם הבנק",
    "estimated_remaining": "הערכה"
  },
  "existing_loans": [
    {
      "description": "תיאור ההלוואה",
      "monthly_payment": 0,
      "lender": "שם המלווה"
    }
  ],
  "insurance_charges": [
    {
      "company": "שם חברת הביטוח",
      "monthly_amount": 0,
      "description": "סוג הביטוח"
    }
  ],
  "total_monthly_obligations": 0,
  "wow_alerts": [
    "⚠️ הפקדת נטו נמוכה ב-800 ש״ח מהתלוש",
    "🏠 משכנתא: 3,200 ש״ח לחודש"
  ],
  "debt_to_income_ratio": 0,
  "advisor_summary": "סיכום קצר לסוכן",
  "cross_reference_status": "green|yellow|red"
}

הנחיות לביקורת:

1. personal: חלץ שם בעל החשבון מכותרת הדף. שם הבנק מהלוגו/כותרת. מספר חשבון – 4 ספרות אחרונות בלבד.

2. salary_verification: זהה כל הפקדות משכורת ("זיכוי משכורת", "העברת משכורת"). רשום כל הפקדה ב-net_deposits. חשב ממוצע ב-average_monthly_deposit.

3. mortgage: חפש "משכנתא" או "החזר משכנתא". זהה בנק, סכום חודשי. estimated_remaining – הערכה בלבד (אם לא ניתן, null).

4. existing_loans: זהה כל החזרי הלוואות (מעל ₪300/חודש). רשום תיאור, סכום, ושם המלווה.

5. insurance_charges: זהה תשלומים לחברות ביטוח (הראל, מנורה, מגדל, כלל, הפניקס וכד'). רשום חברה, סכום חודשי, וסוג (בריאות/חיים/פנסיה/רכב/דירה/אחר).

6. total_monthly_obligations: סכום כל ההתחייבויות (משכנתא + הלוואות + ביטוח + הוראות קבע).
   debt_to_income_ratio: (total_monthly_obligations / average_monthly_deposit) × 100. עגל למספר שלם.

7. wow_alerts: צור התראות אימפקטיביות עם אימוג'ים. דוגמאות:
   - "⚠️ יחס החזר של X% – מעל הסף הבנקאי של 40%!"
   - "🔍 זוהו תשלומים ל-3 חברות ביטוח שונות – חשד לכפילויות"
   - "💰 הלוואה של ₪X בחודש – שווה לבדוק מיחזור"
   - "🏠 משכנתא: X ש״ח לחודש – בנק Y"

8. advisor_summary: סיכום קצר וממוקד (2-3 משפטים) לסוכן/יועץ.

9. cross_reference_status: "green" אם הכל תקין, "yellow" אם יש פערים קטנים (5-10%), "red" אם יש פערים גדולים (מעל 10%) או התראות קריטיות.
${crossRefInstruction}

אם שדה לא נמצא, השתמש ב-null. החזר JSON בלבד, ללא טקסט נוסף.`;

    const pageCount = imageList.length;
    const userContent: any[] = [
      {
        type: "text",
        text: text || (pageCount > 1
          ? `בצע ביקורת מקצועית על דף חשבון הבנק המצורף (${pageCount} עמודים). שלב את כל הנתונים מכל העמודים לתוצאה אחת.`
          : "בצע ביקורת מקצועית על דף חשבון הבנק המצורף."),
      },
    ];

    for (const img of imageList) {
      userContent.push({
        type: "image_url",
        image_url: { url: `data:${img.mime_type};base64,${img.base64}` },
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
    console.error("analyze-bank-statement error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
