import Anthropic from "@anthropic-ai/sdk";
import { rateLimit } from "@/lib/rateLimit";
import { badRequest, validateVehicle } from "@/lib/validate";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 2 });

const SYSTEM_PROMPT = `You are an automotive maintenance expert. Given a car's make, model, year, and current mileage, return a maintenance timeline as JSON.

Return exactly this structure:
{
  "services": [
    {
      "name": "Service name",
      "status": "OVERDUE | DUE_SOON | OK",
      "dueAtMiles": 75000,
      "currentMiles": 73000,
      "deltaLabel": "Due in 2,000 miles",
      "estCost": "$50–$100",
      "interval": "Every 5,000–7,500 miles",
      "note": "Optional — only include if there's something vehicle-specific worth noting"
    }
  ]
}

Status rules:
- OVERDUE: current mileage is past the due mileage
- DUE_SOON: within 1,500 miles of due
- OK: more than 1,500 miles away

For deltaLabel:
- If OVERDUE: "X,XXX miles overdue"
- If DUE_SOON: "Due in X,XXX miles"
- If OK: "Due in X,XXX miles"

Always include these 7 services in this order:
1. Oil Change
2. Air Filter (Engine)
3. Spark Plugs
4. Brake Fluid
5. Coolant Flush
6. Transmission Fluid
7. Timing Belt/Chain (or "Timing Chain — No Service Needed" if chain)

Use manufacturer-recommended intervals for the specific vehicle. Some vehicles (e.g., Honda with timing chain) never need timing belt service — mark these as OK and note it. Return only valid JSON.`;

export async function POST(request: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json({ error: "Service unavailable. Please try again later." }, { status: 503 });
    }

    const limited = rateLimit(request, "maintenance", 15);
    if (limited) return limited;

    const { year, make, model, mileage } = await request.json();

    const vehicleError = validateVehicle(year, make, model);
    if (vehicleError) return vehicleError;
    const miles = Number(mileage);
    if (!Number.isFinite(miles) || miles < 0 || miles > 1_500_000) {
      return badRequest("Enter a valid mileage.");
    }

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: `Vehicle: ${year} ${make} ${model}\nCurrent mileage: ${Number(mileage).toLocaleString()} miles`,
        },
      ],
    });

    const block = response.content[0];
    if (block.type !== "text") throw new Error("Unexpected response");

    const parsed = JSON.parse(block.text);
    return Response.json(parsed);
  } catch (err) {
    console.error("Maintenance error:", err);
    if (err instanceof SyntaxError) {
      return Response.json({ error: "Failed to parse response." }, { status: 500 });
    }
    return Response.json({ error: "Service unavailable." }, { status: 500 });
  }
}
