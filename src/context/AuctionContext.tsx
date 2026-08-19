import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { Auction, Bid } from '../types';
import { api, ApiError } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from './AuthContext';

interface AuctionContextType {
  auctions: Auction[];
  auctionsLoaded: boolean;
  auctionsError: boolean;
  bids: Record<string, Bid[]>;
  watchlist: string[];
  /** Full rows for watched auctions, closed ones included. `auctions` holds only live ones. */
  watchlistAuctions: Auction[];
  getAuction: (id: string) => Auction | undefined;
  placeBid: (auctionId: string, amount: number) => Promise<{ success: boolean; error?: string }>;
  fetchBids: (auctionId: string) => Promise<void>;
  fetchMyBids: () => Promise<void>;
  toggleWatchlist: (auctionId: string) => Promise<void>;
  isWatched: (auctionId: string) => boolean;
}

const AuctionContext = createContext<AuctionContextType | null>(null);

export function AuctionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [auctionsLoaded, setAuctionsLoaded] = useState(false);
  const [auctionsError, setAuctionsError] = useState(false);
  const [bids, setBids] = useState<Record<string, Bid[]>>({});
  const [watchlist, setWatchlist] = useState<string[]>([]);
  // Full auction rows for the watched ids, including closed ones. Separate from `auctions`,
  // which is the live list — see the fetch below.
  const [watchlistAuctions, setWatchlistAuctions] = useState<Auction[]>([]);
  const socketSetupRef = useRef(false);

  // NEW-13: every bid id this client has already folded into state.
  //
  // Your own bid arrives twice — once as the POST response, once as the socket broadcast —
  // and both used to apply it. The socket handler deduped the bid *list* by id but still
  // incremented bidCount, and placeBid did both again with no guard at all, so a single bid
  // read as "2 bids" and, when the broadcast beat the HTTP response, entered the list twice
  // (six React duplicate-key errors per bid).
  //
  // A ref rather than deriving from `bids`: it updates synchronously, so two applications in
  // the same tick cannot both pass the check. Reading state here would let them race.
  const appliedBidIds = useRef<Set<string>>(new Set());

  /** Fold a bid into state exactly once, whichever path delivered it first. */
  const applyBid = useCallback((auctionId: string, bid: Bid) => {
    if (appliedBidIds.current.has(bid.bidId)) return;
    appliedBidIds.current.add(bid.bidId);

    setBids(prev => ({ ...prev, [auctionId]: [bid, ...(prev[auctionId] ?? [])] }));

    // max(), not assignment: a broadcast that arrives out of order must never walk the
    // price backwards.
    const fold = (a: Auction): Auction =>
      a.auctionId === auctionId
        ? { ...a, currentBid: Math.max(a.currentBid, bid.amount), bidCount: a.bidCount + 1 }
        : a;

    setAuctions(prev => prev.map(fold));
    // `watchlistAuctions` holds its own rows rather than pointing into `auctions`, so it has
    // to be folded separately. Bid on a watched auction from its live page and, without
    // this, the watchlist would still show the price from when it was fetched while Browse
    // showed the new one — the same auction, two numbers, in one session.
    // (Sitting on the watchlist page it still will not tick: the server emits bid:placed to
    // the `auction:<id>` room, which only the live-bidding and monitor screens join.)
    setWatchlistAuctions(prev => prev.map(fold));
  }, []);

  /**
   * Register bids loaded in bulk so a later broadcast for one of them is recognised as a
   * duplicate. Without this, reopening an auction and then receiving a repeat broadcast for
   * an already-listed bid would inflate bidCount again.
   */
  const rememberBidIds = useCallback((list: Bid[]) => {
    for (const b of list) appliedBidIds.current.add(b.bidId);
  }, []);

  // Fetch only ACTIVE auctions on mount (BA-09)
  useEffect(() => {
    api.get<Auction[]>('/auctions?status=ACTIVE').then(data => {
      setAuctions(data);
      setAuctionsLoaded(true);
    }).catch(() => {
      setAuctionsLoaded(true);
      setAuctionsError(true);  // BA-10: distinguish network error from empty results
    });
  }, []);

  // Sync watchlist from backend when user logs in
  useEffect(() => {
    if (!user || (user.role !== 'BUYER' && user.role !== 'ADMIN')) {
      Promise.resolve().then(() => setWatchlist([]));
      return;
    }
    // NEW-12: /watchlist now returns full auctions, kept in their own list rather than
    // merged into `auctions`. BuyerWatchlist used to render by intersecting the watched ids
    // with `auctions`, which holds ACTIVE auctions only — so a watched auction vanished from
    // the page the moment it closed while the profile kept counting it.
    //
    // Deliberately NOT merged into `auctions`: that array means "live auctions" to every
    // other screen, and folding closed ones in puts them on Browse under "Live Auctions".
    api.get<Auction[]>('/watchlist').then(data => {
      setWatchlist(data.map(a => a.auctionId));
      setWatchlistAuctions(data);
    }).catch(() => {});
  }, [user?.userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Global Socket.IO bid:placed listener
  useEffect(() => {
    if (socketSetupRef.current) return;
    socketSetupRef.current = true;

    const socket = getSocket();

    function onBidPlaced(payload: {
      auctionId: string;
      bid: { bidId: string; amount: number; buyerId: string; buyerName: string; timestamp: string };
    }) {
      const { auctionId, bid } = payload;
      applyBid(auctionId, {
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
      socketSetupRef.current = false;
    };
  }, [applyBid]);

  // Falls back to the watchlist rows because `auctions` is seeded from ?status=ACTIVE: a
  // watched auction that has closed exists only in `watchlistAuctions`, and the watchlist
  // cards link straight into live bidding, which resolves through here. Without the
  // fallback that click lands on "Auction not found".
  const getAuction = useCallback(
    (id: string) =>
      auctions.find(a => a.auctionId === id) ?? watchlistAuctions.find(a => a.auctionId === id),
    [auctions, watchlistAuctions],
  );

  const fetchBids = useCallback(async (auctionId: string) => {
    try {
      const data = await api.get<Bid[]>(`/auctions/${auctionId}/bids`);
      rememberBidIds(data);
      setBids(prev => ({ ...prev, [auctionId]: data }));
    } catch {
      // Non-critical — bids can load empty
    }
  }, [rememberBidIds]);

  const fetchMyBids = useCallback(async () => {
    if (!user || user.role !== 'BUYER') return;
    try {
      const data = await api.get<Array<Bid & { auction: Auction }>>('/auctions/mine/bids');
      const bidsByAuction: Record<string, Bid[]> = {};
      const newAuctions: Auction[] = [];
      for (const { auction, ...bid } of data) {
        if (!bidsByAuction[bid.auctionId]) bidsByAuction[bid.auctionId] = [];
        bidsByAuction[bid.auctionId].push(bid as Bid);
        if (!newAuctions.some(a => a.auctionId === auction.auctionId)) {
          newAuctions.push(auction);
        }
      }
      for (const list of Object.values(bidsByAuction)) rememberBidIds(list);
      setBids(prev => ({ ...prev, ...bidsByAuction }));
      setAuctions(prev => {
        const merged = [...prev];
        for (const a of newAuctions) {
          if (!merged.some(x => x.auctionId === a.auctionId)) merged.push(a);
        }
        return merged;
      });
    } catch { /* non-critical */ }
  }, [user, rememberBidIds]);

  const placeBid = async (auctionId: string, amount: number) => {
    try {
      const bid = await api.post<Bid>(`/auctions/${auctionId}/bids`, { amount });
      // Goes through the same gate as the socket broadcast: whichever arrives first applies
      // the bid, the other is a no-op. Not skipped entirely, because the broadcast is not
      // guaranteed — if the socket is down this is the only path that updates the UI.
      applyBid(auctionId, bid);
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Could not place bid' };
    }
  };

  const toggleWatchlist = useCallback(async (auctionId: string) => {
    if (!user) return;

    const isCurrentlyWatched = watchlist.includes(auctionId);
    // Captured before the optimistic removal so a failed delete can put the row back.
    const removed = watchlistAuctions.find(a => a.auctionId === auctionId);
    const added = auctions.find(a => a.auctionId === auctionId);

    // Optimistic update — ids and rows move together, or the watchlist page and the counts
    // that read from them drift apart.
    setWatchlist(prev =>
      isCurrentlyWatched ? prev.filter(id => id !== auctionId) : [...prev, auctionId],
    );
    setWatchlistAuctions(prev =>
      isCurrentlyWatched
        ? prev.filter(a => a.auctionId !== auctionId)
        : added && !prev.some(a => a.auctionId === auctionId)
          ? [added, ...prev]
          : prev,
    );

    try {
      if (isCurrentlyWatched) {
        await api.del(`/watchlist/${auctionId}`);
      } else {
        await api.post(`/watchlist/${auctionId}`);
      }
    } catch {
      // Revert on failure
      setWatchlist(prev =>
        isCurrentlyWatched ? [...prev, auctionId] : prev.filter(id => id !== auctionId),
      );
      setWatchlistAuctions(prev =>
        isCurrentlyWatched
          ? removed && !prev.some(a => a.auctionId === auctionId)
            ? [removed, ...prev]
            : prev
          : prev.filter(a => a.auctionId !== auctionId),
      );
    }
  }, [user, watchlist, watchlistAuctions, auctions]);

  const isWatched = useCallback((auctionId: string) => watchlist.includes(auctionId), [watchlist]);

  return (
    <AuctionContext.Provider value={{
      auctions, auctionsLoaded, auctionsError, bids, watchlist, watchlistAuctions,
      getAuction, placeBid, fetchBids, fetchMyBids,
      toggleWatchlist, isWatched,
    }}>
      {children}
    </AuctionContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuction() {
  const ctx = useContext(AuctionContext);
  if (!ctx) throw new Error('useAuction must be used within AuctionProvider');
  return ctx;
}

export { ApiError };
