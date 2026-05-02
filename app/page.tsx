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

  const fieldStyle = {
    height: "44px",
    backgroundColor: "var(--surface-2)",
    borderColor: "#2a2f38",
    color: "var(--text-primary)",
  };

  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      {!diagnosis ? (
        <div className="flex flex-col items-center justify-center min-h-screen px-4 py-16">
          <div className="w-full" style={{ maxWidth: "560px" }}>
            <div className="mb-10 text-center">
              <div className="flex items-center justify-center gap-2.5 mb-3">
                <span className="text-2xl">🔧</span>
                <h1 className="text-4xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                  AI Mechanic
                </h1>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>
                Tell us what&apos;s wrong. Get a real answer.
              </p>
            </div>

            <form
              onSubmit={handleDiagnose}
              className="p-7 space-y-5 border"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", borderRadius: "10px" }}
            >
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block mb-2 font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                    Year
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    required
                    className="w-full rounded-lg px-3 text-sm border cursor-pointer"
                    style={{ ...fieldStyle, color: year ? "var(--text-primary)" : "var(--text-muted)" }}
                  >
                    <option value="">Year</option>
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                    Make
                  </label>
                  <input
                    type="text"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    placeholder="Toyota"
                    required
                    className="w-full rounded-lg px-3 text-sm border"
                    style={fieldStyle}
                  />
                </div>

                <div>
                  <label className="block mb-2 font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                    Model
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Camry"
                    required
                    className="w-full rounded-lg px-3 text-sm border"
                    style={fieldStyle}
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                  OBD Code or Symptom Description
                </label>
                <textarea
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  placeholder="e.g. P0301 misfire on cylinder 1, rough idle at startup, clears after 10 minutes — or just describe what you're hearing or feeling"
                  required
                  rows={4}
                  className="w-full rounded-lg px-3 py-3 text-sm border resize-none"
                  style={{
                    minHeight: "100px",
                    backgroundColor: "var(--surface-2)",
                    borderColor: "#2a2f38",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              {error && (
                <p className="text-sm rounded-lg px-3 py-2.5 border" style={{ color: "#ef4444", backgroundColor: "#1a0a0a", borderColor: "#3a1515" }}>
                  {error}
                </p>
              )}

              <div className="space-y-3 pt-1">
                <button
                  type="submit"
                  disabled={loading || !year || !make || !model || !issue.trim()}
                  className="w-full rounded-lg font-semibold text-white text-sm tracking-wide transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                  style={{ height: "48px", backgroundColor: "var(--accent)" }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin inline-block">⚙</span>
                      Diagnosing...
                    </span>
                  ) : (
                    "Diagnose"
                  )}
                </button>

                <p className="flex items-center justify-center gap-1.5" style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  <span>🔒</span>
                  Your data is never stored
                </p>
              </div>
            </form>

            <p className="text-center mt-5" style={{ fontSize: "12px", color: "var(--text-muted)", opacity: 0.45 }}>
              AI diagnosis is for guidance only. Always verify with a qualified mechanic for safety-critical repairs.
            </p>
          </div>
        </div>
      ) : (
        <DiagnosticReport
          diagnosis={diagnosis}
          year={year}
          make={make}
          model={model}
          chatHistory={chatHistory}
          setChatHistory={setChatHistory}
          onNewDiagnosis={handleNewDiagnosis}
        />
      )}
    </main>
  );
}
