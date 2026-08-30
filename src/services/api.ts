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

// Route prefixes that require a session. Everything else — landing, legal pages, auth screens —
// is readable anonymously, so an expired session there must not bounce the visitor to /login.
const PROTECTED_PREFIXES = ['/admin', '/seller', '/buyer'];

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
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
      // Only bounce off routes that actually need a session. On a public page, dropping the
      // stored auth is enough — AuthContext falls back to anonymous and the page re-renders.
      if (isProtectedRoute(window.location.pathname)) {
        window.location.href = '/login';
      }
      throw new ApiError(401, 'Session expired. Please sign in again.');
    }

    headers['Authorization'] = `Bearer ${newToken}`;
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
