"use client";

import { AuthProvider } from "@/context/auth-context";
import { ToastProvider } from "@/context/toast-context";

export function Providers({ children }) {
  return (
    <AuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  );
}
