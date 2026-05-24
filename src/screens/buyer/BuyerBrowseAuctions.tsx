import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, Heart, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAuction } from '../../context/AuctionContext';
import { useTimer } from '../../hooks/useTimer';
import { BuyerNavbar } from '../../components/ui';
import type { Auction } from '../../types';

const CATEGORIES = ['All', 'Electronics & Gadgets', 'Vehicles', 'Clothing & Fashion', 'Sports & Fitness'];

function AuctionCardSkeleton() {
  return (
    <div className="bg-surface border border-border-light rounded-md overflow-hidden">
      <div className="h-[160px] sm:h-[180px] bg-[#e9ecef] animate-pulse" />
      <div className="p-4">
        <div className="flex gap-1.5 mb-2">
          <div className="h-[18px] w-20 bg-[#e9ecef] rounded-full animate-pulse" />
          <div className="h-[18px] w-14 bg-[#e9ecef] rounded-full animate-pulse" />
        </div>
        <div className="h-4 bg-[#e9ecef] rounded animate-pulse mb-1.5" />
        <div className="h-4 w-3/4 bg-[#e9ecef] rounded animate-pulse mb-4" />
        <div className="flex items-end justify-between">
          <div>
            <div className="h-3 w-16 bg-[#e9ecef] rounded animate-pulse mb-1" />
            <div className="h-5 w-28 bg-[#e9ecef] rounded animate-pulse" />
            <div className="h-3 w-12 bg-[#e9ecef] rounded animate-pulse mt-1" />
          </div>
          <div className="h-8 w-20 bg-[#e9ecef] rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function AuctionCard({ auction }: { auction: Auction }) {
  const navigate = useNavigate();
  const timer = useTimer(auction.endTime);

  return (
    <div
      className="bg-surface border border-border-light rounded-md overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
      onClick={() => navigate(`/buyer/live-bidding/${auction.auctionId}`)}
    >
      <div className="h-[160px] sm:h-[180px] relative overflow-hidden bg-navy">
        <img
          src={auction.imageUrl}
          alt={auction.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(11,31,58,0.35)] to-transparent" />
        {auction.badge && (
          <span className={`absolute top-3 left-3 font-bold text-[10px] text-white px-2 py-1 rounded-full ${auction.badgeColor}`}>
            {auction.badge}
          </span>
        )}
        <span className={`absolute bottom-3 left-3 font-bold text-[11px] px-2 py-1 rounded-md flex items-center gap-1 ${timer.totalSeconds < 3600 ? 'bg-primary text-white' : 'bg-surface/15 backdrop-blur-sm text-white'}`}>
          {timer.isExpired ? 'Closed' : timer.display}
        </span>
        <button
          onClick={e => e.stopPropagation()}
          className="absolute top-3 right-3 bg-surface rounded-full w-[30px] h-[30px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:scale-110 cursor-pointer"
        >
          <Heart size={14} className="text-primary" />
        </button>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="bg-surface-raised font-medium text-[10px] text-muted px-2 py-[3px] rounded-full">{auction.category}</span>
          <span className="bg-surface-raised font-medium text-[10px] text-muted px-2 py-[3px] rounded-full">{auction.condition}</span>
        </div>
        <h3 className="font-bold text-[13px] text-navy leading-[19px] mb-3 line-clamp-2">{auction.title}</h3>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] text-muted mb-[2px]">Current bid</p>
            <p className="font-extrabold text-[17px] text-primary leading-none">PKR {auction.currentBid.toLocaleString()}</p>
            <p className="text-[10px] text-placeholder mt-1">{auction.bidCount} bids</p>
          </div>
          <button className="flex items-center gap-1 font-bold text-[12px] text-primary bg-primary-surface px-3 py-1.5 rounded-lg hover:bg-[#ffe0e4] transition-colors cursor-pointer">
            Bid Now <ChevronRight size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BuyerBrowseAuctions() {
  const { user, logout } = useAuth();
  const { auctions } = useAuction();
  const [search, setSearch]             = useState('');
  const [category, setCategory]         = useState('All');
  const [showEndingSoon, setShowEndingSoon] = useState(false);
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  const filtered = auctions.filter(a => {
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (category !== 'All' && !a.category.includes(category.split('&')[0].trim())) return false;
    if (showEndingSoon && !a.badge?.includes('Ending')) return false;
    return true;
  });

  const FilterCheckbox = ({ checked, onClick }: { checked: boolean; onClick: () => void }) => (
    <div
      onClick={onClick}
      className={`w-[14px] h-[14px] rounded-[3px] border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer ${checked ? 'bg-primary border-primary' : 'border-[#dee2e6]'}`}
    >
      {checked && <svg className="h-[5px] w-[7px]" viewBox="0 0 7 5" fill="none"><path d="M0.5 2.5L2.5 4.5L6.5 0.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" /></svg>}
    </div>
  );

  return (
    <div className="min-h-screen bg-bg">
      <BuyerNavbar userName={user?.name} onLogout={logout} />

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:block bg-surface border-r border-border-light w-[220px] shrink-0 sticky top-14 self-start max-h-[calc(100vh-56px)] overflow-y-auto p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[13px] text-navy flex items-center gap-1.5">
              <SlidersHorizontal size={13} strokeWidth={2.5} /> Filters
            </h3>
            <button onClick={() => { setCategory('All'); setShowEndingSoon(false); setSearch(''); }} className="text-[11px] text-primary font-bold hover:underline cursor-pointer">
              Clear All
            </button>
          </div>
          <div className="mb-5">
            <p className="font-bold text-[11px] text-placeholder tracking-wide uppercase mb-3">Category</p>
            <div className="flex flex-col gap-2">
              {CATEGORIES.map(c => (
                <label key={c} className="flex items-center gap-2 cursor-pointer">
                  <FilterCheckbox checked={category === c} onClick={() => setCategory(c)} />
                  <span className={`text-[12.5px] ${category === c ? 'font-bold text-secondary' : 'text-muted'}`}>{c}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="font-bold text-[11px] text-placeholder tracking-wide uppercase mb-3">Status</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <FilterCheckbox checked={showEndingSoon} onClick={() => setShowEndingSoon(p => !p)} />
              <span className="text-[12.5px] text-muted">Ending Soon</span>
            </label>
          </div>
        </aside>

        <main className="flex-1 p-4 sm:p-6 min-w-0">
          {/* Mobile search + filter */}
          <div className="md:hidden flex gap-2 mb-4">
            <div className="relative flex-1">
              <input
                className="bg-surface border border-[#dee2e6] h-[42px] pl-[38px] pr-4 rounded-lg text-[13px] w-full outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(208,2,27,0.08)] transition-shadow"
                placeholder="Search auctions…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <Search size={16} className="absolute left-3 top-[13px] text-placeholder" />
            </div>
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className="bg-surface border border-[#dee2e6] h-[42px] px-3 rounded-lg flex items-center gap-2 font-semibold text-[13px] text-secondary shrink-0 cursor-pointer"
            >
              <SlidersHorizontal size={15} strokeWidth={2} /> Filters
            </button>
          </div>

          {/* Mobile filter panel */}
          {sidebarOpen && (
            <div className="md:hidden bg-surface border border-border-light rounded-md p-4 mb-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-[13px] text-navy">Filters</h3>
                <button onClick={() => { setCategory('All'); setShowEndingSoon(false); }} className="text-[11px] text-primary font-bold cursor-pointer">Clear All</button>
              </div>
              <p className="font-bold text-[11px] text-placeholder uppercase tracking-wide mb-2">Category</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {CATEGORIES.map(c => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`px-3 py-1 rounded-full text-[12px] font-semibold border transition-colors cursor-pointer ${category === c ? 'bg-primary text-white border-primary' : 'bg-surface text-muted border-border-light'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <FilterCheckbox checked={showEndingSoon} onClick={() => setShowEndingSoon(p => !p)} />
                <span className="text-[12.5px] text-muted">Ending Soon</span>
              </label>
            </div>
          )}

          {/* Desktop title + search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h1 className="font-extrabold text-[20px] sm:text-[22px] text-navy">Live Auctions</h1>
              <p className="text-[12px] sm:text-[13px] text-muted">{filtered.length} auction{filtered.length !== 1 ? 's' : ''} found</p>
            </div>
            <div className="relative hidden md:block">
              <input
                className="bg-surface border border-[#dee2e6] h-[40px] pl-[38px] pr-4 rounded-lg text-[13px] text-secondary w-[240px] outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(208,2,27,0.08)] transition-shadow"
                placeholder="Search auctions…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <Search size={16} className="absolute left-3 top-[12px] text-placeholder" />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <AuctionCardSkeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="bg-surface-raised rounded-full p-5">
                <Search size={40} strokeWidth={1.3} className="text-placeholder" />
              </div>
              <p className="font-bold text-[16px] text-secondary">No auctions found</p>
              <p className="text-[13px] text-muted">Try adjusting your search or filters</p>
              <button onClick={() => { setSearch(''); setCategory('All'); setShowEndingSoon(false); }} className="mt-1 font-bold text-[13px] text-primary hover:underline cursor-pointer">
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
