"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Check } from "lucide-react";

interface VinData {
  vin: string;
  year: string;
  make: string;
  model: string;
  engine?: string;
  fuelType?: string;
  drivetrain?: string;
  displayLine: string;
}

interface Props {
  onDecode: (data: VinData) => void;
}

const fieldStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  height: "48px",
  padding: "0 44px 0 14px",
  fontSize: "16px",
  fontFamily: "monospace",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  backgroundColor: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  color: "var(--text)",
  boxSizing: "border-box",
};

export default function VinInput({ onDecode }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [vin, setVin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [decoded, setDecoded] = useState<VinData | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  async function decodeVin(rawVin: string) {
    const v = rawVin.trim().toUpperCase();
    if (v.length !== 17) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${v}?format=json`
      );
      const data = await res.json();
      const results = data.Results || [];

      function get(variable: string): string {
        return results.find((r: { Variable: string; Value: string }) => r.Variable === variable)?.Value || "";
      }

      const year = get("Model Year");
      const make = get("Make");
      const model = get("Model");
      const engine = get("Displacement (L)") ? `${get("Displacement (L)")}L ${get("Engine Configuration") || ""}`.trim() : "";
      const fuelType = get("Fuel Type - Primary");
      const drivetrain = get("Drive Type");

      if (!year || !make || !model) {
        setError("Couldn't decode this VIN. Check it and try again.");
        return;
      }

      const parts = [engine, drivetrain, fuelType].filter(Boolean);
      const displayLine = `${year} ${make} ${model}${parts.length ? " · " + parts.join(" · ") : ""}`;

      const vinData: VinData = { vin: v, year, make, model, engine, fuelType, drivetrain, displayLine };
      setDecoded(vinData);
      onDecode(vinData);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function openScanner() {
    setScanOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const reader = new BrowserMultiFormatReader();
      if (!videoRef.current) return;

      reader.decodeFromVideoElement(videoRef.current, (result, err) => {
        if (result) {
          const text = result.getText().toUpperCase();
          if (/^[A-HJ-NPR-Z0-9]{17}$/.test(text)) {
            setVin(text);
            stopCamera();
            setScanOpen(false);
            decodeVin(text);
          }
        }
        void err; // suppress console noise
      });
    } catch {
      setScanOpen(false);
      setError("Camera access denied. Enter VIN manually.");
    }
  }

  function handleVinChange(val: string) {
    const clean = val.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "").slice(0, 17);
    setVin(clean);
    setDecoded(null);
    setError("");
    if (clean.length === 17) decodeVin(clean);
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        style={{ fontSize: "12px", color: "var(--text-2)", backgroundColor: "transparent", border: "none", cursor: "pointer", padding: "0", textDecoration: "underline", textDecorationStyle: "dotted" }}
      >
        Or enter your VIN for exact specs →
      </button>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={vin}
          onChange={(e) => handleVinChange(e.target.value)}
          placeholder="17-CHARACTER VIN"
          maxLength={17}
          autoCapitalize="characters"
          style={{ ...fieldStyle, borderColor: error ? "var(--red)" : vin.length === 17 && decoded ? "var(--green)" : "var(--border)" }}
        />
        <button
          type="button"
          onClick={openScanner}
          title="Scan VIN barcode"
          style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", backgroundColor: "transparent", border: "none", cursor: "pointer", color: "#6b7280", display: "flex", alignItems: "center", padding: "4px" }}
        >
          <Camera size={18} />
        </button>
      </div>

      {loading && (
        <div style={{ fontSize: "12px", color: "#6b7280" }}>Decoding VIN…</div>
      )}
      {error && (
        <div style={{ fontSize: "12px", color: "var(--red)" }}>{error}</div>
      )}
      {decoded && (
        <div style={{ backgroundColor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "8px", padding: "10px 12px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Check size={14} color="#22c55e" />
          <span style={{ fontSize: "13px", color: "var(--green)", fontWeight: 500 }}>{decoded.displayLine}</span>
        </div>
      )}

      {/* VIN Scanner Modal */}
      {scanOpen && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.95)", zIndex: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "12px" }}>
            Point camera at the VIN barcode (door jamb sticker)
          </div>
          <div style={{ position: "relative", width: "100%", maxWidth: "480px", borderRadius: "12px", overflow: "hidden" }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", display: "block" }} />
            {/* Scan frame overlay */}
            <div style={{ position: "absolute", inset: 0, border: "2px solid rgba(59,130,246,0.6)", borderRadius: "12px", pointerEvents: "none" }} />
          </div>
          <button
            type="button"
            onClick={() => { stopCamera(); setScanOpen(false); }}
            style={{ marginTop: "20px", padding: "10px 28px", backgroundColor: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "14px", cursor: "pointer" }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
