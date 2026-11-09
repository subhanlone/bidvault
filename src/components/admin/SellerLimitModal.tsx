import { useState } from 'react';
import { Gauge, X } from 'lucide-react';
import { api } from '../../services/api';
import { useDialog } from '../../hooks/useDialog';
import Button from '../ui/Button';
import Input from '../ui/Input';
import type { AdminUser } from '../../types/api';

const MAX_ITEMS = 1000;
const MAX_VALUE = 2_000_000_000;

/** A field left empty means "the platform number", sent as null; anything else a whole number in range. */
function read(raw: string, max: number): { ok: true; value: number | null } | { ok: false } {
  const t = raw.trim();
  if (!t) return { ok: true, value: null };
  const n = Number(t);
  return Number.isInteger(n) && n > 0 && n <= max ? { ok: true, value: n } : { ok: false };
}

/**
 * B5 PR 4: an admin's personal monthly limit for one seller (PUT /admin/users/{id}/seller-limit). It
 * replaces the platform numbers whatever the seller's standing: higher to trust, lower to restrain.
 * An empty field removes that half.
 */
export default function SellerLimitModal({ target, onClose, onSaved }: {
  target: AdminUser;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [items, setItems] = useState(target.sellerLimitOverrideItems?.toString() ?? '');
  const [value, setValue] = useState(target.sellerLimitOverrideValue?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useDialog<HTMLDivElement>(true, onClose);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const i = read(items, MAX_ITEMS);
    const v = read(value, MAX_VALUE);
    if (!i.ok || !v.ok) {
      setError('Use whole numbers above zero, or leave a field empty for the usual number.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.put(`/admin/users/${target.userId}/seller-limit`, { items: i.value, value: v.value });
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save the limit.');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="seller-limit-title"
        tabIndex={-1}
        className="bg-surface rounded-xl shadow-xl w-full max-w-[420px] p-6 focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gauge size={18} className="text-primary" aria-hidden="true" />
            <h2 id="seller-limit-title" className="font-bold text-[16px] text-navy">Set a personal limit</h2>
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
        <p className="text-[13px] text-muted mb-1">For</p>
        <p className="font-bold text-[14px] text-navy mb-4">{target.name} ({target.email})</p>
        <p className="text-[12px] text-muted bg-bg border border-border-light rounded-md px-3 py-2 mb-4">
          Replaces the platform's monthly numbers for this seller, whatever their sales: higher to trust them, lower to
          hold them back. Leave a field empty to use the usual number. They are told.
        </p>
        <form onSubmit={save} className="flex flex-col gap-4">
          <Input label="Items a month" type="number" min={1} max={MAX_ITEMS} step={1} value={items} onChange={(e) => setItems(e.target.value)} placeholder="Usual number" />
          <Input label="Starting-price value a month (PKR)" type="number" min={1} max={MAX_VALUE} step={1} value={value} onChange={(e) => setValue(e.target.value)} placeholder="Usual number" />
          {error && <p role="alert" className="text-[13px] text-error bg-error-bg border border-error-border rounded-md px-3 py-2">{error}</p>}
          <Button type="submit" loading={saving} className="w-full">Save limit</Button>
        </form>
      </div>
    </div>
  );
}
