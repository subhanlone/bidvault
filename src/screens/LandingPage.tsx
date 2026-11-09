import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Clock, Gavel, Users, Banknote, Star, MapPin, Lock, Zap, BarChart2, Hammer } from 'lucide-react';
import { useTimer } from '../hooks/useTimer';
import { useTabKeys } from '../hooks/useTabKeys';
import type { Auction } from '../types/api';
import { Button, AuctionThumbnail } from '../components/ui';
import { api } from '../services/api';
import { useAuth } from '../context/auth';
import { conditionLabel, count, locatedIn, pkr } from '../utils/format';
import LoadingStatus from '../components/ui/LoadingStatus';
import { BROWSE_CATEGORIES } from '../config/categories';
import { useSignInLink } from '../hooks/useSignInLink';
import { useAuctionFacets } from '../queries/auctions';
import { NO_FILTERS } from '../utils/browseParams';

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M+`;
  if (n >= 1_000) return `${Math.floor(n / 1_000)}K+`;
  return `${n}`;
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `PKR ${(n / 1_000_000).toFixed(1)}M+`;
  if (n >= 1_000) return `PKR ${Math.floor(n / 1_000)}K+`;
  return pkr(n);
}

function EndingSoonCard({ auction }: { auction: Auction }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const timer = useTimer(auction.endTime);
  const open = () => navigate(`/auctions/${auction.auctionId}`);

  return (
    <article
      onClick={open}
      className="bg-surface border border-border-light rounded-lg overflow-hidden hover:shadow-[0_8px_32px_rgba(11,31,58,0.12)] hover:-translate-y-1 transition-all duration-200 flex flex-col cursor-pointer"
    >
      <div className="h-[160px] sm:h-[180px] relative overflow-hidden bg-navy">
        <AuctionThumbnail
          src={auction.imageUrl}
          alt={auction.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          iconSize={28}
        />
        <span className={`absolute top-3 right-3 font-bold text-[11px] px-2 py-1 rounded-sm flex items-center gap-1 ${timer.totalSeconds < 3600 ? 'bg-primary text-white' : 'bg-[rgba(11,31,58,0.7)] text-white'}`}>
          <Clock size={10} strokeWidth={2.5} aria-hidden="true" /> {timer.display}
        </span>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-surface-raised font-medium text-[11px] text-muted px-2 py-[3px] rounded-full">{auction.category}</span>
          <span className="bg-surface-raised font-medium text-[11px] text-muted px-2 py-[3px] rounded-full">
            {conditionLabel(auction.condition)}
          </span>
        </div>
        <h3 className="font-bold text-[14px] text-navy mb-1 leading-[20px] line-clamp-2">
          <Link to={`/auctions/${auction.auctionId}`} onClick={(e) => e.stopPropagation()} className="text-navy no-underline hover:underline">
            {auction.title}
          </Link>
        </h3>
        {locatedIn(auction.sellerCity, auction.sellerProvince) && (
          <p className="text-[11px] text-muted mb-3">{locatedIn(auction.sellerCity, auction.sellerProvince)}</p>
        )}
        <div className="flex items-end justify-between mt-auto pt-2">
          <div>
            <p className="text-[11px] text-muted mb-[2px]">Current Bid</p>
            <p className="font-extrabold text-[20px] text-primary leading-none">{pkr(auction.currentBid)}</p>
            <p className="text-[11px] text-placeholder mt-1">{count(auction.bidCount, 'bid')}</p>
          </div>
          <Button
            variant="primary"
            size="sm"
            aria-label={`${user ? 'Bid on' : 'View'} ${auction.title}`}
            onClick={(e) => { e.stopPropagation(); open(); }}
            className="text-[13px]"
          >
            {user ? 'Bid Now' : 'View'}
          </Button>
        </div>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-surface border border-border-light rounded-lg overflow-hidden flex flex-col animate-pulse">
      <div className="h-[160px] sm:h-[180px] bg-surface-raised" />
      <div className="p-4 flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-surface-raised rounded-full" />
          <div className="h-5 w-14 bg-surface-raised rounded-full" />
        </div>
        <div className="h-4 w-3/4 bg-surface-raised rounded" />
        <div className="h-4 w-1/2 bg-surface-raised rounded" />
        <div className="flex justify-between items-end mt-2">
          <div className="space-y-1">
            <div className="h-3 w-16 bg-surface-raised rounded" />
            <div className="h-6 w-24 bg-surface-raised rounded" />
          </div>
          <div className="h-8 w-20 bg-surface-raised rounded" />
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading } = useAuth();
  const signIn = useSignInLink();
  // Someone whose session is still being restored is not shown the guest banner.
  const isGuest = !user && !isLoading;
  // How many live auctions each category has, from the counts the browse filters use. Nothing is
  // shown beside a tile until they arrive (or if they cannot): a missing number is not zero.
  const facets = useAuctionFacets(NO_FILTERS);
  const liveByCategory = facets.data ? new Map(facets.data.categories.map((c) => [c.name, c.count])) : null;
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'buyers' | 'sellers'>('buyers');
  const onTabKeys = useTabKeys(['buyers', 'sellers'] as const, activeTab, setActiveTab);
  const [featured, setFeatured] = useState<Auction[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  // An empty `featured` after a failed request must not read as "No Live Auctions Right Now", so
  // the two are tracked separately.
  const [featuredFailed, setFeaturedFailed] = useState(false);
  const [liveStats, setLiveStats] = useState<{ userCount: number; activeAuctionCount: number; transactionTotal: number; listingCount: number; completedSalesCount: number } | null>(null);
  const [supportEmail, setSupportEmail] = useState('support@bidvault.tech');
  const [query, setQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('');

  useEffect(() => {
    api.get('/auctions?status=ACTIVE&limit=4').then(data => {
      setFeatured(data.items);
      setFeaturedFailed(false);
    }).catch(() => setFeaturedFailed(true)).finally(() => setFeaturedLoading(false));
  }, []);

  useEffect(() => {
    if (location.hash === '#how-it-works') scrollToSection('how-it-works');
  }, [location.hash]);

  useEffect(() => {
    api.get('/settings/public')
      .then(s => { if (s.supportEmail) setSupportEmail(s.supportEmail); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    api.get('/stats')
      .then(data => setLiveStats(data))
      .catch(() => {});
  }, []);

  // Drives every "it's live!" claim on the page, keyed off the same `featured` list that renders
  // the section, so the headings and the empty state cannot contradict each other. While loading
  // nothing is assumed.
  const hasLiveAuctions = !featuredLoading && !featuredFailed && featured.length > 0;

  const stats = [
    {
      value: liveStats ? `${formatCount(liveStats.activeAuctionCount)}` : '—',
      label: 'Active Auctions',
      icon: <Gavel size={28} strokeWidth={1.6} className="text-primary" />,
    },
    {
      value: liveStats ? `${formatCount(liveStats.userCount)}` : '—',
      label: 'Registered Users',
      icon: <Users size={28} strokeWidth={1.6} className="text-navy" />,
    },
    {
      value: liveStats ? formatCurrency(liveStats.transactionTotal) : '—',
      label: 'in Transactions',
      icon: <Banknote size={28} strokeWidth={1.6} className="text-success-dark" />,
    },
    {
      // Every tile is a real count.
      value: liveStats ? `${formatCount(liveStats.listingCount)}` : '—',
      label: 'Items Listed',
      icon: <Star size={28} strokeWidth={1.6} className="text-gold" fill="currentColor" />,
    },
  ];

  const features = [
    {
      icon: <Lock size={28} strokeWidth={1.5} className="text-navy" />,
      accent: '#0b1f3a',
      iconBg: 'rgba(11,31,58,0.07)',
      title: 'Admin-Reviewed Listings',
      desc: 'Every listing is reviewed and approved by our admin team before going live. Buy with confidence, every time.',
    },
    {
      icon: <Zap size={28} strokeWidth={1.5} className="text-gold" />,
      accent: 'var(--color-gold)',
      iconBg: 'rgba(245,158,11,0.09)',
      title: 'Real-Time Bidding',
      desc: 'Experience live auction thrills with instant bid updates, countdown timers, and competing bid notifications.',
    },
    {
      icon: <BarChart2 size={28} strokeWidth={1.5} className="text-success-dark" />,
      accent: 'var(--color-success-dark)',
      iconBg: 'rgba(26,122,74,0.08)',
      title: 'Transparent Bidding',
      desc: 'Every auction shows its live price and bid count to everyone. Signed-in bidders also see the full bid list, with bidder names masked.',
    },
  ];

  const buyerSteps = [
    { step: '01', title: 'Browse & Discover', desc: 'Search live auctions across Electronics, Vehicles, Fashion, and more. Filter by price, time left, or category.' },
    { step: '02', title: 'Place Your Bid', desc: 'Enter your amount, review the binding commitment, and confirm. Watch the live bid feed update in real-time.' },
    { step: '03', title: 'Win & Receive', desc: 'Pay on BidVault after you win. The seller ships your item and you confirm that it arrived.' },
  ];

  const sellerSteps = [
    { step: '01', title: 'Create Your Account', desc: 'Sign up and verify your email, then choose Become a seller: accept the seller terms and give your city.' },
    { step: '02', title: 'Create a Listing', desc: 'Upload photos and describe your item in detail. Set your own starting price for the auction.' },
    { step: '03', title: 'Go Live & Earn', desc: 'After admin approval, your auction goes live for every buyer on BidVault. Watch bids roll in.' },
  ];

  const navLinks: Array<{ label: string; action: () => void }> = [
    { label: 'Browse Auctions', action: () => navigate('/browse') },
    { label: 'How It Works', action: () => scrollToSection('how-it-works') },
    { label: 'About', action: () => scrollToSection('why-bidvault') },
  ];

  // Browsing is open to everyone, so this goes to the search page rather than being gated behind sign-in.
  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('search', query.trim());
    if (searchCategory) params.set('category', searchCategory);
    const qs = params.toString();
    navigate(qs ? `/browse?${qs}` : '/browse');
  }

  return (
    <div className="min-h-screen bg-surface">

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-navy border-b border-[rgba(255,255,255,0.08)]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[64px]">

            {/* Logo */}
            <Link to="/" className="flex gap-[10px] items-center shrink-0">
              <div className="bg-primary flex items-center justify-center rounded-sm size-[34px]">
                <Gavel size={18} strokeWidth={2} className="text-white" />
              </div>
              <span className="font-extrabold text-[20px] text-white tracking-[-0.3px]">
                Bid<span className="text-primary">Vault</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <ul className="hidden md:flex items-center gap-6">
              {navLinks.map(({ label, action }) => (
                <li key={label}>
                  <button
                    type="button"
                    onClick={action}
                    className="font-semibold text-[13px] text-[rgba(255,255,255,0.65)] hover:text-white transition-colors"
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center gap-3">
              <Link to="/login" className="font-semibold text-[13px] text-[rgba(255,255,255,0.75)] hover:text-white px-4 py-2">
                Log In
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">Get Started</Button>
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              type="button"
              className="md:hidden flex flex-col gap-[5px] p-2"
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              <span className={`block w-5 h-[2px] bg-surface transition-transform duration-200 ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
              <span className={`block w-5 h-[2px] bg-surface transition-opacity duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-[2px] bg-surface transition-transform duration-200 ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-navy-dark border-t border-[rgba(255,255,255,0.08)] px-4 py-4 flex flex-col gap-3">
            <ul className="flex flex-col gap-1">
              {navLinks.map(({ label, action }) => (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => { action(); setMenuOpen(false); }}
                    className="font-semibold text-[14px] text-[rgba(255,255,255,0.75)] hover:text-white text-left py-2 w-full"
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2 pt-2 border-t border-[rgba(255,255,255,0.08)]">
              <Link to="/login" onClick={() => setMenuOpen(false)}>
                <Button variant="outline" fullWidth className="bg-transparent border-white/30 text-white hover:border-white hover:text-white">
                  Log In
                </Button>
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}>
                <Button variant="primary" fullWidth>Get Started</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      <main aria-label="BidVault marketing content">

      {/* Hero: one line of what this is, and the search. */}
      <section className="bg-navy relative overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <div aria-hidden="true" className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-primary opacity-[0.07] rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div aria-hidden="true" className="absolute bottom-[-80px] left-[-80px] w-[400px] h-[400px] bg-success-dark opacity-[0.06] rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '6s' }} />

        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-9 pb-11 flex flex-col gap-5">
          <h1 className="font-extrabold text-[28px] sm:text-[34px] lg:text-[38px] text-white leading-[1.15] tracking-[-0.025em] max-w-[680px]">
            Bid on what you want, from sellers across Pakistan.
          </h1>

          <form role="search" onSubmit={handleSearch} className="flex flex-col sm:flex-row max-w-[760px]">
            <label htmlFor="home-search" className="sr-only">Search auctions</label>
            <input
              id="home-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, or by item number"
              className="min-w-0 sm:flex-1 h-[50px] px-[18px] rounded-t-[10px] sm:rounded-tr-none sm:rounded-l-[10px] bg-surface text-[15px] text-navy outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            <label htmlFor="home-category" className="sr-only">Category</label>
            <select
              id="home-category"
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              className="h-[50px] px-3 bg-surface border-t sm:border-t-0 sm:border-l border-border-light text-[14px] text-navy outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="">All categories</option>
              {BROWSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <Button type="submit" variant="primary" size="lg" className="h-[50px] rounded-t-none rounded-b-[10px] sm:rounded-r-[10px] sm:rounded-l-none px-6">
              Search
            </Button>
          </form>

          {isGuest && (
            <div role="note" className="max-w-[760px] bg-white/10 border border-white/20 rounded-[10px] px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-3">
              <p className="flex-1 min-w-[240px] text-[14px] leading-[1.5] text-white">
                Anyone can look around.{' '}
                <strong className="font-bold">With an account you can bid, watch items and sell your own.</strong>
              </p>
              <Link
                {...signIn}
                className="h-9 px-4 inline-flex items-center rounded-lg border border-white/45 text-[13px] font-bold text-white no-underline hover:border-white transition-colors"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Ending soon */}
      <section id="featured" className="bg-bg py-14 sm:py-16 lg:py-20">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
            <div>
              {/* The eyebrow and the subtitle only claim live bidding when there are live auctions. */}
              <p className="font-bold text-[12px] text-primary uppercase tracking-[1.5px] mb-2">
                {hasLiveAuctions ? 'Live Right Now' : 'Featured'}
              </p>
              <h2 className="font-extrabold text-[26px] sm:text-[32px] text-navy leading-tight">Ending soon</h2>
              <p className="text-[14px] text-muted mt-1">
                {hasLiveAuctions
                  ? 'Verified items, live bidding, real countdowns'
                  : 'Every listing is admin-reviewed before it goes live'}
              </p>
            </div>
            <Link to="/browse" className="font-bold text-[14px] text-primary hover:underline flex items-center gap-1 shrink-0">
              See all
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {featuredLoading ? (
              <>
                <LoadingStatus label="Loading featured auctions" />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : featured.length > 0 ? (
              featured.map(auction => (
                <EndingSoonCard key={auction.auctionId} auction={auction} />
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-surface-raised rounded-full size-16 flex items-center justify-center mb-4">
                  <Gavel size={28} strokeWidth={1.5} className="text-muted" />
                </div>
                {/* "None right now" and "we couldn't check" are different claims and are rendered
                   differently. */}
                <h3 className="font-bold text-[16px] text-navy mb-1">
                  {featuredFailed ? "Couldn't load auctions" : 'No Live Auctions Right Now'}
                </h3>
                <p className="text-[13px] text-muted max-w-[280px]">
                  {featuredFailed
                    ? 'Something went wrong on our side. Please refresh to try again.'
                    : 'Check back soon — new auctions go live every day.'}
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="mt-4 font-semibold text-[13px] text-primary hover:underline"
                >
                  Register to get notified
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Shop by category */}
      <section aria-labelledby="shop-by-category" className="bg-surface py-12 sm:py-14 border-b border-border-light">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <h2 id="shop-by-category" className="font-extrabold text-[22px] sm:text-[26px] text-navy mb-6">Shop by category</h2>
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 list-none m-0 p-0">
            {BROWSE_CATEGORIES.map((name) => (
              <li key={name}>
                <Link
                  to={`/browse?category=${encodeURIComponent(name)}`}
                  className="block bg-bg border border-border-light rounded-lg px-4 py-4 font-bold text-[14px] text-navy no-underline hover:border-primary hover:text-primary transition-colors"
                >
                  {name}
                  {liveByCategory && (
                    <span className="block mt-1 font-medium text-[12px] text-muted">{liveByCategory.get(name) ?? 0} live</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-surface border-b border-border-light">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`text-center py-4 px-4 sm:px-6
                  ${i % 2 === 0 ? 'border-r border-border-light' : ''}
                  ${i < stats.length - 1 ? 'lg:border-r lg:border-border-light' : ''}
                `}
              >
                <div className="flex justify-center mb-3">{s.icon}</div>
                {/* Every tile is live data, so every tile gets the loading pulse. */}
                <p className={`font-extrabold text-[22px] sm:text-[28px] text-navy leading-none tracking-[-0.5px] ${!liveStats ? 'animate-pulse' : ''}`}>
                  {s.value}
                </p>
                <p className="text-[12px] sm:text-[13px] text-muted mt-1.5 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-surface py-14 sm:py-16 lg:py-20">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10">
            <p className="font-bold text-[12px] text-primary uppercase tracking-[1.5px] mb-2">Simple Process</p>
            <h2 className="font-extrabold text-[26px] sm:text-[32px] text-navy">How BidVault Works</h2>
          </div>

          <div className="flex items-center justify-center mb-8 sm:mb-10">
            <div role="tablist" aria-label="How BidVault works" onKeyDown={onTabKeys} className="bg-bg border border-border-light rounded-md p-1 flex gap-1">
              {(['buyers', 'sellers'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  id={`how-tab-${tab}`}
                  aria-selected={activeTab === tab}
                  aria-controls="how-panel"
                  tabIndex={activeTab === tab ? 0 : -1}
                  onClick={() => setActiveTab(tab)}
                  className={`font-bold text-[13px] px-5 py-2 rounded-sm transition-all ${activeTab === tab ? 'bg-navy text-white shadow-sm' : 'text-muted hover:text-secondary'}`}
                >
                  {tab === 'buyers' ? 'For Buyers' : 'For Sellers'}
                </button>
              ))}
            </div>
          </div>

          <div id="how-panel" role="tabpanel" aria-labelledby={`how-tab-${activeTab}`} className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {(activeTab === 'buyers' ? buyerSteps : sellerSteps).map((step, i) => (
              <div key={step.step} className="relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-[22px] left-[calc(50%+32px)] right-[-50%] h-[2px] z-0" style={{ background: 'linear-gradient(90deg, var(--color-navy) 0%, var(--color-border-light) 100%)' }} />
                )}
                <div className="relative z-10 text-center flex flex-col items-center">
                  <div className="bg-navy text-white font-extrabold text-[14px] size-[46px] rounded-full flex items-center justify-center mb-4 shadow-[0_0_0_4px_rgba(11,31,58,0.1),0_4px_16px_rgba(11,31,58,0.2)]">
                    {step.step}
                  </div>
                  <h3 className="font-bold text-[16px] text-navy mb-2">{step.title}</h3>
                  <p className="text-[13px] text-muted leading-[1.7] max-w-[260px]">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why BidVault */}
      <section id="why-bidvault" className="bg-bg py-14 sm:py-16 lg:py-20">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <p className="font-bold text-[12px] text-primary uppercase tracking-[1.5px] mb-2">Built Different</p>
            <h2 className="font-extrabold text-[26px] sm:text-[32px] text-navy">Why BidVault?</h2>
            <p className="text-[14px] sm:text-[15px] text-muted mt-2 max-w-[500px] mx-auto">
              Every feature is designed for Pakistan's market — trust, transparency, and technology.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {features.map(f => (
              <div
                key={f.title}
                className="bg-surface border border-border-light border-t-[3px] rounded-lg p-5 sm:p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
                style={{ borderTopColor: f.accent }}
              >
                <div className="mb-4 size-[48px] rounded-md flex items-center justify-center" style={{ backgroundColor: f.iconBg }}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-[15px] text-navy mb-2 group-hover:text-primary transition-colors">{f.title}</h3>
                <p className="text-[13px] text-muted leading-[1.6]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="bg-surface border-y border-border-light py-10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <p className="font-bold text-[13px] text-muted uppercase tracking-[1px]">Buy and sell with people across Pakistan</p>
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-4 sm:gap-6">
              {['Karachi', 'Lahore', 'Islamabad', 'Peshawar', 'Quetta', 'Faisalabad'].map(city => (
                <span key={city} className="font-semibold text-[13px] text-placeholder flex items-center gap-1">
                  <MapPin size={12} strokeWidth={2} /> {city}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="bg-navy relative overflow-hidden py-14 sm:py-16 lg:py-20">
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary opacity-[0.1] rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '5s' }} />

        <div className="relative max-w-[800px] mx-auto px-4 sm:px-6 text-center">
          <div className="flex justify-center mb-4"><Hammer size={56} strokeWidth={1.3} className="text-primary" /></div>
          <h2 className="font-extrabold text-[28px] sm:text-[38px] lg:text-[44px] text-white leading-[1.15] tracking-[-1px] mb-4">
            Ready to Start Bidding?
          </h2>
          <p className="text-[15px] sm:text-[16px] text-[rgba(255,255,255,0.6)] mb-8 leading-[1.7]">
            Join Pakistan's fastest-growing auction platform. Free to join, no hidden fees.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto px-8 shadow-[0_8px_24px_rgba(208,2,27,0.4)]"
            >
              Create Account 
            </Button>
            <Link to="/login" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto bg-transparent border-white/20 text-[rgba(255,255,255,0.75)] hover:border-white hover:text-white"
              >
                I already have an account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      </main>

      {/* Footer */}
      <footer className="bg-navy-deep py-10 sm:py-12">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <Link to="/" className="flex gap-[10px] items-center mb-4">
                <div className="bg-primary flex items-center justify-center rounded-sm size-[32px]">
                  <Gavel size={16} strokeWidth={2} className="text-white" />
                </div>
                <span className="font-extrabold text-[18px] text-white tracking-[-0.3px]">
                  Bid<span className="text-primary">Vault</span>
                </span>
              </Link>
              <p className="text-[13px] text-[rgba(255,255,255,0.4)] leading-[1.7]">
                Pakistan's trusted auction platform. Buy and sell with confidence.
              </p>
            </div>

            {/* Platform */}
            <div>
              <p className="font-bold text-[12px] text-[rgba(255,255,255,0.5)] uppercase tracking-[1px] mb-4">Platform</p>
              <div className="flex flex-col gap-2.5">
                <Link to="/browse" className="font-medium text-[13px] text-[rgba(255,255,255,0.55)] hover:text-white text-left transition-colors no-underline">Browse Auctions</Link>
                <button type="button" onClick={() => navigate(user ? '/become-a-seller' : '/register')} className="font-medium text-[13px] text-[rgba(255,255,255,0.55)] hover:text-white text-left transition-colors">Sell an Item</button>
                <button type="button" onClick={() => scrollToSection('how-it-works')} className="font-medium text-[13px] text-[rgba(255,255,255,0.55)] hover:text-white text-left transition-colors">How It Works</button>
              </div>
            </div>

            {/* Account */}
            <div>
              <p className="font-bold text-[12px] text-[rgba(255,255,255,0.5)] uppercase tracking-[1px] mb-4">Account</p>
              <div className="flex flex-col gap-2.5">
                <Link to="/login" className="font-medium text-[13px] text-[rgba(255,255,255,0.55)] hover:text-white transition-colors">Sign in</Link>
                <Link to="/register" className="font-medium text-[13px] text-[rgba(255,255,255,0.55)] hover:text-white transition-colors">Register</Link>
                <Link to="/forgot-password" className="font-medium text-[13px] text-[rgba(255,255,255,0.55)] hover:text-white transition-colors">Forgot Password</Link>
                <Link to="/seller/dashboard" className="font-medium text-[13px] text-[rgba(255,255,255,0.55)] hover:text-white transition-colors">Seller Dashboard</Link>
              </div>
            </div>

            {/* Legal */}
            <div>
              <p className="font-bold text-[12px] text-[rgba(255,255,255,0.5)] uppercase tracking-[1px] mb-4">Legal</p>
              <div className="flex flex-col gap-2.5">
                <Link to="/privacy" className="font-medium text-[13px] text-[rgba(255,255,255,0.55)] hover:text-white transition-colors">Privacy Policy</Link>
                <Link to="/terms" className="font-medium text-[13px] text-[rgba(255,255,255,0.55)] hover:text-white transition-colors">Terms of Service</Link>
                <Link to="/rules" className="font-medium text-[13px] text-[rgba(255,255,255,0.55)] hover:text-white transition-colors">What you may not sell</Link>
                <a href={`mailto:${supportEmail}`} className="font-medium text-[13px] text-[rgba(255,255,255,0.55)] hover:text-white transition-colors">Contact Us</a>
              </div>
            </div>
          </div>

          <div className="border-t border-[rgba(255,255,255,0.07)] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[12px] text-[rgba(255,255,255,0.3)]">
              © 2026 BidVault · Final Year Project · CUST Islamabad, Spring 2026
            </p>
            <p className="text-[12px] text-[rgba(255,255,255,0.3)]">
              Built with React · TypeScript · Tailwind CSS
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
