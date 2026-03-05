"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { api, setToken, clearToken } from "./api";

interface AuthUser {
  id: string;
  role: string;
  first_name: string;
  telegram_id?: number;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAdmin: false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, []);

  async function initAuth() {
    try {
      // Try Telegram WebApp auth first
      if (typeof window !== "undefined" && window.Telegram?.WebApp?.initData) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();

        const result = await api.auth.telegramLogin(tg.initData);
        setToken(result.access_token);

        const me = await api.auth.me();
        setUser(me);
        setIsLoading(false);
        return;
      }

      // Try existing token
      const existing = localStorage.getItem("access_token");
      if (existing) {
        const me = await api.auth.me();
        setUser(me);
      }
    } catch {
      clearToken();
    } finally {
      setIsLoading(false);
    }
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin: user?.role === "admin", logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
