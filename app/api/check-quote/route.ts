import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an automotive service pricing expert who helps car owners understand if they're being charged fairly. You know exact parts costs (OEM and aftermarket) and standard labor rates for every common repair at independent shops across the US.

The user gives you a mechanic's quote as a list of services and prices. Analyze each item and return this exact JSON:

{
  "lineItems": [
    {
      "service": "Cleaned-up standard service name",
      "quotedPrice": 320,
      "verdict": "FAIR | HIGH | RED_FLAG",
      "fairRange": "$X–$Y",
      "note": "Parts $X–Y, labor X–X hrs. This price is [assessment] because [specific reason with numbers].",
      "askMechanic": "Specific question to ask if pushing back"
    }
  ],
  "totalQuoted": 654,
  "totalFair": "$X–$Y",
  "overallVerdict": "FAIR | HIGH | RED_FLAG",
  "summary": "2–3 sentences. Name the specific overpriced items and by how much. Use the car's name.",
  "redFlags": ["Punchy warning, max 15 words each"],
  "negotiationScript": "Natural, copy-paste-ready message for the mechanic. First person. Non-confrontational. Reference specific prices. Sound like a knowledgeable friend."
}

Verdict rules (US independent shop rates):
- FAIR: within 15% of fair market rate
- HIGH: 20–60% over market — real money being left on the table
- RED_FLAG: >60% over market, OR unnecessary service, OR a known upsell trap, OR something a DIYer can do in 10 minutes for under $20

Common RED_FLAG services: cabin air filter replacement >$40, engine air filter >$35, wiper blades >$30, fuel system cleaner additives, transmission fluid flush on <60k mile cars unless manufacturer specifies, "throttle body cleaning" without symptoms.

Always cite real parts cost ranges and labor hours. The negotiationScript must sound human and be ready to copy-paste. Return only valid JSON.`;

export async function POST(request: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json({ error: "API key not configured" }, { status: 500 });
    }

    const { year, make, model, quote } = await request.json();

    if (!year || !make || !model || !quote) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const response = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Vehicle: ${year} ${make} ${model}\n\nMechanic's quote:\n${quote}`,
        },
      ],
    });

    const block = response.content[0];
    if (block.type !== "text") throw new Error("Unexpected response type");

    const analysis = JSON.parse(block.text);
    return Response.json({ analysis });
  } catch (err) {
    console.error("Check-quote error:", err);
    if (err instanceof SyntaxError) {
      return Response.json({ error: "Failed to parse response. Please try again." }, { status: 500 });
    }
    return Response.json({ error: "Service unavailable. Please try again." }, { status: 500 });
  }
}
