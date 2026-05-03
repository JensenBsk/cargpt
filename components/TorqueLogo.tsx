"use client";

import { useId } from "react";

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
  const rawId = useId();
  const gradId = `tg${rawId.replace(/[^a-z0-9]/gi, "")}`;

  const aspectW = 30;
  const aspectH = 38;
  const markW = Math.round((markSize * aspectW) / aspectH);

  const glowFilter =
    glow === "strong"
      ? "drop-shadow(0 0 14px rgba(59,130,246,0.55)) drop-shadow(0 0 6px rgba(99,102,241,0.4))"
      : glow === "soft"
      ? "drop-shadow(0 0 7px rgba(59,130,246,0.35))"
      : "none";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <svg
        width={markW}
        height={markSize}
        viewBox="0 0 30 38"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: glowFilter, flexShrink: 0 }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        {/* Top horizontal bar */}
        <rect x="0" y="0" width="30" height="7" rx="2.5" fill={`url(#${gradId})`} />
        {/* Vertical stem — bottom terminates in right-pointing chevron */}
        <path d="M12 6 L18 6 L18 22 L25 30 L18 38 L12 38 Z" fill={`url(#${gradId})`} />
      </svg>

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
          TORQUE
        </span>
      )}
    </div>
  );
}
