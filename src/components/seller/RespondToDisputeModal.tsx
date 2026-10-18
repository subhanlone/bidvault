import { useState } from 'react';
import { X, ShieldAlert } from 'lucide-react';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';
import { useDialog } from '../../hooks/useDialog';
import { dateMedium } from '../../utils/format';
import type { SellerItem } from '../../types/api';

/** The same bounds the server checks (the buyer's reason has them too). */
const MIN = 10;
const MAX = 1000;

interface Props {
  item: SellerItem;
  onSubmit: (response: string) => Promise<void>;
  onClose: () => void;
}

/**
 * The seller's one response to a buyer's dispute. It is final once sent, so the dialog says so
 * before the button does. The three-day window is advice, not a rule: an admin reads the response
 * if there is one and may decide after the date with or without it, so the wording never calls
 * the date a deadline.
 */
export default function RespondToDisputeModal({ item, onSubmit, onClose }: Props) {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useDialog<HTMLDivElement>(true, onClose);
  const dueAt = item.sale?.disputeResponseDueAt;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (response.trim().length < MIN) {
      setError(`Say a little more (at least ${MIN} characters).`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmit(response.trim());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not send your response. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="respond-dispute-title"
        tabIndex={-1}
        className="bg-surface rounded-xl shadow-xl w-full max-w-[480px] p-6 focus:outline-none"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} className="text-error" />
            <h2 id="respond-dispute-title" className="font-bold text-[16px] text-navy">Respond to dispute</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-muted hover:text-navy transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <p className="font-bold text-[14px] text-navy">{item.title}</p>
            <p className="text-[12px] text-muted mt-1 bg-bg border border-border-light rounded-md px-3 py-2">
              {item.sale?.buyerName ?? 'The buyer'} said: "{item.sale?.disputeReason}"
            </p>
          </div>

          <p className="text-[12px] text-muted">
            An admin reads your response before deciding. <span className="font-semibold text-secondary">You get one response
            and it is final once sent.</span>
            {dueAt && <> Please send it by {dateMedium(dueAt)}; an admin may decide after that date, with or without it.</>}
          </p>

          <Textarea
            label="Your side"
            placeholder="e.g. Shipped on the 12th with tracking number…, the courier marked it delivered."
            value={response}
            onChange={e => setResponse(e.target.value)}
            maxLength={MAX}
            hint={`${response.length} / ${MAX}`}
          />

          {error && (
            <p className="text-[13px] text-error bg-error-bg border border-error-border rounded-md px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={loading}>Cancel</Button>
            <Button type="submit" loading={loading} disabled={response.trim().length < MIN} className="flex-1">
              Send response
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
