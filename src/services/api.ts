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
/** Where both tokens used to be kept, before they moved out of web storage. Read once to migrate. */
const LEGACY_STORAGE_KEY = 'bidvault_auth_v1';

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

// ── Session state ────────────────────────────────────────────────────────────────────
//
// Nothing here is a credential that script can keep. The refresh token lives in an HttpOnly
// cookie the browser attaches by itself (see the backend's refresh-cookie.ts), so this module never
// sees it; the access token lives in this variable and nowhere else -- not in web storage, which
// is what OWASP says credentials must stay out of, because one XSS reads all of it.

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/**
 * Who this tab believes is signed in. Set by the tab that signs in, read by every tab.
 *
 * A hint, not a credential: it says "there is probably a session for this user", which saves an
 * anonymous visitor a refresh round trip on every page load, and -- because a `storage` event
 * reaches every *other* tab of the origin when it changes -- it is how a sign-in or sign-out in one
 * tab reaches the rest. Whether the session really exists is always decided by the cookie and the
 * server, never by this.
 */
const SESSION_HINT_KEY = 'bidvault_session_v2';

export function readSessionHint(): { userId: string } | null {
  try {
    const raw = localStorage.getItem(SESSION_HINT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { userId?: unknown };
    return typeof parsed.userId === 'string' && parsed.userId ? { userId: parsed.userId } : null;
  } catch {
    return null;
  }
}

export function writeSessionHint(userId: string): void {
  try { localStorage.setItem(SESSION_HINT_KEY, JSON.stringify({ userId })); } catch { /* storage unavailable */ }
}

export function clearSessionHint(): void {
  try { localStorage.removeItem(SESSION_HINT_KEY); } catch { /* storage unavailable */ }
}

/** Whether a storage event is about the session hint (a null key means storage was cleared). */
export function isSessionHintEvent(event: StorageEvent): boolean {
  return event.key === null || event.key === SESSION_HINT_KEY;
}

// Sessions created before the cookie existed still hold both tokens in web storage. They are moved
// onto the cookie once (the old refresh token goes to the server in a request body, which answers
// with the cookie) and the stored copies are deleted, so nobody has to sign in again.
interface LegacySession { refreshToken: string }

function readLegacySession(): LegacySession | null {
  try {
    // sessionStorage took priority in the old code (a login with "keep me signed in" unticked).
    const raw = sessionStorage.getItem(LEGACY_STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { refreshToken?: unknown };
    return typeof parsed.refreshToken === 'string' && parsed.refreshToken ? { refreshToken: parsed.refreshToken } : null;
  } catch {
    return null;
  }
}

function clearLegacySession(): void {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    sessionStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch { /* storage unavailable */ }
}

export function hasLegacySession(): boolean {
  return readLegacySession() !== null;
}

// Which user the UI is showing, so a token that belongs to someone else is never used on their
// behalf. The cookie is shared by every tab, memory is not: if another tab switched accounts, this
// tab's next refresh would come back as the *new* account while the screen still shows the old
// one, and every action from here would silently run as someone the user is not looking at.
let expectedUserId: string | null = null;

export function setExpectedUserId(userId: string | null): void {
  expectedUserId = userId;
}

/** The `sub` of a JWT, or null if it cannot be read. Only used to compare identities. */
function tokenSubject(token: string): string | null {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { sub } = JSON.parse(atob(payload)) as { sub?: unknown };
    return typeof sub === 'string' ? sub : null;
  } catch {
    return null;
  }
}

/**
 * How a refresh ended. "The server said no" and "we never got an answer" must not be confused: the
 * first means the session is over, the second says nothing about it. Treating both as a dead
 * session signed people out for a dropped Wi-Fi connection or a deploy in progress, with a
 * perfectly good session still waiting on the server.
 *
 * `identity-changed` is the third kind of failure: the server answered with a session, but it
 * belongs to a different account than the one this tab is showing.
 */
type RefreshOutcome =
  | { kind: 'refreshed'; accessToken: string }
  | { kind: 'rejected' }
  | { kind: 'unavailable' }
  | { kind: 'identity-changed' };

let refreshPromise: Promise<RefreshOutcome> | null = null;

// One refresh at a time per tab, shared by everyone in it who needs one. Across tabs the lock in
// refreshAccessToken() and the server's reuse interval do the same job.
function refreshOnce(): Promise<RefreshOutcome> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => { refreshPromise = null; });
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
 * What a caller that needs a token right now gets: one, nothing (no session, or the server ended
 * it), or "could not find out" -- the session may well be fine and the server just unreachable.
 */
export type FreshAccessToken =
  | { kind: 'token'; accessToken: string }
  | { kind: 'none' }
  | { kind: 'unavailable' };

/**
 * The access token, refreshed first if it has expired or is about to.
 *
 * request() gets a fresh token for free -- a 401 triggers the refresh. A socket handshake has no
 * such retry: it is rejected once and stays down, so it has to arrive with a token that already
 * works. That matters exactly when nothing else has refreshed lately, such as a laptop waking up
 * after the token expired.
 */
export async function getFreshAccessToken(): Promise<FreshAccessToken> {
  if (!accessToken) return { kind: 'none' };

  const expiresAt = tokenExpiresAtMs(accessToken);
  if (expiresAt === null || expiresAt - Date.now() > EXPIRY_SKEW_MS) {
    return { kind: 'token', accessToken };
  }

  const outcome = await refreshOnce();
  if (outcome.kind === 'refreshed') return { kind: 'token', accessToken: outcome.accessToken };
  if (outcome.kind === 'rejected') {
    expireSession();
    return { kind: 'none' };
  }
  if (outcome.kind === 'identity-changed') return { kind: 'none' };
  return { kind: 'unavailable' };
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

// Tabs of one browser share the refresh cookie, but each has its own copy of this module, so
// refreshOnce() cannot serialize them. The Web Locks API is the standard way to take turns across
// tabs of one origin. It is only exposed in secure contexts (HTTPS or localhost); without it this
// tab still serializes itself, and the server's reuse interval answers a simultaneous repeat with
// the successor it already issued.
function withRefreshLock<T>(work: () => Promise<T>): Promise<T> {
  return 'locks' in navigator ? navigator.locks.request(REFRESH_LOCK, work) : work();
}

/** One try. With no `legacyRefreshToken` the browser supplies the HttpOnly cookie by itself (hence
 * `credentials: 'include'`); with one it is the old stored token, sent once to move that session
 * onto the cookie. Only a definite "no" from the server (401/400/403) is `rejected`; a timeout, a
 * dropped connection, a 5xx, a 429 or an unreadable answer leaves the question open. */
async function attemptRefresh(legacyRefreshToken?: string): Promise<RefreshOutcome> {
  try {
    const resp = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(legacyRefreshToken ? { refreshToken: legacyRefreshToken } : {}),
      signal: AbortSignal.timeout(REFRESH_ATTEMPT_TIMEOUT_MS),
    });
    if (resp.status === 400 || resp.status === 401 || resp.status === 403) return { kind: 'rejected' };
    if (!resp.ok) return { kind: 'unavailable' };

    const body = await resp.json() as { data?: { accessToken: string } };
    const fresh = body.data?.accessToken;
    if (!fresh) return { kind: 'unavailable' };

    // Not this tab's account any more: do not adopt it, or every request would run as someone else.
    const subject = tokenSubject(fresh);
    if (expectedUserId !== null && subject !== null && subject !== expectedUserId) {
      return { kind: 'identity-changed' };
    }

    accessToken = fresh;
    return { kind: 'refreshed', accessToken: fresh };
  } catch {
    return { kind: 'unavailable' };
  }
}

async function refreshAccessToken(legacyRefreshToken?: string): Promise<RefreshOutcome> {
  return withRefreshLock(async () => {
    let outcome: RefreshOutcome = { kind: 'unavailable' };
    for (let attempt = 0; attempt < REFRESH_ATTEMPTS && outcome.kind === 'unavailable'; attempt++) {
      if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, REFRESH_RETRY_DELAY_MS));
      outcome = await attemptRefresh(legacyRefreshToken);
    }
    return outcome;
  });
}

/**
 * Get this tab a session from what the browser already holds: the refresh cookie, or a session
 * from before the cookie existed. Called when the app starts and whenever another tab changes who
 * is signed in. On `restored` the access token is in memory; the caller fetches the user.
 */
export type RestoreResult =
  | { kind: 'restored' }
  | { kind: 'anonymous' }
  | { kind: 'unavailable' };

export async function restoreSession(): Promise<RestoreResult> {
  const legacy = readLegacySession();
  if (legacy) {
    const outcome = await refreshAccessToken(legacy.refreshToken);
    if (outcome.kind === 'refreshed') {
      clearLegacySession();
      return { kind: 'restored' };
    }
    if (outcome.kind === 'unavailable') return { kind: 'unavailable' };   // keep it, try again next load
    clearLegacySession();                                                  // the server refused it: it is dead
    return { kind: 'anonymous' };
  }

  const outcome = await refreshOnce();
  if (outcome.kind === 'refreshed') return { kind: 'restored' };
  if (outcome.kind === 'unavailable') return { kind: 'unavailable' };
  return { kind: 'anonymous' };
}

// This module cannot reach React state, so it announces a dead session instead of trying to
// react to it. AuthContext owns the user state and subscribes here; once it drops to anonymous,
// <ProtectedRoute> sends the visitor to /login on a route that needs a session and leaves public
// pages (landing, legal, auth screens) alone. A route list kept in this file instead silently
// missed any protected screen that was not on it.
type Listener = () => void;
const sessionExpiredListeners = new Set<Listener>();
const identityChangedListeners = new Set<Listener>();

export function onSessionExpired(listener: Listener): () => void {
  sessionExpiredListeners.add(listener);
  return () => { sessionExpiredListeners.delete(listener); };
}

/** Fires when a refresh handed back a different account than the one this tab is showing. */
export function onIdentityChanged(listener: Listener): () => void {
  identityChangedListeners.add(listener);
  return () => { identityChangedListeners.delete(listener); };
}

/** The server has refused the session for good: drop it everywhere and tell the app. Clearing the
 * hint is also what tells every other tab, which share the same dead cookie. */
function expireSession(): void {
  accessToken = null;
  clearSessionHint();
  sessionExpiredListeners.forEach((listener) => listener());
}

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const sentToken = accessToken;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (sentToken) {
    headers['Authorization'] = `Bearer ${sentToken}`;
  }

  // `credentials: 'include'` on every call: the cookie only ever travels to the auth routes (its
  // Path), but those need it, and a cross-origin Set-Cookie is ignored without it.
  let resp = await fetch(`${BASE_URL}${path}`, { ...options, headers, credentials: 'include' });

  // Only attempt token refresh if the user had an active session.
  // A 401 with no token means wrong credentials, not an expired session.
  if (resp.status === 401 && sentToken) {
    // Another request in this tab may already have refreshed while this one was in flight.
    let retryToken = accessToken !== null && accessToken !== sentToken ? accessToken : null;

    if (!retryToken) {
      const outcome = await refreshOnce();

      if (outcome.kind === 'rejected') {
        expireSession();
        throw new ApiError(401, 'Session expired. Please sign in again.');
      }
      // Not the same thing: the session may be fine and the server just could not be reached. It is
      // kept, so the next action retries instead of the user being signed out for a dropped connection.
      if (outcome.kind === 'unavailable') {
        throw new ApiError(503, 'Could not reach the server to keep you signed in. Check your connection and try again.');
      }
      // The browser's session now belongs to someone else (another tab switched accounts). This
      // request is not sent as them; the app is told to catch up with who is signed in.
      if (outcome.kind === 'identity-changed') {
        identityChangedListeners.forEach((listener) => listener());
        throw new ApiError(409, 'Your account was changed in another tab. Your session is being refreshed -- please try again.', 'ACCOUNT_CHANGED');
      }
      retryToken = outcome.accessToken;
    }

    headers['Authorization'] = `Bearer ${retryToken}`;
    resp = await fetch(`${BASE_URL}${path}`, { ...options, headers, credentials: 'include' });
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
