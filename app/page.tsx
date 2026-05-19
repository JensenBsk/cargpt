import Link from "next/link";

export default function LandingPage() {
  return (
    <div style={{ backgroundColor: "#060810", color: "#dce8f5", fontFamily: "var(--font-ibm), sans-serif", overflowX: "hidden" }}>

      {/* ── NAV ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 40, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: "52px", backgroundColor: "rgba(6,8,16,0.95)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid #172134" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#4a9eff" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="4" fill="#4a9eff" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="#4a9eff" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
          </svg>
          <span style={{ fontFamily: "var(--font-barlow), sans-serif", fontWeight: 800, fontSize: "18px", letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "#dce8f5" }}>CARLOS</span>
        </div>
        <Link href="/diagnose" style={{ fontSize: "13px", fontWeight: 600, padding: "6px 14px", borderRadius: "20px", border: "1px solid rgba(74,158,255,0.4)", color: "#4a9eff", backgroundColor: "rgba(74,158,255,0.08)", textDecoration: "none" }}>
          Ask Carlos — Free
        </Link>
      </nav>

      {/* ── HERO ── */}
      <section style={{ padding: "64px 20px 56px", textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
        {/* Pill badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "rgba(74,158,255,0.08)", border: "1px solid rgba(74,158,255,0.22)", borderRadius: "20px", padding: "5px 12px", marginBottom: "24px" }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6.5L1 9l2-1 1 2 1-3.5" stroke="#4a9eff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 1h4v4" stroke="#4a9eff" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M6 6l5-5" stroke="#4a9eff" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "11px", color: "#4a9eff", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>AI Mechanic · Free · No Hardware Needed</span>
        </div>

        <h1 style={{ fontFamily: "var(--font-barlow), sans-serif", fontWeight: 800, fontSize: "clamp(38px, 9vw, 56px)", lineHeight: 1.05, letterSpacing: "-0.01em", textTransform: "uppercase" as const, color: "#dce8f5", margin: "0 0 20px" }}>
          Your car has a problem.<br />
          <span style={{ color: "#4a9eff" }}>Carlos knows<br />what to do.</span>
        </h1>

        <p style={{ fontSize: "17px", color: "#7d8fa8", lineHeight: 1.65, margin: "0 0 36px", maxWidth: "440px", display: "inline-block" }}>
          Describe your symptoms or paste an OBD code.<br />
          Carlos gives you a real answer — ranked causes,<br />
          step-by-step checks, and fair cost estimates.<br />
          In seconds. Free.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
          <Link href="/diagnose" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", maxWidth: "360px", height: "54px", background: "linear-gradient(135deg, #4a9eff 0%, #2d6fd6 100%)", color: "white", fontWeight: 700, fontSize: "16px", letterSpacing: "0.04em", borderRadius: "12px", textDecoration: "none", boxShadow: "0 6px 24px rgba(74,158,255,0.32)" }}>
            Ask Carlos — It&apos;s Free
          </Link>
          <Link href="/diagnose?tab=quote" style={{ fontSize: "14px", color: "#4a5c72", textDecoration: "none" }}>
            Check a Mechanic Quote →
          </Link>
        </div>

        {/* Trust line */}
        <div style={{ marginTop: "28px", fontFamily: "var(--font-jetbrains), monospace", fontSize: "10px", color: "#2d3f55", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>
          No account required · No credit card · No hardware to buy
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "56px 20px", backgroundColor: "#0b1019", borderTop: "1px solid #172134", borderBottom: "1px solid #172134" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "10px", color: "#4a9eff", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" as const }}>How It Works</span>
            <h2 style={{ fontFamily: "var(--font-barlow), sans-serif", fontWeight: 800, fontSize: "32px", textTransform: "uppercase" as const, color: "#dce8f5", margin: "8px 0 0" }}>Carlos thinks like a mechanic.</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {[
              {
                n: "01",
                title: "Tell Carlos what's wrong",
                body: "Your car year, make, and model. Then describe the symptom, paste the code, or snap a photo of your dashboard lights.",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <rect x="3" y="5" width="16" height="12" rx="2" stroke="#4a9eff" strokeWidth="1.5" />
                    <path d="M7 9h8M7 13h5" stroke="#4a9eff" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                n: "02",
                title: "Carlos analyzes your specific car",
                body: "Cross-referencing known issues for your exact vehicle, your symptoms, and real repair data to rank what's most likely wrong.",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <circle cx="11" cy="11" r="8" stroke="#4a9eff" strokeWidth="1.5" />
                    <circle cx="11" cy="11" r="3" fill="#4a9eff" opacity="0.5" />
                    <path d="M11 3v2M11 17v2M3 11h2M17 11h2" stroke="#4a9eff" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
                  </svg>
                ),
              },
              {
                n: "03",
                title: "You get a real action plan",
                body: "Ranked causes, step-by-step diagnostic tests, honest cost ranges, and parts you might need. Everything to go in prepared.",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M5 11l4 4 8-8" stroke="#4a9eff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="11" cy="11" r="8" stroke="#4a9eff" strokeWidth="1.5" />
                  </svg>
                ),
              },
            ].map((step) => (
              <div key={step.n} style={{ display: "flex", gap: "16px", alignItems: "flex-start", backgroundColor: "#060810", border: "1px solid #172134", borderRadius: "14px", padding: "20px" }}>
                <div style={{ flexShrink: 0, width: "44px", height: "44px", borderRadius: "12px", backgroundColor: "rgba(74,158,255,0.08)", border: "1px solid rgba(74,158,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {step.icon}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "10px", color: "#2d3f55", fontWeight: 700, letterSpacing: "0.1em" }}>{step.n}</span>
                    <span style={{ fontSize: "15px", fontWeight: 700, color: "#dce8f5" }}>{step.title}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: "14px", color: "#7d8fa8", lineHeight: 1.6 }}>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EXAMPLE DIAGNOSIS ── */}
      <section id="example" style={{ padding: "56px 20px", maxWidth: "600px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "10px", color: "#4a9eff", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" as const }}>Real Output</span>
          <h2 style={{ fontFamily: "var(--font-barlow), sans-serif", fontWeight: 800, fontSize: "32px", textTransform: "uppercase" as const, color: "#dce8f5", margin: "8px 0 0" }}>This is what Carlos actually gives you.</h2>
        </div>

        {/* Safety verdict */}
        <div style={{ backgroundColor: "rgba(245,158,11,0.08)", border: "2px solid rgba(245,158,11,0.4)", borderRadius: "14px", padding: "16px 20px", marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "9px", fontWeight: 700, color: "#4a5c72", letterSpacing: "0.15em", textTransform: "uppercase" as const, marginBottom: "3px" }}>Drive Safety</div>
            <div style={{ fontSize: "14px", color: "#7d8fa8" }}>Safe to drive short distances. Avoid highway speeds.</div>
          </div>
          <div style={{ flexShrink: 0, backgroundColor: "rgba(245,158,11,0.14)", border: "1px solid rgba(245,158,11,0.4)", borderRadius: "8px", padding: "6px 12px" }}>
            <span style={{ fontFamily: "var(--font-barlow), sans-serif", fontWeight: 800, fontSize: "18px", textTransform: "uppercase" as const, color: "#f59e0b", letterSpacing: "0.05em" }}>CAUTION</span>
          </div>
        </div>

        {/* Top cause */}
        <div style={{ backgroundColor: "#0b1019", border: "1px solid #172134", borderLeft: "3px solid #4a9eff", borderRadius: "10px", padding: "16px", marginBottom: "12px" }}>
          <div style={{ fontSize: "10px", color: "#4a5c72", textTransform: "uppercase" as const, letterSpacing: "0.08em", fontWeight: 600, marginBottom: "4px" }}>Most Likely Cause · Rank #1</div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: "#dce8f5", marginBottom: "8px" }}>Ignition coil failing</div>
          <p style={{ margin: "0 0 8px", fontSize: "14px", color: "#7d8fa8", lineHeight: 1.6 }}>The ignition coil is what creates the spark to fire each cylinder. When one fails, that cylinder misfires — causing rough running, especially on cold starts or under load.</p>
          <span style={{ backgroundColor: "rgba(74,158,255,0.14)", color: "#4a9eff", fontSize: "11px", fontWeight: 500, padding: "2px 8px", borderRadius: "20px" }}>Most Likely</span>
        </div>

        {/* Diagnostic step */}
        <div style={{ backgroundColor: "#0b1019", border: "1px solid #172134", borderRadius: "10px", padding: "16px", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <div style={{ width: "26px", height: "26px", borderRadius: "8px", backgroundColor: "rgba(74,158,255,0.1)", border: "1px solid rgba(74,158,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "var(--font-jetbrains), monospace", fontSize: "11px", fontWeight: 700, color: "#4a9eff" }}>1</div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#dce8f5" }}>Swap coils between cylinders</div>
          </div>
          <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#7d8fa8", lineHeight: 1.5 }}>If the misfire follows the coil to the new cylinder, you&apos;ve confirmed the coil is bad.</p>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
            {["Free", "20 min", "None"].map((pill) => (
              <span key={pill} style={{ display: "inline-flex", alignItems: "center", gap: "3px", backgroundColor: "#101822", border: "1px solid #172134", borderRadius: "20px", padding: "3px 9px", fontSize: "11px", color: "#7d8fa8" }}>{pill}</span>
            ))}
          </div>
        </div>

        {/* Cost estimate */}
        <div style={{ backgroundColor: "#101822", border: "1px solid #172134", borderRadius: "8px", padding: "12px" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#dce8f5", marginBottom: "8px" }}>Ignition coil replacement</div>
          <div style={{ display: "flex", gap: "12px", marginBottom: "8px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "9px", color: "#2d3f55", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: "3px", fontWeight: 600 }}>Parts</div>
              <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "12px", color: "#7d8fa8" }}>$25–$60</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "9px", color: "#2d3f55", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: "3px", fontWeight: 600 }}>Labor</div>
              <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "12px", color: "#7d8fa8" }}>$40–$80</div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid #172134", paddingTop: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: "9px", color: "#2d3f55", textTransform: "uppercase" as const, letterSpacing: "0.1em", fontWeight: 600 }}>Total</div>
            <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "16px", color: "#4a9eff", fontWeight: 700 }}>$65–$140</div>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section style={{ padding: "56px 20px", backgroundColor: "#0b1019", borderTop: "1px solid #172134", borderBottom: "1px solid #172134" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "10px", color: "#4a9eff", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" as const }}>Features</span>
            <h2 style={{ fontFamily: "var(--font-barlow), sans-serif", fontWeight: 800, fontSize: "32px", textTransform: "uppercase" as const, color: "#dce8f5", margin: "8px 0 0" }}>Everything Carlos can do.</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {[
              {
                title: "Diagnose Any Code",
                body: "Paste any P0xxx, C0xxx, or B1xxx code. Carlos explains it in plain English with ranked fixes.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="2" y="4" width="16" height="12" rx="2" stroke="#4a9eff" strokeWidth="1.5" />
                    <path d="M6 10h8M6 13h4" stroke="#4a9eff" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="15" cy="4" r="3" fill="#060810" stroke="#f59e0b" strokeWidth="1.5" />
                    <path d="M15 3v1.5l1 0.5" stroke="#f59e0b" strokeWidth="1" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                title: "Check Your Quote",
                body: "Paste the estimate. Carlos tells you what's fair, what's high, and what's a red flag.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M4 5h12v2H4zM4 9h8v2H4zM4 13h10" stroke="#4a9eff" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="16" cy="15" r="3" fill="rgba(74,158,255,0.15)" stroke="#4a9eff" strokeWidth="1.2" />
                    <path d="M15 15l.8.8 1.7-1.6" stroke="#4a9eff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
              },
              {
                title: "Photo Analysis",
                body: "Snap your dashboard lights or engine bay. Carlos analyzes what he sees.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="2" y="5" width="16" height="12" rx="2" stroke="#4a9eff" strokeWidth="1.5" />
                    <circle cx="10" cy="11" r="3" stroke="#4a9eff" strokeWidth="1.5" />
                    <path d="M7 5l1.5-2h3L13 5" stroke="#4a9eff" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                title: "Sound Recognition",
                body: "Record a knock, squeal, or rattle. Carlos identifies what it likely means.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="8" r="3" stroke="#4a9eff" strokeWidth="1.5" />
                    <path d="M10 11v5M7 18h6" stroke="#4a9eff" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M5 7c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="#4a9eff" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
                  </svg>
                ),
              },
              {
                title: "Your Garage",
                body: "Save your cars, track repairs over time, and get maintenance reminders.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M3 8l7-5 7 5v9H3V8z" stroke="#4a9eff" strokeWidth="1.5" strokeLinejoin="round" />
                    <rect x="7" y="12" width="6" height="5" rx="1" stroke="#4a9eff" strokeWidth="1.2" />
                  </svg>
                ),
              },
              {
                title: "No Hardware Needed",
                body: "Unlike FIXD or BlueDriver, Carlos works without any dongle or adapter.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 2a8 8 0 1 1 0 16A8 8 0 0 1 10 2z" stroke="#4a9eff" strokeWidth="1.5" />
                    <path d="M10 6v4l3 2" stroke="#4a9eff" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ),
              },
            ].map((feat) => (
              <div key={feat.title} style={{ backgroundColor: "#060810", border: "1px solid #172134", borderRadius: "14px", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "rgba(74,158,255,0.08)", border: "1px solid rgba(74,158,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {feat.icon}
                </div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#dce8f5", lineHeight: 1.3 }}>{feat.title}</div>
                <p style={{ margin: 0, fontSize: "12px", color: "#7d8fa8", lineHeight: 1.5 }}>{feat.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF STATS ── */}
      <section style={{ padding: "56px 20px", maxWidth: "600px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", textAlign: "center" }}>
          {[
            { stat: "20K+", label: "Diagnoses run" },
            { stat: "4.8★", label: "Accuracy rating" },
            { stat: "<10s", label: "Avg. response" },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontFamily: "var(--font-barlow), sans-serif", fontWeight: 800, fontSize: "clamp(28px, 6vw, 36px)", color: "#4a9eff", lineHeight: 1, marginBottom: "4px" }}>{s.stat}</div>
              <div style={{ fontSize: "12px", color: "#4a5c72", lineHeight: 1.3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <section style={{ padding: "32px 20px", backgroundColor: "#0b1019", borderTop: "1px solid #172134", borderBottom: "1px solid #172134" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: "clamp(16px, 5vw, 40px)", flexWrap: "wrap" as const }}>
            {[
              "Powered by Claude AI",
              "No account needed",
              "Free to use",
              "Data never sold",
            ].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="#4a9eff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ fontSize: "13px", color: "#7d8fa8", whiteSpace: "nowrap" as const }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: "64px 20px", textAlign: "center", maxWidth: "480px", margin: "0 auto" }}>
        <h2 style={{ fontFamily: "var(--font-barlow), sans-serif", fontWeight: 800, fontSize: "clamp(32px, 8vw, 44px)", textTransform: "uppercase" as const, color: "#dce8f5", margin: "0 0 16px", lineHeight: 1.05 }}>
          Don&apos;t guess.<br /><span style={{ color: "#4a9eff" }}>Ask Carlos.</span>
        </h2>
        <p style={{ fontSize: "15px", color: "#7d8fa8", margin: "0 0 32px", lineHeight: 1.6 }}>
          Stop paying for diagnoses you didn&apos;t need. Stop going in blind. Carlos tells you what&apos;s wrong before you ever talk to a mechanic.
        </p>
        <Link href="/diagnose" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "100%", maxWidth: "360px", height: "54px", background: "linear-gradient(135deg, #4a9eff 0%, #2d6fd6 100%)", color: "white", fontWeight: 700, fontSize: "16px", letterSpacing: "0.04em", borderRadius: "12px", textDecoration: "none", boxShadow: "0 6px 24px rgba(74,158,255,0.32)" }}>
          Ask Carlos — It&apos;s Free
        </Link>
        <div style={{ marginTop: "16px", fontFamily: "var(--font-jetbrains), monospace", fontSize: "11px", color: "#2d3f55", letterSpacing: "0.08em" }}>
          No sign-up · Works on any car · Free forever
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid #172134", padding: "24px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#2d3f55" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="4" fill="#2d3f55" />
          </svg>
          <span style={{ fontFamily: "var(--font-barlow), sans-serif", fontWeight: 800, fontSize: "14px", letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#2d3f55" }}>CARLOS</span>
        </div>
        <div style={{ display: "flex", gap: "20px" }}>
          <Link href="/diagnose" style={{ fontSize: "12px", color: "#2d3f55", textDecoration: "none" }}>App</Link>
          <Link href="/pricing" style={{ fontSize: "12px", color: "#2d3f55", textDecoration: "none" }}>Pricing</Link>
          <Link href="/privacy" style={{ fontSize: "12px", color: "#2d3f55", textDecoration: "none" }}>Privacy</Link>
        </div>
        <div style={{ fontSize: "11px", color: "#1c2a3e", textAlign: "center" }}>
          © {new Date().getFullYear()} Mechanic Carlos · mchaniccarlos.com
        </div>
      </footer>

    </div>
  );
}
