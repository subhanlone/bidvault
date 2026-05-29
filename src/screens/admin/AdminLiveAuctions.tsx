import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuction } from '../../context/AuctionContext';
import { useTimer } from '../../hooks/useTimer';
import { Menu, Radio } from 'lucide-react';
import { AdminSidebarContent } from '../../components/ui/AdminSidebar';
import type { Auction } from '../../types';

const INITIAL_NOW = Date.now();

function AuctionRow({ auction }: { auction: Auction }) {
  const timer = useTimer(auction.endTime);
  const navigate = useNavigate();
  const urgent = timer.totalSeconds < 3600 && !timer.isExpired;

  return (
    <div className="border-b border-bg last:border-0">
      {/* Desktop row */}
      <div className="hidden sm:grid sm:grid-cols-[44px_1fr_130px_120px_110px_70px_80px] gap-4 items-center px-5 py-4 hover:bg-bg transition-colors">
        <div className="bg-bg rounded-sm size-[36px] overflow-hidden shrink-0">
          <img src={auction.imageUrl} alt={auction.title} className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-[13px] text-secondary truncate">{auction.title}</p>
          <span className="text-[10px] text-placeholder">{auction.category} · {auction.condition}</span>
        </div>
        <p className="text-[12px] text-tertiary truncate">{auction.sellerName}</p>
        <p className="font-bold text-[13px] text-primary">PKR {auction.currentBid.toLocaleString()}</p>
        <p className={`font-bold text-[13px] ${urgent ? 'text-primary' : timer.isExpired ? 'text-muted' : 'text-secondary'}`}>
          {timer.isExpired ? 'Ended' : timer.display}
        </p>
        <p className="font-semibold text-[12px] text-tertiary">{auction.bidCount}</p>
        <button
          onClick={() => navigate(`/buyer/live-bidding/${auction.auctionId}`)}
          className="bg-primary font-bold text-[11px] text-white px-3 py-[5px] rounded-sm hover:bg-primary-dark whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
        >
          View →
        </button>
      </div>

      {/* Mobile card */}
      <div className="sm:hidden flex items-center gap-3 px-4 py-3 hover:bg-bg transition-colors">
        <div className="bg-bg rounded-sm size-[44px] overflow-hidden shrink-0">
          <img src={auction.imageUrl} alt={auction.title} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[13px] text-secondary truncate">{auction.title}</p>
          <div className="flex items-center gap-2 mt-[2px]">
            <span className="font-bold text-[12px] text-primary">PKR {auction.currentBid.toLocaleString()}</span>
            <span className="text-[10px] text-placeholder">·</span>
            <span className={`text-[11px] font-semibold ${urgent ? 'text-primary' : timer.isExpired ? 'text-muted' : 'text-tertiary'}`}>
              {timer.isExpired ? 'Ended' : timer.display}
            </span>
          </div>
          <p className="text-[10px] text-placeholder mt-[2px]">{auction.sellerName} · {auction.bidCount} bids</p>
        </div>
        <button
          onClick={() => navigate(`/buyer/live-bidding/${auction.auctionId}`)}
          className="bg-primary font-bold text-[11px] text-white px-3 py-[5px] rounded-sm hover:bg-primary-dark whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
        >
          View →
        </button>
      </div>
    </div>
  );
}

export default function AdminLiveAuctions() {
  const { auctions } = useAuction();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [now, setNow] = useState(INITIAL_NOW);

  useEffect(() => {
    const timeoutId = setTimeout(() => setNow(Date.now()), 0);
    const intervalId = setInterval(() => setNow(Date.now()), 30_000);
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, []);

  const active = auctions.filter(a => a.status === 'ACTIVE');
  const endingSoon = active.filter(a => {
    const secs = Math.max(0, (new Date(a.endTime).getTime() - now) / 1000);
    return secs < 3600;
  });
  const totalBids = auctions.reduce((s, a) => s + a.bidCount, 0);
  const highestBid = auctions.reduce((m, a) => Math.max(m, a.currentBid), 0);

  return (
    <div className="flex min-h-screen bg-bg">
      <div className="hidden md:block md:w-[200px] md:shrink-0">
        <AdminSidebarContent active="Live Auctions" />
      </div>

      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <AdminSidebarContent active="Live Auctions" onClose={() => setSidebarOpen(false)} />
          <button className="flex-1 bg-[rgba(0,0,0,0.4)] border-0" onClick={() => setSidebarOpen(false)} aria-label="Close navigation menu" />
        </div>
      )}

      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-surface border-b border-border-light flex items-center justify-between px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-sm border border-border-light hover:bg-bg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={18} className="text-tertiary" />
            </button>
            <div>
              <h1 className="font-extrabold text-[18px] sm:text-[20px] text-navy">Live Auctions</h1>
              <p className="text-[12px] text-muted">Real-time view of all active auctions</p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-[12px] text-success-dark font-bold">
            <span className="size-[8px] rounded-full bg-success-dark inline-block animate-pulse" />
            Live
          </span>
        </header>

        <div className="flex-1 p-4 sm:p-6 flex flex-col gap-4 sm:gap-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: 'Total Active',   value: String(active.length),                          color: 'text-navy',         sub: 'Across all categories' },
              { label: 'Ending in <1hr', value: String(endingSoon.length),                      color: 'text-destructive',  sub: 'Needs attention' },
              { label: 'Total Bids',     value: totalBids.toLocaleString(),                     color: 'text-success-dark', sub: 'Across all auctions' },
              { label: 'Highest Bid',    value: `PKR ${(highestBid / 1000).toFixed(0)}K`,       color: 'text-primary',      sub: 'Single item' },
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
              <h2 className="font-bold text-[14px] text-navy">Active Auctions ({auctions.length})</h2>
              <span className="hidden sm:block font-bold text-[11px] text-muted">Auto-refreshing live data</span>
            </div>

            <div className="hidden sm:grid sm:grid-cols-[44px_1fr_130px_120px_110px_70px_80px] gap-4 px-5 py-3 text-[11px] text-placeholder font-bold uppercase tracking-[0.5px] border-b border-bg">
              <span /><span>Item</span><span>Seller</span><span>Current Bid</span><span>Time Left</span><span>Bids</span><span>Action</span>
            </div>

            <div className="flex flex-col">
              {auctions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                  <Radio size={48} strokeWidth={1.3} className="text-placeholder" />
                  <p className="font-bold text-[15px] text-secondary">No active auctions</p>
                  <p className="text-[13px] text-muted">There are no live auctions at the moment.</p>
                </div>
              ) : auctions.map(auction => (
                <AuctionRow key={auction.auctionId} auction={auction} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
