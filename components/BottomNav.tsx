"use client";

import { Wrench, Receipt, Warehouse, HeartPulse } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export type AppTab = "diagnose" | "health" | "quote" | "garage";

interface Props {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
}

const TABS: { id: AppTab; label: string; Icon: React.ElementType }[] = [
  { id: "diagnose", label: "Diagnose", Icon: Wrench },
  { id: "health",   label: "Health",   Icon: HeartPulse },
  { id: "quote",    label: "Quote",    Icon: Receipt },
  { id: "garage",   label: "Garage",   Icon: Warehouse },
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
              // Active tab reads by color alone — accent means current selection
              color: isActive ? "var(--accent)" : "var(--text-2)",
              paddingTop: "8px",
              transition: "color 150ms ease",
            }}
            aria-label={locked ? `${label} (sign in required)` : label}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon size={18} aria-hidden="true" />
            <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.04em" }}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
