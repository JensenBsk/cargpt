import Anthropic from "@anthropic-ai/sdk";
import { rateLimit } from "@/lib/rateLimit";
import { LIMITS, badRequest, isNonEmptyString, isOptionalString, validateVehicle } from "@/lib/validate";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 2 });

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ questions: [] }, { status: 500 });
  }

  try {
    const limited = rateLimit(request, "questions", 15);
    if (limited) return limited;

    const { year, make, model, issue, topCause } = await request.json();
    const vehicleError = validateVehicle(year, make, model);
    if (vehicleError) return vehicleError;
    if (!isNonEmptyString(issue, LIMITS.issue) || !isOptionalString(topCause, 200)) {
      return badRequest("Invalid input.");
    }

    const prompt = `Car: ${year} ${make} ${model}
Issue reported: ${issue}
Top suspected cause: ${topCause ?? "unknown"}

Generate 2-3 clarifying questions that would meaningfully change or confirm this diagnosis. Each question should discriminate between the likely causes.

Rules:
- 3-4 tap options per question (short, never free text)
- Never ask something already in the issue description
- Max 3 questions — if diagnosis is already specific, generate only 1-2
- Questions should be answerable by a non-mechanic in a parking lot

Return ONLY valid JSON:
{
  "questions": [
    {
      "question": "Does the rough idle happen...",
      "options": ["Only when cold", "All the time", "Only under load", "Only at highway speed"]
    }
  ]
}`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const block = response.content[0];
    if (block.type !== "text") throw new Error("Unexpected response type");

    const raw = block.text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
    const parsed = JSON.parse(raw);
    return Response.json(parsed);
  } catch (err) {
    console.error("Questions error:", err);
    return Response.json({ questions: [] }, { status: 500 });
  }
}
