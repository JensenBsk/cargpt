"use client";

import { useState } from "react";

const CARDS = [
  {
    icon: "🔧",
    title: "Your AI mechanic",
    body: "Tell us your code or symptom. Get a real answer in seconds — not a list of possibilities.",
  },
  {
    icon: "💰",
    title: "Stop overpaying",
    body: "Paste your mechanic's quote. We'll tell you what's fair and what isn't.",
  },
  {
    icon: "🚗",
    title: "Your garage, your history",
    body: "Save your cars and track repairs over time. No subscription needed to get started.",
  },
];

interface Props {
  onDone: () => void;
}

export default function OnboardingCarousel({ onDone }: Props) {
  const [idx, setIdx] = useState(0);

  function advance() {
    if (idx < CARDS.length - 1) setIdx(idx + 1);
    else onDone();
  }

  const card = CARDS[idx];

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "#060810", zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <button
        onClick={onDone}
        style={{ position: "absolute", top: "20px", right: "20px", fontSize: "13px", color: "#4a5c72", backgroundColor: "transparent", border: "none", cursor: "pointer", padding: "8px 12px" }}
      >
        Skip
      </button>

      <div key={idx} className="view-enter" style={{ width: "100%", maxWidth: "340px", textAlign: "center" }}>
        <div style={{ fontSize: "64px", marginBottom: "24px", lineHeight: 1 }}>{card.icon}</div>
        <h2 style={{ fontSize: "26px", fontWeight: 700, color: "#dce8f5", margin: "0 0 12px", letterSpacing: "-0.02em", lineHeight: 1.2 }}>{card.title}</h2>
        <p style={{ fontSize: "16px", color: "#7d8fa8", lineHeight: 1.65, margin: "0 0 40px" }}>{card.body}</p>
      </div>

      <div style={{ display: "flex", gap: "6px", marginBottom: "32px" }}>
        {CARDS.map((_, i) => (
          <div
            key={i}
            style={{ width: i === idx ? "20px" : "6px", height: "6px", borderRadius: "3px", backgroundColor: i === idx ? "#4a9eff" : "#172134", transition: "width 200ms ease, background-color 200ms ease" }}
          />
        ))}
      </div>

      <button
        onClick={advance}
        style={{ width: "100%", maxWidth: "340px", height: "54px", backgroundColor: "#4a9eff", color: "white", fontWeight: 600, fontSize: "16px", border: "none", borderRadius: "12px", cursor: "pointer", boxShadow: "0 4px 20px rgba(74,158,255,0.3)" }}
      >
        {idx === CARDS.length - 1 ? "Get Started" : "Next →"}
      </button>
    </div>
  );
}
