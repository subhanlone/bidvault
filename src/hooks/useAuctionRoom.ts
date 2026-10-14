import { useEffect } from 'react';
import { connectSocket } from '../services/socket';

/**
 * Keeps the socket subscribed to one auction's room while the screen is open.
 *
 * Subscribing and unsubscribing are only sent while the socket is connected, and (re)subscribing
 * after a connection is the `connect` listener's job:
 *
 * - Socket.IO buffers anything emitted while the socket is not connected and flushes it as soon as
 *   it connects, before `connect` listeners run. A screen opened before the handshake finished used
 *   to queue a subscribe, and a user who left again before it finished queued the unsubscribe next
 *   to it. Both then reached the server in one flush, and the server (before it learned to track
 *   the last command per room) joined the room anyway. Sending nothing while disconnected means
 *   leaving early sends nothing at all; the same buffer also delivered a duplicate subscribe on
 *   every normal visit (the buffered one, then the `connect` listener's).
 * - Rooms live on the server side of one connection and are not restored when the socket
 *   reconnects (connection state recovery is off), so the `connect` listener, which fires on the
 *   first connection and on every reconnection, is what puts the screen back in its room.
 * - A disconnected socket has no room on the server, so there is nothing to leave.
 *
 * Pusher and ActionCable make the same choice: nothing is sent while disconnected, and the wanted
 * subscriptions are replayed once the connection is there.
 */
export function useAuctionRoom(auctionId: string | undefined): void {
  useEffect(() => {
    if (!auctionId) return;
    const socket = connectSocket();
    const subscribe = () => socket.emit('auction:subscribe', auctionId);
    if (socket.connected) subscribe();
    socket.on('connect', subscribe);
    return () => {
      socket.off('connect', subscribe);
      if (socket.connected) socket.emit('auction:unsubscribe', auctionId);
    };
  }, [auctionId]);
}
