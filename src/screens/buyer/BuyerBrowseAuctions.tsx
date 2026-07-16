import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, Heart, ChevronRight, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAuction } from '../../context/AuctionContext';
import { useTimer } from '../../hooks/useTimer';
import { BuyerNavbar } from '../../components/ui';
import Button from '../../components/ui/Button';
import type { Auction } from '../../types';

// Kept in sync with SellerCreateListingStep1.tsx CATEGORIES
const CATEGORIES = ['All', 'Electronics & Gadgets', 'Vehicles', 'Clothing & Fashion', 'Books & Education', 'Home & Furniture', 'Sports & Fitness', 'Art & Collectibles'];

const SORT_OPTIONS = [
  { value: 'endingSoon', label: 'Ending Soon' },
  { value: 'newlyListed', label: 'Newly Listed' },
  { value: 'priceLow', label: 'Price: Low to High' },
  { value: 'priceHigh', label: 'Price: High to Low' },
  { value: 'mostBids', label: 'Most Bids' },
] as const;
type SortBy = typeof SORT_OPTIONS[number]['value'];

const FilterCheckbox = ({ checked, onClick, label }: { checked: boolean; onClick: () => void; label: string }) => (
  <label className="flex items-center gap-2.5 cursor-pointer group">
    <span className="relative flex">
      <input type="checkbox" checked={checked} onChange={onClick} className="sr-only peer" />
      <span className={`w-[14px] h-[14px] rounded-xs border-2 flex items-center justify-center transition-colors ${checked ? 'bg-primary border-primary' : 'border-border-strong group-hover:border-primary/50'}`}>
        {checked && <Check size={9} strokeWidth={3} className="text-white" />}
      </span>
    </span>
    <span className="text-sm text-body">{label}</span>
  </label>
);

function AuctionCardSkeleton() {
  return (
    <div className="bg-surface border border-border-light rounded-md overflow-hidden">
      <div className="h-[160px] sm:h-[180px] bg-border-light animate-pulse" />
      <div className="p-4">
        <div className="flex gap-1.5 mb-2">
          <div className="h-[18px] w-20 bg-border-light rounded-full animate-pulse" />
          <div className="h-[18px] w-14 bg-border-light rounded-full animate-pulse" />
        </div>
        <div className="h-4 bg-border-light rounded animate-pulse mb-1.5" />
        <div className="h-4 w-3/4 bg-border-light rounded animate-pulse mb-4" />
        <div className="flex items-end justify-between">
          <div>
            <div className="h-3 w-16 bg-border-light rounded animate-pulse mb-1" />
            <div className="h-5 w-28 bg-border-light rounded animate-pulse" />
            <div className="h-3 w-12 bg-border-light rounded animate-pulse mt-1" />
          </div>
          <div className="h-8 w-20 bg-border-light rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function AuctionCard({ auction }: { auction: Auction }) {
  const navigate = useNavigate();
  const timer = useTimer(auction.endTime);
  const { toggleWatchlist, isWatched } = useAuction();
  const watched = isWatched(auction.auctionId);
  const isEndingSoon = timer.hours === 0 && timer.minutes < 60 && !timer.isExpired;
  const isFinalMinutes = timer.hours === 0 && timer.minutes < 5 && !timer.isExpired;

  return (
    <div
      role="button"
      tabIndex={0}
      className="bg-surface border border-border-light rounded-md overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer group"
      onClick={() => navigate(`/buyer/live-bidding/${auction.auctionId}`)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate(`/buyer/live-bidding/${auction.auctionId}`); }}
    >
      <div className="h-[160px] sm:h-[180px] relative overflow-hidden bg-navy">
        <img
          src={auction.imageUrl}
          alt={auction.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(11,31,58,0.35)] to-transparent" />
        <span className={`absolute bottom-3 left-3 font-bold text-[11px] px-2 py-1 rounded-md flex items-center gap-2 ${timer.totalSeconds < 3600 ? 'bg-primary text-white' : 'bg-surface/15 backdrop-blur-sm text-white'}`}>
          <span>{timer.isExpired ? 'Closed' : timer.display}</span>
          {isFinalMinutes ? (
            <span className="inline-flex items-center gap-1 text-primary text-[9px] font-bold uppercase tracking-[0.3px]">
              <span className="size-2 rounded-full bg-primary animate-countdown-pulse" />
              Ending
            </span>
          ) : isEndingSoon ? (
            <span className="inline-flex items-center rounded-full bg-warning-bg text-warning px-2 py-[2px] text-[9px] font-bold">
              Ending Soon
            </span>
          ) : null}
        </span>
        <button
          onClick={e => { e.stopPropagation(); toggleWatchlist(auction.auctionId); }}
          aria-label={watched ? 'Remove from watchlist' : 'Add to watchlist'}
          aria-pressed={watched}
          className={`absolute top-3 right-3 rounded-full w-[30px] h-[30px] flex items-center justify-center shadow-sm hover:scale-110 transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${watched ? 'bg-primary text-white' : 'bg-surface/80 text-muted hover:text-primary'}`}
        >
          <Heart size={14} className={watched ? 'text-white' : 'text-muted'} fill={watched ? 'currentColor' : 'none'} />
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
          <Button
            size="sm"
            onClick={e => { e.stopPropagation(); navigate(`/buyer/live-bidding/${auction.auctionId}`); }}
          >
            Bid Now <ChevronRight size={11} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function BuyerBrowseAuctions() {
  const { user, logout } = useAuth();
  const { auctions, auctionsLoaded, auctionsError } = useAuction();
  const [search, setSearch]             = useState('');
  const [category, setCategory]         = useState('All');
  const [showEndingSoon, setShowEndingSoon] = useState(false);
  const [minPrice, setMinPrice]         = useState('');
  const [maxPrice, setMaxPrice]         = useState('');
  const [sortBy, setSortBy]             = useState<SortBy>('endingSoon');
  const [sidebarOpen, setSidebarOpen]   = useState(false);

  const clearAll = () => {
    setCategory('All'); setShowEndingSoon(false); setSearch(''); setMinPrice(''); setMaxPrice('');
  };

  const handlePriceChange = (setter: (v: string) => void) => (value: string) => {
    if (value.trim() === '') { setter(''); return; }
    const num = Math.max(0, Math.floor(Number(value) || 0));
    setter(String(num));
  };

  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const min = minPrice.trim() === '' ? null : Number(minPrice);
  const max = maxPrice.trim() === '' ? null : Number(maxPrice);
  const priceRangeInvalid = min !== null && max !== null && min > max;
  const filtered = auctions.filter(a => {
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (category !== 'All' && a.category !== category) return false;  // BA-06: exact match (categories now in sync)
    if (showEndingSoon) {
      const msLeft = new Date(a.endTime).getTime() - now;  // BA-01: live time, not mount snapshot
      if (msLeft <= 0 || msLeft > 3_600_000) return false;
    }
    if (!priceRangeInvalid) {
      if (min !== null && a.currentBid < min) return false;
      if (max !== null && a.currentBid > max) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'priceLow':    return a.currentBid - b.currentBid;
      case 'priceHigh':   return b.currentBid - a.currentBid;
      case 'mostBids':    return b.bidCount - a.bidCount;
      case 'newlyListed': return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
      case 'endingSoon':
      default:            return new Date(a.endTime).getTime() - new Date(b.endTime).getTime();
    }
  });

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
            <button onClick={clearAll} className="text-[11px] text-primary font-bold hover:underline cursor-pointer">
              Clear All
            </button>
          </div>
          <div className="mb-5">
            <p className="font-bold text-[11px] text-placeholder tracking-wide uppercase mb-3">Category</p>
            <div className="flex flex-col gap-2">
              {CATEGORIES.map(c => (
                <FilterCheckbox key={c} checked={category === c} onClick={() => setCategory(c)} label={c} />
              ))}
            </div>
          </div>
          <div className="mb-5">
            <p className="font-bold text-[11px] text-placeholder tracking-wide uppercase mb-3">Price Range (PKR)</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                placeholder="Min"
                value={minPrice}
                onChange={e => handlePriceChange(setMinPrice)(e.target.value)}
                className="w-full bg-bg border border-border-light rounded-sm px-2 py-1.5 text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <span className="text-[11px] text-placeholder">–</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                placeholder="Max"
                value={maxPrice}
                onChange={e => handlePriceChange(setMaxPrice)(e.target.value)}
                className="w-full bg-bg border border-border-light rounded-sm px-2 py-1.5 text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
            {priceRangeInvalid && (
              <p className="text-[10px] text-error mt-1.5">Min price is greater than max — showing all prices.</p>
            )}
          </div>
          <div>
            <p className="font-bold text-[11px] text-placeholder tracking-wide uppercase mb-3">Status</p>
            <FilterCheckbox checked={showEndingSoon} onClick={() => setShowEndingSoon(p => !p)} label="Ending Soon" />
          </div>
        </aside>

        <main className="flex-1 p-4 sm:p-6 min-w-0">
          {/* Mobile search + filter */}
          <div className="md:hidden flex gap-2 mb-4">
            <div className="relative flex-1">
              <input
                className="bg-surface border border-border-medium h-[42px] pl-[38px] pr-4 rounded-lg text-[13px] w-full outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow"
                placeholder="Search auctions…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <Search size={16} className="absolute left-3 top-[13px] text-placeholder" />
            </div>
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className="bg-surface border border-border-medium h-[42px] px-3 rounded-lg flex items-center gap-2 font-semibold text-[13px] text-secondary shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <SlidersHorizontal size={15} strokeWidth={2} /> Filters
            </button>
          </div>

          {/* Mobile filter panel */}
          {sidebarOpen && (
            <div className="md:hidden bg-surface border border-border-light rounded-md p-4 mb-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-[13px] text-navy">Filters</h3>
                <button onClick={clearAll} className="text-[11px] text-primary font-bold cursor-pointer">Clear All</button>
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
              <p className="font-bold text-[11px] text-placeholder uppercase tracking-wide mb-2">Price Range (PKR)</p>
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  placeholder="Min"
                  value={minPrice}
                  onChange={e => handlePriceChange(setMinPrice)(e.target.value)}
                  className="w-full bg-bg border border-border-light rounded-sm px-2 py-1.5 text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
                <span className="text-[11px] text-placeholder">–</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  placeholder="Max"
                  value={maxPrice}
                  onChange={e => handlePriceChange(setMaxPrice)(e.target.value)}
                  className="w-full bg-bg border border-border-light rounded-sm px-2 py-1.5 text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
              {priceRangeInvalid && (
                <p className="text-[10px] text-error mb-2">Min price is greater than max — showing all prices.</p>
              )}
              <FilterCheckbox checked={showEndingSoon} onClick={() => setShowEndingSoon(p => !p)} label="Ending Soon" />
            </div>
          )}

          {/* Desktop title + search + sort */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h1 className="font-extrabold text-[20px] sm:text-[22px] text-navy">Live Auctions</h1>
              <p className="text-[12px] sm:text-[13px] text-muted">{sorted.length} auction{sorted.length !== 1 ? 's' : ''} found</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortBy)}
                aria-label="Sort auctions by"
                className="bg-surface border border-border-medium h-[40px] px-3 rounded-lg text-[13px] text-secondary outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <div className="relative hidden md:block">
                <input
                  className="bg-surface border border-border-medium h-[40px] pl-[38px] pr-4 rounded-lg text-[13px] text-secondary w-[240px] outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow"
                  placeholder="Search auctions…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <Search size={16} className="absolute left-3 top-[12px] text-placeholder" />
              </div>
            </div>
          </div>

          {!auctionsLoaded ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <AuctionCardSkeleton key={i} />)}
            </div>
          ) : auctionsError ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="bg-surface-raised rounded-full p-5">
                <Search size={40} strokeWidth={1.3} className="text-error" />
              </div>
              <p className="font-bold text-[16px] text-secondary">Could not load auctions</p>
              <p className="text-[13px] text-muted">Check your connection and try refreshing the page</p>
              <Button variant="ghost" onClick={() => window.location.reload()} className="mt-1">
                Refresh
              </Button>
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="bg-surface-raised rounded-full p-5">
                <Search size={40} strokeWidth={1.3} className="text-placeholder" />
              </div>
              <p className="font-bold text-[16px] text-secondary">No auctions found</p>
              <p className="text-[13px] text-muted">Try adjusting your search or filters</p>
              <Button variant="ghost" onClick={clearAll} className="mt-1">
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sorted.map(a => <AuctionCard key={a.auctionId} auction={a} />)}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
