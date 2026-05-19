"use client";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { useOneSignalInit } from "@/hooks/useOneSignal";

function OneSignalBridge() {
  const { user } = useAuth();
  useOneSignalInit(user?.id ?? null);
  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <OneSignalBridge />
        {children}
      </ToastProvider>
    </AuthProvider>
  );
}
