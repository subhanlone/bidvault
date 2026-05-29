import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, CheckCircle, Clock, XCircle, Package } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BuyerNavbar } from '../../components/ui';
import Button from '../../components/ui/Button';
import PaymentModal from '../../components/ui/PaymentModal';
import { api } from '../../services/api';

interface WinTransaction {
  transactionId: string;
  auctionId: string;
  auctionTitle: string;
  auctionEmoji: string;
  auctionImageUrl: string;
  sellerName: string;
  finalAmount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

const statusConfig = {
  PENDING:   { label: 'Payment Pending',  icon: Clock,        color: 'text-warning',  bg: 'bg-warning-bg border-warning-border' },
  COMPLETED: { label: 'Payment Complete', icon: CheckCircle,  color: 'text-success',  bg: 'bg-success-bg border-success-border' },
  FAILED:    { label: 'Payment Failed',   icon: XCircle,      color: 'text-error',    bg: 'bg-error-bg border-error-border' },
};

function WinCardSkeleton() {
  return (
    <div className="bg-surface border border-border-light rounded-xl p-5">
      <div className="flex items-start gap-4">
        <div className="bg-border-light rounded-lg size-[56px] shrink-0 animate-pulse" />
        <div className="flex-1 min-w-0">
          <div className="h-4 w-3/4 bg-border-light rounded animate-pulse mb-2" />
          <div className="h-3 w-1/3 bg-border-light rounded animate-pulse mb-4" />
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
  const [paidTx, setPaidTx] = useState<string | null>(null);

  useEffect(() => {
    api.get<WinTransaction[]>('/payments/my-wins')
      .then(setTransactions)
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to load wins.';
        setError(message);
      })
      .finally(() => setLoading(false));
  }, []);

  function handlePaymentSuccess() {
    if (!selectedTx) return;
    setPaidTx(selectedTx.transactionId);
    setTransactions(prev =>
      prev.map(tx =>
        tx.transactionId === selectedTx.transactionId
          ? { ...tx, status: 'COMPLETED' }
          : tx
      )
    );
    setSelectedTx(null);
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
              const justPaid = paidTx === tx.transactionId;

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
                      <p className="text-[12px] text-muted mb-3">Seller: {tx.sellerName}</p>

                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div>
                          <p className="text-[11px] text-muted">Winning Bid</p>
                          <p className="font-extrabold text-[16px] text-primary">PKR {tx.finalAmount.toLocaleString()}</p>
                        </div>

                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-semibold ${cfg.bg} ${cfg.color}`}>
                          <StatusIcon size={12} />
                          {justPaid ? 'Payment Complete' : cfg.label}
                        </div>
                      </div>

                      {tx.status === 'PENDING' && (
                        <Button
                          className="mt-4 w-full text-[13px]"
                          onClick={() => setSelectedTx(tx)}
                        >
                          Complete Payment
                        </Button>
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
    </div>
  );
}
