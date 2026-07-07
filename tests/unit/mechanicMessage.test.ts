import { describe, it, expect } from "vitest";
import { summarizeIssue, buildTextMessage, buildEmailMessage, buildWalkInScript } from "@/lib/mechanicMessage";

const CTX = {
  year: "2018", make: "Honda", model: "Civic",
  topCause: "Ignition coil failing",
  firstStep: "Swap coils between cylinders",
  costRange: "$90–$180",
};

describe("summarizeIssue", () => {
  it("names a single fault code with its plain-English meaning", () => {
    expect(summarizeIssue("P0301 misfire on cold start")).toBe("showing a P0301 (misfire on cylinder 1) fault code");
  });

  it("collapses the OBD scanner's multi-line code dump", () => {
    const scan = "OBD2 scan found these codes:\nP0301 — Cylinder 1 misfire\nP0420 — Catalyst efficiency\nP0171 — Lean";
    expect(summarizeIssue(scan)).toBe("showing P0301 (misfire on cylinder 1) plus 2 more fault codes");
  });

  it("takes the first sayable clause of a long description", () => {
    const long = "Check engine light came on yesterday, and also there's a weird rattle from the back and the AC smells funny and it happened after I filled up with cheap gas from that station on 5th";
    const out = summarizeIssue(long);
    expect(out).toBe("having an issue — check engine light came on yesterday");
  });

  it("truncates an unbroken wall of text without cutting mid-word", () => {
    const wall = "a".repeat(20) + " " + "verylongword ".repeat(20);
    const out = summarizeIssue(wall);
    expect(out.length).toBeLessThan(120);
    expect(out.endsWith("…")).toBe(true);
  });
});

describe("message builders", () => {
  it("text message reads as one grammatical sentence flow", () => {
    const msg = buildTextMessage({ ...CTX, issue: "Grinding noise when braking at low speed." });
    expect(msg).toContain("it's having an issue — grinding noise when braking at low speed");
    expect(msg).toContain("might be ignition coil failing"); // lowercased mid-sentence
    expect(msg).not.toMatch(/it's been [A-Z]/); // the old broken splice
  });

  it("never leaks raw multi-line scanner text into any format", () => {
    const scan = "OBD2 scan found these codes:\nP0301 — Cylinder 1 misfire";
    const ctx = { ...CTX, issue: scan };
    for (const out of [buildTextMessage(ctx), buildEmailMessage(ctx).body, buildWalkInScript(ctx)]) {
      expect(out).not.toContain("OBD2 scan found");
      expect(out).toContain("P0301");
    }
  });

  it("email strips trailing punctuation from the first step before splicing", () => {
    const { body } = buildEmailMessage({ ...CTX, issue: "misfire when cold", firstStep: "Swap coils between cylinders." });
    expect(body).toContain("swap coils between cylinders first,");
    expect(body).not.toContain("cylinders. first");
  });
});
