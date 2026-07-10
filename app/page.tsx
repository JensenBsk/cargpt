import Link from "next/link";

// One shared headline treatment so the page reads as a system.
const h2Style: React.CSSProperties = {
  fontFamily: "var(--font-barlow), sans-serif",
  fontWeight: 700,
  fontSize: "30px",
  color: "var(--text)",
  margin: 0,
  lineHeight: 1.1,
};

// Readout label — the one named kicker convention from the design system.
// Used only where the content reads like an instrument panel (the sample report).
const readoutLabel: React.CSSProperties = {
  fontFamily: "var(--font-jetbrains), monospace",
  fontSize: "10px",
  fontWeight: 700,
  color: "var(--text-3)",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
};

export default function LandingPage() {
  return (
    <div style={{ backgroundColor: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-ibm), sans-serif", overflowX: "hidden" }}>

      {/* ── HEADER ── */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 20px",
        borderBottom: "1px solid var(--border)",
        background: "var(--header-bg)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <span style={{ fontFamily: "var(--font-barlow), sans-serif", fontWeight: 700, fontSize: "20px", letterSpacing: "0.04em", color: "var(--text)" }}>
          CARLOS
        </span>
        <Link href="/diagnose" style={{
          color: "var(--text-2)",
          fontSize: "14px",
          fontWeight: 600,
          textDecoration: "none",
          padding: "8px 4px",
        }}>
          Open Carlos →
        </Link>
      </header>

      {/* ── HERO ── */}
      <section style={{
        padding: "48px 20px 64px",
        textAlign: "center",
        maxWidth: "560px",
        margin: "0 auto",
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
            margin: "0 auto 24px",
            filter: "drop-shadow(0 10px 24px rgba(0,0,0,0.5))",
          }}
        />

        <h1 style={{
          fontFamily: "var(--font-barlow), sans-serif",
          fontWeight: 800,
          fontSize: "clamp(34px, 8.5vw, 50px)",
          lineHeight: 1.06,
          color: "var(--text)",
          margin: "0 0 16px",
          textWrap: "balance",
        }}>
          Your car has a problem.<br />
          Carlos has the answer.
        </h1>

        <p style={{ fontSize: "16px", color: "var(--text-2)", lineHeight: 1.65, margin: "0 0 32px", maxWidth: "420px", display: "inline-block" }}>
          Describe the symptom, paste a code, or plug in a scanner.
          Carlos tells you what&apos;s wrong, how urgent it is, and what a fair fix costs.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center" }}>
          <Link
            href="/diagnose"
            className="cta-button btn-primary"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              maxWidth: "340px",
              height: "54px",
              fontWeight: 700,
              fontSize: "17px",
              borderRadius: "12px",
              textDecoration: "none",
            }}
          >
            Ask Carlos — Free
          </Link>
          <Link href="/diagnose?tab=quote" style={{ fontSize: "14px", color: "var(--text-2)", textDecoration: "none" }}>
            Or check a repair quote →
          </Link>
          <p style={{ fontSize: "13px", color: "var(--text-3)", margin: 0 }}>
            No account needed · 3 free diagnoses a month
          </p>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "0 20px 72px" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          <h2 style={{ ...h2Style, textAlign: "center", marginBottom: "40px" }}>Carlos thinks like a mechanic.</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
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
              <div key={step.n} style={{ display: "flex", alignItems: "flex-start", gap: "18px" }}>
                <span style={{
                  fontFamily: "var(--font-barlow), sans-serif",
                  fontWeight: 700,
                  fontSize: "28px",
                  lineHeight: 1,
                  color: "var(--text-3)",
                  flexShrink: 0,
                  width: "24px",
                  textAlign: "center",
                  marginTop: "1px",
                }}>{step.n}</span>
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>{step.title}</div>
                  <p style={{ margin: 0, fontSize: "14px", color: "var(--text-2)", lineHeight: 1.6 }}>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EXAMPLE DIAGNOSIS — a real report excerpt, typeset like the app ── */}
      <section id="example" style={{ padding: "0 20px 72px", maxWidth: "560px", margin: "0 auto" }}>
        <h2 style={{ ...h2Style, textAlign: "center", marginBottom: "36px" }}>This is what Carlos gives you.</h2>

        {/* Safety verdict — the one bordered element here, because it's a safety signal */}
        <div style={{ backgroundColor: "var(--amber-bg)", border: "1px solid rgba(245,158,11,0.35)", borderRadius: "12px", padding: "14px 16px", marginBottom: "28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontWeight: 700, fontSize: "12px", letterSpacing: "0.12em", color: "var(--amber)", textTransform: "uppercase", flexShrink: 0 }}>Caution</span>
          <span style={{ fontSize: "13px", color: "var(--text-2)", lineHeight: 1.5, textAlign: "right" }}>Safe to drive short distances. Avoid highway speeds.</span>
        </div>

        {/* Top cause — the diagnosis is the headline, straight on the background */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ ...readoutLabel, marginBottom: "8px" }}>Most likely cause</div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "var(--text)", lineHeight: 1.15, marginBottom: "10px" }}>Ignition coil failing</div>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--text-2)", lineHeight: 1.65, maxWidth: "62ch" }}>
            The ignition coil creates the spark to fire each cylinder. When one fails, that cylinder misfires — causing rough running, especially on cold starts or under load.
          </p>
        </div>

        {/* Diagnostic step */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ ...readoutLabel, marginBottom: "8px" }}>Check this first</div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", marginBottom: "6px" }}>Swap coils between cylinders</div>
          <p style={{ margin: "0 0 8px", fontSize: "14px", color: "var(--text-2)", lineHeight: 1.6 }}>If the misfire follows the coil to the new cylinder, you&apos;ve confirmed the coil is bad.</p>
          <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "12px", color: "var(--text-3)" }}>
            Free · 20 min · No tools
          </div>
        </div>

        {/* Cost estimate — a typographic table, not a box */}
        <div>
          <div style={{ ...readoutLabel, marginBottom: "10px" }}>Ignition coil replacement</div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "14px" }}>
            <span style={{ color: "var(--text-2)" }}>Parts</span>
            <span style={{ fontFamily: "var(--font-jetbrains), monospace", color: "var(--text-2)" }}>$25–$60</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "14px" }}>
            <span style={{ color: "var(--text-2)" }}>Labor</span>
            <span style={{ fontFamily: "var(--font-jetbrains), monospace", color: "var(--text-2)" }}>$40–$80</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0 0", marginTop: "4px", borderTop: "1px solid var(--border)" }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>Total</span>
            <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>$65–$140</span>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: "0 20px 72px" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          <h2 style={{ ...h2Style, textAlign: "center", marginBottom: "40px" }}>One mechanic. Six jobs.</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "28px", color: "var(--text-2)" }}>
            {[
              {
                title: "Diagnose any code",
                body: "Paste any P0xxx, C0xxx, or B1xxx code and get plain English with ranked fixes.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M6 10h8M6 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                title: "Read your car over Bluetooth",
                body: "Pair a $30 OBD2 adapter and Carlos pulls trouble codes and live engine data straight from the ECU.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 3v14l4.5-3.5L6 7m4-4l4.5 3.5L6 13" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                title: "Check a repair quote",
                body: "Paste or photograph the estimate. Carlos flags what's fair, what's high, and what's a red flag.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M4 5h12v2H4zM4 9h8v2H4zM4 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M14.5 14.5l1 1 2-2" stroke="var(--green)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
              },
              {
                title: "Analyze photos",
                body: "Snap your dashboard lights or engine bay and Carlos reads what he sees.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="2" y="5" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="10" cy="11" r="3" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M7 5l1.5-2h3L13 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                title: "Identify a noise",
                body: "Record the knock, squeal, or rattle. Carlos factors the sound into the diagnosis.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M10 11v5M7 18h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                title: "Keep a garage",
                body: "Save your cars, track what you fixed and what it cost, get maintenance reminders.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M3 8l7-5 7 5v9H3V8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    <rect x="7" y="12" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
                  </svg>
                ),
              },
            ].map((feat) => (
              <div key={feat.title} style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                <div style={{ flexShrink: 0, color: "var(--text-3)", marginTop: "1px" }}>
                  {feat.icon}
                </div>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", marginBottom: "3px" }}>{feat.title}</div>
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--text-2)", lineHeight: 1.55 }}>{feat.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST ── */}
      <section style={{ padding: "0 20px 48px", maxWidth: "560px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: "clamp(16px, 5vw, 40px)", flexWrap: "wrap" as const }}>
          {["Powered by Claude AI", "Your data is never sold"].map((item) => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="var(--green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontSize: "13px", color: "var(--text-2)", whiteSpace: "nowrap" as const }}>{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{
        textAlign: "center",
        padding: "24px 24px 72px",
        maxWidth: "480px",
        margin: "0 auto",
      }}>
        <h2 style={{ fontFamily: "var(--font-barlow), sans-serif", fontSize: "42px", fontWeight: 700, color: "var(--text)", margin: "0 0 16px", lineHeight: 1.12, textWrap: "balance" }}>
          Don&apos;t guess. Ask Carlos.
        </h2>
        <p style={{ color: "var(--text-2)", fontSize: "16px", marginBottom: "28px", lineHeight: 1.6 }}>
          Know what&apos;s wrong — and what it should cost —
          before you ever talk to a mechanic.
        </p>
        <Link
          href="/diagnose"
          className="cta-button btn-primary"
          style={{
            padding: "16px 32px",
            fontSize: "17px",
            fontWeight: 700,
            borderRadius: "12px",
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
        <p style={{ color: "var(--text-3)", fontSize: "13px", marginTop: "12px" }}>
          Takes under a minute. No card needed.
        </p>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "24px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/carlos/carlos-icon.webp" alt="" style={{ width: "24px", height: "24px", borderRadius: "6px", opacity: 0.4 }} />
          <span style={{ fontFamily: "var(--font-barlow), sans-serif", fontWeight: 700, fontSize: "14px", letterSpacing: "0.04em", color: "var(--text-3)" }}>CARLOS</span>
        </div>
        <div style={{ display: "flex", gap: "20px" }}>
          <Link href="/diagnose" style={{ fontSize: "12px", color: "var(--text-3)", textDecoration: "none" }}>App</Link>
          <Link href="/pricing" style={{ fontSize: "12px", color: "var(--text-3)", textDecoration: "none" }}>Pricing</Link>
          <Link href="/privacy" style={{ fontSize: "12px", color: "var(--text-3)", textDecoration: "none" }}>Privacy</Link>
          <Link href="/terms" style={{ fontSize: "12px", color: "var(--text-3)", textDecoration: "none" }}>Terms</Link>
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-4)", textAlign: "center" }}>
          © {new Date().getFullYear()} Mechanic Carlos · mchaniccarlos.com
        </div>
      </footer>

    </div>
  );
}
