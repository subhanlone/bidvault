import { createContext, useContext } from 'react';
import type { User, RegisterRequest, LoginRequest } from '../types/api';

// The context object, its type and the hook live apart from the provider component: a file that
// exports components and also non-components cannot be hot-reloaded in place (react-refresh), so
// every edit to the provider reloaded the whole page and lost its state. The provider is
// AuthContext.tsx.
export interface AuthContextType {
  user: User | null;
  /** True while a session that may exist is being restored on startup. Protected routes wait for it. */
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
  deleteAccount: (password: string) => Promise<{ success: boolean; error?: string }>;
  updateUser: (u: User) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
