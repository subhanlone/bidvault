import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAuction } from '../../context/AuctionContext';
import { useTimer } from '../../hooks/useTimer';
import { Clock, Heart, X, Menu } from 'lucide-react';
import { IconBidVaultLogo, IconHeart } from '../../components/Icons';
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
          className="absolute top-3 right-3 bg-[#d0021b] rounded-full size-[32px] flex items-center justify-center hover:bg-[#a80016] transition-colors"
          title="Remove from watchlist"
        >
          <IconHeart className="size-[14px]" filled />
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
              className="bg-[#d0021b] font-bold text-[12px] text-white px-4 py-2 rounded-[7px] hover:bg-[#a80016] transition-colors"
            >
              Bid Now →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function BuyerNav() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="bg-[#0b1f3a] sticky top-0 z-40 shadow-[0_2px_12px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between px-4 sm:px-8 h-[60px]">
        <div className="flex items-center gap-6">
          <Link to="/buyer/browse" className="flex gap-[10px] items-center shrink-0">
            <div className="bg-[#d0021b] flex items-center justify-center rounded-[8px] size-[34px]">
              <IconBidVaultLogo className="size-[18px]" />
            </div>
            <span className="font-extrabold text-[20px] text-white tracking-[-0.3px]">
              Bid<span className="text-[#d0021b]">Vault</span>
            </span>
          </Link>
          <nav className="hidden md:flex">
            <Link to="/buyer/browse" className="font-semibold text-[13px] px-4 py-[18px] border-b-2 text-[rgba(255,255,255,0.55)] border-transparent hover:text-white transition-colors">Browse</Link>
            <Link to="/buyer/my-bids" className="font-semibold text-[13px] px-4 py-[18px] border-b-2 text-[rgba(255,255,255,0.55)] border-transparent hover:text-white transition-colors">My Bids</Link>
            <span className="font-semibold text-[13px] px-4 py-[18px] border-b-2 text-white border-[#d0021b]">Watchlist</span>
          </nav>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <Link to="/buyer/profile" className="bg-[#d0021b] rounded-full size-[34px] flex items-center justify-center hover:bg-[#a80016] transition-colors">
            <span className="font-bold text-[13px] text-white">{user?.name?.[0] ?? 'B'}</span>
          </Link>
          <span className="font-semibold text-[13px] text-white">{user?.name?.split(' ')[0] ?? 'Buyer'}</span>
          <button onClick={logout} className="font-semibold text-[12px] text-[rgba(255,255,255,0.45)] hover:text-white ml-1 transition-colors">Logout</button>
        </div>
        <button className="md:hidden p-2 rounded-[6px] hover:bg-[rgba(255,255,255,0.08)]" onClick={() => setMenuOpen(o => !o)}>
          {menuOpen ? <X size={20} className="text-white" /> : <Menu size={20} className="text-white" />}
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden bg-[#0d2545] border-t border-[rgba(255,255,255,0.08)] px-4 py-4 flex flex-col gap-1">
          <Link to="/buyer/browse" onClick={() => setMenuOpen(false)} className="font-semibold text-[14px] text-[rgba(255,255,255,0.7)] py-2 hover:text-white">Browse Auctions</Link>
          <Link to="/buyer/my-bids" onClick={() => setMenuOpen(false)} className="font-semibold text-[14px] text-[rgba(255,255,255,0.7)] py-2 hover:text-white">My Bids</Link>
          <span className="font-semibold text-[14px] text-white py-2">Watchlist</span>
          <Link to="/buyer/profile" onClick={() => setMenuOpen(false)} className="font-semibold text-[14px] text-[#d0021b] py-2">My Profile</Link>
          <div className="flex items-center justify-between pt-3 mt-1 border-t border-[rgba(255,255,255,0.08)]">
            <span className="font-semibold text-[13px] text-white">{user?.name?.split(' ')[0] ?? 'Buyer'}</span>
            <button onClick={logout} className="font-semibold text-[12px] text-[#d0021b]">Logout</button>
          </div>
        </div>
      )}
    </header>
  );
}

export default function BuyerWatchlist() {
  const { auctions, watchlist, toggleWatchlist } = useAuction();

  const watched = auctions.filter(a => watchlist.includes(a.auctionId));
  const activeCount = watched.filter(a => new Date(a.endTime).getTime() > Date.now()).length;

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <BuyerNav />

      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
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
      </div>
    </div>
  );
}
