/**
 * Visually-hidden announcement of a loading state, so a screen reader hears that content is coming.
 * A separate element rather than `role="status"` on the container: that container goes on to hold
 * the real content, and a live region left on it would announce every later change. This one mounts
 * while loading and unmounts after, so it announces once. `polite`, because a load is not urgent
 * enough to interrupt.
 */
export default function LoadingStatus({ label }: { label: string }) {
  return (
    <span role="status" aria-live="polite" className="sr-only">
      {label}
    </span>
  );
}
