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

const BANK_EXTRACTION_SYSTEM_PROMPT = `🚨 כלל עמודות קריטי — קרא לפני הכל:
דפי בנק ישראלי מכילים 5 עמודות (מימין לשמאל):
| תיאור | אסמכתא | חיוב | זיכוי | יתרה |
| Description | Reference | Debit(out) | Credit(in) | Balance |

⛔ עמודת יתרה (Balance) — התעלם לחלוטין!
היתרה היא סכום מצטבר רץ — היא אינה תנועה כלל!
לעולם אל תחלץ ערכים מעמודת היתרה כחיוב או זיכוי.
אם אתה רואה מספרים כמו 19,223 / 18,624 / 19,438 — אלה יתרות חשבון, לא הוצאות!

⛔ מסגרת משכורת — התעלם לחלוטין!
אם שורה מכילה המילה "מסגרת" — זהו מסגרת אשראי בלבד, לא משכורת!
לעולם אל תרשום אותה כהכנסה ב-verified_salary.

You are an expert Israeli bank statement parser.
Your task is to extract structured transaction data from the provided bank statement image(s).

## CRITICAL RULES FOR DEBIT vs CREDIT:

### HOW TO DETERMINE IF A TRANSACTION IS DEBIT OR CREDIT:
In Israeli bank statements, each row has EITHER a value in the חיוב (Debit) column OR in the זיכוי (Credit) column, NEVER BOTH.
- If the amount appears in the חיוב column (3rd from right) → it is a DEBIT (money OUT), set: type="debit", debit=<amount>, credit=null
- If the amount appears in the זיכוי column (4th from right) → it is a CREDIT (money IN), set: type="credit", credit=<amount>, debit=null
- The 5th column (leftmost, יתרה) is ALWAYS the running balance — NEVER extract it as debit or credit.

### SALARY / INCOME DETECTION (CRITICAL):
✅ Salary deposits appear in the זיכוי (Credit) column. They are INCOMING money.
✅ MSB code 71 or 72 in the reference = salary transfer. These are ALWAYS credits (type="credit").
✅ Any transaction with reference code starting with 71/ or 72/ and appearing in the credit column is salary.
✅ Set verified_salary to the credit amount of the MSB 71/72 transaction.
✅ Set verified_by to "MSB code 71" or "MSB code 72".
⛔ MSB code 71/72 is NEVER a debit. If you see it, it MUST be type="credit".
⛔ If a row contains "מסגרת" → IGNORE IT completely. It is a credit limit, NOT salary.

### REFERENCE CODE BASED CLASSIFICATION:
- Code 71, 72 (first number before /) → SALARY (credit, money IN)
- Code 175, 106360812 → Bit transfer (could be credit or debit, check column)
- Code 4153, 6147 → Credit card aggregate (debit, money OUT) — NOT a loan
- Code 469 → Loan repayment (debit, money OUT)
- Code 515 → Standing order / direct debit (debit, money OUT)
- Code 10734 → Check deposit (credit, money IN)

### LIABILITIES (for DTI calculation):
✅ Only count as liabilities:
  - Loans: description contains 'הו"ק הלואה', 'הלוואה', 'משכנתא', or reference code 469
  - Mortgage payments
⛔ EXCLUDE from liabilities:
  - Credit card aggregates (דירקט-מצטבר, codes 4153, 6147)
  - Standing orders for services (ועד בית, חינוך, etc.)

## VERIFIED SALARY CALCULATION:
1. Find all credit transactions with MSB code 71 or 72 → these are salary deposits.
2. If found, set verified_salary = the amount of that credit transaction.
3. If multiple months visible, set salary_verification.net_deposits = array of all salary amounts.
4. Set salary_verification.average_monthly_deposit = average of those amounts.
5. If no MSB 71/72 found, look for recurring monthly credits with similar amounts and descriptions containing "משכורת" or "שכר".

## OUTPUT FORMAT:
Return ONLY a valid JSON object with this structure:
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
      "date": "DD/MM/YYYY",
      "description": "string",
      "reference_code": "string or null",
      "debit": "number or null (set ONLY if money is leaving the account)",
      "credit": "number or null (set ONLY if money is entering the account)",
      "amount": 0,
      "type": "debit | credit",
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
      "source_name": "שם המקור",
      "source_type": "salary|pension|rental|freelance|bit_transfer|other",
      "monthly_amount": 0,
      "frequency": "monthly|irregular",
      "reference_codes": [],
      "bank_codes": [],
      "verification_method": "string",
      "confidence_score": 0.95,
      "confidence_reason": "string"
    }
  ],
  "total_monthly_obligations": 0,
  "total_dti_ratio": 0,
  "dti_status": "green|yellow|red",
  "employer": {
    "name": "שם המעסיק",
    "confidence": "high|medium|low",
    "verification_method": "string",
    "needs_manual_verification": false
  },
  "employer_name": "שם המעסיק לתצוגה מהירה",
  "health_insurance": {
    "provider": "מכבי|מאוחדת|כללית|לאומית|unknown",
    "monthly_payment": 0,
    "confidence": "high|medium|low"
  },
  "wow_alerts": [],
  "debt_to_income_ratio": 0,
  "advisor_summary": "סיכום קצר לסוכן",
  "cross_reference_status": "green|yellow|red",
  "summary": {
    "verifiedSalary": 0,
    "totalLiabilities": 0,
    "totalCredits": 0,
    "totalDebits": 0
  }
}

CRITICAL REMINDERS:
- debit field = money OUT, credit field = money IN. For each transaction, set ONE of them, not both.
- MSB code 71/72 = SALARY = ALWAYS credit (money IN). Never classify it as debit.
- Balance column values must NEVER appear in any transaction.
- verified_salary must be > 0 if any MSB 71/72 credit transaction exists.
- Do NOT add any explanation or markdown — return raw JSON only.
${crossRefInstruction}`;

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
          { role: "system", content: BANK_EXTRACTION_SYSTEM_PROMPT },
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

    // Post-process: recalculate DTI, excluding false-positive "דירקט"/"מצטבר"/"משיכה" items
    if (analysis && !analysis.error) {
      const income = Number(analysis.salary_verification?.average_monthly_deposit) || Number(analysis.verified_salary) || 0;

      // Exclusion filter for DTI: descriptions containing these are NOT real obligations
      const DTI_EXCLUDE_WORDS = ["דירקט", "מצטבר", "משיכה"];
      const shouldExclude = (desc: string) => DTI_EXCLUDE_WORDS.some(w => desc.includes(w));

      // Sum recurring debits from structured fields
      let recurringDebits = 0;

      // Mortgage payment
      if (analysis.mortgage?.detected && analysis.mortgage?.monthly_payment) {
        const desc = String(analysis.mortgage.description || "");
        if (!shouldExclude(desc)) {
          recurringDebits += Number(analysis.mortgage.monthly_payment) || 0;
        }
      }

      // Existing loans (filter out false positives)
      if (Array.isArray(analysis.existing_loans)) {
        for (const loan of analysis.existing_loans) {
          const desc = String(loan.description || "");
          if (!shouldExclude(desc)) {
            recurringDebits += Number(loan.monthly_payment) || 0;
          }
        }
      }

      // Insurance charges
      if (Array.isArray(analysis.insurance_charges)) {
        for (const ins of analysis.insurance_charges) {
          recurringDebits += Number(ins.monthly_amount) || 0;
        }
      }

      // Standing orders (הוראות קבע)
      if (Array.isArray(analysis.standing_orders)) {
        for (const so of analysis.standing_orders) {
          const desc = String(so.description || "");
          if (!shouldExclude(desc)) {
            recurringDebits += Number(so.monthly_amount) || 0;
          }
        }
      }

      // Update total_monthly_obligations with our recalculated sum
      analysis.total_monthly_obligations = recurringDebits;

      console.log(`[analyze-bank-statement] DTI recalc: income=${income}, recurringDebits=${recurringDebits}`);

      if (recurringDebits === 0) {
        analysis.debt_to_income_ratio = 0;
        analysis.total_dti_ratio = 0;
        analysis.dti_status = "green";
        analysis.dti_display = null;
      } else if (income > 0) {
        const dti = parseFloat(((recurringDebits / income) * 100).toFixed(1));
        if (dti > 150) {
          analysis.debt_to_income_ratio = null;
          analysis.total_dti_ratio = null;
          analysis.dti_status = "calculation_error";
          analysis.dti_display = "—";
          console.log(`[analyze-bank-statement] DTI ${dti}% exceeds 150% — flagged as calculation_error`);
        } else {
          analysis.debt_to_income_ratio = dti;
          analysis.total_dti_ratio = dti;
          analysis.dti_status = dti < 30 ? "green" : dti <= 40 ? "yellow" : "red";
          analysis.dti_display = null;
        }
      } else {
        analysis.debt_to_income_ratio = null;
        analysis.total_dti_ratio = null;
        analysis.dti_status = "calculation_error";
        analysis.dti_display = "—";
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
