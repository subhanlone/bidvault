import { useEffect } from 'react';
import { connectSocket } from '../services/socket';

/**
 * Keeps the socket subscribed to one auction's room while the screen is open. Nothing is sent while
 * the socket is disconnected: Socket.IO would buffer it and flush it on connect, so a screen left
 * early could queue a subscribe and an unsubscribe that reach the server together. Rooms live on
 * one connection and are not restored on reconnect, so the `connect` listener, which fires on the
 * first connection and every reconnection, puts the screen back in its room. A disconnected socket
 * has no room, so there is nothing to leave.
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
