import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Gavel, Users, Banknote, Star, MapPin, Lock, Zap, BarChart2, Hammer } from 'lucide-react';
import { useTimer } from '../hooks/useTimer';
import type { Auction } from '../types';
import { Button } from '../components/ui';
import { api } from '../services/api';

// ─── Auction card with live timer ─────────────────────────────────────────────
function FeaturedCard({ auction }: { auction: Auction }) {
  const navigate = useNavigate();
  const timer = useTimer(auction.endTime);

  return (
    <div className="bg-surface border border-border-light rounded-lg overflow-hidden hover:shadow-[0_8px_32px_rgba(11,31,58,0.12)] hover:-translate-y-1 transition-all duration-200 flex flex-col">
      <div className="h-[160px] sm:h-[180px] relative overflow-hidden bg-navy">
        <img
          src={auction.imageUrl}
          alt={auction.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <span className={`absolute top-3 right-3 font-bold text-[11px] px-2 py-1 rounded-sm flex items-center gap-1 ${timer.totalSeconds < 3600 ? 'bg-primary text-white' : 'bg-[rgba(11,31,58,0.7)] text-white'}`}>
          <Clock size={10} strokeWidth={2.5} /> {timer.display}
        </span>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-surface-raised font-medium text-[11px] text-muted px-2 py-[3px] rounded-full">{auction.category}</span>
          <span className="bg-surface-raised font-medium text-[11px] text-muted px-2 py-[3px] rounded-full">{auction.condition === 'LIKE_NEW' ? 'Like New' : auction.condition === 'NEW' ? 'New' : 'Used'}</span>
        </div>
        <h3 className="font-bold text-[14px] text-navy mb-3 leading-[20px] line-clamp-2">{auction.title}</h3>
        <div className="flex items-end justify-between mt-auto">
          <div>
            <p className="text-[11px] text-muted mb-[2px]">Current Bid</p>
            <p className="font-extrabold text-[20px] text-primary leading-none">PKR {auction.currentBid.toLocaleString()}</p>
            <p className="text-[11px] text-placeholder mt-1">{auction.bidCount} bids</p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/login')}
            className="text-[13px]"
          >
            Bid Now →
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'buyers' | 'sellers'>('buyers');
  const [featured, setFeatured] = useState<Auction[]>([]);

  useEffect(() => {
    api.get<Auction[]>('/auctions?status=ACTIVE').then(data => {
      setFeatured(data.slice(0, 3));
    }).catch(() => {});
  }, []);

  const stats = [
    { value: '2,400+', label: 'Active Auctions', icon: <Gavel size={28} strokeWidth={1.6} className="text-primary" /> },
    { value: '18,000+', label: 'Registered Users', icon: <Users size={28} strokeWidth={1.6} className="text-navy" /> },
    { value: 'PKR 850M+', label: 'in Transactions', icon: <Banknote size={28} strokeWidth={1.6} className="text-success-dark" /> },
    { value: '4.9 / 5', label: 'Buyer Satisfaction', icon: <Star size={28} strokeWidth={1.6} className="text-gold" fill="currentColor" /> },
  ];

  const features = [
    {
      icon: <Lock size={28} strokeWidth={1.5} className="text-navy" />,
      accent: '#0b1f3a',
      iconBg: 'rgba(11,31,58,0.07)',
      title: 'Verified Sellers Only',
      desc: 'Every seller is reviewed and approved by our admin team before listing. Buy with confidence, every time.',
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
      desc: 'Full bid history visible to all participants — see every bid, every amount, and every timestamp in real time.',
    },
  ];

  const buyerSteps = [
    { step: '01', title: 'Browse & Discover', desc: 'Search thousands of verified auctions across Electronics, Vehicles, Fashion, and more. Filter by price, time left, or category.' },
    { step: '02', title: 'Place Your Bid', desc: 'Enter your amount, review the binding commitment, and confirm. Watch the live bid feed update in real-time.' },
    { step: '03', title: 'Win & Connect', desc: 'If you win, the verified seller contacts you within 24 hours to arrange payment and delivery. Simple.' },
  ];

  const sellerSteps = [
    { step: '01', title: 'Create Your Account', desc: 'Register as a seller and set up your profile. Our admin team reviews and activates your seller account.' },
    { step: '02', title: 'Create a Listing', desc: 'Upload photos and describe your item in detail. Set your own starting price for the auction.' },
    { step: '03', title: 'Go Live & Earn', desc: 'After admin approval, your auction goes live to thousands of active buyers. Watch bids roll in.' },
  ];

  const navLinks = ['Browse Auctions', 'How It Works', 'About'];

  return (
    <div className="min-h-screen bg-surface font-[Plus_Jakarta_Sans,sans-serif]">

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
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
              {navLinks.map(l => (
                <li key={l}>
                  <button className="font-semibold text-[13px] text-[rgba(255,255,255,0.65)] hover:text-white transition-colors">{l}</button>
                </li>
              ))}
            </ul>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center gap-3">
              <Link to="/login" className="font-semibold text-[13px] text-[rgba(255,255,255,0.75)] hover:text-white px-4 py-2">
                Log In
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">Get Started Free</Button>
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
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
              {navLinks.map(l => (
                <li key={l}>
                  <button onClick={() => setMenuOpen(false)} className="font-semibold text-[14px] text-[rgba(255,255,255,0.75)] hover:text-white text-left py-2 w-full">{l}</button>
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
                <Button variant="primary" fullWidth>Get Started Free</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      <main aria-label="BidVault marketing content">

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="bg-navy relative overflow-hidden">
        {/* Background grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        {/* Decorative glow */}
        <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-primary opacity-[0.07] rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-[-80px] left-[-80px] w-[400px] h-[400px] bg-success-dark opacity-[0.06] rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '6s' }} />

        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
          <div className="max-w-[720px] mx-auto text-center lg:text-left lg:mx-0">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-[rgba(208,2,27,0.15)] border border-[rgba(208,2,27,0.3)] rounded-full px-4 py-1.5 mb-6">
              <span className="size-[6px] rounded-full bg-primary inline-block animate-pulse" aria-hidden="true" />
              <span className="font-bold text-[12px] text-primary-tint">Live Auctions Running Now</span>
            </div>

            <h1 className="font-extrabold text-[36px] sm:text-[48px] lg:text-[60px] text-white leading-[1.1] tracking-[-1.5px] mb-5">
              Pakistan's Smartest<br />
              <span className="text-primary">Real-Time</span> Auction<br />
              Platform
            </h1>

            <p className="text-[15px] sm:text-[17px] text-[rgba(255,255,255,0.65)] leading-[1.7] mb-8 max-w-[560px] mx-auto lg:mx-0">
              Bid on verified items, sell with transparent listings, and experience real-time auctions — all in one secure platform built for Pakistan.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto px-8 shadow-[0_8px_24px_rgba(208,2,27,0.35)]"
              >
                Start Bidding Free →
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto bg-transparent border-white/25 text-white hover:border-white hover:text-white hover:bg-[rgba(255,255,255,0.08)]"
              >
                Sell Your Items
              </Button>
            </div>

            <p className="mt-4 text-[12px] text-[rgba(255,255,255,0.35)]">
              Free to join · No listing fees · Verified sellers only
            </p>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ───────────────────────────────────────────────────────── */}
      <section className="bg-surface border-b border-border-light">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {stats.map((s, i) => (
              <div key={s.label} className={`text-center py-4 px-4 sm:px-6 ${i < stats.length - 1 ? 'border-r border-border-light' : ''}`}>
                <div className="flex justify-center mb-3">{s.icon}</div>
                <p className="font-extrabold text-[22px] sm:text-[28px] text-navy leading-none tracking-[-0.5px]">{s.value}</p>
                <p className="text-[12px] sm:text-[13px] text-muted mt-1.5 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED AUCTIONS ───────────────────────────────────────────────── */}
      <section className="bg-bg py-14 sm:py-16 lg:py-20">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
            <div>
              <p className="font-bold text-[12px] text-primary uppercase tracking-[1.5px] mb-2">Live Right Now</p>
              <h2 className="font-extrabold text-[26px] sm:text-[32px] text-navy leading-tight">Featured Auctions</h2>
              <p className="text-[14px] text-muted mt-1">Verified items, live bidding, real countdowns</p>
            </div>
            <Link to="/login" className="font-bold text-[14px] text-primary hover:underline flex items-center gap-1 shrink-0">
              View All Auctions →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {featured.map(auction => (
              <FeaturedCard key={auction.auctionId} auction={auction} />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section className="bg-surface py-14 sm:py-16 lg:py-20">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10">
            <p className="font-bold text-[12px] text-primary uppercase tracking-[1.5px] mb-2">Simple Process</p>
            <h2 className="font-extrabold text-[26px] sm:text-[32px] text-navy">How BidVault Works</h2>
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-center mb-8 sm:mb-10">
            <div className="bg-bg border border-border-light rounded-md p-1 flex gap-1">
              {(['buyers', 'sellers'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`font-bold text-[13px] px-5 py-2 rounded-sm transition-all ${activeTab === tab ? 'bg-navy text-white shadow-sm' : 'text-muted hover:text-secondary'}`}
                >
                  {tab === 'buyers' ? 'For Buyers' : 'For Sellers'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
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

      {/* ── WHY BIDVAULT ────────────────────────────────────────────────────── */}
      <section className="bg-bg py-14 sm:py-16 lg:py-20">
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

      {/* ── TESTIMONIAL / TRUST STRIP ───────────────────────────────────────── */}
      <section className="bg-surface border-y border-border-light py-10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <p className="font-bold text-[13px] text-muted uppercase tracking-[1px]">Trusted by buyers and sellers across Pakistan</p>
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

      {/* ── CTA BANNER ──────────────────────────────────────────────────────── */}
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
            Join 18,000+ Pakistanis already buying and selling on BidVault. Free to join, no hidden fees.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto px-8 shadow-[0_8px_24px_rgba(208,2,27,0.4)]"
            >
              Create Free Account →
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

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
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
                {['Browse Auctions', 'Sell an Item', 'How It Works', 'Pricing'].map(l => (
                  <button key={l} className="font-medium text-[13px] text-[rgba(255,255,255,0.55)] hover:text-white text-left transition-colors">{l}</button>
                ))}
              </div>
            </div>

            {/* Account */}
            <div>
              <p className="font-bold text-[12px] text-[rgba(255,255,255,0.5)] uppercase tracking-[1px] mb-4">Account</p>
              <div className="flex flex-col gap-2.5">
                <Link to="/login" className="font-medium text-[13px] text-[rgba(255,255,255,0.55)] hover:text-white transition-colors">Log In</Link>
                <Link to="/register" className="font-medium text-[13px] text-[rgba(255,255,255,0.55)] hover:text-white transition-colors">Register</Link>
                <Link to="/forgot-password" className="font-medium text-[13px] text-[rgba(255,255,255,0.55)] hover:text-white transition-colors">Forgot Password</Link>
                <button className="font-medium text-[13px] text-[rgba(255,255,255,0.55)] hover:text-white text-left transition-colors">Seller Dashboard</button>
              </div>
            </div>

            {/* Legal */}
            <div>
              <p className="font-bold text-[12px] text-[rgba(255,255,255,0.5)] uppercase tracking-[1px] mb-4">Legal</p>
              <div className="flex flex-col gap-2.5">
                <Link to="/privacy" className="font-medium text-[13px] text-[rgba(255,255,255,0.55)] hover:text-white transition-colors">Privacy Policy</Link>
                <Link to="/terms" className="font-medium text-[13px] text-[rgba(255,255,255,0.55)] hover:text-white transition-colors">Terms of Service</Link>
                <button className="font-medium text-[13px] text-[rgba(255,255,255,0.55)] hover:text-white text-left transition-colors">Refund Policy</button>
                <button className="font-medium text-[13px] text-[rgba(255,255,255,0.55)] hover:text-white text-left transition-colors">Contact Us</button>
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
