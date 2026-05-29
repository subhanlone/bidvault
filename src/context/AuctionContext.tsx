import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { Auction, Bid } from '../types';
import { api, ApiError } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from './AuthContext';

interface AuctionContextType {
  auctions: Auction[];
  auctionsLoaded: boolean;
  bids: Record<string, Bid[]>;
  watchlist: string[];
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
  const [bids, setBids] = useState<Record<string, Bid[]>>({});
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const socketSetupRef = useRef(false);

  // Fetch all auctions on mount
  useEffect(() => {
    api.get<Auction[]>('/auctions').then(data => {
      setAuctions(data);
      setAuctionsLoaded(true);
    }).catch(() => { setAuctionsLoaded(true); });
  }, []);

  // Sync watchlist from backend when user logs in
  useEffect(() => {
    if (!user || (user.role !== 'BUYER' && user.role !== 'ADMIN')) {
      Promise.resolve().then(() => setWatchlist([]));
      return;
    }
    api.get<Array<{ auctionId: string }>>('/watchlist').then(data => {
      setWatchlist(data.map(item => item.auctionId));
    }).catch(() => {});
  }, [user?.userId]);

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
      const newBid: Bid = {
        bidId: bid.bidId,
        auctionId,
        buyerId: bid.buyerId,
        buyerName: bid.buyerName,
        amount: bid.amount,
        timestamp: bid.timestamp,
      };
      setBids(prev => {
        const existing = prev[auctionId] ?? [];
        if (existing.some(b => b.bidId === newBid.bidId)) return prev;
        return { ...prev, [auctionId]: [newBid, ...existing] };
      });
      setAuctions(prev =>
        prev.map(a =>
          a.auctionId === auctionId ? { ...a, currentBid: bid.amount, bidCount: a.bidCount + 1 } : a,
        ),
      );
    }

    socket.on('bid:placed', onBidPlaced);

    return () => {
      socket.off('bid:placed', onBidPlaced);
      socketSetupRef.current = false;
    };
  }, []);

  const getAuction = useCallback(
    (id: string) => auctions.find(a => a.auctionId === id),
    [auctions],
  );

  const fetchBids = useCallback(async (auctionId: string) => {
    try {
      const data = await api.get<Bid[]>(`/auctions/${auctionId}/bids`);
      setBids(prev => ({ ...prev, [auctionId]: data }));
    } catch {
      // Non-critical — bids can load empty
    }
  }, []);

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
      setBids(prev => ({ ...prev, ...bidsByAuction }));
      setAuctions(prev => {
        const merged = [...prev];
        for (const a of newAuctions) {
          if (!merged.some(x => x.auctionId === a.auctionId)) merged.push(a);
        }
        return merged;
      });
    } catch { /* non-critical */ }
  }, [user]);

  const placeBid = async (auctionId: string, amount: number) => {
    try {
      const bid = await api.post<Bid>(`/auctions/${auctionId}/bids`, { amount });
      setBids(prev => ({ ...prev, [auctionId]: [bid, ...(prev[auctionId] ?? [])] }));
      setAuctions(prev =>
        prev.map(a =>
          a.auctionId === auctionId
            ? { ...a, currentBid: amount, bidCount: a.bidCount + 1 }
            : a,
        ),
      );
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Could not place bid' };
    }
  };

  const toggleWatchlist = useCallback(async (auctionId: string) => {
    if (!user) return;

    const isCurrentlyWatched = watchlist.includes(auctionId);

    // Optimistic update
    setWatchlist(prev =>
      isCurrentlyWatched ? prev.filter(id => id !== auctionId) : [...prev, auctionId],
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
    }
  }, [user, watchlist]);

  const isWatched = useCallback((auctionId: string) => watchlist.includes(auctionId), [watchlist]);

  return (
    <AuctionContext.Provider value={{
      auctions, auctionsLoaded, bids, watchlist,
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
