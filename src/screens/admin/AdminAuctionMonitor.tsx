import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuction } from '../../context/AuctionContext';
import { useTimer } from '../../hooks/useTimer';
import { getSocket } from '../../services/socket';
import { Menu, Search } from 'lucide-react';
import { AdminSidebarContent } from '../../components/ui/AdminSidebar';

const FALLBACK_END_TIME = new Date(Date.now() + 3_600_000).toISOString();

export default function AdminAuctionMonitor() {
  const { auctionId } = useParams<{ auctionId: string }>();
  const { getAuction, bids, fetchBids, auctionsLoaded } = useAuction();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const auction = getAuction(auctionId ?? '');
  const timer = useTimer(auction?.endTime ?? FALLBACK_END_TIME);

  useEffect(() => {
    if (!auctionId) return;
    void fetchBids(auctionId);
    const socket = getSocket();
    const subscribe = () => socket.emit('auction:subscribe', auctionId);
    subscribe();
    socket.on('connect', subscribe);
    return () => {
      socket.off('connect', subscribe);
      socket.emit('auction:unsubscribe', auctionId);
    };
  }, [auctionId, fetchBids]);

  const auctionBids = useMemo(
    () => (auction ? bids[auction.auctionId] ?? [] : []),
    [auction, bids],
  );

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
        <header className="bg-surface border-b border-border-light flex items-center justify-between px-4 sm:px-6 py-4 gap-3">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-sm border border-border-light hover:bg-bg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={18} className="text-tertiary" />
            </button>
            <div>
              <h1 className="font-extrabold text-[18px] sm:text-[20px] text-navy">Auction Monitor</h1>
              <p className="text-[12px] text-muted">Read-only live view</p>
            </div>
          </div>
          <Link to="/admin/live-auctions" className="font-semibold text-[13px] text-primary hover:underline">
            ← Back to Live Auctions
          </Link>
        </header>

        <div className="flex-1 p-4 sm:p-6">
          {!auctionsLoaded ? (
            <div className="max-w-[700px] flex flex-col gap-4">
              <div className="h-[220px] bg-surface border border-border-light rounded-md animate-pulse" />
              <div className="h-[120px] bg-surface border border-border-light rounded-md animate-pulse" />
            </div>
          ) : !auction ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <Search size={40} strokeWidth={1.3} className="text-placeholder" />
              <p className="font-bold text-[16px] text-secondary">Auction not found</p>
            </div>
          ) : (
            <div className="max-w-[700px] flex flex-col gap-4">

              {/* Info bar */}
              <div className="bg-surface border border-border-light rounded-md p-4 sm:p-5 flex items-center gap-4">
                <div className="bg-bg rounded-md size-[64px] overflow-hidden shrink-0">
                  {auction.imageUrl
                    ? <img src={auction.imageUrl} alt={auction.title} className="w-full h-full object-cover" />
                    : <span className="flex items-center justify-center w-full h-full text-[24px]">{auction.emoji}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-[16px] text-navy truncate">{auction.title}</h2>
                  <p className="text-[12px] text-muted">{auction.category} · {auction.condition} · Seller: {auction.sellerName}</p>
                  <p className="text-[11px] text-placeholder mt-0.5">Status: {auction.status}</p>
                </div>
              </div>

              {/* Timer + current bid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`rounded-md p-5 text-center ${timer.totalSeconds < 3600 ? 'bg-primary' : 'bg-navy'}`}>
                  <p className="font-bold text-[11px] text-[rgba(255,255,255,0.6)] uppercase tracking-[1px] mb-1">Time Remaining</p>
                  <p className="font-extrabold text-[28px] text-white leading-none">{timer.isExpired ? 'Ended' : timer.display}</p>
                </div>
                <div className="bg-surface border border-border-light rounded-md p-5">
                  <p className="text-[12px] text-muted mb-1">Current Bid</p>
                  <p className="font-extrabold text-[24px] text-primary leading-none mb-1">PKR {auction.currentBid.toLocaleString()}</p>
                  <p className="text-[11px] text-muted">{auction.bidCount} bids</p>
                </div>
              </div>

              {/* Bid history */}
              <div className="bg-surface border border-border-light rounded-md p-4 sm:p-5">
                <h3 className="font-bold text-[14px] text-navy mb-4">Bid History ({auctionBids.length})</h3>
                {auctionBids.length === 0 ? (
                  <p className="text-[13px] text-muted text-center py-6">No bids yet.</p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {auctionBids.map((b, i) => (
                      <div key={b.bidId} className={`flex items-center justify-between py-3 ${i < auctionBids.length - 1 ? 'border-b border-surface-raised' : ''}`}>
                        <div>
                          <p className="font-bold text-[12px] text-secondary">{b.buyerName}</p>
                          <p className="text-[10px] text-placeholder">{new Date(b.timestamp).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[13px] text-secondary">PKR {b.amount.toLocaleString()}</p>
                          {i === 0 && (
                            <span className="bg-success-bg border border-success-border text-success-dark text-[10px] font-bold px-2 py-[1px] rounded-full">
                              Highest
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
