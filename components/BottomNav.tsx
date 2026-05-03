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
  const { user } = useAuth();

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "calc(60px + env(safe-area-inset-bottom, 0px))",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        backgroundColor: "#0d0f12",
        borderTop: "1px solid #1e2329",
        display: "flex",
        zIndex: 40,
      }}
    >
      {TABS.map(({ id, label, Icon }) => {
        const isActive = activeTab === id;
        const isGarage = id === "garage";
        const locked = isGarage && !user;

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
              gap: "3px",
              backgroundColor: "transparent",
              border: "none",
              borderTop: `2px solid ${isActive ? "#3b82f6" : "transparent"}`,
              cursor: "pointer",
              color: isActive ? "#3b82f6" : "#4b5563",
              paddingTop: "6px",
            }}
            aria-label={label}
          >
            {locked ? <Lock size={18} /> : <Icon size={18} />}
            <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.03em" }}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
