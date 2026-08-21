import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Auction, Bid } from '../types/api';
import { keys } from './keys';
import { useAuth } from '../context/AuthContext';

/**
 * Auction data, as queries rather than a hand-rolled cache.
 *
 * Each hook is a thin wrapper over the typed client — `api.get('/auctions')` already knows its
 * own response type, so nothing here re-declares a shape. That is why no generator was
 * adopted: orval and kubb emit these, but they would emit 43 of them, cost 134 and 207
 * packages, and replace an emitter that already works.
 */

// ---- reads --------------------------------------------------------------------------------

/** The live list. Every screen that says "auctions" means this one. */
export function useActiveAuctions() {
  return useQuery({
    queryKey: keys.auctions.active,
    queryFn: () => api.get('/auctions?status=ACTIVE'),
  });
}

/**
 * One auction, fetched directly rather than looked up in a list.
 *
 * This is what retires NEW-17. `getAuction()` used to search the ACTIVE list and fall back to
 * the watchlist rows, so a closed watched auction — present in neither on a cold load —
 * resolved to undefined and the live-bidding screen rendered "Auction not found". Asking the
 * server removes the question: GET /auctions/{id} is authoritative whatever the status, and
 * it is the only endpoint that overlays the Redis bid cache.
 */
export function useAuctionDetail(auctionId: string | undefined) {
  return useQuery({
    queryKey: keys.auctions.detail(auctionId ?? ''),
    queryFn: () => api.get(`/auctions/${auctionId}`),
    enabled: Boolean(auctionId),
  });
}

/** Full auction rows for everything the signed-in buyer watches, closed ones included. */
export function useWatchlist(enabled = true) {
  return useQuery({
    queryKey: keys.auctions.watchlist,
    queryFn: () => api.get('/watchlist'),
    enabled,
  });
}

export function useBids(auctionId: string | undefined) {
  return useQuery({
    queryKey: keys.bids.forAuction(auctionId ?? ''),
    queryFn: () => api.get(`/auctions/${auctionId}/bids`),
    enabled: Boolean(auctionId),
  });
}

export function useMyBids(enabled = true) {
  return useQuery({
    queryKey: keys.bids.mine,
    queryFn: () => api.get('/auctions/mine/bids'),
    enabled,
  });
}

// ---- the fold -----------------------------------------------------------------------------

/**
 * Applies one bid to every cached copy of the auction it belongs to, and to that auction's
 * bid list.
 *
 * Called from two places that both race to deliver the same bid: the mutation below, and the
 * socket bridge. They no longer need to coordinate, because both are idempotent by
 * construction — the bid list updater checks membership in the cached value it was handed,
 * synchronously, inside the update.
 *
 * That check used to live in a `useRef<Set<string>>` maintained by hand (NEW-13). The ref
 * existed because reading from React state would let two applications in the same tick both
 * pass. Reading from the cache has no such gap, so the ref is gone and the race is no longer
 * expressible.
 *
 * `Math.max` on the price, not assignment: a broadcast arriving out of order must never walk
 * it backwards.
 */
export function applyBidToCache(queryClient: QueryClient, auctionId: string, bid: Bid) {
  let alreadyKnown = false;

  queryClient.setQueryData<Bid[]>(keys.bids.forAuction(auctionId), (old) => {
    if (!old) return old; // nothing cached for this auction; the next fetch will include it
    if (old.some((b) => b.bidId === bid.bidId)) {
      alreadyKnown = true;
      return old;
    }
    return [bid, ...old];
  });

  if (alreadyKnown) return;

  const fold = (a: Auction): Auction =>
    a.auctionId === auctionId
      ? { ...a, currentBid: Math.max(a.currentBid, bid.amount), bidCount: a.bidCount + 1 }
      : a;

  // One call, every auction-shaped cache entry: the live list, this auction's detail, the
  // watchlist. See queries/keys.ts for why they share a prefix.
  queryClient.setQueriesData<Auction | Auction[]>({ queryKey: keys.auctions.all }, (old) => {
    if (!old) return old;
    return Array.isArray(old) ? old.map(fold) : fold(old);
  });
}

// ---- writes -------------------------------------------------------------------------------

export function usePlaceBid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ auctionId, amount }: { auctionId: string; amount: number }) =>
      api.post(`/auctions/${auctionId}/bids`, { amount }),
    onSuccess: (bid, { auctionId }) => {
      // Applied here as well as from the socket because the broadcast is not guaranteed — if
      // the socket is down this is the only path that updates the UI. Whichever arrives first
      // wins; the other is a no-op.
      applyBidToCache(queryClient, auctionId, bid);
    },
  });
}

/**
 * Add or remove a watch, optimistically.
 *
 * `onMutate` writes the change and returns the previous value; `onError` puts it back;
 * `onSettled` refetches so the server has the last word. That is TanStack's documented
 * optimistic pattern, and it replaces a hand-written version that had to remember the removed
 * row itself in order to restore it.
 */
export function useToggleWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ auctionId, watched }: { auctionId: string; watched: boolean; row?: Auction }) =>
      watched ? api.del(`/watchlist/${auctionId}`) : api.post(`/watchlist/${auctionId}`),

    onMutate: async ({ auctionId, watched, row }) => {
      await queryClient.cancelQueries({ queryKey: keys.auctions.watchlist });
      const previous = queryClient.getQueryData<Auction[]>(keys.auctions.watchlist);

      queryClient.setQueryData<Auction[]>(keys.auctions.watchlist, (old = []) =>
        watched
          ? old.filter((a) => a.auctionId !== auctionId)
          : row && !old.some((a) => a.auctionId === auctionId)
            ? [row, ...old]
            : old,
      );

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(keys.auctions.watchlist, context.previous);
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: keys.auctions.watchlist });
    },
  });
}

/**
 * The ergonomics the old context exposed — `toggle(id)` and `isWatched(id)` — over the query
 * cache. Kept because five call sites use that shape and it reads better than threading the
 * mutation's arguments through each of them.
 *
 * Watched state is derived from the cached watchlist rather than a separate array of ids. The
 * old context kept both, and NEW-12 was exactly what happens when they disagree: the profile
 * counted an auction from the id list that the watchlist page could not render.
 */
export function useWatchlistToggle() {
  const { user } = useAuth();
  const canWatch = user?.role === 'BUYER' || user?.role === 'ADMIN';

  const { data: watched = [] } = useWatchlist(canWatch);
  const { data: active = [] } = useActiveAuctions();
  const mutation = useToggleWatchlist();

  const isWatched = (auctionId: string) => watched.some((a) => a.auctionId === auctionId);

  const toggle = (auctionId: string) => {
    if (!canWatch) return;
    mutation.mutate({
      auctionId,
      watched: isWatched(auctionId),
      // The row to show optimistically when adding. Taken from whichever cache already has it.
      row:
        active.find((a) => a.auctionId === auctionId) ??
        watched.find((a) => a.auctionId === auctionId),
    });
  };

  return { toggle, isWatched, watched };
}
