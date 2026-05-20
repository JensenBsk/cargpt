"use client";

import Image from "next/image";

interface Props {
  markSize?: number;
  showWordmark?: boolean;
  wordmarkSize?: number;
  glow?: "soft" | "strong" | "none";
}

export default function TorqueLogo({
  markSize = 32,
  showWordmark = true,
  wordmarkSize = 22,
  glow = "soft",
}: Props) {
  const glowFilter =
    glow === "strong"
      ? "drop-shadow(0 0 16px rgba(74,158,255,0.65)) drop-shadow(0 0 7px rgba(74,158,255,0.35))"
      : glow === "soft"
      ? "drop-shadow(0 0 8px rgba(74,158,255,0.4))"
      : "none";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <Image
        src="/carlos-icon.png"
        alt="Carlos"
        width={markSize}
        height={markSize}
        style={{
          borderRadius: "50%",
          flexShrink: 0,
          filter: glowFilter,
          objectFit: "cover",
        }}
        priority
      />

      {showWordmark && (
        <span
          style={{
            fontFamily: "var(--font-barlow), sans-serif",
            fontSize: `${wordmarkSize}px`,
            fontWeight: 700,
            letterSpacing: "0.15em",
            color: "#ffffff",
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
