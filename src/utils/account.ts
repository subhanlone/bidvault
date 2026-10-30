import type { User } from '../types/api';

/**
 * One account buys and sells (B5). Which side of the app a person is on is "mode", and it is only
 * ever a convenience: what they are allowed to do is `user.isSeller`, decided by the server on
 * every request. The last mode is remembered per user in this browser so the next sign-in opens
 * where they left off; storage that is missing or blocked just means the default.
 */
export type Mode = 'buying' | 'selling';

const modeKey = (userId: string) => `bidvault.mode.${userId}`;

function isMode(v: unknown): v is Mode {
  return v === 'buying' || v === 'selling';
}

/** The side to open for this user: the remembered one if they can still use it, else the default. */
export function readMode(user: User): Mode {
  if (!user.isSeller) return 'buying';
  try {
    const stored = localStorage.getItem(modeKey(user.userId));
    if (isMode(stored)) return stored;
  } catch {
    // Storage unavailable: fall through to the default.
  }
  // Accounts that were sellers before accounts were merged keep opening on the seller side until
  // they choose otherwise. `role` is the legacy spelling and is only read here, for that default.
  return user.role === 'SELLER' ? 'selling' : 'buying';
}

export function writeMode(user: User, mode: Mode): void {
  try {
    localStorage.setItem(modeKey(user.userId), mode);
  } catch {
    // Not remembered; the default applies next time.
  }
}

/** Where a signed-in user starts. */
export function homePath(user: User): string {
  if (user.role === 'ADMIN') return '/admin/dashboard';
  return readMode(user) === 'selling' ? '/seller/dashboard' : '/buyer/browse';
}

/**
 * A path to return to after signing in, accepted only if it is a place inside this app. It comes
 * from router state set by this app, but a value that is not a plain absolute path is never
 * followed (no other site, no protocol-relative `//host`).
 */
export function safeReturnPath(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null;
  return value;
}
