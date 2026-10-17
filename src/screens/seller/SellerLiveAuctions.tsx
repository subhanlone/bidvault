import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Eye, Radio, History, Ban } from 'lucide-react';
import { useAuth } from '../../context/auth';
import { SellerNavbar, Badge, ErrorState } from '../../components/ui';
import LoadingStatus from '../../components/ui/LoadingStatus';
import { useBids, useDrainedPages, useMyAuctions, type MyAuctionStatus } from '../../queries/auctions';
import { useTimer } from '../../hooks/useTimer';
import type { Auction } from '../../types/api';
import { conditionLabel, count, dateMedium, dateTimeShort, pkr } from '../../utils/format';

const TABS: { key: MyAuctionStatus; label: string; icon: React.ReactNode }[] = [
  { key: 'ACTIVE',    label: 'Live',      icon: <Radio size={12} /> },
  { key: 'CLOSED',    label: 'Ended',     icon: <History size={12} /> },
  { key: 'CANCELLED', label: 'Cancelled', icon: <Ban size={12} /> },
];

const EMPTY: Record<MyAuctionStatus, { heading: string; sub: string }> = {
  ACTIVE:    { heading: 'No live auctions', sub: 'Once an admin approves a listing its auction goes live here.' },
  CLOSED:    { heading: 'No ended auctions', sub: 'Auctions that have finished appear here with their final price.' },
  CANCELLED: { heading: 'No cancelled auctions', sub: 'Auctions that were cancelled appear here.' },
};

/** Whether the hidden reserve has been reached, never the amount (the seller sees that on the listing). */
function ReserveBadge({ reserveMet }: { reserveMet: boolean | null }) {
  if (reserveMet === null) return <span className="text-[11px] text-placeholder">No reserve</span>;
  return reserveMet
    ? <Badge variant="success" className="whitespace-nowrap">Reserve met</Badge>
    : <Badge variant="warning" className="whitespace-nowrap">Reserve not met</Badge>;
}

/** The newest bids, masked exactly as every other viewer sees them ("Bidder 3"). */
function BidHistory({ auctionId }: { auctionId: string }) {
  const { data: bids, isPending, isError, refetch } = useBids(auctionId);

  if (isPending) return <p className="text-[12px] text-muted px-5 py-3">Loading bids…</p>;
  if (isError) {
    return (
      <p className="text-[12px] text-error px-5 py-3">
        Could not load the bids.{' '}
        <button type="button" onClick={() => void refetch()} className="font-bold underline cursor-pointer">Try again</button>
      </p>
    );
  }
  if (bids.length === 0) return <p className="text-[12px] text-muted px-5 py-3">No bids yet.</p>;

  return (
    <ul className="px-5 py-3 space-y-1.5 list-none m-0">
      {bids.slice(0, 8).map((bid) => (
        <li key={bid.bidId} className="flex items-center justify-between text-[12px]">
          <span className="text-tertiary">{bid.buyerName}</span>
          <span className="font-bold text-secondary">{pkr(bid.amount)}</span>
          <span className="text-placeholder">{dateTimeShort(bid.timestamp)}</span>
        </li>
      ))}
    </ul>
  );
}

function AuctionRow({ auction, live }: { auction: Auction; live: boolean }) {
  const timer = useTimer(auction.endTime);
  const [open, setOpen] = useState(false);
  const urgent = live && timer.totalSeconds < 3600 && !timer.isExpired;
  const timeLabel = live ? (timer.isExpired ? 'Ending…' : timer.display) : dateMedium(auction.endTime);

  return (
    <div className="border-b border-bg last:border-0">
      <div className="px-4 sm:px-5 py-4 grid grid-cols-[44px_1fr] sm:grid-cols-[44px_1fr_120px_60px_80px_100px_150px] gap-x-4 gap-y-2 items-center hover:bg-bg transition-colors">
        <div className="bg-bg rounded-sm size-[36px] overflow-hidden shrink-0 flex items-center justify-center border border-border-light">
          {auction.imageUrl
            ? <img src={auction.imageUrl} alt={auction.title} className="w-full h-full object-cover" />
            : <span className="text-[16px]">{auction.emoji}</span>}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-[13px] text-secondary truncate">{auction.title}</p>
          <p className="text-[10px] text-placeholder">{auction.category} · {conditionLabel(auction.condition)}</p>
        </div>

        <p className="font-bold text-[13px] text-primary col-start-2 sm:col-start-auto" aria-label="Current bid">
          {pkr(auction.currentBid)}
        </p>
        <p className="font-semibold text-[12px] text-tertiary col-start-2 sm:col-start-auto" aria-label="Bids">
          <span className="sm:hidden">{count(auction.bidCount, 'bid')}</span>
          <span className="hidden sm:inline">{auction.bidCount}</span>
        </p>
        <p className="flex items-center gap-1 text-[12px] text-tertiary col-start-2 sm:col-start-auto" aria-label="Watching">
          <Eye size={12} className="text-placeholder" aria-hidden="true" />
          {auction.watcherCount}
          <span className="sm:hidden">watching</span>
        </p>
        <p className={`font-bold text-[13px] col-start-2 sm:col-start-auto ${urgent ? 'text-primary' : 'text-secondary'}`}>
          {timeLabel}
        </p>
        <div className="col-start-2 sm:col-start-auto flex items-center justify-between gap-2">
          <ReserveBadge reserveMet={auction.reserveMet} />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? 'Hide bid history' : 'Show bid history'}
            className="p-1 rounded-sm text-muted hover:bg-border-light cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="bg-bg border-t border-border-light">
          <BidHistory auctionId={auction.auctionId} />
        </div>
      )}
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="px-5 py-4 flex items-center gap-4 border-b border-bg last:border-0">
      <div className="w-9 h-9 bg-border-light rounded-md animate-pulse" />
      <div className="flex-1">
        <div className="h-4 w-1/2 bg-border-light rounded-md animate-pulse mb-1.5" />
        <div className="h-3 w-1/4 bg-border-light rounded-md animate-pulse" />
      </div>
      <div className="h-4 w-20 bg-border-light rounded-md animate-pulse" />
    </div>
  );
}

/**
 * B6, Phase 8: the seller's own view of their auctions: live numbers, who is watching, the reserve
 * verdict and the (masked) bid history, so a seller no longer has to open a buyer screen to see how
 * their item is doing. The data is GET /auctions/mine.
 */
export default function SellerLiveAuctions() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<MyAuctionStatus>('ACTIVE');
  const query = useMyAuctions(tab);
  const auctions = useDrainedPages(query);
  const live = tab === 'ACTIVE';

  return (
    <div className="min-h-screen bg-bg">
      <SellerNavbar userName={user?.name} onLogout={logout} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-xl font-extrabold text-navy">My Live Auctions</h1>
          <p className="text-sm text-muted mt-0.5">
            {query.isPending
              ? 'Loading…'
              : query.isError
                ? 'Could not load your auctions'
                : `${count(auctions.length, 'auction')} · ${TABS.find((t) => t.key === tab)!.label.toLowerCase()}`}
          </p>
        </div>

        <div className="flex items-center gap-1 mb-4 border-b border-border-light overflow-x-auto" role="tablist">
          {TABS.map(({ key, label, icon }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer focus-visible:outline-none
                ${tab === key ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-secondary'}`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {query.isError ? (
          <ErrorState title="Could not load your auctions" onRetry={() => void query.refetch()} />
        ) : (
          <div className="bg-surface border border-border-light rounded-md overflow-hidden">
            {query.isPending ? (
              <div>
                <LoadingStatus label="Loading your auctions" />
                {Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)}
              </div>
            ) : auctions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <h3 className="font-bold text-[16px] text-navy mb-1">{EMPTY[tab].heading}</h3>
                <p className="text-[13px] text-muted mb-5 max-w-xs">{EMPTY[tab].sub}</p>
                <Link to="/seller/listings" className="text-[13px] font-bold text-primary hover:underline">Go to My Listings</Link>
              </div>
            ) : (
              <>
                <div className="hidden sm:grid grid-cols-[44px_1fr_120px_60px_80px_100px_150px] gap-4 px-5 py-2.5 text-[11px] font-bold text-placeholder uppercase tracking-wide border-b border-bg">
                  <span /><span>Item</span><span>{live ? 'Current bid' : 'Final bid'}</span><span>Bids</span><span>Watching</span><span>{live ? 'Time left' : 'Ended'}</span><span>Reserve</span>
                </div>
                {auctions.map((a) => <AuctionRow key={a.auctionId} auction={a} live={live} />)}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
