import { useState, useCallback } from 'react';
import type { Listing } from '../types/api';
import { api } from '../services/api';

export interface BulkApproveResult {
  approved: number;
  failed: number;
  failures: { listingId: string; error: string }[];
}

/** Running total while approveAll loops over more than one batch — see BV-049. */
export interface BulkApproveProgress {
  approved: number;
  failed: number;
}

/**
 * Every pending listing, not just the first page.
 *
 * The review queue does prev/next navigation and "X of Y" counts across the whole set, and the
 * sidebar/dashboard badges need the true count — so `refreshListings` walks every cursor page
 * (BV-029) internally and hands back the complete array, exactly like it did before pagination
 * existed. Callers were never written to expect a partial list, and a pending queue is small
 * enough that draining it up front costs nothing worth trading that away for.
 */
export function usePendingListings() {
  const [pendingListings, setPendingListings] = useState<Listing[]>([]);

  const refreshListings = useCallback(async () => {
    try {
      const all: Listing[] = [];
      let cursor: string | null = null;
      do {
        const page: { items: Listing[]; nextCursor: string | null } = await api.get(
          cursor ? `/listings/pending?limit=100&cursor=${encodeURIComponent(cursor)}` : '/listings/pending?limit=100',
        );
        all.push(...page.items);
        cursor = page.nextCursor;
      } while (cursor);
      setPendingListings(all);
    } catch {
      setPendingListings([]);
    }
  }, []);

  const approveListing = async (listingId: string): Promise<{ warning?: string }> => {
    const result = await api.post(`/listings/${listingId}/approve`);
    setPendingListings(prev => prev.filter(l => l.listingId !== listingId));
    return result ?? {};
  };

  const rejectListing = async (listingId: string, reason: string): Promise<void> => {
    await api.post(`/listings/${listingId}/reject`, { reason });
    setPendingListings(prev => prev.filter(l => l.listingId !== listingId));
  };

  // BV-049: one call approves at most 50 (the backend's own cap, to keep any single request
  // bounded); this loops calls until the server reports nothing PENDING left, so the caller
  // never has to think about batch size, and a genuinely large backlog no longer risks a
  // request timeout cutting the run off partway through with no way to tell how far it got.
  const approveAll = async (onProgress?: (progress: BulkApproveProgress) => void): Promise<BulkApproveResult> => {
    let approved = 0;
    let failed = 0;
    const failures: { listingId: string; error: string }[] = [];
    let remaining: number;
    do {
      const batch = await api.post('/listings/approve-all');
      approved += batch.approved;
      failed += batch.failed;
      failures.push(...batch.failures);
      remaining = batch.remaining;
      onProgress?.({ approved, failed });
    } while (remaining > 0);
    await refreshListings();
    return { approved, failed, failures };
  };

  return { pendingListings, refreshListings, approveListing, rejectListing, approveAll };
}
