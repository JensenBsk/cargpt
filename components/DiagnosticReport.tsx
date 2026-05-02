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

const SAFETY_CONFIG = {
  STOP: { bg: "#1a0a0a", border: "#3a1515", accent: "#ef4444", badgeBg: "#ef4444", label: "⛔ STOP DRIVING", reasonColor: "#fca5a5" },
  CAUTION: { bg: "#1a1500", border: "#3a2e00", accent: "#f59e0b", badgeBg: "#f59e0b", label: "⚠️ DRIVE WITH CAUTION", reasonColor: "#fcd34d" },
  OKAY: { bg: "#0a1a0f", border: "#1a3a1f", accent: "#22c55e", badgeBg: "#22c55e", label: "✅ OKAY TO DRIVE", reasonColor: "#86efac" },
};

export default function DiagnosticReport({
  diagnosis, year, make, model, chatHistory, setChatHistory, onNewDiagnosis,
}: Props) {
  const [expandedStep, setExpandedStep] = useState<number | null>(0);
  const [expandedCauses, setExpandedCauses] = useState<Set<number>>(new Set());
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);

  function toggleCause(rank: number) {
    setExpandedCauses(prev => {
      const next = new Set(prev);
      if (next.has(rank)) next.delete(rank); else next.add(rank);
      return next;
    });
  }

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
      setChatHistory([...chatHistory, { role: "user", content: userText }, { role: "assistant", content: reply }]);
    } catch {
      setChatMessages([...newMessages, { role: "assistant", text: "Network error. Please check your connection." }]);
    } finally {
      setChatLoading(false);
    }
  }

  const verdict = diagnosis.driveSafety.verdict;
  const safetyConfig = SAFETY_CONFIG[verdict];

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "var(--background)" }}>

      {/* Header — 48px */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          height: "48px",
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "var(--surface)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "15px" }}>🔧</span>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 600, lineHeight: 1.2, color: "var(--text-primary)" }}>
              AI Mechanic
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.2 }}>
              {year} {make} {model}
            </div>
          </div>
        </div>
        <button
          onClick={onNewDiagnosis}
          style={{
            fontSize: "12px",
            fontWeight: 500,
            padding: "5px 12px",
            borderRadius: "20px",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "white",
            backgroundColor: "transparent",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          ← New
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>

        {/* Escalation banner */}
        {diagnosis.mechanicEscalation.needed && (
          <div style={{ backgroundColor: "#1a0a0a", border: "1px solid #3a1515", borderRadius: "10px", padding: "12px 14px", display: "flex", gap: "10px" }}>
            <span style={{ fontSize: "16px", flexShrink: 0 }}>🚨</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: "13px", color: "#ef4444", marginBottom: "2px" }}>Professional Help Required</div>
              <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>{diagnosis.mechanicEscalation.reason}</div>
            </div>
          </div>
        )}

        {/* Drive Safety — most important card */}
        <div
          style={{
            backgroundColor: safetyConfig.bg,
            border: `1px solid ${safetyConfig.border}`,
            borderLeft: `3px solid ${safetyConfig.accent}`,
            borderRadius: "10px",
            padding: "14px 16px",
          }}
        >
          <div style={{ marginBottom: "8px" }}>
            <span style={{ backgroundColor: safetyConfig.badgeBg, color: "white", fontWeight: 700, fontSize: "11px", letterSpacing: "0.06em", padding: "3px 10px", borderRadius: "20px", textTransform: "uppercase" as const }}>
              {safetyConfig.label}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "13px", color: safetyConfig.reasonColor, lineHeight: 1.5 }}>
            {diagnosis.driveSafety.reason}
          </p>
        </div>

        {/* What's Going On */}
        <Card>
          <SectionHeader icon="📋" label="What's Going On" />
          <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            {diagnosis.whatsWrong}
          </p>
        </Card>

        {/* Ranked Causes */}
        <Card>
          <SectionHeader icon="🔍" label="Likely Causes" />
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {diagnosis.rankedCauses.map((cause) => {
              const colors = LIKELIHOOD_COLORS[cause.likelihood] ?? { bg: "rgba(107,114,128,0.18)", text: "#9ca3af" };
              const isExpanded = expandedCauses.has(cause.rank);
              const isLong = cause.reasoning.length > 90;
              return (
                <div
                  key={cause.rank}
                  style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                      <span style={{ width: "22px", height: "22px", borderRadius: "50%", backgroundColor: "var(--accent)", color: "white", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {cause.rank}
                      </span>
                      <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)" }}>
                        {cause.cause}
                      </span>
                    </div>
                    <span style={{ backgroundColor: colors.bg, color: colors.text, fontSize: "11px", fontWeight: 500, padding: "2px 8px", borderRadius: "20px", whiteSpace: "nowrap" as const, flexShrink: 0 }}>
                      {cause.likelihood}
                    </span>
                  </div>
                  <p style={{
                    margin: 0,
                    fontSize: "13px",
                    color: "#8b95a3",
                    lineHeight: 1.5,
                    paddingLeft: "30px",
                    display: "-webkit-box",
                    WebkitLineClamp: isExpanded ? "unset" : 2,
                    WebkitBoxOrient: "vertical" as const,
                    overflow: isExpanded ? "visible" : "hidden",
                  }}>
                    {cause.reasoning}
                  </p>
                  {isLong && (
                    <button
                      onClick={() => toggleCause(cause.rank)}
                      style={{ marginLeft: "30px", marginTop: "4px", fontSize: "12px", color: "var(--accent)", backgroundColor: "transparent", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      {isExpanded ? "Show less" : "Show more"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Diagnostic Steps — timeline */}
        <Card>
          <SectionHeader icon="🔬" label="Check This First" />
          <div>
            {diagnosis.diagnosticSteps.map((step, idx) => {
              const isLast = idx === diagnosis.diagnosticSteps.length - 1;
              const isOpen = expandedStep === step.step - 1;
              return (
                <div key={step.step} style={{ display: "flex", gap: "12px" }}>
                  {/* Timeline indicator */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: "14px" }}>
                    <div style={{
                      width: "26px", height: "26px", borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "12px", fontWeight: 700, flexShrink: 0,
                      backgroundColor: isOpen ? "var(--accent)" : "var(--surface-2)",
                      border: `1px solid ${isOpen ? "var(--accent)" : "var(--border-subtle)"}`,
                      color: isOpen ? "white" : "var(--text-muted)",
                    }}>
                      {step.step}
                    </div>
                    {!isLast && (
                      <div style={{ width: "1px", flex: 1, minHeight: "12px", backgroundColor: "var(--border)", marginTop: "4px" }} />
                    )}
                  </div>

                  {/* Step content */}
                  <div style={{ flex: 1, paddingBottom: isLast ? "0" : "16px" }}>
                    {/* Collapsed row — tap anywhere, 48px min height */}
                    <button
                      onClick={() => setExpandedStep(isOpen ? null : step.step - 1)}
                      style={{
                        width: "100%",
                        minHeight: "48px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                        backgroundColor: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: "0",
                        textAlign: "left",
                        transition: "opacity 150ms ease",
                      }}
                    >
                      <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                        {step.action}
                      </span>
                      <span style={{ color: "var(--text-muted)", fontSize: "10px", flexShrink: 0 }}>
                        {isOpen ? "▲" : "▼"}
                      </span>
                    </button>

                    {/* Expanded detail */}
                    {isOpen && (
                      <div
                        style={{
                          backgroundColor: "var(--background)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                          padding: "12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                          marginTop: "4px",
                          transition: "all 150ms ease",
                        }}
                      >
                        <p style={{ margin: 0, fontSize: "13px", fontStyle: "italic", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                          {step.why}
                        </p>

                        {/* Branch cards — stacked on mobile */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div style={{ backgroundColor: "#0a1a0f", border: "1px solid #1e3a28", borderRadius: "8px", padding: "10px 12px" }}>
                            <div style={{ fontSize: "11px", fontWeight: 600, color: "#22c55e", marginBottom: "4px" }}>If it passes / looks good</div>
                            <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>{step.ifResultA}</div>
                          </div>
                          <div style={{ backgroundColor: "#1a1200", border: "1px solid #3a2a00", borderRadius: "8px", padding: "10px 12px" }}>
                            <div style={{ fontSize: "11px", fontWeight: 600, color: "#f59e0b", marginBottom: "4px" }}>If it fails / looks bad</div>
                            <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>{step.ifResultB}</div>
                          </div>
                        </div>

                        {(step.cost || (step.tools && step.tools !== "None")) && (
                          <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "var(--text-muted)" }}>
                            {step.cost && <span>⏱ {step.cost}</span>}
                            {step.tools && step.tools !== "None" && <span>🔧 {step.tools}</span>}
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

        {/* Cost Estimates — cards on mobile, table on desktop */}
        <Card>
          <SectionHeader icon="💰" label="Cost Estimates" />

          {/* Mobile: stacked cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }} className="md:hidden">
            {diagnosis.costEstimates.map((est, i) => (
              <div key={i} style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px" }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>{est.fix}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                  {[["Parts", est.parts, false], ["Labor", est.labor, false], ["Total", est.total, true]].map(([label, val, bold]) => (
                    <div key={label as string}>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>{label}</div>
                      <div style={{ fontSize: "13px", color: bold ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: bold ? 700 : 400 }}>{val}</div>
                    </div>
                  ))}
                </div>
                {est.note && <div style={{ marginTop: "8px", fontSize: "12px", color: "#6b7280", fontStyle: "italic" }}>{est.note}</div>}
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block overflow-x-auto">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Repair", "Parts", "Labor", "Total"].map((h, i) => (
                    <th key={h} style={{ textAlign: i === 0 ? "left" : "right", paddingBottom: "10px", paddingRight: i === 3 ? 0 : "16px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {diagnosis.costEstimates.map((est, i) => (
                  <>
                    <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "10px 16px 10px 0", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>{est.fix}</td>
                      <td style={{ padding: "10px 16px 10px 0", fontSize: "14px", color: "var(--text-secondary)", textAlign: "right" }}>{est.parts}</td>
                      <td style={{ padding: "10px 16px 10px 0", fontSize: "14px", color: "var(--text-secondary)", textAlign: "right" }}>{est.labor}</td>
                      <td style={{ padding: "10px 0", fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", textAlign: "right" }}>{est.total}</td>
                    </tr>
                    {est.note && (
                      <tr key={`n-${i}`}>
                        <td colSpan={4} style={{ paddingBottom: "10px", fontSize: "12px", color: "#6b7280", fontStyle: "italic" }}>{est.note}</td>
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
          <div style={{ backgroundColor: "#150a0a", border: "1px solid #2a1515", borderRadius: "10px", padding: "14px 16px" }}>
            <SectionHeader icon="⚠️" label="Don't Do This" />
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
              {diagnosis.dontDoThis.map((warning, i) => (
                <li key={i} style={{ display: "flex", gap: "8px", lineHeight: 1.4 }}>
                  <span style={{ color: "#f59e0b", fontWeight: 700, flexShrink: 0, fontSize: "14px" }}>›</span>
                  <span style={{ fontSize: "13px", color: "var(--text-primary)", lineHeight: 1.4 }}>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Follow-up Chat */}
        <Card>
          <SectionHeader icon="💬" label="Ask a Follow-Up" />

          {chatMessages.length > 0 && (
            <div style={{ marginBottom: "12px", display: "flex", flexDirection: "column", gap: "8px", maxHeight: "240px", overflowY: "auto" }}>
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "85%",
                    padding: "8px 12px",
                    borderRadius: "12px",
                    fontSize: "14px",
                    lineHeight: 1.5,
                    backgroundColor: msg.role === "user" ? "var(--accent)" : "var(--surface-2)",
                    color: msg.role === "user" ? "white" : "var(--text-secondary)",
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div style={{ padding: "8px 12px", borderRadius: "12px", fontSize: "14px", backgroundColor: "var(--surface-2)", color: "var(--text-secondary)" }}>
                    <span style={{ opacity: 0.7 }}>Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleChatSubmit} style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask anything about this diagnosis..."
              style={{
                flex: 1,
                height: "44px",
                padding: "0 12px",
                fontSize: "16px",
                backgroundColor: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                color: "var(--text-primary)",
              }}
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || chatLoading}
              style={{
                height: "44px",
                padding: "0 18px",
                backgroundColor: "var(--accent)",
                color: "white",
                fontWeight: 600,
                fontSize: "14px",
                border: "none",
                borderRadius: "8px",
                cursor: chatInput.trim() && !chatLoading ? "pointer" : "not-allowed",
                opacity: chatInput.trim() && !chatLoading ? 1 : 0.4,
                flexShrink: 0,
              }}
            >
              {chatLoading ? "..." : "Ask"}
            </button>
          </form>
        </Card>

        <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)", opacity: 0.4, paddingBottom: "24px", margin: 0 }}>
          AI diagnosis is for guidance only. Always verify with a qualified mechanic for safety-critical repairs.
        </p>
      </div>
    </div>
  );
}

function SectionHeader({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
      <div style={{ width: "2px", height: "13px", borderRadius: "2px", backgroundColor: "var(--accent)", flexShrink: 0 }} />
      <span style={{ fontSize: "12px" }}>{icon}</span>
      <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }} />
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "14px 16px" }}>
      {children}
    </div>
  );
}
