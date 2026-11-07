import type { KeyboardEvent } from 'react';

/**
 * The keyboard half of the WAI-ARIA tabs pattern, for a `role="tablist"` of `role="tab"` buttons.
 * Only the selected tab is in the Tab order (give the others `tabIndex={-1}`); Left and Right move
 * to the previous and next tab, wrapping round, and Home and End jump to the first and last. Moving
 * selects as well as focuses, which suits tabs that just switch a view. Put the returned handler on
 * the tablist element.
 */
export function useTabKeys<T extends string>(tabs: readonly T[], active: T, select: (tab: T) => void) {
  return (e: KeyboardEvent<HTMLElement>) => {
    const index = tabs.indexOf(active);
    let next: number;
    switch (e.key) {
      case 'ArrowRight': next = (index + 1) % tabs.length; break;
      case 'ArrowLeft': next = (index - 1 + tabs.length) % tabs.length; break;
      case 'Home': next = 0; break;
      case 'End': next = tabs.length - 1; break;
      default: return;
    }
    e.preventDefault();
    select(tabs[next]);
    e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus();
  };
}
