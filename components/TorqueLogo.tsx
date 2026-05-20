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
    <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <path
          d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l2.83-2.83a7 7 0 0 1-9.82 9.82L5.24 21.27a2.12 2.12 0 0 1-3-3l5.03-5.03A7 7 0 0 1 17.54 3.46z"
          stroke="#4a9eff"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {showWordmark && (
        <span
          style={{
            fontFamily: "var(--font-barlow), sans-serif",
            fontSize: `${wordmarkSize}px`,
            fontWeight: 700,
            letterSpacing: "0.12em",
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
