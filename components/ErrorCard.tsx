"use client";

import { AlertTriangle } from "lucide-react";

export type ErrorType =
  | "diagnosis"
  | "quote"
  | "photo_unreadable"
  | "network"
  | "auth"
  | "garage_load"
  | "rate_limit"
  | "free_limit"
  | "generic";

interface ErrorCardProps {
  type: ErrorType;
  onRetry?: () => void;
  onSecondary?: () => void;
}

const ERROR_CONFIG: Record<ErrorType, {
  title: string;
  body: string;
  primary: string;
  secondary?: string;
}> = {
  diagnosis: {
    title: "Couldn't complete your diagnosis",
    body: "Something went wrong on our end — your car info is still saved. Tap to try again, or describe your symptoms differently.",
    primary: "Try Again",
  },
  quote: {
    title: "Couldn't analyze this quote",
    body: "We had trouble reading that. If you uploaded a photo, try typing the line items instead — or try the photo in better lighting.",
    primary: "Try Again",
  },
  photo_unreadable: {
    title: "Couldn't read this photo",
    body: "The text wasn't clear enough. Try better lighting, hold steady, or type the quote instead.",
    primary: "Type Instead",
  },
  network: {
    title: "No connection",
    body: "Looks like you're offline. Check your connection — your inputs are still here.",
    primary: "Retry",
  },
  auth: {
    title: "Sign in failed",
    body: "Google sign-in didn't complete. This sometimes happens if the popup was blocked. Try again or use email instead.",
    primary: "Try Again",
  },
  garage_load: {
    title: "Couldn't load your garage",
    body: "We had trouble fetching your saved cars. Pull down to refresh.",
    primary: "Refresh",
  },
  rate_limit: {
    title: "Too many requests",
    body: "You've run a lot of diagnoses in a short time. Wait a moment and try again.",
    primary: "Got it",
  },
  free_limit: {
    title: "You've used your 3 free diagnoses this month",
    body: "Upgrade to Carlos Pro for unlimited diagnoses, quote checks, and more.",
    primary: "See Plans",
    secondary: "Maybe Later",
  },
  generic: {
    title: "Something went wrong",
    body: "An unexpected error occurred. Please try again.",
    primary: "Try Again",
  },
};

export default function ErrorCard({ type, onRetry, onSecondary }: ErrorCardProps) {
  const config = ERROR_CONFIG[type];

  return (
    <div style={{
      backgroundColor: "#0f0a00",
      border: "1px solid #2d1f00",
      borderLeft: "3px solid var(--amber)",
      borderRadius: "10px",
      padding: "14px 16px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      width: "100%",
      boxSizing: "border-box",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
        <AlertTriangle size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: "1px" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#fcd34d", marginBottom: "4px" }}>
            {config.title}
          </div>
          <div style={{ fontSize: "13px", color: "#9ca3af", lineHeight: 1.5 }}>
            {config.body}
          </div>
        </div>
      </div>
      {(onRetry || config.secondary) && (
        <div style={{ display: "flex", gap: "8px", paddingLeft: "26px" }}>
          {onRetry && (
            <button
              onClick={onRetry}
              className="tap-target"
              style={{
                height: "36px",
                padding: "0 16px",
                backgroundColor: "var(--amber)",
                color: "white",
                fontWeight: 600,
                fontSize: "13px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              {config.primary}
            </button>
          )}
          {config.secondary && onSecondary && (
            <button
              onClick={onSecondary}
              className="tap-target"
              style={{
                height: "36px",
                padding: "0 14px",
                backgroundColor: "transparent",
                color: "#6b7280",
                fontWeight: 500,
                fontSize: "13px",
                border: "1px solid var(--border-muted)",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              {config.secondary}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
