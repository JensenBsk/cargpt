"use client";

import { Wrench, Receipt, Car, Lock } from "lucide-react";
import { useUser } from "@clerk/nextjs";

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
  const { isSignedIn } = useUser();

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "calc(60px + env(safe-area-inset-bottom, 0px))",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        backgroundColor: "rgba(6,8,16,0.96)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderTop: "1px solid #172134",
        display: "flex",
        zIndex: 40,
      }}
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
              color: isActive ? "#4a9eff" : "#4a5c72",
              paddingTop: "8px",
              position: "relative",
            }}
            aria-label={label}
          >
            {/* Active glow background */}
            {isActive && (
              <div style={{
                position: "absolute",
                top: "6px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "44px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "rgba(74,158,255,0.08)",
                pointerEvents: "none",
              }} />
            )}
            {locked ? <Lock size={18} /> : <Icon size={18} />}
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
                  backgroundColor: "#4a9eff",
                  boxShadow: "0 0 8px rgba(74,158,255,0.6)",
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
