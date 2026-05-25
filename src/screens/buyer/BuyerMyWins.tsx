import { useEffect, useState } from 'react';
import { Trophy, CheckCircle, Clock, XCircle } from 'lucide-react';
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

export default function BuyerMyWins() {
  const { user, logout } = useAuth();
  const [transactions, setTransactions] = useState<WinTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<WinTransaction | null>(null);
  const [paidTx, setPaidTx] = useState<string | null>(null);

  useEffect(() => {
    api.get<WinTransaction[]>('/payments/my-wins')
      .then(setTransactions)
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

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Trophy size={24} className="text-gold" />
          <h1 className="font-extrabold text-[22px] text-navy">My Wins</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-20">
            <Trophy size={48} strokeWidth={1.2} className="text-placeholder mx-auto mb-4" />
            <p className="font-bold text-[16px] text-navy mb-1">No wins yet</p>
            <p className="text-[13px] text-muted">Win an auction to see your transactions here.</p>
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
                    <div className="bg-navy rounded-lg size-[56px] flex items-center justify-center text-[28px] shrink-0">
                      {tx.auctionEmoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[14px] text-navy truncate mb-1">{tx.auctionTitle}</h3>
                      <p className="text-[12px] text-muted mb-3">Seller: {tx.sellerName}</p>

                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div>
                          <p className="text-[11px] text-muted">Winning Bid</p>
                          <p className="font-extrabold text-[16px] text-success">PKR {tx.finalAmount.toLocaleString()}</p>
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
