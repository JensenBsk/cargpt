"use client";

// Repair Mode — a full-screen, one-step-at-a-time guided flow built from the
// diagnosis steps. LEGO-manual philosophy: one action per screen, a schematic
// pictogram (never a fake-precise engine rendering), big tap targets for
// gloved hands, and the screen stays awake while you wrench.

import { useState, useEffect, useRef } from "react";
import { X, Clock, DollarSign, Wrench, Check, ArrowRight, RotateCcw } from "lucide-react";
import type { DiagnosticStep } from "@/types/diagnostic";
import { hapticImpact, hapticSuccess } from "@/lib/native";
import { track } from "@/lib/track";

const S = {
  bg: "#0a0d14",
  card: "#12161f",
  border: "#1e2433",
  text: "#f8fafc",
  sec: "#8b95a8",
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
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", backgroundColor: S.card, border: `1px solid ${S.border}`, borderRadius: "20px", padding: "5px 11px", fontSize: "12px", color: S.sec }}>
      {icon}{label}
    </span>
  );

  return (
    <div role="dialog" aria-modal="true" aria-label="Guided repair" style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: S.bg, display: "flex", flexDirection: "column", paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>

      {/* Top bar: progress + close */}
      <div style={{ padding: "14px 16px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: S.muted, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>Guided repair</div>
            <div style={{ fontSize: "13px", color: S.sec, marginTop: "2px" }}>{vehicleLabel} · {causeName}</div>
          </div>
          <button onClick={onClose} aria-label="Exit guided repair" className="tap-target" style={{ width: "36px", height: "36px", borderRadius: "50%", border: `1px solid ${S.border}`, backgroundColor: S.card, color: S.sec, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={16} />
          </button>
        </div>
        {/* Progress segments — LEGO-manual style step dots */}
        <div style={{ display: "flex", gap: "5px" }}>
          {steps.map((s, i) => (
            <div key={s.step} style={{ flex: 1, height: "4px", borderRadius: "2px", backgroundColor: finished ? S.green : i < idx ? S.accent : i === idx ? "rgba(74,158,255,0.55)" : S.border, transition: "background-color 200ms" }} />
          ))}
        </div>
      </div>

      {!finished && step && (
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 20px 20px", display: "flex", flexDirection: "column" }}>
          <div style={{ maxWidth: "480px", width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", flex: 1 }}>

            {/* Step number + pictogram card */}
            <div style={{ backgroundColor: S.card, border: `1px solid ${S.border}`, borderRadius: "20px", padding: "22px 20px", textAlign: "center", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "14px" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "10px", backgroundColor: "rgba(74,158,255,0.12)", border: "1px solid rgba(74,158,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-barlow), sans-serif", fontWeight: 800, fontSize: "18px", color: S.accent }}>
                  {idx + 1}
                </div>
                <span style={{ fontSize: "12px", color: S.muted }}>of {total}</span>
              </div>
              <div style={{ width: "120px", height: "120px", margin: "0 auto 14px" }} aria-hidden="true">
                {pictogramFor(step)}
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: S.text, margin: "0 0 8px", lineHeight: 1.3 }}>{step.action}</h2>
              <p style={{ fontSize: "14px", color: S.sec, lineHeight: 1.6, margin: "0 0 14px" }}>{step.why}</p>
              <div style={{ display: "flex", justifyContent: "center", gap: "6px", flexWrap: "wrap" as const }}>
                {step.cost ? chip(<DollarSign size={11} aria-hidden="true" />, step.cost) : null}
                {step.time ? chip(<Clock size={11} aria-hidden="true" />, step.time) : null}
                {step.tools ? chip(<Wrench size={11} aria-hidden="true" />, step.tools) : null}
              </div>
            </div>

            {/* Outcome choices */}
            <div style={{ marginTop: "auto" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: S.muted, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "10px", textAlign: "center" }}>What did you find?</div>
              <button
                onClick={() => choose("confirmed")}
                className="tap-target"
                style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "flex-start", gap: "12px", backgroundColor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.35)", borderRadius: "14px", padding: "16px", marginBottom: "10px", cursor: "pointer" }}
              >
                <Check size={18} color={S.green} style={{ flexShrink: 0, marginTop: "1px" }} aria-hidden="true" />
                <span style={{ fontSize: "14px", color: S.text, lineHeight: 1.5 }}>{step.ifResultA}</span>
              </button>
              <button
                onClick={() => choose("ruled-out")}
                className="tap-target"
                style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "flex-start", gap: "12px", backgroundColor: S.card, border: `1px solid ${S.border}`, borderRadius: "14px", padding: "16px", cursor: "pointer" }}
              >
                <ArrowRight size={18} color={S.amber} style={{ flexShrink: 0, marginTop: "1px" }} aria-hidden="true" />
                <span style={{ fontSize: "14px", color: S.sec, lineHeight: 1.5 }}>{step.ifResultB}</span>
              </button>
              <p style={{ textAlign: "center", fontSize: "12px", color: S.muted, margin: "14px 0 0" }}>
                Screen stays on while you work.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Completion screens */}
      {finished && (
        <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <div style={{ maxWidth: "420px" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", margin: "0 auto 18px", backgroundColor: finished === "confirmed" ? "rgba(34,197,94,0.12)" : "rgba(74,158,255,0.12)", border: `1px solid ${finished === "confirmed" ? "rgba(34,197,94,0.4)" : "rgba(74,158,255,0.35)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {finished === "confirmed" ? <Check size={28} color={S.green} aria-hidden="true" /> : <RotateCcw size={26} color={S.accent} aria-hidden="true" />}
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: S.text, margin: "0 0 10px" }}>
              {finished === "confirmed" ? "Found it." : "You ruled everything out."}
            </h2>
            <p style={{ fontSize: "14px", color: S.sec, lineHeight: 1.65, margin: "0 0 24px" }}>
              {finished === "confirmed"
                ? `Step ${idx + 1} confirmed the problem. The cost estimate and parts list in your diagnosis are ready — and you just saved yourself the shop's diagnostic fee.`
                : "None of the checks confirmed the usual suspects — that genuinely narrows it down, and a mechanic can skip everything you already tested. Ask Carlos what to try next."}
            </p>
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
    </div>
  );
}
