// ELM327-over-BLE client (Web Bluetooth).
//
// Reality check on adapters: Web Bluetooth is BLE-only. Classic-Bluetooth
// ELM327 dongles (most $10 Amazon ones) are invisible to the browser — only
// BLE variants work (Vgate iCar Pro BLE 4.0, Veepeak OBDCheck BLE+, OBDLink
// CX, Carista BLE). BLE clones expose a UART-style GATT service; the UUIDs
// vary by vendor, so we probe the known ones.

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

// Known BLE UART service/characteristic layouts for ELM327 clones.
const BLE_PROFILES = [
  // Most common clone profile (Vgate, Veepeak, generic "IOS-Vlink")
  { service: 0xfff0, write: 0xfff2, notify: 0xfff1 },
  { service: 0xfff0, write: 0xfff1, notify: 0xfff1 },
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

type Bt = {
  requestDevice(options: unknown): Promise<BluetoothDeviceLike>;
};
type BluetoothDeviceLike = {
  name?: string;
  gatt?: {
    connect(): Promise<GattServerLike>;
    connected: boolean;
    disconnect(): void;
  };
  addEventListener(type: string, listener: () => void): void;
};
type GattServerLike = {
  getPrimaryService(uuid: number | string): Promise<GattServiceLike>;
};
type GattServiceLike = {
  getCharacteristic(uuid: number | string): Promise<GattCharacteristicLike>;
};
type GattCharacteristicLike = {
  properties: { write: boolean; writeWithoutResponse: boolean; notify: boolean };
  startNotifications(): Promise<void>;
  writeValue(data: BufferSource): Promise<void>;
  writeValueWithoutResponse?(data: BufferSource): Promise<void>;
  addEventListener(type: string, listener: (ev: { target: { value: DataView } }) => void): void;
};

export class Elm327 {
  private device: BluetoothDeviceLike | null = null;
  private writeChar: GattCharacteristicLike | null = null;
  private rxBuffer = "";
  private pending: { resolve: (s: string) => void; timer: ReturnType<typeof setTimeout> } | null = null;
  onDisconnect?: () => void;

  get deviceName(): string {
    return this.device?.name ?? "OBD2 adapter";
  }

  get connected(): boolean {
    return !!this.device?.gatt?.connected;
  }

  /** Prompt the user to pick a nearby BLE OBD2 adapter and connect. */
  async connect(): Promise<void> {
    if (!isWebBluetoothAvailable()) {
      throw new Error("BLUETOOTH_UNAVAILABLE");
    }
    const bluetooth = (navigator as unknown as { bluetooth: Bt }).bluetooth;
    this.device = await bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: BLE_PROFILES.map((p) => p.service),
    });
    this.device.addEventListener("gattserverdisconnected", () => {
      this.writeChar = null;
      this.onDisconnect?.();
    });

    const server = await this.device.gatt!.connect();

    let lastErr: unknown = null;
    for (const profile of BLE_PROFILES) {
      try {
        const service = await server.getPrimaryService(profile.service);
        const notifyChar = await service.getCharacteristic(profile.notify);
        await notifyChar.startNotifications();
        notifyChar.addEventListener("characteristicvaluechanged", (ev) => {
          this.handleChunk(new TextDecoder().decode(ev.target.value));
        });
        this.writeChar =
          profile.write === profile.notify ? notifyChar : await service.getCharacteristic(profile.write);
        break;
      } catch (err) {
        lastErr = err;
      }
    }
    if (!this.writeChar) {
      this.disconnect();
      console.error("No known OBD2 BLE profile found", lastErr);
      throw new Error("UNSUPPORTED_ADAPTER");
    }

    await this.initElm();
  }

  disconnect(): void {
    try {
      this.device?.gatt?.disconnect();
    } catch {
      /* already gone */
    }
    this.device = null;
    this.writeChar = null;
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
    if (!this.writeChar) throw new Error("NOT_CONNECTED");
    if (this.pending) throw new Error("BUSY");

    const data = new TextEncoder().encode(cmd + "\r");
    const result = new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending = null;
        reject(new Error("TIMEOUT"));
      }, timeoutMs);
      this.pending = { resolve, timer };
    });

    if (this.writeChar.properties.writeWithoutResponse && this.writeChar.writeValueWithoutResponse) {
      await this.writeChar.writeValueWithoutResponse(data);
    } else {
      await this.writeChar.writeValue(data);
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
