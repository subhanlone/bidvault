import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAuction } from '../../context/AuctionContext';
import { useToast } from '../../context/ToastContext';
import { useTimer } from '../../hooks/useTimer';
import { Search, Check, Zap, Star, Heart } from 'lucide-react';
import { BuyerNavbar } from '../../components/ui';

export default function BuyerLiveBidding() {
  const { auctionId } = useParams<{ auctionId: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { getAuction, bids, addCompetingBid } = useAuction();
  const { showToast } = useToast();

  const auction = getAuction(auctionId ?? '');
  const timer = useTimer(auction?.endTime ?? new Date(Date.now() + 3_600_000).toISOString());
  const competingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const redirectedRef = useRef(false);
  const [customBid, setCustomBid] = useState('');
  const { toggleWatchlist, isWatched } = useAuction();
  const watched = auction ? isWatched(auction.auctionId) : false;

  useEffect(() => {
    if (!auction) return;
    competingRef.current = setInterval(() => {
      addCompetingBid(auction.auctionId);
    }, 8000 + Math.random() * 7000);
    return () => { if (competingRef.current) clearInterval(competingRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auction?.auctionId]);

  useEffect(() => {
    if (redirectedRef.current || !auction) return;
    if (timer.totalSeconds > 0 && timer.totalSeconds <= 60) {
      redirectedRef.current = true;
      navigate(`/buyer/live-bidding/${auction.auctionId}/final-countdown`, { state: { auctionId: auction.auctionId } });
    }
  }, [timer.totalSeconds, auction, navigate]);

  if (!auction) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="text-center">
          <div className="bg-[#f1f3f5] rounded-full p-5 flex justify-center mb-4 w-fit mx-auto">
            <Search size={40} strokeWidth={1.3} className="text-[#adb5bd]" />
          </div>
          <p className="font-bold text-[18px] text-[#343a40]">Auction not found</p>
          <Link to="/buyer/browse" className="mt-4 inline-block font-bold text-[#d0021b] hover:underline">← Back to Browse</Link>
        </div>
      </div>
    );
  }

  const auctionBids = bids[auction.auctionId] ?? [];
  const minNext = auction.currentBid + auction.minIncrement;
  const myBids = auctionBids.filter(b => b.buyerId === user?.userId);
  const isHighest = myBids.length > 0 && myBids[0].amount === auction.currentBid;

  const handleBid = (amount: number) => {
    if (amount < minNext) {
      showToast({ type: 'error', title: 'Bid Too Low', message: `Minimum bid is PKR ${minNext.toLocaleString()}` });
      return;
    }
    navigate('/buyer/confirm-bid', { state: { auctionId: auction.auctionId, bidAmount: amount } });
  };

  const quickAmounts = [minNext, minNext + auction.minIncrement, minNext + auction.minIncrement * 2];

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <BuyerNavbar userName={user?.name} onLogout={logout} />

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col md:grid md:grid-cols-[1fr_320px] gap-5">

        {/* LEFT */}
        <div className="flex flex-col gap-4 order-1 md:order-1">

          {/* Item image */}
          <div className="bg-white border border-[#e9ecef] rounded-[14px] overflow-hidden">
            <div className="h-[220px] sm:h-[280px] md:h-[300px] relative overflow-hidden bg-[#0b1f3a]">
              <img
                src={auction.imageUrl}
                alt={auction.title}
                className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(11,31,58,0.3)] to-transparent" />
              <button
                onClick={() => auction && toggleWatchlist(auction.auctionId)}
                aria-label={watched ? 'Remove from watchlist' : 'Add to watchlist'}
                aria-pressed={watched}
                className={`absolute top-4 right-4 rounded-full size-[36px] flex items-center justify-center transition-all shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 ${watched ? 'bg-[#d0021b]' : 'bg-white hover:bg-[#fff0f2]'}`}
              >
                <Heart size={18} aria-hidden="true" className={watched ? 'text-white' : 'text-[#d0021b]'} fill={watched ? 'white' : 'none'} />
              </button>
            </div>
            <div className="flex gap-3 p-4">
              {(auction.images ?? [auction.imageUrl, auction.imageUrl, auction.imageUrl]).slice(0, 3).map((img, i) => (
                <div key={i} className={`rounded-[8px] size-[52px] overflow-hidden border-2 cursor-pointer transition-transform hover:scale-105 ${i === 0 ? 'border-[#d0021b]' : 'border-transparent hover:border-[#dee2e6]'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Item info */}
          <div className="bg-white border border-[#e9ecef] rounded-[14px] p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#f1f3f5] font-medium text-[11px] text-[#6c757d] px-2 py-[3px] rounded-[99px]">{auction.category}</span>
              <span className="bg-[#f1f3f5] font-medium text-[11px] text-[#6c757d] px-2 py-[3px] rounded-[99px]">{auction.condition}</span>
            </div>
            <h2 className="font-extrabold text-[18px] sm:text-[20px] text-[#0b1f3a] mb-3">{auction.title}</h2>

            {auction.specs && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {Object.entries(auction.specs).map(([k, v]) => (
                  <div key={k} className="bg-[#f8f9fa] rounded-[8px] px-3 py-2">
                    <p className="text-[10px] text-[#adb5bd] font-bold uppercase tracking-[0.4px]">{k}</p>
                    <p className="font-semibold text-[13px] text-[#343a40] mt-[2px]">{v}</p>
                  </div>
                ))}
              </div>
            )}

            <p className="text-[13px] text-[#6c757d] leading-[20px]">{auction.description}</p>

            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#e9ecef]">
              <div className="bg-[#0b1f3a] size-[36px] rounded-full flex items-center justify-center text-white font-bold text-[14px] shrink-0">
                {auction.sellerName[0]}
              </div>
              <div>
                <p className="font-bold text-[13px] text-[#343a40]">{auction.sellerName}</p>
                <div className="flex items-center gap-1 flex-wrap">
                  <Star size={12} fill="#f59e0b" className="text-[#f59e0b]" />
                  <span className="text-[11px] text-[#6c757d]">{auction.sellerRating} · {auction.sellerSales} sales</span>
                  {auction.sellerVerified && (
                    <span className="bg-[#f0faf4] text-[#1a7a4a] text-[10px] font-bold px-2 py-[1px] rounded-[99px] flex items-center gap-[3px]">
                      <Check size={9} strokeWidth={3} />Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bid history */}
          <div className="bg-white border border-[#e9ecef] rounded-[14px] p-4 sm:p-5">
            <h3 className="font-bold text-[14px] text-[#0b1f3a] mb-4">Bid History ({auctionBids.length})</h3>
            {auctionBids.length === 0 ? (
              <p className="text-[13px] text-[#6c757d] text-center py-6">No bids yet. Be the first!</p>
            ) : (
              <div className="flex flex-col gap-1">
                {auctionBids.slice(0, 8).map((b, i) => (
                  <div key={b.bidId} className={`flex items-center justify-between py-3 ${i < auctionBids.length - 1 ? 'border-b border-[#f1f3f5]' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="bg-[#f1f3f5] size-[32px] rounded-full flex items-center justify-center font-bold text-[12px] text-[#343a40] shrink-0">
                        {b.buyerName[0]}
                      </div>
                      <div>
                        <p className="font-bold text-[12px] text-[#343a40]">{b.buyerName === user?.name ? `${b.buyerName} (You)` : b.buyerName}</p>
                        <p className="text-[10px] text-[#adb5bd]">{new Date(b.timestamp).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[13px] text-[#343a40]">PKR {b.amount.toLocaleString()}</p>
                      {i === 0 && <span className="bg-[#d0021b] text-white text-[10px] font-bold px-2 py-[1px] rounded-[99px]">Highest</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Bidding panel */}
        <div className="flex flex-col gap-4 order-2 md:order-2">

          {/* Back link */}
          <Link to="/buyer/browse" className="font-semibold text-[13px] text-[#6c757d] hover:text-[#d0021b] transition-colors flex items-center gap-1">
            ← Back to Auctions
          </Link>

          {/* Timer */}
          <div className={`rounded-[14px] p-5 text-center ${timer.totalSeconds < 3600 ? 'bg-[#d0021b]' : 'bg-[#0b1f3a]'}`}>
            <p className="font-bold text-[11px] text-[rgba(255,255,255,0.6)] uppercase tracking-[1px] mb-1">Time Remaining</p>
            <p className="font-extrabold text-[36px] sm:text-[40px] text-white leading-none tracking-[-1px]">{timer.display}</p>
            {timer.totalSeconds < 3600 && (
              <p className="text-[12px] text-[rgba(255,255,255,0.75)] mt-2 flex items-center justify-center gap-1">
                <Zap size={12} strokeWidth={2.5} />Ending soon!
              </p>
            )}
          </div>

          {/* Current bid */}
          <div className="bg-white border border-[#e9ecef] rounded-[14px] p-5">
            <p className="text-[12px] text-[#6c757d] mb-1">Current Bid</p>
            <p className="font-extrabold text-[28px] text-[#d0021b] leading-none mb-1">PKR {auction.currentBid.toLocaleString()}</p>
            <p className="text-[11px] text-[#6c757d]">{auction.bidCount} bids · Min next: PKR {minNext.toLocaleString()}</p>
            {isHighest && (
              <div className="mt-3 bg-[#f0faf4] border border-[rgba(26,122,74,0.25)] px-3 py-2 rounded-[8px] flex items-center gap-2">
                <Check size={13} strokeWidth={2.5} className="text-[#1a7a4a] shrink-0" />
                <p className="font-bold text-[12px] text-[#1a7a4a]">You are the highest bidder</p>
              </div>
            )}
          </div>

          {/* Quick bids */}
          <div className="bg-white border border-[#e9ecef] rounded-[14px] p-5">
            <p className="font-bold text-[13px] text-[#0b1f3a] mb-3">Quick Bid</p>
            <div className="flex flex-col gap-2 mb-4">
              {quickAmounts.map((amt, i) => (
                <button
                  key={amt}
                  onClick={() => handleBid(amt)}
                  className={`w-full py-3 rounded-[8px] font-bold text-[14px] border-2 transition-all cursor-pointer ${i === 0 ? 'bg-[#d0021b] border-[#d0021b] text-white hover:bg-[#a80016] shadow-[0_4px_12px_rgba(208,2,27,0.25)]' : 'border-[#e9ecef] text-[#343a40] hover:border-[#d0021b] hover:text-[#d0021b] hover:bg-[#fff8f8]'}`}
                >
                  PKR {amt.toLocaleString()}
                  {i === 0 && <span className="ml-2 text-[10px] opacity-75">Min bid</span>}
                </button>
              ))}
            </div>

            <form className="flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); handleBid(Number(customBid)); }}>
              <label htmlFor="custom-bid-amount" className="font-bold text-[11px] text-[#6c757d] uppercase tracking-[0.3px]">Custom amount (PKR)</label>
              <div className="flex gap-2">
                <input
                  id="custom-bid-amount"
                  type="number"
                  inputMode="numeric"
                  className="flex-1 border border-[#dee2e6] h-[44px] px-3 rounded-[8px] text-[14px] text-[#343a40] outline-none focus:border-[#d0021b] focus:shadow-[0_0_0_3px_rgba(208,2,27,0.08)] focus-visible:ring-2 focus-visible:ring-[rgba(208,2,27,0.2)] transition-shadow"
                  placeholder={`Min ${minNext.toLocaleString()}`}
                  value={customBid}
                  onChange={e => setCustomBid(e.target.value)}
                />
                <button
                  type="submit"
                  className="bg-[#0b1f3a] font-bold text-[13px] text-white px-4 rounded-[8px] hover:bg-[#1a3356] active:scale-[0.97] transition-colors cursor-pointer"
                >
                  Bid
                </button>
              </div>
            </form>
          </div>

        </div>
      </main>
    </div>
  );
}
