"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { adminAuthApi } from "@/lib/endpoints";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const savedUser = localStorage.getItem("adminUser");
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("adminUser");
      }
    }
    setLoading(false);

    const handleForcedLogout = () => {
      setUser(null);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("adminUser");
    };
    window.addEventListener("auth:logout", handleForcedLogout);
    return () => window.removeEventListener("auth:logout", handleForcedLogout);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await adminAuthApi.login({ email, password });
    const { accessToken, user: userData } = res.data;
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("adminUser", JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    try {
      await adminAuthApi.logout();
    } catch {
      // ignore logout errors
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("adminUser");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
