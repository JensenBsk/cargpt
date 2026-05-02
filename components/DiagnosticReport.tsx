"use client";

import { useState } from "react";
import type { Diagnostic, ChatMessage } from "@/types/diagnostic";

interface Props {
  diagnosis: Diagnostic;
  year: string;
  make: string;
  model: string;
  chatHistory: ChatMessage[];
  setChatHistory: (h: ChatMessage[]) => void;
  onNewDiagnosis: () => void;
}

const LIKELIHOOD_COLORS: Record<string, { bg: string; text: string }> = {
  "Most Likely": { bg: "rgba(59,130,246,0.14)", text: "#3b82f6" },
  "Likely": { bg: "rgba(99,102,241,0.14)", text: "#818cf8" },
  "Possible": { bg: "rgba(107,114,128,0.18)", text: "#9ca3af" },
  "Unlikely but serious": { bg: "rgba(245,158,11,0.14)", text: "#f59e0b" },
};

export default function DiagnosticReport({
  diagnosis, year, make, model, chatHistory, setChatHistory, onNewDiagnosis,
}: Props) {
  const [expandedStep, setExpandedStep] = useState<number | null>(0);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);

  const verdict = diagnosis.driveSafety.verdict;

  async function handleChatSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userText = chatInput.trim();
    setChatInput("");
    setChatLoading(true);

    const newMessages = [...chatMessages, { role: "user" as const, text: userText }];
    setChatMessages(newMessages);

    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, make, model, issue: userText, conversationHistory: chatHistory }),
      });

      const data = await res.json();
      const reply = data.reply || "Sorry, I couldn't process that. Try again.";

      setChatMessages([...newMessages, { role: "assistant", text: reply }]);
      setChatHistory([
        ...chatHistory,
        { role: "user", content: userText },
        { role: "assistant", content: reply },
      ]);
    } catch {
      setChatMessages([...newMessages, { role: "assistant", text: "Network error. Please check your connection." }]);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      {/* Nav */}
      <div
        className="sticky top-0 z-10 border-b px-6 py-4 flex items-center justify-between"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <span className="text-base">🔧</span>
            <div>
              <div className="font-semibold leading-tight" style={{ color: "var(--text-primary)", fontSize: "14px" }}>
                AI Mechanic
              </div>
              <div className="leading-tight" style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                Diagnostic Intelligence
              </div>
            </div>
          </div>
          <div
            className="hidden sm:flex items-center px-3 py-1 rounded-full border"
            style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-secondary)", fontSize: "12px" }}
          >
            {year} {make} {model}
          </div>
        </div>
        <button
          onClick={onNewDiagnosis}
          className="rounded-lg border font-medium transition-opacity hover:opacity-75"
          style={{ borderColor: "rgba(255,255,255,0.2)", color: "white", backgroundColor: "transparent", fontSize: "13px", padding: "6px 16px" }}
        >
          ← New Diagnosis
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        {/* Escalation banner */}
        {diagnosis.mechanicEscalation.needed && (
          <div className="p-4 border flex gap-3" style={{ backgroundColor: "#1a0a0a", borderColor: "#3a1515", borderRadius: "10px" }}>
            <span className="text-lg flex-shrink-0">🚨</span>
            <div>
              <p className="font-semibold mb-0.5" style={{ color: "#ef4444", fontSize: "14px" }}>Professional Help Required</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{diagnosis.mechanicEscalation.reason}</p>
            </div>
          </div>
        )}

        {/* Drive Safety */}
        <SafetyCard verdict={verdict} reason={diagnosis.driveSafety.reason} />

        {/* What's Going On */}
        <Card>
          <SectionHeader icon="📋" label="What's Going On" />
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {diagnosis.whatsWrong}
          </p>
        </Card>

        {/* Ranked Causes */}
        <Card>
          <SectionHeader icon="🔍" label="Likely Causes" />
          <div className="space-y-3">
            {diagnosis.rankedCauses.map((cause) => {
              const colors = LIKELIHOOD_COLORS[cause.likelihood] ?? { bg: "rgba(107,114,128,0.18)", text: "#9ca3af" };
              return (
                <div
                  key={cause.rank}
                  className="p-4 border"
                  style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)", borderRadius: "8px" }}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="flex items-center justify-center flex-shrink-0 text-white font-bold"
                        style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "var(--accent)", fontSize: "11px" }}
                      >
                        {cause.rank}
                      </span>
                      <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                        {cause.cause}
                      </span>
                    </div>
                    <span
                      className="rounded-full font-medium flex-shrink-0 whitespace-nowrap"
                      style={{ backgroundColor: colors.bg, color: colors.text, fontSize: "11px", padding: "2px 10px" }}
                    >
                      {cause.likelihood}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "#9ca3af", paddingLeft: "2.125rem" }}>
                    {cause.reasoning}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Diagnostic Steps */}
        <Card>
          <SectionHeader icon="🔬" label="Check This First" />
          <div>
            {diagnosis.diagnosticSteps.map((step, idx) => {
              const isLast = idx === diagnosis.diagnosticSteps.length - 1;
              const isOpen = expandedStep === step.step - 1;
              return (
                <div key={step.step} className="flex gap-4">
                  {/* Timeline */}
                  <div className="flex flex-col items-center flex-shrink-0" style={{ paddingTop: "12px" }}>
                    <div
                      className="flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        backgroundColor: isOpen ? "var(--accent)" : "var(--surface-2)",
                        border: `1px solid ${isOpen ? "var(--accent)" : "var(--border-subtle)"}`,
                        color: isOpen ? "white" : "var(--text-muted)",
                      }}
                    >
                      {step.step}
                    </div>
                    {!isLast && (
                      <div style={{ width: "1px", flex: 1, minHeight: "12px", backgroundColor: "var(--border)", marginTop: "6px" }} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-6">
                    <button
                      onClick={() => setExpandedStep(isOpen ? null : step.step - 1)}
                      className="w-full text-left py-3 flex items-center justify-between gap-3"
                    >
                      <span className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                        {step.action}
                      </span>
                      <span className="flex-shrink-0" style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                        {isOpen ? "▲" : "▼"}
                      </span>
                    </button>

                    {isOpen && (
                      <div
                        className="p-4 space-y-3 border"
                        style={{ backgroundColor: "var(--background)", borderColor: "var(--border)", borderRadius: "8px" }}
                      >
                        <p className="text-xs italic" style={{ color: "var(--text-secondary)" }}>{step.why}</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="p-3 border" style={{ backgroundColor: "#0a1a0f", borderColor: "#1e3a28", borderRadius: "8px" }}>
                            <p className="font-semibold mb-1" style={{ color: "#22c55e", fontSize: "11px" }}>
                              If it passes / looks good
                            </p>
                            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                              {step.ifResultA}
                            </p>
                          </div>
                          <div className="p-3 border" style={{ backgroundColor: "#1a1200", borderColor: "#3a2a00", borderRadius: "8px" }}>
                            <p className="font-semibold mb-1" style={{ color: "#f59e0b", fontSize: "11px" }}>
                              If it fails / looks bad
                            </p>
                            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                              {step.ifResultB}
                            </p>
                          </div>
                        </div>

                        {(step.cost || (step.tools && step.tools !== "None")) && (
                          <div className="flex gap-4 pt-1" style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                            {step.cost && (
                              <span className="flex items-center gap-1.5">
                                <span>⏱</span>{step.cost}
                              </span>
                            )}
                            {step.tools && step.tools !== "None" && (
                              <span className="flex items-center gap-1.5">
                                <span>🔧</span>{step.tools}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Cost Estimates */}
        <Card>
          <SectionHeader icon="💰" label="Cost Estimates" />
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                  {["Repair", "Parts", "Labor", "Total"].map((h, i) => (
                    <th
                      key={h}
                      className={i === 0 ? "text-left pb-3 pr-4" : i === 3 ? "text-right pb-3" : "text-right pb-3 pr-4"}
                      style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {diagnosis.costEstimates.map((est, i) => (
                  <>
                    <tr key={i} className="border-b" style={{ borderColor: "var(--border)" }}>
                      <td className="py-3 pr-4 text-sm font-medium" style={{ color: "var(--text-primary)" }}>{est.fix}</td>
                      <td className="py-3 pr-4 text-sm text-right" style={{ color: "var(--text-secondary)" }}>{est.parts}</td>
                      <td className="py-3 pr-4 text-sm text-right" style={{ color: "var(--text-secondary)" }}>{est.labor}</td>
                      <td className="py-3 text-sm text-right font-bold" style={{ color: "var(--text-primary)" }}>{est.total}</td>
                    </tr>
                    {est.note && (
                      <tr key={`note-${i}`}>
                        <td colSpan={4} className="pb-3 italic" style={{ color: "#6b7280", fontSize: "12px" }}>{est.note}</td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Don't Do This */}
        {diagnosis.dontDoThis.length > 0 && (
          <div className="p-5 border" style={{ backgroundColor: "#150a0a", borderColor: "#2a1515", borderRadius: "10px" }}>
            <SectionHeader icon="⚠️" label="Don't Do This" />
            <ul className="space-y-3">
              {diagnosis.dontDoThis.map((warning, i) => (
                <li key={i} className="flex gap-2.5" style={{ lineHeight: "1.5" }}>
                  <span className="flex-shrink-0 font-bold mt-0.5" style={{ color: "#f59e0b", fontSize: "14px" }}>›</span>
                  <span style={{ color: "var(--text-primary)", fontSize: "14px" }}>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Follow-up Chat */}
        <Card>
          <SectionHeader icon="💬" label="Ask a Follow-Up" />
          {chatMessages.length > 0 && (
            <div className="mb-4 space-y-3 max-h-80 overflow-y-auto">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className="rounded-xl px-4 py-2.5 text-sm max-w-[85%]"
                    style={{
                      backgroundColor: msg.role === "user" ? "var(--accent)" : "var(--surface-2)",
                      color: msg.role === "user" ? "white" : "var(--text-secondary)",
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="rounded-xl px-4 py-2.5 text-sm" style={{ backgroundColor: "var(--surface-2)", color: "var(--text-secondary)" }}>
                    <span className="animate-pulse">Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleChatSubmit} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask anything about this diagnosis..."
              className="flex-1 rounded-lg px-3.5 py-2.5 text-sm border"
              style={{
                backgroundColor: "var(--surface-2)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || chatLoading}
              className="rounded-lg font-semibold text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--accent)", padding: "10px 20px" }}
            >
              {chatLoading ? "..." : "Ask"}
            </button>
          </form>
        </Card>

        <p className="text-center pb-8" style={{ fontSize: "12px", color: "var(--text-muted)", opacity: 0.4 }}>
          AI diagnosis is for guidance only. Always verify with a qualified mechanic for safety-critical repairs.
        </p>
      </div>
    </div>
  );
}

function SectionHeader({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <div className="flex-shrink-0 rounded-full" style={{ width: "2px", height: "14px", backgroundColor: "var(--accent)" }} />
      <span style={{ fontSize: "13px" }}>{icon}</span>
      <span className="font-semibold uppercase" style={{ color: "var(--text-muted)", fontSize: "11px", letterSpacing: "0.1em" }}>
        {label}
      </span>
      <div className="flex-1" style={{ height: "1px", backgroundColor: "var(--border)" }} />
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="p-5 border"
      style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", borderRadius: "10px" }}
    >
      {children}
    </div>
  );
}

function SafetyCard({ verdict, reason }: { verdict: "STOP" | "CAUTION" | "OKAY"; reason: string }) {
  const config = {
    STOP: {
      bg: "#1a0a0a",
      border: "#3a1515",
      accentBorder: "#ef4444",
      badgeBg: "#ef4444",
      label: "⛔ STOP DRIVING",
      reasonColor: "#fca5a5",
    },
    CAUTION: {
      bg: "#1a1500",
      border: "#3a2e00",
      accentBorder: "#f59e0b",
      badgeBg: "#f59e0b",
      label: "⚠️ DRIVE WITH CAUTION",
      reasonColor: "#fcd34d",
    },
    OKAY: {
      bg: "#0a1a0f",
      border: "#1a3a1f",
      accentBorder: "#22c55e",
      badgeBg: "#22c55e",
      label: "✅ OKAY TO DRIVE",
      reasonColor: "#86efac",
    },
  }[verdict];

  return (
    <div
      className="p-5"
      style={{
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        borderLeft: `3px solid ${config.accentBorder}`,
        borderRadius: "10px",
      }}
    >
      <div className="flex items-center gap-3 mb-2.5">
        <span
          className="text-white font-bold uppercase rounded-full"
          style={{ backgroundColor: config.badgeBg, fontSize: "11px", letterSpacing: "0.06em", padding: "3px 12px" }}
        >
          {config.label}
        </span>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: config.reasonColor }}>{reason}</p>
    </div>
  );
}
