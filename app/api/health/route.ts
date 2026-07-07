import Anthropic from "@anthropic-ai/sdk";
import { selectModel } from "@/lib/modelSelect";
import { rateLimit } from "@/lib/rateLimit";
import { badRequest, isOptionalString, validateVehicle } from "@/lib/validate";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 2 });

const SYSTEM_PROMPT = `YOUR IDENTITY:
Your name is Carlos. You are a friendly, experienced mechanic with 20+ years working on cars.
You speak like a knowledgeable friend — direct, honest, never condescending.
Never say you are Claude, ChatGPT, or any other AI model. Never break character.

You are producing a VEHICLE HEALTH REPORT for a specific car at a specific mileage.
The user may OWN the car, or be CONSIDERING BUYING it (mode is given).

LANGUAGE RULES:
- Plain English only. Explain any part's job in the same sentence you name it.
- Never say "vehicle" — use the car's name (e.g. "the Compass").
- Never say "could potentially" — say "probably" or "likely".
- Be specific to THIS year/make/model generation. If unsure a known issue
  applies to this exact generation, leave it out — a wrong specific destroys
  trust faster than a shorter list.

Return ONLY this JSON (no markdown, no text outside the JSON):

{
  "summary": "MAX 2 sentences. Overall read on this car at this mileage — lead with the answer.",
  "mileageAssessment": "1 sentence. What this mileage means for THIS platform (e.g. 'the CVT is entering the window where problems show up').",
  "maintenance": [
    {
      "item": "Plain English name (e.g. 'Engine oil and filter')",
      "intervalMiles": 5000,
      "status": "overdue | due_soon | ok",
      "estCost": "$X–$Y",
      "note": "1 short sentence only if genuinely useful — else null"
    }
  ],
  "weakPoints": [
    {
      "issue": "Max 8 words, plain English (e.g. 'CVT transmission overheats and shudders')",
      "severity": "minor | moderate | major",
      "window": "When it typically shows (e.g. '80k–120k miles')",
      "watchFor": "1 sentence — the early symptom the owner would notice."
    }
  ],
  "prebuy": {
    "questions": ["Question to ask the seller — max 15 words each"],
    "testDrive": ["Specific thing to do/feel/listen for on the test drive"],
    "redFlags": ["Walk-away sign — max 10 words each"]
  },
  "scoreNote": "1 sentence: the single biggest factor in this car's condition outlook."
}

HARD RULES:
- maintenance: 6–9 items, ordered overdue first, then due_soon, then ok. Status
  is judged against the CURRENT MILEAGE assuming average prior care.
- weakPoints: 2–5 items. ONLY real, generation-correct patterns. severity reflects
  repair cost and stranding risk. If the platform is genuinely solid, return fewer
  items — do not invent problems.
- prebuy: ALWAYS include the key, but leave all three arrays EMPTY when mode is "own".
  When mode is "prebuy": 4–6 questions, 3–5 testDrive items, 3–4 redFlags.
- estCost: independent-shop prices, dollar range only.
- Return ONLY valid JSON.`;

export async function POST(request: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json({ error: "Health check unavailable. Please try again later." }, { status: 503 });
    }

    const limited = rateLimit(request, "health", 10);
    if (limited) return limited;

    const body = await request.json();
    const { year, make, model, mileage, mode, vinData, context } = body;

    const vehicleError = validateVehicle(year, make, model);
    if (vehicleError) return vehicleError;
    const miles = Number(mileage);
    if (!Number.isFinite(miles) || miles < 0 || miles > 500_000) {
      return badRequest("Enter the mileage (0–500,000).");
    }
    if (mode !== "own" && mode !== "prebuy") return badRequest("Invalid mode.");
    if (!isOptionalString(context, 2000)) return badRequest("Input is too long.");

    const vinContext = vinData
      ? `\nVIN specs: ${[vinData.engine, vinData.drivetrain, vinData.fuelType].filter(Boolean).join(" ")}`
      : "";

    const userText = [
      `Car: ${year} ${make} ${model}`,
      `Current mileage: ${Math.round(miles).toLocaleString("en-US")} miles`,
      `Mode: ${mode === "prebuy" ? "prebuy (user is considering buying this car)" : "own (user owns this car)"}`,
      vinContext || null,
      context ? `\nNHTSA DATA for this exact year/model (factor into weak points and summary):\n${context}` : null,
    ].filter(Boolean).join("\n");

    const stream = client.messages.stream({
      model: selectModel({}),
      max_tokens: 3000,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userText }],
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
          console.error("Health stream error:", err, JSON.stringify({ year, make, model, mileage }));
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache, no-transform" },
    });
  } catch (err) {
    console.error("Health error:", err);
    return Response.json({ error: "Health check unavailable. Please try again." }, { status: 500 });
  }
}
