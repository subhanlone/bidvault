import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useActiveAuctions, useDrainedPages } from '../../queries/auctions';
import { keys } from '../../queries/keys';
import { useTimer } from '../../hooks/useTimer';
import { Menu, Radio, Ban, ShieldOff } from 'lucide-react';
import AdminLayout from '../../components/ui/AdminLayout';
import NotificationBell from '../../components/ui/NotificationBell';
import ReasonModal from '../../components/ui/ReasonModal';
import ErrorState from '../../components/ui/ErrorState';
import LoadingStatus from '../../components/ui/LoadingStatus';
import { api } from '../../services/api';
import type { Auction } from '../../types/api';
import { conditionLabel, count, pkr, pkrCompact } from '../../utils/format';
import { useNow } from '../../hooks/useNow';

function AuctionRow({ auction }: { auction: Auction }) {
  const timer = useTimer(auction.endTime);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urgent = timer.totalSeconds < 3600 && !timer.isExpired;
  const [cancelling, setCancelling] = useState(false);
  const [takingDown, setTakingDown] = useState(false);

  async function handleCancel(reason: string) {
    await api.post(`/admin/auctions/${auction.auctionId}/cancel`, { reason });
    setCancelling(false);
    void queryClient.invalidateQueries({ queryKey: keys.auctions.active });
  }

  // C3, Phase 7: pulls the listing for cause (counterfeit, stolen, prohibited, misdescribed) --
  // cancels this auction underneath via the same service the Cancel button above uses.
  async function handleTakedown(reason: string) {
    await api.post(`/admin/listings/${auction.listingId}/takedown`, { reason });
    setTakingDown(false);
    void queryClient.invalidateQueries({ queryKey: keys.auctions.active });
  }

  return (
    <div className="border-b border-bg last:border-0">
      {/* Desktop row */}
      <div className="hidden sm:grid sm:grid-cols-[44px_1fr_130px_120px_110px_70px_140px] gap-4 items-center px-5 py-4 hover:bg-bg transition-colors">
        <div className="bg-bg rounded-sm size-[36px] overflow-hidden shrink-0">
          {auction.imageUrl
            ? <img src={auction.imageUrl} alt={auction.title} className="w-full h-full object-cover" />
            : <span className="flex items-center justify-center w-full h-full text-[16px]">{auction.emoji}</span>
          }
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-[13px] text-secondary truncate">{auction.title}</p>
          <span className="text-[10px] text-placeholder">{auction.category} · {conditionLabel(auction.condition)}</span>
        </div>
        <p className="text-[12px] text-tertiary truncate">{auction.sellerName}</p>
        <p className="font-bold text-[13px] text-primary">{pkr(auction.currentBid)}</p>
        <p className={`font-bold text-[13px] ${urgent ? 'text-primary' : timer.isExpired ? 'text-muted' : 'text-secondary'}`}>
          {timer.isExpired ? 'Ended' : timer.display}
        </p>
        <p className="font-semibold text-[12px] text-tertiary">{auction.bidCount}</p>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate(`/admin/monitor/${auction.auctionId}`)}
            className="bg-primary font-bold text-[11px] text-white px-3 py-[5px] rounded-sm hover:bg-primary-dark whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
          >
            Monitor →
          </button>
          <button
            onClick={() => setCancelling(true)}
            aria-label="Cancel this auction"
            title="Cancel this auction"
            className="border border-border-medium text-destructive p-[5px] rounded-sm hover:bg-error-bg whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
          >
            <Ban size={13} />
          </button>
          <button
            onClick={() => setTakingDown(true)}
            aria-label="Remove this listing"
            title="Remove this listing"
            className="border border-border-medium text-destructive p-[5px] rounded-sm hover:bg-error-bg whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
          >
            <ShieldOff size={13} />
          </button>
        </div>
      </div>

      {/* Mobile card */}
      <div className="sm:hidden flex items-center gap-3 px-4 py-3 hover:bg-bg transition-colors">
        <div className="bg-bg rounded-sm size-[44px] overflow-hidden shrink-0">
          {auction.imageUrl
            ? <img src={auction.imageUrl} alt={auction.title} className="w-full h-full object-cover" />
            : <span className="flex items-center justify-center w-full h-full text-[18px]">{auction.emoji}</span>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[13px] text-secondary truncate">{auction.title}</p>
          <div className="flex items-center gap-2 mt-[2px]">
            <span className="font-bold text-[12px] text-primary">{pkr(auction.currentBid)}</span>
            <span className="text-[10px] text-placeholder">·</span>
            <span className={`text-[11px] font-semibold ${urgent ? 'text-primary' : timer.isExpired ? 'text-muted' : 'text-tertiary'}`}>
              {timer.isExpired ? 'Ended' : timer.display}
            </span>
          </div>
          <p className="text-[10px] text-placeholder mt-[2px]">{auction.sellerName} · {count(auction.bidCount, 'bid')}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => navigate(`/admin/monitor/${auction.auctionId}`)}
            className="bg-primary font-bold text-[11px] text-white px-3 py-[5px] rounded-sm hover:bg-primary-dark whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
          >
            Monitor →
          </button>
          <button
            onClick={() => setCancelling(true)}
            aria-label="Cancel this auction"
            className="border border-border-medium text-destructive p-[5px] rounded-sm hover:bg-error-bg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
          >
            <Ban size={13} />
          </button>
          <button
            onClick={() => setTakingDown(true)}
            aria-label="Remove this listing"
            className="border border-border-medium text-destructive p-[5px] rounded-sm hover:bg-error-bg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
          >
            <ShieldOff size={13} />
          </button>
        </div>
      </div>

      {cancelling && (
        <ReasonModal
          title="Cancel Auction"
          subject={auction.title}
          description={`This stops the auction immediately${auction.bidCount > 0 ? `, and notifies all ${auction.bidCount} bidder${auction.bidCount !== 1 ? 's' : ''} that it was cancelled` : ''}. No sale or charge will result.`}
          submitLabel="Cancel Auction"
          fieldLabel="Reason"
          placeholder="e.g. Suspected shill bidding, pricing error"
          onSubmit={handleCancel}
          onClose={() => setCancelling(false)}
        />
      )}

      {takingDown && (
        <ReasonModal
          title="Remove Listing"
          subject={auction.title}
          description={`This takes the listing off the platform for cause and cancels its auction immediately${auction.bidCount > 0 ? `, notifying all ${auction.bidCount} bidder${auction.bidCount !== 1 ? 's' : ''}` : ''}. Distinct from Cancel — use this for counterfeit, stolen, prohibited, or misdescribed items.`}
          submitLabel="Remove Listing"
          fieldLabel="Reason"
          placeholder="e.g. Reported as counterfeit, prohibited item"
          onSubmit={handleTakedown}
          onClose={() => setTakingDown(false)}
        />
      )}
    </div>
  );
}

export default function AdminLiveAuctions() {
  const activeQuery = useActiveAuctions();
  const auctions = useDrainedPages(activeQuery);
  // The tiles are totals over every page, so they are only true once the last page is in. Until
  // then, and after a failure, they show a dash and the table says why instead of "No active auctions".
  const known = !activeQuery.isError && !activeQuery.isPending && !activeQuery.hasNextPage && !activeQuery.isFetchingNextPage;

  // AL-01: filter to ACTIVE only for table rendering
  const now = useNow(30_000);
  const active = auctions.filter(a => a.status === 'ACTIVE');
  const endingSoon = active.filter(a => {
    const secs = Math.max(0, (new Date(a.endTime).getTime() - now) / 1000);
    return secs < 3600;
  });
  const totalBids    = active.reduce((s, a) => s + a.bidCount, 0);
  const highestBid   = active.reduce((m, a) => Math.max(m, a.currentBid), 0);

  return (
    <AdminLayout active="Live Auctions">
      {({ openMobileMenu }) => (
        <>
      <header className="bg-surface border-b border-border-light flex items-center justify-between px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-2 rounded-sm border border-border-light hover:bg-bg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={openMobileMenu}
            aria-label="Open navigation menu"
          >
            <Menu size={18} className="text-tertiary" />
          </button>
          <div>
            <h1 className="font-extrabold text-[18px] sm:text-[20px] text-navy">Live Auctions</h1>
            <p className="text-[12px] text-muted">Real-time view of all active auctions</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-1 text-[12px] text-success-dark font-bold">
            <span className="size-[8px] rounded-full bg-success-dark inline-block animate-pulse" />
            Live
          </span>
          <NotificationBell iconClass="text-tertiary hover:text-navy" align="right" />
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 sm:p-6 flex flex-col gap-4 sm:gap-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: 'Total Active',    value: known ? String(active.length) : '—',                    color: 'text-navy',         sub: 'Across all categories' },
              { label: 'Ending in <1hr', value: known ? String(endingSoon.length) : '—',                 color: 'text-destructive',  sub: 'Needs attention' },
              { label: 'Total Bids',      value: known ? totalBids.toLocaleString() : '—',               color: 'text-success-dark', sub: 'Active auctions' },
              { label: 'Highest Bid',     value: known ? pkrCompact(highestBid) : '—', color: 'text-primary',      sub: 'Single item' },
            ].map(s => (
              <div key={s.label} className="bg-surface border border-border-light rounded-md p-4 sm:p-5">
                <p className="font-medium text-[11px] sm:text-[12px] text-muted mb-1 sm:mb-2">{s.label}</p>
                <p className={`font-extrabold text-[24px] sm:text-[28px] ${s.color} leading-none`}>{s.value}</p>
                <p className="text-[10px] text-placeholder mt-1">{s.sub}</p>
              </div>
            ))}
          </div>

          <div className="bg-surface border border-border-light rounded-md">
            <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-border-light">
              {/* AL-01: header count uses active.length */}
              <h2 className="font-bold text-[14px] text-navy">Active Auctions{known ? ` (${active.length})` : ''}</h2>
              {/* AL-03: accurate label */}
              <span className="hidden sm:block font-bold text-[11px] text-muted">Updates via socket events</span>
            </div>

            <div className="hidden sm:grid sm:grid-cols-[44px_1fr_130px_120px_110px_70px_140px] gap-4 px-5 py-3 text-[11px] text-placeholder font-bold uppercase tracking-[0.5px] border-b border-bg">
              <span /><span>Item</span><span>Seller</span><span>Current Bid</span><span>Time Left</span><span>Bids</span><span>Action</span>
            </div>

            <div className="flex flex-col">
              {/* AL-01: render active.map, not auctions.map */}
              {activeQuery.isError ? (
                <ErrorState
                  title="Could not load the live auctions"
                  onRetry={() => { void activeQuery.refetch(); }}
                  retrying={activeQuery.isFetching}
                  className="border-0 rounded-none"
                />
              ) : !known ? (
                <div className="flex flex-col divide-y divide-bg">
                  <LoadingStatus label="Loading live auctions" />
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-4">
                      <div className="bg-border-light rounded-sm size-[44px] animate-pulse shrink-0" />
                      <div className="flex-1 h-3 bg-border-light rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : active.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                  <Radio size={48} strokeWidth={1.3} className="text-placeholder" />
                  <p className="font-bold text-[15px] text-secondary">No active auctions</p>
                  <p className="text-[13px] text-muted">There are no live auctions at the moment.</p>
                </div>
              ) : active.map(auction => (
                <AuctionRow key={auction.auctionId} auction={auction} />
              ))}
            </div>
          </div>
        </div>
        </>
      )}
    </AdminLayout>
  );
}
