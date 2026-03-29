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
   - אם יש פער מעל 5%, דווח בשדה salary_discrepancy עם הפרטים.
   - אם אין פער משמעותי, הגדר salary_discrepancy ל-null.`;
    }

    const systemPrompt = `אתה רואה חשבון בכיר ומומחה פיננסי ישראלי עם 20 שנות ניסיון. בצע ביקורת על דף חשבון בנק (עו"ש) של לקוח.

⚠️ מילות מפתח לזיהוי בעברית:
- תשלומי משכנתא: "משכנתא", "החזר משכנתא", "הלוואת דיור"
- הלוואות: "החזר הלוואה", "הלוואה", "תשלום הלוואה"
- ביטוח: "פרמיה", "ביטוח", "פרמיית ביטוח"
- הכנסה: "זיכוי משכורת", "העברת משכורת", "שכר"
- העברות קבועות: "העברה קבועה", "הוראת קבע"

⚠️ זיהוי מוסדות פיננסיים בעברית:
- בנקים: לאומי, הפועלים, דיסקונט, מזרחי טפחות, הבינלאומי, יהב, אגוד, מסד, מרכנתיל
- חברות ביטוח: מנורה, מבטחים, הראל, מגדל, כלל, הפניקס, אלטשולר שחם, מיטב דש, איילון, פסגות, הכשרה

החזר JSON בלבד עם המבנה הבא:

{
  "account_info": {
    "bank_name": "שם הבנק",
    "branch": "מספר סניף אם מופיע",
    "account_number": "מספר חשבון אם מופיע",
    "statement_period": "תקופת הדף (מ-עד)"
  },
  "income": {
    "salary_deposits": [
      {
        "date": "תאריך",
        "amount": 0,
        "source": "שם המעסיק/מקור"
      }
    ],
    "average_monthly_net": 0,
    "months_analyzed": 0
  },
  "mortgage": {
    "found": false,
    "bank_name": "שם הבנק למשכנתא",
    "monthly_payment": 0,
    "payments": [
      {
        "date": "תאריך",
        "amount": 0
      }
    ]
  },
  "insurance_payments": [
    {
      "company": "שם חברת הביטוח (עברית)",
      "company_en": "English name",
      "monthly_amount": 0,
      "type": "health|life|pension|other",
      "dates_found": ["תאריכים"]
    }
  ],
  "loan_repayments": [
    {
      "description": "תיאור ההלוואה",
      "monthly_amount": 0,
      "lender": "שם הגוף המלווה"
    }
  ],
  "recurring_transfers": [
    {
      "description": "תיאור",
      "amount": 0,
      "frequency": "חודשי/שבועי"
    }
  ],
  "salary_discrepancy": null,
  "financial_summary": {
    "total_monthly_income": 0,
    "total_monthly_obligations": 0,
    "obligation_ratio_percent": 0,
    "free_cash_flow": 0
  },
  "wow_alerts": [
    "התראות טקסטואליות קצרות"
  ],
  "agent_summary": "סיכום ביקורת קצר וממוקד לסוכן"
}

הנחיות לביקורת:

1. הכנסות: זהה את כל זיכויי המשכורת. חשב ממוצע חודשי נטו על בסיס כל החודשים שמופיעים בדף.

2. משכנתא: חפש תשלומי "משכנתא" או "החזר משכנתא". זהה את הבנק (לאומי/הפועלים/דיסקונט/מזרחי טפחות) ואת הסכום החודשי.

3. ביטוח: חפש תשלומים לחברות ביטוח (הראל, מנורה, מגדל, כלל, הפניקס וכד'). סווג: בריאות/חיים/פנסיה/אחר.

4. הלוואות: זהה החזרי הלוואות גדולים (מעל ₪500 לחודש). רשום את הגוף המלווה והסכום.

5. יחס התחייבויות: חשב obligation_ratio_percent = (סך חיובים חודשיים / סך הכנסה חודשית) × 100.

6. wow_alerts: צור התראות אימפקטיביות. דוגמאות:
   - "יחס החזר של X% – מעל הסף הבנקאי של 40%!"
   - "זוהו תשלומים ל-3 חברות ביטוח שונות – חשד לכפילויות"
   - "הלוואה של ₪X בחודש – שווה לבדוק מיחזור"
${crossRefInstruction}

אם שדה לא נמצא בדף, השתמש ב-null. החזר JSON בלבד, ללא טקסט נוסף.`;

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
