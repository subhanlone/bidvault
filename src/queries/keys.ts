/**
 * Query keys, arranged as a hierarchy rather than a flat list of strings.
 *
 * The shape matters more than it looks. Every cache entry that holds an auction — the live
 * list, a single auction, the watchlist, the auctions embedded in my bids — sits under
 * `['auctions', …]`. That lets one call
 *
 *     queryClient.setQueriesData({ queryKey: keys.auctions.all }, fold)
 *
 * update every copy at once.
 *
 * That is the fix for NEW-18, which was the same auction showing two different prices in one
 * session because `applyBid` folded the new bid into `auctions` but not into
 * `watchlistAuctions`. The hand-rolled version needed one fold per array and got it wrong;
 * here there is nowhere for a copy to hide.
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
  notifications: ['notifications'] as const,
} as const;
