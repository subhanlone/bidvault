import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, CheckCircle, Clock, XCircle, Package, Star, Truck, AlertTriangle, ShieldAlert, RotateCcw, Receipt } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BuyerNavbar, RatingModal, DisputeModal } from '../../components/ui';
import Button from '../../components/ui/Button';
import PaymentModal from '../../components/ui/PaymentModal';
import { api } from '../../services/api';
import { dateMedium, dateTimeShort, pkr } from '../../utils/format';
import LoadingStatus from '../../components/ui/LoadingStatus';

type TransactionStatus =
  | 'PENDING' | 'COMPLETED' | 'FAILED' | 'VOIDED'
  | 'SHIPPED' | 'DELIVERED' | 'DISPUTED' | 'REFUNDED';

interface WinTransaction {
  transactionId: string;
  auctionId: string;
  auctionTitle: string;
  auctionEmoji: string;
  auctionImageUrl: string;
  sellerName: string;
  finalAmount: number;
  status: TransactionStatus;
  // Why the last payment attempt failed, if one did. The transaction stays PENDING rather
  // than moving to FAILED so a decline is retryable — this is the explanation that goes with
  // that PENDING state instead of a separate terminal one.
  lastPaymentError?: string;
  // BV-047: present once the seller has shipped. reviewDeadlineAt is the confirm-or-dispute
  // deadline, computed server-side so this screen never needs reviewTimeoutHours itself.
  shippedAt?: string;
  reviewDeadlineAt?: string;
  disputeReason?: string;
  createdAt: string;
  reviewed: boolean;
}

const statusConfig: Record<TransactionStatus, { label: string; icon: typeof Clock; color: string; bg: string }> = {
  PENDING:   { label: 'Payment Pending',    icon: Clock,        color: 'text-warning',  bg: 'bg-warning-bg border-warning-border' },
  COMPLETED: { label: 'Awaiting Shipment',  icon: Package,      color: 'text-info',     bg: 'bg-info-bg border-info-border' },
  SHIPPED:   { label: 'Shipped',            icon: Truck,        color: 'text-primary',  bg: 'bg-primary/10 border-primary/30' },
  DELIVERED: { label: 'Delivered',          icon: CheckCircle,  color: 'text-success',  bg: 'bg-success-bg border-success-border' },
  DISPUTED:  { label: 'Under Review',       icon: ShieldAlert,  color: 'text-warning',  bg: 'bg-warning-bg border-warning-border' },
  REFUNDED:  { label: 'Refunded',           icon: RotateCcw,    color: 'text-muted',    bg: 'bg-bg border-border-light' },
  FAILED:    { label: 'Payment Failed',     icon: XCircle,      color: 'text-error',    bg: 'bg-error-bg border-error-border' },
  VOIDED:    { label: 'Cancelled',          icon: XCircle,      color: 'text-muted',    bg: 'bg-bg border-border-light' },
};

function WinCardSkeleton() {
  return (
    <div className="bg-surface border border-border-light rounded-xl p-5">
      <div className="flex items-start gap-4">
        <div className="bg-border-light rounded-lg size-[56px] shrink-0 animate-pulse" />
        <div className="flex-1 min-w-0">
          <div className="h-4 w-3/4 bg-border-light rounded animate-pulse mb-2" />
          <div className="h-3 w-1/3 bg-border-light rounded animate-pulse mb-1" />
          <div className="h-3 w-1/4 bg-border-light rounded animate-pulse mb-3" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="h-3 w-16 bg-border-light rounded animate-pulse mb-1" />
              <div className="h-5 w-32 bg-border-light rounded animate-pulse" />
            </div>
            <div className="h-7 w-28 bg-border-light rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BuyerMyWins() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<WinTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<WinTransaction | null>(null);
  const [ratingTx, setRatingTx] = useState<WinTransaction | null>(null);
  const [disputeTx, setDisputeTx] = useState<WinTransaction | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<{ txId: string; message: string } | null>(null);

  function refresh() {
    return api.get('/payments/my-wins').then(setTransactions);
  }

  useEffect(() => {
    refresh()
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to load wins.';
        setError(message);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleConfirmReceipt(tx: WinTransaction) {
    setActionError(null);
    setConfirmingId(tx.transactionId);
    try {
      await api.post(`/payments/${tx.transactionId}/confirm-receipt`);
      await refresh();
    } catch (err: unknown) {
      setActionError({
        txId: tx.transactionId,
        message: err instanceof Error ? err.message : 'Could not confirm receipt.',
      });
    } finally {
      setConfirmingId(null);
    }
  }

  function handlePaymentSuccess() {
    const txId = selectedTx?.transactionId;
    setSelectedTx(null);
    api.get('/payments/my-wins')
      .then(setTransactions)
      .catch(() => {
        if (!txId) return;
        setTransactions(prev =>
          prev.map(tx => tx.transactionId === txId ? { ...tx, status: 'COMPLETED' } : tx)
        );
      });
  }

  return (
    <div className="min-h-screen bg-bg">
      <BuyerNavbar userName={user?.name} onLogout={logout} />

      <main className="max-w-[860px] mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Trophy size={24} className="text-gold" />
          <h1 className="font-extrabold text-[22px] text-navy">My Wins</h1>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            <LoadingStatus label="Loading your wins" />
            {Array.from({ length: 3 }).map((_, i) => <WinCardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="bg-surface border border-border-light rounded-md flex flex-col items-center justify-center py-20 text-center">
            <XCircle size={48} strokeWidth={1.2} className="text-error mx-auto mb-4" />
            <p className="font-bold text-[16px] text-navy mb-1">Could not load wins</p>
            <p className="text-[13px] text-muted">{error}</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-surface border border-border-light rounded-md flex flex-col items-center justify-center py-20 px-6 text-center">
            <Trophy size={48} strokeWidth={1.2} className="text-placeholder mx-auto mb-4" />
            <p className="font-bold text-[16px] text-navy mb-1">No wins yet</p>
            <p className="text-[13px] text-muted mb-5">Win an auction to see your transactions here.</p>
            <Button onClick={() => navigate('/buyer/browse')}>
              Browse Auctions
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {transactions.map(tx => {
              const cfg = statusConfig[tx.status];
              const StatusIcon = cfg.icon;

              return (
                <div key={tx.transactionId} className="bg-surface border border-border-light rounded-xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="bg-navy rounded-lg size-[56px] flex items-center justify-center shrink-0 overflow-hidden">
                      {tx.auctionImageUrl
                        ? <img src={tx.auctionImageUrl} alt={tx.auctionTitle} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        : <Package size={24} className="text-white/60" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[14px] text-navy truncate mb-1">{tx.auctionTitle}</h3>
                      <p className="text-[12px] text-muted">Seller: {tx.sellerName}</p>
                      <p className="text-[11px] text-placeholder mb-3">{dateMedium(tx.createdAt)}</p>

                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div>
                          <p className="text-[11px] text-muted">Winning Bid</p>
                          <p className="font-extrabold text-[16px] text-primary">{pkr(tx.finalAmount)}</p>
                        </div>

                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-semibold ${cfg.bg} ${cfg.color}`}>
                          <StatusIcon size={12} />
                          {cfg.label}
                        </div>
                      </div>

                      {tx.status === 'PENDING' && (
                        <>
                          {tx.lastPaymentError && (
                            <p className="mt-3 text-[12px] text-error bg-error-bg border border-error-border rounded-md px-3 py-2">
                              Last attempt failed: {tx.lastPaymentError}
                            </p>
                          )}
                          <Button
                            className="mt-4 w-full text-[13px]"
                            onClick={() => setSelectedTx(tx)}
                          >
                            {tx.lastPaymentError ? 'Retry Payment' : 'Complete Payment'}
                          </Button>
                        </>
                      )}

                      {tx.status === 'FAILED' && (
                        <Button
                          variant="outline"
                          className="mt-4 w-full text-[13px] border-error text-error hover:bg-error-bg"
                          onClick={() => setSelectedTx(tx)}
                        >
                          Retry Payment
                        </Button>
                      )}

                      {tx.status === 'VOIDED' && (
                        <p className="mt-4 text-[12px] text-muted text-center">
                          This transaction was cancelled by BidVault. Contact support if you have questions.
                        </p>
                      )}

                      {tx.status === 'REFUNDED' && (
                        <p className="mt-4 text-[12px] text-muted text-center">
                          This purchase was refunded after a dispute review.
                        </p>
                      )}

                      {tx.status === 'COMPLETED' && (
                        <p className="mt-4 text-[12px] text-info text-center">
                          Payment received — waiting for the seller to ship your item.
                        </p>
                      )}

                      {tx.status === 'DISPUTED' && (
                        <div className="mt-4 bg-warning-bg border border-warning-border rounded-md px-3 py-2">
                          <p className="text-[12px] text-navy font-semibold flex items-center gap-1.5">
                            <ShieldAlert size={13} /> An admin is reviewing your report
                          </p>
                          {tx.disputeReason && (
                            <p className="text-[11px] text-muted mt-1">"{tx.disputeReason}"</p>
                          )}
                        </div>
                      )}

                      {tx.status === 'SHIPPED' && (
                        <>
                          {tx.reviewDeadlineAt && (
                            <p className="mt-3 text-[11px] text-muted text-center">
                              Confirm receipt or report a problem by {dateTimeShort(tx.reviewDeadlineAt)} —
                              after that, receipt is confirmed automatically.
                            </p>
                          )}
                          {actionError && actionError.txId === tx.transactionId && (
                            <p className="mt-2 text-[12px] text-error bg-error-bg border border-error-border rounded-md px-3 py-2">
                              {actionError.message}
                            </p>
                          )}
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <Button
                              className="text-[13px]"
                              loading={confirmingId === tx.transactionId}
                              onClick={() => handleConfirmReceipt(tx)}
                            >
                              <Truck size={14} /> Confirm Receipt
                            </Button>
                            <Button
                              variant="outline"
                              className="text-[13px] border-error text-error hover:bg-error-bg"
                              onClick={() => setDisputeTx(tx)}
                            >
                              <AlertTriangle size={14} /> Report a Problem
                            </Button>
                          </div>
                        </>
                      )}

                      {tx.status === 'DELIVERED' && !tx.reviewed && (
                        <Button
                          variant="outline"
                          className="mt-4 w-full text-[13px]"
                          onClick={() => setRatingTx(tx)}
                        >
                          <Star size={14} /> Rate Seller
                        </Button>
                      )}

                      {tx.status === 'DELIVERED' && tx.reviewed && (
                        <p className="mt-4 text-[12px] text-success font-semibold text-center">
                          ✓ You rated this seller
                        </p>
                      )}

                      {(tx.status === 'DELIVERED' || tx.status === 'SHIPPED' || tx.status === 'DISPUTED') && (
                        <Link
                          to={`/transactions/${tx.transactionId}/invoice`}
                          className="mt-2 text-[12px] font-semibold text-primary hover:underline flex items-center justify-center gap-1"
                        >
                          <Receipt size={13} /> View Invoice
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {selectedTx && (
        <PaymentModal
          transactionId={selectedTx.transactionId}
          auctionTitle={selectedTx.auctionTitle}
          finalAmount={selectedTx.finalAmount}
          onSuccess={handlePaymentSuccess}
          onClose={() => setSelectedTx(null)}
        />
      )}

      {ratingTx && (
        <RatingModal
          transactionId={ratingTx.transactionId}
          sellerName={ratingTx.sellerName}
          auctionTitle={ratingTx.auctionTitle}
          onSuccess={() => {
            setTransactions(prev =>
              prev.map(t => t.transactionId === ratingTx.transactionId ? { ...t, reviewed: true } : t)
            );
            setRatingTx(null);
          }}
          onClose={() => setRatingTx(null)}
        />
      )}

      {disputeTx && (
        <DisputeModal
          transactionId={disputeTx.transactionId}
          auctionTitle={disputeTx.auctionTitle}
          onSuccess={() => {
            setDisputeTx(null);
            void refresh();
          }}
          onClose={() => setDisputeTx(null)}
        />
      )}
    </div>
  );
}
