"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Wrench, DollarSign, AlertTriangle, MessageCircle,
  Image as ImageIcon, MapPin, Star, AlertOctagon, Zap, ChevronDown,
  Clock, CheckCircle2, Loader2, X, Check, RefreshCw,
} from "lucide-react";
import { hapticImpact } from "@/lib/native";
import type { Diagnostic, ChatMessage, ClarifyQuestion } from "@/types/diagnostic";
import type { RankedCause, DiagnosticStep, CostEstimate, PartNeeded } from "@/types/diagnostic";
import { buildPartLinks } from "@/lib/partsMapping";
import { buildTextMessage, buildEmailMessage, buildWalkInScript, type MechanicMessageContext } from "@/lib/mechanicMessage";
import FeedbackCard from "@/components/FeedbackCard";
import RepairMode from "@/components/RepairMode";
import { useAuth } from "@/contexts/AuthContext";
import { track } from "@/lib/track";
import TorqueLogo from "@/components/TorqueLogo";

const APP_URL = typeof window !== "undefined" ? window.location.origin : "https://mchaniccarlos.com";

const cap = (s: string) => s.split(" ").map(w => w ? w[0].toUpperCase() + w.slice(1) : w).join(" ");

interface Props {
  diagnosis: Diagnostic;
  year: string;
  make: string;
  model: string;
  issue: string;
  mods?: string;
  hasTune?: boolean;
  zip?: string;
  hasAudio?: boolean;
  chatHistory: ChatMessage[];
  setChatHistory: (h: ChatMessage[]) => void;
  onNewDiagnosis: () => void;
  diagnosisId: string | null;
  onToast: (msg: string) => void;
}

const LIKELIHOOD_COLORS: Record<string, { bg: string; text: string }> = {
  "Most Likely": { bg: "rgba(74,158,255,0.14)", text: "var(--accent)" },
  "Likely": { bg: "rgba(99,102,241,0.14)", text: "#818cf8" },
  "Possible": { bg: "rgba(107,114,128,0.18)", text: "var(--text-2)" },
  "Unlikely but serious": { bg: "rgba(245,158,11,0.14)", text: "var(--amber)" },
};

const ACCENT_BORDERS: Record<string, string> = {
  "Most Likely": "var(--accent)",
  "Likely": "var(--border)",
  "Possible": "var(--border)",
  "Unlikely but serious": "var(--amber)",
};

// ── Expandable CSS grid animation ──
function Expandable({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr", transition: "grid-template-rows 220ms ease-in-out" }}>
      <div style={{ overflow: "hidden" }}>{children}</div>
    </div>
  );
}

// ── Step pills (cost / time / tools) ──
function StepPills({ cost, time, tools }: { cost?: string; time?: string; tools?: string }) {
  type Pill = { icon: React.ReactNode; text: string };
  const pills: Pill[] = [];
  if (cost) pills.push({ icon: <DollarSign size={10} />, text: cost });
  if (time) pills.push({ icon: <Clock size={10} />, text: time });
  if (tools && tools !== "None" && tools !== "none") pills.push({ icon: <Wrench size={10} />, text: tools });
  if (!pills.length) return null;
  return (
    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
      {pills.map((p, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "3px", backgroundColor: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "20px", padding: "3px 9px", fontSize: "11px", color: "var(--text-2)" }}>
          {p.icon} {p.text}
        </span>
      ))}
    </div>
  );
}

// ── Answer Card ──
function AnswerCard({ topCause, firstStep, topEst, hasAudio, eli5Mode, eli5Text, eli5Loading, onEli5, onStartRepair }: {
  topCause: RankedCause;
  firstStep: DiagnosticStep;
  topEst?: CostEstimate;
  hasAudio?: boolean;
  eli5Mode: boolean;
  eli5Text: string | null;
  eli5Loading: boolean;
  onEli5: () => void;
  onStartRepair: () => void;
}) {
  const lhColor = LIKELIHOOD_COLORS[topCause.likelihood] ?? { bg: "rgba(107,114,128,0.18)", text: "var(--text-2)" };
  return (
    <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderLeft: "3px solid var(--accent)", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Most likely */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "5px" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>Most likely</div>
          {hasAudio && <span style={{ fontSize: "10px", color: "var(--accent)", backgroundColor: "rgba(74,158,255,0.08)", border: "1px solid rgba(74,158,255,0.2)", borderRadius: "20px", padding: "2px 8px" }}>🎙️ Audio analyzed</span>}
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
          <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)", lineHeight: 1.2, flex: 1 }}>{topCause.cause}</span>
          <div style={{ display: "flex", gap: "5px", flexShrink: 0, marginTop: "2px" }}>
            {topCause.modRelated && (
              <span style={{ backgroundColor: "rgba(251,191,36,0.15)", color: "var(--amber)", fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "4px" }}>MOD</span>
            )}
            {topCause.confidence !== undefined && (
              <span style={{ backgroundColor: "rgba(74,158,255,0.12)", border: "1px solid rgba(74,158,255,0.3)", color: "var(--accent)", fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", whiteSpace: "nowrap" as const, fontFamily: "var(--font-jetbrains), monospace" }}>{topCause.confidence}%</span>
            )}
            <span style={{ backgroundColor: lhColor.bg, color: lhColor.text, fontSize: "11px", fontWeight: 500, padding: "2px 8px", borderRadius: "20px", whiteSpace: "nowrap" as const }}>{topCause.likelihood}</span>
          </div>
        </div>
        {topCause.evidence && (
          <p style={{ margin: "5px 0 0", fontSize: "12px", color: "var(--text-3)", lineHeight: 1.4, fontStyle: "italic" }}>{topCause.evidence}</p>
        )}
        {eli5Mode && eli5Text && (
          <div style={{ backgroundColor: "rgba(74,158,255,0.06)", border: "1px solid rgba(74,158,255,0.15)", borderRadius: "8px", padding: "10px 12px", marginTop: "10px" }}>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-2)", lineHeight: 1.6 }}>{eli5Text}</p>
          </div>
        )}
      </div>

      <div style={{ height: "1px", backgroundColor: "var(--border)" }} />

      {/* First step */}
      <div>
        <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: "6px" }}>Do this first</div>
        <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", lineHeight: 1.4 }}>{firstStep.action}</div>
        <StepPills cost={firstStep.cost} time={firstStep.time} tools={firstStep.tools} />
      </div>

      {/* Branch logic */}
      <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
          <CheckCircle2 size={13} color="#22c55e" style={{ flexShrink: 0, marginTop: "2px" }} />
          <span style={{ fontSize: "13px", color: "var(--text-2)", lineHeight: 1.4 }}>{firstStep.ifResultA}</span>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
          <AlertTriangle size={13} color="#f59e0b" style={{ flexShrink: 0, marginTop: "2px" }} />
          <span style={{ fontSize: "13px", color: "var(--text-2)", lineHeight: 1.4 }}>{firstStep.ifResultB}</span>
        </div>
      </div>

      {/* Guided repair launcher */}
      <button
        onClick={onStartRepair}
        className="tap-target"
        style={{ width: "100%", height: "48px", backgroundColor: "rgba(74,158,255,0.1)", border: "1px solid rgba(74,158,255,0.35)", borderRadius: "10px", color: "var(--accent)", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
      >
        <Wrench size={15} aria-hidden="true" />
        Fix it with Carlos — guided steps
      </button>

      {/* Cost estimate */}
      {topEst && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
          <span style={{ fontSize: "13px", color: "var(--text-3)" }}>Est. if {topCause.cause}:</span>
          <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "16px", fontWeight: 700, color: "var(--accent)" }}>{topEst.total}</span>
        </div>
      )}

      {/* ELI5 toggle */}
      <button
        onClick={onEli5}
        disabled={eli5Loading}
        className="tap-target"
        style={{ width: "100%", height: "34px", backgroundColor: "transparent", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-3)", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
      >
        <RefreshCw size={12} aria-hidden="true" />
        {eli5Loading ? "Simplifying…" : eli5Mode ? "Regular explanation" : "Simpler explanation"}
      </button>
    </div>
  );
}

// ── Safety verdict card ──
function SafetyCard({ verdict, reason }: { verdict: "STOP" | "CAUTION" | "OKAY"; reason: string }) {
  if (verdict === "OKAY") {
    return (
      <div style={{ position: "relative", backgroundColor: "transparent", border: "1px solid var(--border)", borderLeft: "3px solid var(--green)", borderRadius: "10px", padding: "10px 84px 10px 14px", display: "flex", alignItems: "center", gap: "10px", overflow: "hidden", minHeight: "56px" }}>
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--green)", flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "11px", fontWeight: 700, color: "var(--green)", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>OKAY TO DRIVE</span>
          <span style={{ fontSize: "13px", color: "var(--text-3)", marginLeft: "8px" }}>{reason}</span>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/carlos/carlos-thumbsup.webp" alt="" aria-hidden="true" style={{ position: "absolute", right: "8px", bottom: "0", height: "72px", width: "auto", filter: "drop-shadow(0 4px 12px rgba(34,197,94,0.3))" }} />
      </div>
    );
  }
  const cfg = verdict === "STOP"
    ? { bg: "var(--red-bg)", border: "#2d0f0f", accent: "var(--red)", label: "STOP DRIVING", reasonColor: "var(--red)", pulseClass: "badge-pulse-stop", img: "/carlos/carlos-warning.webp", glow: "rgba(239,68,68,0.3)" }
    : { bg: "var(--amber-bg)", border: "#2d2200", accent: "var(--amber)", label: "DRIVE WITH CAUTION", reasonColor: "var(--amber)", pulseClass: "badge-pulse-caution", img: "/carlos/carlos-thinking.webp", glow: "rgba(245,158,11,0.3)" };
  return (
    <div style={{ position: "relative", backgroundColor: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: "12px", overflow: "hidden" }}>
      <div style={{ borderBottom: `1px solid ${cfg.border}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: cfg.accent, boxShadow: `0 0 8px ${cfg.accent}`, flexShrink: 0 }} className={cfg.pulseClass} />
        <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontWeight: 700, fontSize: "12px", letterSpacing: "0.12em", color: cfg.accent, textTransform: "uppercase" as const }}>{cfg.label}</span>
      </div>
      <div style={{ padding: "12px 84px 12px 16px", minHeight: "56px" }}>
        <p style={{ margin: 0, fontSize: "13px", color: cfg.reasonColor, lineHeight: 1.6 }}>{reason}</p>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={cfg.img} alt="" aria-hidden="true" style={{ position: "absolute", right: "8px", bottom: "0", height: "72px", width: "auto", filter: `drop-shadow(0 4px 12px ${cfg.glow})` }} />
    </div>
  );
}

// ── Section header ──
function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ width: "2px", height: "11px", borderRadius: "2px", backgroundColor: "var(--accent)" }} />
      {label}
      <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }} />
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "14px 16px", width: "100%", boxSizing: "border-box" as const, ...style }}>
      {children}
    </div>
  );
}

// ── Main component ──
export default function DiagnosticReport({
  diagnosis, year, make, model, issue, mods, zip, hasAudio, chatHistory, setChatHistory, onNewDiagnosis, diagnosisId, onToast,
}: Props) {
  // Refined diagnosis state — updates in place when user answers clarifying questions
  const [currentDiagnosis, setCurrentDiagnosis] = useState<Diagnostic>(diagnosis);
  const [showFullDiagnosis, setShowFullDiagnosis] = useState(false);
  const [isRefined, setIsRefined] = useState(false);

  // Clarifying questions
  const [showQuestionsSheet, setShowQuestionsSheet] = useState(false);
  const [questions, setQuestions] = useState<ClarifyQuestion[] | null>(null);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string[]>>({});
  const [refining, setRefining] = useState(false);

  // Steps accordion (for full diagnosis section)
  const [expandedStep, setExpandedStep] = useState<number | null>(0);
  const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set());
  // Causes progressive disclosure
  const [expandedCauseIdx, setExpandedCauseIdx] = useState<number | null>(null);
  // ELI5 mode
  const [eli5Mode, setEli5Mode] = useState(false);
  const [eli5Text, setEli5Text] = useState<string | null>(null);
  const [eli5Loading, setEli5Loading] = useState(false);

  // Chat
  const [chatExpanded, setChatExpanded] = useState(false);
  const [repairMode, setRepairMode] = useState(false);
  const { user: authUser } = useAuth();
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Mechanic modal
  const [showMechanicModal, setShowMechanicModal] = useState(false);
  const [mechanicCopied, setMechanicCopied] = useState(false);
  const [mechanicFormat, setMechanicFormat] = useState<"text" | "email" | "walkin">("text");
  // Carlos-written version — fetched when the modal first opens; the template
  // renders instantly and gets replaced when this lands.
  const [aiMechanicMsg, setAiMechanicMsg] = useState<{ sms: string; emailSubject?: string; emailBody: string; walkIn: string } | null>(null);
  const aiMechanicRequested = useRef(false);

  // Share
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shops, setShops] = useState<{ name: string; rating?: number; reviewCount?: number; address?: string; mapsUrl: string }[]>([]);
  const [shopsLoaded, setShopsLoaded] = useState(false);

  const shareCardRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const topCause = currentDiagnosis.rankedCauses[0];
  const topEst = currentDiagnosis.costEstimates[0];
  const firstStep = currentDiagnosis.diagnosticSteps[0];
  const verdict = currentDiagnosis.driveSafety.verdict;

  const mechanicCtx: MechanicMessageContext = {
    issue,
    year,
    make: cap(make),
    model: cap(model),
    topCause: topCause?.cause ?? "the issue",
    firstStep: currentDiagnosis.diagnosticSteps[0]?.action ?? "a diagnostic check",
    costRange: topEst?.total ?? "varies",
  };

  const quickReplies = [
    "Is this safe to drive?",
    "Can I fix this myself?",
    "What parts do I need?",
    "How urgent is this?",
  ];

  useEffect(() => {
    if (zip && !shopsLoaded) {
      // One-shot fetch guard for an external API; nothing to subscribe to.
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

  useEffect(() => {
    if (showShareSheet && !shareToken && !shareLoading) {
      generateShare();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showShareSheet]);

  // ── Clarifying questions ──
  async function handleOpenQuestions() {
    setShowQuestionsSheet(true);
    if (questions !== null) return;
    setQuestionsLoading(true);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, make, model, issue, topCause: topCause?.cause }),
      });
      const data = await res.json();
      if (data.questions) setQuestions(data.questions);
    } catch { /* ignore */ } finally {
      setQuestionsLoading(false);
    }
  }

  function toggleAnswer(qIdx: number, option: string) {
    setSelectedAnswers(prev => {
      const cur = prev[qIdx] ?? [];
      return { ...prev, [qIdx]: cur.includes(option) ? cur.filter(o => o !== option) : [...cur, option] };
    });
  }

  async function handleRefine() {
    setShowQuestionsSheet(false);
    setRefining(true);
    const lines = questions
      ?.map((q, i) => selectedAnswers[i]?.length ? `- "${q.question}": ${selectedAnswers[i].join(", ")}` : null)
      .filter(Boolean).join("\n");
    if (!lines) { setRefining(false); return; }
    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, make, model, issue, mods, zip, refinementAnswers: lines }),
      });
      const data = await res.json();
      if (data.diagnosis) {
        setCurrentDiagnosis(data.diagnosis);
        setIsRefined(true);
        setSelectedAnswers({});
        setQuestions(null);
      }
    } catch { /* ignore */ } finally {
      setRefining(false);
    }
  }

  const hasAnswers = Object.values(selectedAnswers).some(a => a.length > 0);

  async function handleEli5() {
    if (eli5Text) { setEli5Mode(v => !v); return; }
    setEli5Loading(true);
    try {
      const res = await fetch("/api/simplify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsWrong: currentDiagnosis.whatsWrong, causeTitle: topCause?.cause, causeReasoning: topCause?.reasoning }),
      });
      const data = await res.json();
      if (data.simpleExplanation) { setEli5Text(data.simpleExplanation); setEli5Mode(true); }
    } catch { /* ignore */ } finally {
      setEli5Loading(false);
    }
  }

  // ── Share ──
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
      console.error("[share] API error:", data.error);
    } catch (err) {
      console.error("[share] Fetch error:", err);
    } finally {
      setShareLoading(false);
    }
    return null;
  }

  async function copyShareLink() {
    const token = await generateShare();
    if (!token) { onToast("Failed to create share link"); return; }
    await navigator.clipboard.writeText(`${APP_URL}/r/${token}`);
    setShareCopied(true);
    onToast("Link copied!");
    setTimeout(() => setShareCopied(false), 2500);
  }

  async function shareViaSystem() {
    const token = await generateShare();
    if (!token) return;
    const url = `${APP_URL}/r/${token}`;
    try {
      await navigator.share({ title: `${year} ${cap(make)} ${cap(model)} Diagnosis`, text: `I diagnosed my ${year} ${cap(make)} ${cap(model)} with Carlos`, url });
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
            setShowImageModal(false); setShowShareSheet(false); return;
          }
        } catch { /* fall through */ }
      }
      const link = document.createElement("a");
      link.download = "torque-diagnosis.png";
      link.href = dataUrl;
      link.click();
      setShowImageModal(false); setShowShareSheet(false);
    } catch (err) {
      console.error("Share failed:", err);
    } finally {
      setIsSharing(false);
    }
  }

  // ── Mechanic ──
  function currentMechanicMessage(): string {
    if (aiMechanicMsg) {
      if (mechanicFormat === "email") return aiMechanicMsg.emailBody;
      if (mechanicFormat === "walkin") return aiMechanicMsg.walkIn;
      return aiMechanicMsg.sms;
    }
    if (mechanicFormat === "email") return buildEmailMessage(mechanicCtx).body;
    if (mechanicFormat === "walkin") return buildWalkInScript(mechanicCtx);
    return buildTextMessage(mechanicCtx);
  }

  function openMechanicModal() {
    setShowMechanicModal(true);
    if (aiMechanicRequested.current) return;
    aiMechanicRequested.current = true;
    fetch("/api/mechanic-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, make: cap(make), model: cap(model), issue, topCause: mechanicCtx.topCause, firstStep: mechanicCtx.firstStep, costRange: mechanicCtx.costRange }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.message?.sms) setAiMechanicMsg(d.message); })
      .catch(() => { /* template fallback already on screen */ });
  }

  async function copyMechanicMessage() {
    await navigator.clipboard.writeText(currentMechanicMessage());
    setMechanicCopied(true);
    onToast("Copied to clipboard");
    setTimeout(() => setMechanicCopied(false), 2000);
  }

  // ── Chat ──
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
        body: JSON.stringify({ year, make, model, diagnosis: currentDiagnosis, conversationHistory: updatedHistory, message: userText }),
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
  }, [chatInput, chatLoading, chatHistory, year, make, model, currentDiagnosis, setChatHistory]);

  return (
    <div className="result-enter" style={{ minHeight: "100dvh", backgroundColor: "var(--bg)", overflowX: "hidden" }}>

      {/* Sticky header */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, height: "52px", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "var(--header-bg)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)", boxSizing: "border-box" }}>
        <TorqueLogo markSize={28} showWordmark wordmarkSize={14} glow="soft" />
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "var(--text-3)" }}>{year} {cap(make)} {cap(model)}</span>
          <button onClick={() => setShowShareSheet(true)} style={{ fontSize: "12px", fontWeight: 500, padding: "5px 10px", borderRadius: "20px", border: "1px solid rgba(74,158,255,0.35)", color: "var(--accent)", backgroundColor: "rgba(74,158,255,0.1)", cursor: "pointer" }}>
            ↑ Share
          </button>
          <button onClick={onNewDiagnosis} className="tap-target" style={{ fontSize: "12px", fontWeight: 500, padding: "5px 12px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.15)", color: "var(--text)", backgroundColor: "transparent", cursor: "pointer" }}>
            ← Back
          </button>
        </div>
      </div>

      {/* Refining banner */}
      {refining && (
        <div style={{ position: "sticky", top: "52px", zIndex: 9, backgroundColor: "rgba(74,158,255,0.12)", borderBottom: "1px solid rgba(74,158,255,0.25)", padding: "8px 16px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--accent)" }}>
          <Loader2 size={13} style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />
          Refining diagnosis based on your answers…
        </div>
      )}

      <div role="region" aria-label="Diagnosis result" style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "10px", width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>

        {/* 1. Safety verdict */}
        <SafetyCard verdict={verdict} reason={currentDiagnosis.driveSafety.reason} />

        {/* 2. Mod note */}
        {currentDiagnosis.modNote && (
          <div style={{ backgroundColor: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "10px", padding: "10px 14px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <Zap size={14} color="var(--amber)" style={{ flexShrink: 0, marginTop: "1px" }} />
            <div>
              <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "10px", fontWeight: 700, color: "var(--amber)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "3px" }}>Mod Note</div>
              <div style={{ fontSize: "13px", color: "#fde68a", lineHeight: 1.6 }}>{currentDiagnosis.modNote}</div>
            </div>
          </div>
        )}

        {/* AI disclaimer — required on every diagnosis result */}
        <p style={{ margin: 0, fontSize: "12px", color: "var(--text-2)", lineHeight: 1.55, padding: "10px 14px", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px" }}>
          Carlos provides AI-generated estimates for informational purposes only. Always consult a qualified mechanic before making repair decisions.
        </p>

        {/* Refined pill */}
        {isRefined && (
          <div style={{ display: "inline-flex", alignSelf: "flex-start", alignItems: "center", gap: "5px", backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "20px", padding: "4px 12px", fontSize: "11px", color: "var(--green)", fontWeight: 600 }}>
            ✓ Refined based on your answers
          </div>
        )}

        {/* 3. Answer Card */}
        {topCause && firstStep && (
          <AnswerCard topCause={topCause} firstStep={firstStep} topEst={topEst} hasAudio={hasAudio} eli5Mode={eli5Mode} eli5Text={eli5Text} eli5Loading={eli5Loading} onEli5={handleEli5} onStartRepair={() => setRepairMode(true)} />
        )}

        {/* 4. First warning (if any) */}
        {currentDiagnosis.dontDoThis[0] && (
          <div style={{ backgroundColor: "var(--amber-bg)", border: "1px solid #2d2200", borderLeft: "3px solid var(--amber)", borderRadius: "10px", padding: "10px 14px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <AlertTriangle size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: "1px" }} />
            <span style={{ fontSize: "13px", color: "var(--amber)", lineHeight: 1.4 }}>{currentDiagnosis.dontDoThis[0]}</span>
          </div>
        )}

        {/* 5. Two action buttons */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => setShowFullDiagnosis(v => !v)}
            className="tap-target"
            style={{ flex: 1, height: "44px", backgroundColor: showFullDiagnosis ? "var(--surface)" : "var(--accent)", border: showFullDiagnosis ? "1px solid var(--border)" : "none", borderRadius: "10px", color: showFullDiagnosis ? "var(--text-2)" : "white", fontWeight: 700, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", boxShadow: showFullDiagnosis ? "none" : "0 4px 14px rgba(59,130,246,0.35)" }}
          >
            <ChevronDown size={14} style={{ transform: showFullDiagnosis ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms" }} />
            {showFullDiagnosis ? "Hide diagnosis" : "See full diagnosis"}
          </button>
          <button
            onClick={handleOpenQuestions}
            className="tap-target"
            style={{ flex: 1, height: "44px", backgroundColor: "rgba(74,158,255,0.08)", border: "1px solid rgba(74,158,255,0.3)", borderRadius: "10px", color: "var(--accent)", fontWeight: 600, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
          >
            <MessageCircle size={14} />
            {isRefined ? "Refine again" : "Answer a few questions"}
          </button>
        </div>

        {/* 6. Full diagnosis expansion */}
        <Expandable open={showFullDiagnosis}>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingTop: "2px" }}>

            {/* What's going on */}
            <Card>
              <SectionHeader label="What's Going On" />
              <p style={{ margin: 0, fontSize: "14px", color: "var(--text-2)", lineHeight: 1.7 }}>{currentDiagnosis.whatsWrong}</p>
            </Card>

            {/* All causes — progressive disclosure */}
            <Card>
              <SectionHeader label="Likely Causes" />
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {currentDiagnosis.rankedCauses.map((cause, causeIdx) => {
                  const colors = LIKELIHOOD_COLORS[cause.likelihood] ?? { bg: "rgba(107,114,128,0.18)", text: "var(--text-2)" };
                  const accentColor = ACCENT_BORDERS[cause.likelihood] ?? "var(--border-muted)";
                  const isOpen = expandedCauseIdx === causeIdx;
                  return (
                    <div key={cause.rank} style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border)", borderLeft: `3px solid ${accentColor}`, borderRadius: "8px", overflow: "hidden" }}>
                      <button
                        onClick={() => setExpandedCauseIdx(isOpen ? null : causeIdx)}
                        style={{ width: "100%", padding: "12px", display: "flex", flexDirection: "column" as const, gap: "6px", backgroundColor: "transparent", border: "none", cursor: "pointer", textAlign: "left" as const }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", width: "100%" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
                            <span style={{ width: "22px", height: "22px", borderRadius: "6px", backgroundColor: "rgba(74,158,255,0.15)", border: "1px solid rgba(74,158,255,0.3)", color: "var(--accent)", fontFamily: "var(--font-jetbrains), monospace", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{cause.rank}</span>
                            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, flex: 1 }}>{cause.cause}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
                            {cause.modRelated && <span style={{ backgroundColor: "rgba(251,191,36,0.15)", color: "var(--amber)", fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "4px" }}>MOD</span>}
                            <span style={{ backgroundColor: colors.bg, color: colors.text, fontSize: "11px", fontWeight: 500, padding: "2px 8px", borderRadius: "20px", whiteSpace: "nowrap" as const }}>{cause.likelihood}</span>
                            <ChevronDown size={13} color="#4a5c72" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms", flexShrink: 0 }} />
                          </div>
                        </div>
                        {cause.confidence !== undefined && (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingLeft: "30px" }}>
                            <div style={{ flex: 1, height: "3px", backgroundColor: "var(--border)", borderRadius: "2px", overflow: "hidden" }}>
                              <div style={{ width: `${cause.confidence}%`, height: "100%", backgroundColor: accentColor === "var(--border-muted)" ? "var(--text-3)" : accentColor, borderRadius: "2px" }} />
                            </div>
                            <span style={{ fontSize: "10px", color: accentColor === "var(--border-muted)" ? "var(--text-3)" : accentColor, fontFamily: "var(--font-jetbrains), monospace", fontWeight: 700, flexShrink: 0 }}>{cause.confidence}%</span>
                          </div>
                        )}
                      </button>
                      {isOpen && (
                        <div style={{ padding: "0 12px 12px 42px", borderTop: "1px solid var(--border)" }}>
                          <p style={{ margin: "10px 0 0", fontSize: "13px", color: "#6a7e96", lineHeight: 1.6, wordBreak: "break-word" as const }}>{cause.reasoning}</p>
                          {cause.confidenceBooster && (
                            <div style={{ marginTop: "8px", display: "flex", gap: "6px", alignItems: "flex-start" }}>
                              <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--accent)", flexShrink: 0, marginTop: "1px", letterSpacing: "0.06em" }}>CONFIRM →</span>
                              <span style={{ fontSize: "12px", color: "var(--accent)", lineHeight: 1.4 }}>{cause.confidenceBooster}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* All diagnostic steps */}
            <Card>
              <SectionHeader label="Check This First" />
              <div>
                {currentDiagnosis.diagnosticSteps.map((step, idx) => {
                  const isLast = idx === currentDiagnosis.diagnosticSteps.length - 1;
                  const isOpen = expandedStep === step.step - 1;
                  const isDone = doneSteps.has(step.step);
                  return (
                    <div key={step.step} style={{ display: "flex", gap: "12px" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: "14px" }}>
                        <button
                          onClick={() => {
                            setDoneSteps((prev) => {
                              const next = new Set(prev);
                              if (next.has(step.step)) next.delete(step.step);
                              else { next.add(step.step); hapticImpact("light"); }
                              return next;
                            });
                          }}
                          aria-pressed={isDone}
                          aria-label={`Mark step ${step.step} ${isDone ? "not done" : "done"}: ${step.action}`}
                          style={{ width: "26px", height: "26px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0, cursor: "pointer", padding: 0, backgroundColor: isDone ? "var(--green)" : isOpen ? "var(--accent)" : "var(--surface-2)", border: `1px solid ${isDone ? "var(--green)" : isOpen ? "var(--accent)" : "var(--border)"}`, color: isDone || isOpen ? "white" : "var(--text-3)", transition: "background-color 160ms ease, border-color 160ms ease" }}
                        >
                          {isDone ? <Check size={14} className="check-pop" aria-hidden="true" /> : step.step}
                        </button>
                        {!isLast && <div style={{ width: "1px", flex: 1, minHeight: "12px", backgroundColor: isDone ? "rgba(34,197,94,0.4)" : "var(--border)", marginTop: "4px" }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0, paddingBottom: isLast ? "0" : "16px" }}>
                        <button onClick={() => setExpandedStep(isOpen ? null : step.step - 1)} aria-expanded={isOpen} style={{ width: "100%", minHeight: "48px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", backgroundColor: "transparent", border: "none", cursor: "pointer", padding: "0", textAlign: "left" }}>
                          <span style={{ fontSize: "15px", fontWeight: 600, color: isDone ? "var(--text-3)" : "var(--text)", textDecoration: isDone ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{step.action}</span>
                          <span style={{ color: "var(--text-3)", fontSize: "10px", flexShrink: 0 }} aria-hidden="true">{isOpen ? "▲" : "▼"}</span>
                        </button>
                        <Expandable open={isOpen}>
                          <div style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px", display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
                            <p style={{ margin: 0, fontSize: "13px", fontStyle: "italic", color: "var(--text-2)", lineHeight: 1.5 }}>{step.why}</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                              <div style={{ backgroundColor: "#0a1a0f", border: "1px solid #1e3a28", borderRadius: "8px", padding: "10px 12px", boxSizing: "border-box" }}>
                                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--green)", marginBottom: "4px" }}>If it passes / looks good</div>
                                <div style={{ fontSize: "13px", color: "var(--text-2)", lineHeight: 1.5 }}>{step.ifResultA}</div>
                              </div>
                              <div style={{ backgroundColor: "#1a1200", border: "1px solid #3a2a00", borderRadius: "8px", padding: "10px 12px", boxSizing: "border-box" }}>
                                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--amber)", marginBottom: "4px" }}>If it fails / looks bad</div>
                                <div style={{ fontSize: "13px", color: "var(--text-2)", lineHeight: 1.5 }}>{step.ifResultB}</div>
                              </div>
                            </div>
                            <StepPills cost={step.cost} time={step.time} tools={step.tools} />
                          </div>
                        </Expandable>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Prevention tips — Part 9 */}
            {currentDiagnosis.preventionTips && currentDiagnosis.preventionTips.length > 0 && (
              <div style={{ backgroundColor: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: "10px", padding: "14px 16px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--green)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: "10px" }}>
                  🛡️ Prevent this next time
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" }}>
                  {currentDiagnosis.preventionTips.map((tip, i) => (
                    <li key={i} style={{ display: "flex", gap: "8px", fontSize: "13px", color: "var(--text-2)", lineHeight: 1.5 }}>
                      <span style={{ color: "var(--green)", flexShrink: 0 }}>›</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Cost estimates */}
            <Card>
              <SectionHeader label="Cost Estimates" />
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {currentDiagnosis.costEstimates.map((est, i) => (
                  <div key={i} style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px", boxSizing: "border-box" }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", marginBottom: "8px", wordBreak: "break-word" }}>{est.fix}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "flex", gap: "12px" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "9px", color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "3px", fontWeight: 600 }}>Parts</div>
                          <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "12px", color: "var(--text-2)", wordBreak: "break-word" }}>{est.parts}</div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "9px", color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "3px", fontWeight: 600 }}>Labor</div>
                          <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "12px", color: "var(--text-2)", wordBreak: "break-word" }}>{est.labor}</div>
                        </div>
                      </div>
                      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ fontSize: "9px", color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>Total</div>
                        <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "16px", color: "var(--accent)", fontWeight: 700, whiteSpace: "nowrap" }}>{est.total}</div>
                      </div>
                    </div>
                    {est.note && <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--text-3)", fontStyle: "italic", wordBreak: "break-word" }}>{est.note}</div>}
                  </div>
                ))}
              </div>
            </Card>

            {/* Parts finder — OEM part numbers */}
            {currentDiagnosis.partsNeeded && currentDiagnosis.partsNeeded.length > 0 && (
              <Card>
                <SectionHeader label="Parts You May Need" />
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {currentDiagnosis.partsNeeded.map((part: PartNeeded, i: number) => {
                    const links = buildPartLinks(part, year, make, model);
                    return (
                      <div key={i} style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px", boxSizing: "border-box" }}>
                        {/* Part name + qty + cost */}
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "10px" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", lineHeight: 1.3 }}>{part.partName}</div>
                            {part.qty > 1 && <div style={{ fontSize: "11px", color: "var(--text-3)", marginTop: "2px" }}>Qty: {part.qty}</div>}
                            {part.engineNote && <div style={{ fontSize: "11px", color: "var(--text-3)", marginTop: "2px", fontStyle: "italic" }}>{part.engineNote}</div>}
                          </div>
                          <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "14px", fontWeight: 700, color: "var(--accent)", flexShrink: 0 }}>{part.estimatedPartCost}</div>
                        </div>

                        {/* Part numbers */}
                        <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                          <div style={{ flex: 1, backgroundColor: "var(--bg)", border: "1px solid var(--border)", borderRadius: "6px", padding: "7px 10px" }}>
                            <div style={{ fontSize: "9px", fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "3px" }}>OEM {part.oemBrand ? `· ${part.oemBrand}` : ""}</div>
                            {part.oemPartNumber ? (
                              <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "13px", color: "var(--accent)", fontWeight: 600 }}>{part.oemPartNumber}</div>
                            ) : (
                              <div style={{ fontSize: "12px", color: "var(--text-3)", fontStyle: "italic" }}>Verify fitment</div>
                            )}
                          </div>
                          <div style={{ flex: 1, backgroundColor: "var(--bg)", border: "1px solid var(--border)", borderRadius: "6px", padding: "7px 10px" }}>
                            <div style={{ fontSize: "9px", fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "3px" }}>Aftermarket {part.alternateBrand ? `· ${part.alternateBrand}` : ""}</div>
                            {part.alternatePartNumber ? (
                              <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "13px", color: "var(--text-2)", fontWeight: 600 }}>{part.alternatePartNumber}</div>
                            ) : (
                              <div style={{ fontSize: "12px", color: "var(--text-3)", fontStyle: "italic" }}>Verify fitment</div>
                            )}
                          </div>
                        </div>

                        {/* Buying note */}
                        {part.notes && (
                          <div style={{ fontSize: "12px", color: "var(--text-3)", fontStyle: "italic", marginBottom: "8px", lineHeight: 1.4 }}>{part.notes}</div>
                        )}

                        {/* Retailer links */}
                        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px" }}>
                          {links.map(link => (
                            <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", height: "28px", padding: "0 10px", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", fontSize: "11px", color: "var(--text-2)", textDecoration: "none", whiteSpace: "nowrap" as const }}>
                              {link.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  <p style={{ margin: 0, fontSize: "11px", color: "var(--text-4)", lineHeight: 1.4 }}>Part numbers are AI-generated — always verify fitment for your exact vehicle before purchasing.</p>
                </div>
              </Card>
            )}

            {/* All warnings */}
            {currentDiagnosis.dontDoThis.length > 0 && (
              <div style={{ backgroundColor: "#150a0a", border: "1px solid #2a1515", borderRadius: "10px", padding: "14px 16px", boxSizing: "border-box" }}>
                <SectionHeader label="Don't Do This" />
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {currentDiagnosis.dontDoThis.map((warning, i) => (
                    <li key={i} style={{ display: "flex", gap: "8px", lineHeight: 1.4 }}>
                      <span style={{ color: "var(--amber)", fontWeight: 700, flexShrink: 0, fontSize: "14px" }}>›</span>
                      <span style={{ fontSize: "13px", color: "var(--text)", lineHeight: 1.4, wordBreak: "break-word" }}>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Mechanic escalation */}
            {currentDiagnosis.mechanicEscalation.needed && (
              <div style={{ backgroundColor: "var(--red-bg)", border: "1px solid #2d0f0f", borderRadius: "10px", padding: "12px 14px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <AlertOctagon size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: "1px" }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--red)", marginBottom: "2px" }}>Professional Help Required</div>
                  <div style={{ fontSize: "13px", color: "var(--text-2)", lineHeight: 1.5 }}>{currentDiagnosis.mechanicEscalation.reason}</div>
                </div>
              </div>
            )}

            {/* Shops near you */}
            {shops.length > 0 && (
              <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "14px 16px", boxSizing: "border-box" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <MapPin size={12} color="#4a5c72" />
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Shops Near You</span>
                </div>
                <p style={{ margin: "0 0 12px", fontSize: "12px", color: "var(--text-4)", fontStyle: "italic" }}>
                  Independent shops typically charge 30–40% less than dealers for this repair.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {shops.map((shop, i) => (
                    <a key={i} href={shop.mapsUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", backgroundColor: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", boxSizing: "border-box" }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shop.name}</div>
                        {shop.address && <div style={{ fontSize: "11px", color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shop.address}</div>}
                      </div>
                      {shop.rating && (
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0, marginLeft: "8px" }}>
                          <Star size={12} color="#f59e0b" fill="#f59e0b" />
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--amber)" }}>{shop.rating}</span>
                          {shop.reviewCount && <span style={{ fontSize: "11px", color: "var(--text-3)" }}>({shop.reviewCount})</span>}
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Outcome tracking */}
            {!authUser && <EmailReportCard vehicle={`${year} ${cap(make)} ${cap(model)}`} />}

            <FeedbackCard
              diagnosisId={diagnosisId}
              year={year}
              make={make}
              model={model}
              repairLabel={topCause?.cause}
              onRepairSaved={(entry) => {
                try {
                  const existing = JSON.parse(localStorage.getItem("torque_repairs") || "[]");
                  localStorage.setItem("torque_repairs", JSON.stringify([entry, ...existing]));
                } catch { /* ignore */ }
              }}
            />

            {/* Send to Mechanic */}
            <Card>
              <SectionHeader label="Send to My Mechanic" />
              <p style={{ margin: "0 0 12px", fontSize: "13px", color: "var(--text-2)", lineHeight: 1.5 }}>
                Walk in prepared. Copy this before your appointment.
              </p>
              <button
                onClick={openMechanicModal}
                className="tap-target"
                style={{ width: "100%", height: "44px", backgroundColor: "var(--surface-2)", border: "1px solid var(--border-muted)", borderRadius: "8px", color: "var(--text)", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}
              >
                Generate Message
              </button>
            </Card>


          </div>
        </Expandable>

        {/* Chat — always visible */}
        <Card>
          <SectionHeader label="Ask a Follow-Up" />
          {!chatExpanded ? (
            <div
              onClick={() => setChatExpanded(true)}
              style={{ display: "flex", alignItems: "center", gap: "10px", height: "44px", padding: "0 12px", backgroundColor: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "8px", cursor: "text" }}
            >
              <span style={{ fontSize: "14px", color: "var(--text-4)", flex: 1 }}>Ask Carlos anything about this diagnosis…</span>
              <ChevronDown size={14} color="var(--text-4)" />
            </div>
          ) : (
            <>
              {chatMessages.length > 0 && (
                <div style={{ marginBottom: "12px", display: "flex", flexDirection: "column", gap: "8px", maxHeight: "280px", overflowY: "auto" }}>
                  {chatMessages.map((msg, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                      {msg.role === "assistant" && msg.text === "" ? (
                        <div style={{ padding: "10px 14px", borderRadius: "12px", backgroundColor: "var(--surface-2)" }}>
                          <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                        </div>
                      ) : (
                        <div style={{ maxWidth: "85%", padding: "8px 12px", borderRadius: "12px", fontSize: "14px", lineHeight: 1.5, backgroundColor: msg.role === "user" ? "var(--accent)" : "var(--surface-2)", color: msg.role === "user" ? "white" : "var(--text-2)", wordBreak: "break-word" }}>
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
                    <button key={reply} onClick={() => handleChatSubmit(reply)} className="tap-target" style={{ fontSize: "12px", padding: "6px 12px", borderRadius: "20px", border: "1px solid var(--border-muted)", backgroundColor: "var(--surface-2)", color: "var(--text-2)", cursor: "pointer", whiteSpace: "nowrap" }}>
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
                  placeholder="Ask Carlos anything about this diagnosis..."
                  style={{ flex: 1, minWidth: 0, height: "44px", padding: "0 12px", fontSize: "16px", backgroundColor: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)" }}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading}
                  style={{ height: "44px", padding: "0 18px", backgroundColor: "var(--accent)", color: "white", fontWeight: 600, fontSize: "14px", border: "none", borderRadius: "8px", cursor: chatInput.trim() && !chatLoading ? "pointer" : "not-allowed", opacity: chatInput.trim() && !chatLoading ? 1 : 0.4, flexShrink: 0 }}
                >
                  Ask
                </button>
              </form>
            </>
          )}
        </Card>

        <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-3)", opacity: 0.4, paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))", margin: "8px 0 0" }}>
          AI diagnosis is for guidance only. Always verify with a qualified mechanic.
        </p>
      </div>

      {/* ── Share Sheet ── */}
      {showShareSheet && (() => {
        const shareUrl = shareToken ? `${APP_URL}/r/${shareToken}` : null;
        const carName = `${year} ${cap(make)} ${cap(model)}`;
        const shareText = `Check out this diagnosis for my ${carName}`;
        const emailSubject = encodeURIComponent(`${carName} diagnosis — Carlos`);
        const emailBody = encodeURIComponent(`${shareText}\n\n${shareUrl ?? ""}`);
        const tweetText = encodeURIComponent(`Diagnosed my ${carName} with Carlos`);
        const chipStyle: React.CSSProperties = {
          display: "flex", alignItems: "center", justifyContent: "center", height: "44px",
          backgroundColor: "var(--surface-2)", border: "1px solid var(--border-muted)", borderRadius: "10px",
          color: "var(--text-2)", fontWeight: 600, fontSize: "13px", textDecoration: "none",
          cursor: shareUrl ? "pointer" : "not-allowed", opacity: shareUrl ? 1 : 0.4,
          pointerEvents: shareUrl ? "auto" : "none",
        };
        return (
          <div onClick={() => setShowShareSheet(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "560px", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px 20px 0 0", padding: "20px 16px", paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))", animation: "view-fade-in 200ms ease", boxSizing: "border-box" }}>
              <div style={{ width: "32px", height: "4px", backgroundColor: "var(--surface-3)", borderRadius: "2px", margin: "0 auto 16px" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>Share Diagnosis</div>
                <button onClick={() => setShowShareSheet(false)} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" }}>
                  <X size={18} />
                </button>
              </div>

              {/* URL row */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
                <div style={{ flex: 1, height: "44px", padding: "0 12px", backgroundColor: "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px", display: "flex", alignItems: "center", overflow: "hidden", minWidth: 0 }}>
                  {shareLoading ? (
                    <span style={{ fontSize: "12px", color: "var(--text-3)" }}>Generating link…</span>
                  ) : shareUrl ? (
                    <span style={{ fontSize: "12px", color: "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shareUrl.replace(/^https?:\/\//, "")}</span>
                  ) : (
                    <span style={{ fontSize: "12px", color: "var(--text-3)" }}>Could not generate link</span>
                  )}
                </div>
                <button
                  onClick={copyShareLink}
                  disabled={!shareUrl}
                  className="tap-target"
                  style={{ height: "44px", padding: "0 16px", backgroundColor: shareCopied ? "#14532d" : "var(--accent)", border: shareCopied ? "1px solid #166534" : "none", borderRadius: "8px", color: shareCopied ? "#4ade80" : "white", fontWeight: 600, fontSize: "13px", cursor: shareUrl ? "pointer" : "not-allowed", opacity: shareUrl ? 1 : 0.4, whiteSpace: "nowrap", flexShrink: 0, transition: "background-color 200ms" }}
                >
                  {shareCopied ? "✓ Copied" : "Copy"}
                </button>
              </div>

              {/* Social chips */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "14px" }}>
                <a href={shareUrl ? `sms:?body=${encodeURIComponent(shareText + " " + shareUrl)}` : "#"} style={chipStyle}>Messages</a>
                <a href={shareUrl ? `mailto:?subject=${emailSubject}&body=${emailBody}` : "#"} style={chipStyle}>Email</a>
                <a href={shareUrl ? `https://x.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${tweetText}` : "#"} target="_blank" rel="noopener noreferrer" style={chipStyle}>X / Twitter</a>
                <a href={shareUrl ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` : "#"} target="_blank" rel="noopener noreferrer" style={chipStyle}>Facebook</a>
              </div>

              {/* Download image */}
              <button onClick={() => { setShowShareSheet(false); setShowImageModal(true); }} className="tap-target" style={{ height: "52px", display: "flex", alignItems: "center", gap: "14px", backgroundColor: "var(--surface-2)", border: "1px solid var(--border-muted)", borderRadius: "12px", padding: "0 16px", cursor: "pointer", color: "var(--text)", width: "100%", boxSizing: "border-box" }}>
                <ImageIcon size={18} color="#4a9eff" />
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "14px", fontWeight: 600 }}>Download image card</div>
                  <div style={{ fontSize: "11px", color: "var(--text-3)" }}>Save a shareable summary image</div>
                </div>
              </button>
            </div>
          </div>
        );
      })()}

      {/* ── Send to Mechanic Modal ── */}
      {showMechanicModal && (
        <div onClick={() => setShowMechanicModal(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "560px", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px 16px 0 0", padding: "20px 16px", paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))", boxSizing: "border-box" }}>
            <div style={{ width: "32px", height: "4px", backgroundColor: "var(--surface-3)", borderRadius: "2px", margin: "0 auto 16px" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>Send to Your Mechanic</div>
              <button onClick={() => setShowMechanicModal(false)} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: "flex", gap: "4px", backgroundColor: "var(--bg)", borderRadius: "10px", padding: "3px", marginBottom: "14px" }}>
              {(["text", "email", "walkin"] as const).map((fmt) => (
                <button key={fmt} onClick={() => setMechanicFormat(fmt)} style={{ flex: 1, height: "34px", fontSize: "13px", fontWeight: 600, border: "none", borderRadius: "8px", cursor: "pointer", backgroundColor: mechanicFormat === fmt ? "var(--surface-2)" : "transparent", color: mechanicFormat === fmt ? "var(--text)" : "var(--text-3)", transition: "background-color 150ms" }}>
                  {fmt === "text" ? "Text" : fmt === "email" ? "Email" : "Walk-in"}
                </button>
              ))}
            </div>
            {mechanicFormat === "email" && (
              <div style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px", padding: "8px 12px", marginBottom: "8px" }}>
                <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Subject: </span>
                <span style={{ fontSize: "13px", color: "var(--text-2)" }}>{aiMechanicMsg?.emailSubject ?? `Service inquiry — ${year} ${cap(make)} ${cap(model)}`}</span>
              </div>
            )}
            <div style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-muted)", borderRadius: "10px", padding: "14px", marginBottom: "14px", maxHeight: "220px", overflowY: "auto", boxSizing: "border-box" }}>
              <p style={{ margin: 0, fontSize: "14px", color: "var(--text)", lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{currentMechanicMessage()}</p>
            </div>
            <button onClick={copyMechanicMessage} className="tap-target" style={{ width: "100%", height: "48px", backgroundColor: mechanicCopied ? "var(--green)" : "var(--accent)", color: "white", fontWeight: 600, fontSize: "15px", border: "none", borderRadius: "8px", cursor: "pointer", transition: "background-color 200ms", marginBottom: "8px" }}>
              {mechanicCopied ? "✓ Copied!" : "Copy Message"}
            </button>
            {mechanicFormat === "email" && (
              <a href={`mailto:?subject=${encodeURIComponent(aiMechanicMsg?.emailSubject ?? buildEmailMessage(mechanicCtx).subject)}&body=${encodeURIComponent(currentMechanicMessage())}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "44px", backgroundColor: "var(--surface-2)", border: "1px solid var(--border-muted)", borderRadius: "8px", color: "var(--text-2)", fontWeight: 500, fontSize: "14px", textDecoration: "none" }}>
                Open in Mail ↗
              </a>
            )}
            {mechanicFormat === "text" && (
              <a href={`sms:?body=${encodeURIComponent(currentMechanicMessage())}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "44px", backgroundColor: "var(--surface-2)", border: "1px solid var(--border-muted)", borderRadius: "8px", color: "var(--text-2)", fontWeight: 500, fontSize: "14px", textDecoration: "none" }}>
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
            <div ref={shareCardRef} style={{ backgroundColor: "var(--bg)", borderRadius: "20px", padding: "28px 24px", overflow: "hidden", boxSizing: "border-box" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "20px" }}>
                <Wrench size={14} color="#4a9eff" />
                <span style={{ fontFamily: "var(--font-barlow), sans-serif", fontSize: "14px", fontWeight: 700, color: "var(--accent)", letterSpacing: "0.12em" }}>CARLOS</span>
              </div>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--text)", marginBottom: "4px", lineHeight: 1.1 }}>{year} {cap(make)} {cap(model)}</div>
              <div style={{ fontSize: "13px", color: "var(--text-3)", marginBottom: "20px", lineHeight: 1.4, wordBreak: "break-word" }}>{issue.length > 72 ? issue.slice(0, 69) + "…" : issue}</div>
              {verdict !== "OKAY" ? (
                <div style={{ padding: "12px 16px", borderRadius: "10px", marginBottom: "18px", backgroundColor: verdict === "STOP" ? "var(--red-bg)" : "var(--amber-bg)", borderLeft: `4px solid ${verdict === "STOP" ? "var(--red)" : "var(--amber)"}` }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: verdict === "STOP" ? "var(--red)" : "var(--amber)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{verdict === "STOP" ? "STOP DRIVING" : "DRIVE WITH CAUTION"}</span>
                </div>
              ) : (
                <div style={{ padding: "8px 14px", borderRadius: "10px", marginBottom: "18px", backgroundColor: "transparent", border: "1px solid #1a3a25" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--green)" }}>OKAY TO DRIVE</span>
                </div>
              )}
              {topCause && (
                <div style={{ marginBottom: "18px" }}>
                  <div style={{ fontSize: "10px", color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px", fontWeight: 600 }}>Most Likely Cause</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)", wordBreak: "break-word" }}>{topCause.cause}</div>
                  {firstStep && <div style={{ fontSize: "12px", color: "var(--text-3)", marginTop: "3px" }}>→ {firstStep.action}</div>}
                </div>
              )}
              {topEst && (
                <div style={{ marginBottom: "22px" }}>
                  <div style={{ fontSize: "10px", color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px", fontWeight: 600 }}>Estimated Repair</div>
                  <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "26px", fontWeight: 700, color: "var(--accent)" }}>{topEst.total}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-3)" }}>{topEst.fix}</div>
                </div>
              )}
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: "var(--text-4)" }}>AI diagnosis · verify with a mechanic</span>
                <span style={{ fontSize: "12px", color: "var(--accent)", fontWeight: 700 }}>mchaniccarlos.com</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <button onClick={captureAndShare} disabled={isSharing} className="tap-target" style={{ flex: 1, height: "52px", backgroundColor: "var(--accent)", color: "white", fontWeight: 600, fontSize: "15px", border: "none", borderRadius: "10px", cursor: "pointer", opacity: isSharing ? 0.6 : 1 }}>
                {isSharing ? "Preparing…" : "↑ Share Image"}
              </button>
              <button onClick={() => setShowImageModal(false)} className="tap-target" style={{ height: "52px", padding: "0 20px", backgroundColor: "var(--surface-2)", border: "1px solid var(--border-muted)", borderRadius: "10px", color: "var(--text-2)", fontSize: "14px", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Clarifying Questions Bottom Sheet ── */}
      {showQuestionsSheet && (
        <div onClick={() => setShowQuestionsSheet(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="sheet-enter"
            style={{ width: "100%", maxWidth: "560px", backgroundColor: "var(--surface)", borderRadius: "20px 20px 0 0", border: "1px solid var(--border)", borderBottom: "none", padding: "20px 16px", paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))", boxSizing: "border-box", maxHeight: "85dvh", overflowY: "auto" }}
          >
            <div style={{ width: "32px", height: "4px", backgroundColor: "var(--surface-3)", borderRadius: "2px", margin: "0 auto 20px" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>Get a more precise answer</div>
              <button onClick={() => setShowQuestionsSheet(false)} style={{ padding: "4px", backgroundColor: "transparent", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex", alignItems: "center" }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-3)", marginBottom: "20px" }}>
              Tap your answers — takes 10 seconds
            </div>

            {questionsLoading ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "24px 0", justifyContent: "center" }}>
                <Loader2 size={16} color="#4a9eff" style={{ animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: "14px", color: "var(--text-2)" }}>Generating questions…</span>
              </div>
            ) : questions && questions.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {questions.map((q, qIdx) => (
                  <div key={qIdx}>
                    <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", marginBottom: "10px", lineHeight: 1.4 }}>{q.question}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {q.options.map((opt) => {
                        const selected = selectedAnswers[qIdx]?.includes(opt);
                        return (
                          <button
                            key={opt}
                            onClick={() => toggleAnswer(qIdx, opt)}
                            className="tap-target"
                            style={{ height: "44px", textAlign: "left", padding: "0 14px", fontSize: "14px", fontWeight: selected ? 600 : 400, backgroundColor: selected ? "rgba(74,158,255,0.1)" : "var(--surface-2)", border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`, borderRadius: "8px", color: selected ? "var(--accent)" : "var(--text-2)", cursor: "pointer", transition: "border-color 100ms, color 100ms" }}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <button
                  onClick={handleRefine}
                  disabled={!hasAnswers}
                  className="tap-target"
                  style={{ width: "100%", height: "52px", backgroundColor: hasAnswers ? "var(--accent)" : "var(--surface-2)", color: hasAnswers ? "white" : "var(--text-3)", fontWeight: 600, fontSize: "15px", border: `1px solid ${hasAnswers ? "var(--accent)" : "var(--border)"}`, borderRadius: "10px", cursor: hasAnswers ? "pointer" : "not-allowed", transition: "background-color 150ms", marginTop: "4px" }}
                >
                  Refine My Diagnosis
                </button>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-3)", fontSize: "14px" }}>
                Couldn&apos;t load questions. Try asking in the chat instead.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Guided Repair Mode overlay */}
      {repairMode && (
        <RepairMode
          steps={currentDiagnosis.diagnosticSteps}
          vehicleLabel={`${year} ${cap(make)} ${cap(model)}`}
          causeName={topCause?.cause ?? "diagnosis"}
          onClose={() => setRepairMode(false)}
          onAskCarlos={(q) => { setChatExpanded(true); handleChatSubmit(q); }}
          chatContext={{ year, make: cap(make), model: cap(model), diagnosis: currentDiagnosis }}
        />
      )}
    </div>
  );
}


// ── Email capture — anonymous users become reachable leads ──
function EmailReportCard({ vehicle }: { vehicle: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done">("idle");

  async function save() {
    const v = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || state === "saving") return;
    setState("saving");
    try {
      await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: v, source: "report", vehicle }),
      });
    } catch { /* lead capture must never error at the user */ }
    track("report_email_saved");
    setState("done");
  }

  if (state === "done") {
    return (
      <div style={{ backgroundColor: "var(--surface)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "12px", padding: "14px 16px", fontSize: "13px", color: "var(--text-2)" }}>
        <span style={{ color: "var(--green)", fontWeight: 600 }}>You&apos;re on the list.</span> Car tips and your report link are coming to {email.trim()}.
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px" }}>
      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>Keep this diagnosis</div>
      <p style={{ margin: "0 0 12px", fontSize: "12.5px", color: "var(--text-2)", lineHeight: 1.5 }}>
        Get the report by email, plus what to check before the shop visit.
      </p>
      <div style={{ display: "flex", gap: "8px" }}>
        <label htmlFor="report-email" className="sr-only">Email address</label>
        <input
          id="report-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") save(); }}
          placeholder="you@example.com"
          autoComplete="email"
          style={{ flex: 1, minWidth: 0, height: "42px", padding: "0 12px", fontSize: "15px", backgroundColor: "var(--bg)", border: "1px solid var(--border)", borderRadius: "9px", color: "var(--text)" }}
        />
        <button
          onClick={save}
          disabled={state === "saving"}
          className="tap-target"
          style={{ height: "42px", padding: "0 16px", borderRadius: "9px", border: "none", backgroundColor: "var(--accent)", color: "white", fontSize: "13px", fontWeight: 700, cursor: "pointer", opacity: state === "saving" ? 0.7 : 1, whiteSpace: "nowrap" }}
        >
          {state === "saving" ? "…" : "Send it"}
        </button>
      </div>
    </div>
  );
}
