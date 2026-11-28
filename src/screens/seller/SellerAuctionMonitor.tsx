import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Search, X } from 'lucide-react';
import { useAuth } from '../../context/auth';
import { useToast } from '../../context/toast';
import { useAuctionDetail, useBids, useEndAuctionNow } from '../../queries/auctions';
import { useTimer } from '../../hooks/useTimer';
import { useAuctionRoom } from '../../hooks/useAuctionRoom';
import { useDialog } from '../../hooks/useDialog';
import { SellerNavbar, Button, ErrorState } from '../../components/ui';
import AuctionThumbnail from '../../components/ui/AuctionThumbnail';
import { ApiError } from '../../services/api';
import { conditionLabel, count, pkr, timeShort } from '../../utils/format';

const FALLBACK_END_TIME = new Date(Date.now() + 3_600_000).toISOString();

function EndNowDialog({ title, amount, winner, loading, error, onConfirm, onClose }: {
  title: string;
  amount: number;
  winner: string;
  loading: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const dialogRef = useDialog<HTMLDivElement>(true, onClose);
  return (
    <div className="fixed inset-0 bg-[rgba(11,31,58,0.45)] flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="end-now-title"
        tabIndex={-1}
        className="bg-surface rounded-lg shadow-[0px_20px_60px_rgba(11,31,58,0.2)] w-full max-w-[420px] p-5 sm:p-6 focus:outline-none"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="bg-primary-surface flex items-center justify-center rounded-full size-[44px]">
            <AlertTriangle size={20} strokeWidth={2} className="text-primary" aria-hidden="true" />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="bg-bg flex items-center justify-center rounded-full size-[32px] hover:bg-border-light transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X size={16} className="text-muted" aria-hidden="true" />
          </button>
        </div>
        <h2 id="end-now-title" className="font-extrabold text-[18px] text-navy mb-1">Conclude the auction now?</h2>
        <p className="text-[13px] text-muted mb-4 leading-[20px]">
          "{title}" is concluded at once and sold to the highest bidder, who then has to pay as after
          any auction. This cannot be undone.
        </p>
        <div className="bg-bg rounded-md p-3 sm:p-4 mb-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-muted">Sold to</span>
            <span className="font-bold text-[13px] text-secondary">{winner}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-muted">For</span>
            <span className="font-bold text-[13px] text-primary">{pkr(amount)}</span>
          </div>
        </div>
        {error && <p role="alert" className="text-[13px] text-error mb-4">{error}</p>}
        {/* Side by side from sm up; stacked on a phone, the sale on top, so neither label wraps. */}
        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <Button variant="outline" className="sm:flex-1 whitespace-nowrap" onClick={onClose}>Keep it running</Button>
          <Button variant="primary" className="sm:flex-1 whitespace-nowrap" loading={loading} onClick={onConfirm}>Conclude now and sell</Button>
        </div>
      </div>
    </div>
  );
}

/**
 * The seller's live view of their own auction: the clock, the price, whether the reserve is met,
 * the bids as they arrive (by name), and Conclude Now (the end-now route), which sells it to the
 * highest bidder at once.
 * Anyone but the auction's seller is shown "not found", the same as an unknown auction.
 */
export default function SellerAuctionMonitor() {
  const { auctionId } = useParams<{ auctionId: string }>();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const { data: auction, isPending, isError, error, isFetching, refetch } = useAuctionDetail(auctionId);
  const isOwn = Boolean(user && auction && user.userId === auction.sellerId);
  const { data: bids = [], isError: bidsFailed, refetch: refetchBids } = useBids(auctionId, isOwn);
  const timer = useTimer(auction?.endTime ?? FALLBACK_END_TIME);
  const endNow = useEndAuctionNow();
  const [confirming, setConfirming] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);

  useAuctionRoom(isOwn ? auctionId : undefined);

  const live = auction?.status === 'ACTIVE' && !timer.isExpired;
  const topBid = bids[0];

  // Whether the reserve is met after a new bid is refreshed for every page by the socket handlers
  // (refreshReserveIfUnmet in queries/auctions.ts).
  // The server's own rule, restated so the button is only offered when it can work.
  const canEndNow = live && (auction?.bidCount ?? 0) > 0 && auction?.reserveMet !== false && Boolean(topBid);

  function openConfirm() {
    setEndError(null);
    setConfirming(true);
  }

  function confirmEndNow() {
    if (!auction) return;
    endNow.mutate(
      { auctionId: auction.auctionId, expectedBid: auction.currentBid },
      {
        onSuccess: () => {
          setConfirming(false);
          showToast({ type: 'success', title: 'Auction concluded', message: `"${auction.title}" has been sold to the highest bidder.` });
        },
        onError: (err) => {
          setEndError(err instanceof ApiError ? err.message : 'Could not end the auction. Please try again.');
        },
      },
    );
  }

  const notFound = !isPending && ((isError && error instanceof ApiError && error.status === 404) || (auction && !isOwn));

  return (
    <div className="min-h-screen bg-bg">
      <SellerNavbar userName={user?.name} onLogout={logout} />
      <main className="max-w-[760px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="font-extrabold text-[20px] sm:text-[22px] text-navy">Live Monitor</h1>
            <p className="text-[12px] text-muted">Your auction, as it happens</p>
          </div>
          <Link to="/seller/items?tab=live" className="font-semibold text-[13px] text-primary hover:underline">← My Items</Link>
        </div>

        {isPending ? (
          <div className="flex flex-col gap-4">
            <div className="h-[100px] bg-surface border border-border-light rounded-md animate-pulse" />
            <div className="h-[220px] bg-surface border border-border-light rounded-md animate-pulse" />
          </div>
        ) : notFound || !auction ? (
          isError && !(error instanceof ApiError && error.status === 404) && !auction ? (
            <ErrorState title="Could not load this auction" onRetry={() => { void refetch(); }} retrying={isFetching} />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <Search size={40} strokeWidth={1.3} className="text-placeholder" />
              <p className="font-bold text-[16px] text-secondary">Auction not found</p>
            </div>
          )
        ) : (
          <div className="flex flex-col gap-4">
            {/* What it is */}
            <div className="bg-surface border border-border-light rounded-md p-4 sm:p-5 flex items-center gap-4">
              <div className="bg-navy rounded-md size-[64px] overflow-hidden shrink-0">
                <AuctionThumbnail src={auction.imageUrl} alt={auction.title} iconSize={22} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-[16px] text-navy truncate">{auction.title}</h2>
                <p className="text-[12px] text-muted">{auction.category} · {conditionLabel(auction.condition)}</p>
                <Link to={`/auctions/${auction.auctionId}`} className="text-[12px] font-semibold text-primary hover:underline">
                  Open the auction page
                </Link>
              </div>
            </div>

            {/* Clock, price, reserve */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={`rounded-md p-5 text-center ${live && timer.totalSeconds < 3600 ? 'bg-primary' : 'bg-navy'}`}>
                <p className="font-bold text-[11px] text-[rgba(255,255,255,0.6)] uppercase tracking-[1px] mb-1">Time Remaining</p>
                <p className="font-extrabold text-[28px] text-white leading-none">
                  {auction.status === 'CANCELLED' ? 'Cancelled' : live ? timer.display : 'Ended'}
                </p>
              </div>
              <div className="bg-surface border border-border-light rounded-md p-5">
                <p className="text-[12px] text-muted mb-1">Current Bid</p>
                <p className="font-extrabold text-[24px] text-primary leading-none mb-1">{pkr(auction.currentBid)}</p>
                <p className="text-[11px] text-muted">
                  {count(auction.bidCount, 'bid')} · {count(auction.watcherCount, 'watcher')}
                </p>
                <p className="text-[12px] mt-2 font-semibold text-secondary">
                  {auction.reserveMet === null
                    ? 'No reserve price'
                    : auction.reserveMet
                      ? <span className="text-success-dark">Reserve met</span>
                      : <span className="text-muted">Reserve not met yet</span>}
                </p>
              </div>
            </div>

            {/* Conclude Now, or why not */}
            {live ? (
              <div className="bg-surface border border-border-light rounded-md p-4 sm:p-5">
                {canEndNow && topBid ? (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                    <p className="text-[13px] text-muted">
                      Happy with <span className="font-bold text-secondary">{pkr(auction.currentBid)}</span> from{' '}
                      <span className="font-bold text-secondary">{topBid.buyerName}</span>? Conclude the auction now and sell it.
                    </p>
                    <Button variant="primary" onClick={openConfirm} className="shrink-0">Conclude now and sell</Button>
                  </div>
                ) : (
                  <p className="text-[13px] text-muted">
                    {auction.bidCount === 0
                      ? 'No bids yet. An auction can be concluded early once it has a bid; to stop it now, cancel it from My Items.'
                      : 'The reserve price has not been met, so the auction cannot be concluded early yet.'}
                  </p>
                )}
              </div>
            ) : auction.status === 'CLOSED' ? (
              <div className="bg-success-bg border border-success-border rounded-md p-4 sm:p-5 flex items-start gap-3">
                <CheckCircle2 size={20} className="text-success-dark shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-[13px] text-secondary">
                  {auction.reserveMet === false || auction.bidCount === 0 || !topBid
                    ? 'This auction has ended without a sale.'
                    : <>This auction has ended. Sold to <span className="font-bold">{topBid.buyerName}</span> for <span className="font-bold">{pkr(auction.currentBid)}</span>. Follow the sale in <Link to="/seller/items?tab=sold" className="font-semibold text-primary hover:underline">My Items</Link>.</>}
                </p>
              </div>
            ) : null}

            {/* Bids as they arrive */}
            <div className="bg-surface border border-border-light rounded-md p-4 sm:p-5">
              <h3 className="font-bold text-[14px] text-navy mb-4">
                Bid History{!(bidsFailed && bids.length === 0) && ` (${bids.length})`}
              </h3>
              {bidsFailed && bids.length === 0 ? (
                <p className="text-[13px] text-error text-center py-6">
                  Could not load the bid history.{' '}
                  <button type="button" onClick={() => { void refetchBids(); }} className="font-bold underline cursor-pointer">Try again</button>
                </p>
              ) : bids.length === 0 ? (
                <p className="text-[13px] text-muted text-center py-6">No bids yet.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {bids.map((b, i) => (
                    <li key={b.bidId} className={`flex items-center justify-between py-3 ${i < bids.length - 1 ? 'border-b border-surface-raised' : ''}`}>
                      <div>
                        <p className="font-bold text-[12px] text-secondary">{b.buyerName}</p>
                        <p className="text-[10px] text-placeholder">{timeShort(b.timestamp)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[13px] text-secondary">{pkr(b.amount)}</p>
                        {i === 0 && (
                          <span className="bg-success-bg border border-success-border text-success-dark text-[10px] font-bold px-2 py-[1px] rounded-full">
                            Highest
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </main>

      {confirming && auction && topBid && (
        <EndNowDialog
          title={auction.title}
          amount={auction.currentBid}
          winner={topBid.buyerName}
          loading={endNow.isPending}
          error={endError}
          onConfirm={confirmEndNow}
          onClose={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
