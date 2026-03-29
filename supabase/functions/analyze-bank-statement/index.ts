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
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid request body – expected JSON" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { base64, mime_type, text, images, payslip_analysis } = body;

    const imageList: { base64: string; mime_type: string }[] = images
      ? images
      : base64
        ? [{ base64, mime_type: mime_type || "image/jpeg" }]
        : [];

    if (imageList.length === 0 && !text) {
      return new Response(
        JSON.stringify({ error: "נדרש קובץ תמונה או PDF לניתוח" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try Lovable AI Gateway first, fallback to OpenAI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    
    if (!LOVABLE_API_KEY && !OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "No AI API key configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const useLovable = !!LOVABLE_API_KEY;
    const apiUrl = useLovable
      ? "https://ai.gateway.lovable.dev/v1/chat/completions"
      : "https://api.openai.com/v1/chat/completions";
    const apiKey = useLovable ? LOVABLE_API_KEY : OPENAI_API_KEY;
    const model = useLovable ? "openai/gpt-5" : "gpt-4o";

    console.log(`[analyze-bank-statement] Using ${useLovable ? "Lovable AI" : "OpenAI"}, images: ${imageList.length}, hasText: ${!!text}`);

    // Build cross-reference instruction if payslip data exists
    let crossRefInstruction = "";
    if (payslip_analysis?.salary?.net_salary) {
      crossRefInstruction = `

10. הצלבה עם תלוש שכר (Cross-Reference):
   קיים תלוש שכר קודם עם שכר נטו: ₪${payslip_analysis.salary.net_salary}.
   - השווה את "זיכוי משכורת" בדף הבנק לשכר הנטו מהתלוש.
   - אם יש פער מעל 5%, דווח בשדה salary_verification.discrepancy_amount ו-discrepancy_alert.
   - עדכן matches_payslip ל-false אם יש פער, ו-cross_reference_status ל-"red" אם הפער מעל 10%, "yellow" אם 5-10%.`;
    }

const systemPrompt = `אתה מומחה לניתוח דפי חשבון בנק ישראלי עם 20 שנות ניסיון כרואה חשבון בכיר. נתח את דף החשבון ותחזיר JSON בלבד.

⚠️ כלל קריטי לזיהוי הכנסה (משכורת):
- הכנסת משכורת היא הפקדה החוזרת מדי חודש בסכום דומה, בדרך כלל הסכום הגדול ביותר שמופקד.
- מילות מפתח: "משכורת", "שכר", "זיכוי משכורת", "העברת משכורת", "מ.ה.", "הפקדה", "העברה מ" + שם מעסיק.
- ⚠️ אל תבלבל בין הפקדות קטנות (כמו החזר מס, זיכוי ביטוח, העברה בין חשבונות) לבין משכורת!
- אם אתה רואה הפקדה חוזרת של אלפי שקלים (למשל 5,000-30,000 ₪) – זו כנראה המשכורת.
- הפקדה של מאות בודדות שקלים בלבד (100-500 ₪) היא כנראה לא משכורת אלא העברה קטנה או זיכוי.
- תמיד בחר בהפקדה הגדולה והחוזרת כהכנסה הראשית.

⚠️ מילות מפתח לזיהוי בעברית:
- תשלומי משכנתא: "משכנתא", "החזר משכנתא", "הלוואת דיור"
- הלוואות: "החזר הלוואה", "הלוואה", "תשלום הלוואה", "מימון"
- ביטוח: "פרמיה", "ביטוח", "פרמיית ביטוח"
- הכנסה: "זיכוי משכורת", "העברת משכורת", "שכר", "משכורת"
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
  "standing_orders": [
    {
      "description": "תיאור הוראת הקבע / העברה חוזרת",
      "monthly_amount": 0,
      "recipient": "שם המוטב",
      "category": "חינוך|ועד בית|חוגים|תרומות|מנויים|אחר"
    }
  ],
  "insurance_charges": [
    {
      "company": "שם חברת הביטוח",
      "monthly_amount": 0,
      "description": "סוג הביטוח"
    }
  ],
  "transactions": [
    {
      "date": "תאריך",
      "description": "תיאור הפעולה",
      "amount": 0,
      "reference_code": "קוד אסמכתא",
      "transaction_type": "salary|pension|loan|insurance|transfer|standing_order|other",
      "confidence_score": 0.95,
      "confidence_reason": "סיבת הסיווג"
    }
  ],
  "income_sources": [
    {
      "source_name": "שם המקור (מעסיק/פנסיה/השכרה)",
      "source_type": "salary|pension|rental|freelance|other",
      "monthly_amount": 0,
      "frequency": "monthly|irregular",
      "reference_codes": ["קודי אסמכתא קשורים"],
      "confidence_score": 0.95,
      "confidence_reason": "סיבת הסיווג"
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

6. standing_orders (הוראות קבע והעברות חוזרות):
   - זהה כל חיוב חוזר שאינו משכנתא, הלוואה או ביטוח.
   - כולל: ועד בית, חוגים, מנויים (נטפליקס, ספוטיפיי, חדר כושר), גני ילדים, בתי ספר, תרומות, שירותי סלולר/אינטרנט.
   - מילות מפתח: "הוראת קבע", "הו״ק", "העברה קבועה", "חיוב חודשי", "מנוי".
   - רשום תיאור, סכום חודשי, שם מוטב, וקטגוריה.
   - ⚠️ אל תכפיל: אם חיוב כבר מופיע כביטוח או הלוואה, אל תרשום אותו גם כהוראת קבע.

7. transactions (פירוט תנועות עם קוד אסמכתא):
   ⚠️ חלק קריטי – חלץ כל תנועה שתוכל לזהות מדף החשבון.
   לכל תנועה חלץ:
   - date: תאריך הפעולה
   - description: תיאור הפעולה כפי שמופיע בדף
   - amount: סכום (חיובי = זיכוי/הפקדה, שלילי = חיוב)
   - reference_code: קוד אסמכתא (מספר הייחוס של הפעולה). חפש עמודת "אסמכתא" או "אסמ'" בדף.
   - transaction_type: סווג לפי הכללים הבאים
   - confidence_score: רמת הביטחון בסיווג (0.0-1.0)
   - confidence_reason: הסבר קצר לסיווג

   כללי confidence_score לפי קוד אסמכתא:
   a) קוד בפורמט MSB (מ.ש.ב) + זיכוי → salary או pension, confidence: 0.95, reason: "MSB format reference code detected"
   b) אותו דפוס קוד חוזר מדי חודש + סכום דומה → הכנסה יציבה, confidence: 0.90, reason: "Recurring monthly pattern with consistent amount"
   c) בלוק החזר הלוואה מזוהה (תיאור + קוד קבוע) → loan, confidence: 0.85, reason: "Known loan repayment block"
   d) תיאור אומר "העברה" אבל קוד אסמכתא מצביע על עסק → תעדוף את הקוד, confidence: 0.80, reason: "Reference code indicates business transaction"
   e) דפוס לא מזוהה → confidence: 0.60, reason: "Unknown pattern"

8. income_sources (מיפוי מקורות הכנסה):
   מפה כל מקור הכנסה שזוהה:
   - source_name: שם המעסיק/מקור
   - source_type: salary (משכורת), pension (פנסיה), rental (שכירות), freelance (עצמאי), other
   - monthly_amount: סכום חודשי
   - frequency: monthly (קבוע) או irregular (לא סדיר)
   - reference_codes: קודי אסמכתא שמשויכים למקור הזה
   - confidence_score: רמת ביטחון בזיהוי המקור (לפי אותם כללים)
   - confidence_reason: הסבר

9. total_monthly_obligations: סכום כל ההתחייבויות (משכנתא + הלוואות + ביטוח + הוראות קבע).
   debt_to_income_ratio: (total_monthly_obligations / average_monthly_deposit) × 100. עגל למספר שלם.

10. wow_alerts: צור התראות אימפקטיביות עם אימוג'ים. דוגמאות:
   - "⚠️ יחס החזר של X% – מעל הסף הבנקאי של 40%!"
   - "🔍 זוהו תשלומים ל-3 חברות ביטוח שונות – חשד לכפילויות"
   - "💰 הלוואה של ₪X בחודש – שווה לבדוק מיחזור"
   - "🏠 משכנתא: X ש״ח לחודש – בנק Y"
   - "📊 זוהו X מקורות הכנסה – confidence ממוצע: Y%"

11. advisor_summary: סיכום קצר וממוקד (2-3 משפטים) לסוכן/יועץ. כלול מידע על מקורות הכנסה ורמת הביטחון.

12. cross_reference_status: "green" אם הכל תקין, "yellow" אם יש פערים קטנים (5-10%), "red" אם יש פערים גדולים (מעל 10%) או התראות קריטיות.
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

    console.log(`[analyze-bank-statement] Sending to AI: model=${model}, contentParts=${userContent.length}`);

    const aiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error(`[analyze-bank-statement] AI error ${aiResponse.status}:`, errText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "המערכת עמוסה – נסו שנית בעוד דקה" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "נדרש חידוש קרדיטים" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: `שגיאה בשירות הניתוח (${aiResponse.status}) – נסו שנית` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "{}";
    console.log(`[analyze-bank-statement] AI response received, length: ${content.length}`);

    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch {
      console.error("[analyze-bank-statement] Failed to parse AI response:", content.substring(0, 200));
      analysis = { raw: content, error: "Failed to parse AI response" };
    }

    return new Response(JSON.stringify({ success: true, analysis }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[analyze-bank-statement] Unhandled error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "שגיאה לא צפויה – נסו שנית" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
