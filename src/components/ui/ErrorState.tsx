import { XCircle } from 'lucide-react';
import Button from './Button';

interface ErrorStateProps {
  /** What could not be loaded: "Could not load your bids". */
  title: string;
  message?: string;
  /** Shown as a "Try again" button when given. */
  onRetry?: () => void;
  /** True while the retry is in flight, so the button cannot be pressed twice. */
  retrying?: boolean;
  className?: string;
}

/**
 * The one way a screen says "this failed to load".
 *
 * A failed request must never be drawn as an empty list or a zero: "No bids yet" asserts the
 * buyer has placed none, "All caught up" tells an admin the review queue is clear. Both are
 * claims about the data, and a failure is exactly when the data is unknown. Screens render this
 * instead of their empty state, with a way to try again that does not reload the whole page.
 */
export default function ErrorState({
  title,
  message = 'Check your connection and try again.',
  onRetry,
  retrying = false,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`bg-surface border border-border-light rounded-md flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}
    >
      <XCircle size={48} strokeWidth={1.2} className="text-error mx-auto mb-4" aria-hidden="true" />
      <p className="font-bold text-[16px] text-navy mb-1">{title}</p>
      <p className="text-[13px] text-muted max-w-[360px]">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-5" loading={retrying} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
