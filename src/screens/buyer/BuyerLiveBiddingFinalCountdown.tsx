import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAuction } from '../../context/AuctionContext';
import { useTimer } from '../../hooks/useTimer';
import { Timer, Check, Flame } from 'lucide-react';
import { BuyerNavbar } from '../../components/ui';

const FINAL_COUNTDOWN_FALLBACK_END_TIME = new Date(Date.now() + 55_000).toISOString();

export default function BuyerLiveBiddingFinalCountdown() {
  const { auctionId } = useParams<{ auctionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { getAuction, bids, addCompetingBid } = useAuction();

  const id = auctionId ?? (location.state as { auctionId?: string })?.auctionId ?? '';
  const auction = getAuction(id);
  const timer = useTimer(auction?.endTime ?? FINAL_COUNTDOWN_FALLBACK_END_TIME);
  const wonRef = useRef(false);
  const competingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [flashTimer, setFlashTimer] = useState(false);
  const lastBidIdRef = useRef<string | null>(null);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!auction) return;
    competingRef.current = setInterval(() => {
      addCompetingBid(auction.auctionId);
    }, 15000);
    return () => { if (competingRef.current) clearInterval(competingRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auction?.auctionId]);

  useEffect(() => {
    if (!timer.isExpired || wonRef.current || !auction) return;
    wonRef.current = true;
    if (competingRef.current) clearInterval(competingRef.current);
    const auctionBids = bids[auction.auctionId] ?? [];
    const highestBid = auctionBids[0];
    const userWon = highestBid?.buyerId === user?.userId;
    navigate('/buyer/auction-won', {
      state: {
        auctionId: auction.auctionId,
        title: auction.title,
        emoji: auction.emoji,
        finalBid: auction.currentBid,
        won: userWon,
      },
    });
  }, [timer.isExpired, auction, bids, user, navigate]);

  const auctionBids = auction ? bids[auction.auctionId] ?? [] : [];
  const minNext = auction ? auction.currentBid + auction.minIncrement : 0;
  const isHighest = auction ? auctionBids[0]?.buyerId === user?.userId : false;
  const latestBidId = auctionBids[0]?.bidId;
  const isFinalMinute = timer.totalSeconds > 0 && timer.totalSeconds <= 60;

  useEffect(() => {
    if (!latestBidId) return;
    if (lastBidIdRef.current && latestBidId !== lastBidIdRef.current) {
      setFlashTimer(true);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = setTimeout(() => setFlashTimer(false), 700);
    }
    lastBidIdRef.current = latestBidId;
    return () => {
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
        flashTimeoutRef.current = null;
      }
    };
  }, [latestBidId]);

  const handleBid = () => {
    if (!auction) return;
    navigate('/buyer/confirm-bid', { state: { auctionId: auction.auctionId, bidAmount: minNext } });
  };

  if (!auction) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="font-bold text-[18px] text-secondary">Auction not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <BuyerNavbar userName={user?.name} onLogout={logout} />

      {/* Urgent banner */}
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
            <button
              onClick={handleBid}
              className="bg-surface font-bold text-[12px] sm:text-[13px] text-primary px-3 sm:px-5 py-2 rounded-sm hover:bg-bg ml-2 whitespace-nowrap transition-colors cursor-pointer"
            >
              Place Final Bid
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-[940px] mx-auto px-4 sm:px-6 py-5 sm:py-8 flex flex-col md:grid md:grid-cols-[1fr_300px] gap-5 sm:gap-6">

        {/* Bid panel — first on mobile */}
        <div className="flex flex-col gap-4 order-first md:order-last">
          <div className={`bg-primary rounded-md p-5 text-center transition-shadow ${isFinalMinute ? 'animate-countdown-pulse' : ''} ${flashTimer ? 'bg-primary-dark shadow-[0_0_0_12px_rgba(208,2,27,0.35)]' : ''}`}>
            <p className="font-bold text-[11px] text-[rgba(255,255,255,0.7)] uppercase tracking-[1px] mb-1 flex items-center justify-center gap-1">
              <Timer size={11} strokeWidth={2} /> Final Countdown
            </p>
            <p className="font-extrabold text-[48px] sm:text-[52px] text-white leading-none">{timer.display}</p>
          </div>

          <div className="bg-surface border border-border-light rounded-md p-5">
            <p className="text-[12px] text-muted mb-1">Current Bid</p>
            <p className="font-extrabold text-[26px] sm:text-[28px] text-primary leading-none mb-3">
              <span key={auction.currentBid} className="animate-price-bump inline-block">
                PKR {auction.currentBid.toLocaleString()}
              </span>
            </p>
            {isHighest && (
              <div className="mb-3 bg-success-bg border border-[rgba(26,122,74,0.3)] px-3 py-2 rounded-sm flex items-center gap-2">
                <div className="bg-[rgba(26,122,74,0.15)] border border-[rgba(26,122,74,0.3)] rounded-full p-[2px] shrink-0">
                  <Check size={10} color="#1a7a4a" strokeWidth={3} />
                </div>
                <p className="font-bold text-[12px] text-success-dark">You are the highest bidder!</p>
              </div>
            )}
            <button
              onClick={handleBid}
              className="w-full bg-primary font-bold text-[14px] text-white py-3 rounded-sm hover:bg-primary-dark transition-colors shadow-primary cursor-pointer"
            >
              Bid PKR {minNext.toLocaleString()} Now →
            </button>
          </div>
        </div>

        {/* Item + bids */}
        <div className="flex flex-col gap-5 order-last md:order-first">
          <div className="bg-surface border-2 border-primary rounded-md overflow-hidden">
            <div className="h-[200px] sm:h-[260px] overflow-hidden bg-navy relative">
              <img src={auction.imageUrl} alt={auction.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.4)] to-transparent" />
            </div>
            <div className="p-4 sm:p-5">
              <h2 className="font-extrabold text-[16px] sm:text-[18px] text-navy mb-1">{auction.title}</h2>
              <p className="text-[13px] text-muted">{auction.description}</p>
            </div>
          </div>

          <div className="bg-surface border border-border-light rounded-md p-4 sm:p-5">
            <h3 className="font-bold text-[14px] text-navy mb-4">Live Bid Feed</h3>
            <div className="flex flex-col gap-1">
              {auctionBids.slice(0, 5).map((b, i) => (
                <div key={b.bidId} className={`flex items-center justify-between py-3 ${i < Math.min(4, auctionBids.length - 1) ? 'border-b border-border-light' : ''}`}>
                  <span className="font-bold text-[12px] text-secondary">{b.buyerName === user?.name ? `${b.buyerName} (You)` : b.buyerName}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[13px] text-secondary">PKR {b.amount.toLocaleString()}</span>
                    {i === 0 && <span className="bg-primary text-white text-[10px] font-bold px-2 py-[1px] rounded-[99px]">Highest</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
