import { useState, type ReactNode } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import Button from './Button';
import Textarea from './Textarea';
import { useDialog } from '../../hooks/useDialog';

interface Props {
  title: string;
  /** What's being acted on, shown under the title (e.g. an auction's name). */
  subject: string;
  /** Short explanation of the consequence, shown in the muted info box. */
  description: string;
  submitLabel: string;
  fieldLabel: string;
  placeholder: string;
  /** The field may be left empty (the buyer's not-shipped report: the report itself says what is wrong). */
  optional?: boolean;
  /** Anything more the decision needs, under the field (the pause-selling dialog's checkbox). */
  children?: ReactNode;
  onSubmit: (reason: string) => Promise<void>;
  onClose: () => void;
}

/**
 * The reason-prompt shape of DisputeModal, generalised for the seller and admin auction-cancel
 * actions: both need one required reason, so one component takes the API call as a callback.
 */
export default function ReasonModal({ title, subject, description, submitLabel, fieldLabel, placeholder, optional = false, children, onSubmit, onClose }: Props) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useDialog<HTMLDivElement>(true, onClose);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!optional && reason.trim().length < 3) {
      setError('Give a short reason (at least 3 characters).');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmit(reason.trim());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reason-modal-title"
        tabIndex={-1}
        className="bg-surface rounded-xl shadow-xl w-full max-w-[440px] p-6 focus:outline-none"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-error" />
            <h2 id="reason-modal-title" className="font-bold text-[16px] text-navy">{title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-muted hover:text-navy transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <p className="font-bold text-[14px] text-navy">{subject}</p>
          <p className="text-[12px] text-muted bg-bg border border-border-light rounded-md px-3 py-2">{description}</p>

          <Textarea
            label={fieldLabel}
            placeholder={placeholder}
            value={reason}
            onChange={e => setReason(e.target.value)}
            maxLength={500}
          />

          {children}

          {error && (
            <p className="text-[13px] text-error bg-error-bg border border-error-border rounded-md px-3 py-2">{error}</p>
          )}

          <Button type="submit" loading={loading} disabled={!optional && reason.trim().length < 3} className="w-full">
            {submitLabel}
          </Button>
        </form>
      </div>
    </div>
  );
}
