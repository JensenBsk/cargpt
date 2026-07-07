import { describe, it, expect, vi, beforeEach } from "vitest";

const VALID_ANALYSIS = {
  lineItems: [
    { service: "Front brake pads and rotors", quotedPrice: 620, verdict: "HIGH", fairRange: "$350–$500", note: "…", askMechanic: "…" },
  ],
  totalQuoted: 620,
  totalFair: "$350–$500",
  overallVerdict: "HIGH",
  summary: "The brake job is about $150 over market for the Camry.",
  redFlags: [],
  negotiationScript: "Hey — I looked up fair pricing…",
};

const mockCreate = vi.fn();

vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class MockAnthropic {
      messages = { create: mockCreate, stream: vi.fn() };
    },
  };
});

function makeRequest(body: unknown, ip: string): Request {
  return new Request("http://localhost/api/check-quote", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

const VALID_BODY = { year: "2019", make: "Toyota", model: "Camry", quote: "Front brakes $620" };

async function freshRoute() {
  vi.resetModules();
  process.env.ANTHROPIC_API_KEY = "test-key";
  return import("@/app/api/check-quote/route");
}

let ipCounter = 0;
function uniqueIp() {
  ipCounter += 1;
  return `10.9.${Math.floor(ipCounter / 250)}.${ipCounter % 250}`;
}

beforeEach(() => {
  mockCreate.mockReset();
});

describe("POST /api/check-quote", () => {
  it("returns a structured analysis for a valid text quote", async () => {
    mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(VALID_ANALYSIS) }] });
    const { POST } = await freshRoute();
    const res = await POST(makeRequest(VALID_BODY, uniqueIp()));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.analysis.overallVerdict).toBe("HIGH");
    expect(data.analysis.lineItems).toHaveLength(1);
  });

  it("400s when vehicle info is missing", async () => {
    const { POST } = await freshRoute();
    const res = await POST(makeRequest({ quote: "brakes $620" }, uniqueIp()));
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("400s when neither quote text nor photo is provided", async () => {
    const { POST } = await freshRoute();
    const res = await POST(makeRequest({ year: "2019", make: "Toyota", model: "Camry" }, uniqueIp()));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/quote/i);
  });

  it("422s with the model's message when the photo is unreadable", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ error: "Couldn't read this photo clearly. Try better lighting or type the quote instead." }) }],
    });
    const { POST } = await freshRoute();
    const res = await POST(makeRequest({ ...VALID_BODY, quote: "", imageBase64: "aGVsbG8=" }, uniqueIp()));
    expect(res.status).toBe(422);
  });

  it("gracefully 500s when the Anthropic call fails, without leaking details", async () => {
    mockCreate.mockRejectedValue(new Error("ECONNRESET upstream 10.1.2.3"));
    const { POST } = await freshRoute();
    const res = await POST(makeRequest(VALID_BODY, uniqueIp()));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).not.toMatch(/ECONNRESET|10\.1\.2\.3/);
  });

  it("500s with a friendly message when the model returns invalid JSON", async () => {
    mockCreate.mockResolvedValue({ content: [{ type: "text", text: "not json at all" }] });
    const { POST } = await freshRoute();
    const res = await POST(makeRequest(VALID_BODY, uniqueIp()));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toMatch(/try again/i);
  });

  it("429s after the per-IP limit", async () => {
    mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(VALID_ANALYSIS) }] });
    const { POST } = await freshRoute();
    const ip = uniqueIp();
    for (let i = 0; i < 10; i++) {
      expect((await POST(makeRequest(VALID_BODY, ip))).status).toBe(200);
    }
    const limited = await POST(makeRequest(VALID_BODY, ip));
    expect(limited.status).toBe(429);
  });

  it("rejects oversized image payloads", async () => {
    const { POST } = await freshRoute();
    const res = await POST(makeRequest({ ...VALID_BODY, imageBase64: "A".repeat(7_000_000) }, uniqueIp()));
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
