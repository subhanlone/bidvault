import type {
  GetEndpoints,
  PostEndpoints,
  PutEndpoints,
  PatchEndpoints,
  DeleteEndpoints,
  PostRequests,
  PutRequests,
  PatchRequests,
} from '../types/openapi';

const BASE_URL = import.meta.env.VITE_API_URL as string;
const STORAGE_KEY = 'bidvault_auth_v1';

/** Field -> messages, as produced by the backend's z.flattenError().fieldErrors. */
export type ValidationDetails = Record<string, string[]>;

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  /** Present on 400s from validateBody; empty for every other failure. */
  readonly details?: ValidationDetails;
  constructor(status: number, message: string, code?: string, details?: ValidationDetails) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * The message a user should actually read.
 *
 * A validation failure answers with a constant top-level `error` -- "Validation error" -- and puts
 * the part that says what to change in `details`. Reading only `error` therefore shows every
 * validation failure as the same unactionable sentence: a rejected password, an over-long
 * description and a third emoji are indistinguishable, and nothing on screen says which field is
 * at fault. Preferring the field messages is what makes "Choose a less common password" reach the
 * person who has to choose one.
 *
 * Joined rather than shown per-field because callers render a single string; the field name is
 * left out because the message is displayed against the input that produced it.
 */
function readableError(error: string | undefined, details: ValidationDetails | undefined): string {
  const fieldMessages = Object.values(details ?? {})
    .flat()
    .filter((message): message is string => typeof message === 'string' && message.length > 0);

  if (fieldMessages.length > 0) return fieldMessages.join(' ');
  return error ?? 'Request failed';
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

/**
 * How a refresh ended. "The server said no" and "we never got an answer" must not be confused: the
 * first means the session is over, the second says nothing about it. Treating both as a dead
 * session signed people out for a dropped Wi-Fi connection or a deploy in progress, with a
 * perfectly good session still waiting on the server.
 */
type RefreshOutcome =
  | { kind: 'refreshed'; accessToken: string }
  | { kind: 'rejected' }
  | { kind: 'unavailable' };

let refreshPromise: Promise<RefreshOutcome> | null = null;

// One refresh at a time per tab, shared by everyone in it who needs one. Across tabs the lock in
// refreshAccessToken() does the same job: the server rotates refresh tokens, so two concurrent
// refreshes would spend the same token twice.
//
// `staleAccessToken` is the access token the caller found unusable; refreshAccessToken() uses it
// to tell whether another tab has already refreshed in the meantime.
function refreshOnce(staleAccessToken: string): Promise<RefreshOutcome> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken(staleAccessToken).finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

/** Refresh when fewer than this many ms of life remain, so a token is never handed over as it dies. */
const EXPIRY_SKEW_MS = 10_000;

/** When a JWT expires, or null if it cannot be read. Only used to decide whether to refresh
 * early -- the server stays the authority on whether a token is valid. */
function tokenExpiresAtMs(token: string): number | null {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(payload)) as { exp?: unknown };
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * The stored access token, refreshed first if it has expired or is about to. Null when there is
 * no session or the session can no longer be refreshed.
 *
 * request() gets a fresh token for free -- a 401 triggers the refresh. A socket handshake has no
 * such retry: it is rejected once and stays down, so it has to arrive with a token that already
 * works. That matters exactly when nothing else has refreshed lately, such as a laptop waking up
 * after the token expired.
 */
export async function getFreshAccessToken(): Promise<string | null> {
  const stored = getStoredAuth();
  if (!stored?.accessToken) return null;

  const expiresAt = tokenExpiresAtMs(stored.accessToken);
  if (expiresAt === null || expiresAt - Date.now() > EXPIRY_SKEW_MS) return stored.accessToken;

  const outcome = await refreshOnce(stored.accessToken);
  if (outcome.kind === 'refreshed') return outcome.accessToken;
  if (outcome.kind === 'rejected') expireSession();
  return null;
}

const REFRESH_LOCK = 'bidvault-auth-refresh';

// Attempts per refresh, how long each may take, and the pause between them. The server answers a
// repeat of a token it spent moments ago with the successor it already issued (see its
// REFRESH_REUSE_INTERVAL_SECONDS, 10 s by default), which is what makes retrying safe when a
// response was lost after the server had already processed the request. The whole sequence --
// the last attempt starts at most 2 x (3 s + 1 s) = 8 s after the first -- therefore has to fit
// inside that interval. The timeout also keeps a hung request from holding the lock, and with it
// every other tab's refresh.
const REFRESH_ATTEMPTS = 3;
const REFRESH_ATTEMPT_TIMEOUT_MS = 3_000;
const REFRESH_RETRY_DELAY_MS = 1_000;

// Tabs of one browser share a single stored session (and so a single rotating refresh token), but
// each has its own copy of this module, so refreshOnce() cannot serialize them. Two tabs that
// needed a token at the same moment both read the same refresh token and both sent it; the server
// accepted both (two live tokens from one) or rejected the loser as a replay and revoked the whole
// session. The Web Locks API is the standard way to take turns across tabs of one origin. It is
// only exposed in secure contexts (HTTPS or localhost); without it this tab still serializes
// itself, it just cannot see the others.
function withRefreshLock<T>(work: () => Promise<T>): Promise<T> {
  return 'locks' in navigator ? navigator.locks.request(REFRESH_LOCK, work) : work();
}

/** One try. Only a definite "no" from the server (401/400/403) is `rejected`; a timeout, a dropped
 * connection, a 5xx, a 429 or an unreadable answer leaves the question open. */
async function attemptRefresh(refreshToken: string, user: unknown): Promise<RefreshOutcome> {
  try {
    const resp = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      signal: AbortSignal.timeout(REFRESH_ATTEMPT_TIMEOUT_MS),
    });
    if (resp.status === 400 || resp.status === 401 || resp.status === 403) return { kind: 'rejected' };
    if (!resp.ok) return { kind: 'unavailable' };

    const body = await resp.json() as { data?: { accessToken: string; refreshToken: string } };
    if (!body.data?.accessToken || !body.data.refreshToken) return { kind: 'unavailable' };

    setStoredAuth({ user, accessToken: body.data.accessToken, refreshToken: body.data.refreshToken });
    return { kind: 'refreshed', accessToken: body.data.accessToken };
  } catch {
    return { kind: 'unavailable' };
  }
}

async function refreshAccessToken(staleAccessToken: string): Promise<RefreshOutcome> {
  return withRefreshLock(async () => {
    // Read the session only now that the lock is held: a tab that held it first has already
    // rotated the refresh token, and the copy this tab saw before waiting is spent.
    const stored = getStoredAuth();
    if (!stored?.refreshToken) return { kind: 'rejected' };
    if (stored.accessToken !== staleAccessToken) return { kind: 'refreshed', accessToken: stored.accessToken };

    let outcome: RefreshOutcome = { kind: 'unavailable' };
    for (let attempt = 0; attempt < REFRESH_ATTEMPTS && outcome.kind === 'unavailable'; attempt++) {
      if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, REFRESH_RETRY_DELAY_MS));
      outcome = await attemptRefresh(stored.refreshToken, stored.user);
    }
    return outcome;
  });
}

// This module cannot reach React state, so it announces a dead session instead of trying to
// react to it. AuthContext owns the user/token state and subscribes here; once it drops to
// anonymous, <ProtectedRoute> sends the visitor to /login on a route that needs a session and
// leaves public pages (landing, legal, auth screens) alone. A route list kept in this file
// instead silently missed any protected screen that was not on it.
type SessionExpiredListener = () => void;
const sessionExpiredListeners = new Set<SessionExpiredListener>();

export function onSessionExpired(listener: SessionExpiredListener): () => void {
  sessionExpiredListeners.add(listener);
  return () => { sessionExpiredListeners.delete(listener); };
}

/** The server has refused the session for good: drop it locally and tell the app. */
function expireSession(): void {
  clearStoredAuth();
  sessionExpiredListeners.forEach((listener) => listener());
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
    const outcome = await refreshOnce(stored.accessToken);

    if (outcome.kind === 'rejected') {
      expireSession();
      throw new ApiError(401, 'Session expired. Please sign in again.');
    }
    // Not the same thing: the session may be fine and the server just could not be reached. It is
    // kept, so the next action retries instead of the user being signed out for a dropped connection.
    if (outcome.kind === 'unavailable') {
      throw new ApiError(503, 'Could not reach the server to keep you signed in. Check your connection and try again.');
    }

    headers['Authorization'] = `Bearer ${outcome.accessToken}`;
    resp = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  }

  // 204 has no body by definition -- calling .json() on one throws, and nothing in this
  // contract sends one today, but a proxy or a future endpoint could. Treat it as an empty
  // success rather than reaching the parse below at all.
  if (resp.status === 204) return undefined as T;

  let body: {
    success: boolean;
    data?: T;
    error?: string;
    code?: string;
    details?: ValidationDetails;
  };
  try {
    body = await resp.json();
  } catch {
    // A gateway timeout, a proxy's HTML error page, a truncated connection -- anything that
    // isn't the JSON this contract always sends threw a raw SyntaxError here before, which
    // no caller catching ApiError ever saw and no user ever read a sensible message for.
    throw new ApiError(resp.status, 'The server returned an unreadable response. Please try again.');
  }

  // Platform maintenance: non-admin requests are blocked server-side — send the user to the maintenance page.
  // /login is excluded: the backend deliberately exempts /auth/login and /auth/refresh so an admin can
  // always sign in and switch maintenance back off. Redirecting away from /login would defeat that.
  if (
    resp.status === 503 &&
    body.code === 'MAINTENANCE' &&
    !window.location.pathname.startsWith('/maintenance') &&
    !window.location.pathname.startsWith('/login')
  ) {
    window.location.href = '/maintenance';
  }

  if (!resp.ok || !body.success) {
    throw new ApiError(
      resp.status,
      readableError(body.error, body.details),
      body.code,
      body.details,
    );
  }

  return body.data as T;
}

// ── Typed endpoints ──────────────────────────────────────────────────────────────────
//
// The URL now decides the response type. Before this, every call passed its own type
// argument — `api.get<Auction[]>('/watchlist')` — which is an assertion, not a check: the
// server was returning a five-field subset and TypeScript had no opinion, because the
// assertion *was* the contract. These maps come from openapi.json, so the URL is checked
// against the routes that exist and the response type is read from the same spec the
// server validates with.
//
// Known limitation: a path parameter is matched as `${string}`, which also matches a
// slash. So an over-deep URL under a real prefix (`/auctions/a/b/c`) satisfies the
// parameter type, then resolves to `never` and errors wherever the result is used, rather
// than at the call. Typos in a static path, and every undocumented path, are caught here.

/** Drop a query string: '/auctions?status=ACTIVE' -> '/auctions'. */
type Base<U extends string> = U extends `${infer B}?${string}` ? B : U;

/** '/a/b/c' -> ['', 'a', 'b', 'c'] */
type Segments<S extends string> = S extends `${infer H}/${infer R}` ? [H, ...Segments<R>] : [S];

/** A '{param}' segment matches exactly one segment; every other segment must match literally. */
type SegmentsMatch<U extends readonly string[], P extends readonly string[]> =
  U extends readonly [infer UH extends string, ...infer UR extends readonly string[]]
    ? P extends readonly [infer PH extends string, ...infer PR extends readonly string[]]
      ? PH extends `{${string}}`
        ? SegmentsMatch<UR, PR>
        : UH extends PH ? SegmentsMatch<UR, PR> : false
      : false
    : P extends readonly [] ? true : false;

/**
 * The response type documented for `U`.
 *
 * Exact keys are tried first, so '/auctions/mine/bids' resolves to its own entry and never
 * falls through to '/auctions/{auctionId}/bids'. Segment counts must agree, so
 * `/auctions/${id}` cannot also match '/auctions/{auctionId}/bids'.
 */
type ResponseOf<U extends string, M> =
  Base<U> extends keyof M
    ? M[Base<U>]
    : { [K in keyof M]: SegmentsMatch<Segments<Base<U>>, Segments<K & string>> extends true ? M[K] : never }[keyof M];

/** '/a/{id}/b' -> `/a/${string}/b`, so a template-literal argument keeps its shape. */
type Pattern<K extends string> =
  K extends `${infer A}{${string}}${infer B}` ? `${A}${string}${Pattern<B>}` : K;

/** Every URL this method documents, with or without a query string. */
type Url<M> = Pattern<keyof M & string> | `${Pattern<keyof M & string>}?${string}`;

/**
 * The body documented for `U` — the same lookup as `ResponseOf`, against the request maps
 * instead of the response ones. Resolves to `never` for the seven mutating routes the
 * contract gives no body (approve, approve-all, read, read-all, watchlist add,
 * upload-signature, the Stripe webhook).
 */
type BodyOf<U extends string, M> = ResponseOf<U, M>;

/**
 * `[body]` when the contract documents one, `[]` when it does not.
 *
 * A rest parameter rather than `body?:` so the two cases are distinguishable: a route with
 * a documented body cannot be called without one, and a route without cannot be handed a
 * stray object. `body?: unknown` — what this was — accepted both mistakes silently, which
 * is the same shape of hole the URL argument had before the response maps landed.
 */
type BodyArgs<U extends string, M> = [BodyOf<U, M>] extends [never]
  ? []
  : [body: BodyOf<U, M>];

export const api = {
  get:   <P extends Url<GetEndpoints>>(path: P) =>
    request<ResponseOf<P, GetEndpoints>>(path, { method: 'GET' }),

  post:  <P extends Url<PostEndpoints>>(path: P, ...body: BodyArgs<P, PostRequests>) =>
    request<ResponseOf<P, PostEndpoints>>(path, { method: 'POST',  body: body.length ? JSON.stringify(body[0]) : undefined }),

  put:   <P extends Url<PutEndpoints>>(path: P, ...body: BodyArgs<P, PutRequests>) =>
    request<ResponseOf<P, PutEndpoints>>(path, { method: 'PUT',   body: body.length ? JSON.stringify(body[0]) : undefined }),

  patch: <P extends Url<PatchEndpoints>>(path: P, ...body: BodyArgs<P, PatchRequests>) =>
    request<ResponseOf<P, PatchEndpoints>>(path, { method: 'PATCH', body: body.length ? JSON.stringify(body[0]) : undefined }),

  del:   <P extends Url<DeleteEndpoints>>(path: P) =>
    request<ResponseOf<P, DeleteEndpoints>>(path, { method: 'DELETE' }),
};
