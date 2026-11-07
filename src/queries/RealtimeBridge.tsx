import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../services/socket';
import { applyBidToCache, applyAuctionCancelledToCache, applyPriceToCache } from './auctions';
import { keys } from './keys';

/**
 * Feeds Socket.IO events into the query cache. Mounted once, renders nothing. `setQueryData` rather
 * than `invalidateQueries`, because the event carries the data (`bid:placed` carries the whole
 * bid), so a refetch would be a round-trip to learn what is already in hand; live bidding is where
 * that latency is the product. The cache updaters are idempotent, so a duplicate listener would be
 * harmless.
 */
export function RealtimeBridge() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();

    function onBidPlaced(payload: {
      auctionId: string;
      // Masked server-side, like GET /:auctionId/bids: no buyerId, buyerName is a pseudonym. This
      // handler cannot know whether the bid was the viewer's own; if it was, usePlaceBid's
      // onSuccess (which does) upgrades the entry, in either arrival order (see applyBidToCache).
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

    // What a guest's socket is told instead of the bid: numbers only, so the price and the count
    // move without the page learning who bid. Signed-in sockets get `bid:placed` and do not receive
    // this.
    function onAuctionPrice(payload: { auctionId: string; currentBid: number; bidCount: number }) {
      applyPriceToCache(queryClient, payload.auctionId, payload);
    }

    // Fires for anyone subscribed to this auction's room (the auction page, AdminAuctionMonitor),
    // whichever path cancelled it: seller withdrawal or admin takedown.
    function onAuctionCancelled(payload: { auctionId: string }) {
      applyAuctionCancelledToCache(queryClient, payload.auctionId);
    }

    // Sent to a seller's own room when someone bids on one of their auctions. It carries only
    // numbers; the notification text, the My Items rows and the masked bidder names are the
    // server's to word, so this refetches them instead of patching the cache. The bids list needs
    // it too: the seller is not in the auction's own room, so `bid:placed` never reaches an
    // expanded row.
    function onBidReceived(payload: { auctionId: string }) {
      void queryClient.invalidateQueries({ queryKey: keys.notifications });
      void queryClient.invalidateQueries({ queryKey: keys.sellerItems.all });
      void queryClient.invalidateQueries({ queryKey: keys.bids.forAuction(payload.auctionId) });
    }

    socket.on('bid:placed', onBidPlaced);
    socket.on('auction:price', onAuctionPrice);
    socket.on('auction:cancelled', onAuctionCancelled);
    socket.on('bid:received', onBidReceived);
    return () => {
      socket.off('bid:placed', onBidPlaced);
      socket.off('auction:price', onAuctionPrice);
      socket.off('auction:cancelled', onAuctionCancelled);
      socket.off('bid:received', onBidReceived);
    };
  }, [queryClient]);

  return null;
}
