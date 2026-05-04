"use client";

import { useState, useRef } from "react";
import { Camera, X } from "lucide-react";
import type { QuoteAnalysis } from "@/types/quote";
import { resizeImage } from "@/utils/resizeImage";

interface Props {
  onBack?: () => void;
  onResultChange?: (hasResult: boolean) => void;
  onToast?: (msg: string) => void;
}

const VERDICT_CONFIG = {
  FAIR: { bg: "rgba(34,197,94,0.12)", border: "#1e3a28", text: "#22c55e", label: "FAIR" },
  HIGH: { bg: "rgba(245,158,11,0.12)", border: "#3a2a00", text: "#f59e0b", label: "HIGH" },
  RED_FLAG: { bg: "rgba(239,68,68,0.12)", border: "#3a1515", text: "#ef4444", label: "RED FLAG" },
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: 600,
  color: "#7d8fa8",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: "6px",
};

const fieldStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  height: "48px",
  padding: "0 12px",
  fontSize: "16px",
  backgroundColor: "#101822",
  border: "1px solid #172134",
  borderRadius: "8px",
  color: "#dce8f5",
  boxSizing: "border-box",
};

export default function QuoteChecker({ onResultChange, onToast }: Props) {
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [quoteText, setQuoteText] = useState("");
  const [quoteImage, setQuoteImage] = useState<string | null>(null);
  const [resizing, setResizing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<QuoteAnalysis | null>(null);
  const [copied, setCopied] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 35 }, (_, i) => currentYear - i);

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResizing(true);
    setError("");
    try {
      const base64 = await resizeImage(file);
      setQuoteImage(base64);
    } catch {
      setError("Couldn't read that image. Try another photo.");
    } finally {
      setResizing(false);
      if (e.target) e.target.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!year || !make || !model) return;
    if (!quoteText.trim() && !quoteImage) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/check-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year,
          make,
          model,
          quote: quoteText,
          imageBase64: quoteImage || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Something went wrong.");
        return;
      }
      setResult(data.analysis);
      onResultChange?.(true);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  function clearResult() {
    setResult(null);
    onResultChange?.(false);
  }

  async function copyScript() {
    if (!result) return;
    await navigator.clipboard.writeText(result.negotiationScript);
    setCopied(true);
    onToast?.("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  const canSubmit = !loading && !!year && !!make && !!model && (!!quoteText.trim() || !!quoteImage);

  if (result) {
    const overall = VERDICT_CONFIG[result.overallVerdict];
    return (
      <div style={{ minHeight: "100dvh", backgroundColor: "#060810", display: "flex", flexDirection: "column" }}>
        <div style={{ position: "sticky", top: 0, zIndex: 10, height: "52px", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#0b1019", borderBottom: "1px solid #1e2329" }}>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 600, lineHeight: 1.2, color: "#dce8f5" }}>Quote Analysis</div>
            <div style={{ fontSize: "11px", color: "#7d8fa8", lineHeight: 1.2 }}>{year} {make} {model}</div>
          </div>
          <button onClick={clearResult} className="tap-target" style={{ fontSize: "12px", fontWeight: 500, padding: "5px 12px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.2)", color: "white", backgroundColor: "transparent", cursor: "pointer" }}>
            ← New
          </button>
        </div>

        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Total comparison */}
          <div style={{ backgroundColor: "#0b1019", border: "1px solid #1e2329", borderRadius: "10px", padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
              <div>
                <div style={{ fontSize: "11px", color: "#7d8fa8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Quoted</div>
                <div style={{ fontSize: "28px", fontWeight: 700, color: "#dce8f5" }}>${result.totalQuoted}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "11px", color: "#7d8fa8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Fair Range</div>
                <div style={{ fontSize: "28px", fontWeight: 700, color: "#22c55e" }}>{result.totalFair}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "#7d8fa8", lineHeight: 1.5, flex: 1, paddingRight: "12px" }}>{result.summary}</p>
              <span style={{ backgroundColor: overall.bg, border: `1px solid ${overall.border}`, color: overall.text, fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", whiteSpace: "nowrap", flexShrink: 0 }}>
                {overall.label}
              </span>
            </div>
          </div>

          {/* Red flags */}
          {result.redFlags.length > 0 && (
            <div style={{ backgroundColor: "#150a0a", border: "1px solid #2a1515", borderRadius: "10px", padding: "14px 16px" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "#7d8fa8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>🚩 Red Flags</div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" }}>
                {result.redFlags.map((flag, i) => (
                  <li key={i} style={{ display: "flex", gap: "8px", fontSize: "13px", lineHeight: 1.4 }}>
                    <span style={{ color: "#ef4444", fontWeight: 700, flexShrink: 0 }}>›</span>
                    <span style={{ color: "#dce8f5" }}>{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Line items */}
          <div style={{ backgroundColor: "#0b1019", border: "1px solid #1e2329", borderRadius: "10px", padding: "14px 16px" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "#7d8fa8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>🔍 Line by Line</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {result.lineItems.map((item, i) => {
                const vc = VERDICT_CONFIG[item.verdict];
                return (
                  <div key={i} style={{ backgroundColor: "#101822", border: "1px solid #1e2329", borderRadius: "8px", padding: "12px", borderLeft: `3px solid ${vc.text}` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "6px" }}>
                      <span style={{ fontSize: "15px", fontWeight: 600, color: "#dce8f5" }}>{item.service}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                        <span style={{ fontSize: "15px", fontWeight: 700, color: "#dce8f5" }}>${item.quotedPrice}</span>
                        <span style={{ backgroundColor: vc.bg, color: vc.text, fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", letterSpacing: "0.04em" }}>{vc.label}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: "12px", color: "#7d8fa8", marginBottom: "4px" }}>Fair: {item.fairRange}</div>
                    <p style={{ margin: 0, fontSize: "13px", color: "#7d8fa8", lineHeight: 1.5, marginBottom: "8px" }}>{item.note}</p>
                    {item.verdict !== "FAIR" && (
                      <div style={{ backgroundColor: "#060810", border: "1px solid #1e2329", borderRadius: "6px", padding: "8px 10px" }}>
                        <span style={{ fontSize: "11px", color: "#7d8fa8", fontWeight: 600 }}>ASK: </span>
                        <span style={{ fontSize: "13px", color: "#7d8fa8" }}>{item.askMechanic}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Negotiation script */}
          <div style={{ backgroundColor: "#0b1019", border: "1px solid #1e2329", borderRadius: "10px", padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "#7d8fa8", textTransform: "uppercase", letterSpacing: "0.08em" }}>💬 Negotiation Script</div>
              <span style={{ fontSize: "11px", color: "#7d8fa8" }}>Screenshot this</span>
            </div>
            <div style={{ backgroundColor: "#101822", border: "1px solid #1e2329", borderRadius: "8px", padding: "14px", marginBottom: "12px" }}>
              <p style={{ margin: 0, fontSize: "14px", color: "#dce8f5", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {result.negotiationScript}
              </p>
            </div>
            <button
              onClick={copyScript}
              className="tap-target"
              style={{ width: "100%", height: "48px", backgroundColor: copied ? "#22c55e" : "#4a9eff", color: "white", fontWeight: 600, fontSize: "15px", border: "none", borderRadius: "8px", cursor: "pointer", transition: "background-color 200ms" }}
            >
              {copied ? "✓ Copied!" : "Copy Script"}
            </button>
          </div>

          <div style={{ height: "calc(80px + env(safe-area-inset-bottom, 0px))" }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "#060810", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "24px 16px 0" }}>
        <div style={{ width: "100%", maxWidth: "480px" }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{ fontSize: "22px" }}>💰</span>
              <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#dce8f5", margin: 0, lineHeight: 1 }}>
                Check My Quote
              </h1>
            </div>
            <p style={{ color: "#7d8fa8", fontSize: "14px", margin: 0 }}>
              Find out if your mechanic is charging fair prices.
            </p>
          </div>

          <form
            id="quote-form"
            onSubmit={handleSubmit}
            style={{ backgroundColor: "#0b1019", border: "1px solid #1e2329", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <div>
              <label style={labelStyle}>Year</label>
              <select value={year} onChange={(e) => setYear(e.target.value)} required style={{ ...fieldStyle, color: year ? "#dce8f5" : "#7d8fa8" }}>
                <option value="">Select year</option>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={labelStyle}>Make</label>
                <input type="text" value={make} onChange={(e) => setMake(e.target.value)} placeholder="Toyota" required style={fieldStyle} />
              </div>
              <div>
                <label style={labelStyle}>Model</label>
                <input type="text" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Camry" required style={fieldStyle} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Mechanic&apos;s Quote</label>
              <textarea
                value={quoteText}
                onChange={(e) => setQuoteText(e.target.value)}
                placeholder={"Oil change $89, Brake pads front $320, Brake fluid flush $180\n\nor paste line items from a written estimate"}
                rows={4}
                style={{ display: "block", width: "100%", minHeight: "100px", padding: "10px 12px", fontSize: "16px", backgroundColor: "#101822", border: "1px solid #172134", borderRadius: "8px", color: "#dce8f5", resize: "none", lineHeight: 1.5, boxSizing: "border-box" }}
              />
            </div>

            {/* OR divider */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ flex: 1, height: "1px", backgroundColor: "#172134" }} />
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#2d3f55", letterSpacing: "0.08em" }}>OR</span>
              <div style={{ flex: 1, height: "1px", backgroundColor: "#172134" }} />
            </div>

            {/* Photo upload */}
            <div>
              <label style={labelStyle}>
                <Camera size={10} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                Photograph your quote
              </label>
              {quoteImage ? (
                <div style={{ position: "relative" }}>
                  <div className={loading ? "photo-scanning" : ""} style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid #252b34" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={quoteImage} alt="Quote" style={{ width: "100%", maxHeight: "200px", objectFit: "cover", display: "block" }} />
                  </div>
                  {!loading && (
                    <button
                      type="button"
                      onClick={() => setQuoteImage(null)}
                      style={{ position: "absolute", top: "8px", right: "8px", width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.7)", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ) : (
                <label htmlFor="quote-photo-input" style={{ display: "block", cursor: resizing ? "wait" : "pointer" }}>
                  <div style={{ border: "2px dashed #252b34", borderRadius: "10px", padding: "20px", textAlign: "center", color: "#4a5c72", fontSize: "13px", backgroundColor: "#060810" }}>
                    <Camera size={22} color="#2d3f55" style={{ margin: "0 auto 6px", display: "block" }} />
                    <div style={{ fontWeight: 600, marginBottom: "2px", color: "#7d8fa8" }}>{resizing ? "Resizing…" : "Tap to photograph"}</div>
                    <div style={{ fontSize: "12px" }}>Opens camera on mobile</div>
                  </div>
                  <input
                    id="quote-photo-input"
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: "none" }}
                    onChange={handlePhotoSelect}
                    disabled={resizing}
                  />
                </label>
              )}
            </div>

            {error && (
              <div style={{ padding: "10px 12px", backgroundColor: "#1a0a0a", border: "1px solid #3a1515", borderRadius: "8px", color: "#ef4444", fontSize: "13px" }}>
                {error}
              </div>
            )}
          </form>

          <p style={{ textAlign: "center", marginTop: "12px", fontSize: "12px", color: "#7d8fa8", opacity: 0.45 }}>
            🔒 Your data is never stored
          </p>
        </div>
      </div>

      <div style={{ padding: "12px 16px", paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px))", backgroundColor: "#060810", borderTop: "1px solid #1e2329", flexShrink: 0 }}>
        <button
          type="submit"
          form="quote-form"
          disabled={!canSubmit}
          className={loading ? "btn-shimmer" : "tap-target"}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", height: "56px", backgroundColor: "#4a9eff", color: "white", fontWeight: 600, fontSize: "15px", border: "none", borderRadius: "10px", cursor: canSubmit ? "pointer" : "not-allowed", opacity: canSubmit ? 1 : 0.4 }}
        >
          {loading ? (quoteImage ? "Analyzing photo…" : "Analyzing…") : "Check Quote"}
        </button>
      </div>
    </div>
  );
}
