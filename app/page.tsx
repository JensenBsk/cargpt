import Link from "next/link";

export default function LandingPage() {
  return (
    <div style={{ backgroundColor: "#060810", color: "#dce8f5", fontFamily: "var(--font-ibm), sans-serif", overflowX: "hidden" }}>

      {/* ── NAV ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 40, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: "52px", backgroundColor: "rgba(6,8,16,0.95)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid #172134" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Torque logo mark */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#4a9eff" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="4" fill="#4a9eff" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="#4a9eff" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
          </svg>
          <span style={{ fontFamily: "var(--font-barlow), sans-serif", fontWeight: 800, fontSize: "18px", letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "#dce8f5" }}>TORQUE</span>
        </div>
        <Link href="/diagnose" style={{ fontSize: "13px", fontWeight: 600, padding: "6px 14px", borderRadius: "20px", border: "1px solid rgba(74,158,255,0.4)", color: "#4a9eff", backgroundColor: "rgba(74,158,255,0.08)", textDecoration: "none" }}>
          Try it free
        </Link>
      </nav>

      {/* ── HERO ── */}
      <section style={{ padding: "64px 20px 56px", textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
        {/* Pill badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "rgba(74,158,255,0.08)", border: "1px solid rgba(74,158,255,0.22)", borderRadius: "20px", padding: "5px 12px", marginBottom: "24px" }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <circle cx="5" cy="5" r="4" fill="#4a9eff" opacity="0.8" />
            <circle cx="5" cy="5" r="2" fill="#4a9eff" />
          </svg>
          <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "11px", color: "#4a9eff", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>AI Mechanic · Free</span>
        </div>

        <h1 style={{ fontFamily: "var(--font-barlow), sans-serif", fontWeight: 800, fontSize: "clamp(38px, 9vw, 56px)", lineHeight: 1.05, letterSpacing: "-0.01em", textTransform: "uppercase" as const, color: "#dce8f5", margin: "0 0 20px" }}>
          Your car has a problem.<br />
          <span style={{ color: "#4a9eff" }}>We&apos;ll tell you exactly<br />what to do.</span>
        </h1>

        <p style={{ fontSize: "17px", color: "#7d8fa8", lineHeight: 1.6, margin: "0 0 36px", maxWidth: "440px", display: "inline-block" }}>
          Describe your symptom or paste an OBD code. Get ranked causes, step-by-step diagnosis, and real cost estimates — in seconds.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
          <Link href="/diagnose" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", maxWidth: "360px", height: "54px", background: "linear-gradient(135deg, #4a9eff 0%, #2d6fd6 100%)", color: "white", fontWeight: 700, fontSize: "16px", letterSpacing: "0.04em", borderRadius: "12px", textDecoration: "none", boxShadow: "0 6px 24px rgba(74,158,255,0.32)" }}>
            Diagnose My Car — Free
          </Link>
          <a href="#example" style={{ fontSize: "14px", color: "#4a5c72", textDecoration: "none" }}>See an example diagnosis ↓</a>
        </div>

        {/* Trust line */}
        <div style={{ marginTop: "28px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M5.5 1L6.8 4H10L7.5 6.1 8.4 9.5 5.5 7.5 2.6 9.5 3.5 6.1 1 4H4.2L5.5 1Z" fill="#4a5c72" />
          </svg>
          <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "10px", color: "#2d3f55", letterSpacing: "0.12em", textTransform: "uppercase" as const }}>No subscription · No account required · Your data is never sold</span>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "56px 20px", backgroundColor: "#0b1019", borderTop: "1px solid #172134", borderBottom: "1px solid #172134" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "10px", color: "#4a9eff", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" as const }}>How It Works</span>
            <h2 style={{ fontFamily: "var(--font-barlow), sans-serif", fontWeight: 800, fontSize: "32px", textTransform: "uppercase" as const, color: "#dce8f5", margin: "8px 0 0", letterSpacing: "-0.01em" }}>Three Steps. Real Answers.</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {[
              {
                n: "01",
                title: "Tell us your car and symptom",
                body: "Year, make, model. Then describe what's wrong — rough idle, warning light, weird noise — or paste your OBD code.",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <rect x="3" y="5" width="16" height="12" rx="2" stroke="#4a9eff" strokeWidth="1.5" />
                    <path d="M7 9h8M7 13h5" stroke="#4a9eff" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                n: "02",
                title: "AI analyzes your specific car",
                body: "Claude AI cross-references your vehicle's known issues, your symptoms, and real repair data to rank what's most likely wrong.",
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
                title: "Get your action plan",
                body: "Ranked causes, step-by-step diagnostic tests, honest cost ranges, and parts you might need — everything to go to a mechanic informed.",
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
          <h2 style={{ fontFamily: "var(--font-barlow), sans-serif", fontWeight: 800, fontSize: "32px", textTransform: "uppercase" as const, color: "#dce8f5", margin: "8px 0 0" }}>What You&apos;ll Get</h2>
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
            <h2 style={{ fontFamily: "var(--font-barlow), sans-serif", fontWeight: 800, fontSize: "32px", textTransform: "uppercase" as const, color: "#dce8f5", margin: "8px 0 0" }}>Built for Real Car Owners</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {[
              {
                title: "OBD Code Lookup",
                body: "Paste any P0xxx, C0xxx, or B1xxx code and get a plain-English explanation with ranked fixes.",
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
                title: "Photo Analysis",
                body: "Snap your dashboard warning lights or engine bay — AI will analyze what it sees visually.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="2" y="5" width="16" height="12" rx="2" stroke="#4a9eff" strokeWidth="1.5" />
                    <circle cx="10" cy="11" r="3" stroke="#4a9eff" strokeWidth="1.5" />
                    <path d="M7 5l1.5-2h3L13 5" stroke="#4a9eff" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                title: "Real Cost Estimates",
                body: "Parts cost, labor hours, and total range — based on your ZIP code and the actual repair involved.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="8" stroke="#4a9eff" strokeWidth="1.5" />
                    <path d="M10 5v2M10 13v2M7 10h6" stroke="#4a9eff" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M8 8.5c0-.8.9-1.5 2-1.5s2 .7 2 1.5-2 1.5-2 1.5" stroke="#4a9eff" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                title: "Mod-Aware Diagnosis",
                body: "List your mods and tune. Torque factors in aftermarket parts when ranking what's most likely wrong.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M4 10a6 6 0 1 1 12 0A6 6 0 0 1 4 10z" stroke="#4a9eff" strokeWidth="1.5" />
                    <path d="M10 7v3l2 2" stroke="#4a9eff" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M16 4l2-2M4 16l-2 2" stroke="#4a9eff" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
                  </svg>
                ),
              },
              {
                title: "Quote Checker",
                body: "Got a mechanic's estimate? Paste it and find out instantly if the price is fair, high, or a red flag.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M4 5h12v2H4zM4 9h8v2H4zM4 13h10" stroke="#4a9eff" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="16" cy="15" r="3" fill="rgba(74,158,255,0.15)" stroke="#4a9eff" strokeWidth="1.2" />
                    <path d="M15 15l.8.8 1.7-1.6" stroke="#4a9eff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
              },
              {
                title: "Ask Follow-Ups",
                body: "Once diagnosed, ask the AI anything about your repair — it remembers your exact situation.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M3 4h14v10H3z" stroke="#4a9eff" strokeWidth="1.5" strokeLinejoin="round" />
                    <path d="M7 14l-2 3h10l-2-3" stroke="#4a9eff" strokeWidth="1.5" strokeLinejoin="round" />
                    <path d="M7 8h6M7 11h4" stroke="#4a9eff" strokeWidth="1.5" strokeLinecap="round" />
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
          Don&apos;t guess.<br /><span style={{ color: "#4a9eff" }}>Know.</span>
        </h2>
        <p style={{ fontSize: "15px", color: "#7d8fa8", margin: "0 0 32px", lineHeight: 1.6 }}>
          Stop paying for diagnoses you didn&apos;t need. Stop going in blind. Torque tells you what&apos;s wrong before you ever talk to a mechanic.
        </p>
        <Link href="/diagnose" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "100%", maxWidth: "360px", height: "54px", background: "linear-gradient(135deg, #4a9eff 0%, #2d6fd6 100%)", color: "white", fontWeight: 700, fontSize: "16px", letterSpacing: "0.04em", borderRadius: "12px", textDecoration: "none", boxShadow: "0 6px 24px rgba(74,158,255,0.32)" }}>
          Diagnose My Car — Free
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
          <span style={{ fontFamily: "var(--font-barlow), sans-serif", fontWeight: 800, fontSize: "14px", letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#2d3f55" }}>TORQUE</span>
        </div>
        <div style={{ display: "flex", gap: "20px" }}>
          <Link href="/diagnose" style={{ fontSize: "12px", color: "#2d3f55", textDecoration: "none" }}>App</Link>
          <Link href="/pricing" style={{ fontSize: "12px", color: "#2d3f55", textDecoration: "none" }}>Pricing</Link>
          <Link href="/privacy" style={{ fontSize: "12px", color: "#2d3f55", textDecoration: "none" }}>Privacy</Link>
        </div>
        <div style={{ fontSize: "11px", color: "#1c2a3e", textAlign: "center" }}>
          © {new Date().getFullYear()} Torque. AI-powered diagnostics for real car owners.
        </div>
      </footer>

    </div>
  );
}
