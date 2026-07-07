"use client";

// Settings sheet — appearance, account, and support in one place.
// Theme choice persists in localStorage ("torque_theme") and is applied
// before first paint by the bootstrap script in app/layout.tsx.

import { useEffect, useState } from "react";
import { X, Settings, Moon, Sun, MonitorSmartphone, MessageSquare, Shield, FileText, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type Theme = "dark" | "light" | "system";

const THEME_KEY = "torque_theme";

export function applyTheme(theme: Theme) {
  const light =
    theme === "light" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches);
  if (light) document.documentElement.dataset.theme = "light";
  else delete document.documentElement.dataset.theme;
}

interface Props {
  onClose: () => void;
  onSignIn: () => void;
}

export default function SettingsSheet({ onClose, onSignIn }: Props) {
  const { user, available, signOut } = useAuth();
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY) as Theme | null;
      if (stored === "light" || stored === "system") setTheme(stored);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function chooseTheme(next: Theme) {
    setTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
    applyTheme(next);
  }

  const sectionLabel: React.CSSProperties = {
    fontFamily: "var(--font-jetbrains), monospace", fontSize: "10px", fontWeight: 700,
    color: "var(--text-3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 8px",
  };

  const row: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: "12px", width: "100%",
    padding: "13px 14px", backgroundColor: "var(--surface-2)", border: "1px solid var(--border)",
    borderRadius: "12px", color: "var(--text)", fontSize: "14px", fontWeight: 500,
    cursor: "pointer", textDecoration: "none", boxSizing: "border-box",
  };

  const themeOptions: { value: Theme; label: string; hint: string; icon: React.ReactNode }[] = [
    { value: "dark", label: "Dark", hint: "OLED navy, garage-friendly", icon: <Moon size={15} aria-hidden="true" /> },
    { value: "light", label: "Light", hint: "Bright surfaces, daylight", icon: <Sun size={15} aria-hidden="true" /> },
    { value: "system", label: "System", hint: "Follow this device", icon: <MonitorSmartphone size={15} aria-hidden="true" /> },
  ];

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.75)", zIndex: 80, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className="sheet-enter"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: "480px", maxHeight: "85dvh", overflowY: "auto", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderTopLeftRadius: "20px", borderTopRightRadius: "20px", padding: "20px", paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))", boxSizing: "border-box" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Settings size={16} color="#4a9eff" aria-hidden="true" /> Settings
          </h2>
          <button
            onClick={onClose}
            aria-label="Close settings"
            style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", minWidth: "44px", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Appearance */}
        <p style={sectionLabel}>Appearance</p>
        <div role="radiogroup" aria-label="Theme" style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          {themeOptions.map((opt) => {
            const active = theme === opt.value;
            return (
              <button
                key={opt.value}
                role="radio"
                aria-checked={active}
                onClick={() => chooseTheme(opt.value)}
                className="tap-target"
                style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "5px",
                  padding: "12px 6px", borderRadius: "12px", cursor: "pointer",
                  transition: "background-color 200ms, border-color 200ms",
                  backgroundColor: active ? "var(--accent-dim)" : "var(--surface-2)",
                  border: `1px solid ${active ? "var(--accent-border)" : "var(--border)"}`,
                  color: active ? "var(--accent)" : "var(--text-2)",
                }}
              >
                {opt.icon}
                <span style={{ fontSize: "13px", fontWeight: 600 }}>{opt.label}</span>
                <span style={{ fontSize: "10px", color: "var(--text-3)", lineHeight: 1.3 }}>{opt.hint}</span>
              </button>
            );
          })}
        </div>

        {/* Account */}
        <p style={sectionLabel}>Account</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
          {user ? (
            <>
              <div style={{ ...row, cursor: "default" }}>
                <span style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "var(--accent-dim)", border: "1px solid var(--accent-border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", fontSize: "12px", fontWeight: 700, flexShrink: 0 }} aria-hidden="true">
                  {(user.email ?? "?").charAt(0).toUpperCase()}
                </span>
                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-2)", fontSize: "13px" }}>{user.email}</span>
              </div>
              <button onClick={() => { signOut(); onClose(); }} className="tap-target" style={row}>
                <LogOut size={15} style={{ color: "var(--text-3)", flexShrink: 0 }} aria-hidden="true" />
                Sign out
              </button>
            </>
          ) : available ? (
            <button onClick={() => { onClose(); onSignIn(); }} className="tap-target" style={{ ...row, color: "var(--accent)", fontWeight: 600 }}>
              Sign in to sync your garage
            </button>
          ) : (
            <div style={{ ...row, cursor: "default", color: "var(--text-3)", fontSize: "13px" }}>Working offline — diagnoses save to this device</div>
          )}
        </div>

        {/* Support & legal */}
        <p style={sectionLabel}>Support</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <a href="mailto:support@mchaniccarlos.com?subject=Carlos%20feedback" style={row} className="tap-target">
            <MessageSquare size={15} style={{ color: "var(--text-3)", flexShrink: 0 }} aria-hidden="true" />
            Send feedback
          </a>
          <a href="/privacy" style={row} className="tap-target">
            <Shield size={15} style={{ color: "var(--text-3)", flexShrink: 0 }} aria-hidden="true" />
            Privacy policy
          </a>
          <a href="/terms" style={row} className="tap-target">
            <FileText size={15} style={{ color: "var(--text-3)", flexShrink: 0 }} aria-hidden="true" />
            Terms of use
          </a>
        </div>

        <p style={{ textAlign: "center", fontFamily: "var(--font-jetbrains), monospace", fontSize: "10px", color: "var(--text-4)", margin: "18px 0 0", letterSpacing: "0.06em" }}>
          MECHANIC CARLOS · V1.0.0
        </p>
      </div>
    </div>
  );
}
