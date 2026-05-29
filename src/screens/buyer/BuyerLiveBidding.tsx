import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAuction } from '../../context/AuctionContext';
import { useToast } from '../../context/ToastContext';
import { useTimer } from '../../hooks/useTimer';
import { Search, Check, Zap, Star, Heart } from 'lucide-react';
import { BuyerNavbar } from '../../components/ui';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { getSocket } from '../../services/socket';

const FALLBACK_END_TIME = new Date(Date.now() + 3_600_000).toISOString();

export default function BuyerLiveBidding() {
  const { auctionId } = useParams<{ auctionId: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { getAuction, bids, fetchBids, toggleWatchlist, isWatched } = useAuction();
  const { showToast } = useToast();

  const auction = getAuction(auctionId ?? '');
  const timer = useTimer(auction?.endTime ?? FALLBACK_END_TIME);
  const redirectedRef = useRef(false);
  const [customBid, setCustomBid] = useState('');
  const [customBidTouched, setCustomBidTouched] = useState(false);
  const watched = auction ? isWatched(auction.auctionId) : false;

  useEffect(() => {
    if (!auctionId) return;
    void fetchBids(auctionId);
    const socket = getSocket();
    socket.emit('auction:subscribe', auctionId);
    return () => { socket.emit('auction:unsubscribe', auctionId); };
  }, [auctionId, fetchBids]);

  useEffect(() => {
    if (redirectedRef.current || !auction) return;
    if (timer.totalSeconds > 0 && timer.totalSeconds <= 60) {
      redirectedRef.current = true;
      navigate(`/buyer/live-bidding/${auction.auctionId}/final-countdown`, { state: { auctionId: auction.auctionId } });
    }
  }, [timer.totalSeconds, auction, navigate]);

  if (!auction) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="bg-surface-raised rounded-full p-5 flex justify-center mb-4 w-fit mx-auto">
            <Search size={40} strokeWidth={1.3} className="text-placeholder" />
          </div>
          <p className="font-bold text-[18px] text-secondary">Auction not found</p>
          <Link to="/buyer/browse" className="mt-4 inline-block font-bold text-primary hover:underline">← Back to Browse</Link>
        </div>
      </div>
    );
  }

  const auctionBids = bids[auction.auctionId] ?? [];
  const minNext = auction.currentBid + auction.minIncrement;
  const myBids = auctionBids.filter(b => b.buyerId === user?.userId);
  const isHighest = myBids.length > 0 && myBids[0].amount === auction.currentBid;
  const isOutbid = myBids.length > 0 && !isHighest;
  const showCustomBidError = customBidTouched && customBid.trim() !== '' && Number(customBid) < minNext;
  const effectiveBidAmount = Number(customBid) > 0 ? Number(customBid) : minNext;

  const handleBid = (amount: number) => {
    if (amount < minNext) {
      showToast({ type: 'error', title: 'Bid Too Low', message: `Minimum bid is PKR ${minNext.toLocaleString()}` });
      return;
    }
    navigate('/buyer/confirm-bid', { state: { auctionId: auction.auctionId, bidAmount: amount } });
  };

  const quickAmounts = [minNext, minNext + auction.minIncrement, minNext + auction.minIncrement * 2];

  return (
    <div className="min-h-screen bg-bg">
      <BuyerNavbar userName={user?.name} onLogout={logout} />

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col md:grid md:grid-cols-[1fr_320px] gap-5">

        {/* LEFT */}
        <div className="flex flex-col gap-4 order-last md:order-first">

          {/* Item image */}
          <div className="bg-surface border border-border-light rounded-md overflow-hidden">
            <div className="h-[220px] sm:h-[280px] md:h-[300px] relative overflow-hidden bg-navy">
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
                className={`absolute top-4 right-4 rounded-full size-[36px] flex items-center justify-center transition-all shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${watched ? 'bg-primary' : 'bg-surface hover:bg-primary-surface'}`}
              >
                <Heart size={18} aria-hidden="true" className={watched ? 'text-white' : 'text-primary'} fill={watched ? 'white' : 'none'} />
              </button>
            </div>
            <div className="flex gap-3 p-4">
              {(auction.images ?? [auction.imageUrl, auction.imageUrl, auction.imageUrl]).slice(0, 3).map((img, i) => (
                <div key={i} className={`rounded-sm size-[52px] overflow-hidden border-2 cursor-pointer transition-transform hover:scale-105 ${i === 0 ? 'border-primary' : 'border-transparent hover:border-border-medium'}`}>
                  <img src={img} alt={`${auction.title} thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Item info */}
          <div className="bg-surface border border-border-light rounded-md p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-surface-raised font-medium text-[11px] text-muted px-2 py-[3px] rounded-full">{auction.category}</span>
              <span className="bg-surface-raised font-medium text-[11px] text-muted px-2 py-[3px] rounded-full">{auction.condition}</span>
            </div>
            <h2 className="font-extrabold text-[18px] sm:text-[20px] text-navy mb-3">{auction.title}</h2>
            <p className="text-[13px] text-muted leading-[20px]">{auction.description}</p>

            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border-light">
              <div className="bg-navy size-[36px] rounded-full flex items-center justify-center text-white font-bold text-[14px] shrink-0">
                {auction.sellerName[0]}
              </div>
              <div>
                <p className="font-bold text-[13px] text-secondary">{auction.sellerName}</p>
                <div className="flex items-center gap-1 flex-wrap">
                  <Star size={12} fill="currentColor" className="text-gold" />
                  <span className="text-[11px] text-muted">
                    {auction.sellerRating !== null ? auction.sellerRating : 'N/A'} · {auction.sellerSales !== null ? `${auction.sellerSales} sales` : 'No sales yet'}
                  </span>
                  {auction.sellerVerified && (
                    <span className="bg-success-bg text-success-dark text-[10px] font-bold px-2 py-[1px] rounded-full flex items-center gap-[3px]">
                      <Check size={9} strokeWidth={3} />Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bid history */}
          <div className="bg-surface border border-border-light rounded-md p-4 sm:p-5">
            <h3 className="font-bold text-[14px] text-navy mb-4">Bid History ({auctionBids.length})</h3>
            {auctionBids.length === 0 ? (
              <p className="text-[13px] text-muted text-center py-6">No bids yet. Be the first!</p>
            ) : (
              <div className="flex flex-col gap-1">
                {auctionBids.slice(0, 8).map((b, i) => (
                  <div key={b.bidId} className={`flex items-center justify-between py-3 ${i < auctionBids.length - 1 ? 'border-b border-surface-raised' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="bg-surface-raised size-[32px] rounded-full flex items-center justify-center font-bold text-[12px] text-secondary shrink-0">
                        {b.buyerName[0]}
                      </div>
                      <div>
                        <p className="font-bold text-[12px] text-secondary">{b.buyerName === user?.name ? `${b.buyerName} (You)` : b.buyerName}</p>
                        <p className="text-[10px] text-placeholder">{new Date(b.timestamp).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[13px] text-secondary">PKR {b.amount.toLocaleString()}</p>
                      {i === 0 && (
                        <span className="bg-success-bg border border-success-border text-success-dark text-[10px] font-bold px-2 py-[1px] rounded-full">
                          Highest
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Bidding panel */}
        <div className="flex flex-col gap-4 order-first md:order-last">

          {/* Back link */}
          <Link to="/buyer/browse" className="font-semibold text-[13px] text-muted hover:text-primary transition-colors flex items-center gap-1">
            ← Back to Auctions
          </Link>

          {/* Timer */}
          <div className={`rounded-md p-5 text-center ${timer.totalSeconds < 3600 ? 'bg-primary' : 'bg-navy'}`}>
            <p className="font-bold text-[11px] text-[rgba(255,255,255,0.6)] uppercase tracking-[1px] mb-1">Time Remaining</p>
            <p className="font-extrabold text-[36px] sm:text-[40px] text-white leading-none tracking-[-1px]">{timer.display}</p>
            {timer.totalSeconds < 3600 && (
              <p className="text-[12px] text-[rgba(255,255,255,0.75)] mt-2 flex items-center justify-center gap-1">
                <Zap size={12} strokeWidth={2.5} />Ending soon!
              </p>
            )}
          </div>

          {/* Current bid */}
          <div className="bg-surface border border-border-light rounded-md p-5">
            <p className="text-[12px] text-muted mb-1">Current Bid</p>
            <p className="font-extrabold text-[28px] text-primary leading-none mb-1">
              <span key={auction.currentBid} className="animate-price-bump inline-block">
                PKR {auction.currentBid.toLocaleString()}
              </span>
            </p>
            <p className="text-[11px] text-muted">{auction.bidCount} bids · Min next: PKR {minNext.toLocaleString()}</p>
            {isHighest && (
              <div className="mt-3 bg-success-bg border border-success-border px-3 py-2 rounded-sm flex items-center gap-2">
                <Check size={13} strokeWidth={2.5} className="text-success-dark shrink-0" />
                <p className="font-bold text-[12px] text-success-dark">You are the highest bidder</p>
              </div>
            )}
            {isOutbid && (
              <div className="mt-3 bg-warning-bg border border-warning-border px-3 py-2 rounded-sm flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Zap size={13} strokeWidth={2.5} className="text-warning shrink-0" />
                  <p className="font-bold text-[12px] text-warning">You've been outbid</p>
                </div>
                <Button size="sm" variant="primary" onClick={() => handleBid(minNext)}>
                  Bid Again
                </Button>
              </div>
            )}
          </div>

          {/* Quick bids */}
          <div className="bg-surface border border-border-light rounded-md p-5">
            <p className="font-bold text-[13px] text-navy mb-3">Quick Bid</p>
            <div className="flex flex-col gap-2 mb-4">
              {quickAmounts.map((amt, i) => (
                <button
                  key={amt}
                  onClick={() => handleBid(amt)}
                  className={`w-full py-3 rounded-sm font-bold text-[14px] border-2 transition-colors active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${i === 0 ? 'bg-primary border-primary text-white hover:bg-primary-dark shadow-primary' : 'border-border-light text-secondary hover:border-primary hover:text-primary hover:bg-primary-surface'}`}
                >
                  PKR {amt.toLocaleString()}
                  {i === 0 && <span className="ml-2 text-[10px] opacity-75">Min bid</span>}
                </button>
              ))}
            </div>

            <form
              className="flex flex-col gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (Number(customBid) < minNext) {
                  setCustomBidTouched(true);
                  return;
                }
                handleBid(Number(customBid));
              }}
            >
              <label htmlFor="custom-bid-amount" className="font-bold text-[11px] text-muted uppercase tracking-[0.3px]">Custom amount (PKR)</label>
              <div className="flex gap-2 items-start">
                <div className="flex-1">
                  <Input
                    id="custom-bid-amount"
                    type="number"
                    inputMode="numeric"
                    className="h-[44px]"
                    placeholder={`Min ${minNext.toLocaleString()}`}
                    value={customBid}
                    onChange={e => {
                      setCustomBid(e.target.value);
                      if (!customBidTouched && e.target.value.trim() !== '') {
                        setCustomBidTouched(true);
                      }
                    }}
                    onBlur={() => setCustomBidTouched(true)}
                    error={showCustomBidError ? `Minimum bid is PKR ${minNext.toLocaleString()}` : undefined}
                  />
                </div>
                <button
                  type="submit"
                  aria-label={`Place bid of PKR ${effectiveBidAmount.toLocaleString()}`}
                  className="bg-navy font-bold text-[13px] text-white px-4 rounded-sm hover:bg-navy-mid active:scale-[0.97] transition-colors cursor-pointer h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
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
