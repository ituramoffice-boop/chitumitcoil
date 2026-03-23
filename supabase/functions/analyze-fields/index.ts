import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { lead, documentType, customFields } = await req.json();

    const prompt = `You are a smart document assistant for a mortgage consulting firm called SmartMortgage.

Given the following lead/client data:
- Name: ${lead.full_name || "N/A"}
- Phone: ${lead.phone || "N/A"}
- Email: ${lead.email || "N/A"}
- Mortgage Amount: ${lead.mortgage_amount || "N/A"}
- Property Value: ${lead.property_value || "N/A"}
- Monthly Income: ${lead.monthly_income || "N/A"}

Document type: ${documentType || "mortgage consultation agreement"}
${customFields ? `Additional context: ${customFields}` : ""}

Generate the following:
1. A list of smart fields for this document with auto-filled values from the lead data
2. Identify any missing critical fields that should be filled
3. Generate professional agreement text in Hebrew for this document type
4. Suggest any additional clauses relevant to this type of agreement`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a professional document analysis assistant. Always respond in valid JSON." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_smart_fields",
              description: "Generate smart fields for a document based on lead data",
              parameters: {
                type: "object",
                properties: {
                  fields: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        label: { type: "string", description: "Hebrew label" },
                        value: { type: "string", description: "Auto-filled value or empty" },
                        type: { type: "string", enum: ["text", "number", "date", "email", "phone", "currency", "id_number", "address"] },
                        required: { type: "boolean" },
                        placeholder: { type: "string", description: "Hebrew placeholder" },
                        source: { type: "string", enum: ["auto", "manual"], description: "Whether auto-filled from lead data" },
                      },
                      required: ["id", "label", "type", "required", "source"],
                    },
                  },
                  missingFields: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        field: { type: "string" },
                        reason: { type: "string", description: "Why this field is needed, in Hebrew" },
                        priority: { type: "string", enum: ["critical", "important", "optional"] },
                      },
                      required: ["field", "reason", "priority"],
                    },
                  },
                  agreementText: { type: "string", description: "Professional agreement text in Hebrew" },
                  additionalClauses: {
                    type: "array",
                    items: { type: "string" },
                    description: "Additional relevant clauses in Hebrew",
                  },
                },
                required: ["fields", "missingFields", "agreementText", "additionalClauses"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_smart_fields" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-fields error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
