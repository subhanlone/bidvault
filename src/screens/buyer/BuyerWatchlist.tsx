import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAuction } from '../../context/AuctionContext';
import { useTimer } from '../../hooks/useTimer';
import { Clock, Heart } from 'lucide-react';
import { BuyerNavbar } from '../../components/ui';
import type { Auction } from '../../types';

const INITIAL_NOW = Date.now();

function WatchCard({ auction, onRemove }: { auction: Auction; onRemove: () => void }) {
  const navigate = useNavigate();
  const timer = useTimer(auction.endTime);
  const isEnded = timer.isExpired;

  return (
    <div className="bg-surface border border-border-light rounded-md overflow-hidden hover:shadow-md transition-all duration-200 group flex flex-col">
      <div
        className="h-[160px] relative overflow-hidden bg-navy cursor-pointer"
        onClick={() => navigate(`/buyer/live-bidding/${auction.auctionId}`)}
      >
        <img
          src={auction.imageUrl}
          alt={auction.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.3)] to-transparent" />
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          aria-label="Remove from watchlist"
          className="absolute top-3 right-3 bg-primary rounded-full size-[32px] flex items-center justify-center hover:bg-primary-dark transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Heart size={14} fill="white" className="text-white" />
        </button>
      </div>

      <div className="p-4 flex flex-col flex-1 cursor-pointer" onClick={() => navigate(`/buyer/live-bidding/${auction.auctionId}`)}>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="bg-surface-raised font-medium text-[11px] text-muted px-2 py-[3px] rounded-full">{auction.category}</span>
          <span className={`font-bold text-[11px] px-2 py-[3px] rounded-full ${isEnded ? 'bg-bg text-muted' : timer.totalSeconds < 3600 ? 'bg-primary-surface text-primary' : 'bg-success-bg text-success-dark'}`}>
            {isEnded ? 'Ended' : <span className="flex items-center gap-1"><Clock size={10} strokeWidth={2.5} />{timer.display}</span>}
          </span>
        </div>
        <h3 className="font-bold text-[14px] text-navy mb-3 line-clamp-2 leading-tight">{auction.title}</h3>
        <div className="flex items-end justify-between mt-auto">
          <div>
            <p className="text-[11px] text-muted">Current Bid</p>
            <p className="font-extrabold text-[18px] text-primary leading-none">PKR {auction.currentBid.toLocaleString()}</p>
            <p className="text-[11px] text-placeholder mt-0.5">{auction.bidCount} bids</p>
          </div>
          {!isEnded && (
            <button
              onClick={e => { e.stopPropagation(); navigate(`/buyer/live-bidding/${auction.auctionId}`); }}
              className="bg-primary font-bold text-[12px] text-white px-4 py-2 rounded-sm hover:bg-primary-dark transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
            >
              Bid Now →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BuyerWatchlist() {
  const { user, logout } = useAuth();
  const { auctions, watchlist, toggleWatchlist } = useAuction();
  const [now, setNow] = useState(INITIAL_NOW);

  useEffect(() => {
    const timeoutId = setTimeout(() => setNow(Date.now()), 0);
    const intervalId = setInterval(() => setNow(Date.now()), 30_000);
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, []);

  const watched = auctions.filter(a => watchlist.includes(a.auctionId));
  const activeCount = watched.filter(a => new Date(a.endTime).getTime() > now).length;

  return (
    <div className="min-h-screen bg-bg">
      <BuyerNavbar userName={user?.name} onLogout={logout} />

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="font-extrabold text-[20px] sm:text-[22px] text-navy">Watchlist</h1>
            <p className="text-[13px] text-muted mt-0.5">Auctions you're keeping an eye on</p>
          </div>
          {watched.length > 0 && (
            <div className="flex gap-2 sm:gap-3">
              {[
                { val: activeCount, label: 'Active', color: 'text-navy' },
                { val: watched.length, label: 'Total', color: 'text-secondary' },
              ].map(s => (
                <div key={s.label} className="bg-surface border border-border-light rounded-md px-3 sm:px-4 py-2 text-center min-w-[60px]">
                  <p className={`font-extrabold text-[18px] sm:text-[20px] ${s.color}`}>{s.val}</p>
                  <p className="text-[10px] sm:text-[11px] text-muted">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {watched.length === 0 ? (
          <div className="bg-surface border border-border-light rounded-lg flex flex-col items-center justify-center py-14 sm:py-16 px-6 text-center">
            <div className="flex justify-center mb-4">
              <Heart size={48} strokeWidth={1.3} className="text-primary" fill="rgba(208,2,27,0.15)" />
            </div>
            <h2 className="font-bold text-[17px] sm:text-[18px] text-navy mb-2">Your watchlist is empty</h2>
            <p className="text-[13px] sm:text-[14px] text-muted mb-6 max-w-[320px]">
              Tap the heart icon on any live auction to save it here and track it easily.
            </p>
            <Link to="/buyer/browse" className="bg-primary font-bold text-[14px] text-white px-6 py-3 rounded-sm hover:bg-primary-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1">
              Browse Auctions →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {watched.map(auction => (
              <WatchCard
                key={auction.auctionId}
                auction={auction}
                onRemove={() => toggleWatchlist(auction.auctionId)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
