/**
 * Query keys, arranged as a hierarchy rather than a flat list of strings. Every cache entry that
 * holds an auction (the live list, a single auction, the watchlist, the auctions embedded in my
 * bids) sits under `['auctions', …]`, so one call, queryClient.setQueriesData({ queryKey:
 * keys.auctions.all }, fold), updates every copy at once and no copy can show a stale price.
 */
export const keys = {
  auctions: {
    all: ['auctions'] as const,
    /** GET /auctions?status=ACTIVE — the live list. */
    active: ['auctions', 'active'] as const,
    /** GET /auctions/{id} — authoritative for one auction, whatever its status. */
    detail: (auctionId: string) => ['auctions', 'detail', auctionId] as const,
    /** GET /watchlist — full auction rows, closed ones included. */
    watchlist: ['auctions', 'watchlist'] as const,
  },
  bids: {
    all: ['bids'] as const,
    /** GET /auctions/{id}/bids */
    forAuction: (auctionId: string) => ['bids', 'auction', auctionId] as const,
    /** GET /auctions/mine/bids */
    mine: ['bids', 'mine'] as const,
  },
  /**
   * GET /auctions/facets: the counts beside the browse filters. Outside `['auctions', …]` on
   * purpose: a socket price update folds every cache entry under that prefix, and counts are not
   * auctions.
   */
  auctionFacets: (query: string) => ['auctionFacets', query] as const,
  /** GET /settings/public. */
  publicSettings: ['publicSettings'] as const,
  notifications: ['notifications'] as const,
  sellerItems: {
    /** Every seller-items cache entry; one invalidation after any action on an item refreshes the
     * list, the tab counts and the other tabs together, since an action moves an item between tabs. */
    all: ['sellerItems'] as const,
    /** GET /seller/items — one tab, narrowed by the search text. */
    list: (tab: string, search: string) => ['sellerItems', 'list', { tab, search }] as const,
    /** GET /seller/items/summary — the tab badges. */
    summary: ['sellerItems', 'summary'] as const,
  },
  admin: {
    /**
     * GET /admin/users: cursor-paginated and unbounded, so keyed per search term like
     * auctions.active rather than drained.
     */
    users: (search: string) => ['admin', 'users', { search }] as const,
    /** GET /listings/pending, every page -- the review queue the sidebar badge, the dashboard and the
     * review screens all read, so a change made on one is seen by the others. */
    pendingListings: ['admin', 'pendingListings'] as const,
  },
} as const;
