"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface Toast {
  id: number;
  message: string;
}

interface ToastContextType {
  toast: (message: string) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2200);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div
        style={{
          position: "fixed",
          bottom: "calc(72px + env(safe-area-inset-bottom, 0px))",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 200,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="toast-enter"
            style={{
              backgroundColor: "#1e2329",
              border: "1px solid #252b34",
              color: "#f1f5f9",
              fontSize: "13px",
              fontWeight: 500,
              padding: "8px 16px",
              borderRadius: "20px",
              whiteSpace: "nowrap",
              boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
