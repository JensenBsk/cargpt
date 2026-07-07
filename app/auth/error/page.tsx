import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ maxWidth: "360px", width: "100%", textAlign: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/carlos/carlos-thinking.webp" alt="" style={{ height: "100px", width: "auto", display: "block", margin: "0 auto 24px", filter: "drop-shadow(0 4px 16px rgba(59,130,246,0.2))" }} />
        <h1 style={{ fontFamily: "var(--font-barlow), sans-serif", fontWeight: 800, fontSize: "24px", color: "#f8fafc", margin: "0 0 12px" }}>
          Sign-in didn&apos;t work
        </h1>
        <p style={{ fontSize: "15px", color: "var(--text-2)", lineHeight: 1.6, margin: "0 0 32px" }}>
          Something went wrong during sign-in. This is usually a temporary issue — try again and it should work.
        </p>
        <Link
          href="/diagnose"
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: "50px", padding: "0 28px", backgroundColor: "var(--accent)", color: "white", fontWeight: 700, fontSize: "15px", borderRadius: "12px", textDecoration: "none", boxShadow: "0 4px 16px rgba(59,130,246,0.3)" }}
        >
          Try Again
        </Link>
        <div style={{ marginTop: "16px" }}>
          <Link href="/" style={{ fontSize: "13px", color: "var(--text-3)", textDecoration: "none" }}>
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
