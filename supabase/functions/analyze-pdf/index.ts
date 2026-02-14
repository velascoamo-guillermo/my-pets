import Anthropic from "npm:@anthropic-ai/sdk@0.39.0";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

type LabValue = {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: "normal" | "high" | "low" | "critical";
  category?: string;
};

type AnalyzeRequest = {
  fileUrl: string;
  fileId: string;
  petId: string;
  visitId?: string;
  petSpecies?: "dog" | "cat";
  petAge?: string;
  previousAnalyses?: {
    date: string;
    labValues: LabValue[];
  }[];
};

type AnalyzeResponse = {
  success: boolean;
  labValues?: LabValue[];
  summary?: string;
  interpretation?: string;
  error?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify the request has a valid apikey (anon or service role)
    const apiKey =
      req.headers.get("apikey") ?? req.headers.get("x-api-key") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (apiKey !== anonKey && apiKey !== serviceKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anthropic = new Anthropic({
      apiKey: Deno.env.get("CLAUDE_API_KEY")!,
    });

    const {
      fileUrl,
      fileId,
      petId,
      visitId,
      petSpecies,
      petAge,
      previousAnalyses,
    }: AnalyzeRequest = await req.json();

    // Fetch PDF from public URL
    const pdfResponse = await fetch(fileUrl);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to fetch PDF: ${pdfResponse.statusText}`);
    }
    const pdfBuffer = await pdfResponse.arrayBuffer();
    const bytes = new Uint8Array(pdfBuffer);
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    const pdfBase64 = btoa(binary);

    // Build context prompt with species and age
    const petDescription = [
      petSpecies ?? "pet",
      petAge ? `(${petAge})` : "",
    ].filter(Boolean).join(" ");
    let contextPrompt = `You are analyzing veterinary lab results for a ${petDescription}. Consider the animal's species and age when interpreting reference ranges and clinical significance.`;

    if (previousAnalyses && previousAnalyses.length > 0) {
      contextPrompt += `\n\nPrevious lab results for comparison:\n`;
      for (const prev of previousAnalyses) {
        contextPrompt += `\nDate: ${prev.date}\n`;
        for (const val of prev.labValues) {
          contextPrompt += `- ${val.name}: ${val.value} ${val.unit} (${val.status})\n`;
        }
      }
    }

    // Call Claude API with PDF
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: pdfBase64,
              },
            },
            {
              type: "text",
              text: `${contextPrompt}

Extract all lab values from this veterinary test report. For each lab value, provide:
1. Test name
2. Value (numeric result)
3. Unit of measurement
4. Reference range (normal range)
5. Status: "normal", "high", "low", or "critical"
6. Category (e.g., "Complete Blood Count", "Blood Chemistry", "Urinalysis")

Then provide:
- A brief summary of the overall findings (2-3 sentences)
- Clinical interpretation highlighting any abnormal values and their significance

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "labValues": [
    {
      "name": "White Blood Cell Count",
      "value": "12.5",
      "unit": "K/μL",
      "referenceRange": "6.0-17.0",
      "status": "normal",
      "category": "Complete Blood Count"
    }
  ],
  "summary": "Overall summary here",
  "interpretation": "Clinical interpretation here"
}`,
            },
          ],
        },
      ],
    });

    // Parse Claude response
    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Extract JSON — handle both raw JSON and markdown code blocks
    const jsonMatch =
      responseText.match(/```json\n([\s\S]*?)\n```/) ??
      responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("Failed to parse Claude response as JSON");
    }

    const analysisData = JSON.parse(jsonMatch[1] ?? jsonMatch[0]);

    const response: AnalyzeResponse = {
      success: true,
      labValues: analysisData.labValues,
      summary: analysisData.summary,
      interpretation: analysisData.interpretation,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Analysis error:", error);

    const errorResponse: AnalyzeResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
