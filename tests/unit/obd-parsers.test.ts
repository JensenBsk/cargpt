import { describe, it, expect } from "vitest";
import { cleanHex, decodeDtcPair, parseDtcResponse, parsePidValue, parseVin } from "@/lib/obd/elm327";

describe("ELM327 response parsing", () => {
  it("cleans adapter noise from responses", () => {
    expect(cleanHex("SEARCHING...\r\n43 01 03 01\r\n")).toBe("43010301");
    expect(cleanHex("NO DATA")).toBe("");
  });

  it("decodes DTC byte pairs", () => {
    expect(decodeDtcPair(0x03, 0x01)).toBe("P0301");
    expect(decodeDtcPair(0x01, 0x71)).toBe("P0171");
    expect(decodeDtcPair(0x41, 0x20)).toBe("C0120");
    expect(decodeDtcPair(0xc1, 0x00)).toBe("U0100");
    expect(decodeDtcPair(0, 0)).toBeNull();
  });

  it("parses a legacy mode 03 response with padding", () => {
    expect(parseDtcResponse("43 03 01 01 71 00 00")).toEqual(["P0301", "P0171"]);
  });

  it("parses a CAN mode 03 response with a count byte", () => {
    // 43 = mode 03 response, 02 = two codes, then P0301 and P0420
    expect(parseDtcResponse("43 02 03 01 04 20")).toEqual(["P0301", "P0420"]);
  });

  it("returns empty for NO DATA", () => {
    expect(parseDtcResponse("NO DATA")).toEqual([]);
  });

  it("parses live data PIDs with standard formulas", () => {
    // RPM: 41 0C 1A F8 → (0x1A*256 + 0xF8) / 4 = 1726
    expect(parsePidValue("41 0C 1A F8", "0C", (a, b) => (a * 256 + b) / 4)).toBe(1726);
    // Coolant: 41 05 7B → 123 - 40 = 83°C
    expect(parsePidValue("41 05 7B", "05", (a) => a - 40)).toBe(83);
    // Throttle: 41 11 33 → 51*100/255 = 20%
    expect(parsePidValue("41 11 33", "11", (a) => (a * 100) / 255)).toBe(20);
    // Unsupported PID
    expect(parsePidValue("NO DATA", "0C", (a, b) => (a * 256 + b) / 4)).toBeUndefined();
  });

  it("parses a multi-frame VIN response", () => {
    // "1HGBH41JXMN109186" in hex ASCII following the 4902 header
    const vinHex = Buffer.from("1HGBH41JXMN109186").toString("hex");
    expect(parseVin(`49 02 01 ${vinHex}`)).toBe("1HGBH41JXMN109186");
  });

  it("returns null for garbage VIN data", () => {
    expect(parseVin("NO DATA")).toBeNull();
  });
});
