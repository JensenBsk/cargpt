"use client";

import { useState } from "react";

const CARDS = [
  {
    img: "/carlos/carlos-hero.png",
    alt: "Meet Carlos",
    title: "Meet Carlos",
    body: "Your AI mechanic. Tell him what's wrong and he figures it out — ranked causes, step-by-step checks, real cost estimates. In seconds. Free.",
  },
  {
    img: "/carlos/carlos-reading.png",
    alt: "Carlos checking your quote",
    title: "Never overpay again",
    body: "Paste your mechanic's quote. Carlos tells you what's fair, what's high, and what's a red flag — before you approve anything.",
  },
  {
    img: "/carlos/carlos-waving.png",
    alt: "Carlos welcoming you",
    title: "Your garage, remembered",
    body: "Save your cars. Track repairs over time. Get maintenance reminders before things go wrong. Carlos has your back.",
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={card.img}
          alt={card.alt}
          style={{
            height: "180px",
            width: "auto",
            margin: "0 auto 24px",
            display: "block",
            filter: "drop-shadow(0 8px 24px rgba(59,130,246,0.3)) drop-shadow(0 2px 8px rgba(0,0,0,0.4))",
          }}
        />
        <h2 style={{ fontSize: "26px", fontWeight: 700, color: "#dce8f5", margin: "0 0 12px", letterSpacing: "-0.02em", lineHeight: 1.2 }}>{card.title}</h2>
        <p style={{ fontSize: "15px", color: "#9ca3af", lineHeight: 1.7, margin: "0 0 40px" }}>{card.body}</p>
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
