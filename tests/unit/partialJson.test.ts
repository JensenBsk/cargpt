import { describe, expect, it } from "vitest";
import { parsePartialJson } from "@/lib/partialJson";

const FULL = {
  whatsWrong: "Your engine is misfiring on cold starts. That pattern points to fuel or ignition.",
  driveSafety: { verdict: "CAUTION", reason: "Short trips are fine." },
  rankedCauses: [
    { rank: 1, cause: "Coolant temperature sensor failing", likelihood: "Most Likely", confidence: 45 },
    { rank: 2, cause: "Fuel injector not firing cleanly", likelihood: "Likely", confidence: 30 },
  ],
};

describe("parsePartialJson", () => {
  it("parses a complete document", () => {
    expect(parsePartialJson(JSON.stringify(FULL))).toEqual(FULL);
  });

  it("ignores text before and after the JSON object", () => {
    expect(parsePartialJson("Here you go:\n" + JSON.stringify(FULL) + "\nHope that helps!")).toEqual(FULL);
  });

  it("returns null when no object has started", () => {
    expect(parsePartialJson("")).toBeNull();
    expect(parsePartialJson("Sure, here is")).toBeNull();
  });

  it("keeps a string value that is still streaming", () => {
    const partial = '{"whatsWrong": "Your engine is misfir';
    expect(parsePartialJson(partial)).toEqual({ whatsWrong: "Your engine is misfir" });
  });

  it("drops a dangling key with no value yet", () => {
    expect(parsePartialJson('{"whatsWrong": "done", "driveSaf')).toEqual({ whatsWrong: "done" });
    expect(parsePartialJson('{"whatsWrong": "done", "driveSafety":')).toEqual({ whatsWrong: "done" });
  });

  it("closes open nested objects and arrays", () => {
    const partial = '{"driveSafety": {"verdict": "CAUTION", "reason": "Short tri';
    expect(parsePartialJson(partial)).toEqual({ driveSafety: { verdict: "CAUTION", reason: "Short tri" } });
  });

  it("keeps completed array elements plus the streaming one's completed fields", () => {
    const partial = '{"rankedCauses": [{"rank": 1, "cause": "Sensor failing"}, {"rank": 2, "cau';
    expect(parsePartialJson(partial)).toEqual({ rankedCauses: [{ rank: 1, cause: "Sensor failing" }, { rank: 2 }] });
  });

  it("keeps string elements streaming inside arrays", () => {
    expect(parsePartialJson('{"dontDoThis": ["Ignore the light", "Keep drivi')).toEqual({
      dontDoThis: ["Ignore the light", "Keep drivi"],
    });
  });

  it("drops a partial primitive value", () => {
    expect(parsePartialJson('{"a": 1, "b": tru')).toEqual({ a: 1 });
    expect(parsePartialJson('{"a": [1, 2')).toEqual({ a: [1] });
  });

  it("handles escapes cut mid-sequence", () => {
    expect(parsePartialJson('{"a": "line\\')).toEqual({ a: "line" });
    expect(parsePartialJson('{"a": "deg \\u00')).toEqual({ a: "deg " });
    expect(parsePartialJson('{"a": "she said \\"hi')).toEqual({ a: 'she said "hi' });
  });

  it("yields progressively richer objects as a real document streams", () => {
    const doc = JSON.stringify(FULL);
    let lastKeys = 0;
    for (let cut = 1; cut <= doc.length; cut += 7) {
      const parsed = parsePartialJson(doc.slice(0, cut));
      if (parsed === null) continue;
      const keys = Object.keys(parsed as object).length;
      expect(keys).toBeGreaterThanOrEqual(lastKeys);
      lastKeys = keys;
    }
    expect(parsePartialJson(doc)).toEqual(FULL);
  });

  it("returns null on structurally malformed input", () => {
    expect(parsePartialJson('{"a": 1]')).toBeNull();
  });
});
