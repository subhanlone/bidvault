import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../services/socket';
import { applyBidToCache } from './auctions';

/**
 * Feeds Socket.IO events into the query cache. Mounted once, renders nothing.
 *
 * `setQueryData` rather than `invalidateQueries`, which is what TanStack recommends when the
 * event carries the data — and `bid:placed` carries the whole bid, so refetching would be a
 * round-trip to learn something already in hand. Live bidding is the one screen where that
 * latency is the product.
 *
 * This replaces the listener that used to live inside AuctionProvider behind a
 * `socketSetupRef` guard, which existed because the effect could run twice under StrictMode
 * and attach two listeners — a duplicate listener being one of the suspected causes of the
 * bid double-count. The dedupe now lives in the cache updater instead, so a second listener
 * would be harmless rather than a bug.
 */
export function RealtimeBridge() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();

    function onBidPlaced(payload: {
      auctionId: string;
      bid: { bidId: string; amount: number; buyerId: string; buyerName: string; timestamp: string };
    }) {
      const { auctionId, bid } = payload;
      applyBidToCache(queryClient, auctionId, {
        bidId: bid.bidId,
        auctionId,
        buyerId: bid.buyerId,
        buyerName: bid.buyerName,
        amount: bid.amount,
        timestamp: bid.timestamp,
      });
    }

    socket.on('bid:placed', onBidPlaced);
    return () => {
      socket.off('bid:placed', onBidPlaced);
    };
  }, [queryClient]);

  return null;
}
