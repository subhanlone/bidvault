import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { PaginatedSellerItems, SellerItemTab } from '../types/api';
import { keys } from './keys';

/**
 * The seller's My Items screen: the list (one tab at a time) and the tab counts.
 *
 * Every action a row offers is an existing endpoint, wrapped below as a mutation that invalidates
 * everything under `keys.sellerItems.all`: an action moves an item from one tab to another, so the
 * list being shown, the other tabs and the badges all have to be re-read, not just one of them.
 */

/**
 * How often a tab is re-read while it is open: a live auction and a sale waiting to ship change
 * under you. Review and sold change without the seller doing anything too -- an admin approves an
 * item, a buyer pays, a package is confirmed -- and nothing else tells this screen, so they are
 * re-read as well, less often. Unsold and closed only change by the seller's own actions, which
 * invalidate everything below.
 */
const REFRESH_MS: Partial<Record<SellerItemTab, number>> = { live: 20_000, action: 20_000, review: 30_000, sold: 30_000 };

export function useSellerItems(tab: SellerItemTab, search: string) {
  const term = search.trim();
  return useInfiniteQuery({
    queryKey: keys.sellerItems.list(tab, term),
    queryFn: ({ pageParam }) => {
      const qs = new URLSearchParams({ tab });
      if (term) qs.set('search', term);
      if (pageParam) qs.set('cursor', pageParam);
      return api.get(`/seller/items?${qs.toString()}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: PaginatedSellerItems) => lastPage.nextCursor ?? undefined,
    refetchInterval: REFRESH_MS[tab] ?? false,
    // Typing in the search box starts a new query each time. Within the same tab the rows already
    // on screen stay until the narrowed list arrives, instead of the list blinking to a skeleton on
    // every pause; another tab's rows are never shown in the meantime.
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[0] === keys.sellerItems.all[0] && previousQuery.queryKey[2]?.tab === tab ? previous : undefined,
  });
}

/** The tab badges. Never narrowed by the search: they count the whole inventory. */
export function useSellerItemsSummary() {
  return useQuery({
    queryKey: keys.sellerItems.summary,
    queryFn: () => api.get('/seller/items/summary'),
    select: (data) => data.counts,
    refetchInterval: 20_000,
  });
}

/**
 * For the writes that happen outside this file (creating a listing, resubmitting a rejected one):
 * call it after they succeed, so My Items does not show a list, or a tab count, from before.
 */
export function useRefreshSellerItems() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: keys.sellerItems.all });
}

/** Runs one action on an item, then re-reads everything on the screen. */
function useItemAction<TVars>(run: (vars: TVars) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.sellerItems.all }),
  });
}

export const useWithdrawListing = () =>
  useItemAction(({ listingId }: { listingId: string }) => api.del(`/listings/${listingId}`));

export const useCancelAuction = () =>
  useItemAction(({ auctionId, reason }: { auctionId: string; reason: string }) =>
    api.post(`/auctions/${auctionId}/cancel`, { reason }),
  );

export const useMarkShipped = () =>
  useItemAction(({ transactionId }: { transactionId: string }) => api.patch(`/payments/${transactionId}/ship`));

export const useOfferNextBidder = () =>
  useItemAction(({ transactionId }: { transactionId: string }) =>
    api.post(`/payments/${transactionId}/offer-next-bidder`),
  );

export const useRelist = () =>
  useItemAction(({ transactionId }: { transactionId: string }) => api.post(`/payments/${transactionId}/relist`));

export const useRespondToDispute = () =>
  useItemAction(({ transactionId, response }: { transactionId: string; response: string }) =>
    api.post(`/payments/${transactionId}/dispute/response`, { response }),
  );
