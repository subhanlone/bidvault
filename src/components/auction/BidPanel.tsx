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
import { ApiError } from '../../services/api';
import type { Auction, PublicBid, User } from '../../types/api';
import { conditionLabel, count, pkr } from '../../utils/format';

/** Why a bid was not sent, or was refused by the server; shown in a popup when Bid is pressed. */
type BidProblem =
  | { kind: 'empty' }
  | { kind: 'low'; amount: number }
  | { kind: 'high'; amount: number }
  | { kind: 'refused'; message: string };

// The server's ceiling for any stored amount (MAX_STORED_MONEY in the backend's auctions.routes.ts).
const MAX_STORED_MONEY = 2_000_000_000;

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
  // Digits only: the field drops anything else as it is typed or pasted, so a minus sign, a decimal
  // point or an exponent can never be entered.
  const [customBid, setCustomBid] = useState('');
  const [customBidTouched, setCustomBidTouched] = useState(false);
  const [pendingBidAmount, setPendingBidAmount] = useState<number | null>(null);
  // Whether the pending bid came from the custom amount (typed, or the minimum the popup offered),
  // so the field is cleared once that bid is placed and does not go on showing a stale amount.
  const [pendingFromCustom, setPendingFromCustom] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [problem, setProblem] = useState<BidProblem | null>(null);
  const customInputRef = useRef<HTMLInputElement>(null);
  const focusCustomOnClose = useRef(false);
  const confirmDialogRef = useDialog<HTMLDivElement>(pendingBidAmount !== null, () => setPendingBidAmount(null));
  const problemDialogRef = useDialog<HTMLDivElement>(problem !== null, () => setProblem(null));

  // "Change amount" puts the cursor back in the field. This effect is declared after useDialog's,
  // so it runs after that hook has restored focus to the Bid button, and wins.
  useEffect(() => {
    if (problem === null && focusCustomOnClose.current) {
      focusCustomOnClose.current = false;
      customInputRef.current?.focus();
    }
  }, [problem]);

  const isOwnAuction = user.userId === auction.sellerId;
  // The first bid is allowed at the starting price itself (as eBay does); the price only has to be
  // cleared by a full increment once a bid exists.
  const noBidsYet = auction.bidCount === 0;
  const minNext = noBidsYet ? auction.currentBid : auction.currentBid + auction.minIncrement;
  const myBids = bids.filter((b) => b.isMine);
  const isHighest = myBids.length > 0 && myBids[0].amount === auction.currentBid;
  const isOutbid = myBids.length > 0 && !isHighest;
  const quickAmounts = [minNext, minNext + auction.minIncrement, minNext + auction.minIncrement * 2];
  // The server's own ceiling, applied under its row lock (auctions.routes.ts), restated so an absurd
  // amount is explained before it is sent. The server still has the last word.
  const maxBid = Math.min(MAX_STORED_MONEY, Math.max(minNext, auction.currentBid * 10, auction.startPrice * 100));
  const customBidNum = customBid === '' ? 0 : Number(customBid);
  const customBidProblem: BidProblem | null =
    customBidNum <= 0 ? { kind: 'empty' }
      : customBidNum < minNext ? { kind: 'low', amount: customBidNum }
        : customBidNum > maxBid ? { kind: 'high', amount: customBidNum }
          : null;
  const showCustomBidError = customBidTouched && customBid !== '' && customBidProblem !== null;
  const customBidErrorMessage = customBidProblem?.kind === 'high'
    ? `Maximum bid is PKR ${maxBid.toLocaleString()}`
    : `Minimum bid is PKR ${minNext.toLocaleString()}`;

  const handleBid = (amount: number, fromCustom = false) => {
    if (amount < minNext) {
      setProblem({ kind: 'low', amount });
      return;
    }
    setPendingFromCustom(fromCustom);
    setPendingBidAmount(amount);
  };

  const changeAmount = () => {
    focusCustomOnClose.current = true;
    setProblem(null);
  };

  const bidTheMinimum = () => {
    setProblem(null);
    handleBid(minNext, true);
  };

  const handleConfirmBid = async () => {
    if (pendingBidAmount === null) return;
    setIsConfirming(true);
    try {
      await placeBid.mutateAsync({ auctionId: auction.auctionId, amount: pendingBidAmount });
      showToast({ type: 'success', title: 'Bid Placed!', message: `Your bid of PKR ${pendingBidAmount.toLocaleString()} was placed successfully.` });
      setPendingBidAmount(null);
      if (pendingFromCustom) {
        setCustomBid('');
        setCustomBidTouched(false);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        // The server refused the bid itself (a higher bid landed first, or bidding closed): say why
        // in the same popup as the checks above, in the server's own words.
        setPendingBidAmount(null);
        setProblem({ kind: 'refused', message: err.message });
      } else {
        showToast({ type: 'error', title: 'Bid Failed', message: err instanceof Error ? err.message : 'Could not place bid.' });
      }
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
          {auction.status === 'ACTIVE' && (
            <Link
              to={`/seller/auctions/${auction.auctionId}/live`}
              className="inline-block mt-2 font-bold text-[12.5px] text-primary hover:underline"
            >
              Open the live monitor
            </Link>
          )}
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
              setCustomBidTouched(true);
              if (customBidProblem) { setProblem(customBidProblem); return; }
              handleBid(customBidNum, true);
            }}
          >
            <label htmlFor="custom-bid-amount" className="font-bold text-[11px] text-muted uppercase tracking-[0.3px]">Custom amount (PKR)</label>
            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <Input
                  ref={customInputRef}
                  id="custom-bid-amount"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={10}
                  className="h-[44px]"
                  placeholder={`Min ${minNext.toLocaleString()}`}
                  value={customBid}
                  onChange={(e) => {
                    // Keep the digits only, and drop leading zeros so "007" reads as 7.
                    const digits = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
                    setCustomBid(digits);
                    if (!customBidTouched && digits !== '') setCustomBidTouched(true);
                  }}
                  onBlur={() => setCustomBidTouched(true)}
                  error={showCustomBidError ? customBidErrorMessage : undefined}
                />
              </div>
              <button
                type="submit"
                // Names the amount only when one is typed: with the box empty the button places no
                // bid (it asks for an amount), so it must not announce one, least of all the minimum.
                aria-label={customBidNum > 0 ? `Place bid of PKR ${customBidNum.toLocaleString()}` : 'Place custom bid'}
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

      {problem !== null && (
        <div className="fixed inset-0 bg-[rgba(11,31,58,0.45)] flex items-center justify-center p-4 z-50">
          <div
            ref={problemDialogRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="bid-problem-title"
            aria-describedby="bid-problem-text"
            tabIndex={-1}
            className="bg-surface rounded-lg shadow-[0px_20px_60px_rgba(11,31,58,0.2)] w-full max-w-[400px] overflow-hidden focus:outline-none"
          >
            <div className="flex items-center justify-between px-5 sm:px-6 pt-5 sm:pt-6 pb-0">
              <div className="bg-primary-surface flex items-center justify-center rounded-full size-[44px]">
                <AlertTriangle size={20} strokeWidth={2} className="text-primary" aria-hidden="true" />
              </div>
              <button
                onClick={() => setProblem(null)}
                aria-label="Close"
                className="bg-bg flex items-center justify-center rounded-full size-[32px] hover:bg-border-light transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
              >
                <X size={16} className="text-muted" aria-hidden="true" />
              </button>
            </div>

            <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-4">
              <h3 id="bid-problem-title" className="font-extrabold text-[18px] text-navy mb-1">
                {problem.kind === 'empty' ? 'Enter a bid amount'
                  : problem.kind === 'low' ? 'Bid too low'
                    : problem.kind === 'high' ? 'Bid too high'
                      : 'Bid not placed'}
              </h3>
              <p id="bid-problem-text" className="text-[13px] text-muted mb-5 leading-[20px]">
                {problem.kind === 'empty'
                  ? `Type how much you want to bid. The minimum for this auction is ${pkr(minNext)}.`
                  : problem.kind === 'low'
                    ? noBidsYet
                      ? 'Your amount is below the starting price. The first bid can be the starting price itself.'
                      : 'Your amount is below the minimum for this auction. A new bid must beat the current bid by at least the minimum increment.'
                    : problem.kind === 'high'
                      ? `You entered ${pkr(problem.amount)}, but this auction accepts bids up to ${pkr(maxBid)}. Check the amount for an extra zero.`
                      : problem.message}
              </p>

              {problem.kind === 'low' && (
                <div className="bg-bg rounded-md p-3 sm:p-4 mb-5 flex flex-col gap-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-muted">You entered</span>
                    <span className="font-bold text-[13px] text-error">{pkr(problem.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-muted">{noBidsYet ? 'Starting price' : 'Current bid'}</span>
                    <span className="font-bold text-[13px] text-secondary">{pkr(auction.currentBid)}</span>
                  </div>
                  {!noBidsYet && (
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-muted">Min increment</span>
                      <span className="font-bold text-[13px] text-secondary">+ {pkr(auction.minIncrement)}</span>
                    </div>
                  )}
                  <div className="h-px bg-border-medium" />
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[13px] text-navy">Minimum you can bid</span>
                    <span className="font-extrabold text-[14px] text-navy">{pkr(minNext)}</span>
                  </div>
                </div>
              )}

              {/* Side by side from sm up; stacked on a phone, the bid on top, so neither label wraps. */}
              <div className="flex flex-col-reverse sm:flex-row gap-3">
                {problem.kind === 'refused' ? (
                  <Button size="lg" className="sm:flex-1 rounded-sm" onClick={() => setProblem(null)}>
                    OK
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="lg" className="sm:flex-1 rounded-sm whitespace-nowrap" onClick={changeAmount}>
                      {problem.kind === 'empty' ? 'Enter amount' : 'Change amount'}
                    </Button>
                    {problem.kind !== 'high' && (
                      <Button size="lg" className="sm:flex-1 rounded-sm shadow-primary whitespace-nowrap" onClick={bidTheMinimum}>
                        Bid {pkr(minNext)}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
