import Link from "next/link";

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
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/carlos/carlos-icon.png"
            alt=""
            style={{ width: "36px", height: "36px", borderRadius: "10px", boxShadow: "0 0 12px rgba(59,130,246,0.4)" }}
          />
          <span style={{ fontFamily: "var(--font-barlow), sans-serif", fontWeight: 700, fontSize: "20px", letterSpacing: "0.1em", color: "white" }}>
            CARLOS
          </span>
        </div>
        <Link href="/diagnose" style={{
          background: "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: "8px",
          padding: "8px 16px",
          fontSize: "14px",
          fontWeight: 600,
          textDecoration: "none",
          display: "inline-block",
        }}>
          Ask Carlos — Free
        </Link>
      </header>

      {/* ── HERO ── */}
      <section style={{
        padding: "48px 20px 0",
        textAlign: "center",
        maxWidth: "560px",
        margin: "0 auto",
        background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(59,130,246,0.15), transparent)",
      }}>
        {/* Carlos — first thing visible */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/carlos/carlos-hero.png"
          alt="Carlos your AI mechanic"
          className="carlos-float"
          style={{
            height: "220px",
            width: "auto",
            display: "block",
            margin: "0 auto 24px",
            filter: "drop-shadow(0 16px 40px rgba(59,130,246,0.4)) drop-shadow(0 4px 16px rgba(0,0,0,0.6))",
          }}
        />

        <h1 style={{
          fontFamily: "var(--font-barlow), sans-serif",
          fontWeight: 800,
          fontSize: "clamp(36px, 9vw, 54px)",
          lineHeight: 1.05,
          color: "#f8fafc",
          margin: "0 0 16px",
        }}>
          Your car has a problem.<br />
          <span style={{ color: "#3b82f6" }}>Carlos has the answer.</span>
        </h1>

        <p style={{ fontSize: "16px", color: "#8b95a8", lineHeight: 1.65, margin: "0 0 32px", maxWidth: "420px", display: "inline-block" }}>
          Describe what&apos;s wrong. Carlos diagnoses it in seconds —
          plain English, step-by-step, no hardware needed.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center", marginBottom: "20px" }}>
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
              background: "#3b82f6",
              color: "white",
              fontWeight: 700,
              fontSize: "17px",
              borderRadius: "12px",
              textDecoration: "none",
            }}
          >
            Ask Carlos — It&apos;s Free
          </Link>
          <Link href="/diagnose?tab=quote" style={{ fontSize: "14px", color: "#4b5563", textDecoration: "none" }}>
            Check a Mechanic Quote →
          </Link>
        </div>

        <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "11px", color: "#374151", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: "0", paddingBottom: "48px" }}>
          No account · No credit card · No hardware to buy
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "56px 20px", backgroundColor: "#0d1018", borderTop: "1px solid #1e2433", borderBottom: "1px solid #1e2433" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "10px", color: "#3b82f6", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" as const }}>How It Works</span>
            <h2 style={{ fontFamily: "var(--font-barlow), sans-serif", fontWeight: 800, fontSize: "32px", color: "#f8fafc", margin: "8px 0 0" }}>Carlos thinks like a mechanic.</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[
              {
                n: "01",
                img: "/carlos/carlos-waving.png",
                title: "Tell Carlos what's wrong",
                body: "Your car year, make, model. Describe the symptom, paste the code, or snap a photo of your dashboard lights.",
              },
              {
                n: "02",
                img: "/carlos/carlos-thinking.png",
                title: "Carlos analyzes your specific car",
                body: "Cross-referencing known issues for your exact vehicle, your symptoms, and real repair data to rank what's most likely wrong.",
              },
              {
                n: "03",
                img: "/carlos/carlos-thumbsup.png",
                title: "You get a real action plan",
                body: "Ranked causes, step-by-step checks, honest cost ranges, and parts you might need. Everything to go in prepared.",
              },
            ].map((step) => (
              <div key={step.n} style={{
                background: "#12161f",
                border: "1px solid #1e2433",
                borderRadius: "16px",
                padding: "24px 20px",
                display: "flex",
                flexDirection: "column" as const,
                alignItems: "center",
                textAlign: "center" as const,
                gap: "16px",
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={step.img}
                  alt=""
                  style={{ height: "80px", width: "auto", filter: "drop-shadow(0 4px 12px rgba(59,130,246,0.3))" }}
                />
                <div>
                  <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "10px", color: "#374151", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "6px" }}>{step.n}</div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#f8fafc", marginBottom: "8px" }}>{step.title}</div>
                  <p style={{ margin: 0, fontSize: "14px", color: "#8b95a8", lineHeight: 1.6 }}>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EXAMPLE DIAGNOSIS ── */}
      <section id="example" style={{ padding: "56px 20px", maxWidth: "560px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "10px", color: "#3b82f6", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" as const }}>Real Output</span>
          <h2 style={{ fontFamily: "var(--font-barlow), sans-serif", fontWeight: 800, fontSize: "32px", color: "#f8fafc", margin: "8px 0 0" }}>This is what Carlos actually gives you.</h2>
        </div>

        {/* Safety verdict */}
        <div style={{ backgroundColor: "rgba(245,158,11,0.08)", border: "2px solid rgba(245,158,11,0.4)", borderRadius: "14px", padding: "16px 20px", marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "9px", fontWeight: 700, color: "#4a5c72", letterSpacing: "0.15em", textTransform: "uppercase" as const, marginBottom: "3px" }}>Drive Safety</div>
            <div style={{ fontSize: "14px", color: "#8b95a8" }}>Safe to drive short distances. Avoid highway speeds.</div>
          </div>
          <div style={{ flexShrink: 0, backgroundColor: "rgba(245,158,11,0.14)", border: "1px solid rgba(245,158,11,0.4)", borderRadius: "8px", padding: "6px 12px" }}>
            <span style={{ fontFamily: "var(--font-barlow), sans-serif", fontWeight: 800, fontSize: "18px", textTransform: "uppercase" as const, color: "#f59e0b", letterSpacing: "0.05em" }}>CAUTION</span>
          </div>
        </div>

        {/* Top cause */}
        <div style={{ backgroundColor: "#12161f", border: "1px solid #1e2433", borderLeft: "3px solid #3b82f6", borderRadius: "10px", padding: "16px", marginBottom: "12px" }}>
          <div style={{ fontSize: "10px", color: "#4a5c72", textTransform: "uppercase" as const, letterSpacing: "0.08em", fontWeight: 600, marginBottom: "4px" }}>Most Likely Cause · Rank #1</div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc", marginBottom: "8px" }}>Ignition coil failing</div>
          <p style={{ margin: "0 0 8px", fontSize: "14px", color: "#8b95a8", lineHeight: 1.6 }}>The ignition coil creates the spark to fire each cylinder. When one fails, that cylinder misfires — causing rough running, especially on cold starts or under load.</p>
          <span style={{ backgroundColor: "rgba(59,130,246,0.14)", color: "#3b82f6", fontSize: "11px", fontWeight: 500, padding: "2px 8px", borderRadius: "20px" }}>Most Likely</span>
        </div>

        {/* Diagnostic step */}
        <div style={{ backgroundColor: "#12161f", border: "1px solid #1e2433", borderRadius: "10px", padding: "16px", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <div style={{ width: "26px", height: "26px", borderRadius: "8px", backgroundColor: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "var(--font-jetbrains), monospace", fontSize: "11px", fontWeight: 700, color: "#3b82f6" }}>1</div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#f8fafc" }}>Swap coils between cylinders</div>
          </div>
          <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#8b95a8", lineHeight: 1.5 }}>If the misfire follows the coil to the new cylinder, you&apos;ve confirmed the coil is bad.</p>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
            {["Free", "20 min", "None"].map((pill) => (
              <span key={pill} style={{ display: "inline-flex", alignItems: "center", gap: "3px", backgroundColor: "#0a0d14", border: "1px solid #1e2433", borderRadius: "20px", padding: "3px 9px", fontSize: "11px", color: "#8b95a8" }}>{pill}</span>
            ))}
          </div>
        </div>

        {/* Cost estimate */}
        <div style={{ backgroundColor: "#12161f", border: "1px solid #1e2433", borderRadius: "8px", padding: "12px" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#f8fafc", marginBottom: "8px" }}>Ignition coil replacement</div>
          <div style={{ display: "flex", gap: "12px", marginBottom: "8px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "9px", color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: "3px", fontWeight: 600 }}>Parts</div>
              <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "12px", color: "#8b95a8" }}>$25–$60</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "9px", color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: "3px", fontWeight: 600 }}>Labor</div>
              <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "12px", color: "#8b95a8" }}>$40–$80</div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid #1e2433", paddingTop: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: "9px", color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.1em", fontWeight: 600 }}>Total</div>
            <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "16px", color: "#3b82f6", fontWeight: 700 }}>$65–$140</div>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section style={{ padding: "56px 20px", backgroundColor: "#0d1018", borderTop: "1px solid #1e2433", borderBottom: "1px solid #1e2433" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>

          {/* Carlos speech bubble intro */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", marginBottom: "40px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/carlos/carlos-hero.png"
              alt=""
              style={{ height: "120px", width: "auto", filter: "drop-shadow(0 8px 20px rgba(59,130,246,0.3))" }}
            />
            <div style={{
              background: "#12161f",
              border: "1px solid #1e2433",
              borderRadius: "16px",
              padding: "14px 20px",
              maxWidth: "280px",
              position: "relative",
              textAlign: "center",
            }}>
              {/* Triangle pointing up to Carlos */}
              <div style={{
                position: "absolute",
                top: "-8px",
                left: "50%",
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "8px solid transparent",
                borderRight: "8px solid transparent",
                borderBottom: "8px solid #1e2433",
              }} />
              <p style={{ color: "#f8fafc", fontSize: "15px", margin: 0, lineHeight: 1.5 }}>
                &ldquo;Here&apos;s everything I can do for you.&rdquo;
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {[
              {
                title: "Diagnose Any Code",
                body: "Paste any P0xxx, C0xxx, or B1xxx code. Carlos explains it in plain English with ranked fixes.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="2" y="4" width="16" height="12" rx="2" stroke="#3b82f6" strokeWidth="1.5" />
                    <path d="M6 10h8M6 13h4" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="15" cy="4" r="3" fill="#0a0d14" stroke="#f59e0b" strokeWidth="1.5" />
                    <path d="M15 3v1.5l1 0.5" stroke="#f59e0b" strokeWidth="1" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                title: "Check Your Quote",
                body: "Paste the estimate. Carlos tells you what's fair, what's high, and what's a red flag.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M4 5h12v2H4zM4 9h8v2H4zM4 13h10" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="16" cy="15" r="3" fill="rgba(59,130,246,0.15)" stroke="#3b82f6" strokeWidth="1.2" />
                    <path d="M15 15l.8.8 1.7-1.6" stroke="#3b82f6" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
              },
              {
                title: "Photo Analysis",
                body: "Snap your dashboard lights or engine bay. Carlos analyzes what he sees.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="2" y="5" width="16" height="12" rx="2" stroke="#3b82f6" strokeWidth="1.5" />
                    <circle cx="10" cy="11" r="3" stroke="#3b82f6" strokeWidth="1.5" />
                    <path d="M7 5l1.5-2h3L13 5" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                title: "Sound Recognition",
                body: "Record a knock, squeal, or rattle. Carlos identifies what it likely means.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="8" r="3" stroke="#3b82f6" strokeWidth="1.5" />
                    <path d="M10 11v5M7 18h6" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M5 7c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="#3b82f6" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
                  </svg>
                ),
              },
              {
                title: "Your Garage",
                body: "Save your cars, track repairs over time, and get maintenance reminders.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M3 8l7-5 7 5v9H3V8z" stroke="#3b82f6" strokeWidth="1.5" strokeLinejoin="round" />
                    <rect x="7" y="12" width="6" height="5" rx="1" stroke="#3b82f6" strokeWidth="1.2" />
                  </svg>
                ),
              },
              {
                title: "No Hardware Needed",
                body: "Unlike FIXD or BlueDriver, Carlos works without any dongle or adapter.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 2a8 8 0 1 1 0 16A8 8 0 0 1 10 2z" stroke="#3b82f6" strokeWidth="1.5" />
                    <path d="M10 6v4l3 2" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ),
              },
            ].map((feat) => (
              <div key={feat.title} style={{ backgroundColor: "#0a0d14", border: "1px solid #1e2433", borderRadius: "14px", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {feat.icon}
                </div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#f8fafc", lineHeight: 1.3 }}>{feat.title}</div>
                <p style={{ margin: 0, fontSize: "12px", color: "#8b95a8", lineHeight: 1.5 }}>{feat.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF STATS ── */}
      <section style={{ padding: "56px 20px", maxWidth: "560px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", textAlign: "center" }}>
          {[
            { stat: "20K+", label: "Diagnoses run" },
            { stat: "4.8★", label: "Accuracy rating" },
            { stat: "<10s", label: "Avg. response" },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontFamily: "var(--font-barlow), sans-serif", fontWeight: 800, fontSize: "clamp(28px, 6vw, 36px)", color: "#3b82f6", lineHeight: 1, marginBottom: "4px" }}>{s.stat}</div>
              <div style={{ fontSize: "12px", color: "#4b5563", lineHeight: 1.3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <section style={{ padding: "32px 20px", backgroundColor: "#0d1018", borderTop: "1px solid #1e2433", borderBottom: "1px solid #1e2433" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: "clamp(16px, 5vw, 40px)", flexWrap: "wrap" as const }}>
            {["Powered by Claude AI", "No account needed", "Free to use", "Data never sold"].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ fontSize: "13px", color: "#8b95a8", whiteSpace: "nowrap" as const }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{
        textAlign: "center",
        padding: "64px 24px",
        background: "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(59,130,246,0.1), transparent)",
        maxWidth: "480px",
        margin: "0 auto",
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/carlos/carlos-thumbsup.png"
          alt=""
          className="carlos-float"
          style={{
            height: "160px",
            width: "auto",
            margin: "0 auto 24px",
            display: "block",
            filter: "drop-shadow(0 12px 30px rgba(59,130,246,0.35))",
          }}
        />
        <h2 style={{ fontFamily: "var(--font-barlow), sans-serif", fontSize: "48px", fontWeight: 700, color: "white", margin: "0 0 0", lineHeight: 1.1 }}>
          Don&apos;t guess.
        </h2>
        <h2 style={{ fontFamily: "var(--font-barlow), sans-serif", fontSize: "48px", fontWeight: 700, color: "#3b82f6", margin: "0 0 16px", lineHeight: 1.1 }}>
          Ask Carlos.
        </h2>
        <p style={{ color: "#8b95a8", fontSize: "16px", marginBottom: "32px", lineHeight: 1.6 }}>
          Stop paying for diagnoses you didn&apos;t need.<br />
          Stop going in blind. Carlos tells you what&apos;s wrong<br />
          before you ever talk to a mechanic.
        </p>
        <Link
          href="/diagnose"
          className="cta-button"
          style={{
            background: "#3b82f6",
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
          Ask Carlos — It&apos;s Free
        </Link>
        <p style={{ color: "#374151", fontSize: "13px", marginTop: "12px" }}>
          No sign-up · Works on any car · Free forever
        </p>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid #1e2433", padding: "24px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/carlos/carlos-icon.png" alt="" style={{ width: "24px", height: "24px", borderRadius: "6px", opacity: 0.4 }} />
          <span style={{ fontFamily: "var(--font-barlow), sans-serif", fontWeight: 800, fontSize: "14px", letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#374151" }}>CARLOS</span>
        </div>
        <div style={{ display: "flex", gap: "20px" }}>
          <Link href="/diagnose" style={{ fontSize: "12px", color: "#374151", textDecoration: "none" }}>App</Link>
          <Link href="/pricing" style={{ fontSize: "12px", color: "#374151", textDecoration: "none" }}>Pricing</Link>
          <Link href="/privacy" style={{ fontSize: "12px", color: "#374151", textDecoration: "none" }}>Privacy</Link>
        </div>
        <div style={{ fontSize: "11px", color: "#1c2a3e", textAlign: "center" }}>
          © {new Date().getFullYear()} Mechanic Carlos · mchaniccarlos.com
        </div>
      </footer>

    </div>
  );
}
