"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { isNativeApp } from "@/lib/native";
import { track } from "@/lib/track";

interface Props {
  onClose: () => void;
}

export default function AuthModal({ onClose }: Props) {
  const { signInWithGoogle, signInWithApple, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  // Guideline 4.8: Sign in with Apple must be offered wherever Google login
  // appears in the native app. Safe to read directly: the modal only mounts
  // on user interaction, never during SSR/hydration.
  const showApple = isNativeApp();
  useEffect(() => { track("auth_opened"); }, []);

  async function handleGoogle() {
    setLoading(true);
    await signInWithGoogle();
    // Native flow returns right after opening the browser sheet — re-enable
    // the buttons so a cancelled sheet isn't a dead end.
    if (isNativeApp()) setLoading(false);
  }

  async function handleApple() {
    setLoading(true);
    await signInWithApple();
    if (isNativeApp()) setLoading(false);
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError("");
    const fn = mode === "signin" ? signInWithEmail : signUpWithEmail;
    const { error } = await fn(email.trim(), password);
    setLoading(false);
    if (error) {
      setError(error);
    } else if (mode === "signup") {
      setCheckEmail(true);
    } else {
      onClose();
    }
  }

  const inputStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    height: "48px",
    padding: "0 14px",
    fontSize: "16px",
    backgroundColor: "#1a1e25",
    border: "1px solid #252b34",
    borderRadius: "8px",
    color: "#f1f5f9",
  };

  if (checkEmail) {
    return (
      <Overlay onClose={onClose}>
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>📬</div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: "#f1f5f9", marginBottom: "8px" }}>Check your email</div>
          <div style={{ fontSize: "14px", color: "#9ca3af", lineHeight: 1.6 }}>
            We sent a confirmation link to <strong style={{ color: "#f1f5f9" }}>{email}</strong>.<br />
            Click it to activate your account.
          </div>
          <button
            onClick={onClose}
            style={{ marginTop: "20px", height: "44px", padding: "0 24px", backgroundColor: "var(--accent)", color: "white", fontWeight: 600, fontSize: "15px", border: "none", borderRadius: "8px", cursor: "pointer" }}
          >
            Got it
          </button>
        </div>
      </Overlay>
    );
  }

  return (
    <Overlay onClose={onClose}>
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <div style={{ fontSize: "24px", marginBottom: "6px" }}>🔧</div>
        <div style={{ fontSize: "20px", fontWeight: 700, color: "#f1f5f9", marginBottom: "4px" }}>
          {mode === "signin" ? "Sign in to Carlos" : "Create your account"}
        </div>
        <div style={{ fontSize: "13px", color: "#6b7280" }}>Save diagnoses, build your garage, track fixes</div>
      </div>

      {showApple && (
        <button
          onClick={handleApple}
          disabled={loading}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", width: "100%", height: "48px", backgroundColor: "#000", color: "#fff", fontWeight: 600, fontSize: "15px", border: "1px solid #2a2f36", borderRadius: "8px", cursor: "pointer", marginBottom: "10px", opacity: loading ? 0.7 : 1 }}
        >
          <svg width="16" height="19" viewBox="0 0 814 1000" fill="currentColor" aria-hidden="true">
            <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
          </svg>
          Continue with Apple
        </button>
      )}

      <button
        onClick={handleGoogle}
        disabled={loading}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", width: "100%", height: "48px", backgroundColor: "white", color: "#111", fontWeight: 600, fontSize: "15px", border: "none", borderRadius: "8px", cursor: "pointer", marginBottom: "16px", opacity: loading ? 0.7 : 1 }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M17.64 9.2a10.3 10.3 0 0 0-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18z" fill="#34A853"/>
          <path d="M3.97 10.71A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.17.29-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3.01-2.33z" fill="#FBBC05"/>
          <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96L3.97 7.3C4.68 5.16 6.66 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }} />
        <span style={{ fontSize: "12px", color: "#6b7280" }}>or</span>
        <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }} />
      </div>

      <form onSubmit={handleEmailAuth} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <label htmlFor="auth-email" className="sr-only">Email</label>
        <input
          id="auth-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          required
          aria-describedby={error ? "auth-error" : undefined}
          style={inputStyle}
        />
        <label htmlFor="auth-password" className="sr-only">Password</label>
        <input
          id="auth-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          required
          aria-describedby={error ? "auth-error" : undefined}
          style={inputStyle}
        />

        {error && (
          <div id="auth-error" role="alert" style={{ fontSize: "13px", color: "#fca5a5", padding: "8px 12px", backgroundColor: "#1a0a0a", border: "1px solid #3a1515", borderRadius: "6px" }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email.trim() || !password.trim()}
          style={{ height: "48px", backgroundColor: "var(--accent)", color: "white", fontWeight: 600, fontSize: "15px", border: "none", borderRadius: "8px", cursor: "pointer", opacity: loading || !email.trim() || !password.trim() ? 0.55 : 1 }}
        >
          {loading ? "..." : mode === "signin" ? "Sign In" : "Create Account"}
        </button>
      </form>

      <p style={{ textAlign: "center", marginTop: "16px", fontSize: "13px", color: "#6b7280" }}>
        {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
        <button
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}
          style={{ color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 500, padding: 0 }}
        >
          {mode === "signin" ? "Sign up" : "Sign in"}
        </button>
      </p>
    </Overlay>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus trap: focus the dialog on open, keep Tab inside it, close on
  // Escape, and hand focus back to the trigger element on unmount.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    panel?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Sign in"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: "400px", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px", outline: "none" }}
      >
        {children}
      </div>
    </div>
  );
}
