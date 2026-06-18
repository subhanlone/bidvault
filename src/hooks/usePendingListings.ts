import { useState, useCallback } from 'react';
import type { Listing } from '../types';
import { api } from '../services/api';

export interface BulkApproveResult {
  approved: number;
  failed: number;
  failures: { listingId: string; error: string }[];
}

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

  const approveListing = async (listingId: string): Promise<{ warning?: string }> => {
    const result = await api.post<{ warning?: string }>(`/listings/${listingId}/approve`);
    setPendingListings(prev => prev.filter(l => l.listingId !== listingId));
    return result ?? {};
  };

  const rejectListing = async (listingId: string, reason: string): Promise<void> => {
    await api.post(`/listings/${listingId}/reject`, { reason });
    setPendingListings(prev => prev.filter(l => l.listingId !== listingId));
  };

  const approveAll = async (): Promise<BulkApproveResult> => {
    const result = await api.post<BulkApproveResult>('/listings/approve-all');
    await refreshListings();
    return result;
  };

  return { pendingListings, refreshListings, approveListing, rejectListing, approveAll };
}
