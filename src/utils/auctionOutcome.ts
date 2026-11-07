import type { Auction } from '../types/api';

/**
 * What an auction page should say about an auction, decided once from what the server reported.
 * `reserveMet` is the server's own verdict (written when the auction closed), never recomputed
 * here: the reserve amount itself is not public and this must not need it.
 */
export type AuctionOutcome = 'live' | 'sold' | 'reserve-not-met' | 'no-bids' | 'cancelled';

export function auctionOutcome(a: Pick<Auction, 'status' | 'bidCount' | 'reserveMet'>): AuctionOutcome {
  if (a.status === 'ACTIVE') return 'live';
  if (a.status === 'CANCELLED') return 'cancelled';
  if (a.bidCount === 0) return 'no-bids';
  if (a.reserveMet === false) return 'reserve-not-met';
  return 'sold';
}
