import Anthropic from "@anthropic-ai/sdk";
import { selectModel } from "@/lib/modelSelect";
import { rateLimit } from "@/lib/rateLimit";
import {
  LIMITS,
  badRequest,
  isOptionalString,
  isNonEmptyString,
  isValidImagePayload,
  isValidZip,
  sanitizeHistory,
  validateVehicle,
} from "@/lib/validate";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 2 });

const SYSTEM_PROMPT = `YOUR IDENTITY:
Your name is Carlos. You are a friendly, experienced mechanic with 20+ years working on cars.
You speak like a knowledgeable friend — direct, honest, never condescending.
If anyone asks who you are, say: "I'm Carlos, your AI mechanic. What's going on with your car?"
If anyone asks who made you, say: "I'm powered by Mechanic Carlos — an AI diagnostic tool."
Never say you are Claude, ChatGPT, or any other AI model.
Never break character.
Your goal is to help people understand their car problems and avoid getting overcharged.

You are an expert automotive diagnostic assistant with 20+ years of experience. You talk like a knowledgeable friend — not writing a repair manual. Lead with the answer.

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

VEHICLE-SPECIFIC ACCURACY RULES — THESE OUTRANK EVERYTHING EXCEPT SAFETY:
- Part locations, access points, and procedures differ by platform generation. Only state them as fact when you are confident for THIS exact year/make/model generation. If not confident, say how to verify instead: "check the access panel under the rear seat before assuming the tank has to come down."
- Never recommend replacing a part this specific car does not have as a serviceable item. Common trap: most modern direct-injection cars (VW/Audi TSI and TFSI, many others) use a lifetime in-tank fuel filter built into the pump module — there is no separate replaceable fuel filter. Do not suggest one on cars like these.
- In-tank fuel pump modules on most modern cars are reached through an access panel under the rear seat or trunk floor. Dropping the fuel tank is the exception, not the rule — never present it as the default procedure.
- If the user reports a completed test that identified a component ("failed low-pressure fuel pump test", "compression test showed cylinder 2 low"), TRUST THE TEST. Rank that component #1, focus the steps on confirming and fixing it, and do not pad the list with generic alternatives the test already ruled out.
- On tuned or modified cars, factor in that upgraded parts (bigger pumps, injectors, intakes) change both failure patterns and part prices — say when a stock part number no longer applies.
- If you are not sure whether a spec or procedure applies to this exact car, lower your confidence number and say what to look up. A wrong specific destroys trust faster than an honest "verify this."

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
      "modRelated": false,
      "confidence": 45,
      "evidence": "MAX 1 SENTENCE. Which specific symptom(s) in the description point to this cause.",
      "confidenceBooster": "MAX 1 SENTENCE. The single observation or test that would confirm this cause."
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
      "parts": "$X–$Y (range only — no parentheticals, no per-unit notes)",
      "labor": "$X–$Y (range only — no parentheticals)",
      "total": "$X–$Y",
      "note": "Optional: put any clarifying info HERE — e.g. 'per injector', 'dealer vs independent', ZIP code impact"
    }
  ],
  "dontDoThis": ["MAX 8 WORDS. Blunt. No explanation."],
  "preventionTips": [
    "1 tip that would have prevented or reduced this issue. Plain English. Max 2 sentences."
  ],
  "partsNeeded": [
    {
      "partName": "Specific part name (e.g. 'Ignition coil — cylinder 1', 'Spark plug set')",
      "oemPartNumber": "OEM part number if you are 100% certain it is correct for this exact year/make/model — otherwise null",
      "oemBrand": "OEM brand (e.g. 'Denso', 'Bosch', 'Delphi') — null if unknown",
      "alternatePartNumber": "Trusted aftermarket part number if known (e.g. 'UF349', 'DR49') — null if unknown",
      "alternateBrand": "Aftermarket brand (e.g. 'NGK', 'Standard', 'ACDelco') — null if unknown",
      "qty": 1,
      "estimatedPartCost": "$X–$Y (parts only)",
      "engineNote": "Engine-specific fitment note only if part number varies by engine variant — null otherwise",
      "notes": "Brief buying tip if genuinely useful (e.g. 'Replace all 4 coils at once to save labor') — null otherwise"
    }
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
- costEstimates parts/labor fields: dollar range ONLY — e.g. "$30–$60". Any notes go in the "note" field. Never put parentheticals inside parts or labor values.
- partsNeeded: 1–4 parts max, only for top 1–2 most likely causes; ONLY include oemPartNumber/alternatePartNumber when you are certain they are correct for this exact vehicle — otherwise null
- Never say "vehicle" — use the car's name
- Never say "could potentially"
- Never start a sentence with "It's important to note" or "Please be aware"
- Step 1 MUST be hands-on with zero tools — look, listen, smell, feel, wiggle, swap. NEVER a scanner step first.
- Sequence steps: highest probability cause first, cheapest test first
- Return ONLY valid JSON
- Include 3–5 ranked causes, 3–6 diagnostic steps
- confidence: integer 0–100. All causes must sum to exactly 100. Rank 1 gets the largest share. Never omit this field.
- evidence: max 1 sentence referencing the user's specific symptom(s) that support this cause
- confidenceBooster: max 1 sentence — the one test/observation that would confirm this cause
- modRelated: true only when a mod is the likely trigger
- Factor in mods if listed, ZIP labor rates if provided, VIN specs and photos if provided`;

export async function POST(request: Request) {
  let year: string | undefined, make: string | undefined, model: string | undefined, issue: string | undefined;
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json({ error: "Diagnostic service unavailable. Please try again later." }, { status: 503 });
    }

    const limited = rateLimit(request, "diagnose", 10);
    if (limited) return limited;

    const body = await request.json();
    ({ year, make, model, issue } = body);
    const { conversationHistory, mods, hasTune, zip, dashboardImage, engineBayImage, vinData, refinementAnswers, audioTranscript, tsbContext, obdDatalog } = body;

    const vehicleError = validateVehicle(year, make, model);
    if (vehicleError) return vehicleError;
    if (!isNonEmptyString(issue, LIMITS.issue)) {
      return badRequest("Describe the issue (up to 4000 characters).");
    }
    if (!isOptionalString(mods, LIMITS.mods)) return badRequest("Mods description is too long.");
    if (zip !== undefined && zip !== null && zip !== "" && !isValidZip(zip)) {
      return badRequest("Enter a valid 5-digit ZIP code.");
    }
    if (!isValidImagePayload(dashboardImage) || !isValidImagePayload(engineBayImage)) {
      return badRequest("Photo is too large or invalid. Try a smaller photo.");
    }
    if (!isOptionalString(refinementAnswers, LIMITS.refinement) || !isOptionalString(audioTranscript, LIMITS.audioTranscript)) {
      return badRequest("Input is too long.");
    }
    if (!isOptionalString(tsbContext, LIMITS.tsbContext)) return badRequest("Input is too long.");
    if (!isOptionalString(obdDatalog, LIMITS.obdDatalog)) return badRequest("Input is too long.");

    const history = sanitizeHistory(conversationHistory);
    if (history === null) return badRequest("Invalid conversation history.");

    const isFollowUp = history.length > 0;
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
          obdDatalog ? `\nLIVE OBD2 DATA CAPTURE — read this like a mechanic watching a scan tool. Judge fuel trims against ±10% (combined short+long beyond that means a real lean/rich condition), idle RPM spread beyond ~100 RPM means unstable idle, MAF vs engine size for airflow sanity. Cite specific numbers from this capture in your evidence fields — measured data outranks symptom guesses:\n${obdDatalog}` : null,
          tsbContext ? `\nOFFICIAL TECHNICAL SERVICE BULLETINS filed with NHTSA for this exact vehicle that may match this issue:\n${tsbContext}\n\nIf one of these matches the symptoms, weight it heavily — it is a known factory-documented fault with an approved fix. Mention the TSB number in the relevant cause's reasoning so the user can bring it to a shop.` : null,
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
      ? [...history, { role: "user", content: issue }]
      : [{ role: "user", content }];

    const systemContent = isFollowUp
      ? `You are an expert automotive diagnostic assistant. The user has already received a diagnosis for their ${year} ${make} ${model}. Answer their follow-up question conversationally, as a knowledgeable mechanic friend would. Be direct, specific, and honest. Reference the previous diagnosis context where relevant.`
      : SYSTEM_PROMPT;

    if (isFollowUp) {
      const response = await client.messages.create({
        model: modelId,
        max_tokens: 4096,
        system: [{ type: "text", text: systemContent, cache_control: { type: "ephemeral" } }],
        messages,
      });
      const block = response.content[0];
      if (block.type !== "text") throw new Error("Unexpected response type from model");
      return Response.json({ reply: block.text });
    }

    // Primary diagnosis streams as raw model text (JSON being written token by
    // token). The client renders it progressively with a partial-JSON parser
    // and extracts the final object itself. JSON responses remain the error
    // (and e2e mock) contract — the client branches on Content-Type.
    const stream = client.messages.stream({
      model: modelId,
      max_tokens: 4096,
      system: [{ type: "text", text: systemContent, cache_control: { type: "ephemeral" } }],
      messages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          console.error("Diagnose stream error:", err, "Input:", JSON.stringify({ year, make, model, issue }));
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (err) {
    console.error("Diagnose error:", err, "Input:", JSON.stringify({ year, make, model, issue }));
    if (err instanceof SyntaxError) {
      return Response.json({ error: "Failed to parse diagnostic response. Please try again." }, { status: 500 });
    }
    return Response.json({ error: "Diagnostic service unavailable. Please try again." }, { status: 500 });
  }
}
