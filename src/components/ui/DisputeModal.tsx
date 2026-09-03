import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';
import Button from './Button';
import Textarea from './Textarea';
import { useDialog } from '../../hooks/useDialog';

interface Props {
  transactionId: string;
  auctionTitle: string;
  onSuccess: () => void;
  onClose: () => void;
}

// BV-047: a buyer's alternative to confirming receipt during the SHIPPED window — holds the
// seller's payout for admin review instead of releasing it automatically.
export default function DisputeModal({ transactionId, auctionTitle, onSuccess, onClose }: Props) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useDialog<HTMLDivElement>(true, onClose);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (reason.trim().length < 10) {
      setError('Describe the problem in a bit more detail (at least 10 characters).');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post(`/payments/${transactionId}/dispute`, { reason: reason.trim() });
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not submit your report.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dispute-modal-title"
        tabIndex={-1}
        className="bg-surface rounded-xl shadow-xl w-full max-w-[440px] p-6 focus:outline-none"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-error" />
            <h2 id="dispute-modal-title" className="font-bold text-[16px] text-navy">Report a Problem</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dispute modal"
            className="text-muted hover:text-navy transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <p className="text-[13px] text-muted mb-1">For your purchase of</p>
            <p className="font-bold text-[14px] text-navy">{auctionTitle}</p>
          </div>

          <p className="text-[12px] text-muted bg-bg border border-border-light rounded-md px-3 py-2">
            This holds the seller's payout until an admin reviews it. Use this if the item never arrived, arrived
            damaged, or isn't what was described — not for a change of mind.
          </p>

          <Textarea
            label="What went wrong?"
            placeholder="Describe the problem — e.g. 'Item never arrived' or 'Arrived damaged, cracked screen'"
            value={reason}
            onChange={e => setReason(e.target.value)}
            maxLength={1000}
          />

          {error && (
            <p className="text-[13px] text-error bg-error-bg border border-error-border rounded-md px-3 py-2">{error}</p>
          )}

          <Button type="submit" loading={loading} disabled={reason.trim().length < 10} className="w-full">
            Submit Report
          </Button>
        </form>
      </div>
    </div>
  );
}
