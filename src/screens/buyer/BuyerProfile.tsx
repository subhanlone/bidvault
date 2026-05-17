import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Shield, Mail, Calendar, Gavel, Trophy, Heart, TrendingUp, Eye, EyeOff, Bell, BellOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAuction } from '../../context/AuctionContext';
import { IconBidVaultLogo } from '../../components/Icons';
import { SEED_BIDS } from '../../services/mockData';

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
            <Link to="/buyer/watchlist" className="font-semibold text-[13px] px-4 py-[18px] border-b-2 text-[rgba(255,255,255,0.55)] border-transparent hover:text-white transition-colors">Watchlist</Link>
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
          {menuOpen ? <X size={20} className="text-white" /> : (
            <div className="flex flex-col gap-[5px]">
              <span className="block w-5 h-[2px] bg-white" />
              <span className="block w-5 h-[2px] bg-white" />
              <span className="block w-5 h-[2px] bg-white" />
            </div>
          )}
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden bg-[#0d2545] border-t border-[rgba(255,255,255,0.08)] px-4 py-4 flex flex-col gap-1">
          <Link to="/buyer/browse" onClick={() => setMenuOpen(false)} className="font-semibold text-[14px] text-[rgba(255,255,255,0.7)] py-2 hover:text-white">Browse Auctions</Link>
          <Link to="/buyer/my-bids" onClick={() => setMenuOpen(false)} className="font-semibold text-[14px] text-[rgba(255,255,255,0.7)] py-2 hover:text-white">My Bids</Link>
          <Link to="/buyer/watchlist" onClick={() => setMenuOpen(false)} className="font-semibold text-[14px] text-[rgba(255,255,255,0.7)] py-2 hover:text-white">Watchlist</Link>
          <Link to="/buyer/profile" onClick={() => setMenuOpen(false)} className="font-semibold text-[14px] text-[#d0021b] py-2">My Profile</Link>
          <div className="flex items-center justify-between pt-3 mt-1 border-t border-[rgba(255,255,255,0.08)]">
            <div className="flex items-center gap-2">
              <div className="bg-[rgba(255,255,255,0.1)] rounded-full size-[30px] flex items-center justify-center">
                <span className="font-bold text-[12px] text-white">{user?.name?.[0] ?? 'B'}</span>
              </div>
              <span className="font-semibold text-[13px] text-white">{user?.name?.split(' ')[0] ?? 'Buyer'}</span>
            </div>
            <button onClick={logout} className="font-semibold text-[12px] text-[#d0021b]">Logout</button>
          </div>
        </div>
      )}
    </header>
  );
}

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
  const watchlistCount = auctions.length; // mock watchlist count

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'long' })
    : 'January 2026';

  const stats = [
    { label: 'Total Bids', value: myBids.length, icon: <Gavel size={18} strokeWidth={1.8} className="text-[#d0021b]" />, bg: 'bg-[#fff0f2]' },
    { label: 'Auctions Won', value: auctionsWon, icon: <Trophy size={18} strokeWidth={1.8} className="text-[#f59e0b]" />, bg: 'bg-[#fffbeb]' },
    { label: 'Watchlist Items', value: watchlistCount, icon: <Heart size={18} strokeWidth={1.8} className="text-[#1a7a4a]" />, bg: 'bg-[#f0faf4]' },
    { label: 'Total Bid Value', value: `PKR ${(totalBidAmount / 1000).toFixed(0)}K`, icon: <TrendingUp size={18} strokeWidth={1.8} className="text-[#0b1f3a]" />, bg: 'bg-[#f0f4ff]' },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <BuyerNav />

      {/* Profile hero */}
      <div className="bg-[#0b1f3a] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-8 sm:py-10 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="bg-[#d0021b] size-[72px] sm:size-[80px] rounded-full flex items-center justify-center shadow-[0_0_0_4px_rgba(208,2,27,0.25)] shrink-0">
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
              className="shrink-0 border border-[rgba(255,255,255,0.18)] font-semibold text-[13px] text-[rgba(255,255,255,0.6)] px-4 py-2 rounded-[8px] hover:border-[#d0021b] hover:text-[#ff6b7a] transition-colors"
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
            <div key={s.label} className="bg-white border border-[#e9ecef] rounded-[12px] p-4 sm:p-5 flex flex-col gap-3">
              <div className={`${s.bg} size-[36px] rounded-[10px] flex items-center justify-center`}>
                {s.icon}
              </div>
              <div>
                <p className="font-extrabold text-[20px] sm:text-[24px] text-[#0b1f3a] leading-none">{s.value}</p>
                <p className="text-[11px] text-[#6c757d] font-medium mt-1">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-5">

          {/* Left column */}
          <div className="flex flex-col gap-5">
            {/* Account Information */}
            <div className="bg-white border border-[#e9ecef] rounded-[12px] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#e9ecef]">
                <h2 className="font-bold text-[14px] text-[#0b1f3a]">Account Information</h2>
              </div>
              <div className="p-5 flex flex-col gap-4">
                {[
                  { label: 'Full Name', value: user?.name ?? '—' },
                  { label: 'Email Address', value: user?.email ?? '—' },
                  { label: 'Account Type', value: 'Buyer' },
                  { label: 'User ID', value: user?.userId ?? '—' },
                  { label: 'Email Verified', value: user?.isEmailVerified ? 'Yes ✓' : 'No' },
                ].map(row => (
                  <div key={row.label} className="flex items-start justify-between gap-4">
                    <span className="text-[12px] text-[#6c757d] font-medium shrink-0 w-[130px]">{row.label}</span>
                    <span className="font-semibold text-[13px] text-[#343a40] text-right break-all">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Bid Activity */}
            <div className="bg-white border border-[#e9ecef] rounded-[12px] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#e9ecef]">
                <h2 className="font-bold text-[14px] text-[#0b1f3a]">Recent Bids</h2>
                <Link to="/buyer/my-bids" className="font-bold text-[12px] text-[#d0021b] hover:underline">View All →</Link>
              </div>
              {myBids.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Gavel size={32} strokeWidth={1.3} className="text-[#adb5bd] mb-3" />
                  <p className="font-semibold text-[13px] text-[#6c757d]">No bids placed yet.</p>
                  <Link to="/buyer/browse" className="mt-3 font-bold text-[12px] text-[#d0021b] hover:underline">Browse Auctions →</Link>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-[#f8f9fa]">
                  {myBids.slice(0, 5).map(bid => {
                    const auction = auctions.find(a => a.auctionId === bid.auctionId);
                    return (
                      <div
                        key={bid.bidId}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-[#f8f9fa] transition-colors cursor-pointer"
                        onClick={() => auction && navigate(`/buyer/live-bidding/${auction.auctionId}`)}
                      >
                        <div className="bg-[#f8f9fa] rounded-[8px] size-[38px] overflow-hidden shrink-0">
                          {auction?.imageUrl
                            ? <img src={auction.imageUrl} alt={auction.title} className="w-full h-full object-cover" />
                            : <span className="flex items-center justify-center w-full h-full text-[16px]">{auction?.emoji ?? '📦'}</span>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[12px] text-[#343a40] truncate">{auction?.title ?? 'Auction Item'}</p>
                          <p className="text-[11px] text-[#adb5bd]">{new Date(bid.timestamp).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-[13px] text-[#d0021b]">PKR {bid.amount.toLocaleString()}</p>
                          <p className="text-[10px] text-[#adb5bd]">{bid.isWin ? '🏆 Won' : 'Bid placed'}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5">
            {/* Quick Links */}
            <div className="bg-white border border-[#e9ecef] rounded-[12px] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#e9ecef]">
                <h2 className="font-bold text-[14px] text-[#0b1f3a]">Quick Links</h2>
              </div>
              <div className="p-3 flex flex-col gap-1">
                {[
                  { label: 'Browse Auctions', to: '/buyer/browse', icon: '🔍' },
                  { label: 'My Bids', to: '/buyer/my-bids', icon: '🔨' },
                  { label: 'My Watchlist', to: '/buyer/watchlist', icon: '❤️' },
                ].map(l => (
                  <Link
                    key={l.label}
                    to={l.to}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] hover:bg-[#f8f9fa] transition-colors"
                  >
                    <span className="text-[16px]">{l.icon}</span>
                    <span className="font-semibold text-[13px] text-[#343a40]">{l.label}</span>
                    <span className="ml-auto text-[#adb5bd] text-[12px]">→</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-white border border-[#e9ecef] rounded-[12px] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#e9ecef]">
                <h2 className="font-bold text-[14px] text-[#0b1f3a]">Notifications</h2>
              </div>
              <div className="p-5 flex flex-col gap-4">
                {[
                  { label: 'Outbid alerts', sub: 'When someone outbids you', value: notifBids, set: setNotifBids },
                  { label: 'Win notifications', sub: 'When you win an auction', value: notifWins, set: setNotifWins },
                  { label: 'Platform updates', sub: 'New features & news', value: notifNews, set: setNotifNews },
                ].map(n => (
                  <div key={n.label} className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      {n.value ? <Bell size={14} strokeWidth={2} className="text-[#1a7a4a] mt-[2px] shrink-0" /> : <BellOff size={14} strokeWidth={2} className="text-[#adb5bd] mt-[2px] shrink-0" />}
                      <div>
                        <p className="font-semibold text-[12px] text-[#343a40]">{n.label}</p>
                        <p className="text-[11px] text-[#adb5bd]">{n.sub}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => n.set(v => !v)}
                      className={`shrink-0 w-[38px] h-[22px] rounded-full transition-colors relative ${n.value ? 'bg-[#1a7a4a]' : 'bg-[#dee2e6]'}`}
                    >
                      <span className={`absolute top-[3px] size-[16px] rounded-full bg-white shadow transition-transform ${n.value ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Security */}
            <div className="bg-white border border-[#e9ecef] rounded-[12px] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#e9ecef]">
                <h2 className="font-bold text-[14px] text-[#0b1f3a]">Security</h2>
              </div>
              <div className="p-5">
                {!showPwForm ? (
                  <button
                    onClick={() => setShowPwForm(true)}
                    className="w-full border border-[#dee2e6] font-semibold text-[13px] text-[#495057] py-2.5 rounded-[8px] hover:bg-[#f8f9fa] hover:border-[#d0021b] hover:text-[#d0021b] transition-colors"
                  >
                    Change Password
                  </button>
                ) : (
                  <div className="flex flex-col gap-3">
                    <label className="font-bold text-[12px] text-[#343a40]">New Password</label>
                    <div className="relative">
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={newPw}
                        onChange={e => setNewPw(e.target.value)}
                        className="w-full border border-[#dee2e6] rounded-[8px] px-3 py-2.5 text-[13px] text-[#343a40] outline-none focus:border-[#d0021b] pr-10"
                        placeholder="Min. 8 characters"
                      />
                      <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-[10px] text-[#adb5bd]">
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setShowPwForm(false); setNewPw(''); }}
                        className="flex-1 border border-[#dee2e6] font-semibold text-[12px] text-[#6c757d] py-2 rounded-[8px] hover:bg-[#f8f9fa]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => { setShowPwForm(false); setNewPw(''); }}
                        className="flex-1 bg-[#d0021b] font-bold text-[12px] text-white py-2 rounded-[8px] hover:bg-[#a80016]"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-[#f8f9fa]">
                  <button
                    onClick={logout}
                    className="w-full text-left font-semibold text-[12px] text-[#ef4444] hover:underline"
                  >
                    Sign out of all devices →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
