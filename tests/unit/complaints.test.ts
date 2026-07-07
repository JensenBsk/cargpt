import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "@/app/api/complaints/route";

const NHTSA_RESPONSE = {
  count: 5,
  results: [
    { components: "ENGINE", summary: "..." },
    { components: "ENGINE", summary: "..." },
    { components: "ELECTRICAL SYSTEM,ENGINE", summary: "..." },
    { components: "UNKNOWN OR OTHER", summary: "..." },
    { components: "AIR BAGS", summary: "..." },
  ],
};

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

function makeRequest(qs: string): Request {
  return new Request(`http://localhost/api/complaints?${qs}`);
}

describe("GET /api/complaints", () => {
  it("returns 400 when params are missing or malformed", async () => {
    expect((await GET(makeRequest("make=jeep&model=compass"))).status).toBe(400);
    expect((await GET(makeRequest("make=jeep&model=compass&year=x"))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("aggregates components across complaints, dropping UNKNOWN OR OTHER", async () => {
    fetchMock.mockResolvedValueOnce({ json: async () => NHTSA_RESPONSE });
    const res = await GET(makeRequest("make=jeep&model=compass&year=2015"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.count).toBe(5);
    expect(data.topComponents[0]).toEqual({ name: "ENGINE", count: 3 });
    expect(data.topComponents.map((c: { name: string }) => c.name)).not.toContain("UNKNOWN OR OTHER");
  });

  it("degrades to an empty result when NHTSA is down", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    const res = await GET(makeRequest("make=jeep&model=compass&year=2015"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ count: 0, topComponents: [] });
  });
});
