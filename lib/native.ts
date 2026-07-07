// Bridge to Capacitor native APIs. The native shell loads the production
// site into a WebView and injects `window.Capacitor`; on plain web every
// helper here silently no-ops, so call sites never need to branch.

/* eslint-disable @typescript-eslint/no-explicit-any */

type CapacitorGlobal = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
  Plugins?: Record<string, any>;
};

function cap(): CapacitorGlobal | null {
  if (typeof window === "undefined") return null;
  return (window as any).Capacitor ?? null;
}

/** True when running inside the iOS/Android Capacitor shell. */
export function isNativeApp(): boolean {
  return cap()?.isNativePlatform?.() ?? false;
}

export function nativePlatform(): "ios" | "android" | "web" {
  const p = cap()?.getPlatform?.();
  return p === "ios" || p === "android" ? p : "web";
}

type HapticStyle = "light" | "medium" | "heavy";

/** Impact haptic — for taps and small confirmations. */
export async function hapticImpact(style: HapticStyle = "medium"): Promise<void> {
  try {
    const haptics = cap()?.Plugins?.Haptics;
    if (!haptics) return;
    await haptics.impact({ style: style.toUpperCase() });
  } catch {
    // Haptics are decoration — never let them break a flow.
  }
}

/** Success notification haptic — diagnosis complete, quote analyzed, form saved. */
export async function hapticSuccess(): Promise<void> {
  try {
    const haptics = cap()?.Plugins?.Haptics;
    if (!haptics) return;
    await haptics.notification({ type: "SUCCESS" });
  } catch {
    /* no-op */
  }
}

export async function hapticWarning(): Promise<void> {
  try {
    const haptics = cap()?.Plugins?.Haptics;
    if (!haptics) return;
    await haptics.notification({ type: "WARNING" });
  } catch {
    /* no-op */
  }
}

/**
 * App Store guideline 3.1.1: digital subscriptions inside the native app
 * must use Apple/Google IAP (via RevenueCat) — never show Stripe checkout
 * links in the native shell. Gate any web-payment UI behind this.
 */
export function canShowWebCheckout(): boolean {
  return !isNativeApp();
}
