"use client";

import { useState } from "react";
import type { QuoteAnalysis } from "@/types/quote";

interface Props {
  onBack: () => void;
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
  color: "var(--text-muted)",
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
  backgroundColor: "var(--surface-2)",
  border: "1px solid #2a2f38",
  borderRadius: "8px",
  color: "var(--text-primary)",
};

export default function QuoteChecker({ onBack }: Props) {
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [quoteText, setQuoteText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<QuoteAnalysis | null>(null);
  const [copied, setCopied] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 35 }, (_, i) => currentYear - i);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!year || !make || !model || !quoteText.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/check-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, make, model, quote: quoteText }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Something went wrong.");
        return;
      }
      setResult(data.analysis);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  async function copyScript() {
    if (!result) return;
    await navigator.clipboard.writeText(result.negotiationScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const canSubmit = !loading && !!year && !!make && !!model && !!quoteText.trim();

  if (result) {
    const overall = VERDICT_CONFIG[result.overallVerdict];
    return (
      <div style={{ minHeight: "100dvh", backgroundColor: "var(--background)", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ position: "sticky", top: 0, zIndex: 10, height: "48px", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "15px" }}>💰</span>
            <div>
              <div style={{ fontSize: "15px", fontWeight: 600, lineHeight: 1.2, color: "var(--text-primary)" }}>Quote Analysis</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.2 }}>{year} {make} {model}</div>
            </div>
          </div>
          <button onClick={() => setResult(null)} style={{ fontSize: "12px", fontWeight: 500, padding: "5px 12px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.2)", color: "white", backgroundColor: "transparent", cursor: "pointer" }}>
            ← New
          </button>
        </div>

        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>

          {/* Total comparison — hero */}
          <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
              <div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Quoted</div>
                <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary)" }}>${result.totalQuoted}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Fair Range</div>
                <div style={{ fontSize: "28px", fontWeight: 700, color: "#22c55e" }}>{result.totalFair}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5, flex: 1, paddingRight: "12px" }}>{result.summary}</p>
              <span style={{ backgroundColor: overall.bg, border: `1px solid ${overall.border}`, color: overall.text, fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", whiteSpace: "nowrap", flexShrink: 0 }}>
                {overall.label}
              </span>
            </div>
          </div>

          {/* Red flags */}
          {result.redFlags.length > 0 && (
            <div style={{ backgroundColor: "#150a0a", border: "1px solid #2a1515", borderRadius: "10px", padding: "14px 16px" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>🚩 Red Flags</div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" }}>
                {result.redFlags.map((flag, i) => (
                  <li key={i} style={{ display: "flex", gap: "8px", fontSize: "13px", lineHeight: 1.4 }}>
                    <span style={{ color: "#ef4444", fontWeight: 700, flexShrink: 0 }}>›</span>
                    <span style={{ color: "var(--text-primary)" }}>{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Line items */}
          <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "14px 16px" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>🔍 Line by Line</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {result.lineItems.map((item, i) => {
                const vc = VERDICT_CONFIG[item.verdict];
                return (
                  <div key={i} style={{ backgroundColor: "var(--surface-2)", border: `1px solid var(--border)`, borderRadius: "8px", padding: "12px", borderLeft: `3px solid ${vc.text}` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "6px" }}>
                      <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)" }}>{item.service}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                        <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>${item.quotedPrice}</span>
                        <span style={{ backgroundColor: vc.bg, color: vc.text, fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", letterSpacing: "0.04em" }}>{vc.label}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Fair: {item.fairRange}</div>
                    <p style={{ margin: 0, fontSize: "13px", color: "#8b95a3", lineHeight: 1.5, marginBottom: "8px" }}>{item.note}</p>
                    {item.verdict !== "FAIR" && (
                      <div style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 10px" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>ASK: </span>
                        <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{item.askMechanic}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Negotiation script */}
          <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>💬 Negotiation Script</div>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Screenshot this</span>
            </div>
            <div style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "8px", padding: "14px", marginBottom: "12px" }}>
              <p style={{ margin: 0, fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {result.negotiationScript}
              </p>
            </div>
            <button
              onClick={copyScript}
              style={{
                width: "100%",
                height: "48px",
                backgroundColor: copied ? "#22c55e" : "var(--accent)",
                color: "white",
                fontWeight: 600,
                fontSize: "15px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "background-color 200ms",
              }}
            >
              {copied ? "✓ Copied!" : "Copy Script"}
            </button>
          </div>

          <div style={{ height: "24px" }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "var(--background)", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px 0" }}>
        <div style={{ width: "100%", maxWidth: "480px" }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{ fontSize: "22px" }}>💰</span>
              <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary)", margin: 0, lineHeight: 1 }}>
                Check My Quote
              </h1>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: 0 }}>
              Find out if your mechanic is charging fair prices.
            </p>
          </div>

          <form
            id="quote-form"
            onSubmit={handleSubmit}
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <div>
              <label style={labelStyle}>Year</label>
              <select value={year} onChange={(e) => setYear(e.target.value)} required style={{ ...fieldStyle, color: year ? "var(--text-primary)" : "var(--text-muted)" }}>
                <option value="">Select year</option>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Make</label>
              <input type="text" value={make} onChange={(e) => setMake(e.target.value)} placeholder="Toyota" required style={fieldStyle} />
            </div>

            <div>
              <label style={labelStyle}>Model</label>
              <input type="text" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Camry" required style={fieldStyle} />
            </div>

            <div>
              <label style={labelStyle}>Mechanic's Quote</label>
              <textarea
                value={quoteText}
                onChange={(e) => setQuoteText(e.target.value)}
                placeholder={"Oil change $89, Brake pads front $320, Brake fluid flush $180\n\nor paste line items from a written estimate"}
                required
                rows={5}
                style={{ display: "block", width: "100%", minHeight: "120px", padding: "10px 12px", fontSize: "16px", backgroundColor: "var(--surface-2)", border: "1px solid #2a2f38", borderRadius: "8px", color: "var(--text-primary)", resize: "none", lineHeight: 1.5 }}
              />
            </div>

            {error && (
              <div style={{ padding: "10px 12px", backgroundColor: "#1a0a0a", border: "1px solid #3a1515", borderRadius: "8px", color: "#ef4444", fontSize: "13px" }}>
                {error}
              </div>
            )}
          </form>

          <p style={{ textAlign: "center", marginTop: "12px", fontSize: "12px", color: "var(--text-muted)", opacity: 0.45 }}>
            🔒 Your data is never stored
          </p>
        </div>
      </div>

      <div style={{ padding: "12px 16px", paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))", backgroundColor: "var(--background)", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
        <button
          type="submit"
          form="quote-form"
          disabled={!canSubmit}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", height: "56px", backgroundColor: "var(--accent)", color: "white", fontWeight: 600, fontSize: "15px", border: "none", borderRadius: "10px", cursor: canSubmit ? "pointer" : "not-allowed", opacity: canSubmit ? 1 : 0.4 }}
        >
          {loading ? (
            <><span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⚙</span> Analyzing...</>
          ) : "Check Quote"}
        </button>
      </div>
    </div>
  );
}
