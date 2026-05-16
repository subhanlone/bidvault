import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAuction } from '../../context/AuctionContext';
import { useTimer } from '../../hooks/useTimer';
import { IconBidVaultLogo, IconSearch, IconFilter, IconHeart, IconChevronRight } from '../../components/Icons';
import type { Auction } from '../../types';

const CATEGORIES = ['All', 'Electronics & Gadgets', 'Vehicles', 'Clothing & Fashion', 'Sports & Fitness'];

function BuyerNav() {
  const { user, logout } = useAuth();
  return (
    <header className="bg-[#0b1f3a] flex items-center justify-between px-8 py-0">
      <div className="flex items-center gap-8">
        <div className="flex gap-[10px] items-center py-4">
          <div className="bg-[#d0021b] flex items-center justify-center rounded-[8px] size-[34px]">
            <IconBidVaultLogo className="size-[18px]" />
          </div>
          <span className="font-extrabold text-[20px] text-white tracking-[-0.3px]">
            Bid<span className="text-[#d0021b]">Vault</span>
          </span>
        </div>
        <nav className="flex">
          <span className="font-semibold text-[13px] px-4 py-5 border-b-2 text-white border-[#d0021b]">Browse Auctions</span>
          <Link to="/buyer/my-bids" className="font-semibold text-[13px] px-4 py-5 border-b-2 text-[rgba(255,255,255,0.55)] border-transparent hover:text-white">My Bids</Link>
          <Link to="/buyer/watchlist" className="font-semibold text-[13px] px-4 py-5 border-b-2 text-[rgba(255,255,255,0.55)] border-transparent hover:text-white">Watchlist</Link>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <div className="bg-[rgba(255,255,255,0.1)] rounded-full size-[34px] flex items-center justify-center">
          <span className="font-bold text-[13px] text-white">{user?.name[0] ?? 'B'}</span>
        </div>
        <span className="font-semibold text-[13px] text-white">{user?.name?.split(' ')[0] ?? 'Buyer'}</span>
        <button onClick={logout} className="font-semibold text-[12px] text-[rgba(255,255,255,0.55)] hover:text-white ml-2">Logout</button>
      </div>
    </header>
  );
}

function AuctionCard({ auction }: { auction: Auction }) {
  const navigate = useNavigate();
  const timer = useTimer(auction.endTime);

  return (
    <div
      className="bg-white border border-[#e9ecef] rounded-[12px] overflow-hidden hover:shadow-[0px_4px_16px_rgba(11,31,58,0.1)] transition-all cursor-pointer group"
      onClick={() => navigate(`/buyer/live-bidding/${auction.auctionId}`)}
    >
      <div className="h-[160px] relative overflow-hidden bg-[#0b1f3a]">
        <img
          src={auction.imageUrl}
          alt={auction.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        {auction.badge && (
          <span className={`absolute top-3 left-3 font-bold text-[10px] text-white px-2 py-1 rounded-[99px] ${auction.badgeColor}`}>
            {auction.badge}
          </span>
        )}
        <button onClick={e => e.stopPropagation()} className="absolute top-3 right-3 bg-white rounded-full size-[30px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <IconHeart className="size-[14px]" />
        </button>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-[#e9ecef] font-medium text-[10px] text-[#6c757d] px-2 py-[2px] rounded-[99px]">{auction.category}</span>
          <span className="bg-[#e9ecef] font-medium text-[10px] text-[#6c757d] px-2 py-[2px] rounded-[99px]">{auction.condition}</span>
        </div>
        <h3 className="font-bold text-[13px] text-[#0b1f3a] leading-[19px] mb-3 line-clamp-2">{auction.title}</h3>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] text-[#6c757d]">Current bid</p>
            <p className="font-extrabold text-[16px] text-[#d0021b]">PKR {auction.currentBid.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#6c757d]">{timer.isExpired ? 'Ended' : 'Ends in'}</p>
            <p className={`font-bold text-[14px] ${timer.totalSeconds < 3600 ? 'text-[#d0021b]' : 'text-[#343a40]'}`}>
              {timer.isExpired ? 'Closed' : timer.display}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[#6c757d]">{auction.bidCount} bids</span>
          <button className="flex items-center gap-1 font-bold text-[12px] text-[#d0021b]">
            Bid Now <IconChevronRight className="size-[12px]" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BuyerBrowseAuctions() {
  const { auctions } = useAuction();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [showEndingSoon, setShowEndingSoon] = useState(false);

  const filtered = auctions.filter(a => {
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (category !== 'All' && !a.category.includes(category.split('&')[0].trim())) return false;
    if (showEndingSoon && !a.badge?.includes('Ending')) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <BuyerNav />

      <div className="flex">
        {/* Sidebar filters */}
        <aside className="bg-white border-r border-[#e9ecef] w-[220px] shrink-0 min-h-[calc(100vh-64px)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[13px] text-[#0b1f3a]">
              <IconFilter className="inline size-[14px] mr-1" /> Filters
            </h3>
            <button onClick={() => { setCategory('All'); setShowEndingSoon(false); setSearch(''); }} className="text-[12px] text-[#d0021b] font-bold">Clear All</button>
          </div>

          <div className="mb-5">
            <p className="font-bold text-[11px] text-[#adb5bd] tracking-[0.5px] uppercase mb-3">Category</p>
            <div className="flex flex-col gap-2">
              {CATEGORIES.map(c => (
                <label key={c} className="flex items-center gap-2 cursor-pointer" onClick={() => setCategory(c)}>
                  <div className={`size-[14px] rounded-[3px] border-2 flex items-center justify-center shrink-0 ${category === c ? 'bg-[#d0021b] border-[#d0021b]' : 'border-[#dee2e6]'}`}>
                    {category === c && <svg className="h-[5px] w-[7px]" viewBox="0 0 7 5" fill="none"><path d="M0.5 2.5L2.5 4.5L6.5 0.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" /></svg>}
                  </div>
                  <span className={`text-[12.5px] ${category === c ? 'font-bold text-[#343a40]' : 'text-[#6c757d]'}`}>{c}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <p className="font-bold text-[11px] text-[#adb5bd] tracking-[0.5px] uppercase mb-3">Auction Status</p>
            <label className="flex items-center gap-2 cursor-pointer" onClick={() => setShowEndingSoon(p => !p)}>
              <div className={`size-[14px] rounded-[3px] border-2 flex items-center justify-center shrink-0 ${showEndingSoon ? 'bg-[#d0021b] border-[#d0021b]' : 'border-[#dee2e6]'}`}>
                {showEndingSoon && <svg className="h-[5px] w-[7px]" viewBox="0 0 7 5" fill="none"><path d="M0.5 2.5L2.5 4.5L6.5 0.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" /></svg>}
              </div>
              <span className="text-[12.5px] text-[#6c757d]">Ending Soon</span>
            </label>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="font-extrabold text-[22px] text-[#0b1f3a]">Live Auctions</h1>
              <p className="text-[13px] text-[#6c757d]">{filtered.length} auction{filtered.length !== 1 ? 's' : ''} found</p>
            </div>
            <div className="relative">
              <input
                className="bg-white border border-[#dee2e6] h-[40px] pl-[38px] pr-4 rounded-[8px] text-[13px] text-[#343a40] w-[240px] outline-none focus:border-[#d0021b]"
                placeholder="Search auctions…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <IconSearch className="absolute left-[12px] top-[12px] size-[16px]" color="#adb5bd" />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <p className="text-[40px]">🔍</p>
              <p className="font-bold text-[16px] text-[#343a40]">No auctions found</p>
              <p className="text-[13px] text-[#6c757d]">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {filtered.map(a => <AuctionCard key={a.auctionId} auction={a} />)}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
