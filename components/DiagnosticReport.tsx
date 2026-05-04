"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FileText, Search, Wrench, DollarSign, AlertTriangle, Send, MessageCircle, Share2, Link, Image as ImageIcon, MapPin, Star, AlertOctagon, Zap, ChevronDown } from "lucide-react";
import type { Diagnostic, ChatMessage } from "@/types/diagnostic";
import FeedbackCard from "@/components/FeedbackCard";
import TorqueLogo from "@/components/TorqueLogo";

const APP_URL = typeof window !== "undefined" ? window.location.origin : "https://mechanic-ai-dun.vercel.app";

interface Props {
  diagnosis: Diagnostic;
  year: string;
  make: string;
  model: string;
  issue: string;
  mods?: string;
  hasTune?: boolean;
  zip?: string;
  chatHistory: ChatMessage[];
  setChatHistory: (h: ChatMessage[]) => void;
  onNewDiagnosis: () => void;
  diagnosisId: string | null;
  onToast: (msg: string) => void;
}

const LIKELIHOOD_COLORS: Record<string, { bg: string; text: string }> = {
  "Most Likely": { bg: "rgba(74,158,255,0.14)", text: "#4a9eff" },
  "Likely": { bg: "rgba(99,102,241,0.14)", text: "#818cf8" },
  "Possible": { bg: "rgba(107,114,128,0.18)", text: "#7d8fa8" },
  "Unlikely but serious": { bg: "rgba(245,158,11,0.14)", text: "#f59e0b" },
};

const ACCENT_BORDERS: Record<string, string> = {
  "Most Likely": "#4a9eff",
  "Likely": "#6366f1",
  "Possible": "#1c2a3e",
  "Unlikely but serious": "#f59e0b",
};

const SAFETY_CONFIG = {
  STOP: { bg: "#120608", border: "#2d0f0f", accent: "#ef4444", badgeBg: "#ef4444", label: "STOP DRIVING", reasonColor: "#fca5a5" },
  CAUTION: { bg: "#120d02", border: "#2d2200", accent: "#f59e0b", badgeBg: "#f59e0b", label: "DRIVE WITH CAUTION", reasonColor: "#fcd34d" },
  OKAY: { bg: "#041208", border: "#0d2d16", accent: "#22c55e", badgeBg: "#22c55e", label: "OKAY TO DRIVE", reasonColor: "#86efac" },
};

// ── Part 7: Smart mechanic message templates ──

function buildMechanicText(issue: string, year: string, make: string, model: string, topCause: string): string {
  const isOBDCode = /^[PCBU][0-9]{4}/i.test(issue.trim());
  if (isOBDCode) {
    return `Hey, looking to bring my ${year} ${make} ${model} in — it's showing a ${issue.trim().toUpperCase()} fault code. I looked into it and it sounds like it could be ${topCause}. Could you take a look and let me know what you'd charge if that's the issue? Thanks`;
  }
  return `Hey, looking to bring my ${year} ${make} ${model} in — it's been ${issue}. I looked into it and it might be ${topCause}. Could you take a look and give me a rough quote? Thanks`;
}

function buildMechanicEmail(issue: string, year: string, make: string, model: string, topCause: string, stepOne: string, costRange: string): string {
  const isOBDCode = /^[PCBU][0-9]{4}/i.test(issue.trim());
  const issueDesc = isOBDCode
    ? `It's currently showing a ${issue.trim().toUpperCase()} fault code.`
    : `I've been noticing ${issue}.`;

  return `Hi,

I'm hoping to bring my ${year} ${make} ${model} in for a look.

${issueDesc}

I looked into it and ${topCause} seems to be the most common cause — I'd love your take once you've had a chance to look at it.

I read it's worth checking ${stepOne.toLowerCase()} first to confirm before replacing anything — though I'm happy to follow your lead.

Could you give me a rough sense of pricing if it is ${topCause}? I've seen estimates around ${costRange} but I know it varies.

Thanks — looking forward to hearing from you.`;
}

function buildMechanicWalkin(issue: string, year: string, make: string, model: string, topCause: string, stepOne: string, costRange: string): string {
  const isOBDCode = /^[PCBU][0-9]{4}/i.test(issue.trim());
  const issueLine = isOBDCode
    ? `"It's showing a ${issue.trim().toUpperCase()} code"`
    : `"I've been noticing ${issue}"`;

  return `When you get there, mention:
• "I have a ${year} ${make} ${model}"
• ${issueLine}
• "I think it might be ${topCause} — does that sound right to you?"
• Ask: "What would you charge if that's what it is?"
• Ask: "Is it worth doing ${stepOne.toLowerCase()} first to confirm before replacing anything?"
• Fair price to keep in mind: ${costRange}`;
}

// ── Collapsible section wrapper ──
function Expandable({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateRows: open ? "1fr" : "0fr",
      transition: "grid-template-rows 200ms ease-in-out",
    }}>
      <div style={{ overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

export default function DiagnosticReport({
  diagnosis, year, make, model, issue, mods, zip, chatHistory, setChatHistory, onNewDiagnosis, diagnosisId, onToast,
}: Props) {
  // Progressive disclosure state
  const [showFullWrong, setShowFullWrong] = useState(false);
  const [showAllReasoning, setShowAllReasoning] = useState(false);
  const [showAllSteps, setShowAllSteps] = useState(false);
  const [showFullCost, setShowFullCost] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);

  // Diagnostic step expand
  const [expandedStep, setExpandedStep] = useState<number | null>(0);

  // Chat
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Mechanic modal
  const [showMechanicModal, setShowMechanicModal] = useState(false);
  const [mechanicCopied, setMechanicCopied] = useState(false);
  const [mechanicFormat, setMechanicFormat] = useState<"text" | "email" | "walkin">("text");

  // Share
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shops, setShops] = useState<{ name: string; rating?: number; reviewCount?: number; address?: string; mapsUrl: string }[]>([]);
  const [shopsLoaded, setShopsLoaded] = useState(false);

  const shareCardRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const topCause = diagnosis.rankedCauses[0];
  const topEst = diagnosis.costEstimates[0];
  const verdict = diagnosis.driveSafety.verdict;
  const safetyConfig = SAFETY_CONFIG[verdict];

  // "What's Going On" — split into first sentence + rest
  const dotIdx = diagnosis.whatsWrong.indexOf(". ");
  const firstSentence = dotIdx > 0 ? diagnosis.whatsWrong.slice(0, dotIdx + 1) : diagnosis.whatsWrong;
  const restSentence = dotIdx > 0 ? diagnosis.whatsWrong.slice(dotIdx + 2) : "";

  const quickReplies = [
    "Is this a DIY job?",
    "What parts do I need?",
    "How urgent is this really?",
    topCause ? `Find ${topCause.cause} on RockAuto` : "Find parts on RockAuto",
    "What questions should I ask the mechanic?",
  ];

  useEffect(() => {
    if (zip && !shopsLoaded) {
      setShopsLoaded(true);
      fetch(`/api/mechanics?zip=${zip}&make=${encodeURIComponent(make)}`)
        .then((r) => r.json())
        .then((d) => { if (d.shops) setShops(d.shops); })
        .catch(() => {});
    }
  }, [zip, make, shopsLoaded]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (chatExpanded) chatInputRef.current?.focus();
  }, [chatExpanded]);

  async function generateShare(): Promise<string | null> {
    if (shareToken) return shareToken;
    setShareLoading(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diagnosis, year, make, model, issue }),
      });
      const data = await res.json();
      if (data.token) { setShareToken(data.token); return data.token; }
    } catch { /* ignore */ } finally {
      setShareLoading(false);
    }
    return null;
  }

  async function handleShareSheet() {
    setShowShareSheet(true);
    generateShare();
  }

  async function copyShareLink() {
    const token = await generateShare();
    if (!token) { onToast("Failed to create share link"); return; }
    await navigator.clipboard.writeText(`${APP_URL}/r/${token}`);
    onToast("Link copied!");
    setShowShareSheet(false);
  }

  async function shareViaSystem() {
    const token = await generateShare();
    if (!token) return;
    const url = `${APP_URL}/r/${token}`;
    try {
      await navigator.share({ title: `${year} ${make} ${model} Diagnosis`, text: `I diagnosed my ${year} ${make} ${model} with Torque`, url });
      setShowShareSheet(false);
    } catch { /* user cancelled */ }
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
            setShowImageModal(false);
            setShowShareSheet(false);
            return;
          }
        } catch { /* fall through */ }
      }
      const link = document.createElement("a");
      link.download = "torque-diagnosis.png";
      link.href = dataUrl;
      link.click();
      setShowImageModal(false);
      setShowShareSheet(false);
    } catch (err) {
      console.error("Share failed:", err);
    } finally {
      setIsSharing(false);
    }
  }

  function currentMechanicMessage(): string {
    const causeLabel = topCause?.cause ?? "the issue";
    const stepLabel = diagnosis.diagnosticSteps[0]?.action ?? "a diagnostic check";
    const costLabel = topEst?.total ?? "varies";
    if (mechanicFormat === "email") return buildMechanicEmail(issue, year, make, model, causeLabel, stepLabel, costLabel);
    if (mechanicFormat === "walkin") return buildMechanicWalkin(issue, year, make, model, causeLabel, stepLabel, costLabel);
    return buildMechanicText(issue, year, make, model, causeLabel);
  }

  async function copyMechanicMessage() {
    await navigator.clipboard.writeText(currentMechanicMessage());
    setMechanicCopied(true);
    onToast("Copied to clipboard");
    setTimeout(() => setMechanicCopied(false), 2000);
  }

  const handleChatSubmit = useCallback(async (messageText?: string) => {
    const userText = (messageText ?? chatInput).trim();
    if (!userText || chatLoading) return;
    setChatInput("");
    setShowQuickReplies(false);
    setChatLoading(true);

    const userMsg = { role: "user" as const, text: userText };
    const assistantPlaceholder = { role: "assistant" as const, text: "" };
    setChatMessages(prev => [...prev, userMsg, assistantPlaceholder]);

    const updatedHistory = [...chatHistory, { role: "user" as const, content: userText }];

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, make, model, diagnosis, conversationHistory: updatedHistory, message: userText }),
      });

      if (!res.ok || !res.body) {
        setChatMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: "assistant", text: "Service unavailable. Please try again." }; return u; });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        const snapshot = text;
        setChatMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: "assistant", text: snapshot }; return u; });
      }
      setChatHistory([...updatedHistory, { role: "assistant", content: text }]);
    } catch {
      setChatMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: "assistant", text: "Network error. Please check your connection." }; return u; });
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, chatLoading, chatHistory, year, make, model, diagnosis, setChatHistory]);

  // Steps: first 2 visible by default; expand all on demand
  const visibleSteps = showAllSteps ? diagnosis.diagnosticSteps : diagnosis.diagnosticSteps.slice(0, 2);

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "#060810", overflowX: "hidden" }}>

      {/* Sticky header */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, height: "52px", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(6,8,16,0.96)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid #172134", boxSizing: "border-box" }}>
        <TorqueLogo markSize={28} showWordmark wordmarkSize={14} glow="soft" />
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "#4a5c72" }}>{year} {make} {model}</span>
          <button onClick={handleShareSheet} style={{ fontSize: "12px", fontWeight: 500, padding: "5px 10px", borderRadius: "20px", border: "1px solid rgba(74,158,255,0.35)", color: "#4a9eff", backgroundColor: "rgba(74,158,255,0.1)", cursor: "pointer" }}>
            ↑ Share
          </button>
          <button onClick={onNewDiagnosis} className="tap-target" style={{ fontSize: "12px", fontWeight: 500, padding: "5px 12px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.15)", color: "#dce8f5", backgroundColor: "transparent", cursor: "pointer" }}>
            ← Back
          </button>
        </div>
      </div>

      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "12px", width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>

        {/* Mechanic escalation warning */}
        {diagnosis.mechanicEscalation.needed && (
          <div style={{ backgroundColor: "#120608", border: "1px solid #2d0f0f", borderRadius: "10px", padding: "12px 14px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <AlertOctagon size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: "1px" }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: "13px", color: "#ef4444", marginBottom: "2px" }}>Professional Help Required</div>
              <div style={{ fontSize: "13px", color: "#7d8fa8", lineHeight: 1.5 }}>{diagnosis.mechanicEscalation.reason}</div>
            </div>
          </div>
        )}

        {/* ── Safety verdict — always fully visible ── */}
        <div style={{ backgroundColor: safetyConfig.bg, border: `1px solid ${safetyConfig.border}`, borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ borderBottom: `1px solid ${safetyConfig.border}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: safetyConfig.accent, boxShadow: `0 0 8px ${safetyConfig.accent}`, flexShrink: 0 }} className={verdict === "STOP" ? "badge-pulse-stop" : verdict === "CAUTION" ? "badge-pulse-caution" : ""} />
            <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontWeight: 700, fontSize: "12px", letterSpacing: "0.12em", color: safetyConfig.accent, textTransform: "uppercase" as const }}>
              {safetyConfig.label}
            </span>
          </div>
          <div style={{ padding: "12px 16px" }}>
            <p style={{ margin: 0, fontSize: "13px", color: safetyConfig.reasonColor, lineHeight: 1.6 }}>{diagnosis.driveSafety.reason}</p>
          </div>
        </div>

        {/* Mod note */}
        {diagnosis.modNote && (
          <div style={{ backgroundColor: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "10px", padding: "12px 14px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <Zap size={14} color="#fbbf24" style={{ flexShrink: 0, marginTop: "1px" }} />
            <div>
              <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "10px", fontWeight: 700, color: "#fbbf24", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "4px" }}>Mod Note</div>
              <div style={{ fontSize: "13px", color: "#fde68a", lineHeight: 1.6 }}>{diagnosis.modNote}</div>
            </div>
          </div>
        )}

        {/* ── What's Going On — first sentence + expand ── */}
        <Card>
          <SectionHeader Icon={FileText} label="What's Going On" />
          <p style={{ margin: 0, fontSize: "14px", color: "#7d8fa8", lineHeight: 1.6 }}>{firstSentence}</p>
          {restSentence && (
            <>
              <Expandable open={showFullWrong}>
                <p style={{ margin: "8px 0 0", fontSize: "14px", color: "#7d8fa8", lineHeight: 1.6 }}>{restSentence}</p>
              </Expandable>
              <button
                onClick={() => setShowFullWrong(v => !v)}
                style={{ marginTop: "8px", fontSize: "13px", color: "#4a9eff", backgroundColor: "transparent", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: "4px" }}
              >
                {showFullWrong ? "Show less ▲" : "Show full explanation ▼"}
              </button>
            </>
          )}
        </Card>

        {/* ── Likely Causes — title + badge only, reasoning behind toggle ── */}
        <Card>
          <SectionHeader Icon={Search} label="Likely Causes" />
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {diagnosis.rankedCauses.map((cause) => {
              const colors = LIKELIHOOD_COLORS[cause.likelihood] ?? { bg: "rgba(107,114,128,0.18)", text: "#7d8fa8" };
              const accentColor = ACCENT_BORDERS[cause.likelihood] ?? "#1c2a3e";
              return (
                <div key={cause.rank} style={{ backgroundColor: "#101822", border: "1px solid #172134", borderLeft: `3px solid ${accentColor}`, borderRadius: "8px", padding: "12px", overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                      <span style={{ width: "22px", height: "22px", borderRadius: "6px", backgroundColor: "rgba(74,158,255,0.15)", border: "1px solid rgba(74,158,255,0.3)", color: "#4a9eff", fontFamily: "var(--font-jetbrains), monospace", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{cause.rank}</span>
                      <span style={{ fontSize: "15px", fontWeight: 600, color: "#dce8f5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cause.cause}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
                      {cause.modRelated && (
                        <span style={{ backgroundColor: "rgba(251,191,36,0.15)", color: "#fbbf24", fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "4px", letterSpacing: "0.04em" }}>MOD</span>
                      )}
                      <span style={{ backgroundColor: colors.bg, color: colors.text, fontSize: "11px", fontWeight: 500, padding: "2px 8px", borderRadius: "20px", whiteSpace: "nowrap" }}>{cause.likelihood}</span>
                    </div>
                  </div>
                  <Expandable open={showAllReasoning}>
                    <p style={{ margin: "8px 0 0", fontSize: "13px", color: "#6a7e96", lineHeight: 1.5, paddingLeft: "30px", wordBreak: "break-word" }}>
                      {cause.reasoning}
                    </p>
                  </Expandable>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => setShowAllReasoning(v => !v)}
            style={{ marginTop: "10px", fontSize: "13px", color: "#4a9eff", backgroundColor: "transparent", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: "4px" }}
          >
            {showAllReasoning ? "Hide reasoning ▲" : "Show reasoning ▼"}
          </button>
        </Card>

        {/* ── Diagnostic Steps — step 1 expanded, step 2 collapsed, rest hidden ── */}
        <Card>
          <SectionHeader Icon={Wrench} label="Check This First" />
          <div>
            {visibleSteps.map((step, idx) => {
              const isLast = idx === visibleSteps.length - 1 && !(!showAllSteps && diagnosis.diagnosticSteps.length > 2);
              const isOpen = expandedStep === step.step - 1;
              return (
                <div key={step.step} style={{ display: "flex", gap: "12px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: "14px" }}>
                    <div style={{ width: "26px", height: "26px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0, backgroundColor: isOpen ? "#4a9eff" : "#101822", border: `1px solid ${isOpen ? "#4a9eff" : "#172134"}`, color: isOpen ? "white" : "#4a5c72" }}>{step.step}</div>
                    {!isLast && <div style={{ width: "1px", flex: 1, minHeight: "12px", backgroundColor: "#172134", marginTop: "4px" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, paddingBottom: isLast ? "0" : "16px" }}>
                    <button onClick={() => setExpandedStep(isOpen ? null : step.step - 1)} style={{ width: "100%", minHeight: "48px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", backgroundColor: "transparent", border: "none", cursor: "pointer", padding: "0", textAlign: "left" }}>
                      <span style={{ fontSize: "15px", fontWeight: 600, color: "#dce8f5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{step.action}</span>
                      <span style={{ color: "#4a5c72", fontSize: "10px", flexShrink: 0 }}>{isOpen ? "▲" : "▼"}</span>
                    </button>
                    <Expandable open={isOpen}>
                      <div style={{ backgroundColor: "#060810", border: "1px solid #172134", borderRadius: "8px", padding: "12px", display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
                        <p style={{ margin: 0, fontSize: "13px", fontStyle: "italic", color: "#7d8fa8", lineHeight: 1.5 }}>{step.why}</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div style={{ backgroundColor: "#0a1a0f", border: "1px solid #1e3a28", borderRadius: "8px", padding: "10px 12px", width: "100%", boxSizing: "border-box" }}>
                            <div style={{ fontSize: "11px", fontWeight: 600, color: "#22c55e", marginBottom: "4px" }}>If it passes / looks good</div>
                            <div style={{ fontSize: "13px", color: "#7d8fa8", lineHeight: 1.5 }}>{step.ifResultA}</div>
                          </div>
                          <div style={{ backgroundColor: "#1a1200", border: "1px solid #3a2a00", borderRadius: "8px", padding: "10px 12px", width: "100%", boxSizing: "border-box" }}>
                            <div style={{ fontSize: "11px", fontWeight: 600, color: "#f59e0b", marginBottom: "4px" }}>If it fails / looks bad</div>
                            <div style={{ fontSize: "13px", color: "#7d8fa8", lineHeight: 1.5 }}>{step.ifResultB}</div>
                          </div>
                        </div>
                        {(step.cost || (step.tools && step.tools !== "None")) && (
                          <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#4a5c72", flexWrap: "wrap" }}>
                            {step.cost && <span>⏱ {step.cost}</span>}
                            {step.tools && step.tools !== "None" && <span>🔧 {step.tools}</span>}
                          </div>
                        )}
                      </div>
                    </Expandable>
                  </div>
                </div>
              );
            })}
          </div>
          {!showAllSteps && diagnosis.diagnosticSteps.length > 2 && (
            <button
              onClick={() => setShowAllSteps(true)}
              style={{ marginTop: "4px", fontSize: "13px", color: "#4a9eff", backgroundColor: "transparent", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: "4px" }}
            >
              Show all {diagnosis.diagnosticSteps.length} steps ▼
            </button>
          )}
        </Card>

        {/* ── Cost — total only, expand for full breakdown ── */}
        <Card>
          <SectionHeader Icon={DollarSign} label="Cost Estimates" />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: showFullCost ? "12px" : 0 }}>
            <span style={{ fontSize: "13px", color: "#7d8fa8" }}>Est. repair cost</span>
            <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "22px", fontWeight: 700, color: "#4a9eff" }}>
              {topEst?.total ?? "N/A"}
            </span>
          </div>
          <Expandable open={showFullCost}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "12px" }}>
              {diagnosis.costEstimates.map((est, i) => (
                <div key={i} style={{ backgroundColor: "#101822", border: "1px solid #172134", borderRadius: "8px", padding: "12px", width: "100%", boxSizing: "border-box" }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#dce8f5", marginBottom: "8px", wordBreak: "break-word" }}>{est.fix}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                    {(["Parts", "Labor", "Total"] as const).map((label, li) => {
                      const val = li === 0 ? est.parts : li === 1 ? est.labor : est.total;
                      return (
                        <div key={label}>
                          <div style={{ fontSize: "9px", color: "#2d3f55", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "3px", fontWeight: 600 }}>{label}</div>
                          <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: li === 2 ? "15px" : "12px", color: li === 2 ? "#4a9eff" : "#7d8fa8", fontWeight: li === 2 ? 700 : 400, wordBreak: "break-word" }}>{val}</div>
                        </div>
                      );
                    })}
                  </div>
                  {est.note && <div style={{ marginTop: "8px", fontSize: "12px", color: "#4a5c72", fontStyle: "italic", wordBreak: "break-word" }}>{est.note}</div>}
                </div>
              ))}
            </div>
          </Expandable>
          <button
            onClick={() => setShowFullCost(v => !v)}
            style={{ marginTop: "10px", fontSize: "13px", color: "#4a9eff", backgroundColor: "transparent", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: "4px" }}
          >
            {showFullCost ? "Hide breakdown ▲" : "See full breakdown ▼"}
          </button>
        </Card>

        {/* ── Don't Do This — always visible ── */}
        {diagnosis.dontDoThis.length > 0 && (
          <div style={{ backgroundColor: "#150a0a", border: "1px solid #2a1515", borderRadius: "10px", padding: "14px 16px", width: "100%", boxSizing: "border-box" }}>
            <SectionHeader Icon={AlertTriangle} label="Don't Do This" />
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
              {diagnosis.dontDoThis.map((warning, i) => (
                <li key={i} style={{ display: "flex", gap: "8px", lineHeight: 1.4 }}>
                  <span style={{ color: "#f59e0b", fontWeight: 700, flexShrink: 0, fontSize: "14px" }}>›</span>
                  <span style={{ fontSize: "13px", color: "#dce8f5", lineHeight: 1.4, wordBreak: "break-word" }}>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Mechanic Finder */}
        {shops.length > 0 && (
          <div style={{ backgroundColor: "#0b1019", border: "1px solid #172134", borderRadius: "10px", padding: "14px 16px", width: "100%", boxSizing: "border-box" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <MapPin size={12} color="#4a5c72" />
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#4a5c72", textTransform: "uppercase", letterSpacing: "0.08em" }}>Shops Near You</span>
            </div>
            <p style={{ margin: "0 0 12px", fontSize: "12px", color: "#2d3f55", fontStyle: "italic" }}>
              Independent shops typically charge 30–40% less than dealers for this repair.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {shops.map((shop, i) => (
                <a key={i} href={shop.mapsUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", backgroundColor: "#101822", border: "1px solid #172134", borderRadius: "8px", padding: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", boxSizing: "border-box" }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#dce8f5", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shop.name}</div>
                    {shop.address && <div style={{ fontSize: "11px", color: "#4a5c72", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shop.address}</div>}
                  </div>
                  {shop.rating && (
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0, marginLeft: "8px" }}>
                      <Star size={12} color="#f59e0b" fill="#f59e0b" />
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#f59e0b" }}>{shop.rating}</span>
                      {shop.reviewCount && <span style={{ fontSize: "11px", color: "#4a5c72" }}>({shop.reviewCount})</span>}
                    </div>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── Part 11: Outcome tracking (FeedbackCard) ── */}
        <FeedbackCard diagnosisId={diagnosisId} />

        {/* ── Send to Mechanic (Part 7) ── */}
        <Card>
          <SectionHeader Icon={Send} label="Send to My Mechanic" />
          <p style={{ margin: "0 0 12px", fontSize: "13px", color: "#7d8fa8", lineHeight: 1.5 }}>
            Walk in prepared. Copy this before your appointment so they know you&apos;ve done your homework.
          </p>
          <button
            onClick={() => setShowMechanicModal(true)}
            className="tap-target"
            style={{ width: "100%", height: "44px", backgroundColor: "#101822", border: "1px solid #1c2a3e", borderRadius: "8px", color: "#dce8f5", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}
          >
            Generate Message
          </button>
        </Card>

        {/* ── Ask a Follow-Up — collapsed by default ── */}
        <Card>
          <SectionHeader Icon={MessageCircle} label="Ask a Follow-Up" />

          {!chatExpanded ? (
            <div
              onClick={() => setChatExpanded(true)}
              style={{ display: "flex", alignItems: "center", gap: "10px", height: "44px", padding: "0 12px", backgroundColor: "#101822", border: "1px solid #172134", borderRadius: "8px", cursor: "text" }}
            >
              <span style={{ fontSize: "14px", color: "#2d3f55", flex: 1 }}>Ask anything about this diagnosis…</span>
              <ChevronDown size={14} color="#2d3f55" />
            </div>
          ) : (
            <>
              {chatMessages.length > 0 && (
                <div style={{ marginBottom: "12px", display: "flex", flexDirection: "column", gap: "8px", maxHeight: "280px", overflowY: "auto" }}>
                  {chatMessages.map((msg, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                      {msg.role === "assistant" && msg.text === "" ? (
                        <div style={{ padding: "10px 14px", borderRadius: "12px", backgroundColor: "#101822" }}>
                          <span className="typing-dot" />
                          <span className="typing-dot" />
                          <span className="typing-dot" />
                        </div>
                      ) : (
                        <div style={{ maxWidth: "85%", padding: "8px 12px", borderRadius: "12px", fontSize: "14px", lineHeight: 1.5, backgroundColor: msg.role === "user" ? "#4a9eff" : "#101822", color: msg.role === "user" ? "white" : "#7d8fa8", wordBreak: "break-word" }}>
                          {msg.text}
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              )}

              {showQuickReplies && chatMessages.length === 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                  {quickReplies.map((reply) => (
                    <button key={reply} onClick={() => handleChatSubmit(reply)} className="tap-target" style={{ fontSize: "12px", padding: "6px 12px", borderRadius: "20px", border: "1px solid #1c2a3e", backgroundColor: "#101822", color: "#7d8fa8", cursor: "pointer", whiteSpace: "nowrap" }}>
                      {reply}
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); handleChatSubmit(); }} style={{ display: "flex", gap: "8px" }}>
                <input
                  ref={chatInputRef}
                  type="text"
                  value={chatInput}
                  onChange={(e) => { setChatInput(e.target.value); if (e.target.value) setShowQuickReplies(false); else if (chatMessages.length === 0) setShowQuickReplies(true); }}
                  placeholder="Ask anything about this diagnosis..."
                  style={{ flex: 1, minWidth: 0, height: "44px", padding: "0 12px", fontSize: "16px", backgroundColor: "#101822", border: "1px solid #172134", borderRadius: "8px", color: "#dce8f5" }}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading}
                  style={{ height: "44px", padding: "0 18px", backgroundColor: "#4a9eff", color: "white", fontWeight: 600, fontSize: "14px", border: "none", borderRadius: "8px", cursor: chatInput.trim() && !chatLoading ? "pointer" : "not-allowed", opacity: chatInput.trim() && !chatLoading ? 1 : 0.4, flexShrink: 0 }}
                >
                  Ask
                </button>
              </form>
            </>
          )}
        </Card>

        <p style={{ textAlign: "center", fontSize: "12px", color: "#4a5c72", opacity: 0.4, paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))", margin: 0 }}>
          AI diagnosis is for guidance only. Always verify with a qualified mechanic for safety-critical repairs.
        </p>
      </div>

      {/* ── Share Sheet ── */}
      {showShareSheet && (
        <div onClick={() => setShowShareSheet(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "560px", backgroundColor: "#0b1019", border: "1px solid #172134", borderRadius: "20px 20px 0 0", padding: "20px 16px", paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))", animation: "view-fade-in 200ms ease", boxSizing: "border-box" }}>
            <div style={{ width: "32px", height: "4px", backgroundColor: "#162232", borderRadius: "2px", margin: "0 auto 20px" }} />
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#dce8f5", marginBottom: "16px" }}>Share Diagnosis</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button onClick={copyShareLink} disabled={shareLoading} className="tap-target" style={{ height: "52px", display: "flex", alignItems: "center", gap: "14px", backgroundColor: "#101822", border: "1px solid #1c2a3e", borderRadius: "12px", padding: "0 16px", cursor: "pointer", color: "#dce8f5", width: "100%", boxSizing: "border-box", opacity: shareLoading ? 0.5 : 1 }}>
                <Link size={18} color="#4a9eff" />
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "14px", fontWeight: 600 }}>Copy link</div>
                  <div style={{ fontSize: "11px", color: "#4a5c72" }}>{shareLoading ? "Creating share…" : "torqueapp.co/r/…"}</div>
                </div>
              </button>
              {"share" in navigator && (
                <button onClick={shareViaSystem} disabled={shareLoading} className="tap-target" style={{ height: "52px", display: "flex", alignItems: "center", gap: "14px", backgroundColor: "#101822", border: "1px solid #1c2a3e", borderRadius: "12px", padding: "0 16px", cursor: "pointer", color: "#dce8f5", width: "100%", boxSizing: "border-box", opacity: shareLoading ? 0.5 : 1 }}>
                  <Share2 size={18} color="#4a9eff" />
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: "14px", fontWeight: 600 }}>Share via…</div>
                    <div style={{ fontSize: "11px", color: "#4a5c72" }}>iMessage, WhatsApp, Reddit…</div>
                  </div>
                </button>
              )}
              <button onClick={() => { setShowShareSheet(false); setShowImageModal(true); }} className="tap-target" style={{ height: "52px", display: "flex", alignItems: "center", gap: "14px", backgroundColor: "#101822", border: "1px solid #1c2a3e", borderRadius: "12px", padding: "0 16px", cursor: "pointer", color: "#dce8f5", width: "100%", boxSizing: "border-box" }}>
                <ImageIcon size={18} color="#4a9eff" />
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "14px", fontWeight: 600 }}>Download image</div>
                  <div style={{ fontSize: "11px", color: "#4a5c72" }}>Save as shareable card</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Send to Mechanic Modal ── */}
      {showMechanicModal && (
        <div onClick={() => setShowMechanicModal(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "560px", backgroundColor: "#0b1019", border: "1px solid #172134", borderRadius: "16px 16px 0 0", padding: "20px 16px", paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))", boxSizing: "border-box" }}>
            <div style={{ width: "32px", height: "4px", backgroundColor: "#162232", borderRadius: "2px", margin: "0 auto 16px" }} />
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#dce8f5", marginBottom: "14px" }}>Send to Your Mechanic</div>

            {/* Format tabs */}
            <div style={{ display: "flex", gap: "4px", backgroundColor: "#060810", borderRadius: "10px", padding: "3px", marginBottom: "14px" }}>
              {(["text", "email", "walkin"] as const).map((fmt) => (
                <button key={fmt} onClick={() => setMechanicFormat(fmt)} style={{ flex: 1, height: "34px", fontSize: "13px", fontWeight: 600, border: "none", borderRadius: "8px", cursor: "pointer", backgroundColor: mechanicFormat === fmt ? "#101822" : "transparent", color: mechanicFormat === fmt ? "#dce8f5" : "#4a5c72", transition: "background-color 150ms" }}>
                  {fmt === "text" ? "Text" : fmt === "email" ? "Email" : "Walk-in"}
                </button>
              ))}
            </div>

            {mechanicFormat === "email" && (
              <div style={{ backgroundColor: "#060810", border: "1px solid #172134", borderRadius: "8px", padding: "8px 12px", marginBottom: "8px" }}>
                <span style={{ fontSize: "10px", fontWeight: 600, color: "#2d3f55", textTransform: "uppercase", letterSpacing: "0.08em" }}>Subject: </span>
                <span style={{ fontSize: "13px", color: "#7d8fa8" }}>Service inquiry — {year} {make} {model}</span>
              </div>
            )}

            <div style={{ backgroundColor: "#101822", border: "1px solid #1c2a3e", borderRadius: "10px", padding: "14px", marginBottom: "14px", maxHeight: "220px", overflowY: "auto", boxSizing: "border-box" }}>
              <p style={{ margin: 0, fontSize: "14px", color: "#dce8f5", lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{currentMechanicMessage()}</p>
            </div>

            <button onClick={copyMechanicMessage} className="tap-target" style={{ width: "100%", height: "48px", backgroundColor: mechanicCopied ? "#22c55e" : "#4a9eff", color: "white", fontWeight: 600, fontSize: "15px", border: "none", borderRadius: "8px", cursor: "pointer", transition: "background-color 200ms", marginBottom: "8px" }}>
              {mechanicCopied ? "✓ Copied!" : "Copy Message"}
            </button>

            {mechanicFormat === "email" && (
              <a href={`mailto:?subject=${encodeURIComponent(`Service inquiry — ${year} ${make} ${model}`)}&body=${encodeURIComponent(currentMechanicMessage())}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "44px", backgroundColor: "#101822", border: "1px solid #1c2a3e", borderRadius: "8px", color: "#7d8fa8", fontWeight: 500, fontSize: "14px", textDecoration: "none" }}>
                Open in Mail ↗
              </a>
            )}
            {mechanicFormat === "text" && (
              <a href={`sms:?body=${encodeURIComponent(currentMechanicMessage())}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "44px", backgroundColor: "#101822", border: "1px solid #1c2a3e", borderRadius: "8px", color: "#7d8fa8", fontWeight: 500, fontSize: "14px", textDecoration: "none" }}>
                Open in Messages ↗
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── Image Share Modal ── */}
      {showImageModal && (
        <div onClick={() => setShowImageModal(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.85)", zIndex: 50, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", boxSizing: "border-box" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "390px" }}>
            <div ref={shareCardRef} style={{ backgroundColor: "#060810", borderRadius: "20px", padding: "28px 24px", overflow: "hidden", boxSizing: "border-box" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "20px" }}>
                <Wrench size={14} color="#4a9eff" />
                <span style={{ fontFamily: "var(--font-barlow), sans-serif", fontSize: "14px", fontWeight: 700, color: "#4a9eff", letterSpacing: "0.12em" }}>TORQUE</span>
              </div>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "#dce8f5", marginBottom: "4px", lineHeight: 1.1 }}>{year} {make} {model}</div>
              <div style={{ fontSize: "13px", color: "#4a5c72", marginBottom: "20px", lineHeight: 1.4, wordBreak: "break-word" }}>{issue.length > 72 ? issue.slice(0, 69) + "…" : issue}</div>
              <div style={{ padding: "12px 16px", borderRadius: "10px", marginBottom: "18px", backgroundColor: safetyConfig.bg, borderLeft: `4px solid ${safetyConfig.accent}` }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: safetyConfig.accent, textTransform: "uppercase", letterSpacing: "0.06em" }}>{safetyConfig.label}</span>
              </div>
              {topCause && (
                <div style={{ marginBottom: "18px" }}>
                  <div style={{ fontSize: "10px", color: "#2d3f55", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px", fontWeight: 600 }}>Most Likely Cause</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "#dce8f5", wordBreak: "break-word" }}>{topCause.cause}</div>
                  {diagnosis.diagnosticSteps[0] && <div style={{ fontSize: "12px", color: "#4a5c72", marginTop: "3px" }}>→ {diagnosis.diagnosticSteps[0].action}</div>}
                </div>
              )}
              {topEst && (
                <div style={{ marginBottom: "22px" }}>
                  <div style={{ fontSize: "10px", color: "#2d3f55", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px", fontWeight: 600 }}>Estimated Repair</div>
                  <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "26px", fontWeight: 700, color: "#4a9eff" }}>{topEst.total}</div>
                  <div style={{ fontSize: "12px", color: "#4a5c72" }}>{topEst.fix}</div>
                </div>
              )}
              <div style={{ borderTop: "1px solid #172134", paddingTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: "#2d3f55" }}>AI diagnosis · verify with a mechanic</span>
                <span style={{ fontSize: "12px", color: "#4a9eff", fontWeight: 700 }}>torqueapp.co</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <button onClick={captureAndShare} disabled={isSharing} className="tap-target" style={{ flex: 1, height: "52px", backgroundColor: "#4a9eff", color: "white", fontWeight: 600, fontSize: "15px", border: "none", borderRadius: "10px", cursor: "pointer", opacity: isSharing ? 0.6 : 1 }}>
                {isSharing ? "Preparing…" : "↑ Share Image"}
              </button>
              <button onClick={() => setShowImageModal(false)} className="tap-target" style={{ height: "52px", padding: "0 20px", backgroundColor: "#101822", border: "1px solid #1c2a3e", borderRadius: "10px", color: "#7d8fa8", fontSize: "14px", cursor: "pointer" }}>
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
      <div style={{ width: "2px", height: "13px", borderRadius: "2px", backgroundColor: "#4a9eff", flexShrink: 0 }} />
      <Icon size={12} color="#4a5c72" />
      <span style={{ fontSize: "11px", fontWeight: 600, color: "#4a5c72", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
      <div style={{ flex: 1, height: "1px", backgroundColor: "#172134" }} />
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: "#0b1019", border: "1px solid #172134", borderRadius: "10px", padding: "14px 16px", width: "100%", boxSizing: "border-box" }}>
      {children}
    </div>
  );
}
