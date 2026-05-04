"use client";

import { useState } from "react";

interface Props {
  diagnosisId: string | null;
}

export default function FeedbackCard({ diagnosisId }: Props) {
  const [phase, setPhase] = useState<"idle" | "asking-fix" | "asking-issue" | "done">("idle");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(resolved: boolean, detail?: string) {
    if (!diagnosisId) { setPhase("done"); return; }
    setSaving(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diagnosisId, resolved, actualFix: detail || "" }),
      });
    } finally {
      setSaving(false);
      setPhase("done");
    }
  }

  if (phase === "done") {
    return (
      <div style={{ backgroundColor: "#0a1a0f", border: "1px solid #1a3a25", borderRadius: "10px", padding: "14px 16px", textAlign: "center" }}>
        <div style={{ fontSize: "13px", color: "#22c55e", fontWeight: 600 }}>Thanks for the feedback</div>
        <div style={{ fontSize: "12px", color: "#4a5c72", marginTop: "2px" }}>It helps us improve future diagnoses.</div>
      </div>
    );
  }

  if (phase === "asking-fix") {
    return (
      <div style={{ backgroundColor: "#0b1019", border: "1px solid #172134", borderRadius: "10px", padding: "14px 16px" }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#dce8f5", marginBottom: "10px" }}>What was the actual fix?</div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Replaced ignition coil on cylinder 2 — fixed the misfire"
          rows={2}
          style={{ display: "block", width: "100%", padding: "10px 12px", fontSize: "16px", backgroundColor: "#101822", border: "1px solid #172134", borderRadius: "8px", color: "#dce8f5", resize: "none", lineHeight: 1.5, marginBottom: "10px", boxSizing: "border-box" }}
        />
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => submit(true, text)}
            disabled={saving}
            className="tap-target"
            style={{ flex: 1, height: "40px", backgroundColor: "#14532d", border: "1px solid #166534", color: "#4ade80", fontWeight: 600, fontSize: "13px", borderRadius: "8px", cursor: "pointer", opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "Saving…" : "Submit"}
          </button>
          <button
            onClick={() => submit(true, "")}
            disabled={saving}
            className="tap-target"
            style={{ height: "40px", padding: "0 14px", backgroundColor: "transparent", border: "1px solid #172134", color: "#4a5c72", fontSize: "13px", borderRadius: "8px", cursor: "pointer" }}
          >
            Skip
          </button>
        </div>
      </div>
    );
  }

  if (phase === "asking-issue") {
    return (
      <div style={{ backgroundColor: "#0b1019", border: "1px solid #172134", borderRadius: "10px", padding: "14px 16px" }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#dce8f5", marginBottom: "10px" }}>What ended up being the issue?</div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Optional — any details help us improve"
          rows={2}
          style={{ display: "block", width: "100%", padding: "10px 12px", fontSize: "16px", backgroundColor: "#101822", border: "1px solid #172134", borderRadius: "8px", color: "#dce8f5", resize: "none", lineHeight: 1.5, marginBottom: "10px", boxSizing: "border-box" }}
        />
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => submit(false, text)}
            disabled={saving}
            className="tap-target"
            style={{ flex: 1, height: "40px", backgroundColor: "#1a0a0a", border: "1px solid #3a1515", color: "#ef4444", fontWeight: 600, fontSize: "13px", borderRadius: "8px", cursor: "pointer", opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "Saving…" : "Submit"}
          </button>
          <button
            onClick={() => submit(false, "")}
            disabled={saving}
            className="tap-target"
            style={{ height: "40px", padding: "0 14px", backgroundColor: "transparent", border: "1px solid #172134", color: "#4a5c72", fontSize: "13px", borderRadius: "8px", cursor: "pointer" }}
          >
            Skip
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#0b1019", border: "1px solid #172134", borderRadius: "10px", padding: "14px 16px" }}>
      <div style={{ fontSize: "13px", fontWeight: 600, color: "#7d8fa8", marginBottom: "12px" }}>Did this fix your problem?</div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={() => setPhase("asking-fix")}
          className="tap-target"
          style={{ flex: 1, height: "40px", backgroundColor: "#0a1a0f", border: "1px solid #1a3a25", color: "#4ade80", fontWeight: 600, fontSize: "13px", borderRadius: "8px", cursor: "pointer" }}
        >
          ✓ Yes, fixed it
        </button>
        <button
          onClick={() => submit(false)}
          className="tap-target"
          style={{ flex: 1, height: "40px", backgroundColor: "#101822", border: "1px solid #172134", color: "#7d8fa8", fontWeight: 600, fontSize: "13px", borderRadius: "8px", cursor: "pointer" }}
        >
          ⏳ Still working
        </button>
        <button
          onClick={() => setPhase("asking-issue")}
          className="tap-target"
          style={{ flex: 1, height: "40px", backgroundColor: "#1a0a0a", border: "1px solid #3a1515", color: "#ef4444", fontWeight: 600, fontSize: "13px", borderRadius: "8px", cursor: "pointer" }}
        >
          ✗ Didn&apos;t fix it
        </button>
      </div>
    </div>
  );
}
