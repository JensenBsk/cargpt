"use client";

import { useState } from "react";
import type { Diagnostic, ChatMessage } from "@/types/diagnostic";
import DiagnosticReport from "@/components/DiagnosticReport";

export default function Home() {
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [issue, setIssue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [diagnosis, setDiagnosis] = useState<Diagnostic | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 35 }, (_, i) => currentYear - i);

  async function handleDiagnose(e: React.FormEvent) {
    e.preventDefault();
    if (!year || !make || !model || !issue.trim()) return;

    setLoading(true);
    setError("");
    setDiagnosis(null);
    setChatHistory([]);

    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, make, model, issue }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setDiagnosis(data.diagnosis);
      setChatHistory([
        { role: "user", content: `Vehicle: ${year} ${make} ${model}\n\nIssue: ${issue}` },
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
        chatHistory={chatHistory}
        setChatHistory={setChatHistory}
        onNewDiagnosis={handleNewDiagnosis}
      />
    );
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

  const canSubmit = !loading && !!year && !!make && !!model && !!issue.trim();

  return (
    <main
      style={{
        minHeight: "100dvh",
        backgroundColor: "var(--background)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Scrollable content area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px 0",
        }}
      >
        <div style={{ width: "100%", maxWidth: "480px" }}>
          {/* Title */}
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
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

          {/* Form */}
          <form
            id="diagnose-form"
            onSubmit={handleDiagnose}
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div>
              <label style={labelStyle}>Year</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
                style={{ ...fieldStyle, color: year ? "var(--text-primary)" : "var(--text-muted)" }}
              >
                <option value="">Select year</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Make</label>
              <input
                type="text"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="Toyota"
                required
                style={fieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Model</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Camry"
                required
                style={fieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>OBD Code or Symptom</label>
              <textarea
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                placeholder="e.g. P0301 misfire on cylinder 1, rough idle at startup — or describe what you're hearing"
                required
                rows={3}
                style={{
                  display: "block",
                  width: "100%",
                  minHeight: "100px",
                  padding: "10px 12px",
                  fontSize: "16px",
                  backgroundColor: "var(--surface-2)",
                  border: "1px solid #2a2f38",
                  borderRadius: "8px",
                  color: "var(--text-primary)",
                  resize: "none",
                  lineHeight: "1.5",
                }}
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

      {/* Fixed bottom CTA */}
      <div
        style={{
          padding: "12px 16px",
          paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
          backgroundColor: "var(--background)",
          borderTop: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <button
          type="submit"
          form="diagnose-form"
          disabled={!canSubmit}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            width: "100%",
            height: "56px",
            backgroundColor: "var(--accent)",
            color: "white",
            fontWeight: 600,
            fontSize: "15px",
            border: "none",
            borderRadius: "10px",
            cursor: canSubmit ? "pointer" : "not-allowed",
            opacity: canSubmit ? 1 : 0.4,
          }}
        >
          {loading ? (
            <>
              <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⚙</span>
              Diagnosing...
            </>
          ) : (
            "Diagnose"
          )}
        </button>
      </div>
    </main>
  );
}
