import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "#060810", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: "380px", width: "100%", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-jetbrains, monospace)", fontSize: "11px", fontWeight: 700, color: "#4a5c72", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "16px" }}>
          TORQUE
        </div>
        <div style={{ fontFamily: "var(--font-jetbrains, monospace)", fontSize: "64px", fontWeight: 700, color: "#172134", lineHeight: 1, marginBottom: "16px" }}>
          404
        </div>
        <div style={{ fontSize: "20px", fontWeight: 700, color: "#dce8f5", marginBottom: "8px" }}>
          Diagnosis not found
        </div>
        <p style={{ fontSize: "14px", color: "#4a5c72", lineHeight: 1.6, marginBottom: "28px" }}>
          This share link may have expired or doesn&apos;t exist. Ask the person who shared it to send you a new link.
        </p>
        <Link
          href="/"
          style={{ display: "inline-flex", alignItems: "center", height: "48px", padding: "0 28px", backgroundColor: "#4a9eff", color: "white", fontWeight: 700, fontSize: "15px", borderRadius: "10px", textDecoration: "none" }}
        >
          Diagnose my car
        </Link>
      </div>
    </div>
  );
}
