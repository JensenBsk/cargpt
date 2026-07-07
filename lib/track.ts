"use client";

// Funnel analytics — thin typed wrapper over Vercel Analytics custom events.
// One place to see every event name so the funnel stays coherent:
//
//   visit (automatic) → diagnosis_started → diagnosis_completed
//     → repair_mode_started → outcome_reported
//   monetization: paywall_hit → checkout_clicked
//   auth: auth_opened → signed_in
//
// track() is fire-and-forget and must never break a product flow.

import { track as vercelTrack } from "@vercel/analytics";

type EventName =
  | "diagnosis_started"
  | "diagnosis_first_token"
  | "diagnosis_completed"
  | "diagnosis_failed"
  | "quote_checked"
  | "repair_mode_started"
  | "repair_mode_confirmed"
  | "repair_mode_exhausted"
  | "obd_connected"
  | "outcome_reported"
  | "recall_viewed"
  | "tsb_viewed"
  | "auth_opened"
  | "paywall_hit"
  | "checkout_clicked"
  | "report_email_saved";

export function track(event: EventName, props?: Record<string, string | number | boolean>) {
  try {
    vercelTrack(event, props);
  } catch {
    // Analytics never takes down the app.
  }
}
