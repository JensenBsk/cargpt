import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: "No API key" }, { status: 500 });
  try {
    const { whatsWrong, causeTitle, causeReasoning } = await request.json();
    const prompt = `Re-explain this car diagnosis as if talking to someone who has never opened a hood in their life. Use analogies. Compare car parts to things in everyday life. Max 3 sentences total. No technical terms at all.

Original explanation: "${whatsWrong}"
Top cause: "${causeTitle}" — "${causeReasoning}"

Return ONLY valid JSON:
{"simpleExplanation": "Your 3-sentence plain-English explanation with analogies here."}`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });
    const block = response.content[0];
    if (block.type !== "text") throw new Error("unexpected type");
    const raw = block.text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
    return Response.json(JSON.parse(raw));
  } catch (err) {
    console.error("Simplify error:", err);
    return Response.json({ error: "Failed to simplify" }, { status: 500 });
  }
}
