"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  diagnosisId: string | null;
}

export default function FeedbackCard({ diagnosisId }: Props) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<"idle" | "asking-fix" | "done">("idle");
  const [actualFix, setActualFix] = useState("");
  const [saving, setSaving] = useState(false);

  if (!user || !diagnosisId) return null;

  async function submit(resolved: boolean, fix?: string) {
    setSaving(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diagnosisId, resolved, actualFix: fix || "" }),
      });
      setPhase("done");
    } finally {
      setSaving(false);
    }
  }

  if (phase === "done") {
    return (
      <div style={{ backgroundColor: "#0a1a0f", border: "1px solid #1e3a28", borderRadius: "10px", padding: "14px 16px", textAlign: "center" }}>
        <div style={{ fontSize: "13px", color: "#22c55e", fontWeight: 600 }}>✓ Thanks for the feedback</div>
        <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>It helps us get better at this.</div>
      </div>
    );
  }

  if (phase === "asking-fix") {
    return (
      <div style={{ backgroundColor: "#13161b", border: "1px solid #1e2329", borderRadius: "10px", padding: "14px 16px" }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#f1f5f9", marginBottom: "10px" }}>What was the actual fix?</div>
        <textarea
          value={actualFix}
          onChange={(e) => setActualFix(e.target.value)}
          placeholder="e.g. Replaced ignition coil on cylinder 2 — fixed the misfire"
          rows={2}
          style={{ display: "block", width: "100%", padding: "10px 12px", fontSize: "16px", backgroundColor: "#1a1e25", border: "1px solid #252b34", borderRadius: "8px", color: "#f1f5f9", resize: "none", lineHeight: 1.5, marginBottom: "10px" }}
        />
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => submit(true, actualFix)}
            disabled={saving}
            style={{ flex: 1, height: "40px", backgroundColor: "#22c55e", color: "white", fontWeight: 600, fontSize: "13px", border: "none", borderRadius: "8px", cursor: "pointer", opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "Saving..." : "Submit"}
          </button>
          <button
            onClick={() => submit(true, "")}
            disabled={saving}
            style={{ height: "40px", padding: "0 14px", backgroundColor: "transparent", border: "1px solid #252b34", color: "#6b7280", fontSize: "13px", borderRadius: "8px", cursor: "pointer" }}
          >
            Skip
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#13161b", border: "1px solid #1e2329", borderRadius: "10px", padding: "14px 16px" }}>
      <div style={{ fontSize: "13px", fontWeight: 600, color: "#f1f5f9", marginBottom: "12px" }}>Did this fix your problem?</div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={() => setPhase("asking-fix")}
          style={{ flex: 1, height: "40px", backgroundColor: "#0a1a0f", border: "1px solid #1e3a28", color: "#22c55e", fontWeight: 600, fontSize: "14px", borderRadius: "8px", cursor: "pointer" }}
        >
          ✓ Yes, fixed it
        </button>
        <button
          onClick={() => submit(false)}
          disabled={saving}
          style={{ flex: 1, height: "40px", backgroundColor: "#1a0a0a", border: "1px solid #3a1515", color: "#ef4444", fontWeight: 600, fontSize: "14px", borderRadius: "8px", cursor: "pointer", opacity: saving ? 0.6 : 1 }}
        >
          ✕ No help
        </button>
        <button
          onClick={() => submit(false)}
          disabled={saving}
          style={{ flex: 1, height: "40px", backgroundColor: "#1a1e25", border: "1px solid #252b34", color: "#9ca3af", fontWeight: 600, fontSize: "14px", borderRadius: "8px", cursor: "pointer" }}
        >
          Still diagnosing
        </button>
      </div>
    </div>
  );
}
