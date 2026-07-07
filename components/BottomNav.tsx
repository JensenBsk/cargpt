"use client";

import { Wrench, Receipt, Car, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export type AppTab = "diagnose" | "quote" | "garage";

interface Props {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
}

const TABS: { id: AppTab; label: string; Icon: React.ElementType }[] = [
  { id: "diagnose", label: "Diagnose", Icon: Wrench },
  { id: "quote",    label: "Quote",    Icon: Receipt },
  { id: "garage",   label: "Garage",   Icon: Car },
];

export default function BottomNav({ activeTab, onChange }: Props) {
  const { user: isSignedIn } = useAuth();

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "calc(60px + env(safe-area-inset-bottom, 0px))",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        backgroundColor: "var(--header-bg)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderTop: "1px solid var(--border)",
        display: "flex",
        zIndex: 40,
      }}
      aria-label="Main navigation"
    >
      {TABS.map(({ id, label, Icon }) => {
        const isActive = activeTab === id;
        const isGarage = id === "garage";
        const locked = isGarage && !isSignedIn;

        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className="tap-target"
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              // #7d8fa8 on #060810 ≈ 7:1 — inactive tabs stay WCAG AA readable
              color: isActive ? "var(--text)" : "var(--text-2)",
              paddingTop: "8px",
              position: "relative",
            }}
            aria-label={locked ? `${label} (sign in required)` : label}
            aria-current={isActive ? "page" : undefined}
          >
            {/* Active indicator background — subtle, not blue */}
            {isActive && (
              <div style={{
                position: "absolute",
                top: "6px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "44px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "rgba(125,143,168,0.12)",
                pointerEvents: "none",
              }} />
            )}
            {locked ? <Lock size={18} aria-hidden="true" /> : <Icon size={18} aria-hidden="true" />}
            <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.04em", position: "relative", zIndex: 1 }}>
              {label}
            </span>
            {/* Active pill indicator */}
            {isActive && (
              <div
                className="nav-pill"
                style={{
                  position: "absolute",
                  bottom: "6px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "20px",
                  height: "3px",
                  borderRadius: "2px",
                  backgroundColor: "var(--accent)",
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
