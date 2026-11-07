/**
 * Types that belong to this app rather than to the API. Everything the server sends or accepts
 * lives in `./api`, generated from the backend's contract; do not add wire types here.
 */
import type { ItemCondition, CategoryAttributes, SubmitListingRequest } from './api';

// category is a real enum on the wire, sourced from the request type itself so it cannot drift from
// what the server accepts.
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
