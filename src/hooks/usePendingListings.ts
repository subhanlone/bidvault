import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Listing } from '../types/api';
import { api } from '../services/api';
import { keys } from '../queries/keys';

export interface BulkApproveResult {
  approved: number;
  failed: number;
  failures: { listingId: string; error: string }[];
}

/** Running total while approveAll loops over more than one batch. */
export interface BulkApproveProgress {
  approved: number;
  failed: number;
}

/**
 * `loading` until the first answer, then `ready` or `error`. A screen must check this before it
 * reads `pendingListings`: an empty array means "nothing pending" only when the status is `ready`.
 */
export type PendingStatus = 'loading' | 'ready' | 'error';

// Walks every cursor page: the review queue does prev/next and "X of Y" across the whole set, and
// the badges need the true count, so a partial list would be wrong. A pending queue is small enough
// that this costs little.
async function fetchAllPending(): Promise<Listing[]> {
  const all: Listing[] = [];
  let cursor: string | null = null;
  do {
    const page: { items: Listing[]; nextCursor: string | null } = await api.get(
      cursor ? `/listings/pending?limit=100&cursor=${encodeURIComponent(cursor)}` : '/listings/pending?limit=100',
    );
    all.push(...page.items);
    cursor = page.nextCursor;
  } while (cursor);
  return all;
}

const NONE: Listing[] = [];

/**
 * The pending-review queue, shared by every screen that shows it: one query means one request, and
 * a change made anywhere (a retry that works, an approval, a rejection) is seen everywhere at once.
 * A failed load is `error`, never an empty list (that would be drawn as "All caught up!"), and what
 * the cache held is not known to be current either, so screens show the error instead of rows.
 */
export function usePendingListings() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: keys.admin.pendingListings,
    queryFn: fetchAllPending,
    // The queue changes under the admin (sellers submit, other admins approve), so every screen that
    // mounts asks again. Observers that mount together still share a single request.
    staleTime: 0,
  });

  const status: PendingStatus = query.isError ? 'error' : query.isPending ? 'loading' : 'ready';
  const pendingListings = query.data ?? NONE;

  /** Ask the server again, e.g. when a seller submits a listing. */
  const refreshListings = useCallback(
    () => queryClient.invalidateQueries({ queryKey: keys.admin.pendingListings }),
    [queryClient],
  );

  const { refetch } = query;
  /** For a "Try again" button. */
  const retry = useCallback(() => { void refetch(); }, [refetch]);
  /** True while a "Try again" is in flight, so the button cannot be pressed twice. */
  const retrying = query.isError && query.isFetching;

  const removeFromQueue = (listingId: string) =>
    queryClient.setQueryData<Listing[]>(keys.admin.pendingListings, prev => prev?.filter(l => l.listingId !== listingId));

  const approveListing = async (listingId: string): Promise<{ warning?: string }> => {
    const result = await api.post(`/listings/${listingId}/approve`);
    removeFromQueue(listingId);
    return result ?? {};
  };

  const rejectListing = async (listingId: string, reason: string): Promise<void> => {
    await api.post(`/listings/${listingId}/reject`, { reason });
    removeFromQueue(listingId);
  };

  // One call approves at most 50 (the backend's cap, to keep a request bounded); this loops until
  // the server reports nothing PENDING left, so the caller never thinks about batch size and a
  // large backlog cannot time out partway with no way to tell how far it got.
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

  return { pendingListings, status, retry, retrying, refreshListings, approveListing, rejectListing, approveAll };
}
