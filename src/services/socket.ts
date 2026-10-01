import { io, type Socket } from 'socket.io-client';
import { getFreshAccessToken } from './api';

const SOCKET_URL = (import.meta.env.VITE_API_URL as string).replace(/\/api\/v1\/?$/, '');

let socket: Socket | null = null;

// A function, not an object: Socket.IO calls it for every connect packet it sends, reconnects
// included, whereas an object is read once and then reused as-is. api.ts swaps the access token
// in storage on every silent refresh, so a snapshot taken when the socket was created goes stale
// within minutes. The server answers a stale token with a middleware error, and Socket.IO does
// not retry those on its own (`connect_error`, `socket.active === false`) -- so the first
// transport drop after a refresh left the tab without live updates until a full reload.
//
// Reading storage is not enough either: if nothing has made an HTTP call since the token
// expired (a laptop waking up), the stored token is the expired one. The callback may be invoked
// later, so the token is refreshed first when it needs it.
//
// When the refresh cannot be completed because the server could not be reached -- not because it
// said no -- the session is probably fine, so the socket connects anonymously (the server allows
// it, and live updates keep flowing) but does not settle for that: it keeps trying to come back
// authenticated. A session the server has ended is different: api.ts signs the UI out and the
// socket simply stays anonymous.
const UPGRADE_DELAYS_MS = [2_000, 4_000, 8_000, 16_000, 30_000];
let upgradeAttempt = 0;
let upgradeTimer: ReturnType<typeof setTimeout> | undefined;

function cancelUpgrade(): void {
  clearTimeout(upgradeTimer);
  upgradeTimer = undefined;
  upgradeAttempt = 0;
}

function scheduleUpgrade(): void {
  if (upgradeTimer || upgradeAttempt >= UPGRADE_DELAYS_MS.length) return;
  upgradeTimer = setTimeout(() => {
    upgradeTimer = undefined;
    upgradeAttempt++;
    // Reconnecting runs currentAuth() again, which tries the refresh again.
    socket?.disconnect().connect();
  }, UPGRADE_DELAYS_MS[upgradeAttempt]);
}

async function currentAuth(): Promise<{ token?: string }> {
  const result = await getFreshAccessToken();
  if (result.kind === 'token') {
    cancelUpgrade();
    return { token: result.accessToken };
  }
  if (result.kind === 'unavailable') scheduleUpgrade();
  return {};
}

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnectionAttempts: 5,
      auth: (cb) => { void currentAuth().then(cb); },
    });
  }
  return socket;
}

// Both functions below keep the same Socket instance instead of discarding it. Listeners are
// attached to the instance itself, and RealtimeBridge (mounted once at the app root) attaches
// its listeners a single time -- replacing the instance would leave them on a dead object for
// the rest of the tab's life.

/** Call after login so the socket reconnects and re-reads the new token. */
export function reconnectSocket(): void {
  cancelUpgrade();
  socket?.disconnect().connect();
}

/** Call whenever the stored session is cleared. A manual disconnect does not auto-reconnect,
 * so the old token's connection stays closed until the next reconnectSocket(). */
export function disconnectSocket(): void {
  cancelUpgrade();
  socket?.disconnect();
}
