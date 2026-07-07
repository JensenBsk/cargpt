import { describe, it, expect, vi, afterEach } from "vitest";
import { obdPlatformHint } from "@/lib/obd/elm327";

afterEach(() => vi.unstubAllGlobals());

describe("obdPlatformHint", () => {
  it("says ok when Web Bluetooth exists", () => {
    vi.stubGlobal("navigator", { bluetooth: {}, userAgent: "Chrome" });
    expect(obdPlatformHint()).toBe("ok");
  });

  it("routes iPhones to the Bluefy path", () => {
    vi.stubGlobal("navigator", { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15" });
    expect(obdPlatformHint()).toBe("ios-browser");
  });

  it("catches iPadOS masquerading as macOS", () => {
    vi.stubGlobal("navigator", { userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15", maxTouchPoints: 5 });
    expect(obdPlatformHint()).toBe("ios-browser");
  });

  it("treats a desktop browser without bluetooth as plain unsupported", () => {
    vi.stubGlobal("navigator", { userAgent: "Mozilla/5.0 (X11; Linux x86_64; rv:126.0) Gecko/20100101 Firefox/126.0", maxTouchPoints: 0 });
    expect(obdPlatformHint()).toBe("unsupported");
  });
});
