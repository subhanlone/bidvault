import type { Listing, ListingStatus } from '../types/api';

export type BadgeVariant = 'warning' | 'success' | 'error' | 'tag';

const BASE_CONFIG: Record<ListingStatus, { label: string; variant: BadgeVariant }> = {
  PENDING:  { label: 'Pending Review', variant: 'warning' },
  APPROVED: { label: 'Approved',       variant: 'success' },
  REJECTED: { label: 'Rejected',       variant: 'error'   },
  DRAFT:    { label: 'Draft',          variant: 'tag'     },
  // C3, Phase 7: an approved listing pulled for cause by an admin -- distinct from REJECTED
  // (never approved in the first place).
  REMOVED:  { label: 'Removed',        variant: 'error'   },
};

/**
 * A1, Phase 6 (found duplicated into SellerDashboard.tsx and SellerProfile.tsx while fixing an
 * unrelated TypeScript error for C3's new REMOVED status -- both had their own un-isLive-aware
 * copy of the exact badge this file originally centralised only for SellerMyListings.tsx).
 *
 * An APPROVED listing is not necessarily still for sale -- its auction may have already sold or
 * been cancelled. isLive (derived server-side from the auction join, not a second status value)
 * is what actually answers "is this live right now".
 */
export function listingBadge(l: Pick<Listing, 'status' | 'isLive'>): { label: string; variant: BadgeVariant } {
  if (l.status === 'APPROVED') {
    return l.isLive ? { label: 'Live', variant: 'success' } : { label: 'Ended', variant: 'tag' };
  }
  return BASE_CONFIG[l.status] ?? BASE_CONFIG.DRAFT;
}
