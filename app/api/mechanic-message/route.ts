import Anthropic from "@anthropic-ai/sdk";
import { rateLimit } from "@/lib/rateLimit";
import { LIMITS, badRequest, isNonEmptyString, isOptionalString, validateVehicle } from "@/lib/validate";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 2 });

// Writes the note a real customer would send their shop. The template
// fallback in lib/mechanicMessage.ts is instant; this replaces it with
// something that doesn't read like a form letter.
const SYSTEM_PROMPT = `You write short messages FROM a car owner TO a repair shop. The owner used an app to research their problem first.

RULES — every one matters:
- Sound like a normal person texting their mechanic. Casual but respectful. Contractions fine.
- NEVER paste the owner's raw problem description. Summarize the symptoms in your own words, in one natural clause.
- If a fault code exists (P/C/B/U + 4 digits), name it once, naturally: "it's throwing a P0301".
- Mention the researched cause in lowercase, hedged like a human would: "from what I've read it might be a failing ignition coil".
- Ask what they'd charge if that's it. Reference the fair range once.
- Do NOT sound like AI. No "I hope this message finds you well". No bullet points in the text message. No exclamation marks.
- The walk-in script is spoken lines the owner can actually say out loud, plus 1–2 smart questions.

Return ONLY this JSON:
{
  "sms": "40–70 words. One paragraph. Ends with a question.",
  "emailSubject": "Max 9 words",
  "emailBody": "80–130 words. Greeting 'Hi,' then 2–3 short paragraphs, sign-off 'Thanks'. No name placeholder.",
  "walkIn": "3–5 short spoken lines, each on its own line starting with a dash. Then a line 'Fair price to keep in mind: <range>'."
}`;

export async function POST(request: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json({ error: "Unavailable" }, { status: 503 });
    }
    const limited = rateLimit(request, "mechanic-message", 15);
    if (limited) return limited;

    const { year, make, model, issue, topCause, firstStep, costRange } = await request.json();
    const vehicleError = validateVehicle(year, make, model);
    if (vehicleError) return vehicleError;
    if (!isNonEmptyString(issue, LIMITS.issue)) return badRequest("Missing issue.");
    if (!isOptionalString(topCause, 200) || !isOptionalString(firstStep, 300) || !isOptionalString(costRange, 60)) {
      return badRequest("Input is too long.");
    }

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 700,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [{
        role: "user",
        content: [
          `Car: ${year} ${make} ${model}`,
          `Owner's problem description (summarize, don't quote): ${issue}`,
          topCause ? `Most likely cause from the diagnosis: ${topCause}` : null,
          firstStep ? `Cheap first check the shop could do: ${firstStep}` : null,
          costRange ? `Fair repair estimate: ${costRange}` : null,
        ].filter(Boolean).join("\n"),
      }],
    });

    const block = response.content[0];
    if (block.type !== "text") throw new Error("Unexpected response type");
    const raw = block.text;
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("No JSON in response");
    const parsed = JSON.parse(raw.slice(start, end + 1));
    if (!parsed.sms || !parsed.emailBody || !parsed.walkIn) throw new Error("Incomplete message set");
    return Response.json({ message: parsed });
  } catch (err) {
    console.error("Mechanic message error:", err);
    return Response.json({ error: "Couldn't write the message." }, { status: 500 });
  }
}
