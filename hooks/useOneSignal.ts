"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    OneSignalDeferred?: ((os: OneSignalType) => void)[];
  }
}

interface OneSignalType {
  init(config: { appId: string; notifyButton?: { enable: boolean } }): Promise<void>;
  User: {
    PushSubscription: {
      optIn(): Promise<void>;
      optOut(): Promise<void>;
      readonly id: string | null;
      readonly optedIn: boolean;
    };
    addTag(key: string, value: string): Promise<void>;
  };
  Notifications: {
    requestPermission(): Promise<void>;
  };
}

let initialized = false;

export function useOneSignalInit(userId: string | null) {
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    if (!appId || initialized) return;
    initialized = true;

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      await OneSignal.init({ appId, notifyButton: { enable: false } });
      if (userId) {
        await OneSignal.User.addTag("user_id", userId);
      }
    });
  }, [userId]);
}

export async function requestPushPermission(): Promise<boolean> {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  if (!appId) return false;

  return new Promise((resolve) => {
    const deferred = window.OneSignalDeferred;
    if (!deferred) { resolve(false); return; }
    deferred.push(async (OneSignal) => {
      try {
        await OneSignal.User.PushSubscription.optIn();
        resolve(OneSignal.User.PushSubscription.optedIn);
      } catch {
        resolve(false);
      }
    });
  });
}
