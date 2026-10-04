import { useEffect, useState } from 'react';

/**
 * The current time in milliseconds, kept in state and refreshed on an interval.
 *
 * A screen that needs "now" to decide what has ended, what is overdue or what is ending soon used to
 * call `Date.now()` straight in its render body. That makes the output depend on when React happens
 * to render, which React is free to do more than once or not at all, so it is not allowed in a
 * render (react-hooks/purity). Here the clock is read once for the first render and then only by
 * the interval, so the render itself stays a function of state.
 *
 * `intervalMs` is how stale the decision may be: an hours-long deadline needs a minute, a list that
 * flips rows to "ended" a few seconds. Rows that show a ticking countdown use `useTimer` for that.
 */
export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
