import { useEffect, useRef } from 'react';

/**
 * Fires `onIntersect` when a sentinel element scrolls into view — the trigger for BV-029's one
 * genuinely lazy-loaded screen, Browse Auctions.
 *
 * Every other paginated list in this app (My Bids, Watchlist, My Listings, the admin Listing
 * Review queue, dashboard/sidebar stats) shows an exact count or aggregate derived from the
 * whole set, so those all drain every page up front via `useDrainedPages` instead of loading
 * lazily — see its doc comment in queries/auctions.ts. Browse Auctions is the one public,
 * unbounded catalog with no such aggregate, so it is the one screen where "only fetch what's
 * about to be seen" is worth the added complexity of this hook.
 *
 * A ref-callback returning the sentinel element, not a fixed DOM query: the sentinel only
 * exists once the list has rendered at least once, and an IntersectionObserver attached to
 * `null` observes nothing silently rather than erroring, which made an early version of this
 * look like "infinite scroll doesn't fire" instead of "the ref was empty."
 */
export function useInfiniteScrollTrigger(onIntersect: () => void, enabled: boolean) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const onIntersectRef = useRef(onIntersect);
  // Written in an effect, not during render — a ref is only safe to mutate outside render.
  useEffect(() => {
    onIntersectRef.current = onIntersect;
  });

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !enabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onIntersectRef.current();
      },
      // Fires a little before the sentinel is actually on screen, so the next page is
      // usually already loading by the time the user reaches the bottom.
      { rootMargin: '200px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled]);

  return sentinelRef;
}
