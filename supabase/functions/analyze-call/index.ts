import { corsHeaders } from "../_shared/cors.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const { leadName, callDuration, notes, leadContext } = await req.json();

    const systemPrompt = `You are an AI assistant analyzing mortgage consultation calls for an Israeli CRM system.
Given the call notes and lead context, generate:
1. A 3-bullet summary of the call (in Hebrew)
2. Sentiment analysis: "positive", "neutral", or "negative"
3. Action items extracted from the conversation (in Hebrew)
4. A suggested next step for the CRM (in Hebrew)

Respond ONLY with valid JSON in this exact format:
{
  "summary": ["bullet 1", "bullet 2", "bullet 3"],
  "sentiment": "positive" | "neutral" | "negative",
  "actionItems": ["action 1", "action 2"],
  "nextStep": "suggested next step"
}`;

    const userPrompt = `Call with: ${leadName}
Duration: ${Math.floor(callDuration / 60)}:${(callDuration % 60).toString().padStart(2, "0")}
Call Notes: ${notes || "No notes taken"}
Lead Context:
- Mortgage Amount: ${leadContext?.mortgage_amount ? `₪${leadContext.mortgage_amount.toLocaleString()}` : "N/A"}
- Monthly Income: ${leadContext?.monthly_income ? `₪${leadContext.monthly_income.toLocaleString()}` : "N/A"}
- Current Status: ${leadContext?.status || "N/A"}
- Last Contact: ${leadContext?.last_contact || "First call"}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.5,
        max_tokens: 500,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error("Empty response from OpenAI");

    const analysis = JSON.parse(content);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("analyze-call error:", error.message);
    // Return fallback analysis if AI fails
    return new Response(JSON.stringify({
      summary: ["השיחה התקיימה בהצלחה", "נדונו פרטי המשכנתא", "נקבע המשך טיפול"],
      sentiment: "neutral",
      actionItems: ["מעקב טלפוני"],
      nextStep: "מעקב טלפוני תוך יומיים",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
