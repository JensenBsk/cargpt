"use client";

import { useUser } from "@clerk/nextjs";
import { ToastProvider } from "@/contexts/ToastContext";
import { useOneSignalInit } from "@/hooks/useOneSignal";

function OneSignalBridge() {
  const { user } = useUser();
  useOneSignalInit(user?.id ?? null);
  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <OneSignalBridge />
      {children}
    </ToastProvider>
  );
}
