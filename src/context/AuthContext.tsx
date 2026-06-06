import React, { createContext, useContext, useState, useCallback } from 'react';
import type { User, RegisterData, LoginData } from '../types';
import { api, getStoredAuth, setStoredAuth, clearStoredAuth } from '../services/api';
import { reconnectSocket } from '../services/socket';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  register: (data: RegisterData) => Promise<{ success: boolean; verificationCode?: string; error?: string }>;
  verifyEmail: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  resendVerification: (email: string) => Promise<{ success: boolean; verificationCode?: string; error?: string }>;
  login: (data: LoginData, remember?: boolean) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<{ success: boolean; resetCode?: string; error?: string }>;
  verifyResetOtp: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string, otp: string, password: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateUser: (u: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = getStoredAuth();
    return (stored?.accessToken && stored.user) ? stored.user as User : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    const stored = getStoredAuth();
    return stored?.accessToken ?? null;
  });
  const [isLoading] = useState(false);

  const persist = (u: User | null, accessToken: string | null, refreshToken?: string, remember = true) => {
    if (u && accessToken) {
      const stored = getStoredAuth();
      setStoredAuth({ user: u, accessToken, refreshToken: refreshToken ?? stored?.refreshToken ?? '' }, remember);
    } else {
      clearStoredAuth();
    }
    setUser(u);
    setToken(accessToken);
  };

  const register = async (data: RegisterData) => {
    try {
      const result = await api.post<{ user: User; verificationCode?: string }>('/auth/register', data);
      return { success: true, verificationCode: result.verificationCode };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Registration failed' };
    }
  };

  const verifyEmail = async (email: string, otp: string) => {
    try {
      await api.post('/auth/verify-email', { email, otp });
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Verification failed' };
    }
  };

  const resendVerification = async (email: string) => {
    try {
      const result = await api.post<{ message: string; verificationCode?: string }>('/auth/resend-verification', { email });
      return { success: true, verificationCode: result.verificationCode };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to resend code' };
    }
  };

  const login = async (data: LoginData, remember = true) => {
    try {
      const result = await api.post<{ user: User; accessToken: string; refreshToken: string }>('/auth/login', data);
      persist(result.user, result.accessToken, result.refreshToken, remember);
      reconnectSocket();
      return { success: true, user: result.user };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Login failed' };
    }
  };

  const logout = useCallback(() => {
    const stored = getStoredAuth();
    if (stored?.refreshToken) {
      api.post('/auth/logout', { refreshToken: stored.refreshToken }).catch(() => {});
    }
    persist(null, null);
  }, []);

  const forgotPassword = async (email: string) => {
    try {
      const result = await api.post<{ message: string; resetCode?: string }>('/auth/forgot-password', { email });
      return { success: true, resetCode: result.resetCode };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to send reset code' };
    }
  };

  const verifyResetOtp = async (email: string, otp: string) => {
    try {
      await api.post('/auth/verify-reset-otp', { email, otp });
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Invalid code' };
    }
  };

  const resetPassword = async (email: string, otp: string, password: string) => {
    try {
      await api.post('/auth/reset-password', { email, otp, password });
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Reset failed' };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to change password' };
    }
  };

  const updateUser = (u: User) => {
    const stored = getStoredAuth();
    if (stored?.refreshToken) persist(u, token, stored.refreshToken);
  };

  return (
    <AuthContext.Provider value={{
      user, token, isLoading,
      register, verifyEmail, resendVerification, login, logout,
      forgotPassword, verifyResetOtp, resetPassword, changePassword, updateUser,
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
