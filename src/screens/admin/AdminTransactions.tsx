import { useEffect, useState } from 'react';
import { Menu, Receipt, X } from 'lucide-react';
import AdminLayout from '../../components/ui/AdminLayout';
import NotificationBell from '../../components/ui/NotificationBell';
import Button from '../../components/ui/Button';
import Textarea from '../../components/ui/Textarea';
import { useDialog } from '../../hooks/useDialog';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { dateMedium, pkrCompact } from '../../utils/format';

interface PendingTransaction {
  transactionId: string;
  auctionId: string;
  auctionTitle: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  finalAmount: number;
  status: string;
  lastPaymentError?: string;
  createdAt: string;
}

function VoidModal({ tx, onClose, onVoided }: {
  tx: PendingTransaction;
  onClose: () => void;
  onVoided: () => void;
}) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useDialog<HTMLDivElement>(true, onClose);

  async function handleVoid() {
    if (reason.trim().length < 3) {
      setError('Give a reason of at least 3 characters — it is kept in the audit log.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/admin/transactions/${tx.transactionId}/void`, { reason: reason.trim() });
      onVoided();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not void this transaction.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="void-modal-title"
        tabIndex={-1}
        className="bg-surface rounded-xl shadow-xl w-full max-w-[440px] p-6 focus:outline-none"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="void-modal-title" className="font-bold text-[16px] text-navy">Void transaction</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-muted hover:text-navy transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-[13px] text-muted mb-4">
          <span className="font-semibold text-secondary">{tx.auctionTitle}</span> — {pkrCompact(tx.finalAmount)},
          winner <span className="font-semibold text-secondary">{tx.buyerName}</span>. This cannot be undone; the
          buyer will no longer be able to pay for this sale.
        </p>

        <Textarea
          label="Reason"
          placeholder="e.g. Buyer unreachable after repeated payment attempts"
          value={reason}
          onChange={e => setReason(e.target.value)}
          maxLength={500}
        />

        {error && (
          <p className="text-[13px] text-error bg-error-bg border border-error-border rounded-md px-3 py-2 mt-3">{error}</p>
        )}

        <div className="flex gap-3 mt-5">
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={submitting}>Cancel</Button>
          <Button onClick={handleVoid} loading={submitting} className="flex-1">Void transaction</Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminTransactions() {
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [voidingTx, setVoidingTx] = useState<PendingTransaction | null>(null);

  const fetchTransactions = () => {
    api.get('/admin/transactions')
      .then(d => setTransactions(d))
      .catch(() => showToast({ type: 'error', title: 'Could not load transactions', message: 'Please try again.' }))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount only; showToast is stable
  useEffect(() => { fetchTransactions(); }, []);

  const handleVoided = () => {
    showToast({ type: 'success', title: 'Transaction voided', message: `${voidingTx?.auctionTitle} will no longer show as awaiting payment.` });
    setVoidingTx(null);
    setLoading(true);
    fetchTransactions();
  };

  return (
    <AdminLayout active="Transactions">
      {({ openMobileMenu }) => (
        <>
          <header className="bg-surface border-b border-border-light flex items-center justify-between px-4 sm:px-6 py-4 gap-3">
            <div className="flex items-center gap-3">
              <button
                className="md:hidden p-2 rounded-sm border border-border-light hover:bg-bg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={openMobileMenu}
                aria-label="Open navigation menu"
              >
                <Menu size={18} className="text-tertiary" />
              </button>
              <div>
                <h1 className="font-extrabold text-[18px] sm:text-[20px] text-navy">Transactions</h1>
                <p className="text-[12px] text-muted">Sales still awaiting payment</p>
              </div>
            </div>
            <NotificationBell iconClass="text-tertiary hover:text-navy" align="right" />
          </header>

          <div className="flex-1 overflow-auto p-4 sm:p-6">
            {loading ? (
              <div className="bg-surface border border-border-light rounded-md p-10 text-center text-[13px] text-muted">Loading…</div>
            ) : transactions.length === 0 ? (
              <div className="bg-surface border border-border-light rounded-md flex flex-col items-center justify-center py-16 px-6 text-center">
                <Receipt size={48} strokeWidth={1.3} className="text-success-dark mb-4" />
                <h2 className="font-bold text-[17px] text-navy mb-2">Nothing awaiting payment</h2>
                <p className="text-[13px] text-muted">Every won auction has either been paid for or has no unresolved transaction.</p>
              </div>
            ) : (
              <div className="bg-surface border border-border-light rounded-md overflow-hidden">
                <div className="hidden sm:grid sm:grid-cols-[1fr_130px_130px_110px_140px_100px] gap-3 px-5 py-3 text-[11px] text-placeholder font-bold uppercase tracking-[0.5px] border-b border-bg">
                  <span>Auction</span><span>Buyer</span><span>Seller</span><span>Amount</span><span>Won on</span><span>Action</span>
                </div>
                <div className="flex flex-col divide-y divide-bg">
                  {transactions.map(tx => (
                    <div key={tx.transactionId} className="grid grid-cols-1 sm:grid-cols-[1fr_130px_130px_110px_140px_100px] gap-2 sm:gap-3 sm:items-center px-5 py-4 hover:bg-surface-hover transition-colors">
                      <div className="min-w-0">
                        <p className="font-semibold text-[13px] text-secondary truncate">{tx.auctionTitle}</p>
                        {tx.lastPaymentError && (
                          <p className="text-[11px] text-destructive truncate">Last attempt failed: {tx.lastPaymentError}</p>
                        )}
                      </div>
                      <p className="text-[12px] text-tertiary truncate">{tx.buyerName}</p>
                      <p className="text-[12px] text-tertiary truncate">{tx.sellerName}</p>
                      <p className="font-bold text-[13px] text-navy">{pkrCompact(tx.finalAmount)}</p>
                      <p className="text-[11px] text-placeholder">{dateMedium(tx.createdAt)}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setVoidingTx(tx)}
                        className="w-fit"
                      >
                        Void
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {voidingTx && (
            <VoidModal tx={voidingTx} onClose={() => setVoidingTx(null)} onVoided={handleVoided} />
          )}
        </>
      )}
    </AdminLayout>
  );
}
