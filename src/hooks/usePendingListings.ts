import { useState, useCallback } from 'react';
import type { Listing } from '../types';
import { api } from '../services/api';

export function usePendingListings() {
  const [pendingListings, setPendingListings] = useState<Listing[]>([]);

  const refreshListings = useCallback(async () => {
    try {
      const data = await api.get<Listing[]>('/listings/pending');
      setPendingListings(data);
    } catch {
      setPendingListings([]);
    }
  }, []);

  const approveListing = async (listingId: string) => {
    await api.post(`/listings/${listingId}/approve`);
    setPendingListings(prev => prev.filter(l => l.listingId !== listingId));
  };

  const rejectListing = async (listingId: string, reason: string) => {
    await api.post(`/listings/${listingId}/reject`, { reason });
    setPendingListings(prev => prev.filter(l => l.listingId !== listingId));
  };

  return { pendingListings, refreshListings, approveListing, rejectListing };
}
