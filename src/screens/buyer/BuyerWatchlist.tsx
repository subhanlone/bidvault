import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAuction } from '../../context/AuctionContext';
import { useTimer } from '../../hooks/useTimer';
import { IconBidVaultLogo, IconHeart } from '../../components/Icons';
import type { Auction } from '../../types';

function WatchCard({ auction, onRemove }: { auction: Auction; onRemove: () => void }) {
  const navigate = useNavigate();
  const timer = useTimer(auction.endTime);
  const isEnded = timer.isExpired;

  return (
    <div className="bg-white border border-[#e9ecef] rounded-[14px] overflow-hidden hover:shadow-md transition-all group flex flex-col">
      <div
        className="h-[160px] relative overflow-hidden bg-[#0b1f3a] cursor-pointer"
        onClick={() => navigate(`/buyer/live-bidding/${auction.auctionId}`)}
      >
        <img
          src={auction.imageUrl}
          alt={auction.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
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
            {isEnded ? 'Ended' : `⏱ ${timer.display}`}
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

export default function BuyerWatchlist() {
  const { user, logout } = useAuth();
  const { auctions, watchlist, toggleWatchlist } = useAuction();

  const watched = auctions.filter(a => watchlist.includes(a.auctionId));
  const activeCount = watched.filter(a => new Date(a.endTime).getTime() > Date.now()).length;

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <header className="bg-[#0b1f3a] flex items-center justify-between px-4 sm:px-8 py-0">
        <div className="flex items-center gap-6 sm:gap-8">
          <div className="flex gap-[10px] items-center py-4">
            <div className="bg-[#d0021b] flex items-center justify-center rounded-[8px] size-[34px]">
              <IconBidVaultLogo className="size-[18px]" />
            </div>
            <span className="font-extrabold text-[20px] text-white tracking-[-0.3px]">
              Bid<span className="text-[#d0021b]">Vault</span>
            </span>
          </div>
          <nav className="hidden sm:flex">
            <Link to="/buyer/browse" className="font-semibold text-[13px] px-4 py-5 border-b-2 text-[rgba(255,255,255,0.55)] border-transparent hover:text-white">Browse Auctions</Link>
            <Link to="/buyer/my-bids" className="font-semibold text-[13px] px-4 py-5 border-b-2 text-[rgba(255,255,255,0.55)] border-transparent hover:text-white">My Bids</Link>
            <span className="font-semibold text-[13px] px-4 py-5 border-b-2 text-white border-[#d0021b]">Watchlist</span>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[rgba(255,255,255,0.1)] rounded-full size-[34px] flex items-center justify-center">
            <span className="font-bold text-[13px] text-white">{user?.name[0] ?? 'B'}</span>
          </div>
          <span className="hidden sm:block font-semibold text-[13px] text-white">{user?.name?.split(' ')[0]}</span>
          <button onClick={logout} className="font-semibold text-[12px] text-[rgba(255,255,255,0.55)] hover:text-white ml-1">Logout</button>
        </div>
      </header>

      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="font-extrabold text-[22px] text-[#0b1f3a]">Watchlist</h1>
            <p className="text-[13px] text-[#6c757d] mt-0.5">Auctions you're keeping an eye on</p>
          </div>
          {watched.length > 0 && (
            <div className="flex gap-3">
              <div className="bg-white border border-[#e9ecef] rounded-[10px] px-4 py-2 text-center">
                <p className="font-extrabold text-[20px] text-[#0b1f3a]">{activeCount}</p>
                <p className="text-[11px] text-[#6c757d]">Active</p>
              </div>
              <div className="bg-white border border-[#e9ecef] rounded-[10px] px-4 py-2 text-center">
                <p className="font-extrabold text-[20px] text-[#343a40]">{watched.length}</p>
                <p className="text-[11px] text-[#6c757d]">Total</p>
              </div>
            </div>
          )}
        </div>

        {watched.length === 0 ? (
          <div className="bg-white border border-[#e9ecef] rounded-[16px] flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="text-[56px] mb-4">❤️</div>
            <h2 className="font-bold text-[18px] text-[#0b1f3a] mb-2">Your watchlist is empty</h2>
            <p className="text-[14px] text-[#6c757d] mb-6 max-w-[320px]">
              Tap the ❤️ heart on any live auction to save it here and track it easily.
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
