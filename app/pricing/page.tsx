"use client";

import { useState } from "react";
import Link from "next/link";
import { redirectToCheckout } from "@/hooks/useSubscription";

const PRO_MONTHLY = process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID ?? "";
const PRO_ANNUAL = process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID ?? "";
const ENT_MONTHLY = process.env.NEXT_PUBLIC_STRIPE_ENTHUSIAST_MONTHLY_PRICE_ID ?? "";
const ENT_ANNUAL = process.env.NEXT_PUBLIC_STRIPE_ENTHUSIAST_ANNUAL_PRICE_ID ?? "";

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleUpgrade(tier: "pro" | "enthusiast") {
    const priceId = tier === "pro"
      ? (annual ? PRO_ANNUAL : PRO_MONTHLY)
      : (annual ? ENT_ANNUAL : ENT_MONTHLY);

    if (!priceId) return;
    setLoading(tier);
    try {
      await redirectToCheckout(priceId);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "#060810", color: "#dce8f5", fontFamily: "var(--font-ibm), sans-serif", overflowX: "hidden" }}>

      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 40, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: "52px", backgroundColor: "rgba(6,8,16,0.95)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid #172134" }}>
        <Link href="/" style={{ fontFamily: "var(--font-barlow), sans-serif", fontWeight: 800, fontSize: "18px", letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "#dce8f5", textDecoration: "none" }}>TORQUE</Link>
        <Link href="/diagnose" style={{ fontSize: "13px", color: "#4a5c72", textDecoration: "none" }}>← Back to app</Link>
      </nav>

      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "48px 20px 64px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{ fontFamily: "var(--font-barlow), sans-serif", fontWeight: 800, fontSize: "clamp(32px, 7vw, 44px)", textTransform: "uppercase" as const, color: "#dce8f5", margin: "0 0 12px", lineHeight: 1.05 }}>
            Simple Pricing
          </h1>
          <p style={{ fontSize: "15px", color: "#7d8fa8", margin: 0, lineHeight: 1.6 }}>Start free. Upgrade when you need more.</p>
        </div>

        {/* Annual toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "32px" }}>
          <span style={{ fontSize: "14px", color: annual ? "#4a5c72" : "#dce8f5" }}>Monthly</span>
          <button
            onClick={() => setAnnual(!annual)}
            style={{ width: "48px", height: "26px", borderRadius: "13px", backgroundColor: annual ? "#4a9eff" : "#172134", border: "none", position: "relative", cursor: "pointer", transition: "background-color 200ms" }}
          >
            <div style={{ position: "absolute", top: "3px", left: annual ? "25px" : "3px", width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "white", transition: "left 200ms ease", boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }} />
          </button>
          <span style={{ fontSize: "14px", color: annual ? "#dce8f5" : "#4a5c72", display: "flex", alignItems: "center", gap: "6px" }}>
            Annual
            <span style={{ fontSize: "11px", fontWeight: 700, backgroundColor: "rgba(34,197,94,0.12)", color: "#22c55e", padding: "1px 6px", borderRadius: "20px" }}>Save 40%</span>
          </span>
        </div>

        {/* Plan cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

          {/* Free */}
          <div style={{ backgroundColor: "#0b1019", border: "1px solid #172134", borderRadius: "16px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#4a5c72", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: "4px" }}>Free</div>
                <div style={{ fontFamily: "var(--font-barlow), sans-serif", fontWeight: 800, fontSize: "36px", color: "#dce8f5", lineHeight: 1 }}>$0</div>
                <div style={{ fontSize: "12px", color: "#4a5c72", marginTop: "2px" }}>forever</div>
              </div>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {["3 diagnoses / month", "OBD code lookup", "Cost estimates", "AI follow-up questions", "Quote checker"].map(f => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#7d8fa8" }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3 3 6-6" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/diagnose" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "44px", backgroundColor: "#101822", border: "1px solid #172134", borderRadius: "10px", color: "#7d8fa8", fontSize: "14px", fontWeight: 600, textDecoration: "none" }}>
              Get started free
            </Link>
          </div>

          {/* Pro */}
          <div style={{ backgroundColor: "#0b1019", border: "2px solid rgba(74,158,255,0.4)", borderRadius: "16px", padding: "24px", position: "relative" as const }}>
            <div style={{ position: "absolute" as const, top: "-12px", left: "20px", backgroundColor: "#4a9eff", color: "white", fontSize: "11px", fontWeight: 700, padding: "3px 12px", borderRadius: "20px", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>Most Popular</div>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#4a9eff", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: "4px" }}>Pro</div>
                <div style={{ fontFamily: "var(--font-barlow), sans-serif", fontWeight: 800, fontSize: "36px", color: "#dce8f5", lineHeight: 1 }}>
                  {annual ? "$4.08" : "$6.99"}
                </div>
                <div style={{ fontSize: "12px", color: "#4a5c72", marginTop: "2px" }}>/month{annual ? " · billed $49/yr" : ""}</div>
              </div>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                "Everything in Free",
                "Unlimited diagnoses",
                "Photo upload for quotes",
                "Up to 3 cars in garage",
                "Diagnosis history sync",
                "Priority AI model",
              ].map(f => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#7d8fa8" }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3 3 6-6" stroke="#4a9eff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleUpgrade("pro")}
              disabled={loading === "pro" || !PRO_MONTHLY}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "44px", background: "linear-gradient(135deg, #4a9eff 0%, #2d6fd6 100%)", color: "white", fontSize: "14px", fontWeight: 700, border: "none", borderRadius: "10px", cursor: loading === "pro" || !PRO_MONTHLY ? "default" : "pointer", opacity: loading === "pro" ? 0.7 : 1, boxShadow: "0 4px 16px rgba(74,158,255,0.28)" }}
            >
              {loading === "pro" ? "Redirecting…" : `Upgrade to Pro — ${annual ? "$49/yr" : "$6.99/mo"}`}
            </button>
          </div>

          {/* Enthusiast */}
          <div style={{ backgroundColor: "#0b1019", border: "1px solid #f59e0b40", borderRadius: "16px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: "4px" }}>Enthusiast</div>
                <div style={{ fontFamily: "var(--font-barlow), sans-serif", fontWeight: 800, fontSize: "36px", color: "#dce8f5", lineHeight: 1 }}>
                  {annual ? "$8.25" : "$14.99"}
                </div>
                <div style={{ fontSize: "12px", color: "#4a5c72", marginTop: "2px" }}>/month{annual ? " · billed $99/yr" : ""}</div>
              </div>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                "Everything in Pro",
                "Unlimited cars in garage",
                "Full modified car mode",
                "Advanced OBD analysis",
                "Parts finder with OEM numbers",
                "Early access to new features",
              ].map(f => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#7d8fa8" }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3 3 6-6" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleUpgrade("enthusiast")}
              disabled={loading === "enthusiast" || !ENT_MONTHLY}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "44px", backgroundColor: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.4)", color: "#f59e0b", fontSize: "14px", fontWeight: 700, borderRadius: "10px", cursor: loading === "enthusiast" || !ENT_MONTHLY ? "default" : "pointer", opacity: loading === "enthusiast" ? 0.7 : 1 }}
            >
              {loading === "enthusiast" ? "Redirecting…" : `Upgrade to Enthusiast — ${annual ? "$99/yr" : "$14.99/mo"}`}
            </button>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ marginTop: "40px", padding: "24px", backgroundColor: "#0b1019", border: "1px solid #172134", borderRadius: "14px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#4a5c72", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: "16px" }}>Common Questions</div>
          {[
            ["Can I cancel anytime?", "Yes — cancel in your account portal and you keep access until the end of your billing period."],
            ["What counts as a diagnosis?", "Each time you hit Diagnose and get a result. Follow-up AI chat questions in the same session don't count."],
            ["Do I need an account to use Free?", "No. Free diagnoses work without signing in. Create an account to save history and sync across devices."],
          ].map(([q, a]) => (
            <div key={q} style={{ marginBottom: "14px" }}>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#dce8f5", marginBottom: "4px" }}>{q}</div>
              <div style={{ fontSize: "13px", color: "#7d8fa8", lineHeight: 1.6 }}>{a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
