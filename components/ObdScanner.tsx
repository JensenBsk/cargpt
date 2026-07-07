"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bluetooth, BluetoothOff, X, AlertTriangle, Trash2, Save } from "lucide-react";
import { Elm327, isObdSupported, type LiveData, type FreezeFrame } from "@/lib/obd/elm327";
import { describeDtc } from "@/lib/obd/dtcDescriptions";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { hapticSuccess, hapticWarning } from "@/lib/native";
import { track } from "@/lib/track";

export interface ObdResult {
  codes: { code: string; description: string }[];
  vin: string | null;
  liveData: LiveData;
  freezeFrame: FreezeFrame | null;
}

interface Props {
  /** Called when the user taps "Use in diagnosis" with everything read from the car. */
  onUseInDiagnosis: (result: ObdResult) => void;
  onClose: () => void;
  carId?: string | null;
}

type Phase = "idle" | "connecting" | "reading" | "connected" | "error";

const S = {
  surface: "var(--surface)",
  surface2: "var(--surface-2)",
  border: "var(--border)",
  text: "var(--text)",
  textSec: "var(--text-2)",
  textMuted: "#5d7290",
  accent: "var(--accent)",
  red: "var(--red)",
  amber: "var(--amber)",
  green: "var(--green)",
  mono: "var(--font-jetbrains), monospace",
};

const RECOMMENDED_ADAPTERS = [
  { name: "Veepeak OBDCheck BLE+", price: "~$35", note: "Best budget BLE pick" },
  { name: "Vgate iCar Pro BLE 4.0", price: "~$30", note: "Compact, reliable clone" },
  { name: "OBDLink CX", price: "~$80", note: "Fastest, best build quality" },
];

function amazonSearchUrl(name: string) {
  return `https://www.amazon.com/s?k=${encodeURIComponent(name + " OBD2 bluetooth")}`;
}

export default function ObdScanner({ onUseInDiagnosis, onClose, carId }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const elmRef = useRef<Elm327 | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [codes, setCodes] = useState<{ code: string; description: string }[]>([]);
  const [vin, setVin] = useState<string | null>(null);
  const [live, setLive] = useState<LiveData>({});
  const [freezeFrame, setFreezeFrame] = useState<FreezeFrame | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [saved, setSaved] = useState(false);

  const bluetoothSupported = isObdSupported();

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopPolling();
      elmRef.current?.disconnect();
    };
  }, [stopPolling]);

  async function connect() {
    setErrorMsg(null);
    setPhase("connecting");
    setStatusMsg("Choose your OBD2 adapter in the Bluetooth picker…");
    const elm = new Elm327();
    elmRef.current = elm;
    elm.onDisconnect = () => {
      stopPolling();
      setPhase("idle");
      setStatusMsg("");
      toast("OBD2 adapter disconnected");
    };

    try {
      await elm.connect();
      setPhase("reading");

      setStatusMsg("Reading trouble codes…");
      const stored = await elm.readDtcs();
      const pending = await elm.readPendingDtcs();
      const all = [...new Set([...stored, ...pending])];
      setCodes(all.map((code) => ({ code, description: describeDtc(code) })));

      setStatusMsg("Reading VIN…");
      const v = await elm.readVin();
      setVin(v);

      if (all.length > 0) {
        setStatusMsg("Reading freeze frame…");
        setFreezeFrame(await elm.readFreezeFrame());
      }

      setStatusMsg("Starting live data…");
      setLive(await elm.readLiveData());
      pollRef.current = setInterval(async () => {
        const e = elmRef.current;
        if (!e?.connected) return stopPolling();
        try {
          setLive(await e.readLiveData());
        } catch {
          /* skip a beat — adapter busy */
        }
      }, 2500);

      setPhase("connected");
      track("obd_connected");
      setStatusMsg("");
      hapticSuccess();
    } catch (err) {
      stopPolling();
      elm.disconnect();
      const code = err instanceof Error ? err.message : "";
      if (code === "UNSUPPORTED_ADAPTER") {
        setErrorMsg("Connected, but this adapter doesn't speak a protocol Carlos knows. It may be a Bluetooth Classic ELM327 — see the recommended BLE adapters below.");
      } else if (/cancel/i.test(String(err))) {
        setPhase("idle");
        return;
      } else if (code === "TIMEOUT") {
        setErrorMsg("The adapter stopped responding. Make sure the key is on (engine can be off) and try again.");
      } else {
        setErrorMsg("Couldn't connect. Make sure the adapter is plugged into the OBD2 port and the car's ignition is on.");
      }
      setPhase("error");
      hapticWarning();
    }
  }

  function disconnect() {
    stopPolling();
    elmRef.current?.disconnect();
    setPhase("idle");
  }

  async function clearCodes() {
    const elm = elmRef.current;
    if (!elm?.connected) return;
    setConfirmClear(false);
    try {
      const ok = await elm.clearDtcs();
      if (ok) {
        toast("Codes cleared. The check engine light should turn off shortly.");
        setCodes([]);
        void saveSession(true);
      } else {
        toast("The car refused to clear codes. Try with the engine off, key on.");
      }
    } catch {
      toast("Clearing failed — adapter stopped responding.");
    }
  }

  async function saveSession(cleared = false) {
    if (!user || saved) return;
    try {
      const res = await fetch("/api/obd-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carId: carId ?? null,
          vin,
          dtcCodes: codes,
          freezeFrame,
          liveData: live,
          adapterName: elmRef.current?.deviceName,
          clearedCodes: cleared,
        }),
      });
      if (res.ok) {
        setSaved(true);
        if (!cleared) toast("Scan saved to your garage");
      }
    } catch {
      /* non-fatal */
    }
  }

  const gaugeData: { label: string; value: string; sub?: string; warn?: boolean }[] = [
    { label: "RPM", value: live.rpm !== undefined ? String(Math.round(live.rpm)) : "—" },
    {
      label: "COOLANT",
      value: live.coolantTempC !== undefined ? `${Math.round((live.coolantTempC * 9) / 5 + 32)}°F` : "—",
      warn: (live.coolantTempC ?? 0) > 110,
    },
    { label: "THROTTLE", value: live.throttlePct !== undefined ? `${Math.round(live.throttlePct)}%` : "—" },
    { label: "MAF", value: live.mafGs !== undefined ? `${live.mafGs} g/s` : "—" },
    {
      label: "TRIM ST",
      value: live.shortFuelTrimPct !== undefined ? `${live.shortFuelTrimPct > 0 ? "+" : ""}${live.shortFuelTrimPct}%` : "—",
      warn: Math.abs(live.shortFuelTrimPct ?? 0) > 10,
    },
    {
      label: "TRIM LT",
      value: live.longFuelTrimPct !== undefined ? `${live.longFuelTrimPct > 0 ? "+" : ""}${live.longFuelTrimPct}%` : "—",
      warn: Math.abs(live.longFuelTrimPct ?? 0) > 10,
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="OBD2 Scanner"
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", zIndex: 70, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: "480px", maxHeight: "88dvh", overflowY: "auto", backgroundColor: S.surface, border: `1px solid ${S.border}`, borderTopLeftRadius: "20px", borderTopRightRadius: "20px", padding: "20px", paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))", boxSizing: "border-box" }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "rgba(74,158,255,0.1)", border: "1px solid rgba(74,158,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bluetooth size={18} color={S.accent} aria-hidden="true" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: S.text }}>OBD2 Scanner</h2>
              {phase === "connected" && (
                <span style={{ fontSize: "11px", color: S.green }}>● Connected to {elmRef.current?.deviceName}</span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close OBD2 scanner"
            style={{ background: "none", border: "none", color: S.textMuted, cursor: "pointer", padding: "12px", minWidth: "44px", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Status announcements for screen readers */}
        <div aria-live="polite" style={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", clip: "rect(0 0 0 0)" }}>
          {statusMsg || (phase === "connected" ? `Connected. ${codes.length} trouble codes found.` : "")}
        </div>

        {!bluetoothSupported && (
          <div style={{ backgroundColor: S.surface2, border: `1px solid ${S.border}`, borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <BluetoothOff size={18} color={S.amber} style={{ flexShrink: 0, marginTop: "2px" }} aria-hidden="true" />
              <div>
                <p style={{ margin: "0 0 6px", fontSize: "14px", fontWeight: 600, color: S.text }}>
                  Bluetooth isn&apos;t available here
                </p>
                <p style={{ margin: 0, fontSize: "13px", color: S.textSec, lineHeight: 1.5 }}>
                  Web Bluetooth works in Chrome and Edge on desktop/Android. On iPhone, use the Mechanic Carlos app from the App Store.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Connect / status */}
        {phase !== "connected" && bluetoothSupported && (
          <div style={{ marginBottom: "16px" }}>
            <button
              onClick={connect}
              disabled={phase === "connecting" || phase === "reading"}
              style={{
                width: "100%", height: "52px", borderRadius: "12px", border: "none", cursor: phase === "connecting" || phase === "reading" ? "wait" : "pointer",
                background: "linear-gradient(135deg, #4a9eff 0%, #2d6fd6 100%)", color: "white", fontWeight: 700, fontSize: "15px",
                opacity: phase === "connecting" || phase === "reading" ? 0.7 : 1,
              }}
            >
              {phase === "connecting" || phase === "reading" ? (statusMsg || "Connecting…") : "Connect OBD2 Scanner"}
            </button>
            <p style={{ margin: "10px 0 0", fontSize: "12px", color: S.textMuted, lineHeight: 1.5, textAlign: "center" }}>
              Plug the adapter into the OBD2 port (under the dash, driver&apos;s side) and turn the key to ON.
            </p>
          </div>
        )}

        {errorMsg && (
          <div role="alert" style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "12px", padding: "12px 14px", marginBottom: "16px" }}>
            <p style={{ margin: 0, fontSize: "13px", color: "#fca5a5", lineHeight: 1.5 }}>{errorMsg}</p>
          </div>
        )}

        {/* Connected: DTCs */}
        {phase === "connected" && (
          <>
            <section aria-label="Trouble codes" style={{ marginBottom: "16px" }}>
              <h3 style={{ margin: "0 0 8px", fontSize: "11px", fontWeight: 700, color: S.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Trouble Codes {codes.length > 0 && <span style={{ color: S.red }}>({codes.length})</span>}
              </h3>
              {codes.length === 0 ? (
                <div style={{ backgroundColor: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "12px", padding: "14px" }}>
                  <p style={{ margin: 0, fontSize: "14px", color: "#86efac" }}>No stored trouble codes. The computer isn&apos;t reporting any faults.</p>
                </div>
              ) : (
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                  {codes.map(({ code, description }) => (
                    <li key={code} style={{ backgroundColor: S.surface2, border: `1px solid ${S.border}`, borderLeft: `3px solid ${S.red}`, borderRadius: "10px", padding: "10px 12px", display: "flex", gap: "12px", alignItems: "baseline" }}>
                      <span style={{ fontFamily: S.mono, fontSize: "14px", fontWeight: 700, color: S.red, flexShrink: 0 }}>{code}</span>
                      <span style={{ fontSize: "13px", color: S.textSec, lineHeight: 1.4 }}>{description}</span>
                    </li>
                  ))}
                </ul>
              )}
              {freezeFrame && (freezeFrame.rpm !== undefined || freezeFrame.dtc) && (
                <p style={{ margin: "8px 0 0", fontSize: "12px", color: S.textMuted, lineHeight: 1.5 }}>
                  Freeze frame{freezeFrame.dtc ? ` (${freezeFrame.dtc})` : ""}: fault occurred at{" "}
                  {freezeFrame.rpm !== undefined ? `${Math.round(freezeFrame.rpm)} RPM` : "unknown RPM"}
                  {freezeFrame.coolantTempC !== undefined ? `, coolant ${Math.round((freezeFrame.coolantTempC * 9) / 5 + 32)}°F` : ""}
                  {freezeFrame.speedKmh !== undefined ? `, ${Math.round(freezeFrame.speedKmh * 0.621)} mph` : ""}.
                </p>
              )}
            </section>

            {/* VIN */}
            {vin && (
              <p style={{ margin: "0 0 16px", fontSize: "12px", color: S.textMuted }}>
                VIN read from car: <span style={{ fontFamily: S.mono, color: S.textSec }}>{vin}</span>
              </p>
            )}

            {/* Live dashboard */}
            <section aria-label="Live engine data" style={{ marginBottom: "16px" }}>
              <h3 style={{ margin: "0 0 8px", fontSize: "11px", fontWeight: 700, color: S.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Live Data
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                {gaugeData.map(({ label, value, warn }) => (
                  <div key={label} style={{ backgroundColor: S.surface2, border: `1px solid ${warn ? "rgba(245,158,11,0.4)" : S.border}`, borderRadius: "10px", padding: "10px 8px", textAlign: "center" }}>
                    <div style={{ fontSize: "9px", fontWeight: 700, color: warn ? S.amber : S.textMuted, letterSpacing: "0.08em", marginBottom: "4px" }}>{label}</div>
                    <div style={{ fontFamily: S.mono, fontSize: "16px", fontWeight: 600, color: warn ? S.amber : S.text }}>{value}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                onClick={() => { void saveSession(); onUseInDiagnosis({ codes, vin, liveData: live, freezeFrame }); }}
                style={{ width: "100%", height: "50px", borderRadius: "12px", border: "none", cursor: "pointer", background: "linear-gradient(135deg, #4a9eff 0%, #2d6fd6 100%)", color: "white", fontWeight: 700, fontSize: "15px" }}
              >
                {codes.length > 0 ? `Diagnose these ${codes.length} code${codes.length > 1 ? "s" : ""} →` : "Use live data in diagnosis →"}
              </button>

              <div style={{ display: "flex", gap: "8px" }}>
                {user && (
                  <button
                    onClick={() => void saveSession()}
                    disabled={saved}
                    style={{ flex: 1, height: "44px", borderRadius: "10px", border: `1px solid ${S.border}`, backgroundColor: "transparent", color: saved ? S.textMuted : S.textSec, fontSize: "13px", fontWeight: 600, cursor: saved ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                  >
                    <Save size={14} aria-hidden="true" /> {saved ? "Saved" : "Save scan"}
                  </button>
                )}
                {codes.length > 0 && (
                  <button
                    onClick={() => setConfirmClear(true)}
                    style={{ flex: 1, height: "44px", borderRadius: "10px", border: "1px solid rgba(239,68,68,0.3)", backgroundColor: "transparent", color: "#fca5a5", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                  >
                    <Trash2 size={14} aria-hidden="true" /> Clear codes
                  </button>
                )}
                <button
                  onClick={disconnect}
                  style={{ flex: 1, height: "44px", borderRadius: "10px", border: `1px solid ${S.border}`, backgroundColor: "transparent", color: S.textSec, fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                >
                  Disconnect
                </button>
              </div>
            </div>

            {/* Clear confirmation */}
            {confirmClear && (
              <div role="alertdialog" aria-label="Confirm clearing codes" style={{ marginTop: "12px", backgroundColor: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.35)", borderRadius: "12px", padding: "14px" }}>
                <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
                  <AlertTriangle size={18} color={S.amber} style={{ flexShrink: 0, marginTop: "1px" }} aria-hidden="true" />
                  <p style={{ margin: 0, fontSize: "13px", color: "#fcd34d", lineHeight: 1.5 }}>
                    Clearing codes erases the evidence Carlos uses to diagnose the problem — and the light will just come back if the fault is still there. Diagnose first, clear after the fix.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => setConfirmClear(false)} style={{ flex: 1, height: "44px", borderRadius: "10px", border: "none", backgroundColor: S.surface2, color: S.text, fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                    Keep codes
                  </button>
                  <button onClick={() => void clearCodes()} style={{ flex: 1, height: "44px", borderRadius: "10px", border: "1px solid rgba(239,68,68,0.4)", backgroundColor: "rgba(239,68,68,0.12)", color: "#fca5a5", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                    Clear anyway
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Recommended adapters — shown when not connected */}
        {phase !== "connected" && (
          <section aria-label="Recommended adapters" style={{ marginTop: "4px" }}>
            <h3 style={{ margin: "0 0 8px", fontSize: "11px", fontWeight: 700, color: S.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Don&apos;t have an adapter?
            </h3>
            <p style={{ margin: "0 0 10px", fontSize: "12px", color: S.textMuted, lineHeight: 1.5 }}>
              You need a <strong style={{ color: S.textSec }}>Bluetooth Low Energy (BLE)</strong> adapter — classic-Bluetooth-only ELM327s won&apos;t show up in the picker.
            </p>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
              {RECOMMENDED_ADAPTERS.map((a) => (
                <li key={a.name}>
                  <a
                    href={amazonSearchUrl(a.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", backgroundColor: S.surface2, border: `1px solid ${S.border}`, borderRadius: "10px", padding: "12px", textDecoration: "none", minHeight: "44px", boxSizing: "border-box" }}
                  >
                    <span style={{ fontSize: "13px", fontWeight: 600, color: S.text }}>{a.name}</span>
                    <span style={{ fontSize: "12px", color: S.textMuted, flexShrink: 0 }}>{a.note} · <span style={{ color: S.accent }}>{a.price}</span></span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
