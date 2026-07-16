const BASE_URL = import.meta.env.VITE_API_URL as string;
const STORAGE_KEY = 'bidvault_auth_v1';

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

interface StoredAuth {
  user: unknown;
  accessToken: string;
  refreshToken: string;
}

export function getStoredAuth(): StoredAuth | null {
  try {
    // sessionStorage takes priority (remember=false login); fall back to localStorage
    const raw = sessionStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export function setStoredAuth(auth: StoredAuth, remember = true): void {
  // If the current session already lives in sessionStorage, keep it there (preserves remember=false across refreshes)
  const inSession = !!sessionStorage.getItem(STORAGE_KEY);
  const storage = (inSession || !remember) ? sessionStorage : localStorage;
  storage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

export function clearStoredAuth(): void {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const stored = getStoredAuth();
  if (!stored?.refreshToken) return null;

  try {
    const resp = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: stored.refreshToken }),
    });
    if (!resp.ok) return null;

    const body = await resp.json() as { data?: { accessToken: string; refreshToken: string } };
    if (!body.data?.accessToken) return null;

    setStoredAuth({ user: stored.user, accessToken: body.data.accessToken, refreshToken: body.data.refreshToken });
    return body.data.accessToken;
  } catch {
    return null;
  }
}

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const stored = getStoredAuth();

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (stored?.accessToken) {
    headers['Authorization'] = `Bearer ${stored.accessToken}`;
  }

  let resp = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // Only attempt token refresh if the user had an active session.
  // A 401 with no stored token means wrong credentials, not an expired session.
  if (resp.status === 401 && stored?.accessToken) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => { refreshPromise = null; });
    }
    const newToken = await refreshPromise;

    if (!newToken) {
      clearStoredAuth();
      window.location.href = '/login';
      throw new ApiError(401, 'Session expired. Please sign in again.');
    }

    headers['Authorization'] = `Bearer ${newToken}`;
    resp = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  }

  const body = await resp.json() as { success: boolean; data?: T; error?: string; code?: string };

  // Platform maintenance: non-admin requests are blocked server-side — send the user to the maintenance page.
  if (resp.status === 503 && body.code === 'MAINTENANCE' && !window.location.pathname.startsWith('/maintenance')) {
    window.location.href = '/maintenance';
  }

  if (!resp.ok || !body.success) {
    throw new ApiError(resp.status, body.error ?? 'Request failed', body.code);
  }

  return body.data as T;
}

export const api = {
  get:   <T>(path: string)                  => request<T>(path, { method: 'GET' }),
  post:  <T>(path: string, body?: unknown)  => request<T>(path, { method: 'POST',  body: body !== undefined ? JSON.stringify(body) : undefined }),
  put:   <T>(path: string, body?: unknown)  => request<T>(path, { method: 'PUT',   body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown)  => request<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
  del:   <T>(path: string)                  => request<T>(path, { method: 'DELETE' }),
};
