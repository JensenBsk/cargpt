"use client";

import { useState, useRef } from "react";
import { FileText, Search, Wrench, DollarSign, AlertTriangle, Send, MessageCircle } from "lucide-react";
import type { Diagnostic, ChatMessage } from "@/types/diagnostic";
import FeedbackCard from "@/components/FeedbackCard";
import TorqueLogo from "@/components/TorqueLogo";

interface Props {
  diagnosis: Diagnostic;
  year: string;
  make: string;
  model: string;
  issue: string;
  mods?: string;
  hasTune?: boolean;
  chatHistory: ChatMessage[];
  setChatHistory: (h: ChatMessage[]) => void;
  onNewDiagnosis: () => void;
  diagnosisId: string | null;
  onToast: (msg: string) => void;
}

const LIKELIHOOD_COLORS: Record<string, { bg: string; text: string }> = {
  "Most Likely": { bg: "rgba(59,130,246,0.14)", text: "#3b82f6" },
  "Likely": { bg: "rgba(99,102,241,0.14)", text: "#818cf8" },
  "Possible": { bg: "rgba(107,114,128,0.18)", text: "#9ca3af" },
  "Unlikely but serious": { bg: "rgba(245,158,11,0.14)", text: "#f59e0b" },
};

const ACCENT_BORDERS: Record<string, string> = {
  "Most Likely": "#3b82f6",
  "Likely": "#6366f1",
  "Possible": "#374151",
  "Unlikely but serious": "#f59e0b",
};

const SAFETY_CONFIG = {
  STOP: { bg: "#1a0a0a", border: "#3a1515", accent: "#ef4444", badgeBg: "#ef4444", label: "⛔ STOP DRIVING", reasonColor: "#fca5a5" },
  CAUTION: { bg: "#1a1500", border: "#3a2e00", accent: "#f59e0b", badgeBg: "#f59e0b", label: "⚠️ DRIVE WITH CAUTION", reasonColor: "#fcd34d" },
  OKAY: { bg: "#0a1a0f", border: "#1a3a1f", accent: "#22c55e", badgeBg: "#22c55e", label: "✅ OKAY TO DRIVE", reasonColor: "#86efac" },
};

function getMechanicMessage(diagnosis: Diagnostic, year: string, make: string, model: string, issue: string, mods?: string): string {
  const top = diagnosis.rankedCauses[0];
  const step = diagnosis.diagnosticSteps[0];
  const est = diagnosis.costEstimates[0];
  return `Hi — before I bring my ${year} ${make} ${model} in, I did some research on this issue.

Problem: ${issue}${mods ? `\nMods: ${mods}` : ""}

Based on my research, the most likely cause is ${top?.cause ?? "a known fault"}. Before replacing anything, can you start with ${step?.action ?? "a diagnostic check"}?

Fair market rate for ${est?.fix ?? "the likely repair"} is ${est?.total ?? "competitive"} parts and labor. Can you confirm your diagnostic approach and pricing?

Thanks`;
}

export default function DiagnosticReport({
  diagnosis, year, make, model, issue, mods, chatHistory, setChatHistory, onNewDiagnosis, diagnosisId, onToast,
}: Props) {
  const [expandedStep, setExpandedStep] = useState<number | null>(0);
  const [expandedCauses, setExpandedCauses] = useState<Set<number>>(new Set());
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [showMechanicModal, setShowMechanicModal] = useState(false);
  const [mechanicCopied, setMechanicCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  function toggleCause(rank: number) {
    setExpandedCauses(prev => {
      const next = new Set(prev);
      if (next.has(rank)) next.delete(rank); else next.add(rank);
      return next;
    });
  }

  async function captureAndShare() {
    if (!shareCardRef.current || isSharing) return;
    setIsSharing(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(shareCardRef.current, { pixelRatio: 3 });

      if (navigator.share) {
        try {
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          const file = new File([blob], "torque-diagnosis.png", { type: "image/png" });
          if ("canShare" in navigator && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file] });
            setShowShareModal(false);
            return;
          }
        } catch {
          // fall through to download
        }
      }

      const link = document.createElement("a");
      link.download = "torque-diagnosis.png";
      link.href = dataUrl;
      link.click();
      setShowShareModal(false);
    } catch (err) {
      console.error("Share failed:", err);
    } finally {
      setIsSharing(false);
    }
  }

  async function copyMechanicMessage() {
    await navigator.clipboard.writeText(getMechanicMessage(diagnosis, year, make, model, issue, mods));
    setMechanicCopied(true);
    onToast("Copied to clipboard");
    setTimeout(() => setMechanicCopied(false), 2000);
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
  const topCause = diagnosis.rankedCauses[0];
  const topEst = diagnosis.costEstimates[0];
  const mechanicMsg = getMechanicMessage(diagnosis, year, make, model, issue, mods);
  const emailUri = `mailto:?subject=${encodeURIComponent(`My ${year} ${make} ${model} — notes before appointment`)}&body=${encodeURIComponent(mechanicMsg)}`;

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "#0d0f12" }}>

      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, height: "52px", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#13161b", borderBottom: "1px solid #1e2329" }}>
        <TorqueLogo markSize={28} showWordmark wordmarkSize={14} glow="soft" />
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "#6b7280" }}>{year} {make} {model}</span>
          <button
            onClick={() => setShowShareModal(true)}
            style={{ fontSize: "12px", fontWeight: 500, padding: "5px 10px", borderRadius: "20px", border: "1px solid rgba(59,130,246,0.4)", color: "#3b82f6", backgroundColor: "rgba(59,130,246,0.1)", cursor: "pointer" }}
          >
            ↑ Share
          </button>
          <button
            onClick={onNewDiagnosis}
            className="tap-target"
            style={{ fontSize: "12px", fontWeight: 500, padding: "5px 12px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.2)", color: "white", backgroundColor: "transparent", cursor: "pointer" }}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>

        {diagnosis.mechanicEscalation.needed && (
          <div style={{ backgroundColor: "#1a0a0a", border: "1px solid #3a1515", borderRadius: "10px", padding: "12px 14px", display: "flex", gap: "10px" }}>
            <span style={{ fontSize: "16px", flexShrink: 0 }}>🚨</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: "13px", color: "#ef4444", marginBottom: "2px" }}>Professional Help Required</div>
              <div style={{ fontSize: "13px", color: "#9ca3af", lineHeight: 1.5 }}>{diagnosis.mechanicEscalation.reason}</div>
            </div>
          </div>
        )}

        {/* Safety */}
        <div style={{ backgroundColor: safetyConfig.bg, border: `1px solid ${safetyConfig.border}`, borderLeft: `3px solid ${safetyConfig.accent}`, borderRadius: "10px", padding: "14px 16px" }}>
          <div style={{ marginBottom: "8px" }}>
            <span
              className={verdict === "STOP" ? "badge-pulse-stop" : verdict === "CAUTION" ? "badge-pulse-caution" : ""}
              style={{ display: "inline-block", backgroundColor: safetyConfig.badgeBg, color: "white", fontWeight: 700, fontSize: "11px", letterSpacing: "0.06em", padding: "3px 10px", borderRadius: "20px", textTransform: "uppercase" as const }}
            >
              {safetyConfig.label}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "13px", color: safetyConfig.reasonColor, lineHeight: 1.5 }}>{diagnosis.driveSafety.reason}</p>
        </div>

        {/* Mod note */}
        {diagnosis.modNote && (
          <div style={{ backgroundColor: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", borderLeft: "3px solid #fbbf24", borderRadius: "10px", padding: "12px 14px", display: "flex", gap: "10px" }}>
            <span style={{ fontSize: "15px", flexShrink: 0 }}>⚡</span>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#fbbf24", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "3px" }}>Mod Note</div>
              <div style={{ fontSize: "13px", color: "#fde68a", lineHeight: 1.5 }}>{diagnosis.modNote}</div>
            </div>
          </div>
        )}

        {/* What's Going On */}
        <Card>
          <SectionHeader Icon={FileText} label="What's Going On" />
          <p style={{ margin: 0, fontSize: "14px", color: "#9ca3af", lineHeight: 1.6 }}>{diagnosis.whatsWrong}</p>
        </Card>

        {/* Causes */}
        <Card>
          <SectionHeader Icon={Search} label="Likely Causes" />
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {diagnosis.rankedCauses.map((cause) => {
              const colors = LIKELIHOOD_COLORS[cause.likelihood] ?? { bg: "rgba(107,114,128,0.18)", text: "#9ca3af" };
              const accentColor = ACCENT_BORDERS[cause.likelihood] ?? "#374151";
              const isExpanded = expandedCauses.has(cause.rank);
              const isLong = cause.reasoning.length > 90;
              return (
                <div key={cause.rank} style={{ backgroundColor: "#1a1e25", border: "1px solid #1e2329", borderLeft: `3px solid ${accentColor}`, borderRadius: "8px", padding: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                      <span style={{ width: "22px", height: "22px", borderRadius: "50%", backgroundColor: "#3b82f6", color: "white", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{cause.rank}</span>
                      <span style={{ fontSize: "15px", fontWeight: 600, color: "#f1f5f9" }}>{cause.cause}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
                      {cause.modRelated && (
                        <span style={{ backgroundColor: "rgba(251,191,36,0.15)", color: "#fbbf24", fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "4px", letterSpacing: "0.04em" }}>
                          MOD
                        </span>
                      )}
                      <span style={{ backgroundColor: colors.bg, color: colors.text, fontSize: "11px", fontWeight: 500, padding: "2px 8px", borderRadius: "20px", whiteSpace: "nowrap" as const }}>{cause.likelihood}</span>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", color: "#8b95a3", lineHeight: 1.5, paddingLeft: "30px", display: "-webkit-box", WebkitLineClamp: isExpanded ? "unset" : 2, WebkitBoxOrient: "vertical" as const, overflow: isExpanded ? "visible" : "hidden" }}>
                    {cause.reasoning}
                  </p>
                  {isLong && (
                    <button onClick={() => toggleCause(cause.rank)} style={{ marginLeft: "30px", marginTop: "4px", fontSize: "12px", color: "#3b82f6", backgroundColor: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
                      {isExpanded ? "Show less" : "Show more"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Diagnostic Steps */}
        <Card>
          <SectionHeader Icon={Wrench} label="Check This First" />
          <div>
            {diagnosis.diagnosticSteps.map((step, idx) => {
              const isLast = idx === diagnosis.diagnosticSteps.length - 1;
              const isOpen = expandedStep === step.step - 1;
              return (
                <div key={step.step} style={{ display: "flex", gap: "12px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: "14px" }}>
                    <div style={{ width: "26px", height: "26px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0, backgroundColor: isOpen ? "#3b82f6" : "#1a1e25", border: `1px solid ${isOpen ? "#3b82f6" : "#252b34"}`, color: isOpen ? "white" : "#6b7280" }}>
                      {step.step}
                    </div>
                    {!isLast && <div style={{ width: "1px", flex: 1, minHeight: "12px", backgroundColor: "#1e2329", marginTop: "4px" }} />}
                  </div>
                  <div style={{ flex: 1, paddingBottom: isLast ? "0" : "16px" }}>
                    <button
                      onClick={() => setExpandedStep(isOpen ? null : step.step - 1)}
                      style={{ width: "100%", minHeight: "48px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", backgroundColor: "transparent", border: "none", cursor: "pointer", padding: "0", textAlign: "left", transition: "opacity 150ms ease" }}
                    >
                      <span style={{ fontSize: "15px", fontWeight: 600, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{step.action}</span>
                      <span style={{ color: "#6b7280", fontSize: "10px", flexShrink: 0 }}>{isOpen ? "▲" : "▼"}</span>
                    </button>
                    {isOpen && (
                      <div style={{ backgroundColor: "#0d0f12", border: "1px solid #1e2329", borderRadius: "8px", padding: "12px", display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px", transition: "all 150ms ease" }}>
                        <p style={{ margin: 0, fontSize: "13px", fontStyle: "italic", color: "#9ca3af", lineHeight: 1.5 }}>{step.why}</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div style={{ backgroundColor: "#0a1a0f", border: "1px solid #1e3a28", borderRadius: "8px", padding: "10px 12px" }}>
                            <div style={{ fontSize: "11px", fontWeight: 600, color: "#22c55e", marginBottom: "4px" }}>If it passes / looks good</div>
                            <div style={{ fontSize: "13px", color: "#9ca3af", lineHeight: 1.5 }}>{step.ifResultA}</div>
                          </div>
                          <div style={{ backgroundColor: "#1a1200", border: "1px solid #3a2a00", borderRadius: "8px", padding: "10px 12px" }}>
                            <div style={{ fontSize: "11px", fontWeight: 600, color: "#f59e0b", marginBottom: "4px" }}>If it fails / looks bad</div>
                            <div style={{ fontSize: "13px", color: "#9ca3af", lineHeight: 1.5 }}>{step.ifResultB}</div>
                          </div>
                        </div>
                        {(step.cost || (step.tools && step.tools !== "None")) && (
                          <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#6b7280" }}>
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

        {/* Cost */}
        <Card>
          <SectionHeader Icon={DollarSign} label="Cost Estimates" />
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }} className="md:hidden">
            {diagnosis.costEstimates.map((est, i) => (
              <div key={i} style={{ backgroundColor: "#1a1e25", border: "1px solid #1e2329", borderRadius: "8px", padding: "12px" }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#f1f5f9", marginBottom: "8px" }}>{est.fix}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                  {(["Parts", "Labor", "Total"] as const).map((label, li) => {
                    const val = li === 0 ? est.parts : li === 1 ? est.labor : est.total;
                    return (
                      <div key={label}>
                        <div style={{ fontSize: "10px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>{label}</div>
                        <div style={{ fontSize: li === 2 ? "16px" : "13px", color: li === 2 ? "#f1f5f9" : "#9ca3af", fontWeight: li === 2 ? 700 : 400 }}>{val}</div>
                      </div>
                    );
                  })}
                </div>
                {est.note && <div style={{ marginTop: "8px", fontSize: "12px", color: "#6b7280", fontStyle: "italic" }}>{est.note}</div>}
              </div>
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1e2329" }}>
                  {["Repair", "Parts", "Labor", "Total"].map((h, i) => (
                    <th key={h} style={{ textAlign: i === 0 ? "left" : "right", paddingBottom: "10px", paddingRight: i === 3 ? 0 : "16px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {diagnosis.costEstimates.map((est, i) => (
                  <>
                    <tr key={i} style={{ borderBottom: "1px solid #1e2329" }}>
                      <td style={{ padding: "10px 16px 10px 0", fontSize: "14px", fontWeight: 500, color: "#f1f5f9" }}>{est.fix}</td>
                      <td style={{ padding: "10px 16px 10px 0", fontSize: "14px", color: "#9ca3af", textAlign: "right" }}>{est.parts}</td>
                      <td style={{ padding: "10px 16px 10px 0", fontSize: "14px", color: "#9ca3af", textAlign: "right" }}>{est.labor}</td>
                      <td style={{ padding: "10px 0", fontSize: "14px", fontWeight: 700, color: "#f1f5f9", textAlign: "right" }}>{est.total}</td>
                    </tr>
                    {est.note && <tr key={`n-${i}`}><td colSpan={4} style={{ paddingBottom: "10px", fontSize: "12px", color: "#6b7280", fontStyle: "italic" }}>{est.note}</td></tr>}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Don't Do This */}
        {diagnosis.dontDoThis.length > 0 && (
          <div style={{ backgroundColor: "#150a0a", border: "1px solid #2a1515", borderRadius: "10px", padding: "14px 16px" }}>
            <SectionHeader Icon={AlertTriangle} label="Don't Do This" />
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
              {diagnosis.dontDoThis.map((warning, i) => (
                <li key={i} style={{ display: "flex", gap: "8px", lineHeight: 1.4 }}>
                  <span style={{ color: "#f59e0b", fontWeight: 700, flexShrink: 0, fontSize: "14px" }}>›</span>
                  <span style={{ fontSize: "13px", color: "#f1f5f9", lineHeight: 1.4 }}>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Feedback */}
        <FeedbackCard diagnosisId={diagnosisId} />

        {/* Send to My Mechanic */}
        <Card>
          <SectionHeader Icon={Send} label="Send to My Mechanic" />
          <p style={{ margin: "0 0 12px", fontSize: "13px", color: "#9ca3af", lineHeight: 1.5 }}>
            Walk into the shop prepared. Send this before your appointment so they know you&apos;ve done your homework.
          </p>
          <button
            onClick={() => setShowMechanicModal(true)}
            className="tap-target"
            style={{ width: "100%", height: "44px", backgroundColor: "#1a1e25", border: "1px solid #252b34", borderRadius: "8px", color: "#f1f5f9", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}
          >
            Generate Message
          </button>
        </Card>

        {/* Chat */}
        <Card>
          <SectionHeader Icon={MessageCircle} label="Ask a Follow-Up" />
          {chatMessages.length > 0 && (
            <div style={{ marginBottom: "12px", display: "flex", flexDirection: "column", gap: "8px", maxHeight: "240px", overflowY: "auto" }}>
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth: "85%", padding: "8px 12px", borderRadius: "12px", fontSize: "14px", lineHeight: 1.5, backgroundColor: msg.role === "user" ? "#3b82f6" : "#1a1e25", color: msg.role === "user" ? "white" : "#9ca3af" }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div style={{ padding: "8px 12px", borderRadius: "12px", fontSize: "14px", backgroundColor: "#1a1e25", color: "#9ca3af" }}>
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
              style={{ flex: 1, height: "44px", padding: "0 12px", fontSize: "16px", backgroundColor: "#1a1e25", border: "1px solid #1e2329", borderRadius: "8px", color: "#f1f5f9" }}
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || chatLoading}
              style={{ height: "44px", padding: "0 18px", backgroundColor: "#3b82f6", color: "white", fontWeight: 600, fontSize: "14px", border: "none", borderRadius: "8px", cursor: chatInput.trim() && !chatLoading ? "pointer" : "not-allowed", opacity: chatInput.trim() && !chatLoading ? 1 : 0.4, flexShrink: 0 }}
            >
              {chatLoading ? "..." : "Ask"}
            </button>
          </form>
        </Card>

        <p style={{ textAlign: "center", fontSize: "12px", color: "#6b7280", opacity: 0.4, paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))", margin: 0 }}>
          AI diagnosis is for guidance only. Always verify with a qualified mechanic for safety-critical repairs.
        </p>
      </div>

      {/* Send to Mechanic Modal */}
      {showMechanicModal && (
        <div
          onClick={() => setShowMechanicModal(false)}
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: "560px", backgroundColor: "#13161b", border: "1px solid #1e2329", borderRadius: "16px 16px 0 0", padding: "20px 16px", paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }}
          >
            <div style={{ width: "32px", height: "4px", backgroundColor: "#252b34", borderRadius: "2px", margin: "0 auto 20px" }} />
            <div style={{ fontSize: "16px", fontWeight: 600, color: "#f1f5f9", marginBottom: "4px" }}>Send to Your Mechanic</div>
            <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "16px" }}>Copy this and send before your appointment.</div>
            <div style={{ backgroundColor: "#1a1e25", border: "1px solid #252b34", borderRadius: "10px", padding: "14px", marginBottom: "14px", maxHeight: "260px", overflowY: "auto" }}>
              <p style={{ margin: 0, fontSize: "14px", color: "#f1f5f9", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                {mechanicMsg}
              </p>
            </div>
            <button
              onClick={copyMechanicMessage}
              className="tap-target"
              style={{ width: "100%", height: "48px", backgroundColor: mechanicCopied ? "#22c55e" : "#3b82f6", color: "white", fontWeight: 600, fontSize: "15px", border: "none", borderRadius: "8px", cursor: "pointer", transition: "background-color 200ms", marginBottom: "8px" }}
            >
              {mechanicCopied ? "✓ Copied!" : "Copy Message"}
            </button>
            <div style={{ display: "flex", gap: "8px" }}>
              <a
                href={`sms:?body=${encodeURIComponent(mechanicMsg)}`}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: "44px", backgroundColor: "#1a1e25", border: "1px solid #252b34", borderRadius: "8px", color: "#f1f5f9", fontWeight: 500, fontSize: "14px", textDecoration: "none" }}
              >
                💬 Text
              </a>
              <a
                href={emailUri}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: "44px", backgroundColor: "#1a1e25", border: "1px solid #252b34", borderRadius: "8px", color: "#f1f5f9", fontWeight: 500, fontSize: "14px", textDecoration: "none" }}
              >
                ✉️ Email
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Share Card Modal */}
      {showShareModal && (
        <div
          onClick={() => setShowShareModal(false)}
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.85)", zIndex: 50, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "390px" }}>
            <div
              ref={shareCardRef}
              style={{ backgroundColor: "#0d0f12", borderRadius: "20px", padding: "28px 24px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", overflow: "hidden" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "20px" }}>
                <span style={{ fontSize: "16px" }}>🔧</span>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#3b82f6", letterSpacing: "0.02em" }}>Torque</span>
              </div>

              <div style={{ fontSize: "24px", fontWeight: 800, color: "#f1f5f9", marginBottom: "4px", lineHeight: 1.1 }}>{year} {make} {model}</div>
              <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "20px", lineHeight: 1.4 }}>
                {issue.length > 72 ? issue.slice(0, 69) + "…" : issue}
              </div>

              <div style={{ padding: "12px 16px", borderRadius: "10px", marginBottom: "18px", backgroundColor: safetyConfig.bg, borderLeft: `4px solid ${safetyConfig.accent}` }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: safetyConfig.accent, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {safetyConfig.label}
                </span>
              </div>

              {topCause && (
                <div style={{ marginBottom: "18px" }}>
                  <div style={{ fontSize: "10px", color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px", fontWeight: 600 }}>Most Likely Cause</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "#f1f5f9" }}>{topCause.cause}</div>
                  {diagnosis.diagnosticSteps[0] && (
                    <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "3px" }}>→ {diagnosis.diagnosticSteps[0].action}</div>
                  )}
                </div>
              )}

              {topEst && (
                <div style={{ marginBottom: "22px" }}>
                  <div style={{ fontSize: "10px", color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px", fontWeight: 600 }}>Estimated Repair</div>
                  <div style={{ fontSize: "26px", fontWeight: 800, color: "#3b82f6" }}>{topEst.total}</div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>{topEst.fix}</div>
                </div>
              )}

              <div style={{ borderTop: "1px solid #1e2329", paddingTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: "#4b5563" }}>AI diagnosis · verify with a mechanic</span>
                <span style={{ fontSize: "12px", color: "#3b82f6", fontWeight: 700 }}>torque.app</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <button
                onClick={captureAndShare}
                disabled={isSharing}
                className="tap-target"
                style={{ flex: 1, height: "52px", backgroundColor: "#3b82f6", color: "white", fontWeight: 600, fontSize: "15px", border: "none", borderRadius: "10px", cursor: "pointer", opacity: isSharing ? 0.6 : 1 }}
              >
                {isSharing ? "Preparing…" : "↑ Share Image"}
              </button>
              <button
                onClick={() => setShowShareModal(false)}
                className="tap-target"
                style={{ height: "52px", padding: "0 20px", backgroundColor: "#1a1e25", border: "1px solid #252b34", borderRadius: "10px", color: "#9ca3af", fontSize: "14px", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ Icon, label }: { Icon: React.ElementType; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
      <div style={{ width: "2px", height: "13px", borderRadius: "2px", backgroundColor: "#3b82f6", flexShrink: 0 }} />
      <Icon size={12} color="#6b7280" />
      <span style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
      <div style={{ flex: 1, height: "1px", backgroundColor: "#1e2329" }} />
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: "#13161b", border: "1px solid #1e2329", borderRadius: "10px", padding: "14px 16px" }}>
      {children}
    </div>
  );
}
