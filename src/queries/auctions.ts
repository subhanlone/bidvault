import { useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData, type QueryClient, type UseInfiniteQueryResult } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Auction, PublicBid, PaginatedAuctions, PaginatedBidsWithAuction } from '../types/api';
import { keys } from './keys';
import { useAuth } from '../context/AuthContext';

/**
 * Auction data, as queries rather than a hand-rolled cache.
 *
 * Each hook is a thin wrapper over the typed client — `api.get('/auctions')` already knows its
 * own response type, so nothing here re-declares a shape. That is why no generator was
 * adopted: orval and kubb emit these, but they would emit 43 of them, cost 134 and 207
 * packages, and replace an emitter that already works.
 *
 * BV-029: the three list endpoints below (`/auctions`, `/watchlist`, `/auctions/mine/bids`)
 * are cursor-paginated server-side now, so they are `useInfiniteQuery` here — `.data.pages`
 * is an array of `{items, nextCursor}`, flattened by the small helper below wherever a screen
 * wants "everything loaded so far" as one list.
 */

/** `data.pages.flatMap(p => p.items)` — every screen that reads a paginated list wants this. */
export function flattenPages<T>(data: InfiniteData<{ items: T[]; nextCursor: string | null }> | undefined): T[] {
  return data?.pages.flatMap((p) => p.items) ?? [];
}

/**
 * Walks an infinite query to completion and returns the flattened, complete list.
 *
 * For screens that show an exact figure derived from "every row" — a count, a sum, a
 * highest-bid, a tab badge, prev/next through the full queue — rather than a list a person
 * scrolls through. Cursor pagination deliberately returns no total, so the only honest way to
 * report one is to have actually fetched every page; these lists are all scoped to one seller,
 * one buyer, or the admin's own queue, so "every page" stays small.
 *
 * `BuyerBrowseAuctions` is the one screen in this app that does NOT use this — a public
 * catalog has no aggregate that depends on having loaded all of it, so it stays genuinely
 * incremental (`useInfiniteScrollTrigger`, fetch-on-scroll) instead.
 */
export function useDrainedPages<T>(
  query: UseInfiniteQueryResult<InfiniteData<{ items: T[]; nextCursor: string | null }>>,
): T[] {
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } = query;
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  return flattenPages(data);
}

// ---- reads --------------------------------------------------------------------------------

/**
 * The live list. Every screen that says "auctions" means this one.
 *
 * `category`/`search` are server-side filters (the backend already supports both) and are
 * part of the query key on purpose — changing either starts a fresh paginated query rather
 * than filtering pages already in the cache, so a match on page 4 is never missed just
 * because pages 1-3 loaded first.
 */
export function useActiveAuctions(params?: { category?: string; search?: string }) {
  const category = params?.category?.trim();
  const search = params?.search?.trim();
  return useInfiniteQuery({
    queryKey: [...keys.auctions.active, { category, search }] as const,
    queryFn: ({ pageParam }) => {
      const qs = new URLSearchParams({ status: 'ACTIVE' });
      if (category) qs.set('category', category);
      if (search) qs.set('search', search);
      if (pageParam) qs.set('cursor', pageParam);
      return api.get(`/auctions?${qs.toString()}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: PaginatedAuctions) => lastPage.nextCursor ?? undefined,
  });
}

/**
 * One auction, fetched directly rather than looked up in a list.
 *
 * This is what retires NEW-17. `getAuction()` used to search the ACTIVE list and fall back to
 * the watchlist rows, so a closed watched auction — present in neither on a cold load —
 * resolved to undefined and the live-bidding screen rendered "Auction not found". Asking the
 * server removes the question: GET /auctions/{id} is authoritative whatever the status.
 */
export function useAuctionDetail(auctionId: string | undefined) {
  return useQuery({
    queryKey: keys.auctions.detail(auctionId ?? ''),
    queryFn: () => api.get(`/auctions/${auctionId}`),
    enabled: Boolean(auctionId),
  });
}

/** Every auction the signed-in buyer watches, closed ones included — paginated. */
export function useWatchlist(enabled = true) {
  return useInfiniteQuery({
    queryKey: keys.auctions.watchlist,
    queryFn: ({ pageParam }) =>
      api.get(pageParam ? `/watchlist?cursor=${encodeURIComponent(pageParam)}` : '/watchlist'),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: PaginatedAuctions) => lastPage.nextCursor ?? undefined,
    enabled,
  });
}

/**
 * Bid history for one auction. Not one of BV-029's five infinite-scroll screens — this feeds
 * BuyerLiveBidding's recent-bids panel, which only ever shows the newest handful — so this
 * stays a single bounded page rather than `useInfiniteQuery`.
 */
export function useBids(auctionId: string | undefined) {
  return useQuery({
    queryKey: keys.bids.forAuction(auctionId ?? ''),
    queryFn: () => api.get(`/auctions/${auctionId}/bids`),
    enabled: Boolean(auctionId),
    select: (data) => data.items,
  });
}

/** Every bid the signed-in buyer has ever placed, each with its auction — paginated. */
export function useMyBids(enabled = true) {
  return useInfiniteQuery({
    queryKey: keys.bids.mine,
    queryFn: ({ pageParam }) =>
      api.get(pageParam ? `/auctions/mine/bids?cursor=${encodeURIComponent(pageParam)}` : '/auctions/mine/bids'),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: PaginatedBidsWithAuction) => lastPage.nextCursor ?? undefined,
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
 *
 * BV-029: `useActiveAuctions`/`useWatchlist` cache entries are now `InfiniteData` (a `.pages`
 * array of `{items, nextCursor}`), not a plain array — folded page by page, item by item.
 * `useAuctionDetail`'s single-object cache entry is unaffected and still folds directly.
 */
export function applyBidToCache(queryClient: QueryClient, auctionId: string, bid: PublicBid) {
  let isNewBid = false;

  queryClient.setQueryData<{ items: PublicBid[]; nextCursor: string | null }>(
    keys.bids.forAuction(auctionId),
    (old) => {
      if (!old) return old; // nothing cached for this auction; the next fetch will include it
      const idx = old.items.findIndex((b) => b.bidId === bid.bidId);
      if (idx === -1) {
        isNewBid = true;
        return { ...old, items: [bid, ...old.items] };
      }
      // BV-039: the masked bid:placed broadcast and this client's own mutation response (which
      // knows isMine for certain) can arrive in either order over two different connections --
      // if this write knows it's the caller's own and the cached row doesn't yet, upgrade it in
      // place rather than discard it as a duplicate.
      if (bid.isMine && !old.items[idx].isMine) {
        const items = [...old.items];
        items[idx] = bid;
        return { ...old, items };
      }
      return old;
    },
  );

  if (!isNewBid) return;

  const fold = (a: Auction): Auction =>
    a.auctionId === auctionId
      ? { ...a, currentBid: Math.max(a.currentBid, bid.amount), bidCount: a.bidCount + 1 }
      : a;

  // One call, every auction-shaped cache entry: the live list, this auction's detail, the
  // watchlist, my-bids' embedded auctions. See queries/keys.ts for why they share a prefix.
  queryClient.setQueriesData<
    Auction | InfiniteData<{ items: unknown[]; nextCursor: string | null }>
  >({ queryKey: keys.auctions.all }, (old) => {
    if (!old) return old;
    if (!('pages' in old)) return fold(old);
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        items: page.items.map((item) =>
          // Both AuctionDto rows (active list, watchlist) and BidWithAuctionDto rows
          // (my-bids, auction nested inside) pass through this same cache prefix — fold
          // whichever shape the item actually is.
          isAuction(item)
            ? fold(item)
            : { ...(item as { auction: Auction }), auction: fold((item as { auction: Auction }).auction) },
        ),
      })),
    };
  });
}

function isAuction(item: unknown): item is Auction {
  return typeof item === 'object' && item !== null && 'auctionId' in item && !('auction' in item);
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
      //
      // BV-039: the POST response itself still carries the caller's own full identity (it's
      // their own action), but the shared bids cache is the masked, isMine-flagged shape now —
      // 'You' rather than the real name, consistent with how BuyerLiveBidding already renders
      // any row with isMine set.
      applyBidToCache(queryClient, auctionId, {
        bidId: bid.bidId,
        auctionId: bid.auctionId,
        isMine: true,
        buyerName: 'You',
        amount: bid.amount,
        timestamp: bid.timestamp,
      });
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
 *
 * BV-029: the watchlist cache is `InfiniteData` now — an add always goes on the front of the
 * first page (a newly-watched auction is the most recent by definition, and the first page is
 * always loaded once the hook has run), and a remove is filtered out of whichever page holds
 * it.
 */
export function useToggleWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ auctionId, watched }: { auctionId: string; watched: boolean; row?: Auction }) =>
      watched ? api.del(`/watchlist/${auctionId}`) : api.post(`/watchlist/${auctionId}`),

    onMutate: async ({ auctionId, watched, row }) => {
      await queryClient.cancelQueries({ queryKey: keys.auctions.watchlist });
      const previous = queryClient.getQueryData<InfiniteData<PaginatedAuctions>>(keys.auctions.watchlist);

      queryClient.setQueryData<InfiniteData<PaginatedAuctions>>(keys.auctions.watchlist, (old) => {
        if (!old) return old;
        if (watched) {
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.filter((a) => a.auctionId !== auctionId),
            })),
          };
        }
        const alreadyPresent = old.pages.some((page) => page.items.some((a) => a.auctionId === auctionId));
        if (alreadyPresent || !row) return old;
        const [first, ...rest] = old.pages;
        return { ...old, pages: [{ ...first, items: [row, ...first.items] }, ...rest] };
      });

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
 *
 * BV-029: `isWatched` only knows about pages the watchlist query has actually loaded — for a
 * buyer with more watched auctions than fit on one page, an auction on a page that has not
 * been fetched yet reads as "not watched" until the Watchlist screen (or this hook) has
 * scrolled far enough to load it. `useWatchlist` requests a generous page size for exactly
 * this reason: the common case (most buyers watch a handful of auctions) never notices.
 */
export function useWatchlistToggle() {
  const { user } = useAuth();
  const canWatch = user?.role === 'BUYER' || user?.role === 'ADMIN';

  const watchlistQuery = useWatchlist(canWatch);
  const { data: activePages } = useActiveAuctions();
  const mutation = useToggleWatchlist();

  // Drained, not just the first page: `isWatched` and the Watchlist screen both need every
  // watched auction, not whatever happened to fit on page one.
  const watched = useDrainedPages(watchlistQuery);
  // Not drained: `active` is only ever a fallback source for the optimistic "row" shown while
  // adding a watch (see mutation.mutate below). Missing it just means that one card's optimistic
  // add is skipped — onSettled's refetch fixes it moments later — not a correctness issue.
  const active = flattenPages(activePages);

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
