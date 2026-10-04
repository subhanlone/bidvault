import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
// All three come straight from the contract. RegisterRequest and LoginRequest replaced a
// hand-written pair that used to sit in types/index.ts alongside copies of every other wire
// shape — and unlike those, this pair was never even covered by the guard that compared them,
// so nothing had ever checked it. The old RegisterData typed `role` as UserRole, which
// includes ADMIN: a value POST /auth/register has never accepted.
import type { User, RegisterRequest, LoginRequest } from '../types/api';
import {
  api,
  ApiError,
  clearSessionHint,
  hasLegacySession,
  isSessionHintEvent,
  onIdentityChanged,
  onSessionExpired,
  readSessionHint,
  restoreSession,
  setAccessToken,
  setExpectedUserId,
  writeSessionHint,
} from '../services/api';
import { reconnectSocket, disconnectSocket } from '../services/socket';

interface AuthContextType {
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

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  // Everything in the query cache was fetched as whoever was signed in: My Bids, the watchlist,
  // notifications, and the public bid feed too (it masks every bidder except the caller). Its keys
  // do not carry a user id and entries live for minutes after their screen unmounts, so without
  // this the next person to sign in on the same tab was shown the previous one's data until it
  // happened to refetch. A fetch still in flight for the old identity needs no separate
  // cancellation: clear() detaches its query from the cache, so the late response is written to
  // that detached query and never reaches the fresh one (checked with a response held back 5 s
  // across a sign-out and a sign-in as someone else).
  const dropCachedData = useCallback(() => {
    queryClient.clear();
  }, [queryClient]);

  // The user lives in memory only. After a reload it is fetched again from the server, using the
  // access token the refresh cookie buys, so a stale copy of "who I am" can never outlive the
  // session it described.
  const [user, setUser] = useState<User | null>(null);
  // Starts true only when a session might exist (a hint from a previous sign-in, or one from
  // before the cookie), so a first-time visitor is never held up behind a request.
  const [isLoading, setIsLoading] = useState(() => readSessionHint() !== null || hasLegacySession());

  // The id of the user on screen, readable from event handlers without re-subscribing them.
  const userIdRef = useRef<string | null>(null);

  /** Make `u` the signed-in user: the identity this tab acts as, the hint the other tabs read. */
  const adopt = useCallback((u: User) => {
    if (userIdRef.current !== u.userId) dropCachedData();
    userIdRef.current = u.userId;
    setExpectedUserId(u.userId);
    writeSessionHint(u.userId);
    setUser(u);
    reconnectSocket();
  }, [dropCachedData]);

  /**
   * Forget the session in this tab. `announce` is for a sign-out this tab initiated: removing the
   * hint is what tells the other tabs. A tab reacting to someone else's removal passes false and
   * leaves it alone.
   */
  const becomeAnonymous = useCallback((announce: boolean) => {
    setAccessToken(null);
    setExpectedUserId(null);
    if (announce) clearSessionHint();
    disconnectSocket();
    dropCachedData();
    userIdRef.current = null;
    setUser(null);
  }, [dropCachedData]);

  // One restore at a time: StrictMode runs effects twice in development, and a sign-in elsewhere
  // can land while one is already running.
  const restoring = useRef<Promise<void> | null>(null);

  /** Ask the browser's own session (the cookie) who is signed in, and make this tab agree. */
  const restore = useCallback((): Promise<void> => {
    if (restoring.current) return restoring.current;

    const run = (async () => {
      // About to learn who this is: nothing to protect from, so no identity to hold the answer to.
      setExpectedUserId(null);
      const result = await restoreSession();

      if (result.kind === 'restored') {
        try {
          const { user: me } = await api.get('/auth/me');
          adopt(me);
        } catch {
          // A session was found but who it belongs to could not be read. Not signed in here, and
          // no token is left behind for requests to pick up.
          setAccessToken(null);
          if (userIdRef.current !== null) becomeAnonymous(false);
        }
      } else if (result.kind === 'anonymous') {
        // The hint (or the old stored session) promised a session the server no longer has.
        clearSessionHint();
        if (userIdRef.current !== null) becomeAnonymous(false);
      }
      // 'unavailable': the server could not be reached. Keep the hint so the next load tries again.
      setIsLoading(false);
    })().finally(() => { restoring.current = null; });

    restoring.current = run;
    return run;
  }, [adopt, becomeAnonymous]);

  // Startup: if a session might exist, restore it.
  useEffect(() => {
    if (readSessionHint() !== null || hasLegacySession()) void restore();
  }, [restore]);

  // Another tab signed in, switched account, or signed out. The `storage` event reaches every tab
  // except the one that wrote, so each tab just re-reads the hint and catches up: a removal signs
  // this tab out, a different user id (or a first sign-in while this tab is anonymous) asks the
  // server, through the shared cookie, who is signed in now.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (!isSessionHintEvent(event)) return;
      const hint = readSessionHint();
      if (!hint) {
        if (userIdRef.current !== null) becomeAnonymous(false);
      } else if (hint.userId !== userIdRef.current) {
        void restore();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [becomeAnonymous, restore]);

  // api.ts clears its token when a refresh is refused but cannot touch this state, so without this
  // the UI kept showing the signed-in user (and the old socket stayed connected) until a reload.
  useEffect(() => onSessionExpired(() => becomeAnonymous(false)), [becomeAnonymous]);

  // A refresh came back as a different account than the one on screen, which means another tab
  // switched accounts and its `storage` event has not (or could not) reach this tab. The request
  // that noticed was not sent as them; this brings the screen in line.
  useEffect(() => onIdentityChanged(() => { void restore(); }), [restore]);

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

  // Stable (no dependencies): a screen that sends a code from an effect lists this in its
  // dependencies, and a new function on every render would send it again on every render.
  const resendVerification = useCallback(async (email: string) => {
    try {
      const result = await api.post('/auth/resend-verification', { email });
      return { success: true, verificationCode: result.verificationCode, codeExpiresAt: result.codeExpiresAt };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to resend code' };
    }
  }, []);

  const login = async (data: LoginRequest, remember = true) => {
    try {
      // `remember` is the server's to honour now: it decides whether the cookie it sets outlives the
      // browser session. The refresh token in the response body is deliberately not kept anywhere.
      const result = await api.post('/auth/login', { ...data, remember });
      setAccessToken(result.accessToken);
      adopt(result.user);
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
    // The cookie identifies the session to revoke; no token has to be handed over. Fire and forget:
    // the local sign-out must not wait on, or depend on, the network.
    api.post('/auth/logout', {}).catch(() => {});
    becomeAnonymous(true);
  }, [becomeAnonymous]);

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
      // server issues a replacement pair with the confirmation, and sets the replacement cookie.
      // Keeping the new access token is what keeps the user signed in: ignore it and the next
      // silent refresh -- minutes later, mid-task -- would sign them out of the device they just
      // used to change it. Their own successful action logs them out.
      const session = await api.post('/auth/change-password', { currentPassword, newPassword });
      setAccessToken(session.accessToken);
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to change password' };
    }
  };

  const deleteAccount = async (password: string) => {
    try {
      // BV-018: the account is anonymised server-side, which already revokes every refresh
      // token and clears the cookie -- becoming anonymous here just makes the app reflect that
      // immediately instead of waiting for the next failed refresh.
      await api.post('/auth/delete-account', { password });
      becomeAnonymous(true);
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to delete account' };
    }
  };

  const updateUser = (u: User) => {
    setUser(u);
  };

  return (
    <AuthContext.Provider value={{
      user, isLoading,
      register, verifyEmail, resendVerification, login, logout,
      forgotPassword, verifyResetOtp, resetPassword, changePassword, deleteAccount, updateUser,
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
