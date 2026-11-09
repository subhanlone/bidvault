import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api, ApiError } from '../services/api';
import { keys } from './keys';
import type { PaginatedAuctions, SellerProfile, SellerReviews } from '../types/api';

/** A 404 is an answer ("no such seller"), not a failure worth asking again. */
const retryUnlessNotFound = (failures: number, error: Error) =>
  !(error instanceof ApiError && error.status === 404) && failures < 1;

/** GET /sellers/{sellerId}: the public profile. Never a phone or an e-mail (the API does not send them). */
export function useSellerProfile(sellerId: string | undefined) {
  return useQuery<SellerProfile>({
    queryKey: keys.sellers.profile(sellerId ?? ''),
    queryFn: () => api.get(`/sellers/${sellerId}`),
    enabled: Boolean(sellerId),
    retry: retryUnlessNotFound,
  });
}

/** GET /reviews/seller/{sellerId}: reviewers are masked ("Reviewer 1") by the API. */
export function useSellerReviews(sellerId: string | undefined, enabled = true) {
  return useQuery<SellerReviews>({
    queryKey: keys.sellers.reviews(sellerId ?? ''),
    queryFn: () => api.get(`/reviews/seller/${sellerId}`),
    enabled: Boolean(sellerId) && enabled,
  });
}

/**
 * One seller's live (ACTIVE) or ended (CLOSED) items, a page at a time. Kept under the `auctions`
 * prefix and infinite-shaped so a live price from the socket updates these cards too.
 */
export function useSellerAuctions(sellerId: string | undefined, status: 'ACTIVE' | 'CLOSED', enabled = true) {
  return useInfiniteQuery({
    queryKey: keys.auctions.bySeller(sellerId ?? '', status),
    queryFn: ({ pageParam }) => {
      const qs = new URLSearchParams({ sellerId: sellerId ?? '', status, limit: '12' });
      if (pageParam) qs.set('cursor', pageParam);
      return api.get(`/auctions?${qs.toString()}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: PaginatedAuctions) => lastPage.nextCursor ?? undefined,
    enabled: Boolean(sellerId) && enabled,
  });
}
