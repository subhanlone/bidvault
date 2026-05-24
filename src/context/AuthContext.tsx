import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, RegisterData, LoginData } from '../types';
import { mockApi } from '../services/mockApi';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  verifyEmail: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  login: (data: LoginData) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyResetOtp: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  updateUser: (u: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);
const STORAGE_KEY = 'bidvault_auth_v1';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const { user: u, token: t } = JSON.parse(raw);
          // Re-sync with mutable store (in case in-memory state changed)
          const fresh = mockApi.getUser(u.userId);
          setUser(fresh ?? u);
          setToken(t);
        }
      } catch { /* ignore */ }
      setIsLoading(false);
    }, 0);
    return () => clearTimeout(timeoutId);
  }, []);

  const persist = (u: User | null, t: string | null) => {
    if (u && t) localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: u, token: t }));
    else localStorage.removeItem(STORAGE_KEY);
    setUser(u);
    setToken(t);
  };

  const register = async (data: RegisterData) => {
    const res = await mockApi.register(data);
    if (res.success) return { success: true };
    return { success: false, error: res.error };
  };

  const verifyEmail = async (email: string, otp: string) => {
    const res = await mockApi.verifyEmail(email, otp);
    if (res.success) return { success: true };
    return { success: false, error: res.error };
  };

  const login = async (data: LoginData) => {
    const res = await mockApi.login(data);
    if (res.success && res.data) {
      persist(res.data.user, res.data.token);
      return { success: true, user: res.data.user };
    }
    return { success: false, error: res.error };
  };

  const logout = useCallback(() => {
    persist(null, null);
  }, []);

  const forgotPassword = async (email: string) => {
    const res = await mockApi.forgotPassword(email);
    return res.success ? { success: true } : { success: false, error: res.error };
  };

  const verifyResetOtp = async (email: string, otp: string) => {
    const res = await mockApi.verifyResetOtp(email, otp);
    return res.success ? { success: true } : { success: false, error: res.error };
  };

  const resetPassword = async (email: string, password: string) => {
    const res = await mockApi.resetPassword(email, password);
    return res.success ? { success: true } : { success: false, error: res.error };
  };

  const updateUser = (u: User) => persist(u, token);

  return (
    <AuthContext.Provider value={{
      user, token, isLoading,
      register, verifyEmail, login, logout,
      forgotPassword, verifyResetOtp, resetPassword, updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
