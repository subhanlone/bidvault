import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../../context/auth';
import { flattenPages, useAuctionFacets, useAuctionList } from '../../queries/auctions';
import { useInfiniteScrollTrigger } from '../../hooks/useInfiniteScrollTrigger';
import { useNow } from '../../hooks/useNow';
import { useSignInLink } from '../../hooks/useSignInLink';
import { SiteNavbar, ErrorState } from '../../components/ui';
import Button from '../../components/ui/Button';
import LoadingStatus from '../../components/ui/LoadingStatus';
import FilterRail from '../../components/browse/FilterRail';
import ResultCard, { ResultCardSkeleton } from '../../components/browse/ResultCard';
import ResultRow, { ResultRowSkeleton } from '../../components/browse/ResultRow';
import SortMenu from '../../components/browse/SortMenu';
import ViewToggle from '../../components/browse/ViewToggle';
import { count } from '../../utils/format';
import {
  hasFilters,
  readBrowseParams,
  writeBrowseParams,
  type BrowseParams,
  type BrowseView,
} from '../../utils/browseParams';

const CLEARED: Partial<BrowseParams> = { category: '', minPrice: null, maxPrice: null, conditions: [], withBids: false };

/**
 * Open to everyone. Every choice on this screen lives in the address (`search`, `category`, `sort`,
 * `minPrice`, `maxPrice`, `condition`, `withBids`, `view`), so a result page can be shared, a
 * reload keeps it and Back undoes one choice. The home page's search box and category tiles link
 * here with the same names. Sorting, the price range and every filter are the server's: the rows
 * shown are the ones it returned, in its order.
 */
export default function BrowseAuctions() {
  const { user, isLoading } = useAuth();
  const signIn = useSignInLink();
  // Someone whose session is still being restored is not shown guest prompts.
  const isGuest = !user && !isLoading;

  const [searchParams, setSearchParams] = useSearchParams();
  const urlState = useMemo(() => readBrowseParams(searchParams), [searchParams]);
  // What is on screen is held here and written to the address alongside, not read back from it: a
  // navigation lands a moment after the click, and a checkbox that waits for it flips back and
  // forth. Back, forward or a link change the address from outside, and then the address wins.
  const [state, setState] = useState(urlState);
  const [seenUrl, setSeenUrl] = useState(urlState);
  if (seenUrl !== urlState) {
    setSeenUrl(urlState);
    setState(urlState);
  }
  const { params, view } = state;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const now = useNow(30_000);

  /** A discrete choice adds a step to the history; a typed one replaces the current step. */
  const update = (patch: Partial<BrowseParams>, how: 'push' | 'replace' = 'push', nextView: BrowseView = view) => {
    const next = { params: { ...params, ...patch }, view: nextView };
    setState(next);
    setSearchParams(writeBrowseParams(next.params, next.view), { replace: how === 'replace' });
  };
  // The search box sends after a pause, so what it sends must be read at that moment, not when the
  // key was pressed.
  const updateRef = useRef(update);
  useEffect(() => {
    updateRef.current = update;
  });

  const [searchText, setSearchText] = useState(params.search);
  // Back, or a link, changes the words from outside: the box follows them.
  const [seenSearch, setSeenSearch] = useState(params.search);
  if (seenSearch !== params.search) {
    setSeenSearch(params.search);
    if (searchText.trim() !== params.search) setSearchText(params.search);
  }
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(searchTimer.current), []);
  const typeSearch = (text: string) => {
    setSearchText(text);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => updateRef.current({ search: text.trim() }, 'replace'), 350);
  };

  const list = useAuctionList(params);
  const facets = useAuctionFacets(params);
  // This screen is the live auctions: filter on the status the server reported, so one cancelled
  // while the page is open leaves the list at once.
  const auctions = flattenPages(list.data).filter((a) => a.status === 'ACTIVE');
  // isPending rather than a success flag: a screen must tell "nothing to show" from "could not
  // load", and never assert the first while the second is still possible.
  const loaded = !list.isPending;
  const sentinelRef = useInfiniteScrollTrigger(
    () => { void list.fetchNextPage(); },
    list.hasNextPage && !list.isFetchingNextPage,
  );

  // Cursor pages carry no total, so the total is read from the counts: the conditions partition
  // whatever the other filters leave, and the ones chosen are the ones the list shows.
  const total = facets.data
    ? facets.data.conditions
        .filter((c) => params.conditions.length === 0 || params.conditions.includes(c.value))
        .reduce((sum, c) => sum + c.count, 0)
    : null;
  const heading =
    total === null ? 'Live auctions' : params.search ? `${count(total, 'result')} for "${params.search}"` : count(total, 'live auction');

  const clearFilters = () => update(CLEARED);
  const clearSearch = () => {
    setSearchText('');
    update({ search: '' });
  };
  const rail = <FilterRail params={params} facets={facets.data} onChange={update} onClear={clearFilters} />;
  const skeletons = Array.from({ length: 6 }, (_, i) => (view === 'grid' ? <ResultCardSkeleton key={i} /> : <ResultRowSkeleton key={i} />));
  const resultsClass = view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'flex flex-col gap-3.5';

  return (
    <div className="min-h-screen bg-bg">
      <SiteNavbar />

      <div className="flex">
        <aside aria-label="Auction filters" className="hidden md:block bg-surface border-r border-border-light w-[240px] shrink-0 sticky top-14 self-start max-h-[calc(100vh-56px)] overflow-y-auto p-5">
          {rail}
        </aside>

        <main className="flex-1 p-4 sm:p-6 min-w-0">
          {isGuest && (
            <div role="note" className="bg-navy text-white rounded-md px-4 py-3 mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[13px] leading-[19px]">
                You are browsing as a guest. Anyone can look; sign in to bid or watch an item.
              </p>
              <Link {...signIn} className="text-[13px] font-semibold text-white border border-white/40 hover:border-white rounded-lg px-3 py-1.5 transition-colors no-underline">
                Sign in
              </Link>
            </div>
          )}

          <form
            role="search"
            onSubmit={(e) => { e.preventDefault(); clearTimeout(searchTimer.current); update({ search: searchText.trim() }, 'replace'); }}
            className="flex gap-2 mb-4"
          >
            <div className="relative flex-1 max-w-[560px]">
              <input
                type="search"
                className="bg-surface border border-border-medium h-[42px] pl-[38px] pr-4 rounded-lg text-[14px] w-full outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow"
                aria-label="Search auctions" placeholder="Search by name, or by item number"
                value={searchText}
                onChange={(e) => typeSearch(e.target.value)}
              />
              <Search size={16} aria-hidden="true" className="absolute left-3 top-[13px] text-placeholder" />
            </div>
            <button
              type="button"
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((o) => !o)}
              className="md:hidden bg-surface border border-border-medium h-[42px] px-3 rounded-lg flex items-center gap-2 font-semibold text-[13px] text-secondary shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <SlidersHorizontal size={15} strokeWidth={2} aria-hidden="true" /> Filters
            </button>
          </form>

          {filtersOpen && (
            <section aria-label="Auction filters" className="md:hidden bg-surface border border-border-light rounded-md p-4 mb-4 shadow-sm">
              {rail}
            </section>
          )}

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 mb-4">
            <h1 className="font-extrabold text-[20px] sm:text-[22px] tracking-[-0.02em] text-navy m-0">{heading}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <SortMenu value={params.sort} onChange={(sort) => update({ sort })} />
              <ViewToggle value={view} onChange={(next) => update({}, 'push', next)} />
            </div>
          </div>

          {!loaded ? (
            <div className={resultsClass}>
              <LoadingStatus label="Loading auctions" />
              {skeletons}
            </div>
          ) : list.isError ? (
            <ErrorState title="Could not load auctions" onRetry={() => { void list.refetch(); }} retrying={list.isFetching} />
          ) : auctions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="bg-surface-raised rounded-full p-5">
                <Search size={40} strokeWidth={1.3} className="text-placeholder" aria-hidden="true" />
              </div>
              <p className="font-bold text-[16px] text-secondary">No auctions found</p>
              <p className="text-[13px] text-muted">Try adjusting your search or filters</p>
              <Button variant="ghost" onClick={hasFilters(params) ? clearFilters : clearSearch} className="mt-1">
                {hasFilters(params) ? 'Clear filters' : 'Clear search'}
              </Button>
            </div>
          ) : (
            <>
              {/* The previous results stay up, dimmed, while a new choice loads. */}
              <div aria-busy={list.isPlaceholderData} className={`${resultsClass} transition-opacity ${list.isPlaceholderData ? 'opacity-60' : ''}`}>
                {auctions.map((a) =>
                  view === 'grid'
                    ? <ResultCard key={a.auctionId} auction={a} isGuest={isGuest} />
                    : <ResultRow key={a.auctionId} auction={a} isGuest={isGuest} now={now} />,
                )}
              </div>
              {list.hasNextPage && (
                <div ref={sentinelRef} className="flex items-center justify-center py-8">
                  <LoadingStatus label="Loading more auctions" />
                  <div className="grid grid-cols-3 gap-1.5" aria-hidden="true">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="size-[6px] rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
