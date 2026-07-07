"use client";

// Repair Mode — a full-screen, one-step-at-a-time guided flow built from the
// diagnosis steps. LEGO-manual philosophy: one action per screen, a schematic
// pictogram (never a fake-precise engine rendering), big tap targets for
// gloved hands, and the screen stays awake while you wrench.

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Clock, DollarSign, Wrench, Check, ArrowRight, RotateCcw, MessageCircle } from "lucide-react";
import type { DiagnosticStep } from "@/types/diagnostic";
import { hapticImpact, hapticSuccess } from "@/lib/native";
import { track } from "@/lib/track";

const S = {
  bg: "#060810",
  card: "#0b1019",
  card2: "#101822",
  border: "#172134",
  text: "#dce8f5",
  sec: "#7d8fa8",
  muted: "#4a5c72",
  accent: "#4a9eff",
  green: "#22c55e",
  amber: "#f59e0b",
};

// ── Schematic pictograms ─────────────────────────────────────────────
// Deliberately diagrammatic: consistent 1.6 stroke line art, no attempt at
// photorealism. Chosen by keyword so a coil step shows a coil, a brake step
// shows a brake, and anything unknown gets the wrench.

type Pictogram = { match: RegExp; svg: React.ReactNode };

const stroke = { stroke: S.accent, strokeWidth: 1.6, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const strokeDim = { ...stroke, stroke: "#33507a" };

const PICTOGRAMS: Pictogram[] = [
  {
    match: /coil|ignition/i,
    svg: (
      <svg viewBox="0 0 96 96" width="100%" height="100%">
        <rect x="34" y="14" width="28" height="16" rx="4" {...stroke} />
        <path d="M40 30v10M56 30v10" {...stroke} />
        <rect x="38" y="40" width="20" height="30" rx="3" {...stroke} />
        <path d="M48 70v12" {...stroke} />
        <path d="M42 82h12" {...stroke} />
        <path d="M52 46l-7 9h10l-7 9" {...{ ...stroke, stroke: S.amber }} />
      </svg>
    ),
  },
  {
    match: /spark ?plug/i,
    svg: (
      <svg viewBox="0 0 96 96" width="100%" height="100%">
        <path d="M40 14h16v10H40z" {...stroke} />
        <path d="M42 24h12v14H42z" {...stroke} />
        <path d="M44 38h8v20" {...stroke} />
        <path d="M44 38v20" {...stroke} />
        <path d="M48 58v14" {...stroke} />
        <path d="M42 72h6M48 78h6" {...stroke} />
        <path d="M36 30h-8M36 34h-5" {...strokeDim} />
      </svg>
    ),
  },
  {
    match: /battery|terminal|corros/i,
    svg: (
      <svg viewBox="0 0 96 96" width="100%" height="100%">
        <rect x="18" y="34" width="60" height="38" rx="6" {...stroke} />
        <path d="M28 34v-8h10v8M58 34v-8h10v8" {...stroke} />
        <path d="M30 50h12M36 44v12" {...{ ...stroke, stroke: S.green }} />
        <path d="M56 50h12" {...{ ...stroke, stroke: "#ef4444" }} />
      </svg>
    ),
  },
  {
    match: /brake|rotor|caliper|pad/i,
    svg: (
      <svg viewBox="0 0 96 96" width="100%" height="100%">
        <circle cx="48" cy="48" r="26" {...stroke} />
        <circle cx="48" cy="48" r="9" {...stroke} />
        <path d="M48 22a26 26 0 0 1 22 12l-9 6" {...{ ...stroke, stroke: S.amber }} />
        <circle cx="48" cy="35" r="2.4" {...strokeDim} />
        <circle cx="61" cy="55" r="2.4" {...strokeDim} />
        <circle cx="35" cy="55" r="2.4" {...strokeDim} />
      </svg>
    ),
  },
  {
    match: /tire|wheel|lug/i,
    svg: (
      <svg viewBox="0 0 96 96" width="100%" height="100%">
        <circle cx="48" cy="48" r="28" {...stroke} />
        <circle cx="48" cy="48" r="16" {...stroke} />
        <circle cx="48" cy="48" r="4" {...stroke} />
        <path d="M48 32v-6M48 70v-6M32 48h-6M70 48h-6M37 37l-4-4M63 63l-4-4M59 37l4-4M33 63l4-4" {...strokeDim} />
      </svg>
    ),
  },
  {
    match: /oil|fluid|coolant|leak|reservoir|dipstick/i,
    svg: (
      <svg viewBox="0 0 96 96" width="100%" height="100%">
        <path d="M48 16c10 14 18 24 18 34a18 18 0 1 1-36 0c0-10 8-20 18-34z" {...stroke} />
        <path d="M42 56a8 8 0 0 0 8 8" {...strokeDim} />
      </svg>
    ),
  },
  {
    match: /filter|air ?box|intake/i,
    svg: (
      <svg viewBox="0 0 96 96" width="100%" height="100%">
        <rect x="22" y="30" width="52" height="36" rx="6" {...stroke} />
        <path d="M30 30v36M38 30v36M46 30v36M54 30v36M62 30v36" {...strokeDim} />
        <path d="M74 42h8M74 54h8" {...stroke} />
      </svg>
    ),
  },
  {
    match: /fuse|relay|wir|connector|harness|electrical/i,
    svg: (
      <svg viewBox="0 0 96 96" width="100%" height="100%">
        <rect x="30" y="22" width="36" height="24" rx="4" {...stroke} />
        <path d="M38 46v10a10 10 0 0 0 20 0V46" {...stroke} />
        <path d="M48 66v12" {...stroke} />
        <path d="M52 30l-6 8h8l-6 8" {...{ ...stroke, stroke: S.amber }} />
      </svg>
    ),
  },
  {
    match: /scan|obd|code reader|reader/i,
    svg: (
      <svg viewBox="0 0 96 96" width="100%" height="100%">
        <rect x="28" y="18" width="40" height="56" rx="8" {...stroke} />
        <rect x="35" y="26" width="26" height="18" rx="2" {...stroke} />
        <path d="M38 35l5-5 4 4 6-6" {...{ ...stroke, stroke: S.green }} />
        <circle cx="48" cy="60" r="5" {...strokeDim} />
      </svg>
    ),
  },
  {
    match: /sensor|maf|o2|camshaft|crankshaft/i,
    svg: (
      <svg viewBox="0 0 96 96" width="100%" height="100%">
        <rect x="38" y="40" width="20" height="26" rx="4" {...stroke} />
        <path d="M48 40V26" {...stroke} />
        <circle cx="48" cy="22" r="4" {...stroke} />
        <path d="M36 20a16 16 0 0 1 24 0" {...strokeDim} />
        <path d="M30 14a24 24 0 0 1 36 0" {...strokeDim} />
      </svg>
    ),
  },
  {
    match: /belt|pulley|tension/i,
    svg: (
      <svg viewBox="0 0 96 96" width="100%" height="100%">
        <circle cx="32" cy="36" r="10" {...stroke} />
        <circle cx="64" cy="36" r="10" {...stroke} />
        <circle cx="48" cy="64" r="10" {...stroke} />
        <path d="M32 26a10 10 0 0 1 0 0L64 26M73 40L54 70M42 70L23 40" {...strokeDim} />
      </svg>
    ),
  },
  {
    match: /hose|vacuum|clamp|boost/i,
    svg: (
      <svg viewBox="0 0 96 96" width="100%" height="100%">
        <path d="M20 30h20a12 12 0 0 1 12 12v12a12 12 0 0 0 12 12h12" {...stroke} />
        <path d="M20 40h20a2 2 0 0 0 2-2v-6" {...strokeDim} />
        <path d="M58 60l6-6" {...{ ...stroke, stroke: S.amber }} />
      </svg>
    ),
  },
];

const FALLBACK_SVG = (
  <svg viewBox="0 0 96 96" width="100%" height="100%">
    <path d="M60 24a14 14 0 0 0-19 17L22 60a7 7 0 0 0 10 10l19-19a14 14 0 0 0 17-19l-9 9-9-2-2-9 9-9z" {...stroke} />
  </svg>
);

function pictogramFor(step: DiagnosticStep): React.ReactNode {
  const hay = `${step.action} ${step.tools} ${step.why}`;
  return PICTOGRAMS.find((p) => p.match.test(hay))?.svg ?? FALLBACK_SVG;
}

// ── Wake lock: keep the screen on while wrenching ────────────────────

function useWakeLock(active: boolean) {
  const lockRef = useRef<{ release: () => Promise<void> } | null>(null);
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    async function acquire() {
      try {
        const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
        if (!nav.wakeLock) return;
        const lock = await nav.wakeLock.request("screen");
        if (cancelled) { lock.release().catch(() => {}); return; }
        lockRef.current = lock;
      } catch {
        // Wake lock is a nicety — low battery or unsupported browser is fine.
      }
    }
    acquire();
    const revive = () => { if (document.visibilityState === "visible") acquire(); };
    document.addEventListener("visibilitychange", revive);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", revive);
      lockRef.current?.release().catch(() => {});
      lockRef.current = null;
    };
  }, [active]);
}

// ── Component ────────────────────────────────────────────────────────

interface Props {
  steps: DiagnosticStep[];
  vehicleLabel: string; // "2019 Subaru WRX"
  causeName: string; // top-ranked cause
  onClose: () => void;
  onAskCarlos?: (question: string) => void;
}

type Outcome = "confirmed" | "ruled-out";

export default function RepairMode({ steps, vehicleLabel, causeName, onClose, onAskCarlos }: Props) {
  const [idx, setIdx] = useState(0);
  const [outcomes, setOutcomes] = useState<Record<number, Outcome>>({});
  const [finished, setFinished] = useState<"confirmed" | "exhausted" | null>(null);
  useWakeLock(true);

  useEffect(() => {
    track("repair_mode_started", { steps: steps.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Block body scroll behind the overlay
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const step = steps[idx];
  const total = steps.length;

  function choose(outcome: Outcome) {
    setOutcomes((o) => ({ ...o, [idx]: outcome }));
    if (outcome === "confirmed") {
      hapticSuccess();
      track("repair_mode_confirmed", { atStep: idx + 1 });
      setFinished("confirmed");
    } else if (idx + 1 < total) {
      hapticImpact("light");
      setIdx(idx + 1);
    } else {
      hapticImpact("medium");
      track("repair_mode_exhausted", { steps: total });
      setFinished("exhausted");
    }
  }

  const chip = (icon: React.ReactNode, label: string) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: S.card2, border: `1px solid ${S.border}`, borderRadius: "20px", padding: "6px 12px", fontSize: "12px", color: S.sec }}>
      {icon}
      <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "11px", fontWeight: 600 }}>{label}</span>
    </span>
  );

  const ruledOutCount = Object.values(outcomes).filter((o) => o === "ruled-out").length;

  // Portaled to <body>: the report wrapper animates with a transform, which
  // would otherwise turn position:fixed into "fixed inside the report" — the
  // overlay wouldn't cover the viewport and the bottom nav would bleed through.
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Guided repair" style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: S.bg, display: "flex", flexDirection: "column", paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>

      {/* Top bar: progress + close */}
      <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${S.border}`, backgroundColor: S.bg }}>
        <div style={{ maxWidth: "480px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "10px", fontWeight: 700, color: S.muted, letterSpacing: "0.1em", textTransform: "uppercase" as const }}>Guided repair</div>
              <div style={{ fontSize: "13px", color: S.sec, marginTop: "2px", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{vehicleLabel} · {causeName}</div>
            </div>
            <button onClick={onClose} aria-label="Exit guided repair" className="tap-target" style={{ width: "36px", height: "36px", borderRadius: "50%", border: `1px solid ${S.border}`, backgroundColor: S.card, color: S.sec, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, marginLeft: "12px" }}>
              <X size={16} />
            </button>
          </div>
          {/* Progress segments — LEGO-manual style step dots. Amber = ruled out. */}
          <div style={{ display: "flex", gap: "5px" }}>
            {steps.map((s, i) => (
              <div key={s.step} style={{ flex: 1, height: "4px", borderRadius: "2px", backgroundColor: finished ? S.green : outcomes[i] === "ruled-out" ? S.amber : i === idx ? S.accent : i < idx ? S.accent : S.border, opacity: !finished && i > idx ? 1 : undefined, transition: "background-color 200ms" }} />
            ))}
          </div>
          {!finished && (
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
              <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "10px", fontWeight: 600, color: S.muted, letterSpacing: "0.06em" }}>STEP {idx + 1} OF {total}</span>
              {ruledOutCount > 0 && (
                <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "10px", fontWeight: 600, color: S.amber, letterSpacing: "0.06em" }}>{ruledOutCount} RULED OUT</span>
              )}
            </div>
          )}
        </div>
      </div>

      {!finished && step && (
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column" }}>
          {/* margin:auto centers the block vertically on tall screens instead of
              leaving a dead band between card and buttons; scrolls naturally when taller. */}
          <div style={{ maxWidth: "480px", width: "100%", margin: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>

            {/* Step card: pictogram + action + why + cost/time/tools */}
            <div style={{ backgroundColor: S.card, border: `1px solid ${S.border}`, borderRadius: "20px", padding: "24px 20px", textAlign: "center", position: "relative" }}>
              <div style={{ position: "absolute", top: "16px", left: "16px", width: "34px", height: "34px", borderRadius: "10px", backgroundColor: "rgba(74,158,255,0.12)", border: "1px solid rgba(74,158,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-barlow), sans-serif", fontWeight: 800, fontSize: "18px", color: S.accent }} aria-hidden="true">
                {idx + 1}
              </div>
              <div style={{ width: "min(150px, 34vw)", height: "min(150px, 34vw)", margin: "4px auto 12px" }} aria-hidden="true">
                {pictogramFor(step)}
              </div>
              <h2 style={{ fontSize: "22px", fontWeight: 700, color: S.text, margin: "0 0 8px", lineHeight: 1.25 }}>{step.action}</h2>
              <p style={{ fontSize: "14px", color: S.sec, lineHeight: 1.6, margin: "0 0 16px", maxWidth: "38ch", marginLeft: "auto", marginRight: "auto" }}>{step.why}</p>
              <div style={{ display: "flex", justifyContent: "center", gap: "6px", flexWrap: "wrap" as const }}>
                {step.cost ? chip(<DollarSign size={11} aria-hidden="true" />, step.cost) : null}
                {step.time ? chip(<Clock size={11} aria-hidden="true" />, step.time) : null}
                {step.tools ? chip(<Wrench size={11} aria-hidden="true" />, step.tools) : null}
              </div>
            </div>

            {/* Outcome choices — verdict label + what it means */}
            <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "10px", fontWeight: 700, color: S.muted, letterSpacing: "0.1em", textTransform: "uppercase" as const, textAlign: "center", marginTop: "4px" }}>What did you find?</div>
            <button
              onClick={() => choose("confirmed")}
              className="tap-target"
              style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "flex-start", gap: "12px", backgroundColor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.35)", borderRadius: "14px", padding: "14px 16px", cursor: "pointer", transition: "background-color 200ms" }}
            >
              <span style={{ width: "28px", height: "28px", borderRadius: "8px", backgroundColor: "rgba(34,197,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }} aria-hidden="true">
                <Check size={16} color={S.green} />
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontSize: "13px", fontWeight: 700, color: S.green, marginBottom: "3px" }}>That&apos;s the problem</span>
                <span style={{ display: "block", fontSize: "13px", color: S.text, lineHeight: 1.5 }}>{step.ifResultA}</span>
              </span>
            </button>
            <button
              onClick={() => choose("ruled-out")}
              className="tap-target"
              style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "flex-start", gap: "12px", backgroundColor: S.card, border: `1px solid ${S.border}`, borderRadius: "14px", padding: "14px 16px", cursor: "pointer", transition: "background-color 200ms" }}
            >
              <span style={{ width: "28px", height: "28px", borderRadius: "8px", backgroundColor: "rgba(245,158,11,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }} aria-hidden="true">
                <ArrowRight size={16} color={S.amber} />
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontSize: "13px", fontWeight: 700, color: S.amber, marginBottom: "3px" }}>{idx + 1 < total ? "Looked normal — rule it out" : "Looked normal"}</span>
                <span style={{ display: "block", fontSize: "13px", color: S.sec, lineHeight: 1.5 }}>{step.ifResultB}</span>
              </span>
            </button>

            {/* Escape hatch + reassurance */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginTop: "2px" }}>
              {onAskCarlos ? (
                <button
                  onClick={() => { onClose(); onAskCarlos(`I'm on step ${idx + 1} of the guided repair ("${step.action}") and I'm not sure what I'm looking at. Can you walk me through it in more detail?`); }}
                  className="tap-target"
                  style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", padding: "8px 0", color: S.accent, fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                >
                  <MessageCircle size={14} aria-hidden="true" />
                  Stuck? Ask Carlos
                </button>
              ) : <span />}
              <span style={{ fontSize: "12px", color: S.muted }}>Screen stays on while you work</span>
            </div>
          </div>
        </div>
      )}

      {/* Completion screens */}
      {finished && (
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <div style={{ maxWidth: "420px" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", margin: "0 auto 18px", backgroundColor: finished === "confirmed" ? "rgba(34,197,94,0.12)" : "rgba(74,158,255,0.12)", border: `1px solid ${finished === "confirmed" ? "rgba(34,197,94,0.4)" : "rgba(74,158,255,0.35)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {finished === "confirmed" ? <Check size={28} color={S.green} aria-hidden="true" /> : <RotateCcw size={26} color={S.accent} aria-hidden="true" />}
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: S.text, margin: "0 0 10px" }}>
              {finished === "confirmed" ? "Found it." : "You ruled everything out."}
            </h2>
            <p style={{ fontSize: "14px", color: S.sec, lineHeight: 1.65, margin: "0 0 18px" }}>
              {finished === "confirmed"
                ? `Step ${idx + 1} confirmed the problem. The cost estimate and parts list in your diagnosis are ready — and you just saved yourself the $100–$180 a shop charges to diagnose it.`
                : "None of the checks confirmed the usual suspects — that genuinely narrows it down, and a mechanic can skip everything you already tested. Ask Carlos what to try next."}
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "6px", flexWrap: "wrap" as const, marginBottom: "24px" }}>
              {chip(<Check size={11} aria-hidden="true" />, `${finished === "confirmed" ? idx + 1 : total} steps run`)}
              {ruledOutCount > 0 ? chip(<ArrowRight size={11} aria-hidden="true" />, `${ruledOutCount} ruled out`) : null}
              {finished === "confirmed" ? chip(<DollarSign size={11} aria-hidden="true" />, "$100–$180 saved") : null}
            </div>
            <button
              onClick={onClose}
              className="tap-target"
              style={{ width: "100%", height: "50px", borderRadius: "12px", border: "none", backgroundColor: S.accent, color: "white", fontSize: "15px", fontWeight: 700, cursor: "pointer", marginBottom: "10px" }}
            >
              {finished === "confirmed" ? "See costs & parts" : "Back to diagnosis"}
            </button>
            {finished === "exhausted" && onAskCarlos && (
              <button
                onClick={() => { onClose(); onAskCarlos(`I worked through all ${total} diagnostic steps and none confirmed the cause (${Object.values(outcomes).filter(o => o === "ruled-out").length} ruled out). What should I check next?`); }}
                className="tap-target"
                style={{ width: "100%", height: "50px", borderRadius: "12px", border: `1px solid ${S.border}`, backgroundColor: S.card, color: S.sec, fontSize: "15px", fontWeight: 600, cursor: "pointer" }}
              >
                Ask Carlos what&apos;s next
              </button>
            )}
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
