// ELM327-over-BLE client.
//
// Transport is @capacitor-community/bluetooth-le's BleClient: inside the
// Capacitor shell it talks to CoreBluetooth/Android BLE natively; on plain
// web it falls back to Web Bluetooth. One code path for both.
//
// Reality check on adapters: this is BLE-only. Classic-Bluetooth ELM327
// dongles (most $10 Amazon ones) are invisible to BLE — only BLE variants
// work (Vgate iCar Pro BLE 4.0, Veepeak OBDCheck BLE+, OBDLink CX, Carista
// BLE). BLE clones expose a UART-style GATT service; the UUIDs vary by
// vendor, so we probe the known ones and fall back to a generic UART scan.

import type { BleClientInterface, BleDevice } from "@capacitor-community/bluetooth-le";
import { isNativeApp } from "@/lib/native";

export interface DtcEntry {
  code: string; // e.g. "P0301"
  description: string;
}

export interface LiveData {
  rpm?: number;
  coolantTempC?: number;
  mafGs?: number; // grams/sec
  throttlePct?: number;
  shortFuelTrimPct?: number;
  longFuelTrimPct?: number;
  o2SensorV?: number;
  speedKmh?: number;
  intakeTempC?: number;
  engineLoadPct?: number;
}

export interface FreezeFrame {
  dtc?: string;
  rpm?: number;
  coolantTempC?: number;
  speedKmh?: number;
  engineLoadPct?: number;
}

// Known BLE UART service/characteristic layouts for ELM327 clones,
// as 128-bit UUIDs (BleClient requires the full form).
function u16(short: number): string {
  return `0000${short.toString(16).padStart(4, "0")}-0000-1000-8000-00805f9b34fb`;
}

const BLE_PROFILES = [
  // Most common clone profile (Vgate, Veepeak, generic "IOS-Vlink")
  { service: u16(0xfff0), write: u16(0xfff2), notify: u16(0xfff1) },
  { service: u16(0xfff0), write: u16(0xfff1), notify: u16(0xfff1) },
  // OBDLink CX and some newer adapters
  {
    service: "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
    write: "bef8d6c9-9c21-4c9e-b632-bd58c1009f9f",
    notify: "bef8d6c9-9c21-4c9e-b632-bd58c1009f9f",
  },
  // Nordic UART service (some BLE bridges)
  {
    service: "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
    write: "6e400002-b5a3-f393-e0a9-e50e24dcca9e",
    notify: "6e400003-b5a3-f393-e0a9-e50e24dcca9e",
  },
] as const;

export function isWebBluetoothAvailable(): boolean {
  return typeof navigator !== "undefined" && "bluetooth" in navigator;
}

/**
 * Whether an OBD2 connection is possible here: native shell (CoreBluetooth /
 * Android BLE via the Capacitor plugin) or a browser with Web Bluetooth.
 */
export function isObdSupported(): boolean {
  return isNativeApp() || isWebBluetoothAvailable();
}

/**
 * Why OBD can('t) run here, so the UI can give the right escape hatch.
 * "ios-browser": WebKit has no Web Bluetooth — but Bluefy (a free iOS
 * browser that implements navigator.bluetooth) runs our whole BLE stack
 * unmodified, so we point iPhone users there until the App Store app ships.
 */
export function obdPlatformHint(): "ok" | "ios-browser" | "unsupported" {
  if (isObdSupported()) return "ok";
  if (typeof navigator === "undefined") return "unsupported";
  const ua = navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/.test(ua) ||
    // iPadOS masquerades as macOS but has touch
    (/Macintosh/.test(ua) && typeof navigator.maxTouchPoints === "number" && navigator.maxTouchPoints > 1);
  return isIos ? "ios-browser" : "unsupported";
}

async function ble(): Promise<BleClientInterface> {
  // Dynamic import keeps the plugin (and @capacitor/core) out of every
  // page bundle — it loads only when the scanner is actually opened.
  const { BleClient } = await import("@capacitor-community/bluetooth-le");
  return BleClient;
}

export class Elm327 {
  private client: BleClientInterface | null = null;
  private device: BleDevice | null = null;
  private isConnected = false;
  private writeTarget: { service: string; characteristic: string; withoutResponse: boolean } | null = null;
  private rxBuffer = "";
  private pending: { resolve: (s: string) => void; timer: ReturnType<typeof setTimeout> } | null = null;
  onDisconnect?: () => void;

  get deviceName(): string {
    return this.device?.name ?? "OBD2 adapter";
  }

  get connected(): boolean {
    return this.isConnected && !!this.writeTarget;
  }

  /** Prompt the user to pick a nearby BLE OBD2 adapter and connect. */
  async connect(): Promise<void> {
    if (!isObdSupported()) {
      throw new Error("BLUETOOTH_UNAVAILABLE");
    }
    this.client = await ble();
    await this.client.initialize({ androidNeverForLocation: true });

    this.device = await this.client.requestDevice({
      optionalServices: BLE_PROFILES.map((p) => p.service),
    });

    await this.client.connect(this.device.deviceId, () => {
      this.isConnected = false;
      this.writeTarget = null;
      this.onDisconnect?.();
    });
    this.isConnected = true;

    try {
      await this.attachUart();
      await this.initElm();
    } catch (err) {
      this.disconnect();
      throw err;
    }
  }

  /** Find a usable notify+write characteristic pair and start notifications. */
  private async attachUart(): Promise<void> {
    if (!this.client || !this.device) throw new Error("NOT_CONNECTED");
    const services = await this.client.getServices(this.device.deviceId);
    const norm = (uuid: string) => uuid.toLowerCase();

    type Candidate = { service: string; notify: string; write: string; withoutResponse: boolean };
    const candidates: Candidate[] = [];

    // Known profiles first, in order.
    for (const profile of BLE_PROFILES) {
      const svc = services.find((s) => norm(s.uuid) === profile.service);
      if (!svc) continue;
      const notifyChar = svc.characteristics.find((c) => norm(c.uuid) === profile.notify && c.properties.notify);
      const writeChar = svc.characteristics.find(
        (c) => norm(c.uuid) === profile.write && (c.properties.write || c.properties.writeWithoutResponse)
      );
      if (notifyChar && writeChar) {
        candidates.push({
          service: svc.uuid,
          notify: notifyChar.uuid,
          write: writeChar.uuid,
          withoutResponse: !!writeChar.properties.writeWithoutResponse,
        });
      }
    }

    // Generic fallback: any service exposing a notify char + a write char
    // (catches unknown clone UUID layouts).
    if (!candidates.length) {
      for (const svc of services) {
        const notifyChar = svc.characteristics.find((c) => c.properties.notify);
        const writeChar = svc.characteristics.find((c) => c.properties.write || c.properties.writeWithoutResponse);
        if (notifyChar && writeChar) {
          candidates.push({
            service: svc.uuid,
            notify: notifyChar.uuid,
            write: writeChar.uuid,
            withoutResponse: !!writeChar.properties.writeWithoutResponse,
          });
        }
      }
    }

    let lastErr: unknown = null;
    for (const cand of candidates) {
      try {
        await this.client.startNotifications(this.device.deviceId, cand.service, cand.notify, (value) => {
          this.handleChunk(new TextDecoder().decode(value));
        });
        this.writeTarget = { service: cand.service, characteristic: cand.write, withoutResponse: cand.withoutResponse };
        return;
      } catch (err) {
        lastErr = err;
      }
    }
    console.error("No known OBD2 BLE profile found", lastErr);
    throw new Error("UNSUPPORTED_ADAPTER");
  }

  disconnect(): void {
    const client = this.client;
    const device = this.device;
    if (client && device) {
      client.disconnect(device.deviceId).catch(() => {
        /* already gone */
      });
    }
    this.isConnected = false;
    this.device = null;
    this.writeTarget = null;
  }

  private handleChunk(chunk: string) {
    this.rxBuffer += chunk;
    // ELM327 terminates every response with '>' prompt
    if (this.rxBuffer.includes(">")) {
      const response = this.rxBuffer.replace(/>/g, "").trim();
      this.rxBuffer = "";
      if (this.pending) {
        clearTimeout(this.pending.timer);
        const { resolve } = this.pending;
        this.pending = null;
        resolve(response);
      }
    }
  }

  /** Send a raw command, resolve with the full text response. */
  async send(cmd: string, timeoutMs = 5000): Promise<string> {
    if (!this.client || !this.device || !this.writeTarget) throw new Error("NOT_CONNECTED");
    if (this.pending) throw new Error("BUSY");

    const bytes = new TextEncoder().encode(cmd + "\r");
    const data = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const result = new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending = null;
        reject(new Error("TIMEOUT"));
      }, timeoutMs);
      this.pending = { resolve, timer };
    });

    const { service, characteristic, withoutResponse } = this.writeTarget;
    if (withoutResponse) {
      await this.client.writeWithoutResponse(this.device.deviceId, service, characteristic, data);
    } else {
      await this.client.write(this.device.deviceId, service, characteristic, data);
    }
    return result;
  }

  private async initElm(): Promise<void> {
    await this.send("ATZ", 8000); // reset
    await this.send("ATE0"); // echo off
    await this.send("ATL0"); // linefeeds off
    await this.send("ATS0"); // spaces off
    await this.send("ATSP0"); // auto protocol
    // Wake the bus; ignore result (some cars need a beat after key-on)
    try {
      await this.send("0100", 10_000);
    } catch {
      /* tolerated — some adapters answer SEARCHING... slowly */
    }
  }

  // ---------- High-level reads ----------

  /** Mode 03 — stored DTCs. */
  async readDtcs(): Promise<string[]> {
    const raw = await this.send("03", 10_000);
    return parseDtcResponse(raw);
  }

  /** Mode 07 — pending DTCs. Not all adapters/cars support it. */
  async readPendingDtcs(): Promise<string[]> {
    try {
      const raw = await this.send("07", 8000);
      return parseDtcResponse(raw);
    } catch {
      return [];
    }
  }

  /** Mode 04 — clear codes + MIL. Irreversible; confirm with the user first. */
  async clearDtcs(): Promise<boolean> {
    const raw = await this.send("04", 10_000);
    return raw.includes("44") || /OK/i.test(raw);
  }

  /** Mode 09 PID 02 — VIN. */
  async readVin(): Promise<string | null> {
    try {
      const raw = await this.send("0902", 10_000);
      return parseVin(raw);
    } catch {
      return null;
    }
  }

  /** Mode 02 — freeze frame for the first stored fault. */
  async readFreezeFrame(): Promise<FreezeFrame | null> {
    try {
      const ff: FreezeFrame = {};
      const dtcRaw = await this.send("0202", 8000); // PID 02: DTC that caused the frame
      const dtcs = parseDtcResponse(dtcRaw);
      if (dtcs.length) ff.dtc = dtcs[0];
      ff.rpm = parsePidValue(await this.trySend("020C"), "0C", (a, b) => (a * 256 + b) / 4);
      ff.coolantTempC = parsePidValue(await this.trySend("0205"), "05", (a) => a - 40);
      ff.speedKmh = parsePidValue(await this.trySend("020D"), "0D", (a) => a);
      ff.engineLoadPct = parsePidValue(await this.trySend("0204"), "04", (a) => (a * 100) / 255);
      return ff.dtc || ff.rpm !== undefined ? ff : null;
    } catch {
      return null;
    }
  }

  private async trySend(cmd: string): Promise<string> {
    try {
      return await this.send(cmd, 4000);
    } catch {
      return "";
    }
  }

  /** One round of mode 01 live data. Unsupported PIDs come back undefined. */
  async readLiveData(): Promise<LiveData> {
    const data: LiveData = {};
    data.rpm = parsePidValue(await this.trySend("010C"), "0C", (a, b) => (a * 256 + b) / 4);
    data.coolantTempC = parsePidValue(await this.trySend("0105"), "05", (a) => a - 40);
    data.throttlePct = parsePidValue(await this.trySend("0111"), "11", (a) => (a * 100) / 255);
    data.mafGs = parsePidValue(await this.trySend("0110"), "10", (a, b) => (a * 256 + b) / 100);
    data.shortFuelTrimPct = parsePidValue(await this.trySend("0106"), "06", (a) => (a - 128) * (100 / 128));
    data.longFuelTrimPct = parsePidValue(await this.trySend("0107"), "07", (a) => (a - 128) * (100 / 128));
    data.speedKmh = parsePidValue(await this.trySend("010D"), "0D", (a) => a);
    data.intakeTempC = parsePidValue(await this.trySend("010F"), "0F", (a) => a - 40);
    data.engineLoadPct = parsePidValue(await this.trySend("0104"), "04", (a) => (a * 100) / 255);
    return data;
  }
}

// ---------- Parsing helpers (exported for unit tests) ----------

/** Strip ELM noise and return contiguous hex, e.g. "43010301710000". */
export function cleanHex(raw: string): string {
  return raw
    .replace(/SEARCHING\.*/gi, "")
    .replace(/BUS INIT\.*/gi, "")
    .replace(/[\r\n]/g, "")
    .replace(/NO DATA/gi, "")
    .replace(/STOPPED/gi, "")
    .replace(/[^0-9A-Fa-f]/g, "")
    .toUpperCase();
}

const DTC_FIRST_CHAR = ["P0", "P1", "P2", "P3", "C0", "C1", "C2", "C3", "B0", "B1", "B2", "B3", "U0", "U1", "U2", "U3"];

/** Decode a 2-byte DTC pair into e.g. "P0301". */
export function decodeDtcPair(byte1: number, byte2: number): string | null {
  if (byte1 === 0 && byte2 === 0) return null;
  const prefix = DTC_FIRST_CHAR[(byte1 >> 4) & 0x0f];
  return `${prefix}${(byte1 & 0x0f).toString(16).toUpperCase()}${byte2
    .toString(16)
    .padStart(2, "0")
    .toUpperCase()}`;
}

/** Parse a mode 03/07 response into DTC strings. Handles CAN multi-frame counts. */
export function parseDtcResponse(raw: string): string[] {
  const hex = cleanHex(raw);
  const codes: string[] = [];
  // Find the response header 43 (mode 03) or 47 (mode 07); CAN adds a count byte.
  const m = hex.match(/4[37]([0-9A-F]*)/);
  if (!m) return codes;
  let payload = m[1];
  // CAN protocol: first byte after 43 is the DTC count — detect by consistency.
  if (payload.length >= 2) {
    const maybeCount = parseInt(payload.slice(0, 2), 16);
    if (maybeCount > 0 && maybeCount <= 20 && payload.length >= 2 + maybeCount * 4) {
      payload = payload.slice(2, 2 + maybeCount * 4);
    }
  }
  for (let i = 0; i + 4 <= payload.length; i += 4) {
    const b1 = parseInt(payload.slice(i, i + 2), 16);
    const b2 = parseInt(payload.slice(i + 2, i + 4), 16);
    const code = decodeDtcPair(b1, b2);
    if (code) codes.push(code);
  }
  return [...new Set(codes)];
}

/** Parse a mode 01/02 PID response; formula receives the data bytes A, B, ... */
export function parsePidValue(
  raw: string,
  pid: string,
  formula: (a: number, b: number) => number
): number | undefined {
  const hex = cleanHex(raw);
  const idx = hex.indexOf("41" + pid) >= 0 ? hex.indexOf("41" + pid) : hex.indexOf("42" + pid);
  if (idx < 0) return undefined;
  const dataStart = idx + 4 + (hex.slice(idx, idx + 2) === "42" ? 2 : 0); // mode 02 has a frame byte
  const a = parseInt(hex.slice(dataStart, dataStart + 2), 16);
  const b = parseInt(hex.slice(dataStart + 2, dataStart + 4), 16) || 0;
  if (Number.isNaN(a)) return undefined;
  const value = formula(a, b);
  return Number.isFinite(value) ? Math.round(value * 10) / 10 : undefined;
}

/** Parse mode 09 PID 02 VIN response (ASCII bytes across frames). */
export function parseVin(raw: string): string | null {
  const hex = cleanHex(raw);
  const idx = hex.indexOf("4902");
  if (idx < 0) return null;
  const ascii = (hex.slice(idx + 4).match(/.{2}/g) ?? [])
    .map((h) => parseInt(h, 16))
    .filter((c) => (c >= 48 && c <= 57) || (c >= 65 && c <= 90))
    .map((c) => String.fromCharCode(c))
    .join("");
  const m = ascii.match(/[A-HJ-NPR-Z0-9]{17}/);
  return m ? m[0] : null;
}
