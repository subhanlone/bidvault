import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Ban, Check, ChevronRight, Timer, X, Zap } from 'lucide-react';
import { AuctionThumbnail } from '../ui';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useToast } from '../../context/toast';
import { useDialog } from '../../hooks/useDialog';
import { useRegisterLink, useSignInLink } from '../../hooks/useSignInLink';
import type { TimerState } from '../../hooks/useTimer';
import { usePlaceBid } from '../../queries/auctions';
import type { Auction, PublicBid, User } from '../../types/api';
import { conditionLabel, count, pkr } from '../../utils/format';

/** The countdown. It pulses in the last minute and flashes when the price moves. */
export function TimerCard({ timer, currentBid }: { timer: TimerState; currentBid: number }) {
  const isFinalCountdown = timer.totalSeconds > 0 && timer.totalSeconds <= 60;
  const [flash, setFlash] = useState(false);
  const lastBidRef = useRef(currentBid);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A new bid raises the price (the server never lets it fall), so a change in it is a new bid.
  useEffect(() => {
    if (lastBidRef.current !== currentBid) {
      setFlash(true);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = setTimeout(() => setFlash(false), 700);
    }
    lastBidRef.current = currentBid;
    return () => { if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current); };
  }, [currentBid]);

  return (
    <div className={`rounded-md p-5 text-center transition-all ${isFinalCountdown ? 'animate-countdown-pulse' : ''} ${flash ? 'shadow-[0_0_0_12px_rgba(208,2,27,0.35)]' : ''} ${timer.totalSeconds < 3600 ? 'bg-primary' : 'bg-navy'}`}>
      <p className="font-bold text-[11px] text-[rgba(255,255,255,0.6)] uppercase tracking-[1px] mb-1 flex items-center justify-center gap-1">
        {isFinalCountdown ? <><Timer size={11} strokeWidth={2} aria-hidden="true" /> Final Countdown</> : 'Time Remaining'}
      </p>
      <p className="font-extrabold text-[36px] sm:text-[40px] text-white leading-none tracking-[-1px]">{timer.display}</p>
      {timer.totalSeconds < 3600 && !isFinalCountdown && (
        <p className="text-[12px] text-[rgba(255,255,255,0.75)] mt-2 flex items-center justify-center gap-1">
          <Zap size={12} strokeWidth={2.5} aria-hidden="true" />Ending soon!
        </p>
      )}
    </div>
  );
}

/**
 * The price, the bid count and the watchers, plus what the viewer's own bids mean. A guest passes
 * none of the member props. Whether the reserve is met is shown, never the amount.
 */
function PriceCard({
  auction, minNext, isHighest = false, isOutbid = false, onBidAgain,
}: {
  auction: Auction;
  minNext?: number;
  isHighest?: boolean;
  isOutbid?: boolean;
  onBidAgain?: () => void;
}) {
  const noBidsYet = auction.bidCount === 0;
  return (
    <div className="bg-surface border border-border-light rounded-md p-5">
      <p className="text-[12px] text-muted mb-1">{noBidsYet ? 'Starting At' : 'Current Bid'}</p>
      <p className="font-extrabold text-[28px] text-primary leading-none mb-1">
        <span key={auction.currentBid} className="animate-price-bump inline-block">
          {pkr(auction.currentBid)}
        </span>
      </p>
      <p className="text-[11px] text-muted">
        {count(auction.bidCount, 'bid')}{minNext !== undefined && ` · Min ${noBidsYet ? 'bid' : 'next'}: ${pkr(minNext)}`}
      </p>
      {auction.watcherCount > 0 && (
        <p className="text-[11px] text-muted mt-0.5">{auction.watcherCount} watching</p>
      )}
      {/* Whether the reserve is met, never the amount — the figure itself stays private to the
          seller. Telling bidders the floor exists and has not been reached encourages them upward;
          telling them where it sits would just cap the bidding there. */}
      {auction.reserveMet === false && (
        <div className="mt-3 bg-warning-bg border border-warning-border px-3 py-2 rounded-sm flex items-center gap-2">
          <Ban size={13} strokeWidth={2.5} className="text-warning shrink-0" aria-hidden="true" />
          <p className="font-bold text-[12px] text-warning">
            Reserve not met — the seller has set a minimum this hasn't reached yet
          </p>
        </div>
      )}
      {auction.reserveMet === true && (
        <div className="mt-3 bg-success-bg border border-success-border px-3 py-2 rounded-sm flex items-center gap-2">
          <Check size={13} strokeWidth={2.5} className="text-success-dark shrink-0" aria-hidden="true" />
          <p className="font-bold text-[12px] text-success-dark">Reserve met — this item will sell</p>
        </div>
      )}
      {isHighest && (
        <div className="mt-3 bg-success-bg border border-success-border px-3 py-2 rounded-sm flex items-center gap-2">
          <Check size={13} strokeWidth={2.5} className="text-success-dark shrink-0" aria-hidden="true" />
          <p className="font-bold text-[12px] text-success-dark">You are the highest bidder</p>
        </div>
      )}
      {isOutbid && (
        <div className="mt-3 bg-warning-bg border border-warning-border px-3 py-2 rounded-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Zap size={13} strokeWidth={2.5} className="text-warning shrink-0" aria-hidden="true" />
            <p className="font-bold text-[12px] text-warning">You've been outbid</p>
          </div>
          {onBidAgain && <Button size="sm" variant="primary" onClick={onBidAgain}>Bid Again</Button>}
        </div>
      )}
    </div>
  );
}

/** What a visitor without an account sees instead of the bid form: the price, and a way in that brings them back. */
export function GuestBidPanel({ auction }: { auction: Auction }) {
  const signIn = useSignInLink();
  const register = useRegisterLink();
  return (
    <>
      <PriceCard auction={auction} />
      <div className="bg-surface border border-border-light rounded-md p-5 flex flex-col gap-3">
        <Link
          {...signIn}
          className="w-full py-3 rounded-sm font-bold text-[14px] text-center bg-primary text-white hover:bg-primary-dark transition-colors no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
        >
          Sign in to bid
        </Link>
        <Link
          {...signIn}
          className="w-full py-3 rounded-sm font-bold text-[14px] text-center border-2 border-border-light text-secondary hover:border-primary hover:text-primary transition-colors no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
        >
          Sign in to watch
        </Link>
        <p className="text-[12.5px] text-muted text-center leading-[19px]">
          No account yet?{' '}
          <Link {...register} className="font-bold text-primary hover:underline">Create one free</Link>. You come back to this item.
        </p>
      </div>
    </>
  );
}

/** Same footprint as the guest and member panels, shown while a returning visitor's session is restored. */
export function PendingBidPanel() {
  return (
    <>
      <div className="h-[100px] bg-surface border border-border-light rounded-md animate-pulse" />
      <div className="h-[140px] bg-surface border border-border-light rounded-md animate-pulse" />
    </>
  );
}

/**
 * The signed-in person's side: the price with what their bids mean, quick bids, a custom amount and
 * the confirmation. On their own auction a seller sees a notice instead, because the server refuses
 * a bid on your own item.
 */
export default function MemberBidPanel({
  auction, user, bids, isFinalCountdown,
}: {
  auction: Auction;
  user: User;
  bids: PublicBid[];
  isFinalCountdown: boolean;
}) {
  const placeBid = usePlaceBid();
  const { showToast } = useToast();
  const [customBid, setCustomBid] = useState('');
  const [customBidTouched, setCustomBidTouched] = useState(false);
  const [pendingBidAmount, setPendingBidAmount] = useState<number | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const confirmDialogRef = useDialog<HTMLDivElement>(pendingBidAmount !== null, () => setPendingBidAmount(null));

  const isOwnAuction = user.userId === auction.sellerId;
  // The first bid is allowed at the starting price itself (as eBay does); the price only has to be
  // cleared by a full increment once a bid exists.
  const noBidsYet = auction.bidCount === 0;
  const minNext = noBidsYet ? auction.currentBid : auction.currentBid + auction.minIncrement;
  const myBids = bids.filter((b) => b.isMine);
  const isHighest = myBids.length > 0 && myBids[0].amount === auction.currentBid;
  const isOutbid = myBids.length > 0 && !isHighest;
  const quickAmounts = [minNext, minNext + auction.minIncrement, minNext + auction.minIncrement * 2];
  const customBidNum = Number(customBid);
  const customBidIsInteger = customBid.trim() !== '' && Number.isInteger(customBidNum);
  const showCustomBidError = customBidTouched && customBid.trim() !== '' && (!customBidIsInteger || customBidNum < minNext);
  const customBidErrorMessage = customBid.trim() !== '' && !customBidIsInteger
    ? 'Bid amount must be a whole number'
    : `Minimum bid is PKR ${minNext.toLocaleString()}`;

  const handleBid = (amount: number) => {
    if (amount < minNext) {
      showToast({ type: 'error', title: 'Bid Too Low', message: `Minimum bid is PKR ${minNext.toLocaleString()}` });
      return;
    }
    setPendingBidAmount(amount);
  };

  const handleConfirmBid = async () => {
    if (pendingBidAmount === null) return;
    setIsConfirming(true);
    try {
      await placeBid.mutateAsync({ auctionId: auction.auctionId, amount: pendingBidAmount });
      showToast({ type: 'success', title: 'Bid Placed!', message: `Your bid of PKR ${pendingBidAmount.toLocaleString()} was placed successfully.` });
      setPendingBidAmount(null);
    } catch (err) {
      showToast({ type: 'error', title: 'Bid Failed', message: err instanceof Error ? err.message : 'Could not place bid.' });
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <>
      <PriceCard
        auction={auction}
        minNext={minNext}
        isHighest={isHighest}
        isOutbid={isOutbid}
        onBidAgain={() => handleBid(minNext)}
      />

      {isOwnAuction ? (
        <div className="bg-surface border border-border-light rounded-md p-5">
          <p className="font-bold text-[13px] text-navy mb-1">This is your auction</p>
          <p className="text-[12.5px] text-muted">
            You cannot bid on your own items.{' '}
            <Link to="/seller/items" className="font-bold text-primary hover:underline">Manage it in My Items</Link>
          </p>
        </div>
      ) : (
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
                {pkr(amt)}
                {i === 0 && <span className="ml-2 text-[10px] opacity-75">Min bid</span>}
              </button>
            ))}
          </div>

          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!customBidIsInteger || customBidNum < minNext) { setCustomBidTouched(true); return; }
              handleBid(customBidNum);
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
                  onChange={(e) => { setCustomBid(e.target.value); if (!customBidTouched && e.target.value.trim() !== '') setCustomBidTouched(true); }}
                  onBlur={() => setCustomBidTouched(true)}
                  error={showCustomBidError ? customBidErrorMessage : undefined}
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
      )}

      {pendingBidAmount !== null && (
        <div className="fixed inset-0 bg-[rgba(11,31,58,0.45)] flex items-center justify-center p-4 z-50">
          <div
            ref={confirmDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-bid-title"
            tabIndex={-1}
            className="bg-surface rounded-lg shadow-[0px_20px_60px_rgba(11,31,58,0.2)] w-full max-w-[400px] overflow-hidden focus:outline-none"
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
                  <AuctionThumbnail src={auction.imageUrl} alt={auction.title} iconSize={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[12px] text-navy truncate">{auction.title}</p>
                  <p className="text-[11px] text-muted">{auction.category} · {conditionLabel(auction.condition)}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 mb-5">
                {[
                  { label: 'Your bid amount', value: pkr(pendingBidAmount), highlight: true },
                  { label: noBidsYet ? 'Starting price' : 'Current highest bid', value: pkr(auction.currentBid), highlight: false },
                  { label: 'Min increment', value: pkr(auction.minIncrement), highlight: false },
                  { label: 'Bidding as', value: user.name || '—', highlight: false },
                ].map((d) => (
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
                  Confirm Bid <ChevronRight size={15} aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
