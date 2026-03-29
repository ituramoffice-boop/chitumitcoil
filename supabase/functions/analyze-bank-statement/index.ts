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

    const { base64, mime_type, text, images, payslip_analysis, deep_scan } = body;

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
    const model = useLovable ? "google/gemini-2.5-flash" : "gpt-4o";

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

🔴 כללי קודי אסמכתא בנקאיים ישראליים (עדיפות עליונה!):
חלץ את הקוד מעמודת 'מידע לשימושנו' או 'סוג פעולה / צרור / אסמכתא'.
תמיד חלץ את המספר הראשון לפני הלוכסן (/).

קודי הכנסה (זכות):
- קוד 71 או 72 = משכורת מאומתת (MSB), confidence: 0.97, verification_method: "Verified by MSB code 71/72"
- קוד 106360812 או 175 = העברת Bit, סווג כ-"bit_transfer", הכנסה מזדמנת
- קוד 10734 = הפקדת צ'ק, סווג כ-"check"

קודי הוצאה (חובה):
- קוד 4153 או 6147 = חיוב ישיר (כרטיס אשראי / הוראת קבע), סווג כ-"direct_debit"
- חיוב חוזר מגורם בנקאי = הלוואה פעילה, חשב השפעה על DTI

⚠️ כלל עדיפות: אם התיאור סותר את הקוד – תמיד סמוך על הקוד!

⚠️ כלל קריטי לזיהוי הכנסה (משכורת):
- הכנסת משכורת היא הפקדה החוזרת מדי חודש בסכום דומה, בדרך כלל הסכום הגדול ביותר שמופקד.
- מילות מפתח: "משכורת", "שכר", "זיכוי משכורת", "העברת משכורת", "מ.ה.", "הפקדה", "העברה מ" + שם מעסיק.
- ⚠️ אל תבלבל בין הפקדות קטנות (כמו החזר מס, זיכוי ביטוח, העברה בין חשבונות) לבין משכורת!
- אם אתה רואה הפקדה חוזרת של אלפי שקלים (למשל 5,000-30,000 ₪) – זו כנראה המשכורת.
- הפקדה של מאות בודדות שקלים בלבד (100-500 ₪) היא כנראה לא משכורת אלא העברה קטנה או זיכוי.
- תמיד בחר בהפקדה הגדולה והחוזרת כהכנסה הראשית.
- אם קוד 71/72 מזוהה, זו משכורת מאומתת ללא קשר לתיאור!

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
  "client": {
    "full_name": "שם מלא מנוקה מכותרת הדף",
    "account_number": "4 ספרות אחרונות בלבד",
    "bank_name": "שם הבנק"
  },
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
  "verified_salary": 0,
  "verified_by": "MSB code 71|MSB code 72|recurring pattern|null",
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
      "lender": "שם המלווה",
      "dti_impact": 0
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
      "reference_code": "קוד אסמכתא מלא",
      "bank_code": "המספר הראשון לפני הלוכסן",
      "verification_method": "Verified by MSB code 71|Bit transfer code 175|Direct debit code 4153|null",
      "transaction_type": "salary|pension|loan|insurance|transfer|standing_order|direct_debit|bit_transfer|check|other",
      "confidence_score": 0.95,
      "confidence_reason": "סיבת הסיווג",
      "dti_impact": 0
    }
  ],
  "income_sources": [
    {
      "source_name": "שם המקור (מעסיק/פנסיה/השכרה)",
      "source_type": "salary|pension|rental|freelance|bit_transfer|other",
      "monthly_amount": 0,
      "frequency": "monthly|irregular",
      "reference_codes": ["קודי אסמכתא קשורים"],
      "bank_codes": ["71"],
      "verification_method": "Verified by MSB code 71|recurring pattern|null",
      "confidence_score": 0.95,
      "confidence_reason": "סיבת הסיווג"
    }
  ],
  "total_monthly_obligations": 0,
  "total_dti_ratio": 0,
  "dti_status": "green|yellow|red",
  "employer": {
    "name": "שם המעסיק המלא (מנוקה)",
    "confidence": "high|medium|low",
    "verification_method": "MSB code 71|recurring pattern|description match",
    "needs_manual_verification": false
  },
  "employer_name": "שם המעסיק (לתצוגה מהירה)",
  "health_insurance": {
    "provider": "מכבי|מאוחדת|כללית|לאומית|unknown",
    "monthly_payment": 0,
    "confidence": "high|medium|low"
  },
  "wow_alerts": [
    "⚠️ הפקדת נטו נמוכה ב-800 ש״ח מהתלוש",
    "🏠 משכנתא: 3,200 ש״ח לחודש"
  ],
  "debt_to_income_ratio": 0,
  "advisor_summary": "סיכום קצר לסוכן",
  "cross_reference_status": "green|yellow|red"
}

הנחיות לביקורת:

1. client: חלץ את השם המלא של בעל החשבון. חפש בסדר העדיפויות הבא:
   א) אחרי המילה "לכבוד" בכותרת העליונה של הדף (במיוחד בבנק הפועלים – השם מופיע תמיד אחרי "לכבוד" בראש הדף)
   ב) בשדה "שם המוטב", "בעל החשבון", "שם בעל החשבון", "מוטב", "שם"
   ג) ליד תואר כמו "מר", "גב'", "גברת", "כבוד"
   ד) מתיאורי תנועות כמו "עבור: [שם]" או "המבצע: [שם]"
   ה) משמות שולחים בהעברות Bit
   ⚠️ אם שני שמות מופיעים יחד (למשל "ישראל ושרה כהן" או "ישראל כהן / שרה כהן") – זה חשבון משותף, רשום את שני השמות.
   נקה תארים: מר, גברת, גב', לכבוד, כבוד, ד"ר – הסר אותם מהשם. שם הבנק מהלוגו/כותרת. מספר חשבון – 4 ספרות אחרונות. העתק גם ל-personal.account_holder.
   ⚠️ אם לא נמצא שם כלל, רשום "לקוח חיתומית" (לא "לא זוהה" ולא "לא צוין").

2. salary_verification: זהה כל הפקדות משכורת ("זיכוי משכורת", "העברת משכורת", או קוד 71/72). רשום כל הפקדה ב-net_deposits. חשב ממוצע ב-average_monthly_deposit.
   - אם זוהה קוד 71 או 72 → עדכן verified_salary לסכום, ו-verified_by ל-"MSB code 71" או "MSB code 72".
   - אם אין קוד MSB אבל יש דפוס חוזר → verified_by = "recurring pattern".

3. mortgage: חפש "משכנתא" או "החזר משכנתא". זהה בנק, סכום חודשי. estimated_remaining – הערכה בלבד (אם לא ניתן, null).

4. existing_loans: זהה כל החזרי הלוואות (מעל ₪300/חודש). רשום תיאור, סכום, שם המלווה, ו-dti_impact (הסכום שמשפיע על יחס ההחזר).

5. insurance_charges: זהה תשלומים לחברות ביטוח (הראל, מנורה, מגדל, כלל, הפניקס וכד'). רשום חברה, סכום חודשי, וסוג (בריאות/חיים/פנסיה/רכב/דירה/אחר).

6. standing_orders (הוראות קבע והעברות חוזרות):
   - זהה כל חיוב חוזר שאינו משכנתא, הלוואה או ביטוח.
   - כולל: ועד בית, חוגים, מנויים (נטפליקס, ספוטיפיי, חדר כושר), גני ילדים, בתי ספר, תרומות, שירותי סלולר/אינטרנט.
   - מילות מפתח: "הוראת קבע", "הו״ק", "העברה קבועה", "חיוב חודשי", "מנוי".
   - קוד 4153 או 6147 = הוראת קבע / חיוב ישיר.
   - רשום תיאור, סכום חודשי, שם מוטב, וקטגוריה.
   - ⚠️ אל תכפיל: אם חיוב כבר מופיע כביטוח או הלוואה, אל תרשום אותו גם כהוראת קבע.

7. transactions (פירוט תנועות עם קודי בנק):
   ⚠️ חלק קריטי – חלץ כל תנועה שתוכל לזהות מדף החשבון.
   לכל תנועה חלץ:
   - date: תאריך הפעולה
   - description: תיאור הפעולה כפי שמופיע בדף
   - amount: סכום (חיובי = זיכוי/הפקדה, שלילי = חיוב)
   - reference_code: קוד אסמכתא מלא כפי שמופיע בדף
   - bank_code: המספר הראשון לפני הלוכסן (/) מתוך reference_code
   - verification_method: שיטת האימות לפי הקוד (ראה כללי קודים למעלה)
   - transaction_type: סווג לפי כללי הקודים הבנקאיים (עדיפות עליונה) ואז לפי תיאור
   - confidence_score: לפי כללי הקודים
   - confidence_reason: הסבר קצר
   - dti_impact: סכום ההשפעה על יחס החזר (0 להכנסות, הסכום עצמו לחיובים קבועים)

   כללי confidence_score לפי קוד בנקאי (עדיפות עליונה):
   a) קוד 71 או 72 + זכות → salary, confidence: 0.97, verification_method: "Verified by MSB code 71/72"
   b) קוד 175 או 106360812 + זכות → bit_transfer, confidence: 0.85, verification_method: "Bit transfer code"
   c) קוד 10734 + זכות → check, confidence: 0.80, verification_method: "Check deposit code 10734"
   d) קוד 4153 או 6147 + חובה → direct_debit, confidence: 0.90, verification_method: "Direct debit code 4153/6147"
   e) חיוב חוזר מגורם בנקאי → loan, confidence: 0.85, verification_method: "Recurring bank entity debit"
   f) אותו דפוס קוד חוזר מדי חודש + סכום דומה → הכנסה יציבה, confidence: 0.90, reason: "Recurring monthly pattern"
   g) דפוס לא מזוהה → confidence: 0.60, reason: "Unknown pattern"

8. income_sources (מיפוי מקורות הכנסה):
   מפה כל מקור הכנסה שזוהה:
   - source_name: שם המעסיק/מקור
   - source_type: salary (משכורת), pension (פנסיה), rental (שכירות), freelance (עצמאי), bit_transfer (Bit), other
   - monthly_amount: סכום חודשי
   - frequency: monthly (קבוע) או irregular (לא סדיר)
   - reference_codes: קודי אסמכתא שמשויכים למקור הזה
   - bank_codes: קודי הבנק (71, 72, 175 וכו')
   - verification_method: שיטת האימות
   - confidence_score: רמת ביטחון בזיהוי המקור
   - confidence_reason: הסבר

9. total_monthly_obligations: סכום כל ההתחייבויות (משכנתא + הלוואות + ביטוח + הוראות קבע).
   debt_to_income_ratio: (total_monthly_obligations / average_monthly_deposit) × 100. עגל למספר שלם.
   total_dti_ratio: זהה ל-debt_to_income_ratio (סכום כל ה-dti_impact חלקי הכנסה מאומתת × 100).
   dti_status: "green" אם מתחת ל-30%, "yellow" אם 30-40%, "red" אם מעל 40%.

10. employer (זיהוי מעסיק):
    כאשר מזוהה משכורת, חלץ את שם המעסיק המלא:
    - נקה מהתיאור את המילים: MSB, מס"ב, מסב, זיכוי, ZIKUY, MASAB, העברת, הפקדת, שכר, משכורת.
    - אם התיאור מכיל שם חברה מוכר (Intel, IDF, צה"ל, צבא, מדינת ישראל, שטראוס, טבע, אלביט, רפאל, IAI, תעשייה אווירית, אוניברסיטה, עירייה, בית חולים, משרד הביטחון, משטרה וכד') → confidence: "high".
    - אם אותו גורם מעביר כסף בתאריך קבוע (1, 9, 10 לחודש) מדי חודש → confidence: "high".
    - אם הסכום עקבי בין חודשים (פער מתחת ל-5%) אבל אין שם ברור → confidence: "medium".
    - אם לא ניתן לזהות → confidence: "low", needs_manual_verification: true.
    - עדכן employer_name בשורש ה-JSON לשם המנוקה לתצוגה מהירה.

11. health_insurance (קופת חולים):
    זהה חיובים לקופות חולים מדף הבנק:
    - מכבי: קוד אסמכתא מתחיל ב-7376544 או תיאור מכיל "מכבי"
    - שירותי בריאות כללית: קוד 30744700 או תיאור מכיל "כללית" / "שירותי בריאות"
    - מאוחדת: תיאור מכיל "מאוחדת"
    - לאומית: תיאור מכיל "לאומית"
    - ביטוח לאומי: קוד 60697083 (אל תבלבל עם קופת חולים – זה ביטוח לאומי)
    - אם החיוב חוזר מדי חודש בסכום דומה → confidence: "high"
    - אם מופיע פעם אחת → confidence: "medium"
    - אם לא נמצא → provider: "unknown", monthly_payment: 0, confidence: "low"

12. wow_alerts: צור התראות אימפקטיביות עם אימוג'ים. דוגמאות:
    - "⚠️ יחס החזר של X% – מעל הסף הבנקאי של 40%!"
    - "🔍 זוהו תשלומים ל-3 חברות ביטוח שונות – חשד לכפילויות"
    - "💰 הלוואה של ₪X בחודש – שווה לבדוק מיחזור"
    - "🏠 משכנתא: X ש״ח לחודש – בנק Y"
    - "📊 זוהו X מקורות הכנסה – confidence ממוצע: Y%"
    - "✅ משכורת מאומתת בקוד MSB 71: ₪X"
    - "⚡ זוהו X העברות Bit – הכנסה מזדמנת"

12. advisor_summary: סיכום קצר וממוקד (2-3 משפטים) לסוכן/יועץ. כלול מידע על מקורות הכנסה, שם מעסיק, רמת הביטחון, ושיטת האימות.

13. cross_reference_status: "green" אם הכל תקין, "yellow" אם יש פערים קטנים (5-10%), "red" אם יש פערים גדולים (מעל 10%) או התראות קריטיות.
${crossRefInstruction}

אם שדה לא נמצא, השתמש ב-null. החזר JSON בלבד, ללא טקסט נוסף.`;

    // Limit to first 2 pages for performance, unless deep_scan is true
    const maxPages = deep_scan ? imageList.length : 2;
    const limitedImages = imageList.slice(0, maxPages);
    const pageCount = limitedImages.length;
    const totalPages = imageList.length;
    const userContent: any[] = [
      {
        type: "text",
        text: text || (totalPages > 1
          ? `בצע ביקורת מקצועית על דף חשבון הבנק המצורף (מוצגים ${pageCount} עמודים מתוך ${totalPages}). שלב את כל הנתונים מכל העמודים לתוצאה אחת.`
          : "בצע ביקורת מקצועית על דף חשבון הבנק המצורף."),
      },
    ];

    for (const img of limitedImages) {
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

    // Post-process: recalculate DTI correctly on the server side
    if (analysis && !analysis.error) {
      const income = Number(analysis.salary_verification?.average_monthly_deposit) || Number(analysis.verified_salary) || 0;
      const obligations = Number(analysis.total_monthly_obligations) || 0;

      if (income > 0 && obligations > 0) {
        const dti = Math.round((obligations / income) * 100);
        if (dti > 100) {
          // Flag as data error - debts > income is almost certainly wrong extraction
          analysis.debt_to_income_ratio = null;
          analysis.total_dti_ratio = null;
          analysis.dti_status = "data_error";
          analysis.dti_display = "דורש בדיקה ידנית";
          console.log(`[analyze-bank-statement] DTI ${dti}% exceeds 100% — flagged as data_error (obligations=${obligations}, income=${income})`);
        } else {
          analysis.debt_to_income_ratio = dti;
          analysis.total_dti_ratio = dti;
          analysis.dti_status = dti < 30 ? "green" : dti <= 40 ? "yellow" : "red";
          analysis.dti_display = null;
        }
      }
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
