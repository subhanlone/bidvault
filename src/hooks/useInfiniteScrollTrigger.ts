import { useEffect, useRef } from 'react';

/**
 * Fires `onIntersect` when a sentinel element scrolls into view: the trigger for Browse Auctions,
 * the one lazily loaded list. Every other paginated list shows an exact count derived from the
 * whole set, so those drain every page via `useDrainedPages` (see queries/auctions.ts).
 * A ref-callback returning the sentinel rather than a fixed DOM query: the sentinel only exists
 * once the list has rendered, and an IntersectionObserver attached to `null` observes nothing
 * without erroring.
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
