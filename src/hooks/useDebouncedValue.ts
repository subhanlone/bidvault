import { useEffect, useState } from 'react';

/**
 * `value`, but only after it has stopped changing for `delayMs`. For a search box: the input keeps
 * the text the person is typing, and the request goes out for the text they stopped on, not for
 * every key they pressed on the way.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
