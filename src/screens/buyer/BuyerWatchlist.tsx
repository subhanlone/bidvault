import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAuction } from '../../context/AuctionContext';
import { useTimer } from '../../hooks/useTimer';
import { Clock, Heart } from 'lucide-react';
import { BuyerNavbar } from '../../components/ui';
import type { Auction } from '../../types';

function WatchCard({ auction, onRemove }: { auction: Auction; onRemove: () => void }) {
  const navigate = useNavigate();
  const timer = useTimer(auction.endTime);
  const isEnded = timer.isExpired;

  return (
    <div className="bg-white border border-[#e9ecef] rounded-[14px] overflow-hidden hover:shadow-[0_4px_20px_rgba(11,31,58,0.08)] transition-all group flex flex-col">
      <div
        className="h-[160px] relative overflow-hidden bg-[#0b1f3a] cursor-pointer"
        onClick={() => navigate(`/buyer/live-bidding/${auction.auctionId}`)}
      >
        <img
          src={auction.imageUrl}
          alt={auction.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.3)] to-transparent" />
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          className="absolute top-3 right-3 bg-[#d0021b] rounded-full size-[32px] flex items-center justify-center hover:bg-[#a80016] transition-colors cursor-pointer"
          title="Remove from watchlist"
        >
          <Heart size={14} fill="white" className="text-white" />
        </button>
        {auction.badge && (
          <span className={`absolute top-3 left-3 ${auction.badgeColor} font-bold text-[10px] text-white px-2 py-1 rounded-[99px]`}>
            {auction.badge}
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1 cursor-pointer" onClick={() => navigate(`/buyer/live-bidding/${auction.auctionId}`)}>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="bg-[#f1f3f5] font-medium text-[11px] text-[#6c757d] px-2 py-[3px] rounded-[99px]">{auction.category}</span>
          <span className={`font-bold text-[11px] px-2 py-[3px] rounded-[99px] ${isEnded ? 'bg-[#f8f9fa] text-[#6c757d]' : timer.totalSeconds < 3600 ? 'bg-[#fff5f5] text-[#d0021b]' : 'bg-[#f0faf4] text-[#1a7a4a]'}`}>
            {isEnded ? 'Ended' : <span className="flex items-center gap-1"><Clock size={10} strokeWidth={2.5} />{timer.display}</span>}
          </span>
        </div>
        <h3 className="font-bold text-[14px] text-[#0b1f3a] mb-3 line-clamp-2 leading-tight">{auction.title}</h3>
        <div className="flex items-end justify-between mt-auto">
          <div>
            <p className="text-[11px] text-[#6c757d]">Current Bid</p>
            <p className="font-extrabold text-[18px] text-[#d0021b] leading-none">PKR {auction.currentBid.toLocaleString()}</p>
            <p className="text-[11px] text-[#adb5bd] mt-0.5">{auction.bidCount} bids</p>
          </div>
          {!isEnded && (
            <button
              onClick={e => { e.stopPropagation(); navigate(`/buyer/live-bidding/${auction.auctionId}`); }}
              className="bg-[#d0021b] font-bold text-[12px] text-white px-4 py-2 rounded-[7px] hover:bg-[#a80016] transition-colors cursor-pointer"
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

  const watched = auctions.filter(a => watchlist.includes(a.auctionId));
  const activeCount = watched.filter(a => new Date(a.endTime).getTime() > Date.now()).length;

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <BuyerNavbar userName={user?.name} onLogout={logout} />

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="font-extrabold text-[20px] sm:text-[22px] text-[#0b1f3a]">Watchlist</h1>
            <p className="text-[13px] text-[#6c757d] mt-0.5">Auctions you're keeping an eye on</p>
          </div>
          {watched.length > 0 && (
            <div className="flex gap-2 sm:gap-3">
              {[
                { val: activeCount, label: 'Active', color: 'text-[#0b1f3a]' },
                { val: watched.length, label: 'Total', color: 'text-[#343a40]' },
              ].map(s => (
                <div key={s.label} className="bg-white border border-[#e9ecef] rounded-[10px] px-3 sm:px-4 py-2 text-center min-w-[60px]">
                  <p className={`font-extrabold text-[18px] sm:text-[20px] ${s.color}`}>{s.val}</p>
                  <p className="text-[10px] sm:text-[11px] text-[#6c757d]">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {watched.length === 0 ? (
          <div className="bg-white border border-[#e9ecef] rounded-[16px] flex flex-col items-center justify-center py-14 sm:py-16 px-6 text-center">
            <div className="flex justify-center mb-4">
              <Heart size={48} strokeWidth={1.3} className="text-[#d0021b]" fill="rgba(208,2,27,0.15)" />
            </div>
            <h2 className="font-bold text-[17px] sm:text-[18px] text-[#0b1f3a] mb-2">Your watchlist is empty</h2>
            <p className="text-[13px] sm:text-[14px] text-[#6c757d] mb-6 max-w-[320px]">
              Tap the heart icon on any live auction to save it here and track it easily.
            </p>
            <Link to="/buyer/browse" className="bg-[#d0021b] font-bold text-[14px] text-white px-6 py-3 rounded-[8px] hover:bg-[#a80016] transition-colors">
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
