"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FileText, Search, Wrench, DollarSign, AlertTriangle, Send, MessageCircle, Share2, Link, Image as ImageIcon, MapPin, Star, AlertOctagon, Zap } from "lucide-react";
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
  "Possible": "#374151",
  "Unlikely but serious": "#f59e0b",
};

const SAFETY_CONFIG = {
  STOP: { bg: "#120608", border: "#2d0f0f", accent: "#ef4444", badgeBg: "#ef4444", label: "STOP DRIVING", reasonColor: "#fca5a5" },
  CAUTION: { bg: "#120d02", border: "#2d2200", accent: "#f59e0b", badgeBg: "#f59e0b", label: "DRIVE WITH CAUTION", reasonColor: "#fcd34d" },
  OKAY: { bg: "#041208", border: "#0d2d16", accent: "#22c55e", badgeBg: "#22c55e", label: "OKAY TO DRIVE", reasonColor: "#86efac" },
};

function mechanicText(diagnosis: Diagnostic, year: string, make: string, model: string, issue: string): string {
  const topCause = diagnosis.rankedCauses[0]?.cause ?? "the issue";
  return `Hey, looking to bring my ${year} ${make} ${model} in — throwing ${issue}. Did some research, sounds like it might be ${topCause}. Could you take a look and let me know what you'd charge if that's what it is? Thanks`;
}

function mechanicEmail(diagnosis: Diagnostic, year: string, make: string, model: string, issue: string): string {
  const top = diagnosis.rankedCauses[0];
  const step = diagnosis.diagnosticSteps[0];
  const est = diagnosis.costEstimates[0];
  return `Hi there,

I'm looking to bring my ${year} ${make} ${model} in — it's been ${issue} and I want to get it sorted.

I've done a bit of research and it sounds like the most common cause for this is ${top?.cause ?? "a known fault"}. I'd love your take on it though — you obviously know better than I do once you've actually looked at it.

One thing I read is that it's worth checking ${(step?.action ?? "a diagnostic check").toLowerCase()} first before replacing anything, just to confirm the diagnosis. Happy to defer to your judgment on the approach.

Can you give me a rough sense of what you'd charge for this if it turns out to be ${top?.cause ?? "the likely fault"}? I've seen ranges of ${est?.total ?? "competitive"} mentioned online but I know it varies.

Thanks — looking forward to hearing from you.`;
}

function mechanicWalkin(diagnosis: Diagnostic, year: string, make: string, model: string, issue: string): string {
  const top = diagnosis.rankedCauses[0];
  const step = diagnosis.diagnosticSteps[0];
  const est = diagnosis.costEstimates[0];
  return `When you walk in, mention:
• "It's a ${year} ${make} ${model} throwing ${issue}"
• "I read it's often the ${top?.cause ?? "a common fault"} — does that sound right to you?"
• Ask: "What would you charge if that's what it is?"
• Ask: "Can you do a quick ${(step?.action ?? "diagnostic check").toLowerCase()} first to confirm before replacing anything?"
• Fair price range to keep in mind: ${est?.total ?? "ask for their estimate"}`;
}

export default function DiagnosticReport({
  diagnosis, year, make, model, issue, mods, zip, chatHistory, setChatHistory, onNewDiagnosis, diagnosisId, onToast,
}: Props) {
  const [expandedStep, setExpandedStep] = useState<number | null>(0);
  const [expandedCauses, setExpandedCauses] = useState<Set<number>>(new Set());
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [showMechanicModal, setShowMechanicModal] = useState(false);
  const [mechanicCopied, setMechanicCopied] = useState(false);
  const [mechanicFormat, setMechanicFormat] = useState<"text" | "email" | "walkin">("text");
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

  function toggleCause(rank: number) {
    setExpandedCauses(prev => {
      const next = new Set(prev);
      if (next.has(rank)) next.delete(rank); else next.add(rank);
      return next;
    });
  }

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
    if (mechanicFormat === "email") return mechanicEmail(diagnosis, year, make, model, issue);
    if (mechanicFormat === "walkin") return mechanicWalkin(diagnosis, year, make, model, issue);
    return mechanicText(diagnosis, year, make, model, issue);
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
        body: JSON.stringify({
          year, make, model,
          diagnosis,
          conversationHistory: updatedHistory,
          message: userText,
        }),
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

  const verdict = diagnosis.driveSafety.verdict;
  const safetyConfig = SAFETY_CONFIG[verdict];
  const topEst = diagnosis.costEstimates[0];

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "#060810" }}>

      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, height: "52px", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(6,8,16,0.96)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid #172134" }}>
        <TorqueLogo markSize={28} showWordmark wordmarkSize={14} glow="soft" />
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "#4a5c72" }}>{year} {make} {model}</span>
          <button
            onClick={handleShareSheet}
            style={{ fontSize: "12px", fontWeight: 500, padding: "5px 10px", borderRadius: "20px", border: "1px solid rgba(74,158,255,0.4)", color: "#4a9eff", backgroundColor: "rgba(74,158,255,0.1)", cursor: "pointer" }}
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
          <div style={{ backgroundColor: "#120608", border: "1px solid #2d0f0f", borderRadius: "10px", padding: "12px 14px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <AlertOctagon size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: "1px" }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: "13px", color: "#ef4444", marginBottom: "2px" }}>Professional Help Required</div>
              <div style={{ fontSize: "13px", color: "#7d8fa8", lineHeight: 1.5 }}>{diagnosis.mechanicEscalation.reason}</div>
            </div>
          </div>
        )}

        {/* Safety */}
        <div style={{ backgroundColor: safetyConfig.bg, border: `1px solid ${safetyConfig.border}`, borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ borderBottom: `1px solid ${safetyConfig.border}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: safetyConfig.accent, boxShadow: `0 0 8px ${safetyConfig.accent}`, flexShrink: 0 }} className={verdict === "STOP" ? "badge-pulse-stop" : verdict === "CAUTION" ? "badge-pulse-caution" : ""} />
            <span
              style={{ fontFamily: "var(--font-jetbrains), monospace", fontWeight: 700, fontSize: "12px", letterSpacing: "0.12em", color: safetyConfig.accent, textTransform: "uppercase" as const }}
            >
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

        {/* What's Going On */}
        <Card>
          <SectionHeader Icon={FileText} label="What's Going On" />
          <p style={{ margin: 0, fontSize: "14px", color: "#7d8fa8", lineHeight: 1.6 }}>{diagnosis.whatsWrong}</p>
        </Card>

        {/* Causes */}
        <Card>
          <SectionHeader Icon={Search} label="Likely Causes" />
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {diagnosis.rankedCauses.map((cause) => {
              const colors = LIKELIHOOD_COLORS[cause.likelihood] ?? { bg: "rgba(107,114,128,0.18)", text: "#7d8fa8" };
              const accentColor = ACCENT_BORDERS[cause.likelihood] ?? "#374151";
              const isExpanded = expandedCauses.has(cause.rank);
              const isLong = cause.reasoning.length > 90;
              return (
                <div key={cause.rank} style={{ backgroundColor: "#101822", border: "1px solid #1e2329", borderLeft: `3px solid ${accentColor}`, borderRadius: "8px", padding: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                      <span style={{ width: "22px", height: "22px", borderRadius: "6px", backgroundColor: "rgba(74,158,255,0.15)", border: "1px solid rgba(74,158,255,0.3)", color: "#4a9eff", fontFamily: "var(--font-jetbrains), monospace", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{cause.rank}</span>
                      <span style={{ fontSize: "15px", fontWeight: 600, color: "#dce8f5" }}>{cause.cause}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
                      {cause.modRelated && (
                        <span style={{ backgroundColor: "rgba(251,191,36,0.15)", color: "#fbbf24", fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "4px", letterSpacing: "0.04em" }}>MOD</span>
                      )}
                      <span style={{ backgroundColor: colors.bg, color: colors.text, fontSize: "11px", fontWeight: 500, padding: "2px 8px", borderRadius: "20px", whiteSpace: "nowrap" as const }}>{cause.likelihood}</span>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", color: "#8b95a3", lineHeight: 1.5, paddingLeft: "30px", display: "-webkit-box", WebkitLineClamp: isExpanded ? "unset" : 2, WebkitBoxOrient: "vertical" as const, overflow: isExpanded ? "visible" : "hidden" }}>
                    {cause.reasoning}
                  </p>
                  {isLong && (
                    <button onClick={() => toggleCause(cause.rank)} style={{ marginLeft: "30px", marginTop: "4px", fontSize: "12px", color: "#4a9eff", backgroundColor: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
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
                    <div style={{ width: "26px", height: "26px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0, backgroundColor: isOpen ? "#4a9eff" : "#101822", border: `1px solid ${isOpen ? "#4a9eff" : "#1c2a3e"}`, color: isOpen ? "white" : "#4a5c72" }}>{step.step}</div>
                    {!isLast && <div style={{ width: "1px", flex: 1, minHeight: "12px", backgroundColor: "#172134", marginTop: "4px" }} />}
                  </div>
                  <div style={{ flex: 1, paddingBottom: isLast ? "0" : "16px" }}>
                    <button onClick={() => setExpandedStep(isOpen ? null : step.step - 1)} style={{ width: "100%", minHeight: "48px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", backgroundColor: "transparent", border: "none", cursor: "pointer", padding: "0", textAlign: "left" }}>
                      <span style={{ fontSize: "15px", fontWeight: 600, color: "#dce8f5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{step.action}</span>
                      <span style={{ color: "#4a5c72", fontSize: "10px", flexShrink: 0 }}>{isOpen ? "▲" : "▼"}</span>
                    </button>
                    {isOpen && (
                      <div style={{ backgroundColor: "#060810", border: "1px solid #1e2329", borderRadius: "8px", padding: "12px", display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
                        <p style={{ margin: 0, fontSize: "13px", fontStyle: "italic", color: "#7d8fa8", lineHeight: 1.5 }}>{step.why}</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div style={{ backgroundColor: "#0a1a0f", border: "1px solid #1e3a28", borderRadius: "8px", padding: "10px 12px" }}>
                            <div style={{ fontSize: "11px", fontWeight: 600, color: "#22c55e", marginBottom: "4px" }}>If it passes / looks good</div>
                            <div style={{ fontSize: "13px", color: "#7d8fa8", lineHeight: 1.5 }}>{step.ifResultA}</div>
                          </div>
                          <div style={{ backgroundColor: "#1a1200", border: "1px solid #3a2a00", borderRadius: "8px", padding: "10px 12px" }}>
                            <div style={{ fontSize: "11px", fontWeight: 600, color: "#f59e0b", marginBottom: "4px" }}>If it fails / looks bad</div>
                            <div style={{ fontSize: "13px", color: "#7d8fa8", lineHeight: 1.5 }}>{step.ifResultB}</div>
                          </div>
                        </div>
                        {(step.cost || (step.tools && step.tools !== "None")) && (
                          <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#4a5c72" }}>
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
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {diagnosis.costEstimates.map((est, i) => (
              <div key={i} style={{ backgroundColor: "#101822", border: "1px solid #1e2329", borderRadius: "8px", padding: "12px" }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#dce8f5", marginBottom: "8px" }}>{est.fix}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                  {(["Parts", "Labor", "Total"] as const).map((label, li) => {
                    const val = li === 0 ? est.parts : li === 1 ? est.labor : est.total;
                    return (
                      <div key={label}>
                        <div style={{ fontSize: "9px", color: "#3a4d63", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "3px", fontWeight: 600 }}>{label}</div>
                        <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: li === 2 ? "16px" : "13px", color: li === 2 ? "#4a9eff" : "#7d8fa8", fontWeight: li === 2 ? 700 : 400 }}>{val}</div>
                      </div>
                    );
                  })}
                </div>
                {est.note && <div style={{ marginTop: "8px", fontSize: "12px", color: "#4a5c72", fontStyle: "italic" }}>{est.note}</div>}
              </div>
            ))}
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
                  <span style={{ fontSize: "13px", color: "#dce8f5", lineHeight: 1.4 }}>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Mechanic Finder */}
        {shops.length > 0 && (
          <div style={{ backgroundColor: "#0b1019", border: "1px solid #1e2329", borderRadius: "10px", padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <MapPin size={12} color="#4a5c72" />
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#4a5c72", textTransform: "uppercase", letterSpacing: "0.08em" }}>Shops Near You</span>
            </div>
            <p style={{ margin: "0 0 12px", fontSize: "12px", color: "#3a4d63", fontStyle: "italic" }}>
              Independent shops typically charge 30–40% less than dealers for this repair.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {shops.map((shop, i) => (
                <a key={i} href={shop.mapsUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", backgroundColor: "#101822", border: "1px solid #1e2329", borderRadius: "8px", padding: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ minWidth: 0 }}>
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

        {/* Feedback */}
        <FeedbackCard diagnosisId={diagnosisId} />

        {/* Send to My Mechanic */}
        <Card>
          <SectionHeader Icon={Send} label="Send to My Mechanic" />
          <p style={{ margin: "0 0 12px", fontSize: "13px", color: "#7d8fa8", lineHeight: 1.5 }}>
            Walk into the shop prepared. Send this before your appointment so they know you&apos;ve done your homework.
          </p>
          <button
            onClick={() => setShowMechanicModal(true)}
            className="tap-target"
            style={{ width: "100%", height: "44px", backgroundColor: "#101822", border: "1px solid #252b34", borderRadius: "8px", color: "#dce8f5", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}
          >
            Generate Message
          </button>
        </Card>

        {/* Chat */}
        <Card>
          <SectionHeader Icon={MessageCircle} label="Ask a Follow-Up" />

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
                    <div style={{ maxWidth: "85%", padding: "8px 12px", borderRadius: "12px", fontSize: "14px", lineHeight: 1.5, backgroundColor: msg.role === "user" ? "#4a9eff" : "#101822", color: msg.role === "user" ? "white" : "#7d8fa8" }}>
                      {msg.text}
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          )}

          {/* Quick reply chips */}
          {showQuickReplies && chatMessages.length === 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  onClick={() => handleChatSubmit(reply)}
                  className="tap-target"
                  style={{ fontSize: "12px", padding: "6px 12px", borderRadius: "20px", border: "1px solid #252b34", backgroundColor: "#101822", color: "#7d8fa8", cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleChatSubmit(); }} style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => { setChatInput(e.target.value); if (e.target.value) setShowQuickReplies(false); else if (chatMessages.length === 0) setShowQuickReplies(true); }}
              placeholder="Ask anything about this diagnosis..."
              style={{ flex: 1, height: "44px", padding: "0 12px", fontSize: "16px", backgroundColor: "#101822", border: "1px solid #1e2329", borderRadius: "8px", color: "#dce8f5" }}
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || chatLoading}
              style={{ height: "44px", padding: "0 18px", backgroundColor: "#4a9eff", color: "white", fontWeight: 600, fontSize: "14px", border: "none", borderRadius: "8px", cursor: chatInput.trim() && !chatLoading ? "pointer" : "not-allowed", opacity: chatInput.trim() && !chatLoading ? 1 : 0.4, flexShrink: 0 }}
            >
              Ask
            </button>
          </form>
        </Card>

        <p style={{ textAlign: "center", fontSize: "12px", color: "#4a5c72", opacity: 0.4, paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))", margin: 0 }}>
          AI diagnosis is for guidance only. Always verify with a qualified mechanic for safety-critical repairs.
        </p>
      </div>

      {/* Share Sheet */}
      {showShareSheet && (
        <div onClick={() => setShowShareSheet(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "560px", backgroundColor: "#0b1019", border: "1px solid #1e2329", borderRadius: "20px 20px 0 0", padding: "20px 16px", paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))", animation: "view-fade-in 200ms ease" }}>
            <div style={{ width: "32px", height: "4px", backgroundColor: "#1c2a3e", borderRadius: "2px", margin: "0 auto 20px" }} />
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#dce8f5", marginBottom: "16px" }}>
              Share Diagnosis
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button onClick={copyShareLink} disabled={shareLoading} className="tap-target" style={{ height: "52px", display: "flex", alignItems: "center", gap: "14px", backgroundColor: "#101822", border: "1px solid #252b34", borderRadius: "12px", padding: "0 16px", cursor: "pointer", color: "#dce8f5", width: "100%", opacity: shareLoading ? 0.5 : 1 }}>
                <Link size={18} color="#4a9eff" />
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "14px", fontWeight: 600 }}>Copy link</div>
                  <div style={{ fontSize: "11px", color: "#4a5c72" }}>{shareLoading ? "Creating share…" : "torqueapp.co/r/…"}</div>
                </div>
              </button>
              {"share" in navigator && (
                <button onClick={shareViaSystem} disabled={shareLoading} className="tap-target" style={{ height: "52px", display: "flex", alignItems: "center", gap: "14px", backgroundColor: "#101822", border: "1px solid #252b34", borderRadius: "12px", padding: "0 16px", cursor: "pointer", color: "#dce8f5", width: "100%", opacity: shareLoading ? 0.5 : 1 }}>
                  <Share2 size={18} color="#4a9eff" />
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: "14px", fontWeight: 600 }}>Share via…</div>
                    <div style={{ fontSize: "11px", color: "#4a5c72" }}>iMessage, WhatsApp, Reddit…</div>
                  </div>
                </button>
              )}
              <button onClick={() => { setShowShareSheet(false); setShowImageModal(true); }} className="tap-target" style={{ height: "52px", display: "flex", alignItems: "center", gap: "14px", backgroundColor: "#101822", border: "1px solid #252b34", borderRadius: "12px", padding: "0 16px", cursor: "pointer", color: "#dce8f5", width: "100%" }}>
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

      {/* Send to Mechanic Modal */}
      {showMechanicModal && (
        <div onClick={() => setShowMechanicModal(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "560px", backgroundColor: "#0b1019", border: "1px solid #1e2329", borderRadius: "16px 16px 0 0", padding: "20px 16px", paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))", boxSizing: "border-box" }}>
            <div style={{ width: "32px", height: "4px", backgroundColor: "#1c2a3e", borderRadius: "2px", margin: "0 auto 16px" }} />
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#dce8f5", marginBottom: "14px" }}>Send to Your Mechanic</div>

            {/* Format tabs */}
            <div style={{ display: "flex", gap: "4px", backgroundColor: "#060810", borderRadius: "10px", padding: "3px", marginBottom: "14px" }}>
              {(["text", "email", "walkin"] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setMechanicFormat(fmt)}
                  style={{ flex: 1, height: "34px", fontSize: "13px", fontWeight: 600, border: "none", borderRadius: "8px", cursor: "pointer", backgroundColor: mechanicFormat === fmt ? "#101822" : "transparent", color: mechanicFormat === fmt ? "#dce8f5" : "#4a5c72", transition: "background-color 150ms" }}
                >
                  {fmt === "text" ? "Text" : fmt === "email" ? "Email" : "Walk-in"}
                </button>
              ))}
            </div>

            {/* Email subject line */}
            {mechanicFormat === "email" && (
              <div style={{ backgroundColor: "#060810", border: "1px solid #1e2329", borderRadius: "8px", padding: "8px 12px", marginBottom: "8px" }}>
                <span style={{ fontSize: "10px", fontWeight: 600, color: "#3a4d63", textTransform: "uppercase", letterSpacing: "0.08em" }}>Subject: </span>
                <span style={{ fontSize: "13px", color: "#7d8fa8" }}>Question about my {year} {make} {model}</span>
              </div>
            )}

            {/* Message body */}
            <div style={{ backgroundColor: "#101822", border: "1px solid #252b34", borderRadius: "10px", padding: "14px", marginBottom: "14px", maxHeight: "220px", overflowY: "auto" }}>
              <p style={{ margin: 0, fontSize: "14px", color: "#dce8f5", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{currentMechanicMessage()}</p>
            </div>

            <button onClick={copyMechanicMessage} className="tap-target" style={{ width: "100%", height: "48px", backgroundColor: mechanicCopied ? "#22c55e" : "#4a9eff", color: "white", fontWeight: 600, fontSize: "15px", border: "none", borderRadius: "8px", cursor: "pointer", transition: "background-color 200ms", marginBottom: "8px" }}>
              {mechanicCopied ? "✓ Copied!" : "Copy Message"}
            </button>

            {mechanicFormat === "email" && (
              <a
                href={`mailto:?subject=${encodeURIComponent(`Question about my ${year} ${make} ${model}`)}&body=${encodeURIComponent(currentMechanicMessage())}`}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "44px", backgroundColor: "#101822", border: "1px solid #252b34", borderRadius: "8px", color: "#7d8fa8", fontWeight: 500, fontSize: "14px", textDecoration: "none" }}
              >
                Open in Mail ↗
              </a>
            )}
            {mechanicFormat === "text" && (
              <a
                href={`sms:?body=${encodeURIComponent(currentMechanicMessage())}`}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "44px", backgroundColor: "#101822", border: "1px solid #252b34", borderRadius: "8px", color: "#7d8fa8", fontWeight: 500, fontSize: "14px", textDecoration: "none" }}
              >
                Open in Messages ↗
              </a>
            )}
          </div>
        </div>
      )}

      {/* Image Share Modal */}
      {showImageModal && (
        <div onClick={() => setShowImageModal(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.85)", zIndex: 50, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "390px" }}>
            <div ref={shareCardRef} style={{ backgroundColor: "#060810", borderRadius: "20px", padding: "28px 24px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "20px" }}>
                <Wrench size={14} color="#4a9eff" />
                <span style={{ fontFamily: "var(--font-barlow), sans-serif", fontSize: "14px", fontWeight: 700, color: "#4a9eff", letterSpacing: "0.12em" }}>TORQUE</span>
              </div>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "#dce8f5", marginBottom: "4px", lineHeight: 1.1 }}>{year} {make} {model}</div>
              <div style={{ fontSize: "13px", color: "#4a5c72", marginBottom: "20px", lineHeight: 1.4 }}>{issue.length > 72 ? issue.slice(0, 69) + "…" : issue}</div>
              <div style={{ padding: "12px 16px", borderRadius: "10px", marginBottom: "18px", backgroundColor: safetyConfig.bg, borderLeft: `4px solid ${safetyConfig.accent}` }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: safetyConfig.accent, textTransform: "uppercase", letterSpacing: "0.06em" }}>{safetyConfig.label}</span>
              </div>
              {topCause && (
                <div style={{ marginBottom: "18px" }}>
                  <div style={{ fontSize: "10px", color: "#3a4d63", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px", fontWeight: 600 }}>Most Likely Cause</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "#dce8f5" }}>{topCause.cause}</div>
                  {diagnosis.diagnosticSteps[0] && <div style={{ fontSize: "12px", color: "#4a5c72", marginTop: "3px" }}>→ {diagnosis.diagnosticSteps[0].action}</div>}
                </div>
              )}
              {topEst && (
                <div style={{ marginBottom: "22px" }}>
                  <div style={{ fontSize: "10px", color: "#3a4d63", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px", fontWeight: 600 }}>Estimated Repair</div>
                  <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "26px", fontWeight: 700, color: "#4a9eff" }}>{topEst.total}</div>
                  <div style={{ fontSize: "12px", color: "#4a5c72" }}>{topEst.fix}</div>
                </div>
              )}
              <div style={{ borderTop: "1px solid #172134", paddingTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: "#3a4d63" }}>AI diagnosis · verify with a mechanic</span>
                <span style={{ fontSize: "12px", color: "#4a9eff", fontWeight: 700 }}>torqueapp.co</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <button onClick={captureAndShare} disabled={isSharing} className="tap-target" style={{ flex: 1, height: "52px", backgroundColor: "#4a9eff", color: "white", fontWeight: 600, fontSize: "15px", border: "none", borderRadius: "10px", cursor: "pointer", opacity: isSharing ? 0.6 : 1 }}>
                {isSharing ? "Preparing…" : "↑ Share Image"}
              </button>
              <button onClick={() => setShowImageModal(false)} className="tap-target" style={{ height: "52px", padding: "0 20px", backgroundColor: "#101822", border: "1px solid #252b34", borderRadius: "10px", color: "#7d8fa8", fontSize: "14px", cursor: "pointer" }}>
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
    <div style={{ backgroundColor: "#0b1019", border: "1px solid #1e2329", borderRadius: "10px", padding: "14px 16px" }}>
      {children}
    </div>
  );
}
