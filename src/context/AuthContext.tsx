import React, { createContext, useContext, useState, useCallback } from 'react';
// All three come straight from the contract. RegisterRequest and LoginRequest replaced a
// hand-written pair that used to sit in types/index.ts alongside copies of every other wire
// shape — and unlike those, this pair was never even covered by the guard that compared them,
// so nothing had ever checked it. The old RegisterData typed `role` as UserRole, which
// includes ADMIN: a value POST /auth/register has never accepted.
import type { User, RegisterRequest, LoginRequest } from '../types/api';
import { api, ApiError, getStoredAuth, setStoredAuth, clearStoredAuth } from '../services/api';
import { reconnectSocket } from '../services/socket';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  register: (data: RegisterRequest) => Promise<{ success: boolean; verificationCode?: string; codeExpiresAt?: string; error?: string }>;
  verifyEmail: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  resendVerification: (email: string) => Promise<{ success: boolean; verificationCode?: string; codeExpiresAt?: string; error?: string }>;
  login: (data: LoginRequest, remember?: boolean) => Promise<{ success: boolean; error?: string; code?: string; user?: User }>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<{ success: boolean; resetCode?: string; codeExpiresAt?: string; error?: string }>;
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

  const register = async (data: RegisterRequest) => {
    try {
      const result = await api.post('/auth/register', data);
      return { success: true, verificationCode: result.verificationCode, codeExpiresAt: result.codeExpiresAt };
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
      const result = await api.post('/auth/resend-verification', { email });
      return { success: true, verificationCode: result.verificationCode, codeExpiresAt: result.codeExpiresAt };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to resend code' };
    }
  };

  const login = async (data: LoginRequest, remember = true) => {
    try {
      const result = await api.post('/auth/login', data);
      persist(result.user, result.accessToken, result.refreshToken, remember);
      reconnectSocket();
      return { success: true, user: result.user };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Login failed',
        code: err instanceof ApiError ? err.code : undefined,
      };
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
      const result = await api.post('/auth/forgot-password', { email });
      return { success: true, resetCode: result.resetCode, codeExpiresAt: result.codeExpiresAt };
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
      // Changing a password revokes every session the account has, this one included, so the
      // server issues a replacement pair with the confirmation. Storing it is what keeps the
      // user signed in: ignore it and the stored refresh token is already dead, and the next
      // silent refresh -- minutes later, mid-task -- signs them out of the device they just
      // used to change it. Their own successful action logs them out.
      const session = await api.post('/auth/change-password', { currentPassword, newPassword });
      if (user) persist(user, session.accessToken, session.refreshToken);
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
