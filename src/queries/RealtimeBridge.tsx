import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../services/socket';
import { applyBidToCache, applyAuctionCancelledToCache } from './auctions';

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
      // BV-039: masked server-side, same as GET /:auctionId/bids -- no buyerId, buyerName is a
      // pseudonym. This handler can't know whether the bid was the current viewer's own; if it
      // was, usePlaceBid's onSuccess (which does know) upgrades this entry, in either arrival
      // order -- see applyBidToCache.
      bid: { bidId: string; amount: number; buyerName: string; timestamp: string };
    }) {
      const { auctionId, bid } = payload;
      applyBidToCache(queryClient, auctionId, {
        bidId: bid.bidId,
        auctionId,
        isMine: false,
        buyerName: bid.buyerName,
        amount: bid.amount,
        timestamp: bid.timestamp,
      });
    }

    // B4/C4: fires for anyone subscribed to this auction's room (BuyerLiveBidding,
    // AdminAuctionMonitor) whichever path cancelled it -- seller withdrawal or admin takedown.
    function onAuctionCancelled(payload: { auctionId: string }) {
      applyAuctionCancelledToCache(queryClient, payload.auctionId);
    }

    socket.on('bid:placed', onBidPlaced);
    socket.on('auction:cancelled', onAuctionCancelled);
    return () => {
      socket.off('bid:placed', onBidPlaced);
      socket.off('auction:cancelled', onAuctionCancelled);
    };
  }, [queryClient]);

  return null;
}
