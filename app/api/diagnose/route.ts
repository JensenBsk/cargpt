import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert automotive diagnostic assistant with 20+ years of experience. You think like a mechanic texting a friend — not writing a report. Lead with the answer.

Return ONLY this JSON (no markdown, no text outside the JSON):

{
  "whatsWrong": "MAX 2 SENTENCES. First = what's wrong. Second = why symptoms confirm it. Hard limit.",
  "modNote": "1 sentence on how mods change this diagnosis — ONLY if mods are listed AND they matter. Omit entirely if not.",
  "driveSafety": {
    "verdict": "STOP | CAUTION | OKAY",
    "reason": "MAX 1 SENTENCE. Specific to this fault."
  },
  "rankedCauses": [
    {
      "rank": 1,
      "cause": "Specific cause name",
      "reasoning": "MAX 2 SENTENCES. Why this car, why this symptom, why ranked here.",
      "likelihood": "Most Likely | Likely | Possible | Unlikely but serious",
      "modRelated": false
    }
  ],
  "diagnosticSteps": [
    {
      "step": 1,
      "action": "MAX 10 WORDS. Punchy verb phrase. The one-line label.",
      "why": "MAX 1 SENTENCE. What does this test prove?",
      "ifResultA": "MAX 1 SENTENCE. Start with the conclusion.",
      "ifResultB": "MAX 1 SENTENCE. Start with the conclusion.",
      "cost": "Dollar amount only: 'Free' or '$X' or '$X–$Y'",
      "time": "Time only: '5 min' or '30 min'",
      "tools": "Tool name or 'None'"
    }
  ],
  "costEstimates": [
    {
      "fix": "Repair name",
      "parts": "$X–$Y",
      "labor": "$X–$Y",
      "total": "$X–$Y",
      "note": "Optional: dealer vs independent, ZIP code impact"
    }
  ],
  "dontDoThis": ["MAX 8 WORDS. Blunt. No explanation."],
  "mechanicEscalation": {
    "needed": true,
    "reason": "Why professional help is needed and what kind of shop"
  }
}

HARD RULES — violating these makes the response wrong:
- whatsWrong: 2 sentences max, no exceptions
- driveSafety.reason: 1 sentence max
- Each cause reasoning: 2 sentences max
- Each step action: 10 words max
- Each step why/ifResultA/ifResultB: 1 sentence max, starts with conclusion
- Each dontDoThis item: 8 words max
- Never say "your vehicle" — use the car's name
- Never say "could potentially" — say "probably" or "likely"
- Never start with "It's important to note" or "Please be aware"
- Step 1 MUST be hands-on with zero tools — look, listen, smell, feel, wiggle, swap. NEVER a scanner step.
- Sequence steps: highest probability cause, cheapest test first
- Return ONLY valid JSON
- Include 3–5 ranked causes, 3–6 diagnostic steps
- modRelated: true only when a mod (catless, tune, intake) is the likely trigger, not a mechanical fault
- Factor in mods explicitly if listed
- Factor in ZIP labor rates if provided (NYC/LA = 40–60% above avg; rural midwest = 20–30% below)
- Factor in VIN specs and dashboard photos if provided`;

export function selectModel(params: {
  hasImage?: boolean;
  isModified?: boolean;
  hasMultipleCodes?: boolean;
  isFollowUp?: boolean;
  followUpLength?: number;
}): string {
  if (params.hasImage) return "claude-sonnet-4-6";
  if (params.isModified || params.hasMultipleCodes) return "claude-sonnet-4-6";
  if ((params.followUpLength ?? 0) > 150) return "claude-sonnet-4-6";
  if (params.isFollowUp) return "claude-haiku-4-5-20251001";
  return "claude-haiku-4-5-20251001";
}

export async function POST(request: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json({ error: "API key not configured" }, { status: 500 });
    }

    const { year, make, model, issue, conversationHistory, mods, hasTune, zip, dashboardImage, vinData, refinementAnswers } =
      await request.json();

    if (!year || !make || !model || !issue) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const isFollowUp = Array.isArray(conversationHistory) && conversationHistory.length > 0;
    const hasMultipleCodes = !isFollowUp && /\bP[0-9]{4}\b/i.test(issue) &&
      issue.split(/[,;.]/).filter((s: string) => s.trim().length > 3).length >= 3;

    const modelId = selectModel({
      hasImage: !!dashboardImage,
      isModified: !!mods,
      hasMultipleCodes,
      isFollowUp,
      followUpLength: isFollowUp ? issue.length : 0,
    });

    const vinContext = vinData
      ? `\nVIN Specs: ${vinData.engine || ""} ${vinData.drivetrain || ""} ${vinData.fuelType || ""}`.trim()
      : "";

    const userTextContent = isFollowUp
      ? issue
      : [
          `Vehicle: ${year} ${make} ${model}`,
          mods ? `Modifications: ${mods}${hasTune ? " — currently running a tune" : ""}` : null,
          zip ? `Location: ZIP ${zip} (factor local labor rates into cost estimates)` : null,
          vinContext || null,
          `Issue: ${issue}`,
          refinementAnswers ? `\nUSER CLARIFICATION ANSWERS:\n${refinementAnswers}\n\nFactor these into a refined diagnosis. If they confirm the top cause, say so confidently. If they shift the rankings, update and explain why briefly.` : null,
        ]
          .filter(Boolean)
          .join("\n");

    let content: Anthropic.MessageParam["content"];
    if (!isFollowUp && dashboardImage) {
      const base64Data = dashboardImage.includes(",") ? dashboardImage.split(",")[1] : dashboardImage;
      content = [
        { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64Data } },
        { type: "text", text: userTextContent },
      ];
    } else {
      content = userTextContent;
    }

    const messages: Anthropic.MessageParam[] = isFollowUp
      ? [...conversationHistory, { role: "user", content: issue }]
      : [{ role: "user", content }];

    const systemContent = isFollowUp
      ? `You are an expert automotive diagnostic assistant. The user has already received a diagnosis for their ${year} ${make} ${model}. Answer their follow-up question conversationally, as a knowledgeable mechanic friend would. Be direct, specific, and honest. Reference the previous diagnosis context where relevant.`
      : SYSTEM_PROMPT;

    const response = await client.messages.create({
      model: modelId,
      max_tokens: 4096,
      system: [{ type: "text", text: systemContent, cache_control: { type: "ephemeral" } }],
      messages,
    });

    const block = response.content[0];
    if (block.type !== "text") throw new Error("Unexpected response type from model");

    if (isFollowUp) return Response.json({ reply: block.text });

    // Strip markdown code fences if Claude wrapped the JSON
    const raw = block.text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
    const parsed = JSON.parse(raw);
    return Response.json({ diagnosis: parsed });
  } catch (err) {
    console.error("Diagnose error:", err);
    if (err instanceof SyntaxError) {
      return Response.json({ error: "Failed to parse diagnostic response. Please try again." }, { status: 500 });
    }
    return Response.json({ error: "Diagnostic service unavailable. Please try again." }, { status: 500 });
  }
}
