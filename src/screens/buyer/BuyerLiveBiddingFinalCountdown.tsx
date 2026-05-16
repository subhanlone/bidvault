import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAuction } from '../../context/AuctionContext';
import { useTimer } from '../../hooks/useTimer';
import { Timer, Check, Menu, X, Search } from 'lucide-react';
import { IconBidVaultLogo, IconFire } from '../../components/Icons';

export default function BuyerLiveBiddingFinalCountdown() {
  const { auctionId } = useParams<{ auctionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { getAuction, bids, addCompetingBid } = useAuction();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const id = auctionId ?? (location.state as { auctionId?: string })?.auctionId ?? '';
  const auction = getAuction(id);
  const timer = useTimer(auction?.endTime ?? new Date(Date.now() + 55_000).toISOString());
  const wonRef = useRef(false);
  const competingRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  if (!auction) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <p className="font-bold text-[18px] text-[#343a40]">Auction not found</p>
      </div>
    );
  }

  const auctionBids = bids[auction.auctionId] ?? [];
  const minNext = auction.currentBid + auction.minIncrement;
  const isHighest = auctionBids[0]?.buyerId === user?.userId;

  const handleBid = () => {
    navigate('/buyer/confirm-bid', { state: { auctionId: auction.auctionId, bidAmount: minNext } });
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">

      {/* Nav */}
      <header className="bg-[#0b1f3a] sticky top-0 z-30 shadow-[0_2px_12px_rgba(0,0,0,0.18)]">
        <div className="flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-4 md:gap-8">
            <Link to="/buyer/browse" className="flex gap-[10px] items-center py-4">
              <div className="bg-[#d0021b] flex items-center justify-center rounded-[8px] size-[34px]">
                <IconBidVaultLogo className="size-[18px]" />
              </div>
              <span className="font-extrabold text-[20px] text-white tracking-[-0.3px]">
                Bid<span className="text-[#d0021b]">Vault</span>
              </span>
            </Link>
            <nav className="hidden md:flex">
              <Link to="/buyer/browse" className="font-semibold text-[13px] px-4 py-5 border-b-2 text-[rgba(255,255,255,0.55)] border-transparent hover:text-white">Browse Auctions</Link>
              <span className="font-semibold text-[13px] px-4 py-5 border-b-2 text-white border-[#d0021b]">Live Bidding</span>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button className="hidden md:flex bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.14)] rounded-[8px] p-2 transition-colors">
              <Search size={16} color="rgba(255,255,255,0.7)" />
            </button>
            <Link to="/buyer/profile" className="bg-[#d0021b] rounded-full size-[34px] flex items-center justify-center hover:bg-[#a80016] transition-colors">
              <span className="font-bold text-[13px] text-white">{user?.name?.[0] ?? 'B'}</span>
            </Link>
            <span className="hidden md:block font-semibold text-[13px] text-white">{user?.name?.split(' ')[0]}</span>
            <button
              className="md:hidden p-2 text-white"
              onClick={() => setMobileMenuOpen(o => !o)}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0d2444] border-t border-[rgba(255,255,255,0.08)] px-4 py-3 flex flex-col gap-1">
            <Link to="/buyer/browse" className="font-semibold text-[13px] text-[rgba(255,255,255,0.7)] py-2 px-3 rounded-[6px] hover:bg-[rgba(255,255,255,0.07)]" onClick={() => setMobileMenuOpen(false)}>Browse Auctions</Link>
            <span className="font-semibold text-[13px] text-white py-2 px-3 rounded-[6px] bg-[rgba(208,2,27,0.18)]">Live Bidding</span>
            <Link to="/buyer/profile" className="font-semibold text-[13px] text-[#d0021b] py-2 px-3 rounded-[6px]" onClick={() => setMobileMenuOpen(false)}>My Profile</Link>
            <div className="flex items-center justify-between pt-3 mt-1 border-t border-[rgba(255,255,255,0.08)]">
              <span className="font-semibold text-[13px] text-white">{user?.name?.split(' ')[0] ?? 'Buyer'}</span>
              <button onClick={logout} className="font-semibold text-[12px] text-[#d0021b]">Logout</button>
            </div>
          </div>
        )}
      </header>

      {/* Urgent banner */}
      <div className="bg-[#d0021b] px-4 sm:px-8 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <IconFire className="size-[16px]" />
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
              className="bg-white font-bold text-[12px] sm:text-[13px] text-[#d0021b] px-3 sm:px-5 py-2 rounded-[8px] hover:bg-[#f8f9fa] ml-2 whitespace-nowrap transition-colors"
            >
              Place Final Bid
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-[940px] mx-auto px-4 sm:px-6 py-5 sm:py-8 flex flex-col md:grid md:grid-cols-[1fr_300px] gap-5 sm:gap-6">

        {/* Bid panel — first on mobile */}
        <div className="flex flex-col gap-4 order-1 md:order-2">
          <div className="bg-[#d0021b] rounded-[12px] p-5 text-center">
            <p className="font-bold text-[11px] text-[rgba(255,255,255,0.7)] uppercase tracking-[1px] mb-1 flex items-center justify-center gap-1">
              <Timer size={11} strokeWidth={2} /> Final Countdown
            </p>
            <p className="font-extrabold text-[48px] sm:text-[52px] text-white leading-none">{timer.display}</p>
          </div>

          <div className="bg-white border border-[#e9ecef] rounded-[12px] p-5">
            <p className="text-[12px] text-[#6c757d] mb-1">Current Bid</p>
            <p className="font-extrabold text-[26px] sm:text-[28px] text-[#d0021b] leading-none mb-3">PKR {auction.currentBid.toLocaleString()}</p>
            {isHighest && (
              <div className="mb-3 bg-[#f0faf4] border border-[rgba(26,122,74,0.3)] px-3 py-2 rounded-[8px] flex items-center gap-2">
                <div className="bg-[rgba(26,122,74,0.15)] border border-[rgba(26,122,74,0.3)] rounded-full p-[2px] shrink-0">
                  <Check size={10} color="#1a7a4a" strokeWidth={3} />
                </div>
                <p className="font-bold text-[12px] text-[#1a7a4a]">You are the highest bidder!</p>
              </div>
            )}
            <button
              onClick={handleBid}
              className="w-full bg-[#d0021b] font-bold text-[14px] text-white py-3 rounded-[8px] hover:bg-[#a80016] transition-colors shadow-[0_4px_12px_rgba(208,2,27,0.25)]"
            >
              Bid PKR {minNext.toLocaleString()} Now →
            </button>
          </div>
        </div>

        {/* Item + bids — below bid panel on mobile */}
        <div className="flex flex-col gap-5 order-2 md:order-1">
          <div className="bg-white border-2 border-[#d0021b] rounded-[12px] overflow-hidden">
            <div className="h-[200px] sm:h-[260px] overflow-hidden bg-[#0b1f3a] relative">
              <img src={auction.imageUrl} alt={auction.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.4)] to-transparent" />
            </div>
            <div className="p-4 sm:p-5">
              <h2 className="font-extrabold text-[16px] sm:text-[18px] text-[#0b1f3a] mb-1">{auction.title}</h2>
              <p className="text-[13px] text-[#6c757d]">{auction.description}</p>
            </div>
          </div>

          <div className="bg-white border border-[#e9ecef] rounded-[12px] p-4 sm:p-5">
            <h3 className="font-bold text-[14px] text-[#0b1f3a] mb-4">Live Bid Feed</h3>
            <div className="flex flex-col gap-1">
              {auctionBids.slice(0, 5).map((b, i) => (
                <div key={b.bidId} className={`flex items-center justify-between py-3 ${i < Math.min(4, auctionBids.length - 1) ? 'border-b border-[#e9ecef]' : ''}`}>
                  <span className="font-bold text-[12px] text-[#343a40]">{b.buyerName === user?.name ? `${b.buyerName} (You)` : b.buyerName}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[13px] text-[#343a40]">PKR {b.amount.toLocaleString()}</span>
                    {i === 0 && <span className="bg-[#d0021b] text-white text-[10px] font-bold px-2 py-[1px] rounded-[99px]">Highest</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
