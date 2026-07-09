"use client";

import { createContext, useContext, useState, useCallback } from "react";
import * as Toast from "@radix-ui/react-toast";

const ToastContext = createContext(null);

const VARIANT_DOT = {
  success: "bg-green-500",
  error: "bg-red-500",
  info: "bg-zinc-400",
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
      <Toast.Provider swipeDirection="left" duration={4000}>
        {children}
        {toasts.map((toast) => (
          <Toast.Root
            key={toast.id}
            open={toast.open}
            onOpenChange={(open) => {
              if (!open) removeToast(toast.id);
            }}
            className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-lg data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x) data-[swipe=cancel]:translate-x-0"
          >
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${VARIANT_DOT[toast.variant] || VARIANT_DOT.info}`}
            />
            <Toast.Description className="flex-1 text-sm text-zinc-900">
              {toast.message}
            </Toast.Description>
            <Toast.Close
              aria-label="Dismiss"
              className="shrink-0 rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </Toast.Close>
          </Toast.Root>
        ))}
        <Toast.Viewport className="fixed bottom-4 left-4 z-50 flex w-80 flex-col gap-2 outline-none" />
      </Toast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
