import { io, type Socket } from 'socket.io-client';
import { getStoredAuth } from './api';

const SOCKET_URL = (import.meta.env.VITE_API_URL as string).replace(/\/api\/v1\/?$/, '');

let socket: Socket | null = null;

// A function, not an object: Socket.IO calls it for every connect packet it sends, reconnects
// included, whereas an object is read once and then reused as-is. api.ts swaps the access token
// in storage on every silent refresh, so a snapshot taken when the socket was created goes stale
// within minutes. The server answers a stale token with a middleware error, and Socket.IO does
// not retry those on its own (`connect_error`, `socket.active === false`) -- so the first
// transport drop after a refresh left the tab without live updates until a full reload.
function currentAuth(): { token?: string } {
  const stored = getStoredAuth();
  return stored?.accessToken ? { token: stored.accessToken } : {};
}

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnectionAttempts: 5,
      auth: (cb) => cb(currentAuth()),
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
  socket?.disconnect().connect();
}

/** Call whenever the stored session is cleared. A manual disconnect does not auto-reconnect,
 * so the old token's connection stays closed until the next reconnectSocket(). */
export function disconnectSocket(): void {
  socket?.disconnect();
}
