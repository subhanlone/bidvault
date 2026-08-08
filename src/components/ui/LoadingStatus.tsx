/**
 * Visually-hidden announcement of a loading state.
 *
 * Skeleton placeholders communicate "content is coming" visually and nothing else — twelve files
 * render them and not one carried `aria-busy` or `role="status"`, so a screen reader user got
 * silence through every load. Button already had `aria-busy`; the skeletons simply never adopted
 * the pattern.
 *
 * Deliberately a separate element rather than `role="status"` on the container that holds the
 * skeletons: that container goes on to hold the real content, and a live region left on it would
 * announce every later change to the list. This mounts while loading and unmounts after, so it
 * announces exactly once.
 *
 * `polite` rather than `assertive` — a load is not urgent enough to interrupt.
 */
export default function LoadingStatus({ label }: { label: string }) {
  return (
    <span role="status" aria-live="polite" className="sr-only">
      {label}
    </span>
  );
}
