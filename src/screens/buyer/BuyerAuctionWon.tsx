import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Sparkles, Trophy, Frown, Package, Ban, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BuyerNavbar } from '../../components/ui';
import Button from '../../components/ui/Button';
import { api } from '../../services/api';
import { pkr } from '../../utils/format';

const POLL_MS = 2_000;
const TIMEOUT_MS = 60_000;
const SLOW_POLL_MS = 10_000;

interface WonState {
  auctionId: string;
  title: string;
  emoji: string;
  imageUrl?: string;
  finalBid: number;
  won: boolean;
  /** Set when this user bid highest but the seller's reserve was not reached, so nothing sold. */
  reserveNotMet?: boolean;
}

export default function BuyerAuctionWon() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const state = location.state as WonState | null;

  // BV-048: the client declares this win the instant its own countdown hits zero, but the
  // worker settles the auction independently and can be seconds (or, after a missed job and
  // the reconciliation sweep, minutes) behind. Navigating here is still good UX -- the reserve
  // outcome really is a settled fact once bidding has stopped -- but nothing backs "won" with
  // an AuctionTransaction until the worker actually runs. Poll for it rather than assume it.
  const won = state?.won ?? true;
  const auctionId = state?.auctionId;
  const [confirming, setConfirming] = useState(won);
  const [confirmTimedOut, setConfirmTimedOut] = useState(false);
  const elapsedRef = useRef(0);

  useEffect(() => {
    if (!won || !auctionId) return;
    let cancelled = false;
    elapsedRef.current = 0;

    async function poll() {
      try {
        const wins = await api.get('/payments/my-wins');
        if (cancelled) return;
        if (wins.some(w => w.auctionId === auctionId)) {
          setConfirming(false);
          return;
        }
      } catch {
        // A transient network error here just means "try again" -- the timeout below is the
        // real backstop, not this catch.
      }
      if (cancelled) return;
      elapsedRef.current += POLL_MS;
      // Caught live: the timeout is a UI signal ("this is slower than usual"), not a reason to
      // stop looking -- the reconciliation sweep can take several minutes to catch a job the
      // scheduler lost, and the transaction is still worth detecting whenever it actually
      // lands. Past the timeout this backs off to a slower interval rather than giving up.
      const timedOut = elapsedRef.current >= TIMEOUT_MS;
      if (timedOut) setConfirmTimedOut(true);
      setTimeout(poll, timedOut ? SLOW_POLL_MS : POLL_MS);
    }
    poll();
    return () => { cancelled = true; };
  }, [won, auctionId]);

  if (!state) {
    return <Navigate to="/buyer/browse" replace />;
  }

  const reserveNotMet = state.reserveNotMet ?? false;
  const title = state.title ?? 'Auction Item';
  const imageUrl = state.imageUrl;
  const finalBid = state.finalBid ?? 0;

  return (
    <div className="min-h-screen bg-bg">
      <BuyerNavbar userName={user?.name} onLogout={logout} />

      <main className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
        {won ? (
          <>
            <div className="flex justify-center mb-4">
              <Sparkles size={60} strokeWidth={1.2} className="text-gold" />
            </div>
            <div className="bg-success-bg border border-success-border flex items-center justify-center rounded-md size-[72px] sm:size-[80px] mb-5">
              <div className="bg-success-bg border border-success-border flex items-center justify-center rounded-full size-[48px] sm:size-[52px]">
                <Trophy size={24} strokeWidth={2} className="text-success" />
              </div>
            </div>
            <h1 className="font-extrabold text-[26px] sm:text-[32px] text-navy mb-2 flex items-center gap-2">
              You Won! <Trophy size={24} strokeWidth={1.8} className="text-gold" />
            </h1>
            <p className="text-[14px] sm:text-[15px] text-muted text-center max-w-[400px] mb-8">
              Congratulations! You've won the auction for <span className="font-bold text-secondary">{title}</span>
            </p>

            <div className="bg-surface border border-border-light rounded-lg p-5 sm:p-6 w-full max-w-[440px] mb-6">
              <div className="bg-navy h-[160px] sm:h-[180px] rounded-md flex items-center justify-center mb-5 overflow-hidden">
                {imageUrl
                  ? <img src={imageUrl} alt={title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  : <Package size={48} strokeWidth={1.3} className="text-white/40" />
                }
              </div>
              <h2 className="font-bold text-[15px] sm:text-[16px] text-navy mb-4">{title}</h2>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Winning bid', value: pkr(finalBid), highlight: true },
                  { label: 'Status', value: confirming ? 'Confirming…' : 'Auction Closed' },
                  { label: 'Next step', value: 'Complete payment in My Wins' },
                ].map(d => (
                  <div key={d.label} className="flex justify-between gap-4">
                    <span className="text-[13px] text-muted">{d.label}</span>
                    <span className={`font-bold text-[12px] sm:text-[13px] text-right ${d.highlight ? 'text-primary' : 'text-success-dark'}`}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-[440px]">
              {confirming && (
                <p className="flex items-center justify-center gap-2 text-[12px] text-muted mb-1">
                  <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                  Confirming your win — this takes a few seconds once bidding closes.
                </p>
              )}
              {confirming && confirmTimedOut && (
                <p className="text-[12px] text-warning text-center mb-1">
                  This is taking longer than usual. It will appear in My Wins once confirmed —
                  check back shortly, or reach out if it doesn't show up.
                </p>
              )}
              <Button
                className="w-full rounded-sm"
                loading={confirming && !confirmTimedOut}
                onClick={() => navigate('/buyer/my-wins')}
              >
                Complete Payment
              </Button>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-sm"
                  onClick={() => navigate('/buyer/my-bids')}
                >
                  View My Bids
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 rounded-sm"
                  onClick={() => navigate('/buyer/browse')}
                >
                  Browse More
                </Button>
              </div>
            </div>
          </>
        ) : reserveNotMet ? (
          <>
            {/* Highest bidder, but under the seller's floor. Saying "you didn't win" would be
                misleading — they did bid highest; the item simply was not sold to anyone. */}
            <div className="flex justify-center mb-6">
              <Ban size={60} strokeWidth={1.2} className="text-warning" />
            </div>
            <h1 className="font-extrabold text-[24px] sm:text-[28px] text-navy mb-2">Reserve Not Met</h1>
            <p className="text-[13px] sm:text-[14px] text-muted text-center max-w-[420px] mb-4">
              You were the highest bidder on <span className="font-bold text-secondary">{title}</span>, but the
              seller had set a reserve price that bidding didn't reach — so the item wasn't sold.
            </p>
            <p className="font-bold text-[16px] sm:text-[18px] text-warning mb-2">
              Your highest bid: {pkr(finalBid)}
            </p>
            <p className="text-[13px] text-muted text-center max-w-[380px] mb-8">
              <span className="font-bold text-secondary">No payment is due</span> and nothing has been charged.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" className="rounded-sm" onClick={() => navigate('/buyer/my-bids')}>
                View My Bids
              </Button>
              <Button className="rounded-sm" onClick={() => navigate('/buyer/browse')}>
                Find Another Auction
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-6">
              <Frown size={60} strokeWidth={1.2} className="text-placeholder" />
            </div>
            <h1 className="font-extrabold text-[24px] sm:text-[28px] text-navy mb-2">Auction Ended</h1>
            <p className="text-[13px] sm:text-[14px] text-muted text-center max-w-[380px] mb-4">
              The auction for <span className="font-bold text-secondary">{title}</span> has ended. You didn't win this time.
            </p>
            <p className="font-bold text-[16px] sm:text-[18px] text-warning mb-8">
              Final price: {pkr(finalBid)}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="rounded-sm"
                onClick={() => navigate('/buyer/my-bids')}
              >
                View My Bids
              </Button>
              <Button
                className="rounded-sm"
                onClick={() => navigate('/buyer/browse')}
              >
                Find Another Auction
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
