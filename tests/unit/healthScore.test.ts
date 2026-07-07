import { describe, it, expect } from "vitest";
import { computeHealthScore, type HealthInputs } from "@/lib/healthScore";

const BASE: HealthInputs = {
  mileage: 40_000,
  openRecalls: 0,
  complaintCount: 20,
  overdueCount: 0,
  dueSoonCount: 0,
  weakPoints: [],
};

describe("computeHealthScore", () => {
  it("gives a well-kept low-mileage car an excellent score", () => {
    const r = computeHealthScore(BASE);
    expect(r.score).toBe(100);
    expect(r.label).toBe("Excellent");
    expect(r.factors.every((f) => f.delta === 0)).toBe(true);
  });

  it("penalizes open recalls hard but caps the hit", () => {
    expect(computeHealthScore({ ...BASE, openRecalls: 1 }).score).toBe(88);
    expect(computeHealthScore({ ...BASE, openRecalls: 5 }).score).toBe(64); // capped at -36
  });

  it("slopes with mileage and never goes below the floor", () => {
    expect(computeHealthScore({ ...BASE, mileage: 60_000 }).score).toBe(100);
    expect(computeHealthScore({ ...BASE, mileage: 100_000 }).score).toBe(92);
    const wreck = computeHealthScore({
      mileage: 250_000, openRecalls: 5, complaintCount: 900,
      overdueCount: 6, dueSoonCount: 4,
      weakPoints: [{ severity: "major" }, { severity: "major" }, { severity: "major" }, { severity: "major" }],
    });
    expect(wreck.score).toBe(20);
    expect(wreck.label).toBe("At risk");
  });

  it("weights weak points by severity with a cap", () => {
    const r = computeHealthScore({ ...BASE, weakPoints: [{ severity: "major" }, { severity: "minor" }] });
    expect(r.score).toBe(91); // -7 -2
    const capped = computeHealthScore({ ...BASE, weakPoints: Array(6).fill({ severity: "major" }) });
    expect(capped.score).toBe(79); // capped at -21
  });

  it("every factor's delta sums to the score movement", () => {
    const r = computeHealthScore({ ...BASE, mileage: 120_000, openRecalls: 1, complaintCount: 200, overdueCount: 2, dueSoonCount: 1, weakPoints: [{ severity: "moderate" }] });
    const sum = r.factors.reduce((s, f) => s + f.delta, 0);
    expect(100 + sum).toBe(r.score);
  });

  it("labels the mid bands correctly", () => {
    expect(computeHealthScore({ ...BASE, openRecalls: 1, complaintCount: 200 }).label).toBe("Strong"); // 80
    expect(computeHealthScore({ ...BASE, openRecalls: 2, complaintCount: 200 }).label).toBe("Fair"); // 68
    expect(computeHealthScore({ ...BASE, openRecalls: 2, complaintCount: 500 }).label).toBe("Needs attention"); // 64
    expect(computeHealthScore({ ...BASE, openRecalls: 3, complaintCount: 500 }).label).toBe("At risk"); // 52
  });
});
