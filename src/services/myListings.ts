import type { Listing } from '../types/api';
import { api } from './api';

/**
 * Every one of the signed-in seller's listings, not one page.
 *
 * The seller screens show exact figures (tab counts, Pending/Approved tiles, an edit form that
 * must find its listing wherever it sits), so each walks every cursor page (BV-029) rather than
 * showing whatever fits on page one. A seller's own listings are few enough that this costs
 * nothing worth trading away for lazy loading. A plain function, not a hook, so a load effect
 * that calls it depends on nothing but the signed-in user.
 */
export async function fetchAllMyListings(): Promise<Listing[]> {
  const all: Listing[] = [];
  let cursor: string | null = null;
  do {
    const page: { items: Listing[]; nextCursor: string | null } = await api.get(
      cursor ? `/listings/mine?limit=100&cursor=${encodeURIComponent(cursor)}` : '/listings/mine?limit=100',
    );
    all.push(...page.items);
    cursor = page.nextCursor;
  } while (cursor);
  return all;
}
