import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "@/app/api/tsbs/route";

const SEARCH_RESULT = {
  results: [
    { vehicleId: 7638, modelYear: 2015, make: "JEEP", vehicleModel: "COMPASS", trim: "SUV", series: "2WD" },
    { vehicleId: 7639, modelYear: 2015, make: "JEEP", vehicleModel: "COMPASS", trim: "SUV", series: "4WD" },
    { vehicleId: 9999, modelYear: 2015, make: "JEEP", vehicleModel: "COMPASS SPORT", trim: "SUV", series: "" },
  ],
};

function detailsResult(comms: object[]) {
  return { results: [{ vehicleId: 7638, safetyIssues: { manufacturerCommunications: comms } }] };
}

const COMM_A = {
  manufacturerCommunicationNumber: "9100645",
  nhtsaIdNumber: 11022026,
  subject: null,
  summary: "Verify Reman part number availability.",
  communicationDate: "2025-08-15T00:00:00Z",
  components: [{ id: 1, name: "UNKNOWN OR OTHER", description: "" }],
};
const COMM_B = {
  manufacturerCommunicationNumber: "U67 Combo Rev11",
  nhtsaIdNumber: 11034343,
  subject: null,
  summary: "Emissions Recall U67 - Catalytic Converter Efficiency.",
  communicationDate: "2026-06-18T00:00:00Z",
  components: [{ id: 548, name: "ENGINE", description: "060000 ENGINE (PWS)" }],
};

function makeRequest(qs: string): Request {
  return new Request(`http://localhost/api/tsbs?${qs}`);
}

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GET /api/tsbs", () => {
  it("returns 400 when params are missing or malformed", async () => {
    expect((await GET(makeRequest("make=jeep&model=compass"))).status).toBe(400);
    expect((await GET(makeRequest("make=jeep&model=compass&year=15"))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("resolves trims via bySearch and returns deduped bulletins, newest first", async () => {
    fetchMock
      .mockResolvedValueOnce({ json: async () => SEARCH_RESULT }) // bySearch
      .mockResolvedValueOnce({ json: async () => detailsResult([COMM_A, COMM_B]) }) // trim 1
      .mockResolvedValueOnce({ json: async () => detailsResult([COMM_A]) }); // trim 2 (duplicate)

    const res = await GET(makeRequest("make=jeep&model=compass&year=2015"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.count).toBe(2);
    expect(data.tsbs[0].nhtsaId).toBe(11034343); // 2026 before 2025
    expect(data.tsbs[0].component).toBe("ENGINE");
    expect(data.tsbs[1].number).toBe("9100645");

    // Exact-model filter: COMPASS SPORT (id 9999) must not be queried
    const detailUrls = fetchMock.mock.calls.slice(1).map((c) => String(c[0]));
    expect(detailUrls.some((u) => u.includes("/7638/"))).toBe(true);
    expect(detailUrls.some((u) => u.includes("/9999/"))).toBe(false);
  });

  it("returns an empty result when the vehicle is not found", async () => {
    fetchMock.mockResolvedValueOnce({ json: async () => ({ results: [] }) });
    const res = await GET(makeRequest("make=fake&model=nothing&year=2015"));
    const data = await res.json();
    expect(data).toEqual({ count: 0, tsbs: [] });
  });

  it("degrades to an empty result when NHTSA is down", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    const res = await GET(makeRequest("make=jeep&model=compass&year=2015"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ count: 0, tsbs: [] });
  });
});
