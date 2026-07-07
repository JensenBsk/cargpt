import Link from "next/link";

// Shared type treatments — one eyebrow style, one headline style, used
// everywhere so the page reads as a system instead of a collage.
const eyebrow: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  color: "#4a5c72",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const h2Style: React.CSSProperties = {
  fontFamily: "var(--font-barlow), sans-serif",
  fontWeight: 700,
  fontSize: "30px",
  color: "#f8fafc",
  margin: "8px 0 0",
  lineHeight: 1.1,
};

export default function LandingPage() {
  return (
    <div style={{ backgroundColor: "#0a0d14", color: "#f8fafc", fontFamily: "var(--font-ibm), sans-serif", overflowX: "hidden" }}>

      {/* ── HEADER ── */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 20px",
        borderBottom: "1px solid #1e2433",
        background: "rgba(10,13,20,0.95)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <span style={{ fontFamily: "var(--font-barlow), sans-serif", fontWeight: 700, fontSize: "20px", letterSpacing: "0.04em", color: "white" }}>
          CARLOS
        </span>
        <Link href="/diagnose" style={{
          background: "#4a9eff",
          color: "white",
          border: "none",
          borderRadius: "8px",
          padding: "8px 16px",
          fontSize: "14px",
          fontWeight: 600,
          textDecoration: "none",
          display: "inline-block",
        }}>
          Open Carlos
        </Link>
      </header>

      {/* ── HERO ── */}
      <section style={{
        padding: "44px 20px 48px",
        textAlign: "center",
        maxWidth: "560px",
        margin: "0 auto",
        background: "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(59,130,246,0.07), transparent 60%)",
      }}>
        {/* The one hero appearance of Carlos */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/carlos/carlos-hero.webp"
          alt="Carlos, your AI mechanic"
          style={{
            height: "150px",
            width: "auto",
            display: "block",
            margin: "0 auto 20px",
            filter: "drop-shadow(0 10px 24px rgba(0,0,0,0.5))",
          }}
        />

        <h1 style={{
          fontFamily: "var(--font-barlow), sans-serif",
          fontWeight: 800,
          fontSize: "clamp(34px, 8.5vw, 50px)",
          lineHeight: 1.06,
          color: "#f8fafc",
          margin: "0 0 14px",
        }}>
          Your car has a problem.<br />
          <span style={{ color: "#4a9eff" }}>Carlos has the answer.</span>
        </h1>

        <p style={{ fontSize: "16px", color: "#8b95a8", lineHeight: 1.65, margin: "0 0 28px", maxWidth: "420px", display: "inline-block" }}>
          Describe the symptom, paste a code, or plug in a scanner.
          Carlos tells you what&apos;s wrong, how urgent it is, and what a fair fix costs.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
          <Link
            href="/diagnose"
            className="cta-button"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              maxWidth: "340px",
              height: "54px",
              background: "#4a9eff",
              color: "white",
              fontWeight: 700,
              fontSize: "17px",
              borderRadius: "12px",
              textDecoration: "none",
            }}
          >
            Ask Carlos — Free
          </Link>
          <Link href="/diagnose?tab=quote" style={{ fontSize: "14px", color: "#5d7290", textDecoration: "none" }}>
            Or check a repair quote →
          </Link>
          <p style={{ fontSize: "13px", color: "#4a5c72", margin: "4px 0 0" }}>
            No account needed · 3 free diagnoses a month
          </p>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "48px 20px", backgroundColor: "#0d1018", borderTop: "1px solid #1e2433", borderBottom: "1px solid #1e2433" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <span style={eyebrow}>How it works</span>
            <h2 style={h2Style}>Carlos thinks like a mechanic.</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              {
                n: "1",
                title: "Tell Carlos what's wrong",
                body: "Year, make, model — then describe the symptom, paste the code, or snap a photo of the dash.",
              },
              {
                n: "2",
                title: "He analyzes your specific car",
                body: "Known issues for your exact vehicle, your symptoms, and real repair data, ranked by likelihood.",
              },
              {
                n: "3",
                title: "You get a real action plan",
                body: "Ranked causes, step-by-step checks, honest cost ranges. Everything to walk into the shop prepared.",
              },
            ].map((step) => (
              <div key={step.n} style={{
                background: "#12161f",
                border: "1px solid #1e2433",
                borderRadius: "14px",
                padding: "16px",
                display: "flex",
                alignItems: "flex-start",
                gap: "14px",
              }}>
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "10px",
                  flexShrink: 0,
                  backgroundColor: "rgba(74,158,255,0.1)",
                  border: "1px solid rgba(74,158,255,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#4a9eff",
                  fontWeight: 700,
                  fontSize: "15px",
                }}>{step.n}</div>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "#f8fafc", marginBottom: "4px" }}>{step.title}</div>
                  <p style={{ margin: 0, fontSize: "14px", color: "#8b95a8", lineHeight: 1.55 }}>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EXAMPLE DIAGNOSIS ── */}
      <section id="example" style={{ padding: "48px 20px", maxWidth: "560px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <span style={eyebrow}>Real output</span>
          <h2 style={h2Style}>This is what Carlos gives you.</h2>
        </div>

        {/* Safety verdict */}
        <div style={{ backgroundColor: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.35)", borderRadius: "14px", padding: "16px 20px", marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <div>
            <div style={{ ...eyebrow, fontSize: "10px", marginBottom: "3px" }}>Drive safety</div>
            <div style={{ fontSize: "14px", color: "#8b95a8" }}>Safe to drive short distances. Avoid highway speeds.</div>
          </div>
          <div style={{ flexShrink: 0, backgroundColor: "rgba(245,158,11,0.14)", border: "1px solid rgba(245,158,11,0.4)", borderRadius: "8px", padding: "6px 12px" }}>
            <span style={{ fontFamily: "var(--font-barlow), sans-serif", fontWeight: 800, fontSize: "16px", textTransform: "uppercase" as const, color: "#f59e0b", letterSpacing: "0.04em" }}>Caution</span>
          </div>
        </div>

        {/* Top cause */}
        <div style={{ backgroundColor: "#12161f", border: "1px solid #1e2433", borderLeft: "3px solid #4a9eff", borderRadius: "10px", padding: "16px", marginBottom: "12px" }}>
          <div style={{ ...eyebrow, fontSize: "10px", marginBottom: "4px" }}>Most likely cause</div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc", marginBottom: "8px" }}>Ignition coil failing</div>
          <p style={{ margin: "0 0 8px", fontSize: "14px", color: "#8b95a8", lineHeight: 1.6 }}>The ignition coil creates the spark to fire each cylinder. When one fails, that cylinder misfires — causing rough running, especially on cold starts or under load.</p>
          <span style={{ backgroundColor: "rgba(59,130,246,0.14)", color: "#4a9eff", fontSize: "11px", fontWeight: 500, padding: "2px 8px", borderRadius: "20px" }}>Most likely</span>
        </div>

        {/* Diagnostic step */}
        <div style={{ backgroundColor: "#12161f", border: "1px solid #1e2433", borderRadius: "10px", padding: "16px", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <div style={{ width: "26px", height: "26px", borderRadius: "8px", backgroundColor: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "13px", fontWeight: 700, color: "#4a9eff" }}>1</div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#f8fafc" }}>Swap coils between cylinders</div>
          </div>
          <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#8b95a8", lineHeight: 1.5 }}>If the misfire follows the coil to the new cylinder, you&apos;ve confirmed the coil is bad.</p>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
            {["Free", "20 min", "No tools"].map((pill) => (
              <span key={pill} style={{ display: "inline-flex", alignItems: "center", backgroundColor: "#0a0d14", border: "1px solid #1e2433", borderRadius: "20px", padding: "3px 9px", fontSize: "11px", color: "#8b95a8" }}>{pill}</span>
            ))}
          </div>
        </div>

        {/* Cost estimate */}
        <div style={{ backgroundColor: "#12161f", border: "1px solid #1e2433", borderRadius: "10px", padding: "14px 16px" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#f8fafc", marginBottom: "10px" }}>Ignition coil replacement</div>
          <div style={{ display: "flex", gap: "12px", marginBottom: "10px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ ...eyebrow, fontSize: "9px", marginBottom: "3px" }}>Parts</div>
              <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "13px", color: "#8b95a8" }}>$25–$60</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ ...eyebrow, fontSize: "9px", marginBottom: "3px" }}>Labor</div>
              <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "13px", color: "#8b95a8" }}>$40–$80</div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid #1e2433", paddingTop: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ ...eyebrow, fontSize: "9px" }}>Total</div>
            <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "16px", color: "#4a9eff", fontWeight: 700 }}>$65–$140</div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: "48px 20px", backgroundColor: "#0d1018", borderTop: "1px solid #1e2433", borderBottom: "1px solid #1e2433" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <span style={eyebrow}>What Carlos can do</span>
            <h2 style={h2Style}>One mechanic. Six jobs.</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              {
                title: "Diagnose any code",
                body: "Paste any P0xxx, C0xxx, or B1xxx code and get plain English with ranked fixes.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="2" y="4" width="16" height="12" rx="2" stroke="#4a9eff" strokeWidth="1.5" />
                    <path d="M6 10h8M6 13h4" stroke="#4a9eff" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                title: "Read your car over Bluetooth",
                body: "Pair a $30 OBD2 adapter and Carlos pulls trouble codes and live engine data straight from the ECU.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 3v14l4.5-3.5L6 7m4-4l4.5 3.5L6 13" stroke="#4a9eff" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                title: "Check a repair quote",
                body: "Paste or photograph the estimate. Carlos flags what's fair, what's high, and what's a red flag.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M4 5h12v2H4zM4 9h8v2H4zM4 13h10" stroke="#4a9eff" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M14.5 14.5l1 1 2-2" stroke="#22c55e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
              },
              {
                title: "Analyze photos",
                body: "Snap your dashboard lights or engine bay and Carlos reads what he sees.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="2" y="5" width="16" height="12" rx="2" stroke="#4a9eff" strokeWidth="1.5" />
                    <circle cx="10" cy="11" r="3" stroke="#4a9eff" strokeWidth="1.5" />
                    <path d="M7 5l1.5-2h3L13 5" stroke="#4a9eff" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                title: "Identify a noise",
                body: "Record the knock, squeal, or rattle. Carlos factors the sound into the diagnosis.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="8" r="3" stroke="#4a9eff" strokeWidth="1.5" />
                    <path d="M10 11v5M7 18h6" stroke="#4a9eff" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                title: "Keep a garage",
                body: "Save your cars, track what you fixed and what it cost, get maintenance reminders.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M3 8l7-5 7 5v9H3V8z" stroke="#4a9eff" strokeWidth="1.5" strokeLinejoin="round" />
                    <rect x="7" y="12" width="6" height="5" rx="1" stroke="#4a9eff" strokeWidth="1.2" />
                  </svg>
                ),
              },
            ].map((feat) => (
              <div key={feat.title} style={{ backgroundColor: "#0a0d14", border: "1px solid #1e2433", borderRadius: "14px", padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: "14px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0, backgroundColor: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {feat.icon}
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#f8fafc", marginBottom: "3px" }}>{feat.title}</div>
                  <p style={{ margin: 0, fontSize: "13px", color: "#8b95a8", lineHeight: 1.5 }}>{feat.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST ── */}
      <section style={{ padding: "28px 20px", maxWidth: "560px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: "clamp(16px, 5vw, 40px)", flexWrap: "wrap" as const }}>
          {["Powered by Claude AI", "Your data is never sold"].map((item) => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="#4a9eff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontSize: "13px", color: "#8b95a8", whiteSpace: "nowrap" as const }}>{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{
        textAlign: "center",
        padding: "48px 24px 64px",
        maxWidth: "480px",
        margin: "0 auto",
      }}>
        <h2 style={{ fontFamily: "var(--font-barlow), sans-serif", fontSize: "42px", fontWeight: 700, color: "white", margin: "0 0 16px", lineHeight: 1.12 }}>
          Don&apos;t guess. <span style={{ color: "#4a9eff" }}>Ask Carlos.</span>
        </h2>
        <p style={{ color: "#8b95a8", fontSize: "16px", marginBottom: "28px", lineHeight: 1.6 }}>
          Know what&apos;s wrong — and what it should cost —
          before you ever talk to a mechanic.
        </p>
        <Link
          href="/diagnose"
          className="cta-button"
          style={{
            background: "#4a9eff",
            color: "white",
            border: "none",
            borderRadius: "12px",
            padding: "16px 32px",
            fontSize: "17px",
            fontWeight: 700,
            textDecoration: "none",
            display: "inline-block",
            width: "100%",
            maxWidth: "320px",
            boxSizing: "border-box" as const,
            textAlign: "center" as const,
          }}
        >
          Ask Carlos — Free
        </Link>
        <p style={{ color: "#4a5c72", fontSize: "13px", marginTop: "12px" }}>
          Takes under a minute. No card needed.
        </p>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid #1e2433", padding: "24px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/carlos/carlos-icon.webp" alt="" style={{ width: "24px", height: "24px", borderRadius: "6px", opacity: 0.4 }} />
          <span style={{ fontFamily: "var(--font-barlow), sans-serif", fontWeight: 700, fontSize: "14px", letterSpacing: "0.04em", color: "#374151" }}>CARLOS</span>
        </div>
        <div style={{ display: "flex", gap: "20px" }}>
          <Link href="/diagnose" style={{ fontSize: "12px", color: "#374151", textDecoration: "none" }}>App</Link>
          <Link href="/pricing" style={{ fontSize: "12px", color: "#374151", textDecoration: "none" }}>Pricing</Link>
          <Link href="/privacy" style={{ fontSize: "12px", color: "#374151", textDecoration: "none" }}>Privacy</Link>
          <Link href="/terms" style={{ fontSize: "12px", color: "#374151", textDecoration: "none" }}>Terms</Link>
        </div>
        <div style={{ fontSize: "11px", color: "#1c2a3e", textAlign: "center" }}>
          © {new Date().getFullYear()} Mechanic Carlos · mchaniccarlos.com
        </div>
      </footer>

    </div>
  );
}
