import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RED_FLAG_KEYWORDS = [
  { keyword: "אכ\"מ", severity: "critical", label: "אי כיסוי מספיק (אכ\"מ)" },
  { keyword: "אי כיסוי", severity: "critical", label: "אי כיסוי" },
  { keyword: "החזר", severity: "warning", label: "החזרת חיוב" },
  { keyword: "עיקול", severity: "critical", label: "עיקול" },
  { keyword: "צ'ק מוחזר", severity: "critical", label: "צ׳ק מוחזר" },
  { keyword: "חוב", severity: "warning", label: "חוב" },
  { keyword: "פיגור", severity: "warning", label: "פיגור בתשלום" },
  { keyword: "הלוואה", severity: "info", label: "הלוואה קיימת" },
  { keyword: "משיכת יתר", severity: "critical", label: "משיכת יתר" },
  { keyword: "ריבית פיגורים", severity: "warning", label: "ריבית פיגורים" },
  { keyword: "הוראת קבע שלא כובדה", severity: "critical", label: "הוראת קבע שלא כובדה" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { document_id } = await req.json();
    if (!document_id) {
      return new Response(JSON.stringify({ error: "document_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get document metadata
    const { data: doc, error: docErr } = await supabase
      .from("documents")
      .select("*")
      .eq("id", document_id)
      .single();

    if (docErr || !doc) {
      return new Response(JSON.stringify({ error: "Document not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download file from storage
    const { data: fileData, error: dlErr } = await supabase.storage
      .from("mortgage-documents")
      .download(doc.file_path);

    if (dlErr || !fileData) {
      return new Response(JSON.stringify({ error: "Failed to download file" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert to base64 for AI
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = doc.file_type || "application/pdf";

    // Call Lovable AI for OCR + analysis
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `אתה מנתח מסמכים פיננסיים לתחום המשכנתאות בישראל. 
עליך לחלץ את כל הטקסט מהמסמך ולנתח אותו.

החזר תשובה בפורמט הבא בלבד (JSON):
{
  "extracted_text": "הטקסט המלא שחולץ מהמסמך",
  "classification": "סוג המסמך: תלושי שכר / דפי עו\"ש / דו\"ח BDI / חוזה שכירות / צילום ת\"ז / אחר",
  "summary": "תקציר קצר של המסמך",
  "key_data": {
    "employer_name": "שם המעסיק (אם רלוונטי)",
    "net_salary": "שכר נטו (מספר בלבד, אם רלוונטי)",
    "bank_name": "שם הבנק (אם רלוונטי)",
    "account_number": "מספר חשבון (אם רלוונטי)",
    "credit_grade": "דירוג אשראי (אם רלוונטי)",
    "total_deposits": "סה\"כ הפקדות (מספר בלבד, אם רלוונטי)",
    "total_withdrawals": "סה\"כ משיכות (מספר בלבד, אם רלוונטי)"
  },
  "red_flags": [
    {"keyword": "מילת מפתח", "context": "ההקשר בו נמצאה", "severity": "critical/warning/info"}
  ]
}

החזר JSON בלבד, בלי markdown או טקסט נוסף.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `נתח את המסמך הבא. שם הקובץ: ${doc.file_name}. סיווג נוכחי: ${doc.classification || "לא מסווג"}.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse AI response
    let analysisResult: any;
    try {
      // Strip markdown code block if present
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      analysisResult = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", content);
      analysisResult = {
        extracted_text: content,
        classification: doc.classification,
        summary: "לא הצליח לנתח את המסמך",
        key_data: {},
        red_flags: [],
      };
    }

    // Scan extracted text for additional red flags
    const extractedText = analysisResult.extracted_text || "";
    const scannedFlags = [];
    for (const kw of RED_FLAG_KEYWORDS) {
      const regex = new RegExp(kw.keyword, "gi");
      const matches = extractedText.match(regex);
      if (matches) {
        scannedFlags.push({
          keyword: kw.keyword,
          severity: kw.severity,
          label: kw.label,
          count: matches.length,
        });
      }
    }

    // Merge AI-detected flags with keyword scan
    const allFlags = [
      ...scannedFlags,
      ...(analysisResult.red_flags || []).map((f: any) => ({
        keyword: f.keyword,
        severity: f.severity || "warning",
        label: f.keyword,
        count: 1,
        context: f.context,
      })),
    ];

    // Deduplicate by keyword
    const uniqueFlags = Object.values(
      allFlags.reduce((acc: Record<string, any>, flag: any) => {
        if (!acc[flag.keyword]) {
          acc[flag.keyword] = flag;
        } else {
          acc[flag.keyword].count = (acc[flag.keyword].count || 1) + (flag.count || 1);
        }
        return acc;
      }, {})
    );

    // Update document with extracted data
    const updatedClassification = analysisResult.classification || doc.classification;
    const { error: updateErr } = await supabase
      .from("documents")
      .update({
        extracted_data: {
          text: extractedText,
          summary: analysisResult.summary,
          key_data: analysisResult.key_data || {},
          analyzed_at: new Date().toISOString(),
        },
        classification: updatedClassification,
        risk_flags: uniqueFlags,
      })
      .eq("id", document_id);

    if (updateErr) {
      console.error("Update error:", updateErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        classification: updatedClassification,
        summary: analysisResult.summary,
        key_data: analysisResult.key_data,
        red_flags: uniqueFlags,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("analyze-document error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
