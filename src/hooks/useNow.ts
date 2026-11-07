import { useEffect, useState } from 'react';

/**
 * The current time in milliseconds, kept in state and refreshed on an interval. `Date.now()` in a
 * render body makes the output depend on when React renders (react-hooks/purity); here the clock is
 * read once for the first render and then only by the interval. `intervalMs` is how stale the
 * decision may be: an hours-long deadline needs a minute, a list that flips rows to "ended" a few
 * seconds. Rows with a ticking countdown use `useTimer`.
 */
export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
