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
    const { base64, mime_type, text, images } = await req.json();

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

    const systemPrompt = `אתה רואה חשבון בכיר ומומחה פיננסי ישראלי עם 20 שנות ניסיון. בצע ביקורת על פירוט כרטיס אשראי של לקוח.

⚠️ מילות מפתח לזיהוי בעברית:
- הלוואות חוץ-בנקאיות: "החזר הלוואה", "מימון", "הלוואת צ'ק", "אשראי לכל מטרה"
- ביטוח באשראי: "פרמיה", "ביטוח", "פרמיית ביטוח", "דמי ביטוח"
- חיובים קבועים: "הוראת קבע", "חיוב קבוע", "מנוי"
- תשלומים: "תשלום X מתוך Y"

⚠️ זיהוי מוסדות פיננסיים בעברית:
- חברות ביטוח: מנורה, מבטחים, הראל, מגדל, כלל, הפניקס, אלטשולר שחם, מיטב דש, איילון, פסגות, הכשרה
- חברות אשראי: ישראכרט, כאל, מקס (לאומי קארד), אמריקן אקספרס, דיינרס
- גופי מימון: נתנאל גרופ, קיפיטל, בנק יהב, One Zero

החזר JSON בלבד עם המבנה הבא:

{
  "card_info": {
    "card_company": "שם חברת האשראי",
    "card_last_digits": "4 ספרות אחרונות אם מופיע",
    "statement_period": "תקופת הפירוט (מ-עד)",
    "total_charge": 0
  },
  "categories": {
    "insurance": [
      {
        "company": "שם חברת הביטוח",
        "company_en": "English name",
        "monthly_amount": 0,
        "type": "health|life|car|home|other",
        "description": "תיאור מקורי מהפירוט"
      }
    ],
    "loans": [
      {
        "description": "תיאור ההלוואה/מימון",
        "monthly_amount": 0,
        "lender": "שם הגוף המלווה",
        "installment_info": "תשלום X מתוך Y אם רלוונטי"
      }
    ],
    "fixed_bills": [
      {
        "description": "תיאור",
        "monthly_amount": 0,
        "category": "telecom|utilities|streaming|gym|other"
      }
    ]
  },
  "financial_summary": {
    "total_insurance_monthly": 0,
    "total_loans_monthly": 0,
    "total_fixed_bills_monthly": 0,
    "total_recurring_obligations": 0
  },
  "wow_alerts": [
    "התראות טקסטואליות קצרות"
  ],
  "agent_summary": "סיכום ביקורת קצר וממוקד לסוכן",
  "duplicate_insurance_risk": false,
  "high_interest_loans": false
}

הנחיות לביקורת:

1. ביטוח באשראי: חפש כל תשלום לחברת ביטוח. אם יש יותר מ-2 תשלומים לחברות שונות, סמן duplicate_insurance_risk = true.

2. הלוואות ומימון: זהה החזרי הלוואות, תשלומי מימון, ו"אשראי לכל מטרה". אם ריבית מעל 10%, סמן high_interest_loans = true.

3. חיובים קבועים: זהה מנויים, הוראות קבע, חיובים חוזרים (סלולר, אינטרנט, חדר כושר, נטפליקס וכד').

4. wow_alerts: צור התראות אימפקטיביות. דוגמאות:
   - "זוהו 3 ביטוחים שונים דרך כרטיס אשראי – חשד לכפילויות!"
   - "הלוואה חוץ-בנקאית בסכום ₪X – שווה לבדוק מיחזור"
   - "סה״כ התחייבויות קבועות באשראי: ₪X בחודש"

אם שדה לא נמצא בפירוט, השתמש ב-null. החזר JSON בלבד, ללא טקסט נוסף.`;

    const pageCount = imageList.length;
    const userContent: any[] = [
      {
        type: "text",
        text: text || (pageCount > 1
          ? `בצע ביקורת מקצועית על פירוט כרטיס האשראי המצורף (${pageCount} עמודים). שלב את כל הנתונים מכל העמודים לתוצאה אחת.`
          : "בצע ביקורת מקצועית על פירוט כרטיס האשראי המצורף."),
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
    console.error("analyze-credit-card error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
