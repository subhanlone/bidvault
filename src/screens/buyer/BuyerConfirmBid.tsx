import { useState } from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAuction } from '../../context/AuctionContext';
import { useToast } from '../../context/ToastContext';
import { AlertTriangle, X } from 'lucide-react';
import { BuyerNavbar } from '../../components/ui';
import Button from '../../components/ui/Button';

export default function BuyerConfirmBid() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { getAuction, placeBid } = useAuction();
  const { showToast } = useToast();
  const [isConfirming, setIsConfirming] = useState(false);

  const state = location.state as { auctionId: string; bidAmount: number } | null;
  if (!state?.auctionId || !state?.bidAmount) {
    return <Navigate to="/buyer/browse" replace />;
  }

  const auction = getAuction(state.auctionId ?? '');
  const bidAmount = state.bidAmount ?? 0;

  const handleConfirm = async () => {
    if (!auction || !user) return;
    setIsConfirming(true);
    const res = await placeBid(auction.auctionId, bidAmount);
    setIsConfirming(false);
    if (res.success) {
      showToast({ type: 'success', title: 'Bid Placed!', message: `Your bid of PKR ${bidAmount.toLocaleString()} is now the highest.` });
      navigate(`/buyer/live-bidding/${auction.auctionId}`);
    } else {
      showToast({ type: 'error', title: 'Bid Failed', message: res.error || 'Could not place bid.' });
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <BuyerNavbar userName={user?.name} onLogout={logout} />

      <main className="min-h-[calc(100vh-56px)] bg-[rgba(11,31,58,0.45)] flex items-center justify-center p-4 sm:p-6">
        {/* TODO: Migrate to Modal component from ui/ after Modal is stable */}
        <div role="dialog" aria-modal="true" aria-labelledby="confirm-bid-title" className="bg-surface rounded-lg shadow-[0px_20px_60px_rgba(11,31,58,0.2)] w-full max-w-[400px] overflow-hidden">
          <div className="flex items-center justify-between px-5 sm:px-6 pt-5 sm:pt-6 pb-0">
            <div className="bg-primary-surface flex items-center justify-center rounded-full size-[44px]">
              <AlertTriangle size={20} strokeWidth={2} className="text-primary" aria-hidden="true" />
            </div>
            <button
              onClick={() => navigate(-1)}
              aria-label="Close"
              className="bg-bg flex items-center justify-center rounded-full size-[32px] hover:bg-[#e9ecef] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
            >
              <X size={16} className="text-muted" aria-hidden="true" />
            </button>
          </div>

          <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-4">
            <h3 id="confirm-bid-title" className="font-extrabold text-[18px] text-navy mb-1">Confirm Your Bid</h3>
            <p className="text-[13px] text-muted mb-5 leading-[20px]">
              Once confirmed, this is a binding commitment and cannot be cancelled if you become the highest bidder.
            </p>

            {auction && (
              <>
                <div className="bg-bg rounded-md p-3 sm:p-4 mb-4 flex items-center gap-3">
                  <div className="bg-navy size-[48px] rounded-sm overflow-hidden shrink-0">
                    <img src={auction.imageUrl} alt={auction.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[12px] text-navy truncate">{auction.title}</p>
                    <p className="text-[11px] text-muted">{auction.category} · {auction.condition}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 mb-5">
                  {[
                    { label: 'Your bid amount', value: `PKR ${bidAmount.toLocaleString()}`, highlight: true },
                    { label: 'Current highest bid', value: `PKR ${auction.currentBid.toLocaleString()}` },
                    { label: 'Min increment', value: `PKR ${auction.minIncrement.toLocaleString()}` },
                    { label: 'Bidding as', value: user?.name ?? '—' },
                  ].map(d => (
                    <div key={d.label} className="flex items-center justify-between">
                      <span className="text-[13px] text-muted">{d.label}</span>
                      <span className={`font-bold text-[13px] ${d.highlight ? 'text-primary' : 'text-secondary'}`}>{d.value}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-[#fffbeb] border border-warning-border rounded-sm px-3 py-[10px] mb-5">
                  <p className="text-[11.5px] text-warning font-medium leading-[18px]">
                    By confirming, you agree to purchase this item at this price if you win the auction.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 rounded-sm"
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="lg"
                    className="flex-1 rounded-sm shadow-primary"
                    loading={isConfirming}
                    onClick={handleConfirm}
                  >
                    Confirm Bid →
                  </Button>
                </div>
              </>
            )}

            {!auction && (
              <div className="text-center py-4">
                <p className="text-muted mb-3">Auction not found.</p>
                <Link to="/buyer/browse" className="font-bold text-primary">Browse Auctions</Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
