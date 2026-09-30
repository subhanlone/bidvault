import { io, type Socket } from 'socket.io-client';
import { getStoredAuth } from './api';

const SOCKET_URL = (import.meta.env.VITE_API_URL as string).replace(/\/api\/v1\/?$/, '');

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const auth = getStoredAuth();
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnectionAttempts: 5,
      auth: auth?.accessToken ? { token: auth.accessToken } : {},
    });
  }
  return socket;
}

// Both functions below keep the same Socket instance instead of discarding it. Listeners are
// attached to the instance itself, and RealtimeBridge (mounted once at the app root) attaches
// its listeners a single time -- replacing the instance would leave them on a dead object for
// the rest of the tab's life. Socket.IO documents this exact pattern for changing credentials:
// update `auth`, then `disconnect().connect()` on the same socket.

/** Call after login so the socket reconnects with the new token. */
export function reconnectSocket(): void {
  if (!socket) return;
  const auth = getStoredAuth();
  socket.auth = auth?.accessToken ? { token: auth.accessToken } : {};
  socket.disconnect().connect();
}

/** Call whenever the stored session is cleared. A manual disconnect does not auto-reconnect,
 * so the old token's connection stays closed until the next reconnectSocket(). */
export function disconnectSocket(): void {
  socket?.disconnect();
}
