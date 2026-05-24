import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Auction, Bid, Listing, User } from '../types';
import { mockApi, auctions as seedAuctions, bids as seedBids } from '../services/mockApi';
import { SEED_PENDING_LISTINGS } from '../services/mockData';

interface AuctionContextType {
  auctions: Auction[];
  bids: Record<string, Bid[]>;
  pendingListings: Listing[];
  watchlist: string[];
  getAuction: (id: string) => Auction | undefined;
  placeBid: (auctionId: string, amount: number, buyer: User) => Promise<{ success: boolean; error?: string }>;
  addCompetingBid: (auctionId: string) => Bid | null;
  approveListing: (listingId: string) => Promise<void>;
  rejectListing: (listingId: string, reason: string) => Promise<void>;
  refreshListings: () => Promise<void>;
  toggleWatchlist: (auctionId: string) => void;
  isWatched: (auctionId: string) => boolean;
}

const AuctionContext = createContext<AuctionContextType | null>(null);

const COMPETITOR_NAMES = ['Usman', 'Ali', 'Zainab', 'Hassan', 'Bilal', 'Amina', 'Omar', 'Fatima', 'Kamran', 'Sara'];

function buildBidMap(bidList: Bid[]): Record<string, Bid[]> {
  const map: Record<string, Bid[]> = {};
  for (const b of bidList) {
    if (!map[b.auctionId]) map[b.auctionId] = [];
    map[b.auctionId].push(b);
  }
  return map;
}

export function AuctionProvider({ children }: { children: React.ReactNode }) {
  const [auctions, setAuctions] = useState<Auction[]>([...seedAuctions]);
  const [bids, setBids] = useState<Record<string, Bid[]>>(buildBidMap([...seedBids]));
  const [pendingListings, setPendingListings] = useState<Listing[]>([...SEED_PENDING_LISTINGS]);
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('bidvault_watchlist') ?? '[]'); } catch { return []; }
  });

  const refreshListings = useCallback(async () => {
    const res = await mockApi.getPendingListings();
    if (res.success && res.data) setPendingListings(res.data);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => { void refreshListings(); }, 0);
    return () => clearTimeout(timeoutId);
  }, [refreshListings]);

  const getAuction = useCallback(
    (id: string) => auctions.find(a => a.auctionId === id),
    [auctions],
  );

  const placeBid = async (auctionId: string, amount: number, buyer: User) => {
    const res = await mockApi.placeBid(auctionId, amount, buyer);
    if (res.success && res.data) {
      setAuctions(prev =>
        prev.map(a =>
          a.auctionId === auctionId
            ? { ...a, currentBid: amount, bidCount: a.bidCount + 1 }
            : a,
        ),
      );
      setBids(prev => ({
        ...prev,
        [auctionId]: [res.data!, ...(prev[auctionId] ?? [])],
      }));
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const addCompetingBid = useCallback(
    (auctionId: string): Bid | null => {
      const auction = seedAuctions.find(a => a.auctionId === auctionId);
      if (!auction) return null;
      const increments = [1, 2, 3];
      const inc = increments[Math.floor(Math.random() * increments.length)] * auction.minIncrement;
      const amount = auction.currentBid + inc;
      const name = COMPETITOR_NAMES[Math.floor(Math.random() * COMPETITOR_NAMES.length)];
      const newBid: Bid = {
        bidId: `bc-${Date.now()}`,
        auctionId,
        buyerId: `u-comp-${Date.now()}`,
        buyerName: name,
        amount,
        timestamp: new Date().toISOString(),
        isWin: false,
      };
      auction.currentBid = amount;
      auction.bidCount += 1;
      seedBids.unshift(newBid);
      setAuctions(prev =>
        prev.map(a =>
          a.auctionId === auctionId
            ? { ...a, currentBid: amount, bidCount: a.bidCount + 1 }
            : a,
        ),
      );
      setBids(prev => ({
        ...prev,
        [auctionId]: [newBid, ...(prev[auctionId] ?? [])],
      }));
      return newBid;
    },
    [],
  );

  const approveListing = async (listingId: string) => {
    await mockApi.approveListing(listingId);
    setPendingListings(prev => prev.filter(l => l.listingId !== listingId));
  };

  const rejectListing = async (listingId: string, reason: string) => {
    await mockApi.rejectListing(listingId, reason);
    setPendingListings(prev => prev.filter(l => l.listingId !== listingId));
  };

  const toggleWatchlist = useCallback((auctionId: string) => {
    setWatchlist(prev => {
      const next = prev.includes(auctionId) ? prev.filter(id => id !== auctionId) : [...prev, auctionId];
      localStorage.setItem('bidvault_watchlist', JSON.stringify(next));
      return next;
    });
  }, []);

  const isWatched = useCallback((auctionId: string) => watchlist.includes(auctionId), [watchlist]);

  return (
    <AuctionContext.Provider value={{
      auctions, bids, pendingListings, watchlist,
      getAuction, placeBid, addCompetingBid,
      approveListing, rejectListing, refreshListings,
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
