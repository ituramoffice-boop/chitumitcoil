import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type EmailType =
  | "new_lead"
  | "send_scan_link"
  | "analysis_ready"
  | "welcome_consultant"
  | "subscription_confirm";

interface EmailRequest {
  type: EmailType;
  to: string;
  data: Record<string, any>;
}

function buildEmail(type: EmailType, data: Record<string, any>): { subject: string; html: string } {
  const brandColor = "#D4AF37";
  const wrapper = (content: string) => `
    <div dir="rtl" style="font-family:'Segoe UI',Arial,sans-serif;background:#1a1a2e;padding:40px 20px;color:#fff;">
      <div style="max-width:600px;margin:0 auto;background:#16213e;border-radius:16px;overflow:hidden;border:1px solid ${brandColor}33;">
        <div style="background:linear-gradient(135deg,${brandColor},#b8962e);padding:24px 32px;text-align:center;">
          <h1 style="margin:0;font-size:24px;color:#1a1a2e;">חיתומית SCORE</h1>
        </div>
        <div style="padding:32px;">${content}</div>
        <div style="padding:16px 32px;border-top:1px solid ${brandColor}22;text-align:center;font-size:12px;color:#888;">
          חיתומית — האישור בדרך, תהיה מאושר.
        </div>
      </div>
    </div>`;

  switch (type) {
    case "new_lead": {
      const name = data.name || "לא ידוע";
      const scanType = data.scan_type || "כללי";
      const wowAlerts = Array.isArray(data.wow_alerts)
        ? data.wow_alerts.map((a: string) => `<li style="margin:4px 0;padding:8px 12px;background:#ffffff0a;border-radius:8px;border-right:3px solid ${brandColor};">${a}</li>`).join("")
        : "";
      return {
        subject: `🔔 ליד חדש התקבל: ${name}`,
        html: wrapper(`
          <h2 style="color:${brandColor};margin:0 0 16px;">ליד חדש התקבל!</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#aaa;">שם:</td><td style="padding:8px 0;font-weight:bold;">${name}</td></tr>
            <tr><td style="padding:8px 0;color:#aaa;">סוג סריקה:</td><td style="padding:8px 0;">${scanType}</td></tr>
            ${data.phone ? `<tr><td style="padding:8px 0;color:#aaa;">טלפון:</td><td style="padding:8px 0;">${data.phone}</td></tr>` : ""}
            ${data.email ? `<tr><td style="padding:8px 0;color:#aaa;">אימייל:</td><td style="padding:8px 0;">${data.email}</td></tr>` : ""}
          </table>
          ${wowAlerts ? `<h3 style="color:${brandColor};margin:20px 0 8px;">ממצאים עיקריים:</h3><ul style="list-style:none;padding:0;margin:0;">${wowAlerts}</ul>` : ""}
        `),
      };
    }

    case "send_scan_link": {
      const advisorName = data.advisor_name || "היועץ שלך";
      const link = data.link || "#";
      return {
        subject: `📊 קישור לסריקה פיננסית חינמית`,
        html: wrapper(`
          <h2 style="color:${brandColor};margin:0 0 16px;">סריקה פיננסית חינמית</h2>
          <p style="font-size:16px;line-height:1.6;color:#ccc;">
            הסוכן <strong style="color:#fff;">${advisorName}</strong> שלח לך קישור לסריקה פיננסית חינמית.
          </p>
          <p style="font-size:14px;color:#aaa;">הסריקה תאפשר לך לגלות חסכונות נסתרים, כפילויות ביטוח, ולקבל תמונה מלאה על המצב הפיננסי שלך.</p>
          <div style="text-align:center;margin:28px 0;">
            <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,${brandColor},#b8962e);color:#1a1a2e;padding:14px 40px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;">
              התחל סריקה עכשיו
            </a>
          </div>
        `),
      };
    }

    case "analysis_ready": {
      const findingsCount = data.findings_count || 0;
      const link = data.link || "#";
      const rawClientName = data.client_name || "";
      const clientName = rawClientName && rawClientName !== "לקוח חיתומית" ? rawClientName : "";
      const greeting = clientName ? `שלום ${clientName},` : "שלום לקוח יקר,";
      const scanType = data.scan_type || "פיננסי";
      const wowAlerts = Array.isArray(data.wow_alerts)
        ? data.wow_alerts.slice(0, 3).map((a: string) => `<li style="margin:4px 0;padding:8px 12px;background:#ffffff0a;border-radius:8px;border-right:3px solid ${brandColor};">${a}</li>`).join("")
        : "";
      return {
        subject: `✅ הדוח הפיננסי שלך מוכן${clientName ? ` — ${clientName}` : ""} — ${findingsCount} ממצאים`,
        html: wrapper(`
          <h2 style="color:${brandColor};margin:0 0 16px;">הדוח הפיננסי שלך מוכן! 🎉</h2>
          <p style="font-size:16px;color:#ccc;"><strong style="color:#fff;">${greeting}</strong></p>
          <p style="font-size:16px;line-height:1.6;color:#ccc;">
            סיימנו לנתח את ה${scanType} שלך ומצאנו
            <strong style="color:${brandColor};font-size:20px;"> ${findingsCount} </strong> ממצאים חשובים.
          </p>
          ${wowAlerts ? `<h3 style="color:${brandColor};margin:20px 0 8px;">ממצאים מרכזיים:</h3><ul style="list-style:none;padding:0;margin:0;">${wowAlerts}</ul>` : ""}
          <div style="text-align:center;margin:28px 0;">
            <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,${brandColor},#b8962e);color:#1a1a2e;padding:14px 40px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;">
              צפה בדוח המלא
            </a>
          </div>
          <p style="font-size:13px;color:#888;text-align:center;">הדוח זמין לצפייה בכל עת דרך הקישור למעלה</p>
        `),
      };
    }

    case "welcome_consultant": {
      const name = data.name || "";
      return {
        subject: `🎉 ברוך הבא לחיתומית SCORE`,
        html: wrapper(`
          <h2 style="color:${brandColor};margin:0 0 16px;">ברוך הבא${name ? ` ${name}` : ""}!</h2>
          <p style="font-size:16px;line-height:1.6;color:#ccc;">
            אנחנו שמחים שהצטרפת לחיתומית SCORE — הפלטפורמה המובילה ליועצי משכנתאות וסוכני ביטוח בישראל.
          </p>
          <ul style="list-style:none;padding:0;margin:20px 0;">
            <li style="margin:8px 0;padding:10px 16px;background:#ffffff0a;border-radius:8px;">🤖 ניתוח AI חכם של מסמכים פיננסיים</li>
            <li style="margin:8px 0;padding:10px 16px;background:#ffffff0a;border-radius:8px;">📊 CRM מתקדם לניהול לידים</li>
            <li style="margin:8px 0;padding:10px 16px;background:#ffffff0a;border-radius:8px;">📱 דשבורד נייד מותאם</li>
          </ul>
          <div style="text-align:center;margin:28px 0;">
            <a href="https://chitumitcoil.lovable.app/dashboard" style="display:inline-block;background:linear-gradient(135deg,${brandColor},#b8962e);color:#1a1a2e;padding:14px 40px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;">
              התחל עכשיו
            </a>
          </div>
        `),
      };
    }

    case "subscription_confirm": {
      const plan = data.plan || "Pro";
      return {
        subject: `✅ המנוי שלך אושר — ${plan}`,
        html: wrapper(`
          <h2 style="color:${brandColor};margin:0 0 16px;">המנוי שלך אושר בהצלחה!</h2>
          <p style="font-size:16px;line-height:1.6;color:#ccc;">
            תוכנית <strong style="color:${brandColor};">${plan}</strong> הופעלה בהצלחה.
          </p>
          <p style="font-size:14px;color:#aaa;">כל הפיצ'רים המתקדמים זמינים לך עכשיו. בהצלחה!</p>
          <div style="text-align:center;margin:28px 0;">
            <a href="https://chitumitcoil.lovable.app/dashboard" style="display:inline-block;background:linear-gradient(135deg,${brandColor},#b8962e);color:#1a1a2e;padding:14px 40px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;">
              כניסה לדשבורד
            </a>
          </div>
        `),
      };
    }

    default:
      throw new Error(`Unknown email type: ${type}`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const body: EmailRequest = await req.json();
    const { type, to, data } = body;

    if (!type || !to) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: type, to" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { subject, html } = buildEmail(type, data || {});

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: data?.from || "חיתומית SCORE <reports@chitumit.co.il>",
        to: [to],
        subject,
        html,
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      console.error("Resend API error:", resendData);
      return new Response(
        JSON.stringify({ error: resendData.message || "Failed to send email" }),
        { status: resendRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Email sent successfully: type=${type}, to=${to}, id=${resendData.id}`);

    return new Response(
      JSON.stringify({ success: true, id: resendData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
