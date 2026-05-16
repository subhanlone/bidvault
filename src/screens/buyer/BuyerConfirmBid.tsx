import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAuction } from '../../context/AuctionContext';
import { useToast } from '../../context/ToastContext';
import { IconBidVaultLogo, IconX } from '../../components/Icons';

export default function BuyerConfirmBid() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { getAuction, placeBid } = useAuction();
  const { showToast } = useToast();

  const state = location.state as { auctionId: string; bidAmount: number } | null;
  const auction = getAuction(state?.auctionId ?? '');
  const bidAmount = state?.bidAmount ?? 0;

  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!auction || !user) return;
    setLoading(true);
    const res = await placeBid(auction.auctionId, bidAmount, user);
    setLoading(false);
    if (res.success) {
      showToast({ type: 'success', title: 'Bid Placed!', message: `Your bid of PKR ${bidAmount.toLocaleString()} is now the highest.` });
      navigate(`/buyer/live-bidding/${auction.auctionId}`);
    } else {
      showToast({ type: 'error', title: 'Bid Failed', message: res.error || 'Could not place bid.' });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Nav */}
      <header className="bg-[#0b1f3a] flex items-center justify-between px-8 py-0">
        <div className="flex gap-[10px] items-center py-4">
          <div className="bg-[#d0021b] flex items-center justify-center rounded-[8px] size-[34px]">
            <IconBidVaultLogo className="size-[18px]" />
          </div>
          <span className="font-extrabold text-[20px] text-white tracking-[-0.3px]">
            Bid<span className="text-[#d0021b]">Vault</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[rgba(255,255,255,0.1)] rounded-full size-[34px] flex items-center justify-center">
            <span className="font-bold text-[13px] text-white">{user?.name[0] ?? 'B'}</span>
          </div>
          <span className="font-semibold text-[13px] text-white">{user?.name?.split(' ')[0]}</span>
        </div>
      </header>

      {/* Modal overlay */}
      <div className="min-h-[calc(100vh-64px)] bg-[rgba(11,31,58,0.5)] flex items-center justify-center p-6">
        <div className="bg-white rounded-[16px] shadow-[0px_20px_60px_rgba(11,31,58,0.2)] w-[380px] overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-6 pb-0">
            <div className="bg-[#fff0f2] flex items-center justify-center rounded-full size-[44px]">
              <span className="text-[20px]">⚠️</span>
            </div>
            <button onClick={() => navigate(-1)} className="bg-[#f8f9fa] flex items-center justify-center rounded-full size-[28px] hover:bg-[#e9ecef]">
              <IconX />
            </button>
          </div>

          <div className="px-6 pb-6 pt-4">
            <h3 className="font-extrabold text-[18px] text-[#0b1f3a] mb-1">Confirm Your Bid</h3>
            <p className="text-[13px] text-[#6c757d] mb-5">
              Once confirmed, this is a binding commitment and cannot be cancelled if you become the highest bidder.
            </p>

            {auction && (
              <>
                {/* Item preview */}
                <div className="bg-[#f8f9fa] rounded-[10px] p-4 mb-4 flex items-center gap-3">
                  <div className="bg-[#0b1f3a] size-[48px] rounded-[8px] overflow-hidden shrink-0">
                    <img src={auction.imageUrl} alt={auction.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[12px] text-[#0b1f3a] truncate">{auction.title}</p>
                    <p className="text-[11px] text-[#6c757d]">{auction.category} · {auction.condition}</p>
                  </div>
                </div>

                {/* Bid details */}
                <div className="flex flex-col gap-3 mb-5">
                  {[
                    { label: 'Your bid amount', value: `PKR ${bidAmount.toLocaleString()}`, highlight: true },
                    { label: 'Current highest bid', value: `PKR ${auction.currentBid.toLocaleString()}` },
                    { label: 'Min increment', value: `PKR ${auction.minIncrement.toLocaleString()}` },
                    { label: 'Bidding as', value: user?.name ?? '—' },
                  ].map(d => (
                    <div key={d.label} className="flex items-center justify-between">
                      <span className="text-[13px] text-[#6c757d]">{d.label}</span>
                      <span className={`font-bold text-[13px] ${d.highlight ? 'text-[#d0021b]' : 'text-[#343a40]'}`}>{d.value}</span>
                    </div>
                  ))}
                </div>

                {/* Warning */}
                <div className="bg-[#fffbeb] border border-[#fde68a] rounded-[8px] px-3 py-2 mb-5">
                  <p className="text-[11.5px] text-[#d97706] font-medium leading-[18px]">
                    ⚠️ By confirming, you agree to purchase this item at this price if you win the auction.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => navigate(-1)} className="flex-1 border border-[#dee2e6] font-semibold text-[14px] text-[#495057] py-3 rounded-[8px] hover:bg-[#f8f9fa]">
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={loading}
                    className="flex-1 bg-[#d0021b] font-bold text-[14px] text-white py-3 rounded-[8px] hover:bg-[#a80016] transition-colors disabled:opacity-60"
                  >
                    {loading ? <span className="inline-block size-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Confirm Bid →'}
                  </button>
                </div>
              </>
            )}

            {!auction && (
              <div className="text-center py-4">
                <p className="text-[#6c757d] mb-3">Auction not found.</p>
                <Link to="/buyer/browse" className="font-bold text-[#d0021b]">Browse Auctions</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
