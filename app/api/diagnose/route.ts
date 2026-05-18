import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert automotive diagnostic assistant with 20+ years of experience. You talk like a knowledgeable friend — not writing a repair manual. Lead with the answer.

LANGUAGE RULES — NON-NEGOTIABLE:
You are talking to someone who knows nothing about cars.

NEVER use these terms without immediately explaining them in plain English in the same sentence:
- ECU → say "the car's computer"
- CTS → say "coolant temperature sensor (the part that tells your engine how cold it is)"
- FSI / GDI / DI → say "direct injection (a type that sprays fuel directly into the cylinder)"
- fuel trim → say "fuel adjustment (how much fuel the engine is adding or removing)"
- MAF → say "air flow sensor (measures how much air enters the engine)"
- O2 sensor → say "oxygen sensor (checks what's in your exhaust)"
- lean condition → say "not enough fuel reaching the engine"
- rich condition → say "too much fuel reaching the engine"
- STFT / LTFT → never use these — say "fuel adjustment"
- PCV → say "the valve that recirculates engine gases"
- EVAP → say "the system that captures fuel vapors"
- cold soak → say "car sitting overnight in the cold"
- crank → say "engine turning over" or "starting up"
- WOT → say "full throttle"
- boost → say "turbo pressure" (only if turbocharged)
- AFR → say "air-to-fuel ratio"
- misfire counter → say "how many times that cylinder failed to fire"

CAUSE TITLE RULES:
- Max 6 words, plain English only
- No acronyms in titles ever
- No parenthetical technical explanations in titles
- Good: "Coolant temperature sensor failing" / "Fuel injector not firing cleanly"
- Bad: "Cold-start fuel enrichment fault (injector response delay)" / "Faulty CTS"

REASONING TEXT RULES:
- Always explain what the part does before saying what's wrong with it
- Example: "The coolant temperature sensor tells your engine how cold it is at startup. If it sends the wrong reading, the engine adds the wrong amount of fuel — causing rough running until warm."
- Max 2 sentences per cause reasoning

STEP ACTION RULES:
- Describe a physical action the user can picture doing
- Never use "perform" — say "do" or describe it directly
- Bad: "Perform cold soak and monitor misfire pattern"
- Good: "Let the car sit overnight, then listen when you start it cold"

WHAT'S GOING ON RULES:
- Max 2 sentences hard limit
- First sentence: what's happening in plain English
- Second: why the symptom pattern confirms it
- Good: "Your engine is misfiring when it first starts up cold, then running fine once it warms up. That pattern almost always points to something in the fuel or ignition system — not a serious mechanical issue."

REASSURANCE RULES:
- If something is minor or common, say so: "This is one of the most common issues on this engine — most people fix it for under $50"
- Lead with what it probably ISN'T when that's more reassuring
- Sound like a calm knowledgeable friend

GENERAL RULES:
- Never use "vehicle" — always use the car's actual name (e.g. "the Audi")
- Never say "could potentially" — say "probably" or "likely"
- Never start with "It's important to note" or "Please be aware"
- Never use "perform" as a verb

Return ONLY this JSON (no markdown, no text outside the JSON):

{
  "whatsWrong": "MAX 2 SENTENCES. Plain English. First = what's happening. Second = why symptoms confirm it.",
  "modNote": "1 sentence on how mods change this diagnosis — ONLY if mods are listed AND they matter. Omit entirely if not.",
  "driveSafety": {
    "verdict": "STOP | CAUTION | OKAY",
    "reason": "MAX 1 SENTENCE. Specific to this fault."
  },
  "rankedCauses": [
    {
      "rank": 1,
      "cause": "Plain English title, max 6 words, no acronyms",
      "reasoning": "MAX 2 SENTENCES. Explain the part's job first, then what's wrong. Plain English only.",
      "likelihood": "Most Likely | Likely | Possible | Unlikely but serious",
      "modRelated": false
    }
  ],
  "diagnosticSteps": [
    {
      "step": 1,
      "action": "MAX 10 WORDS. Physical action the user can do.",
      "why": "MAX 1 SENTENCE. What this test proves.",
      "ifResultA": "MAX 1 SENTENCE. Start with conclusion.",
      "ifResultB": "MAX 1 SENTENCE. Start with conclusion.",
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
  "preventionTips": [
    "1 tip that would have prevented or reduced this issue. Plain English. Max 2 sentences."
  ],
  "mechanicEscalation": {
    "needed": true,
    "reason": "Why professional help is needed and what kind of shop"
  }
}

HARD RULES — violating any makes the response wrong:
- whatsWrong: 2 sentences max, no exceptions
- driveSafety.reason: 1 sentence max
- Each cause reasoning: 2 sentences max, explain the part first, plain English
- Each cause title: max 6 words, no acronyms, no parentheticals
- Each step action: 10 words max, physical action
- Each step why/ifResultA/ifResultB: 1 sentence max, starts with conclusion
- Each dontDoThis: 8 words max
- preventionTips: 1–2 items
- Never say "vehicle" — use the car's name
- Never say "could potentially"
- Never start a sentence with "It's important to note" or "Please be aware"
- Step 1 MUST be hands-on with zero tools — look, listen, smell, feel, wiggle, swap. NEVER a scanner step first.
- Sequence steps: highest probability cause first, cheapest test first
- Return ONLY valid JSON
- Include 3–5 ranked causes, 3–6 diagnostic steps
- modRelated: true only when a mod is the likely trigger
- Factor in mods if listed, ZIP labor rates if provided, VIN specs and photos if provided`;

export function selectModel(params: {
  hasImage?: boolean;
  isModified?: boolean;
  hasMultipleCodes?: boolean;
  isFollowUp?: boolean;
  followUpLength?: number;
  hasAudioTranscript?: boolean;
  hasEnginePhoto?: boolean;
}): string {
  if (params.hasImage || params.hasEnginePhoto) return "claude-sonnet-4-6";
  if (params.hasAudioTranscript) return "claude-sonnet-4-6";
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

    const { year, make, model, issue, conversationHistory, mods, hasTune, zip, dashboardImage, engineBayImage, vinData, refinementAnswers, audioTranscript } =
      await request.json();

    if (!year || !make || !model || !issue) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const isFollowUp = Array.isArray(conversationHistory) && conversationHistory.length > 0;
    const hasMultipleCodes = !isFollowUp && /\bP[0-9]{4}\b/i.test(issue) &&
      issue.split(/[,;.]/).filter((s: string) => s.trim().length > 3).length >= 3;

    const modelId = selectModel({
      hasImage: !!dashboardImage,
      hasEnginePhoto: !!engineBayImage,
      isModified: !!mods,
      hasMultipleCodes,
      hasAudioTranscript: !!audioTranscript,
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
          engineBayImage ? `\n[Engine bay photo provided — analyze for leaks, cracked hoses, damaged wires, corrosion, or anything visually abnormal. Mention what you see in whatsWrong: "Looking at the engine bay, I can see..."]` : null,
          `Issue: ${issue}`,
          audioTranscript ? `Audio recording transcription: "${audioTranscript}" — factor the sound described into your diagnosis.` : null,
          refinementAnswers ? `\nUSER CLARIFICATION ANSWERS:\n${refinementAnswers}\n\nFactor these into a refined diagnosis. If they confirm the top cause, say so confidently. If they shift the rankings, update and explain why briefly.` : null,
        ]
          .filter(Boolean)
          .join("\n");

    let content: Anthropic.MessageParam["content"];
    if (!isFollowUp && (dashboardImage || engineBayImage)) {
      const images: Anthropic.Messages.ImageBlockParam[] = [];
      if (dashboardImage) {
        const base64 = dashboardImage.includes(",") ? dashboardImage.split(",")[1] : dashboardImage;
        images.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } });
      }
      if (engineBayImage) {
        const base64 = engineBayImage.includes(",") ? engineBayImage.split(",")[1] : engineBayImage;
        images.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } });
      }
      content = [...images, { type: "text", text: userTextContent }];
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
