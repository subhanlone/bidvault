import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronRight, Flag, Flame, Heart, Search } from 'lucide-react';
import { useAuth } from '../../context/auth';
import { useAuctionDetail, useBids, useWatchlistToggle } from '../../queries/auctions';
import { useTimer } from '../../hooks/useTimer';
import { useNow } from '../../hooks/useNow';
import { useAuctionRoom } from '../../hooks/useAuctionRoom';
import { useSignInLink } from '../../hooks/useSignInLink';
import { SiteNavbar, AuctionThumbnail, ErrorState } from '../../components/ui';
import BidHistory, { type Viewer } from '../../components/auction/BidHistory';
import MemberBidPanel, { GuestBidPanel, PendingBidPanel, TimerCard } from '../../components/auction/BidPanel';
import BuyingRules from '../../components/auction/BuyingRules';
import EndedView from '../../components/auction/EndedView';
import SellerCard from '../../components/auction/SellerCard';
import ReportDialog from '../../components/auction/ReportDialog';
import { ApiError } from '../../services/api';
import { getCategoryFields } from '../../config/categoryFields';
import { auctionOutcome } from '../../utils/auctionOutcome';
import { conditionLabel, count, timeLeft, weekdayTime } from '../../utils/format';

const FALLBACK_END_TIME = new Date(Date.now() + 3_600_000).toISOString();

/** How often a page whose clock has run out asks whether the server has closed the auction yet. */
const RESULT_POLL_MS = 5_000;

/**
 * One auction, for everyone. A visitor without an account sees the price, the bid count, the end
 * time, who is selling and the buying rules; the list of bids, bidding and watching ask for an
 * account. Once the auction is over the same address says what happened (sold, not sold, no bids,
 * cancelled).
 */
export default function AuctionPage() {
  const { auctionId } = useParams<{ auctionId: string }>();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const signIn = useSignInLink();
  const { toggle: toggleWatchlist, isWatched } = useWatchlistToggle();
  const now = useNow(30_000);
  const [reporting, setReporting] = useState(false);

  // Someone whose session is still being restored is neither a guest nor a member yet: they are
  // shown neither "Sign in to bid" nor a bid form, so a signed-in person never sees a sign-in prompt.
  const viewer: Viewer = user ? 'member' : isLoading ? 'pending' : 'guest';

  // Fetched, not looked up: GET /auctions/{id} answers for any status, so a closed auction opened
  // on a cold load is a page, not "Auction not found".
  const { data: auction, isPending, isError, error, isFetching, refetch } = useAuctionDetail(auctionId);
  const { data: bids = [] } = useBids(auctionId, viewer === 'member');
  const timer = useTimer(auction?.endTime ?? FALLBACK_END_TIME);

  // Socket subscription — re-subscribes automatically on reconnect. A guest's socket is told the
  // price and the count, a signed-in one the masked bid (see RealtimeBridge).
  useAuctionRoom(auctionId);

  const outcome = auction ? auctionOutcome(auction) : null;
  const expired = Boolean(auction) && outcome === 'live' && timer.isExpired;
  const isOwnAuction = Boolean(user && auction && user.userId === auction.sellerId);
  const hasBid = bids.some((b) => b.isMine);
  // A member who bid is taken to their result (win, reserve not met, or lost); everyone else stays
  // here and watches this page turn into the ended view.
  const goesToResult = expired && viewer === 'member' && hasBid && !isOwnAuction;

  const wentToResultRef = useRef(false);
  useEffect(() => {
    if (!goesToResult || wentToResultRef.current || !auction) return;
    wentToResultRef.current = true;
    navigate(`/buyer/auction-won/${auction.auctionId}`);
  }, [goesToResult, auction, navigate]);

  // The server closes an auction shortly after its end time (a worker), not at that instant. Until
  // it has, ask again; the answer replaces the live view with the ended one without leaving the page.
  const waitingForResult = expired && !goesToResult;
  useEffect(() => {
    if (!waitingForResult) return;
    void refetch();
    const id = setInterval(() => { void refetch(); }, RESULT_POLL_MS);
    return () => clearInterval(id);
  }, [waitingForResult, refetch]);

  // Loading skeleton
  if (isPending) {
    return (
      <div className="min-h-screen bg-bg">
        <SiteNavbar />
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

  // Could not load: only a 404 means "no such auction". With data already on screen a failed
  // background refetch changes nothing; the page keeps what it has.
  if (isError && !auction && !(error instanceof ApiError && error.status === 404)) {
    return (
      <div className="min-h-screen bg-bg">
        <SiteNavbar />
        <div className="max-w-[560px] mx-auto px-4 py-16">
          <ErrorState title="Could not load this auction" onRetry={() => { void refetch(); }} retrying={isFetching} />
        </div>
      </div>
    );
  }

  // Not found: the header stays, so a mistyped or stale link still has somewhere to go.
  if (!auction || !outcome) {
    return (
      <div className="min-h-screen bg-bg">
        <SiteNavbar />
        <main className="max-w-[480px] mx-auto px-4 py-16 text-center">
          <div className="bg-surface-raised rounded-full p-5 flex justify-center mb-4 w-fit mx-auto">
            <Search size={40} strokeWidth={1.3} className="text-placeholder" aria-hidden="true" />
          </div>
          <h1 className="font-extrabold text-[22px] text-navy mb-2">We couldn't find that auction</h1>
          <p className="text-[13px] text-muted mb-5">The link may be old or mistyped.</p>
          <Link
            to="/browse"
            className="inline-flex items-center justify-center rounded-sm px-5 py-2.5 font-bold text-[14px] bg-primary text-white hover:bg-primary-dark transition-colors no-underline"
          >
            Browse live auctions
          </Link>
        </main>
      </div>
    );
  }

  // Derived values
  const isLive = outcome === 'live';
  const watched = isWatched(auction.auctionId);
  const isFinalCountdown = isLive && timer.totalSeconds > 0 && timer.totalSeconds <= 60;
  const viewerWon = outcome === 'sold' && viewer === 'member' && bids[0]?.isMine === true && bids[0].amount === auction.currentBid;
  const specifics: { label: string; value: string }[] = [
    { label: 'Condition', value: conditionLabel(auction.condition) },
    { label: 'Category', value: auction.category },
    { label: 'Item number', value: auction.listingCode },
    ...getCategoryFields(auction.category).flatMap((field) => {
      const value = auction.attributes?.[field.key];
      return value === undefined || value === '' ? [] : [{ label: field.label, value: String(value) }];
    }),
  ];

  return (
    <div className="min-h-screen bg-bg">
      <SiteNavbar />

      {/* Final countdown banner (last 60 seconds) */}
      {isFinalCountdown && (
        <div className="bg-primary px-4 sm:px-8 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Flame size={16} className="text-white" aria-hidden="true" />
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

        {/* Left column */}
        <div className="flex flex-col gap-4 order-last md:order-first">

          <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-1 text-[12px] text-muted flex-wrap">
            <Link to="/browse" className="hover:text-primary hover:underline">Browse</Link>
            <ChevronRight size={12} aria-hidden="true" />
            <Link to={`/browse?category=${encodeURIComponent(auction.category)}`} className="hover:text-primary hover:underline">{auction.category}</Link>
            <ChevronRight size={12} aria-hidden="true" />
            <span aria-current="page" className="text-secondary font-semibold">{auction.title}</span>
          </nav>

          {/* Item image */}
          <div className="bg-surface border border-border-light rounded-md overflow-hidden">
            <div className="h-[220px] sm:h-[280px] md:h-[300px] relative overflow-hidden bg-navy">
              <AuctionThumbnail src={auction.imageUrl} alt={auction.title} iconSize={32} />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(11,31,58,0.3)] to-transparent" />
              {isLive && viewer === 'member' && (
                <button
                  onClick={() => toggleWatchlist(auction.auctionId)}
                  aria-label={watched ? 'Remove from watchlist' : 'Add to watchlist'}
                  aria-pressed={watched}
                  className={`absolute top-4 right-4 rounded-full size-[36px] flex items-center justify-center transition-all shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${watched ? 'bg-primary' : 'bg-surface hover:bg-primary-surface'}`}
                >
                  <Heart size={18} aria-hidden="true" className={watched ? 'text-white' : 'text-primary'} fill={watched ? 'white' : 'none'} />
                </button>
              )}
              {isLive && viewer === 'guest' && (
                <Link
                  {...signIn}
                  aria-label={`Sign in to watch ${auction.title}`}
                  className="absolute top-4 right-4 rounded-full size-[36px] flex items-center justify-center transition-all shadow-md bg-surface hover:bg-primary-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <Heart size={18} aria-hidden="true" className="text-primary" />
                </Link>
              )}
            </div>
            {/* Only render thumbnail strip if there are multiple images */}
            {(auction.images?.length ?? 0) > 1 && (
              <div className="flex gap-3 p-4">
                {auction.images.slice(0, 3).map((img, i) => (
                  <div key={i} className={`rounded-sm size-[52px] overflow-hidden border-2 transition-transform hover:scale-105 ${i === 0 ? 'border-primary' : 'border-transparent hover:border-border-medium'}`}>
                    <img src={img} alt={`${auction.title} thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Item info */}
          <div className="bg-surface border border-border-light rounded-md p-4 sm:p-5">
            <h1 className="font-extrabold text-[18px] sm:text-[20px] text-navy mb-1">{auction.title}</h1>
            {isLive && (
              <p className="text-[13px] font-semibold text-secondary mb-3">
                {count(auction.bidCount, 'bid')} · Ends in {timeLeft(auction.endTime, now)} · {weekdayTime(auction.endTime)}
              </p>
            )}
            <p className="text-[13px] text-muted leading-[20px]">{auction.description}</p>

            <h2 className="font-bold text-[12px] text-placeholder uppercase tracking-wide mt-4 pt-4 border-t border-border-light mb-3">Item specifics</h2>
            <dl className="grid grid-cols-2 gap-3 m-0">
              {specifics.map((row) => (
                <div key={row.label}>
                  <dt className="text-[10px] text-placeholder font-bold uppercase tracking-wide">{row.label}</dt>
                  <dd className="text-[13px] font-semibold text-secondary mt-0.5 m-0">{row.value}</dd>
                </div>
              ))}
            </dl>

            <SellerCard key={auction.auctionId} auction={auction} />

            {/* G5/F3: anyone with an account may report a listing, except its seller and an admin
                (who has the takedown control instead); a removed listing has nothing to report. */}
            {auction.status !== 'CANCELLED' && (viewer === 'guest' ? (
              <Link {...signIn} className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-muted hover:text-primary">
                <Flag size={13} aria-hidden="true" />Sign in to report this listing
              </Link>
            ) : viewer === 'member' && user && !isOwnAuction && user.role !== 'ADMIN' && (
              <button
                type="button"
                onClick={() => setReporting(true)}
                className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-muted hover:text-primary cursor-pointer"
              >
                <Flag size={13} aria-hidden="true" />Report this listing
              </button>
            ))}
          </div>

          <BuyingRules city={auction.sellerCity} province={auction.sellerProvince} />

          <BidHistory key={auction.auctionId} auctionId={auction.auctionId} bidCount={auction.bidCount} viewer={viewer} />
        </div>

        {/* Right column: the clock and the bid panel, or the result */}
        <div className="flex flex-col gap-4 order-first md:order-last">
          <Link to="/browse" className="font-semibold text-[13px] text-muted hover:text-primary transition-colors flex items-center gap-1">
            ← Back to Auctions
          </Link>

          {isLive ? (
            <>
              <TimerCard timer={timer} currentBid={auction.currentBid} />
              {viewer === 'member' && user ? (
                <MemberBidPanel auction={auction} user={user} bids={bids} isFinalCountdown={isFinalCountdown} />
              ) : viewer === 'guest' ? (
                <GuestBidPanel auction={auction} />
              ) : (
                <PendingBidPanel />
              )}
            </>
          ) : (
            <EndedView auction={auction} outcome={outcome} viewerWon={viewerWon} />
          )}
        </div>
      </main>

      {reporting && auction && (
        <ReportDialog auctionId={auction.auctionId} auctionTitle={auction.title} onClose={() => setReporting(false)} />
      )}
    </div>
  );
}
