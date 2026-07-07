import { describe, it, expect } from "vitest";
import { summarizeDatalog, type DatalogSample } from "@/lib/obd/datalog";

function sample(t: number, over: Partial<DatalogSample> = {}): DatalogSample {
  return { t, rpm: 750, coolantTempC: 88, shortFuelTrimPct: 2.3, longFuelTrimPct: 5.1, mafGs: 3.2, engineLoadPct: 22, throttlePct: 14, ...over };
}

describe("summarizeDatalog", () => {
  it("returns null for empty or PID-less captures", () => {
    expect(summarizeDatalog([])).toBeNull();
    expect(summarizeDatalog([{ t: 0 }, { t: 1000 }])).toBeNull();
  });

  it("summarizes stable idle without noisy spread lines", () => {
    const samples = Array.from({ length: 15 }, (_, i) => sample(i * 2000));
    const out = summarizeDatalog(samples, "idling in park")!;
    expect(out).toContain("28s capture, 15 samples, idling in park");
    expect(out).toContain("RPM: avg 750");
    expect(out).not.toContain("ranged 750–750");
    expect(out).toContain("Long fuel trim: avg 5.1%");
  });

  it("surfaces an unstable idle as an RPM range", () => {
    const samples = [sample(0, { rpm: 650 }), sample(2000, { rpm: 900 }), sample(4000, { rpm: 700 })];
    const out = summarizeDatalog(samples)!;
    expect(out).toMatch(/RPM: avg 750 \(ranged 650–900\)/);
  });

  it("tells the coolant warm-up story", () => {
    const samples = [sample(0, { coolantTempC: 40 }), sample(15000, { coolantTempC: 60 }), sample(30000, { coolantTempC: 82 })];
    const out = summarizeDatalog(samples)!;
    expect(out).toContain("40→82°C over the capture");
  });

  it("skips PIDs the adapter never returned", () => {
    const samples = Array.from({ length: 5 }, (_, i) => ({ t: i * 2000, rpm: 800 }) as DatalogSample);
    const out = summarizeDatalog(samples)!;
    expect(out).toContain("RPM");
    expect(out).not.toContain("MAF");
    expect(out).not.toContain("fuel trim");
  });
});
