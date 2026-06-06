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

/** Call after login so the socket reconnects with the new token. */
export function reconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
