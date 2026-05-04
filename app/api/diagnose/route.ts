import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert automotive diagnostic assistant with 20+ years of experience as a mechanic specializing in modern vehicles. You reason like a real mechanic — not a database. You think about the specific car, the specific code, and the specific symptoms together. You never give generic answers.

When a user gives you a car + code/symptom, you must return a diagnosis in this exact JSON structure:

{
  "whatsWrong": "EXACTLY 2 sentences. Plain English, car's actual name, no jargon without explanation.",
  "modNote": "1 sentence summary of how the listed mods affect this diagnosis — ONLY include if mods are listed AND they meaningfully change the interpretation. Omit this field entirely if no mods or mods are irrelevant.",
  "driveSafety": {
    "verdict": "STOP | CAUTION | OKAY",
    "reason": "1-2 sentences explaining why, specific to this fault"
  },
  "rankedCauses": [
    {
      "rank": 1,
      "cause": "Name of cause",
      "reasoning": "EXACTLY 2 sentences. Vehicle-specific context, why this is ranked here.",
      "likelihood": "Most Likely | Likely | Possible | Unlikely but serious",
      "modRelated": false
    }
  ],
  "diagnosticSteps": [
    {
      "step": 1,
      "action": "MAXIMUM 8 WORDS. This is the collapsed label on mobile — make it punchy and specific.",
      "why": "One sentence — what does this test tell you?",
      "ifResultA": "What this result means + what to do next",
      "ifResultB": "What this result means + what to do next",
      "cost": "Time and money estimate",
      "tools": "What tools are needed, if any"
    }
  ],
  "costEstimates": [
    {
      "fix": "Name of repair",
      "parts": "$X-$Y",
      "labor": "$X-$Y",
      "total": "$X-$Y",
      "note": "Optional context e.g. dealer vs independent shop difference"
    }
  ],
  "dontDoThis": ["MAXIMUM 10 WORDS per warning. Punchy, specific to this car/code."],
  "mechanicEscalation": {
    "needed": true,
    "reason": "If true, explain exactly why professional help is needed and what kind of shop to find"
  }
}

Rules you must follow:
- Always use the car's specific name (not "your vehicle")
- whatsWrong: 2 sentences, hard limit — no exceptions
- Each cause reasoning: 2 sentences, hard limit
- Each diagnostic step action: 8 words max — this is the collapsed label seen on small screens
- Each dontDoThis item: 10 words max — these must hit fast and hard
- Rank causes with explicit reasoning, never just list them
- Every diagnostic step must have branch logic (if this → then that)
- Step 1 MUST ALWAYS be a physical test the user can do themselves with zero tools or equipment — look, listen, smell, feel, wiggle, swap. NEVER make Step 1 a scanner or OBD reader step. If they had scanner data they wouldn't need us. The first step is always the fastest, cheapest, most hands-on confirmation test possible.
- Sequence steps by: highest probability cause, lowest cost test first
- Express uncertainty honestly — never false confidence, never useless hedging
- If symptoms suggest something dangerous (knocking, overheating, smoke, sudden power loss), set driveSafety to STOP
- Return only valid JSON, no markdown, no explanation outside the JSON
- Include 3-5 ranked causes
- Include 3-6 diagnostic steps
- For modRelated: set to true on any cause that is likely triggered by a modification rather than a mechanical fault — e.g. a catless downpipe causing O2 codes, a tune pushing fuel trims, an intake affecting MAF. Set to false otherwise.
- If modifications are listed, explicitly factor them into your diagnosis. A catless downpipe triggers O2 codes that are often not faults. A tune changes expected fuel trim ranges. An intake affects MAF readings. State explicitly when a code or symptom may be mod-related rather than a mechanical fault.
- If ZIP code is provided, factor local labor rates into your cost estimates (e.g. NYC and LA rates are 40-60% higher than national average; rural midwest is 20-30% lower).
- If a dashboard warning light photo is provided, identify ALL illuminated warning lights visible and factor them into your diagnosis alongside the described code/symptom.
- If VIN data is provided (engine size, drivetrain, fuel type), factor these exact specs into the diagnosis — they significantly affect diagnostic logic.`;

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

    const { year, make, model, issue, conversationHistory, mods, hasTune, zip, dashboardImage, vinData } =
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
