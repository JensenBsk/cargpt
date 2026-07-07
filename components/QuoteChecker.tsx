"use client";

import { useState, useRef } from "react";
import { X } from "lucide-react";
import type { QuoteAnalysis } from "@/types/quote";
import { resizeImage } from "@/utils/resizeImage";
import { track } from "@/lib/track";

interface Props {
  onBack?: () => void;
  onResultChange?: (hasResult: boolean) => void;
  onToast?: (msg: string) => void;
}

const VERDICT_CONFIG = {
  FAIR: { bg: "rgba(34,197,94,0.12)", border: "#1e3a28", text: "var(--green)", label: "FAIR" },
  HIGH: { bg: "rgba(245,158,11,0.12)", border: "#3a2a00", text: "var(--amber)", label: "HIGH" },
  RED_FLAG: { bg: "rgba(239,68,68,0.12)", border: "#3a1515", text: "var(--red)", label: "RED FLAG" },
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "13px",
  fontWeight: 500,
  color: "var(--text-2)",
  textTransform: "none",
  letterSpacing: 0,
  marginBottom: "6px",
};

const fieldStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  height: "48px",
  padding: "0 12px",
  fontSize: "16px",
  backgroundColor: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  color: "var(--text)",
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
  const [showRights, setShowRights] = useState(false);
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
      track("quote_checked", { verdict: data.analysis?.overallVerdict ?? "unknown" });
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

  function parseDollarAmount(s: string): number | null {
    const n = parseInt(s.replace(/[^0-9]/g, ""));
    return isNaN(n) ? null : n;
  }

  if (result) {
    const overall = VERDICT_CONFIG[result.overallVerdict];
    const fairLow = parseDollarAmount((result.totalFair ?? "").split("–")[0]);
    const potentialSavings = fairLow && result.totalQuoted > fairLow ? result.totalQuoted - fairLow : null;
    return (
      <div style={{ minHeight: "100dvh", backgroundColor: "var(--bg)", display: "flex", flexDirection: "column" }}>
        <div style={{ position: "sticky", top: 0, zIndex: 10, height: "52px", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 600, lineHeight: 1.2, color: "var(--text)" }}>Quote Analysis</div>
            <div style={{ fontSize: "11px", color: "var(--text-2)", lineHeight: 1.2 }}>{year} {make} {model}</div>
          </div>
          <button onClick={clearResult} className="tap-target" style={{ fontSize: "12px", fontWeight: 500, padding: "5px 12px", borderRadius: "20px", border: "1px solid var(--border-muted)", color: "var(--text-2)", backgroundColor: "transparent", cursor: "pointer" }}>
            ← New
          </button>
        </div>

        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Total comparison */}
          <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
              <div>
                <div style={{ fontSize: "11px", color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Quoted</div>
                <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--text)" }}>${result.totalQuoted}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "11px", color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Fair Range</div>
                <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--green)" }}>{result.totalFair}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-2)", lineHeight: 1.5, flex: 1, paddingRight: "12px" }}>{result.summary}</p>
              <span style={{ backgroundColor: overall.bg, border: `1px solid ${overall.border}`, color: overall.text, fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", whiteSpace: "nowrap", flexShrink: 0 }}>
                {overall.label}
              </span>
            </div>
            <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid var(--border)" }}>
              <span style={{ fontSize: "11px", color: "var(--text-3)" }}>✓ Independent analysis — Carlos has no relationship with any mechanic or repair shop</span>
            </div>
          </div>

          {/* Savings callout */}
          {potentialSavings !== null && potentialSavings > 0 && (
            <div style={{ backgroundColor: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "10px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "14px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/carlos/carlos-reading.webp" alt="" aria-hidden="true" style={{ height: "52px", width: "auto", filter: "drop-shadow(0 2px 8px rgba(34,197,94,0.2))", flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "22px", fontWeight: 800, color: "var(--green)", lineHeight: 1 }}>
                  ${potentialSavings.toLocaleString()}+ to save
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-3)", marginTop: "3px" }}>Use the negotiation script below to push back</div>
              </div>
            </div>
          )}

          {/* Red flags */}
          {result.redFlags.length > 0 && (
            <div style={{ backgroundColor: "#150a0a", border: "1px solid #2a1515", borderRadius: "10px", padding: "14px 16px" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>🚩 Red Flags</div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" }}>
                {result.redFlags.map((flag, i) => (
                  <li key={i} style={{ display: "flex", gap: "8px", fontSize: "13px", lineHeight: 1.4 }}>
                    <span style={{ color: "var(--red)", fontWeight: 700, flexShrink: 0 }}>›</span>
                    <span style={{ color: "var(--text)" }}>{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Line items */}
          <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "14px 16px" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>🔍 Line by Line</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {result.lineItems.map((item, i) => {
                const vc = VERDICT_CONFIG[item.verdict];
                return (
                  <div key={i} style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px", borderLeft: `3px solid ${vc.text}` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "6px" }}>
                      <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)" }}>{item.service}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                        <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>${item.quotedPrice}</span>
                        <span style={{ backgroundColor: vc.bg, color: vc.text, fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", letterSpacing: "0.04em" }}>{vc.label}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-2)", marginBottom: "4px" }}>Fair: {item.fairRange}</div>
                    <p style={{ margin: 0, fontSize: "13px", color: "var(--text-2)", lineHeight: 1.5, marginBottom: "8px" }}>{item.note}</p>
                    {item.verdict !== "FAIR" && (
                      <div style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 10px" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-2)", fontWeight: 600 }}>ASK: </span>
                        <span style={{ fontSize: "13px", color: "var(--text-2)" }}>{item.askMechanic}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer rights */}
          <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
            <button onClick={() => setShowRights(v => !v)} style={{ width: "100%", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "transparent", border: "none", cursor: "pointer" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-2)" }}>⚖️ Your rights as a customer</span>
              <span style={{ fontSize: "12px", color: "var(--text-3)" }}>{showRights ? "↑" : "↓"}</span>
            </button>
            {showRights && (
              <div style={{ padding: "0 16px 14px", borderTop: "1px solid var(--border)" }}>
                <ul style={{ margin: "12px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    "You can always ask for an itemized invoice showing parts cost separately from labor.",
                    "You have the right to get your old parts back after any repair.",
                    "You can get a second opinion before approving any work — a good shop won't pressure you.",
                    "If labor exceeds the estimate by more than 10%, the shop should have called you first (required by law in most US states).",
                    "You never have to approve additional work discovered during a repair without a new estimate.",
                  ].map((right, i) => (
                    <li key={i} style={{ display: "flex", gap: "8px", fontSize: "13px", color: "var(--text-2)", lineHeight: 1.5 }}>
                      <span style={{ color: "var(--accent)", flexShrink: 0, fontWeight: 700 }}>›</span>
                      {right}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Negotiation script */}
          <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>💬 Negotiation Script</div>
              <span style={{ fontSize: "11px", color: "var(--text-2)" }}>Screenshot this</span>
            </div>
            <div style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "8px", padding: "14px", marginBottom: "12px" }}>
              <p style={{ margin: 0, fontSize: "14px", color: "var(--text)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {result.negotiationScript}
              </p>
            </div>
            <button
              onClick={copyScript}
              className="tap-target"
              style={{ width: "100%", height: "48px", backgroundColor: copied ? "var(--green)" : "var(--accent)", color: "white", fontWeight: 600, fontSize: "15px", border: "none", borderRadius: "8px", cursor: "pointer", transition: "background-color 200ms" }}
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
    <div style={{ minHeight: "100dvh", backgroundColor: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "24px 16px 0" }}>
        <div style={{ width: "100%", maxWidth: "480px" }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/carlos/carlos-reading.webp" alt="" aria-hidden="true" style={{ height: "100px", width: "auto", margin: "0 auto 12px", display: "block", filter: "drop-shadow(0 4px 16px rgba(59,130,246,0.25)) drop-shadow(0 2px 8px rgba(0,0,0,0.4))" }} />
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text)", margin: "0 0 6px", lineHeight: 1.15 }}>
              Is your mechanic overcharging?
            </h1>
            <p style={{ color: "var(--text-2)", fontSize: "14px", margin: 0, lineHeight: 1.5 }}>
              Paste the estimate or photograph it. Carlos flags what&apos;s fair, inflated, or a red flag.
            </p>
          </div>

          <form
            id="quote-form"
            onSubmit={handleSubmit}
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <div>
              <label style={labelStyle}>Year</label>
              <select value={year} onChange={(e) => setYear(e.target.value)} required style={{ ...fieldStyle, color: year ? "var(--text)" : "var(--text-2)" }}>
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
              <label style={labelStyle}>Paste the quote</label>
              <textarea
                value={quoteText}
                onChange={(e) => setQuoteText(e.target.value)}
                placeholder={"Oil change $89, Brake pads front $320, Brake fluid flush $180\n\nor paste line items from a written estimate"}
                rows={4}
                style={{ display: "block", width: "100%", minHeight: "100px", padding: "10px 12px", fontSize: "16px", backgroundColor: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", resize: "none", lineHeight: 1.5, boxSizing: "border-box" }}
              />
            </div>

            {/* OR divider */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }} />
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-4)", letterSpacing: "0.08em" }}>OR</span>
              <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }} />
            </div>

            {/* Photo upload */}
            <div>
              <label style={labelStyle}>Or photograph it</label>
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
                  <div style={{ background: "var(--input)", border: "1px solid var(--border)", borderRadius: "12px", padding: "28px 24px", textAlign: "center" }}>
                    <span style={{ fontSize: "28px", display: "block", marginBottom: "8px" }}>📷</span>
                    <p style={{ color: "#6b7280", fontSize: "14px", fontWeight: 600, margin: "0 0 4px" }}>
                      {resizing ? "Resizing…" : "Tap to photograph your quote"}
                    </p>
                    <p style={{ color: "#4b5563", fontSize: "12px", margin: 0 }}>Opens camera on mobile</p>
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
              <div style={{ padding: "10px 12px", backgroundColor: "#1a0a0a", border: "1px solid #3a1515", borderRadius: "8px", color: "var(--red)", fontSize: "13px" }}>
                {error}
              </div>
            )}
          </form>

          <p style={{ textAlign: "center", marginTop: "12px", fontSize: "12px", color: "var(--text-2)", opacity: 0.45 }}>
            🔒 Quotes aren&apos;t saved after analysis — and your data is never sold
          </p>
        </div>
      </div>

      <div style={{ padding: "12px 16px", paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px))", backgroundColor: "var(--bg)", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
        <button
          type="submit"
          form="quote-form"
          disabled={!canSubmit}
          className={loading ? "btn-shimmer" : "tap-target"}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", height: "56px", background: "var(--accent)", color: "white", fontWeight: 700, fontSize: "15px", border: "none", borderRadius: "10px", cursor: canSubmit ? "pointer" : "not-allowed", boxShadow: "0 4px 16px rgba(59,130,246,0.3)" }}
        >
          {loading ? (quoteImage ? "Carlos is reading your quote…" : "Carlos is reading your quote…") : "Ask Carlos"}
        </button>
      </div>
    </div>
  );
}
