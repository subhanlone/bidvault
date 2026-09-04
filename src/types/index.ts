/**
 * Types that belong to this app rather than to the API.
 *
 * Everything the server sends or accepts lives in `./api`, generated from the backend's
 * contract. This file used to hold hand-written copies of those shapes, maintained in
 * parallel and compared to nothing — which is how `Auction.reserveMet`, `Auction.imageUrl`,
 * `Auction.images` and `Listing.sellerEmail` all drifted to optional while the server always
 * sent them, and how `Bid.isWin` survived for months as a field the API has never had.
 *
 * A compile-time guard was added to catch that, and it did its job; but the real fix was to
 * stop having two copies. Both the copies and the guard are gone.
 *
 * What is left is the two shapes with no server counterpart. Do not add wire types here.
 */
import type { ItemCondition, CategoryAttributes, SubmitListingRequest } from './api';

// BV-015: category is a real enum on the wire now, not free text -- sourced from the request
// type itself so this cannot drift from what the server actually accepts.
export type ListingCategory = SubmitListingRequest['category'];

/**
 * The in-progress listing held by ListingContext across the three creation steps.
 *
 * Not a wire type: the server never sees this shape. `category` and `condition` both allow
 * `''` because the form starts with nothing selected, which is precisely why
 * SellerCreateListingStep3 has to narrow them before submitting.
 */
export interface ListingDraft {
  title: string;
  category: ListingCategory | '';
  condition: ItemCondition | '';
  description: string;
  imageUrl: string;
  duration: number;
  startingPrice: number;
  minIncrement: number;
  hasReserve: boolean;
  reservePrice: number;
  attributes: CategoryAttributes;
}

/** A transient message from ToastContext. Purely client-side. */
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}
