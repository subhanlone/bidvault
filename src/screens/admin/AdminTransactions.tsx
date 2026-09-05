import { useEffect, useState } from 'react';
import { Menu, Receipt, ShieldAlert, X } from 'lucide-react';
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

interface Dispute {
  disputeId: string;
  transactionId: string;
  auctionTitle: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  finalAmount: number;
  reason: string;
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

function ResolveModal({ dispute, onClose, onResolved }: {
  dispute: Dispute;
  onClose: () => void;
  onResolved: (resolution: 'REFUND' | 'RELEASE') => void;
}) {
  const [resolution, setResolution] = useState<'REFUND' | 'RELEASE' | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useDialog<HTMLDivElement>(true, onClose);

  async function handleResolve() {
    if (!resolution) {
      setError('Choose whether to refund the buyer or release the payout to the seller.');
      return;
    }
    if (note.trim().length < 3) {
      setError('Give a reason of at least 3 characters — it is kept in the audit log.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/admin/disputes/${dispute.disputeId}/resolve`, { resolution, note: note.trim() });
      onResolved(resolution);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not resolve this dispute.');
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
        aria-labelledby="resolve-modal-title"
        tabIndex={-1}
        className="bg-surface rounded-xl shadow-xl w-full max-w-[480px] p-6 focus:outline-none"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="resolve-modal-title" className="font-bold text-[16px] text-navy">Resolve dispute</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-muted hover:text-navy transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-[13px] text-muted mb-1">
          <span className="font-semibold text-secondary">{dispute.auctionTitle}</span> — {pkrCompact(dispute.finalAmount)}
        </p>
        <p className="text-[12px] text-muted bg-bg border border-border-light rounded-md px-3 py-2 mb-4">
          Buyer ({dispute.buyerName}) said: "{dispute.reason}"
        </p>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            type="button"
            onClick={() => setResolution('REFUND')}
            className={`text-left px-3 py-2.5 rounded-md border text-[13px] font-semibold transition-colors cursor-pointer
              ${resolution === 'REFUND' ? 'border-error bg-error-bg text-error' : 'border-border-light text-tertiary hover:bg-bg'}`}
          >
            Refund buyer
            <span className="block text-[11px] font-normal mt-0.5">Seller gets no payout for this sale.</span>
          </button>
          <button
            type="button"
            onClick={() => setResolution('RELEASE')}
            className={`text-left px-3 py-2.5 rounded-md border text-[13px] font-semibold transition-colors cursor-pointer
              ${resolution === 'RELEASE' ? 'border-success bg-success-bg text-success-dark' : 'border-border-light text-tertiary hover:bg-bg'}`}
          >
            Release to seller ({dispute.sellerName})
            <span className="block text-[11px] font-normal mt-0.5">Marks delivered and pays the seller.</span>
          </button>
        </div>

        <Textarea
          label="Note (kept in the audit log, and shown to both parties)"
          placeholder="e.g. Buyer provided photos of damage; refunding in full."
          value={note}
          onChange={e => setNote(e.target.value)}
          maxLength={500}
        />

        {error && (
          <p className="text-[13px] text-error bg-error-bg border border-error-border rounded-md px-3 py-2 mt-3">{error}</p>
        )}

        <div className="flex gap-3 mt-5">
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={submitting}>Cancel</Button>
          <Button onClick={handleResolve} loading={submitting} className="flex-1">Resolve</Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminTransactions() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<'pending' | 'disputes'>('pending');
  const [transactions, setTransactions] = useState<PendingTransaction[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [loadingDisputes, setLoadingDisputes] = useState(true);
  const [voidingTx, setVoidingTx] = useState<PendingTransaction | null>(null);
  const [resolvingDispute, setResolvingDispute] = useState<Dispute | null>(null);

  // Pure fetches — no synchronous setLoading(true), so the mount effect below can call them
  // directly without tripping the "setState synchronously within an effect" rule. Loading
  // starts true via useState already; these only ever need to flip it back to true for a
  // *re*-fetch, which the wrapped versions below handle for the event-handler callers.
  const loadTransactions = () =>
    api.get('/admin/transactions')
      .then(d => setTransactions(d))
      .catch(() => showToast({ type: 'error', title: 'Could not load transactions', message: 'Please try again.' }))
      .finally(() => setLoadingTransactions(false));

  const loadDisputes = () =>
    api.get('/admin/disputes')
      .then(d => setDisputes(d))
      .catch(() => showToast({ type: 'error', title: 'Could not load disputes', message: 'Please try again.' }))
      .finally(() => setLoadingDisputes(false));

  const fetchTransactions = () => { setLoadingTransactions(true); void loadTransactions(); };
  const fetchDisputes = () => { setLoadingDisputes(true); void loadDisputes(); };

  // Both load on mount — the disputes count badge needs the count regardless of which tab is
  // active, and it means switching tabs is a pure view toggle with nothing to fetch.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once; showToast is stable
  useEffect(() => { void loadTransactions(); void loadDisputes(); }, []);

  const loading = tab === 'pending' ? loadingTransactions : loadingDisputes;

  const handleVoided = () => {
    showToast({ type: 'success', title: 'Transaction voided', message: `${voidingTx?.auctionTitle} will no longer show as awaiting payment.` });
    setVoidingTx(null);
    fetchTransactions();
  };

  const handleResolved = (resolution: 'REFUND' | 'RELEASE') => {
    showToast({
      type: 'success',
      title: 'Dispute resolved',
      message: resolution === 'REFUND'
        ? `${resolvingDispute?.auctionTitle} — buyer refunded.`
        : `${resolvingDispute?.auctionTitle} — payout released to the seller.`,
    });
    setResolvingDispute(null);
    fetchDisputes();
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
                <p className="text-[12px] text-muted">{tab === 'pending' ? 'Sales still awaiting payment' : 'Buyer-reported problems awaiting review'}</p>
              </div>
            </div>
            <NotificationBell iconClass="text-tertiary hover:text-navy" align="right" />
          </header>

          <div className="flex items-center gap-1 px-4 sm:px-6 pt-4 border-b border-border-light bg-surface">
            {(['pending', 'disputes'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-colors cursor-pointer
                  ${tab === t ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-secondary'}`}
              >
                {t === 'pending' ? 'Awaiting Payment' : `Disputes${disputes.length > 0 ? ` (${disputes.length})` : ''}`}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto p-4 sm:p-6">
            {loading ? (
              <div className="bg-surface border border-border-light rounded-md p-10 text-center text-[13px] text-muted">Loading…</div>
            ) : tab === 'pending' ? (
              transactions.length === 0 ? (
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
              )
            ) : disputes.length === 0 ? (
              <div className="bg-surface border border-border-light rounded-md flex flex-col items-center justify-center py-16 px-6 text-center">
                <ShieldAlert size={48} strokeWidth={1.3} className="text-success-dark mb-4" />
                <h2 className="font-bold text-[17px] text-navy mb-2">No open disputes</h2>
                <p className="text-[13px] text-muted">Every buyer-reported problem has been resolved.</p>
              </div>
            ) : (
              <div className="bg-surface border border-border-light rounded-md overflow-hidden">
                <div className="hidden sm:grid sm:grid-cols-[1fr_130px_130px_110px_140px_100px] gap-3 px-5 py-3 text-[11px] text-placeholder font-bold uppercase tracking-[0.5px] border-b border-bg">
                  <span>Auction</span><span>Buyer</span><span>Seller</span><span>Amount</span><span>Reported</span><span>Action</span>
                </div>
                <div className="flex flex-col divide-y divide-bg">
                  {disputes.map(d => (
                    <div key={d.disputeId} className="grid grid-cols-1 sm:grid-cols-[1fr_130px_130px_110px_140px_100px] gap-2 sm:gap-3 sm:items-center px-5 py-4 hover:bg-surface-hover transition-colors">
                      <div className="min-w-0">
                        <p className="font-semibold text-[13px] text-secondary truncate">{d.auctionTitle}</p>
                        <p className="text-[11px] text-muted truncate">"{d.reason}"</p>
                      </div>
                      <p className="text-[12px] text-tertiary truncate">{d.buyerName}</p>
                      <p className="text-[12px] text-tertiary truncate">{d.sellerName}</p>
                      <p className="font-bold text-[13px] text-navy">{pkrCompact(d.finalAmount)}</p>
                      <p className="text-[11px] text-placeholder">{dateMedium(d.createdAt)}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setResolvingDispute(d)}
                        className="w-fit"
                      >
                        Resolve
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

          {resolvingDispute && (
            <ResolveModal dispute={resolvingDispute} onClose={() => setResolvingDispute(null)} onResolved={handleResolved} />
          )}
        </>
      )}
    </AdminLayout>
  );
}
