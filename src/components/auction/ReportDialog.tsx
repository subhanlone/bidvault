import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flag, X } from 'lucide-react';
import { api } from '../../services/api';
import { useDialog } from '../../hooks/useDialog';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';
import type { ListingReport, ReportReason } from '../../types/api';
import { REPORT_REASON_LABEL } from '../../utils/reportReasons';

const REASON_HINT: Record<ReportReason, string> = {
  PROHIBITED_ITEM: 'Something that may not be sold on BidVault.',
  MISLEADING: 'The description or the photos do not match the item.',
  COUNTERFEIT: 'A fake, or a copy sold as the real thing.',
  OTHER: 'Tell us in the note below.',
};

const REASONS = Object.keys(REPORT_REASON_LABEL) as ReportReason[];
const NOTE_MAX = 500;

/**
 * "Report this listing" (guest browsing F3, G5): the reason, an optional note for the admin, and a
 * link to what may not be sold. One report per person per auction: a repeat is told so instead of
 * being thanked twice. The seller is never told who reported them.
 */
export default function ReportDialog({ auctionId, auctionTitle, onClose }: {
  auctionId: string;
  auctionTitle: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<'thanks' | 'already' | null>(null);
  const dialogRef = useDialog<HTMLDivElement>(true, onClose);
  const titleId = useId();
  const reasonName = useId();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) return;
    setSending(true);
    setError(null);
    try {
      const result: { report: ListingReport; alreadyReported: boolean } = await api.post(
        `/auctions/${auctionId}/report`,
        { reason, ...(note.trim() ? { note: note.trim() } : {}) },
      );
      setDone(result.alreadyReported ? 'already' : 'thanks');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not send your report.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="bg-surface rounded-xl shadow-xl w-full max-w-[460px] max-h-[90vh] overflow-y-auto p-6 focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flag size={17} className="text-error" aria-hidden="true" />
            <h2 id={titleId} className="font-bold text-[16px] text-navy">Report this listing</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-muted hover:text-navy transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-[12px] text-muted mb-4">
          About <span className="font-semibold text-secondary">{auctionTitle}</span>. An admin reviews every report. The seller is not told who sent it.
        </p>

        {done ? (
          <div className="flex flex-col gap-4">
            <p role="status" className="text-[13px] text-secondary bg-bg border border-border-light rounded-md px-3 py-3">
              {done === 'thanks' ? 'Thanks. An admin will review this listing.' : 'You already reported this listing.'}
            </p>
            <Button type="button" onClick={onClose} className="w-full">Done</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <fieldset className="flex flex-col gap-2 m-0 p-0 border-0">
              <legend className="text-[13px] font-semibold text-body mb-2">What is wrong with it?</legend>
              {REASONS.map((r) => (
                <label key={r} className="flex items-start gap-2.5 cursor-pointer rounded-md border border-border-light px-3 py-2.5 has-[:checked]:border-primary">
                  <input
                    type="radio"
                    name={reasonName}
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="mt-0.5 accent-primary"
                  />
                  <span>
                    <span className="block text-[13px] font-semibold text-secondary">{REPORT_REASON_LABEL[r]}</span>
                    <span className="block text-[11px] text-muted">{REASON_HINT[r]}</span>
                  </span>
                </label>
              ))}
            </fieldset>

            <Textarea
              label="Anything else an admin should know? (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={NOTE_MAX}
              rows={3}
              hint={`${note.length}/${NOTE_MAX}`}
            />

            <p className="text-[12px] text-muted">
              Not sure? Read <Link to="/rules" className="font-semibold text-primary hover:underline">What you may not sell</Link>.
            </p>

            {error && (
              <p role="alert" className="text-[13px] text-error bg-error-bg border border-error-border rounded-md px-3 py-2">{error}</p>
            )}

            <Button type="submit" loading={sending} disabled={!reason} className="w-full">Send report</Button>
          </form>
        )}
      </div>
    </div>
  );
}
