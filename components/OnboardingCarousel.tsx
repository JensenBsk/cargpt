"use client";

import { useState } from "react";

const CARDS = [
  {
    img: "/carlos/carlos-hero.webp",
    alt: "Meet Carlos",
    title: "Meet Carlos",
    body: "Your AI mechanic. Tell him what's wrong and he figures it out — ranked causes, step-by-step checks, real cost estimates. In seconds. Free.",
  },
  {
    img: "/carlos/carlos-reading.webp",
    alt: "Carlos checking your quote",
    title: "Never overpay again",
    body: "Paste your mechanic's quote. Carlos tells you what's fair, what's high, and what's a red flag — before you approve anything.",
  },
  {
    img: "/carlos/carlos-waving.webp",
    alt: "Carlos welcoming you",
    title: "Your garage, remembered",
    body: "Save your cars. Track repairs over time. Get maintenance reminders before things go wrong. Carlos has your back.",
  },
  // Required AI disclosure — must be seen before first use (App Store
  // guideline on AI transparency). Skip lands here; it can't be bypassed.
  {
    img: "/carlos/carlos-thumbsup.webp",
    alt: "Carlos giving a thumbs up",
    title: "One honest thing first",
    body: "Carlos is an AI assistant powered by Claude. His diagnoses are smart estimates, not certainties — and he's not a substitute for a qualified mechanic. For safety-critical problems, always get professional eyes on your car.",
  },
];

const DISCLOSURE_IDX = CARDS.length - 1;

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
    <div style={{ position: "fixed", inset: 0, backgroundColor: "var(--bg)", zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      {idx < DISCLOSURE_IDX && (
        <button
          onClick={() => setIdx(DISCLOSURE_IDX)}
          style={{ position: "absolute", top: "20px", right: "20px", fontSize: "13px", color: "var(--text-3)", backgroundColor: "transparent", border: "none", cursor: "pointer", padding: "8px 12px" }}
        >
          Skip
        </button>
      )}

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
        <h2 style={{ fontSize: "26px", fontWeight: 700, color: "var(--text)", margin: "0 0 12px", letterSpacing: "-0.02em", lineHeight: 1.2 }}>{card.title}</h2>
        <p style={{ fontSize: "15px", color: "#9ca3af", lineHeight: 1.7, margin: "0 0 40px" }}>{card.body}</p>
      </div>

      <div style={{ display: "flex", gap: "6px", marginBottom: "32px" }}>
        {CARDS.map((_, i) => (
          <div
            key={i}
            style={{ width: i === idx ? "20px" : "6px", height: "6px", borderRadius: "3px", backgroundColor: i === idx ? "var(--accent)" : "var(--border)", transition: "width 200ms ease, background-color 200ms ease" }}
          />
        ))}
      </div>

      <button
        onClick={advance}
        style={{ width: "100%", maxWidth: "340px", height: "54px", backgroundColor: "var(--accent)", color: "white", fontWeight: 600, fontSize: "16px", border: "none", borderRadius: "12px", cursor: "pointer", boxShadow: "0 4px 20px rgba(74,158,255,0.3)" }}
      >
        {idx === CARDS.length - 1 ? "Got it — let's go" : "Next →"}
      </button>
    </div>
  );
}
