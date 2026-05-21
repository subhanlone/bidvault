import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useAuction } from '../../context/AuctionContext';
import { useTimer } from '../../hooks/useTimer';
import { IconSearch, IconHeart, IconChevronRight } from '../../components/Icons';
import { BuyerNav } from '../../components/BuyerNav';
import type { Auction } from '../../types';

const CATEGORIES = ['All', 'Electronics & Gadgets', 'Vehicles', 'Clothing & Fashion', 'Sports & Fitness'];

function AuctionCard({ auction }: { auction: Auction }) {
  const navigate = useNavigate();
  const timer = useTimer(auction.endTime);

  return (
    <div
      className="bg-white border border-[#e9ecef] rounded-[14px] overflow-hidden hover:shadow-[0_8px_28px_rgba(11,31,58,0.12)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
      onClick={() => navigate(`/buyer/live-bidding/${auction.auctionId}`)}
    >
      <div className="h-[160px] sm:h-[180px] relative overflow-hidden bg-[#0b1f3a]">
        <img
          src={auction.imageUrl}
          alt={auction.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(11,31,58,0.35)] to-transparent" />
        {auction.badge && (
          <span className={`absolute top-3 left-3 font-bold text-[10px] text-white px-2 py-1 rounded-[99px] ${auction.badgeColor}`}>
            {auction.badge}
          </span>
        )}
        {/* Timer badge */}
        <span className={`absolute bottom-3 left-3 font-bold text-[11px] px-2 py-1 rounded-[6px] flex items-center gap-1 ${timer.totalSeconds < 3600 ? 'bg-[#d0021b] text-white' : 'bg-[rgba(255,255,255,0.15)] backdrop-blur-sm text-white'}`}>
          {timer.isExpired ? 'Closed' : timer.display}
        </span>
        <button
          onClick={e => e.stopPropagation()}
          className="absolute top-3 right-3 bg-white rounded-full size-[30px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:scale-110"
        >
          <IconHeart className="size-[14px]" />
        </button>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="bg-[#f1f3f5] font-medium text-[10px] text-[#6c757d] px-2 py-[3px] rounded-[99px]">{auction.category}</span>
          <span className="bg-[#f1f3f5] font-medium text-[10px] text-[#6c757d] px-2 py-[3px] rounded-[99px]">{auction.condition}</span>
        </div>
        <h3 className="font-bold text-[13px] text-[#0b1f3a] leading-[19px] mb-3 line-clamp-2">{auction.title}</h3>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] text-[#6c757d] mb-[2px]">Current bid</p>
            <p className="font-extrabold text-[17px] text-[#d0021b] leading-none">PKR {auction.currentBid.toLocaleString()}</p>
            <p className="text-[10px] text-[#adb5bd] mt-1">{auction.bidCount} bids</p>
          </div>
          <button className="flex items-center gap-1 font-bold text-[12px] text-[#d0021b] bg-[#fff0f2] px-3 py-1.5 rounded-[8px] hover:bg-[#ffe0e4] transition-colors">
            Bid Now <IconChevronRight className="size-[11px]" />
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filtered = auctions.filter(a => {
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (category !== 'All' && !a.category.includes(category.split('&')[0].trim())) return false;
    if (showEndingSoon && !a.badge?.includes('Ending')) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <BuyerNav active="Browse" />

      <div className="flex">
        {/* Sidebar — desktop only */}
        <aside className="hidden md:block bg-white border-r border-[#e9ecef] w-[220px] shrink-0 sticky top-[60px] self-start max-h-[calc(100vh-60px)] overflow-y-auto p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[13px] text-[#0b1f3a] flex items-center gap-1.5">
              <SlidersHorizontal size={13} strokeWidth={2.5} /> Filters
            </h3>
            <button onClick={() => { setCategory('All'); setShowEndingSoon(false); setSearch(''); }} className="text-[11px] text-[#d0021b] font-bold hover:underline">
              Clear All
            </button>
          </div>

          <div className="mb-5">
            <p className="font-bold text-[11px] text-[#adb5bd] tracking-[0.5px] uppercase mb-3">Category</p>
            <div className="flex flex-col gap-2">
              {CATEGORIES.map(c => (
                <label key={c} className="flex items-center gap-2 cursor-pointer" onClick={() => setCategory(c)}>
                  <div className={`size-[14px] rounded-[3px] border-2 flex items-center justify-center shrink-0 transition-colors ${category === c ? 'bg-[#d0021b] border-[#d0021b]' : 'border-[#dee2e6]'}`}>
                    {category === c && <svg className="h-[5px] w-[7px]" viewBox="0 0 7 5" fill="none"><path d="M0.5 2.5L2.5 4.5L6.5 0.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" /></svg>}
                  </div>
                  <span className={`text-[12.5px] ${category === c ? 'font-bold text-[#343a40]' : 'text-[#6c757d]'}`}>{c}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="font-bold text-[11px] text-[#adb5bd] tracking-[0.5px] uppercase mb-3">Status</p>
            <label className="flex items-center gap-2 cursor-pointer" onClick={() => setShowEndingSoon(p => !p)}>
              <div className={`size-[14px] rounded-[3px] border-2 flex items-center justify-center shrink-0 transition-colors ${showEndingSoon ? 'bg-[#d0021b] border-[#d0021b]' : 'border-[#dee2e6]'}`}>
                {showEndingSoon && <svg className="h-[5px] w-[7px]" viewBox="0 0 7 5" fill="none"><path d="M0.5 2.5L2.5 4.5L6.5 0.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" /></svg>}
              </div>
              <span className="text-[12.5px] text-[#6c757d]">Ending Soon</span>
            </label>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 sm:p-6 min-w-0">

          {/* Mobile: search + filter button row */}
          <div className="md:hidden flex gap-2 mb-4">
            <div className="relative flex-1">
              <input
                className="bg-white border border-[#dee2e6] h-[42px] pl-[38px] pr-4 rounded-[8px] text-[13px] w-full outline-none focus:border-[#d0021b] focus:shadow-[0_0_0_3px_rgba(208,2,27,0.08)] transition-shadow"
                placeholder="Search auctions…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <IconSearch className="absolute left-[12px] top-[13px] size-[16px]" color="#adb5bd" />
            </div>
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className="bg-white border border-[#dee2e6] h-[42px] px-3 rounded-[8px] flex items-center gap-2 font-semibold text-[13px] text-[#343a40] shrink-0"
            >
              <SlidersHorizontal size={15} strokeWidth={2} /> Filters
            </button>
          </div>

          {/* Mobile filter drawer */}
          {sidebarOpen && (
            <div className="md:hidden bg-white border border-[#e9ecef] rounded-[12px] p-4 mb-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-[13px] text-[#0b1f3a]">Filters</h3>
                <button onClick={() => { setCategory('All'); setShowEndingSoon(false); }} className="text-[11px] text-[#d0021b] font-bold">Clear All</button>
              </div>
              <p className="font-bold text-[11px] text-[#adb5bd] uppercase tracking-[0.5px] mb-2">Category</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {CATEGORIES.map(c => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`px-3 py-1 rounded-full text-[12px] font-semibold border transition-colors ${category === c ? 'bg-[#d0021b] text-white border-[#d0021b]' : 'bg-white text-[#6c757d] border-[#e9ecef]'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 cursor-pointer" onClick={() => setShowEndingSoon(p => !p)}>
                <div className={`size-[14px] rounded-[3px] border-2 flex items-center justify-center shrink-0 ${showEndingSoon ? 'bg-[#d0021b] border-[#d0021b]' : 'border-[#dee2e6]'}`}>
                  {showEndingSoon && <svg className="h-[5px] w-[7px]" viewBox="0 0 7 5" fill="none"><path d="M0.5 2.5L2.5 4.5L6.5 0.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" /></svg>}
                </div>
                <span className="text-[12.5px] text-[#6c757d]">Ending Soon</span>
              </label>
            </div>
          )}

          {/* Desktop: title + search row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h1 className="font-extrabold text-[20px] sm:text-[22px] text-[#0b1f3a]">Live Auctions</h1>
              <p className="text-[12px] sm:text-[13px] text-[#6c757d]">{filtered.length} auction{filtered.length !== 1 ? 's' : ''} found</p>
            </div>
            <div className="relative hidden md:block">
              <input
                className="bg-white border border-[#dee2e6] h-[40px] pl-[38px] pr-4 rounded-[8px] text-[13px] text-[#343a40] w-[240px] outline-none focus:border-[#d0021b] focus:shadow-[0_0_0_3px_rgba(208,2,27,0.08)] transition-shadow"
                placeholder="Search auctions…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <IconSearch className="absolute left-[12px] top-[12px] size-[16px]" color="#adb5bd" />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="bg-[#f1f3f5] rounded-full p-5">
                <Search size={40} strokeWidth={1.3} className="text-[#adb5bd]" />
              </div>
              <p className="font-bold text-[16px] text-[#343a40]">No auctions found</p>
              <p className="text-[13px] text-[#6c757d]">Try adjusting your search or filters</p>
              <button onClick={() => { setSearch(''); setCategory('All'); setShowEndingSoon(false); }} className="mt-1 font-bold text-[13px] text-[#d0021b] hover:underline">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(a => <AuctionCard key={a.auctionId} auction={a} />)}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
