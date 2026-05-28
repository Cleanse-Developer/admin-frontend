"use client";

import { createContext, useContext, useState, useCallback } from "react";
import * as Toast from "@radix-ui/react-toast";

const ToastContext = createContext(null);

const VARIANT_STYLES = {
  success: "border-green-500 bg-green-50 text-green-900",
  error: "border-red-500 bg-red-50 text-red-900",
  info: "border-blue-500 bg-blue-50 text-blue-900",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, variant = "info") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, variant, open: true }]);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      <Toast.Provider swipeDirection="right" duration={4000}>
        {children}
        {toasts.map((toast) => (
          <Toast.Root
            key={toast.id}
            open={toast.open}
            onOpenChange={(open) => {
              if (!open) removeToast(toast.id);
            }}
            className={`rounded-lg border-l-4 px-4 py-3 shadow-lg ${VARIANT_STYLES[toast.variant] || VARIANT_STYLES.info}`}
          >
            <Toast.Description className="text-sm">
              {toast.message}
            </Toast.Description>
          </Toast.Root>
        ))}
        <Toast.Viewport className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2" />
      </Toast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
