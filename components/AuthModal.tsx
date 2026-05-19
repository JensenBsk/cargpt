"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  onClose: () => void;
}

export default function AuthModal({ onClose }: Props) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleGoogle() {
    setLoading(true);
    await signInWithGoogle();
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
            style={{ marginTop: "20px", height: "44px", padding: "0 24px", backgroundColor: "#3b82f6", color: "white", fontWeight: 600, fontSize: "15px", border: "none", borderRadius: "8px", cursor: "pointer" }}
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
        <div style={{ flex: 1, height: "1px", backgroundColor: "#1e2329" }} />
        <span style={{ fontSize: "12px", color: "#6b7280" }}>or</span>
        <div style={{ flex: 1, height: "1px", backgroundColor: "#1e2329" }} />
      </div>

      <form onSubmit={handleEmailAuth} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          style={inputStyle}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          style={inputStyle}
        />

        {error && (
          <div style={{ fontSize: "13px", color: "#ef4444", padding: "8px 12px", backgroundColor: "#1a0a0a", border: "1px solid #3a1515", borderRadius: "6px" }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email.trim() || !password.trim()}
          style={{ height: "48px", backgroundColor: "#3b82f6", color: "white", fontWeight: 600, fontSize: "15px", border: "none", borderRadius: "8px", cursor: "pointer", opacity: loading || !email.trim() || !password.trim() ? 0.55 : 1 }}
        >
          {loading ? "..." : mode === "signin" ? "Sign In" : "Create Account"}
        </button>
      </form>

      <p style={{ textAlign: "center", marginTop: "16px", fontSize: "13px", color: "#6b7280" }}>
        {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
        <button
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}
          style={{ color: "#3b82f6", background: "none", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 500, padding: 0 }}
        >
          {mode === "signin" ? "Sign up" : "Sign in"}
        </button>
      </p>
    </Overlay>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: "400px", backgroundColor: "#13161b", border: "1px solid #1e2329", borderRadius: "16px", padding: "24px" }}
      >
        {children}
      </div>
    </div>
  );
}
