"use client";

import { X } from "lucide-react";
import Link from "next/link";

type GateReason = "photo_upload" | "diagnosis_limit" | "second_car" | "modified_mode";

interface Props {
  reason: GateReason;
  onClose: () => void;
}

const GATE_COPY: Record<GateReason, { title: string; body: string; cta: string; tier: "pro" | "enthusiast" }> = {
  photo_upload: {
    title: "Photo upload is a Pro feature",
    body: "Snap your dashboard warning lights or engine bay and let AI analyze what it sees. Upgrade to Pro to unlock photo-powered diagnosis.",
    cta: "Upgrade to Pro — from $4.08/mo",
    tier: "pro",
  },
  diagnosis_limit: {
    title: "You've used your 3 free diagnoses this month",
    body: "Free accounts get 3 diagnoses per month. Upgrade to Pro for unlimited diagnoses — no limits, ever.",
    cta: "Upgrade to Pro — from $4.08/mo",
    tier: "pro",
  },
  second_car: {
    title: "Multiple cars is a Pro feature",
    body: "Save up to 3 cars in your garage with Pro, and unlimited cars with Enthusiast. Track maintenance and history for each one.",
    cta: "Upgrade to Pro — from $4.08/mo",
    tier: "pro",
  },
  modified_mode: {
    title: "Full modified car mode is Enthusiast only",
    body: "Running a tune, headers, or an intake? Enthusiast mode factors in your specific mods when ranking causes and estimating costs.",
    cta: "Upgrade to Enthusiast — from $8.25/mo",
    tier: "enthusiast",
  },
};

export default function UpgradeModal({ reason, onClose }: Props) {
  const copy = GATE_COPY[reason];

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.75)", zIndex: 60, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: "480px", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderTopLeftRadius: "20px", borderTopRightRadius: "20px", padding: "24px 20px", paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))", boxSizing: "border-box" as const }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "rgba(74,158,255,0.1)", border: "1px solid rgba(74,158,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2l1.8 3.6H14l-3.3 2.4 1.3 4L8 9.8l-4 2.2 1.3-4L2 5.6h4.2L8 2z" fill="#4a9eff" opacity="0.7" />
              </svg>
            </div>
            <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "var(--text)", lineHeight: 1.3 }}>{copy.title}</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center", flexShrink: 0 }}>
            <X size={18} />
          </button>
        </div>

        <p style={{ margin: "0 0 24px", fontSize: "14px", color: "var(--text-2)", lineHeight: 1.6 }}>{copy.body}</p>

        <Link
          href="/pricing"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "50px", background: "var(--accent)", color: "white", fontWeight: 700, fontSize: "15px", borderRadius: "12px", textDecoration: "none", boxShadow: "0 4px 16px rgba(74,158,255,0.28)", marginBottom: "10px" }}
        >
          {copy.cta}
        </Link>

        <button
          onClick={onClose}
          style={{ display: "block", width: "100%", textAlign: "center", fontSize: "13px", color: "var(--text-3)", backgroundColor: "transparent", border: "none", cursor: "pointer", padding: "6px 0" }}
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
