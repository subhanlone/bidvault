import { useEffect, useRef } from 'react';

/**
 * Modal dialog behaviour: Escape to close, focus trapped inside, focus restored on close, and
 * background scroll locked. `open` is explicit rather than inferred from mounting, because some
 * dialogs are rendered inline in a screen that stays mounted (keying off mount would trap focus as
 * soon as the page loaded); components that only exist while open pass `true`. Attach the returned
 * ref to the dialog container and give it `tabIndex={-1}` so it can hold focus when it contains
 * nothing focusable.
 */

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function useDialog<T extends HTMLElement = HTMLDivElement>(open: boolean, onClose: () => void) {
  const containerRef = useRef<T>(null);

  // Kept in a ref so a caller passing an inline arrow doesn't re-run the effect — which would
  // re-steal focus on every parent render.
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const container = containerRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusable = () =>
      Array.from(container?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [])
        .filter(el => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement);

    (focusable()[0] ?? container)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        closeRef.current();
        return;
      }
      if (event.key !== 'Tab' || !container) return;

      const items = focusable();
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      // Wrap at both ends, and pull focus back in if it has already escaped the container.
      if (event.shiftKey && (active === first || !container.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !container.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    // Capture phase so the dialog sees Escape before anything underneath it does.
    document.addEventListener('keydown', onKeyDown, true);

    // Save and restore rather than clearing outright: unconditionally resetting to '' would
    // re-enable scrolling for a still-open dialog underneath this one.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  return containerRef;
}
