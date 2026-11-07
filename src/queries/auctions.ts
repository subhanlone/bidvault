import { useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData, type QueryClient, type UseInfiniteQueryResult } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Auction, PublicBid, PaginatedAuctions, PaginatedBidsWithAuction } from '../types/api';
import { keys } from './keys';
import { useAuth } from '../context/auth';

/**
 * Auction data as queries. Each hook is a thin wrapper over the typed client
 * (`api.get('/auctions')` already knows its response type), so nothing here re-declares a shape.
 * The three list endpoints (`/auctions`, `/watchlist`, `/auctions/mine/bids`) are cursor-paginated,
 * so they are `useInfiniteQuery`: `.data.pages` is an array of `{items, nextCursor}`, flattened by
 * the helper below.
 */

/** `data.pages.flatMap(p => p.items)` — every screen that reads a paginated list wants this. */
export function flattenPages<T>(data: InfiniteData<{ items: T[]; nextCursor: string | null }> | undefined): T[] {
  return data?.pages.flatMap((p) => p.items) ?? [];
}

/**
 * Walks an infinite query to completion and returns the flattened, complete list. For screens that
 * show an exact figure derived from every row (a count, a sum, a tab badge, prev/next through the
 * full queue): cursor pagination returns no total, so the only honest way to report one is to fetch
 * every page. These lists are scoped to one seller, one buyer or the admin's queue, so "every page"
 * stays small. BrowseAuctions does not use this: a public catalog has no aggregate to compute, so
 * it stays incremental (`useInfiniteScrollTrigger`).
 */
export function useDrainedPages<T>(
  query: UseInfiniteQueryResult<InfiniteData<{ items: T[]; nextCursor: string | null }>>,
): T[] {
  const { data, hasNextPage, isFetchingNextPage, isError, fetchNextPage } = query;
  useEffect(() => {
    // Not while the query is in an error state: a failed page leaves hasNextPage true and
    // isFetchingNextPage false, which is exactly when this effect fires, so without the guard it
    // would request the failing page again and again. The screen's "Try again" (refetch) clears the
    // error and lets this resume.
    if (hasNextPage && !isFetchingNextPage && !isError) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, isError, fetchNextPage]);
  return flattenPages(data);
}

/**
 * The live list. `category`/`search` are server-side filters and part of the query key, so changing
 * either starts a fresh paginated query rather than filtering pages already cached; a match on page
 * 4 is never missed because pages 1-3 loaded first.
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
 * One auction, fetched directly rather than looked up in a list: GET /auctions/{id} is
 * authoritative whatever the status, so a closed auction opened on a cold load still has a page.
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
 * Bid history for one auction: a single bounded page (the auction page only shows the newest
 * handful), not `useInfiniteQuery`. The list is for signed-in members: the server answers 401 to a
 * guest, so a guest's page passes `enabled = false` and never asks. A signed-in person whose access
 * token has just expired is not a guest; the API client's silent refresh retries the 401.
 */
export function useBids(auctionId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: keys.bids.forAuction(auctionId ?? ''),
    queryFn: () => api.get(`/auctions/${auctionId}/bids`),
    enabled: Boolean(auctionId) && enabled,
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

/**
 * Applies one bid to every cached copy of the auction it belongs to, and to that auction's bid
 * list. Called from both the mutation and the socket bridge, which race to deliver the same bid;
 * both are idempotent because the bid list updater checks membership in the cached value it is
 * handed, inside the update.
 * `Math.max` on the price, not assignment: a broadcast arriving out of order must never walk it
 * backwards. The list caches are `InfiniteData`, folded page by page, item by item; the
 * single-auction entry folds directly.
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
      // The masked bid:placed broadcast and this client's own mutation response (which knows isMine
      // for certain) can arrive in either order over two connections: if this write knows the bid
      // is the caller's own and the cached row does not yet, upgrade it in place rather than
      // discard it as a duplicate.
      if (bid.isMine && !old.items[idx].isMine) {
        const items = [...old.items];
        items[idx] = bid;
        return { ...old, items };
      }
      return old;
    },
  );

  if (!isNewBid) return;

  foldEveryAuctionCacheEntry(queryClient, auctionId, (a) => ({
    ...a,
    currentBid: Math.max(a.currentBid, bid.amount),
    bidCount: a.bidCount + 1,
  }));
}

function isAuction(item: unknown): item is Auction {
  return typeof item === 'object' && item !== null && 'auctionId' in item && !('auction' in item);
}

/**
 * Applies `fold` to every cached copy of one auction (the live list, its detail entry, the
 * watchlist, my-bids' embedded auctions). Shared by every socket event that changes an auction, so
 * there is one traversal and no second copy to drift.
 */
function foldEveryAuctionCacheEntry(
  queryClient: QueryClient,
  auctionId: string,
  fold: (a: Auction) => Auction,
) {
  const foldMatching = (a: Auction): Auction => (a.auctionId === auctionId ? fold(a) : a);

  // One call, every auction-shaped cache entry. See queries/keys.ts for why they share a prefix.
  queryClient.setQueriesData<
    Auction | InfiniteData<{ items: unknown[]; nextCursor: string | null }>
  >({ queryKey: keys.auctions.all }, (old) => {
    if (!old) return old;
    if (!('pages' in old)) return foldMatching(old);
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        items: page.items.map((item) =>
          // Both AuctionDto rows (active list, watchlist) and BidWithAuctionDto rows
          // (my-bids, auction nested inside) pass through this same cache prefix — fold
          // whichever shape the item actually is.
          isAuction(item)
            ? foldMatching(item)
            : { ...(item as { auction: Auction }), auction: foldMatching((item as { auction: Auction }).auction) },
        ),
      })),
    };
  });
}

/**
 * The live price and bid count a guest's socket receives (`auction:price`). A guest is told
 * numbers only: no bid entry, no bidder. Idempotent and never walks backwards, like
 * applyBidToCache, since a broadcast can arrive after a fresher fetch.
 */
export function applyPriceToCache(
  queryClient: QueryClient,
  auctionId: string,
  update: { currentBid: number; bidCount: number },
) {
  foldEveryAuctionCacheEntry(queryClient, auctionId, (a) => ({
    ...a,
    currentBid: Math.max(a.currentBid, update.currentBid),
    bidCount: Math.max(a.bidCount, update.bidCount),
  }));
}

/**
 * Reaches every cached copy of the cancelled auction the same way a new bid does, so the auction
 * page and AdminAuctionMonitor update at once for anyone with the page open, without a refetch.
 */
export function applyAuctionCancelledToCache(queryClient: QueryClient, auctionId: string) {
  foldEveryAuctionCacheEntry(queryClient, auctionId, (a) => ({ ...a, status: 'CANCELLED' }));
}

export function usePlaceBid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ auctionId, amount }: { auctionId: string; amount: number }) =>
      api.post(`/auctions/${auctionId}/bids`, { amount }),
    onSuccess: (bid, { auctionId }) => {
      // Applied here as well as from the socket, because the broadcast is not guaranteed: if the
      // socket is down this is the only path that updates the UI. Whichever arrives first wins; the
      // other is a no-op. The POST response carries the caller's own full identity, but the shared
      // bids cache holds the masked, isMine-flagged shape, so the row reads 'You'.
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
 * Add or remove a watch, optimistically: `onMutate` writes the change and returns the previous
 * value, `onError` puts it back, `onSettled` refetches so the server has the last word. An add goes
 * on the front of the first page (a newly watched auction is the most recent, and the first page is
 * always loaded once the hook has run); a remove is filtered out of whichever page holds it.
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
 * `toggle(id)` and `isWatched(id)` over the query cache, because five call sites use that shape.
 * Watched state is derived from the cached watchlist rather than a separate array of ids, so the
 * two cannot disagree. `isWatched` only knows pages the watchlist query has loaded, so an auction
 * on an unfetched page reads as "not watched" until it loads; `useWatchlist` requests a generous
 * page size so the common case never notices.
 */
export function useWatchlistToggle() {
  const { user } = useAuth();
  // Every signed-in account can watch (a seller is a buyer too).
  const canWatch = user !== null;

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

  // `loading` stays true through every page for the same reason the drained screens' tiles do:
  // the screen shows counts, and `watched` is only complete once the last page is in. `isError`
  // is the state the screens must check first -- an empty `watched` then means "unknown", not
  // "nothing watched". (The query is disabled for roles that cannot watch: no load, no error.)
  const loading = canWatch && (watchlistQuery.isPending || watchlistQuery.hasNextPage || watchlistQuery.isFetchingNextPage);
  return {
    toggle,
    isWatched,
    watched,
    loading,
    isError: watchlistQuery.isError,
    isRefetching: watchlistQuery.isFetching,
    refetch: () => { void watchlistQuery.refetch(); },
  };
}
