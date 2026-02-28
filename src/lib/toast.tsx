"use client";

import { createContext, useContext, useState, useCallback } from "react";

type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

const ToastContext = createContext<{
  toast: (message: string, variant?: ToastVariant) => void;
}>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
          {toasts.map((t) => (
            <button
              key={t.id}
              onClick={() => dismiss(t.id)}
              className={`rounded-sm border-l-3 px-4 py-3 text-sm shadow-lg transition-all animate-in slide-in-from-right bg-parchment text-left ${
                t.variant === "success"
                  ? "border-l-sage text-sage-hover"
                  : t.variant === "error"
                  ? "border-l-red-500 text-red-600"
                  : "border-l-dusty-blue text-dusty-blue"
              }`}
            >
              {t.message}
            </button>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}
