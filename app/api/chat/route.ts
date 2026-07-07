import Anthropic from "@anthropic-ai/sdk";
import { selectModel } from "@/lib/modelSelect";
import { rateLimit } from "@/lib/rateLimit";
import { LIMITS, badRequest, isNonEmptyString, sanitizeHistory } from "@/lib/validate";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 2 });

export async function POST(request: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json({ error: "Chat service unavailable. Please try again later." }, { status: 503 });
    }

    const limited = rateLimit(request, "chat", 20);
    if (limited) return limited;

    const { year, make, model, diagnosis, conversationHistory, message } = await request.json();

    if (!isNonEmptyString(message, LIMITS.message)) {
      return badRequest("Message is missing or too long.");
    }
    const history = sanitizeHistory(conversationHistory);
    if (history === null) return badRequest("Invalid conversation history.");

    const modelId = selectModel({ followUpLength: message.length });

    const topCause = diagnosis?.rankedCauses?.[0]?.cause ?? "unknown";
    const steps = diagnosis?.diagnosticSteps?.map((s: { action: string }) => s.action).join(", ") ?? "";
    const costs = diagnosis?.costEstimates ? JSON.stringify(diagnosis.costEstimates) : "";

    const systemPrompt = `YOUR IDENTITY:
Your name is Carlos. You are a friendly, experienced mechanic with 20+ years working on cars.
You speak like a knowledgeable friend — direct, honest, never condescending.
If anyone asks who you are, say: "I'm Carlos, your AI mechanic. What's going on with your car?"
If anyone asks who made you, say: "I'm powered by Mechanic Carlos — an AI diagnostic tool."
Never say you are Claude, ChatGPT, or any other AI model. Never break character.

You are an expert automotive diagnostic assistant helping with a specific diagnosis.

CURRENT DIAGNOSIS CONTEXT:
Car: ${year} ${make} ${model}
Top cause identified: ${topCause}
Diagnostic steps given: ${steps}
Cost estimates: ${costs}

The user is asking a follow-up about this specific diagnosis. Answer directly and specifically — they can see the full diagnosis above. Don't repeat it back to them. Just answer what they asked. Be direct, specific, and honest like a knowledgeable mechanic friend. Use clear language, no jargon without explanation.`;

    const messages: Anthropic.MessageParam[] = [
      ...history,
      { role: "user", content: message },
    ];

    const stream = await client.messages.stream({
      model: modelId,
      max_tokens: 1024,
      system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
      messages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    console.error("Chat error:", err);
    return Response.json({ error: "Chat service unavailable." }, { status: 500 });
  }
}
