"use client";

import { useState, useRef } from "react";
import type { Diagnostic, ChatMessage } from "@/types/diagnostic";
import DiagnosticReport from "@/components/DiagnosticReport";
import QuoteChecker from "@/components/QuoteChecker";

export default function Home() {
  const [tab, setTab] = useState<"diagnose" | "quote">("diagnose");
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [issue, setIssue] = useState("");
  const [modMode, setModMode] = useState(false);
  const [mods, setMods] = useState("");
  const [hasTune, setHasTune] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [diagnosis, setDiagnosis] = useState<Diagnostic | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const yearRef = useRef<HTMLDivElement>(null);
  const makeRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 35 }, (_, i) => currentYear - i);

  async function handleDiagnose(e: React.FormEvent) {
    e.preventDefault();

    if (!year || !make || !model || !issue.trim()) {
      setShowErrors(true);
      const firstEmpty = !year ? yearRef.current : !make ? makeRef.current : !model ? modelRef.current : null;
      firstEmpty?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setShowErrors(false);
    setLoading(true);
    setError("");
    setDiagnosis(null);
    setChatHistory([]);

    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year, make, model, issue,
          mods: modMode ? mods : "",
          hasTune: modMode ? hasTune : false,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setDiagnosis(data.diagnosis);
      setChatHistory([
        { role: "user", content: `Vehicle: ${year} ${make} ${model}${modMode && mods ? `\nMods: ${mods}${hasTune ? " (tuned)" : ""}` : ""}\n\nIssue: ${issue}` },
        { role: "assistant", content: JSON.stringify(data.diagnosis) },
      ]);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleNewDiagnosis() {
    setDiagnosis(null);
    setChatHistory([]);
    setIssue("");
    setError("");
  }

  if (diagnosis) {
    return (
      <DiagnosticReport
        diagnosis={diagnosis}
        year={year}
        make={make}
        model={model}
        issue={issue}
        chatHistory={chatHistory}
        setChatHistory={setChatHistory}
        onNewDiagnosis={handleNewDiagnosis}
      />
    );
  }

  if (tab === "quote") {
    return <QuoteChecker onBack={() => setTab("diagnose")} />;
  }

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

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "11px",
    fontWeight: 600,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "6px",
  };

  const allFilled = !!year && !!make && !!model && !!issue.trim();
  const canSubmit = !loading && allFilled;

  const fieldError = (value: string, fieldName: string) =>
    showErrors && !value ? (
      <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#ef4444", lineHeight: 1.4 }}>
        Please enter your car&apos;s {fieldName} so we can give you accurate results.
      </p>
    ) : null;

  return (
    <main style={{ minHeight: "100dvh", backgroundColor: "var(--background)", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px 0" }}>
        <div style={{ width: "100%", maxWidth: "480px" }}>

          {/* Title */}
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{ fontSize: "22px" }}>🔧</span>
              <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary)", margin: 0, lineHeight: 1 }}>
                AI Mechanic
              </h1>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: 0 }}>
              Tell us what&apos;s wrong. Get a real answer.
            </p>
          </div>

          {/* Tab bar */}
          <div style={{ display: "flex", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "4px", marginBottom: "12px", gap: "4px" }}>
            {(["diagnose", "quote"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1,
                  height: "36px",
                  borderRadius: "7px",
                  border: "none",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  backgroundColor: tab === t ? "var(--accent)" : "transparent",
                  color: tab === t ? "white" : "var(--text-muted)",
                  transition: "all 150ms ease",
                }}
              >
                {t === "diagnose" ? "🔧 Diagnose" : "💰 Check Quote"}
              </button>
            ))}
          </div>

          {/* Diagnose form */}
          <form
            id="diagnose-form"
            onSubmit={handleDiagnose}
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <div ref={yearRef}>
              <label style={labelStyle}>Year</label>
              <select
                value={year}
                onChange={(e) => { setYear(e.target.value); if (showErrors) setShowErrors(false); }}
                style={{ ...fieldStyle, color: year ? "var(--text-primary)" : "var(--text-muted)", borderColor: showErrors && !year ? "#ef4444" : "#2a2f38" }}
              >
                <option value="">Select year</option>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              {fieldError(year, "year")}
            </div>

            <div ref={makeRef}>
              <label style={labelStyle}>Make</label>
              <input
                type="text"
                value={make}
                onChange={(e) => { setMake(e.target.value); if (showErrors) setShowErrors(false); }}
                placeholder="Toyota"
                style={{ ...fieldStyle, borderColor: showErrors && !make ? "#ef4444" : "#2a2f38" }}
              />
              {fieldError(make, "make")}
            </div>

            <div ref={modelRef}>
              <label style={labelStyle}>Model</label>
              <input
                type="text"
                value={model}
                onChange={(e) => { setModel(e.target.value); if (showErrors) setShowErrors(false); }}
                placeholder="Camry"
                style={{ ...fieldStyle, borderColor: showErrors && !model ? "#ef4444" : "#2a2f38" }}
              />
              {fieldError(model, "model")}
            </div>

            <div>
              <label style={labelStyle}>OBD Code or Symptom</label>
              <textarea
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                placeholder="e.g. P0301 misfire on cylinder 1, rough idle at startup — or describe what you're hearing"
                required
                rows={3}
                style={{ display: "block", width: "100%", minHeight: "100px", padding: "10px 12px", fontSize: "16px", backgroundColor: "var(--surface-2)", border: "1px solid #2a2f38", borderRadius: "8px", color: "var(--text-primary)", resize: "none", lineHeight: 1.5 }}
              />
            </div>

            {/* Mod-aware mode toggle */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: modMode ? "12px" : "0" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>Modified Car</div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Factor in mods and tune</div>
                </div>
                <button
                  type="button"
                  onClick={() => setModMode(!modMode)}
                  style={{ width: "44px", height: "24px", borderRadius: "12px", backgroundColor: modMode ? "var(--accent)" : "var(--surface-2)", border: `1px solid ${modMode ? "var(--accent)" : "var(--border)"}`, position: "relative", cursor: "pointer", transition: "background-color 200ms", flexShrink: 0 }}
                >
                  <div style={{ position: "absolute", top: "3px", left: modMode ? "21px" : "3px", width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "white", transition: "left 200ms ease" }} />
                </button>
              </div>

              {modMode && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div>
                    <label style={labelStyle}>Mods affecting engine / tune</label>
                    <textarea
                      value={mods}
                      onChange={(e) => setMods(e.target.value)}
                      placeholder="e.g. catless downpipe, Cobb Accessport tune, cold air intake"
                      rows={2}
                      style={{ display: "block", width: "100%", padding: "10px 12px", fontSize: "16px", backgroundColor: "var(--surface-2)", border: "1px solid #2a2f38", borderRadius: "8px", color: "var(--text-primary)", resize: "none", lineHeight: 1.5 }}
                    />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontSize: "13px", color: "var(--text-primary)" }}>Currently running a tune?</div>
                    <button
                      type="button"
                      onClick={() => setHasTune(!hasTune)}
                      style={{ width: "44px", height: "24px", borderRadius: "12px", backgroundColor: hasTune ? "var(--accent)" : "var(--surface-2)", border: `1px solid ${hasTune ? "var(--accent)" : "var(--border)"}`, position: "relative", cursor: "pointer", transition: "background-color 200ms", flexShrink: 0 }}
                    >
                      <div style={{ position: "absolute", top: "3px", left: hasTune ? "21px" : "3px", width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "white", transition: "left 200ms ease" }} />
                    </button>
                  </div>
                </div>
              )}
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

      {/* Fixed bottom button */}
      <div style={{ padding: "12px 16px", paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))", backgroundColor: "var(--background)", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
        <button
          type="submit"
          form="diagnose-form"
          disabled={loading}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", height: "56px", backgroundColor: "var(--accent)", color: "white", fontWeight: 600, fontSize: "15px", border: "none", borderRadius: "10px", cursor: loading ? "not-allowed" : "pointer", opacity: allFilled || loading ? 1 : 0.55 }}
        >
          {loading ? (
            <><span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⚙</span> Diagnosing...</>
          ) : "Diagnose"}
        </button>
      </div>
    </main>
  );
}
