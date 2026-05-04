"use client";

import { Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  token: string;
}

export default function GateSignupButton({ token }: Props) {
  const { signInWithGoogle, available } = useAuth();

  function handleSignUp() {
    if (available) {
      signInWithGoogle(`/r/${token}`);
    } else {
      window.location.href = "/";
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        padding: "20px 16px",
        paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))",
        backgroundColor: "#13161b",
        borderTop: "1px solid #1e2329",
        zIndex: 50,
      }}
    >
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <Lock size={18} color="#3b82f6" />
          <span style={{ fontSize: "18px", fontWeight: 700, color: "#f1f5f9" }}>See the full diagnosis</span>
        </div>
        <p style={{ margin: "0 0 14px", fontSize: "13px", color: "#6b7280", lineHeight: 1.5 }}>
          What to check first. What it&apos;ll cost. What NOT to do.
        </p>
        <button
          onClick={handleSignUp}
          className="tap-target"
          style={{ width: "100%", height: "52px", backgroundColor: "#3b82f6", color: "white", fontWeight: 700, fontSize: "16px", border: "none", borderRadius: "12px", cursor: "pointer" }}
        >
          Sign up free — 10 seconds
        </button>
        <button
          onClick={handleSignUp}
          style={{ display: "block", width: "100%", textAlign: "center", marginTop: "10px", fontSize: "13px", color: "#6b7280", backgroundColor: "transparent", border: "none", cursor: "pointer" }}
        >
          Already have an account? Sign in
        </button>
      </div>
    </div>
  );
}
