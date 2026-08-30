import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from './Button';
import Input from './Input';
import { useDialog } from '../../hooks/useDialog';

interface Props {
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteAccountModal({ onClose, onDeleted }: Props) {
  const { deleteAccount } = useAuth();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useDialog<HTMLDivElement>(true, onClose);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) { setError('Enter your password to confirm.'); return; }
    setLoading(true);
    setError(null);
    const result = await deleteAccount(password);
    setLoading(false);
    if (result.success) onDeleted();
    else setError(result.error || 'Could not delete your account.');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        tabIndex={-1}
        className="bg-surface rounded-xl shadow-xl w-full max-w-[440px] p-6 focus:outline-none"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="delete-account-title" className="font-bold text-[16px] text-navy">Delete account</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-muted hover:text-navy transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex items-start gap-2 bg-error-bg border border-error-border rounded-md px-3 py-2.5 mb-4">
          <AlertTriangle size={16} className="text-error shrink-0 mt-0.5" />
          <p className="text-[12px] text-error">
            This cannot be undone. Your name and email will be removed and you will be signed out
            everywhere. Bid and transaction records are kept, but no longer linked to you by name.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            label="Confirm your password"
            type="password"
            placeholder="Your current password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(null); }}
            error={error ?? undefined}
          />

          <div className="flex gap-3 mt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={loading}>Cancel</Button>
            <Button
              type="submit"
              variant="outline"
              loading={loading}
              className="flex-1 border-error text-error hover:bg-error-bg"
            >
              Delete my account
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
