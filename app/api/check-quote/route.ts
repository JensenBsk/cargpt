import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `YOUR IDENTITY:
Your name is Carlos. You are a friendly, experienced mechanic with 20+ years working on cars.
If anyone asks who you are, say: "I'm Carlos, your AI mechanic."
If anyone asks who made you, say: "I'm powered by Mechanic Carlos — an AI diagnostic tool."
Never say you are Claude, ChatGPT, or any other AI model. Never break character.

You are an automotive service pricing expert who helps car owners understand if they're being charged fairly. You know exact parts costs (OEM and aftermarket) and standard labor rates for every common repair at independent shops across the US.

The user gives you a mechanic's quote as a list of services and prices (either as text OR as a photo of the written estimate). Analyze each item and return this exact JSON:

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

If given a photo: extract ALL line items visible, including handwritten ones. If the photo is unreadable, return {"error": "Couldn't read this photo clearly. Try better lighting or type the quote instead."}

Always cite real parts cost ranges and labor hours. The negotiationScript must sound human and be ready to copy-paste. Return only valid JSON.`;

export async function POST(request: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json({ error: "API key not configured" }, { status: 500 });
    }

    const { year, make, model, quote, imageBase64, zip } = await request.json();

    if (!year || !make || !model) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!quote?.trim() && !imageBase64) {
      return Response.json({ error: "Provide a quote (text or photo)" }, { status: 400 });
    }

    const hasImage = !!imageBase64;
    const modelId = hasImage ? "claude-sonnet-4-6" : "claude-haiku-4-5-20251001";

    let content: Anthropic.MessageParam["content"];
    if (hasImage) {
      const base64Data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
      content = [
        {
          type: "image",
          source: { type: "base64", media_type: "image/jpeg", data: base64Data },
        },
        {
          type: "text",
          text: `This is a mechanic repair quote for a ${year} ${make} ${model}${zip ? ` in ZIP ${zip}` : ""}. Extract every line item, labor charge, and price visible in the image. Then analyze each for fair market pricing.${quote?.trim() ? `\n\nUser also provided: ${quote.trim()}` : ""} Return the standard quote JSON format.`,
        },
      ];
    } else {
      content = `Vehicle: ${year} ${make} ${model}${zip ? ` in ZIP ${zip}` : ""}\n\nMechanic's quote:\n${quote}`;
    }

    const response = await client.messages.create({
      model: modelId,
      max_tokens: 2048,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content }],
    });

    const block = response.content[0];
    if (block.type !== "text") throw new Error("Unexpected response type");

    const parsed = JSON.parse(block.text);
    if (parsed.error) return Response.json({ error: parsed.error }, { status: 422 });
    return Response.json({ analysis: parsed });
  } catch (err) {
    console.error("Check-quote error:", err);
    if (err instanceof SyntaxError) {
      return Response.json({ error: "Failed to parse response. Please try again." }, { status: 500 });
    }
    return Response.json({ error: "Service unavailable. Please try again." }, { status: 500 });
  }
}
