"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/client";

export type SubscriptionTier = "free" | "pro" | "enthusiast";

export interface SubscriptionState {
  tier: SubscriptionTier;
  isFree: boolean;
  isPro: boolean;
  isEnthusiast: boolean;
  loading: boolean;
}

export function useSubscription(): SubscriptionState {
  const { user, isLoaded } = useUser();
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { setTier("free"); setLoading(false); return; }

    const supabase = createClient();
    (async () => {
      try {
        const { data } = await supabase
          .from("users")
          .select("subscription_tier")
          .eq("id", user.id)
          .single();
        const t = (data?.subscription_tier ?? "free") as SubscriptionTier;
        setTier(["free", "pro", "enthusiast"].includes(t) ? t : "free");
      } catch {
        setTier("free");
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id, isLoaded]);

  return {
    tier,
    isFree: tier === "free",
    isPro: tier === "pro" || tier === "enthusiast",
    isEnthusiast: tier === "enthusiast",
    loading,
  };
}

export async function redirectToCheckout(priceId: string) {
  const res = await fetch("/api/stripe/create-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priceId }),
  });
  const data = await res.json();
  if (data.url) window.location.href = data.url;
}

export async function redirectToPortal() {
  const res = await fetch("/api/stripe/portal", { method: "POST" });
  const data = await res.json();
  if (data.url) window.location.href = data.url;
}
