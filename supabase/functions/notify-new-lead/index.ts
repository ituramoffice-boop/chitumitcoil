import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { consultantId, leadName, leadPhone, leadScore, calcType, calcSummary } = await req.json();

    if (!consultantId || !leadName) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get consultant profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name, whatsapp_phone, plan, lead_count")
      .eq("user_id", consultantId)
      .maybeSingle();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Consultant not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check plan limits
    const planLimits: Record<string, number> = { free: 10, pro: 100, enterprise: 999999 };
    const limit = planLimits[profile.plan || "free"] || 10;
    const currentCount = profile.lead_count || 0;

    if (currentCount >= limit) {
      return new Response(JSON.stringify({ error: "Lead limit reached", plan: profile.plan }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Increment lead count
    await supabase
      .from("profiles")
      .update({ lead_count: currentCount + 1 })
      .eq("user_id", consultantId);

    // Create in-app notification
    await supabase.from("notifications").insert({
      user_id: consultantId,
      title: `🔥 ליד חם חדש: ${leadName}`,
      body: `${calcSummary || ""} • ציון ${leadScore || 0} • ${calcType || "מחשבון"}`,
      type: (leadScore || 0) >= 70 ? "urgent" : "info",
      link: "/dashboard/clients",
    });

    // Send email notification via Lovable AI
    if (profile.email) {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (LOVABLE_API_KEY) {
        try {
          const emailBody = `
שלום ${profile.full_name || "יועץ"},

ליד חדש נכנס למערכת דרך הקישור האישי שלך:

📋 שם: ${leadName}
📞 טלפון: ${leadPhone || "לא צוין"}
📊 ציון ליד: ${leadScore || 0}
🏠 מקור: ${calcType || "מחשבון"}
${calcSummary ? `📝 פרטים: ${calcSummary}` : ""}

היכנס לדשבורד לצפייה בפרטים המלאים.

בהצלחה,
SmartMortgage AI
          `.trim();

          const response = await fetch(
            `${supabaseUrl}/functions/v1/send-transactional-email`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({
                to: profile.email,
                subject: `🔥 ליד חדש: ${leadName} - SmartMortgage AI`,
                text: emailBody,
              }),
            }
          );
          // Best-effort email - don't fail if email service isn't set up
          console.log("Email notification attempt:", response.status);
        } catch (emailErr) {
          console.log("Email notification failed (non-critical):", emailErr);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, leadCount: currentCount + 1, limit }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("notify-new-lead error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
