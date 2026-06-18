import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAuction } from '../../context/AuctionContext';
import { useToast } from '../../context/ToastContext';
import { useTimer } from '../../hooks/useTimer';
import {
  Search, Check, Zap, Star, Heart,
  Timer, Flame, AlertTriangle, X, ChevronRight,
} from 'lucide-react';
import { BuyerNavbar } from '../../components/ui';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { getSocket } from '../../services/socket';
import { api } from '../../services/api';
import type { SellerReview } from '../../types';

const FALLBACK_END_TIME = new Date(Date.now() + 3_600_000).toISOString();

export default function BuyerLiveBidding() {
  const { auctionId } = useParams<{ auctionId: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { getAuction, bids, fetchBids, placeBid, toggleWatchlist, isWatched, auctionsLoaded } = useAuction();
  const { showToast } = useToast();

  const auction = getAuction(auctionId ?? '');
  const timer = useTimer(auction?.endTime ?? FALLBACK_END_TIME);

  const [customBid, setCustomBid]               = useState('');
  const [customBidTouched, setCustomBidTouched] = useState(false);
  const [pendingBidAmount, setPendingBidAmount] = useState<number | null>(null);
  const [isConfirming, setIsConfirming]         = useState(false);
  const [flashTimer, setFlashTimer]             = useState(false);
  const [visibleBidCount, setVisibleBidCount]   = useState(8);
  const [reviewsOpen, setReviewsOpen]           = useState(false);
  const [reviewsData, setReviewsData]           = useState<{ average: number | null; count: number; reviews: SellerReview[] } | null>(null);
  const [reviewsLoading, setReviewsLoading]     = useState(false);
  const [trackedAuctionId, setTrackedAuctionId] = useState(auctionId);
  if (auctionId !== trackedAuctionId) {
    setTrackedAuctionId(auctionId);
    setVisibleBidCount(8);
    setReviewsOpen(false);
    setReviewsData(null);
  }

  const wonRef         = useRef(false);
  const lastBidIdRef   = useRef<string | null>(null);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Socket subscription — re-subscribes automatically on reconnect
  useEffect(() => {
    if (!auctionId) return;
    void fetchBids(auctionId);
    const socket = getSocket();
    const subscribe = () => socket.emit('auction:subscribe', auctionId);
    subscribe();
    socket.on('connect', subscribe);
    return () => {
      socket.off('connect', subscribe);
      socket.emit('auction:unsubscribe', auctionId);
    };
  }, [auctionId, fetchBids]);

  const auctionBids = useMemo(() => auction ? (bids[auction.auctionId] ?? []) : [], [auction, bids]);
  const latestBidId = auctionBids[0]?.bidId;

  // Navigate to auction-won when timer expires
  useEffect(() => {
    if (!timer.isExpired || wonRef.current || !auction) return;
    wonRef.current = true;
    navigate('/buyer/auction-won', {
      state: {
        auctionId: auction.auctionId,
        title: auction.title,
        emoji: auction.emoji,
        imageUrl: auction.imageUrl,
        finalBid: auction.currentBid,
        won: auctionBids[0]?.buyerId === user?.userId,
      },
    });
  }, [timer.isExpired, auction, auctionBids, user, navigate]);

  // Flash the timer panel when a new bid arrives
  useEffect(() => {
    if (!latestBidId) return;
    if (lastBidIdRef.current && latestBidId !== lastBidIdRef.current) {
      setFlashTimer(true);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = setTimeout(() => setFlashTimer(false), 700);
    }
    lastBidIdRef.current = latestBidId;
    return () => { if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current); };
  }, [latestBidId]);

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (!auctionsLoaded) {
    return (
      <div className="min-h-screen bg-bg">
        <BuyerNavbar userName={user?.name} onLogout={logout} />
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6 grid md:grid-cols-[1fr_320px] gap-5">
          <div className="flex flex-col gap-4">
            <div className="h-[300px] bg-surface border border-border-light rounded-md animate-pulse" />
            <div className="h-[120px] bg-surface border border-border-light rounded-md animate-pulse" />
          </div>
          <div className="flex flex-col gap-4">
            <div className="h-[100px] bg-surface border border-border-light rounded-md animate-pulse" />
            <div className="h-[220px] bg-surface border border-border-light rounded-md animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // ── Not found (after data confirmed loaded) ──────────────────────────────────
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

  // ── Non-ACTIVE auction guard ─────────────────────────────────────────────────
  if (auction.status !== 'ACTIVE') {
    return (
      <div className="min-h-screen bg-bg">
        <BuyerNavbar userName={user?.name} onLogout={logout} />
        <div className="flex items-center justify-center min-h-[calc(100vh-56px)]">
          <div className="text-center">
            <p className="font-bold text-[18px] text-secondary mb-2">
              {auction.status === 'CLOSED' ? 'This auction has ended' : 'This auction has not started yet'}
            </p>
            <p className="text-[13px] text-muted mb-4">Current bid: PKR {auction.currentBid.toLocaleString()}</p>
            <Link to="/buyer/browse" className="font-bold text-primary hover:underline">← Browse Active Auctions</Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Derived values ───────────────────────────────────────────────────────────
  const watched          = isWatched(auction.auctionId);
  const isFinalCountdown = timer.totalSeconds > 0 && timer.totalSeconds <= 60;
  const minNext          = auction.currentBid + auction.minIncrement;
  const myBids           = auctionBids.filter(b => b.buyerId === user?.userId);
  const isHighest        = myBids.length > 0 && myBids[0].amount === auction.currentBid;
  const isOutbid         = myBids.length > 0 && !isHighest;
  const quickAmounts     = [minNext, minNext + auction.minIncrement, minNext + auction.minIncrement * 2];
  const showCustomBidError = customBidTouched && customBid.trim() !== '' && Number(customBid) < minNext;

  const handleBid = (amount: number) => {
    if (amount < minNext) {
      showToast({ type: 'error', title: 'Bid Too Low', message: `Minimum bid is PKR ${minNext.toLocaleString()}` });
      return;
    }
    setPendingBidAmount(amount);
  };

  const handleConfirmBid = async () => {
    if (pendingBidAmount === null || !auction || !user) return;
    setIsConfirming(true);
    const res = await placeBid(auction.auctionId, pendingBidAmount);
    setIsConfirming(false);
    if (res.success) {
      showToast({ type: 'success', title: 'Bid Placed!', message: `Your bid of PKR ${pendingBidAmount.toLocaleString()} was placed successfully.` });
      setPendingBidAmount(null);
    } else {
      showToast({ type: 'error', title: 'Bid Failed', message: res.error || 'Could not place bid.' });
    }
  };

  const toggleReviews = async () => {
    if (reviewsOpen) {
      setReviewsOpen(false);
      return;
    }
    setReviewsOpen(true);
    if (reviewsData) return;
    setReviewsLoading(true);
    try {
      const data = await api.get<{ sellerId: string; average: number | null; count: number; reviews: SellerReview[] }>(
        `/reviews/seller/${auction.sellerId}`,
      );
      setReviewsData(data);
    } catch {
      setReviewsData({ average: null, count: 0, reviews: [] });
    } finally {
      setReviewsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <BuyerNavbar userName={user?.name} onLogout={logout} />

      {/* ── Final countdown banner (slides in when ≤ 60s) ── */}
      {isFinalCountdown && (
        <div className="bg-primary px-4 sm:px-8 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Flame size={16} className="text-white" />
                <p className="font-bold text-[13px] text-white">ENDING VERY SOON</p>
              </div>
              <p className="text-[11px] text-[rgba(255,255,255,0.8)]">{auction.title}</p>
              <p className="text-[11px] text-[rgba(255,255,255,0.7)]">Hurry! Only seconds remain — place your final bid now</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {(['hours', 'minutes', 'seconds'] as const).map((unit, i) => {
                const val = unit === 'hours' ? timer.hours : unit === 'minutes' ? timer.minutes : timer.seconds;
                return (
                  <div key={unit} className="flex items-center gap-2 sm:gap-3">
                    {i > 0 && <span className="font-extrabold text-[28px] sm:text-[36px] text-white leading-none">:</span>}
                    <div className="text-center">
                      <span className="font-extrabold text-[32px] sm:text-[40px] text-white leading-none">{String(val).padStart(2, '0')}</span>
                      <p className="text-[9px] text-[rgba(255,255,255,0.7)] font-bold uppercase tracking-[0.5px]">{unit}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col md:grid md:grid-cols-[1fr_320px] gap-5">

        {/* ── LEFT column ─────────────────────────────────────────────────── */}
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
                onClick={() => toggleWatchlist(auction.auctionId)}
                aria-label={watched ? 'Remove from watchlist' : 'Add to watchlist'}
                aria-pressed={watched}
                className={`absolute top-4 right-4 rounded-full size-[36px] flex items-center justify-center transition-all shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${watched ? 'bg-primary' : 'bg-surface hover:bg-primary-surface'}`}
              >
                <Heart size={18} aria-hidden="true" className={watched ? 'text-white' : 'text-primary'} fill={watched ? 'white' : 'none'} />
              </button>
            </div>
            {/* Only render thumbnail strip if there are multiple images */}
            {(auction.images?.length ?? 0) > 1 && (
              <div className="flex gap-3 p-4">
                {auction.images!.slice(0, 3).map((img, i) => (
                  <div key={i} className={`rounded-sm size-[52px] overflow-hidden border-2 cursor-pointer transition-transform hover:scale-105 ${i === 0 ? 'border-primary' : 'border-transparent hover:border-border-medium'}`}>
                    <img src={img} alt={`${auction.title} thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
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
                    {auction.sellerRating ? `${auction.sellerRating} rating` : 'No ratings yet'} · {auction.sellerSales ? `${auction.sellerSales} sales` : 'No sales yet'}
                  </span>
                  <button
                    type="button"
                    onClick={toggleReviews}
                    className="text-[11px] font-bold text-primary hover:underline cursor-pointer ml-1"
                  >
                    {reviewsOpen ? 'Hide reviews' : 'See reviews'}
                  </button>
                </div>
              </div>
            </div>

            {reviewsOpen && (
              <div className="mt-3 pt-3 border-t border-border-light">
                {reviewsLoading ? (
                  <p className="text-[12px] text-muted">Loading reviews…</p>
                ) : !reviewsData || reviewsData.count === 0 ? (
                  <p className="text-[12px] text-muted">No reviews yet.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    <p className="text-[11px] font-bold text-placeholder uppercase tracking-wide">
                      {reviewsData.count} review{reviewsData.count !== 1 ? 's' : ''}
                    </p>
                    {reviewsData.reviews.map(r => (
                      <div key={r.reviewId} className="text-[12px]">
                        <div className="flex items-center gap-1 mb-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={11}
                              className={i < r.stars ? 'text-gold' : 'text-border-medium'}
                              fill={i < r.stars ? 'currentColor' : 'none'}
                            />
                          ))}
                          <span className="text-[10px] text-placeholder ml-1">
                            {new Date(r.createdAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        {r.comment && <p className="text-secondary">{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bid history */}
          <div className="bg-surface border border-border-light rounded-md p-4 sm:p-5">
            <h3 className="font-bold text-[14px] text-navy mb-4">Bid History ({auctionBids.length})</h3>
            {auctionBids.length === 0 ? (
              <p className="text-[13px] text-muted text-center py-6">No bids yet. Be the first!</p>
            ) : (
              <div className="flex flex-col gap-1">
                {auctionBids.slice(0, visibleBidCount).map((b, i) => (
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
            {auctionBids.length > visibleBidCount && (
              <button
                onClick={() => setVisibleBidCount(c => c + 8)}
                className="w-full mt-3 text-[12px] font-bold text-primary hover:underline cursor-pointer text-center"
              >
                Show more ({auctionBids.length - visibleBidCount} remaining)
              </button>
            )}
          </div>
        </div>

        {/* ── RIGHT column — bidding panel ─────────────────────────────────── */}
        <div className="flex flex-col gap-4 order-first md:order-last">

          <Link to="/buyer/browse" className="font-semibold text-[13px] text-muted hover:text-primary transition-colors flex items-center gap-1">
            ← Back to Auctions
          </Link>

          {/* Timer — pulses + flashes during final countdown */}
          <div className={`rounded-md p-5 text-center transition-all ${isFinalCountdown ? 'animate-countdown-pulse' : ''} ${flashTimer ? 'shadow-[0_0_0_12px_rgba(208,2,27,0.35)]' : ''} ${timer.totalSeconds < 3600 ? 'bg-primary' : 'bg-navy'}`}>
            <p className="font-bold text-[11px] text-[rgba(255,255,255,0.6)] uppercase tracking-[1px] mb-1 flex items-center justify-center gap-1">
              {isFinalCountdown ? <><Timer size={11} strokeWidth={2} /> Final Countdown</> : 'Time Remaining'}
            </p>
            <p className="font-extrabold text-[36px] sm:text-[40px] text-white leading-none tracking-[-1px]">{timer.display}</p>
            {timer.totalSeconds < 3600 && !isFinalCountdown && (
              <p className="text-[12px] text-[rgba(255,255,255,0.75)] mt-2 flex items-center justify-center gap-1">
                <Zap size={12} strokeWidth={2.5} />Ending soon!
              </p>
            )}
          </div>

          {/* Current bid + status banners */}
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
                <Button size="sm" variant="primary" onClick={() => handleBid(minNext)}>Bid Again</Button>
              </div>
            )}
          </div>

          {/* Quick bids + custom bid */}
          <div className="bg-surface border border-border-light rounded-md p-5">
            <p className="font-bold text-[13px] text-navy mb-3">
              {isFinalCountdown ? 'Place Final Bid' : 'Quick Bid'}
            </p>
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
              onSubmit={e => {
                e.preventDefault();
                if (Number(customBid) < minNext) { setCustomBidTouched(true); return; }
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
                    onChange={e => { setCustomBid(e.target.value); if (!customBidTouched && e.target.value.trim() !== '') setCustomBidTouched(true); }}
                    onBlur={() => setCustomBidTouched(true)}
                    error={showCustomBidError ? `Minimum bid is PKR ${minNext.toLocaleString()}` : undefined}
                  />
                </div>
                <button
                  type="submit"
                  aria-label={`Place bid of PKR ${Number(customBid) > 0 ? Number(customBid).toLocaleString() : minNext.toLocaleString()}`}
                  className="bg-navy font-bold text-[13px] text-white px-4 rounded-sm hover:bg-navy-mid active:scale-[0.97] transition-colors cursor-pointer h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                >
                  Bid
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* ── Confirm bid modal ─────────────────────────────────────────────────── */}
      {pendingBidAmount !== null && (
        <div className="fixed inset-0 bg-[rgba(11,31,58,0.45)] flex items-center justify-center p-4 z-50">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-bid-title"
            className="bg-surface rounded-lg shadow-[0px_20px_60px_rgba(11,31,58,0.2)] w-full max-w-[400px] overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 sm:px-6 pt-5 sm:pt-6 pb-0">
              <div className="bg-primary-surface flex items-center justify-center rounded-full size-[44px]">
                <AlertTriangle size={20} strokeWidth={2} className="text-primary" aria-hidden="true" />
              </div>
              <button
                onClick={() => setPendingBidAmount(null)}
                aria-label="Close"
                className="bg-bg flex items-center justify-center rounded-full size-[32px] hover:bg-border-light transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
              >
                <X size={16} className="text-muted" aria-hidden="true" />
              </button>
            </div>

            <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-4">
              <h3 id="confirm-bid-title" className="font-extrabold text-[18px] text-navy mb-1">Confirm Your Bid</h3>
              <p className="text-[13px] text-muted mb-5 leading-[20px]">
                Once confirmed, this is a binding commitment and cannot be cancelled if you become the highest bidder.
              </p>

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
                  { label: 'Your bid amount',    value: `PKR ${pendingBidAmount.toLocaleString()}`,       highlight: true  },
                  { label: 'Current highest bid', value: `PKR ${auction.currentBid.toLocaleString()}`,   highlight: false },
                  { label: 'Min increment',       value: `PKR ${auction.minIncrement.toLocaleString()}`, highlight: false },
                  { label: 'Bidding as',          value: user?.name ?? '—',                              highlight: false },
                ].map(d => (
                  <div key={d.label} className="flex items-center justify-between">
                    <span className="text-[13px] text-muted">{d.label}</span>
                    <span className={`font-bold text-[13px] ${d.highlight ? 'text-primary' : 'text-secondary'}`}>{d.value}</span>
                  </div>
                ))}
              </div>

              <div className="bg-warning-surface border border-warning-border rounded-sm px-3 py-[10px] mb-5">
                <p className="text-[11.5px] text-warning font-medium leading-[18px]">
                  By confirming, you agree to purchase this item at this price if you win the auction.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" size="lg" className="flex-1 rounded-sm" onClick={() => setPendingBidAmount(null)}>
                  Cancel
                </Button>
                <Button size="lg" className="flex-1 rounded-sm shadow-primary" loading={isConfirming} onClick={handleConfirmBid}>
                  Confirm Bid <ChevronRight size={15} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
