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

    const systemPrompt = `אתה רואה חשבון בכיר ומומחה לביטוח ופנסיה ישראלי עם 20 שנות ניסיון. בצע ביקורת מקצועית (Professional Audit) על תלוש השכר.

החזר JSON בלבד עם המבנה הבא:

{
  "personal": {
    "full_name": "שם מלא של העובד",
    "phone": "מספר טלפון אם מופיע, אחרת null",
    "employer": "שם המעסיק"
  },
  "salary": {
    "gross_salary": 0,
    "net_salary": 0,
    "pensionable_salary": 0
  },
  "pension_audit": {
    "pensionable_salary": 0,
    "employer_contribution_actual": 0,
    "employer_contribution_percent": 0,
    "employer_contribution_legal_min": 6.5,
    "employee_contribution_actual": 0,
    "employee_contribution_percent": 0,
    "employee_contribution_legal_min": 6.0,
    "severance_contribution_actual": 0,
    "severance_contribution_percent": 0,
    "severance_contribution_legal_min": 8.33,
    "destination_institution": "שם הגוף המנהל (מנורה/מגדל/הראל/כלל/הפניקס/אלטשולר/אחר)",
    "employer_gap_shekel": 0,
    "employee_gap_shekel": 0,
    "severance_gap_shekel": 0,
    "total_missing_money": 0
  },
  "insurance_audit": {
    "health_insurance_deduction": null,
    "life_risk_deduction": null,
    "group_insurance_deduction": null,
    "has_double_insurance": false,
    "double_insurance_details": "פירוט כפל ביטוח אם קיים, אחרת null"
  },
  "wow_alerts": [
    "התראות טקסטואליות קצרות על ממצאים חריגים"
  ],
  "total_monthly_waste": 0,
  "agent_summary": "סיכום ביקורת קצר וממוקד לסוכן הביטוח"
}

הנחיות לביקורת:

1. שכר פנסיוני (Pensionable Salary): זהה את "שכר הבסיס" או "ברוטו לפנסיה" – לא את הברוטו הכולל.

2. בדיקת הפרשות פנסיה:
   - הפרשת מעסיק: המינימום החוקי 6.5% משכר פנסיוני. חשב את האחוז בפועל וזהה פער.
   - הפרשת עובד: המינימום 6%. חשב אחוז בפועל וזהה פער.
   - פיצויים: המינימום 8.33%. חשב אחוז בפועל וזהה פער.
   - total_missing_money = סך כל הפערים בש"ח.

3. גוף מנהל (Destination Institution): חפש את שמות החברות בעברית בשורות הפנסיה/גמל/ביטוח מנהלים:
   - מנורה / מבטחים → "Menora"
   - הראל → "Harel"
   - מגדל → "Migdal"
   - מקפת → "Makefet"
   - כלל → "Clal"
   - הפניקס → "Phoenix"
   - אלטשולר שחם → "Altshuler Shaham"
   - מיטב דש → "Meitav Dash"
   - איילון → "Ayalon"
   - פסגות → "Psagot"
   - הכשרה → "Hachshara"
   סוגי קופות לחיפוש: קרן פנסיה, קופת גמל, קרן השתלמות, ביטוח מנהלים, אובדן כושר עבודה (אכ"ע), ביטוח בריאות.
   שמור את השם העברי המקורי בשדה destination_institution_hebrew ואת השם באנגלית ב-destination_institution.

4. בדיקת ביטוחים:
   - health_insurance_deduction: סכום ניכוי לביטוח בריאות/שב"ן אם קיים.
   - life_risk_deduction: סכום ניכוי לביטוח חיים/ריסק אם קיים.
   - group_insurance_deduction: סכום ניכוי לביטוח קבוצתי אם קיים.
   - has_double_insurance: true אם יש ניכוי לתוכנית בריאות פרטית/קבוצתית (כפל מול ביטוח הבריאות הממלכתי).

5. wow_alerts: צור התראות קצרות ואימפקטיביות. דוגמאות:
   - "חסרים X ש״ח בהפרשת מעסיק לפנסיה – כסף שנשאר אצל המעסיק!"
   - "כפל ביטוח בריאות – משלם על כיסוי כפול"
   - "אין הפרשה לפיצויים – סיכון בפיטורין"

6. total_monthly_waste = total_missing_money + סכום כפלי ביטוח אם קיימים.

אם שדה לא נמצא בתלוש, השתמש ב-null. החזר JSON בלבד, ללא טקסט נוסף.`;

    const pageCount = imageList.length;
    const userContent: any[] = [
      { type: "text", text: text || (pageCount > 1 ? `בצע ביקורת מקצועית על תלוש השכר המצורף (${pageCount} עמודים). שלב את כל הנתונים מכל העמודים לתוצאה אחת.` : "בצע ביקורת מקצועית על תלוש השכר המצורף.") },
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
    console.error("analyze-payslip error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
