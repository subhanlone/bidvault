import { BROWSE_CATEGORIES } from '../config/categories';
import type { ItemCondition } from '../types/api';

/**
 * What the browse screen is looking at, and how that travels: in the address (so a result page can
 * be shared and Back restores it) and as the query of `GET /auctions` and `GET /auctions/facets`.
 * A value in the address that means nothing here is dropped, not an error: a link that went stale
 * still lands on a list.
 */

export const BROWSE_SORTS = [
  { value: 'ending-soonest', label: 'Time: ending soonest' },
  { value: 'ending-soonest-with-bids', label: 'Time: ending soonest, with bids' },
  { value: 'newly-listed', label: 'Time: newly listed' },
  { value: 'price-asc', label: 'Price: lowest first' },
  { value: 'price-desc', label: 'Price: highest first' },
  { value: 'bids-desc', label: 'Number of bids: most first' },
  { value: 'bids-asc', label: 'Number of bids: fewest first' },
] as const;

export type BrowseSort = (typeof BROWSE_SORTS)[number]['value'];
export const DEFAULT_SORT: BrowseSort = 'ending-soonest';

export type BrowseView = 'list' | 'grid';

export const CONDITIONS: readonly ItemCondition[] = ['NEW', 'LIKE_NEW', 'USED'];

/** The largest amount the server accepts in a price filter. */
const PRICE_MAX = 2_000_000_000;

/**
 * The price presets. Whole rupees that sit side by side with no gap, and the same ranges the
 * server counts in `priceBands`, so a count and the list it opens always agree.
 */
export const PRICE_BANDS = [
  { id: 'under-5000', label: 'Under PKR 5,000', minPrice: null, maxPrice: 4_999 },
  { id: '5000-25000', label: 'PKR 5,000 to 25,000', minPrice: 5_000, maxPrice: 25_000 },
  { id: 'over-25000', label: 'Over PKR 25,000', minPrice: 25_001, maxPrice: null },
] as const;

export interface BrowseParams {
  search: string;
  category: string;
  sort: BrowseSort;
  minPrice: number | null;
  maxPrice: number | null;
  conditions: ItemCondition[];
  withBids: boolean;
}

export const NO_FILTERS: BrowseParams = {
  search: '',
  category: '',
  sort: DEFAULT_SORT,
  minPrice: null,
  maxPrice: null,
  conditions: [],
  withBids: false,
};

/** True when the lowest price is above the highest, which no auction can satisfy. */
export function priceRangeBroken(p: Pick<BrowseParams, 'minPrice' | 'maxPrice'>): boolean {
  return p.minPrice !== null && p.maxPrice !== null && p.minPrice > p.maxPrice;
}

/** Whole rupees, as typed or as read from an address; anything else is "not set". */
export function readPrice(raw: string | null | undefined): number | null {
  if (!raw || !/^\d{1,10}$/.test(raw)) return null;
  const n = Number(raw);
  return n <= PRICE_MAX ? n : null;
}

const isSort = (value: string | null): value is BrowseSort => BROWSE_SORTS.some((s) => s.value === value);
const isCondition = (value: string): value is ItemCondition => (CONDITIONS as readonly string[]).includes(value);
const isCategory = (value: string | null): value is string => BROWSE_CATEGORIES.some((c) => c === value);

export function readBrowseParams(url: URLSearchParams): { params: BrowseParams; view: BrowseView } {
  const sort = url.get('sort');
  const category = url.get('category');
  const conditions = url.getAll('condition').filter(isCondition);
  return {
    params: {
      search: url.get('search')?.trim() ?? '',
      category: isCategory(category) ? category : '',
      sort: isSort(sort) ? sort : DEFAULT_SORT,
      minPrice: readPrice(url.get('minPrice')),
      maxPrice: readPrice(url.get('maxPrice')),
      conditions: CONDITIONS.filter((c) => conditions.includes(c)),
      withBids: url.get('withBids') === 'true',
    },
    view: url.get('view') === 'grid' ? 'grid' : 'list',
  };
}

/** The address for a state; every default is left out, so the plain page keeps the plain address. */
export function writeBrowseParams(params: BrowseParams, view: BrowseView): URLSearchParams {
  const url = new URLSearchParams();
  if (params.search) url.set('search', params.search);
  if (params.category) url.set('category', params.category);
  if (params.sort !== DEFAULT_SORT) url.set('sort', params.sort);
  if (params.minPrice !== null) url.set('minPrice', String(params.minPrice));
  if (params.maxPrice !== null) url.set('maxPrice', String(params.maxPrice));
  for (const c of params.conditions) url.append('condition', c);
  if (params.withBids) url.set('withBids', 'true');
  if (view === 'grid') url.set('view', 'grid');
  return url;
}

/**
 * The query the server is asked. A price range the server would refuse is not sent: the screen
 * says so beside the fields and keeps showing the results without a price filter. The facets take
 * the same filters and no sort.
 */
export function apiQuery(params: BrowseParams, forFacets = false): URLSearchParams {
  const query = new URLSearchParams({ status: 'ACTIVE' });
  if (params.search) query.set('search', params.search);
  if (params.category) query.set('category', params.category);
  if (!forFacets && params.sort !== DEFAULT_SORT) query.set('sort', params.sort);
  if (!priceRangeBroken(params)) {
    if (params.minPrice !== null) query.set('minPrice', String(params.minPrice));
    if (params.maxPrice !== null) query.set('maxPrice', String(params.maxPrice));
  }
  for (const c of params.conditions) query.append('condition', c);
  if (params.withBids) query.set('withBids', 'true');
  return query;
}

/** Whether any filter other than the words searched is on, which is what "Clear all" would remove. */
export function hasFilters(p: BrowseParams): boolean {
  return p.category !== '' || p.minPrice !== null || p.maxPrice !== null || p.conditions.length > 0 || p.withBids;
}
