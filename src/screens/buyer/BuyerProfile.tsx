import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Package, Shield, Mail, Calendar, Gavel, Trophy, Heart, TrendingUp, Eye, EyeOff, Bell, BellOff, Search, Hammer } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAuction } from '../../context/AuctionContext';
import { BuyerNavbar } from '../../components/ui';
import { SEED_BIDS } from '../../services/mockData';

export default function BuyerProfile() {
  const { user, logout } = useAuth();
  const { auctions } = useAuction();
  const navigate = useNavigate();

  const [notifBids, setNotifBids] = useState(true);
  const [notifWins, setNotifWins] = useState(true);
  const [notifNews, setNotifNews] = useState(false);
  const [showPwForm, setShowPwForm] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [showPw, setShowPw] = useState(false);

  const myBids = SEED_BIDS.filter(b => b.buyerId === user?.userId);
  const totalBidAmount = myBids.reduce((s, b) => s + b.amount, 0);
  const auctionsWon = myBids.filter(b => b.isWin).length;
  const watchlistCount = auctions.length;

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'long' })
    : 'January 2026';

  const stats = [
    { label: 'Total Bids', value: myBids.length, icon: <Gavel size={18} strokeWidth={1.8} className="text-primary" />, bg: 'bg-primary-surface' },
    { label: 'Auctions Won', value: auctionsWon, icon: <Trophy size={18} strokeWidth={1.8} className="text-gold" />, bg: 'bg-[#fffbeb]' },
    { label: 'Watchlist Items', value: watchlistCount, icon: <Heart size={18} strokeWidth={1.8} className="text-success-dark" />, bg: 'bg-success-bg' },
    { label: 'Total Bid Value', value: `PKR ${(totalBidAmount / 1000).toFixed(0)}K`, icon: <TrendingUp size={18} strokeWidth={1.8} className="text-navy" />, bg: 'bg-[#f0f4ff]' },
  ];

  const quickLinks = [
    { label: 'Browse Auctions', to: '/buyer/browse', icon: <Search size={15} className="text-muted" /> },
    { label: 'My Bids', to: '/buyer/my-bids', icon: <Hammer size={15} className="text-muted" /> },
    { label: 'My Watchlist', to: '/buyer/watchlist', icon: <Heart size={15} className="text-muted" /> },
  ];

  return (
    <div className="min-h-screen bg-bg">
      <BuyerNavbar userName={user?.name} onLogout={logout} />

      <main>
        {/* Profile hero */}
        <div className="bg-navy relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }} />
          <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-8 sm:py-10 relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="bg-primary size-[72px] sm:size-[80px] rounded-full flex items-center justify-center shadow-[0_0_0_4px_rgba(208,2,27,0.25)] shrink-0">
                <span className="font-extrabold text-[28px] sm:text-[32px] text-white">{user?.name?.[0] ?? 'B'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="font-extrabold text-[22px] sm:text-[26px] text-white tracking-[-0.3px]">{user?.name ?? 'Buyer'}</h1>
                  <span className="bg-[rgba(26,122,74,0.2)] border border-[rgba(26,122,74,0.4)] font-bold text-[10px] text-[#4ade80] px-2 py-[3px] rounded-[99px] flex items-center gap-1">
                    <Shield size={9} strokeWidth={2.5} /> Verified Buyer
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  <span className="flex items-center gap-1.5 text-[12px] text-[rgba(255,255,255,0.5)]">
                    <Mail size={12} strokeWidth={2} /> {user?.email ?? 'email@example.com'}
                  </span>
                  <span className="flex items-center gap-1.5 text-[12px] text-[rgba(255,255,255,0.5)]">
                    <Calendar size={12} strokeWidth={2} /> Member since {memberSince}
                  </span>
                </div>
              </div>
              <button
                onClick={logout}
                className="shrink-0 border border-[rgba(255,255,255,0.18)] font-semibold text-[13px] text-[rgba(255,255,255,0.6)] px-4 py-2 rounded-sm hover:border-primary hover:text-[#ff6b7a] transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-5">

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {stats.map(s => (
              <div key={s.label} className="bg-surface border border-border-light rounded-md p-4 sm:p-5 flex flex-col gap-3">
                <div className={`${s.bg} size-[36px] rounded-md flex items-center justify-center`}>
                  {s.icon}
                </div>
                <div>
                  <p className="font-extrabold text-[20px] sm:text-[24px] text-navy leading-none">{s.value}</p>
                  <p className="text-[11px] text-muted font-medium mt-1">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-5">

            {/* Left column */}
            <div className="flex flex-col gap-5">
              {/* Account Information */}
              <div className="bg-surface border border-border-light rounded-md overflow-hidden">
                <div className="px-5 py-4 border-b border-border-light">
                  <h2 className="font-bold text-[14px] text-navy">Account Information</h2>
                </div>
                <div className="p-5 flex flex-col gap-4">
                  {[
                    { label: 'Full Name', value: user?.name ?? '—' },
                    { label: 'Email Address', value: user?.email ?? '—' },
                    { label: 'Account Type', value: 'Buyer' },
                    { label: 'User ID', value: user?.userId ?? '—' },
                  ].map(row => (
                    <div key={row.label} className="flex items-start justify-between gap-4">
                      <span className="text-[12px] text-muted font-medium shrink-0 w-[130px]">{row.label}</span>
                      <span className="font-semibold text-[13px] text-secondary text-right break-all">{row.value}</span>
                    </div>
                  ))}
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-[12px] text-muted font-medium shrink-0 w-[130px]">Email Verified</span>
                    {user?.isEmailVerified
                      ? <span className="flex items-center gap-1 font-semibold text-[13px] text-success-dark"><Check size={13} strokeWidth={2.5} />Yes</span>
                      : <span className="font-semibold text-[13px] text-secondary">No</span>}
                  </div>
                </div>
              </div>

              {/* Recent Bid Activity */}
              <div className="bg-surface border border-border-light rounded-md overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
                  <h2 className="font-bold text-[14px] text-navy">Recent Bids</h2>
                  <Link to="/buyer/my-bids" className="font-bold text-[12px] text-primary hover:underline">View All →</Link>
                </div>
                {myBids.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Gavel size={32} strokeWidth={1.3} className="text-placeholder mb-3" />
                    <p className="font-semibold text-[13px] text-muted">No bids placed yet.</p>
                    <Link to="/buyer/browse" className="mt-3 font-bold text-[12px] text-primary hover:underline">Browse Auctions →</Link>
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-[#f8f9fa]">
                    {myBids.slice(0, 5).map(bid => {
                      const auction = auctions.find(a => a.auctionId === bid.auctionId);
                      return (
                        <button
                          key={bid.bidId}
                          className="flex items-center gap-3 px-5 py-3 hover:bg-bg transition-colors text-left w-full cursor-pointer"
                          onClick={() => auction && navigate(`/buyer/live-bidding/${auction.auctionId}`)}
                          disabled={!auction}
                        >
                          <div className="bg-bg rounded-sm size-[38px] overflow-hidden shrink-0">
                            {auction?.imageUrl
                              ? <img src={auction.imageUrl} alt={auction.title} className="w-full h-full object-cover" />
                              : <Package size={18} strokeWidth={1.5} className="text-placeholder m-auto mt-[9px]" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[12px] text-secondary truncate">{auction?.title ?? 'Auction Item'}</p>
                            <p className="text-[11px] text-placeholder">{new Date(bid.timestamp).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-[13px] text-primary">PKR {bid.amount.toLocaleString()}</p>
                            <p className="text-[10px] text-placeholder">{bid.isWin ? 'Won' : 'Bid placed'}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-5">
              {/* Quick Links */}
              <div className="bg-surface border border-border-light rounded-md overflow-hidden">
                <div className="px-5 py-4 border-b border-border-light">
                  <h2 className="font-bold text-[14px] text-navy">Quick Links</h2>
                </div>
                <div className="p-3 flex flex-col gap-1">
                  {quickLinks.map(l => (
                    <Link
                      key={l.label}
                      to={l.to}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-sm hover:bg-bg transition-colors"
                    >
                      {l.icon}
                      <span className="font-semibold text-[13px] text-secondary">{l.label}</span>
                      <span className="ml-auto text-placeholder text-[12px]">→</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Notification Preferences */}
              <div className="bg-surface border border-border-light rounded-md overflow-hidden">
                <div className="px-5 py-4 border-b border-border-light">
                  <h2 className="font-bold text-[14px] text-navy">Notifications</h2>
                </div>
                <div className="p-5 flex flex-col gap-4">
                  {[
                    { label: 'Outbid alerts', sub: 'When someone outbids you', value: notifBids, set: setNotifBids },
                    { label: 'Win notifications', sub: 'When you win an auction', value: notifWins, set: setNotifWins },
                    { label: 'Platform updates', sub: 'New features & news', value: notifNews, set: setNotifNews },
                  ].map(n => (
                    <div key={n.label} className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2">
                        {n.value ? <Bell size={14} strokeWidth={2} className="text-success-dark mt-[2px] shrink-0" /> : <BellOff size={14} strokeWidth={2} className="text-placeholder mt-[2px] shrink-0" />}
                        <div>
                          <p className="font-semibold text-[12px] text-secondary">{n.label}</p>
                          <p className="text-[11px] text-placeholder">{n.sub}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => n.set(v => !v)}
                        className={`shrink-0 w-[38px] h-[22px] rounded-full transition-colors relative cursor-pointer ${n.value ? 'bg-[#1a7a4a]' : 'bg-[#dee2e6]'}`}
                      >
                        <span className={`absolute top-[3px] size-[16px] rounded-full bg-surface shadow transition-transform ${n.value ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security */}
              <div className="bg-surface border border-border-light rounded-md overflow-hidden">
                <div className="px-5 py-4 border-b border-border-light">
                  <h2 className="font-bold text-[14px] text-navy">Security</h2>
                </div>
                <div className="p-5">
                  {!showPwForm ? (
                    <button
                      onClick={() => setShowPwForm(true)}
                      className="w-full border border-[#dee2e6] font-semibold text-[13px] text-tertiary py-2.5 rounded-sm hover:bg-bg hover:border-primary hover:text-primary transition-colors cursor-pointer"
                    >
                      Change Password
                    </button>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <label className="font-bold text-[12px] text-secondary">New Password</label>
                      <div className="relative">
                        <input
                          type={showPw ? 'text' : 'password'}
                          value={newPw}
                          onChange={e => setNewPw(e.target.value)}
                          className="w-full border border-[#dee2e6] rounded-sm px-3 py-2.5 text-[13px] text-secondary outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(208,2,27,0.08)] transition-shadow pr-10"
                          placeholder="Min. 8 characters"
                        />
                        <button type="button" aria-label={showPw ? 'Hide password' : 'Show password'} onClick={() => setShowPw(v => !v)} className="absolute right-3 top-[10px] text-placeholder cursor-pointer">
                          {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setShowPwForm(false); setNewPw(''); }}
                          className="flex-1 border border-[#dee2e6] font-semibold text-[12px] text-muted py-2 rounded-sm hover:bg-bg cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => { setShowPwForm(false); setNewPw(''); }}
                          className="flex-1 bg-primary font-bold text-[12px] text-white py-2 rounded-sm hover:bg-primary-dark cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-[#f8f9fa]">
                    <button
                      onClick={logout}
                      className="w-full text-left font-semibold text-[12px] text-[#ef4444] hover:underline cursor-pointer"
                    >
                      Sign out of all devices →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
