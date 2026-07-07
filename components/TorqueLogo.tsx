"use client";

interface Props {
  markSize?: number;
  showWordmark?: boolean;
  wordmarkSize?: number;
  glow?: "soft" | "strong" | "none";
}

export default function TorqueLogo({
  showWordmark = true,
  wordmarkSize = 20,
}: Props) {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {showWordmark && (
        <span
          style={{
            fontFamily: "var(--font-barlow), sans-serif",
            fontSize: `${wordmarkSize}px`,
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "var(--text)",
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          CARLOS
        </span>
      )}
    </div>
  );
}
