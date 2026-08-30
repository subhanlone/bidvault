import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Package, Shield, Mail, Calendar, Gavel, PackageCheck, Clock, Banknote, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SellerNavbar, Badge, Button, Input, DeleteAccountModal } from '../../components/ui';
import { api } from '../../services/api';
import type { Listing } from '../../types/api';
import { dateShort, monthYear, pkr } from '../../utils/format';

const STATUS_CONFIG = {
  PENDING:  { label: 'Pending Review',  variant: 'warning' as const },
  APPROVED: { label: 'Live / Approved', variant: 'success' as const },
  REJECTED: { label: 'Rejected',        variant: 'error'   as const },
  DRAFT:    { label: 'Draft',           variant: 'tag'     as const },
};

export default function SellerProfile() {
  const { user, logout, changePassword } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [showPwForm, setShowPwForm] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [currentPwError, setCurrentPwError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [listings, setListings] = useState<Listing[]>([]);
  const [sellerStats, setSellerStats] = useState({ totalRevenue: 0, itemsSold: 0 });

  useEffect(() => {
    if (!user) return;
    Promise.allSettled([
      api.get('/listings/mine'),
      api.get('/payments/seller-stats'),
    ]).then(([listingsResult, statsResult]) => {
      if (listingsResult.status === 'fulfilled') setListings(listingsResult.value);
      if (statsResult.status === 'fulfilled') setSellerStats(statsResult.value);
    });
  }, [user?.userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const pending  = listings.filter(l => l.status === 'PENDING').length;
  const approved = listings.filter(l => l.status === 'APPROVED').length;

  const memberSince = user?.createdAt ? monthYear(user.createdAt) : '—';

  const stats = [
    { label: 'Approved Listings', value: approved,                       icon: <Gavel size={18} strokeWidth={1.8} className="text-primary" />,      bg: 'bg-primary-surface' },
    { label: 'Items Sold',        value: sellerStats.itemsSold,          icon: <PackageCheck size={18} strokeWidth={1.8} className="text-success-dark" />, bg: 'bg-success-bg' },
    { label: 'Pending Review',    value: pending,                        icon: <Clock size={18} strokeWidth={1.8} className="text-gold" />,          bg: 'bg-warning-surface' },
    { label: 'Total Revenue',     value: pkr(sellerStats.totalRevenue),  icon: <Banknote size={18} strokeWidth={1.8} className="text-navy" />,       bg: 'bg-info-card-bg' },
  ];

  const quickLinks = [
    { label: 'Dashboard', to: '/seller/dashboard', icon: <Package size={15} className="text-muted" /> },
    { label: 'My Listings', to: '/seller/listings', icon: <Gavel size={15} className="text-muted" /> },
    { label: 'Create New Listing', to: '/seller/create-listing/step-1', icon: <PackageCheck size={15} className="text-muted" /> },
  ];

  return (
    <div className="min-h-screen bg-bg">
      <SellerNavbar userName={user?.name} onLogout={logout} />

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
                <span className="font-extrabold text-[28px] sm:text-[32px] text-white">{user?.name?.[0] ?? 'S'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="font-extrabold text-[22px] sm:text-[26px] text-white tracking-[-0.3px]">{user?.name ?? 'Seller'}</h1>
                  <span className="bg-[rgba(26,122,74,0.2)] border border-[rgba(26,122,74,0.4)] font-bold text-[10px] text-verified px-2 py-[3px] rounded-full flex items-center gap-1">
                    <Shield size={9} strokeWidth={2.5} /> Verified Seller
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
                className="shrink-0 border border-[rgba(255,255,255,0.18)] font-semibold text-[13px] text-[rgba(255,255,255,0.6)] px-4 py-2 rounded-sm hover:border-primary hover:text-primary-tint transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
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
                    { label: 'Account Type', value: 'Seller' },
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

              {/* Recent Listings */}
              <div className="bg-surface border border-border-light rounded-md overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
                  <h2 className="font-bold text-[14px] text-navy">Recent Listings</h2>
                  <Link to="/seller/listings" className="font-bold text-[12px] text-primary hover:underline">View All →</Link>
                </div>
                {listings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Package size={32} strokeWidth={1.3} className="text-placeholder mb-3" />
                    <p className="font-semibold text-[13px] text-muted">No listings yet.</p>
                    <Link to="/seller/create-listing/step-1" className="mt-3 font-bold text-[12px] text-primary hover:underline">Create a Listing →</Link>
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-bg">
                    {listings.slice(0, 5).map(l => {
                      const cfg = STATUS_CONFIG[l.status] ?? STATUS_CONFIG.DRAFT;
                      return (
                        <button
                          key={l.listingId}
                          className="flex items-center gap-3 px-5 py-3 hover:bg-bg transition-colors text-left w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                          onClick={() => navigate('/seller/listings')}
                        >
                          <div className="bg-bg rounded-sm size-[38px] overflow-hidden shrink-0 flex items-center justify-center">
                            {l.imageUrl
                              ? <img src={l.imageUrl} alt={l.title} className="w-full h-full object-cover" />
                              : <span className="text-base">{l.emoji}</span>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[12px] text-secondary truncate">{l.title}</p>
                            <p className="text-[11px] text-placeholder">{dateShort(l.submittedAt)}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <Badge variant={cfg.variant}>{cfg.label}</Badge>
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
                      className="flex items-center gap-3 px-3 py-2.5 rounded-sm hover:bg-bg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                    >
                      {l.icon}
                      <span className="font-semibold text-[13px] text-secondary">{l.label}</span>
                      <span className="ml-auto text-placeholder text-[12px]">→</span>
                    </Link>
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
                      className="w-full border border-border-medium font-semibold text-[13px] text-tertiary py-2.5 rounded-sm hover:bg-bg hover:border-primary hover:text-primary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      Change Password
                    </button>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <Input
                        id="seller-current-password"
                        label="Current Password"
                        type="password"
                        value={currentPw}
                        onChange={e => { setCurrentPw(e.target.value); setCurrentPwError(''); }}
                        placeholder="Your current password"
                        error={currentPwError}
                      />
                      <Input
                        id="seller-new-password"
                        label="New Password"
                        type={showPw ? 'text' : 'password'}
                        value={newPw}
                        onChange={e => { setNewPw(e.target.value); setPwError(''); }}
                        placeholder="Min. 8 characters"
                        rightIcon={
                          <button
                            type="button"
                            aria-label={showPw ? 'Hide password' : 'Show password'}
                            onClick={() => setShowPw(v => !v)}
                            className="text-muted hover:text-body transition-colors"
                          >
                            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        }
                        error={pwError}
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 rounded-sm"
                          onClick={() => { setShowPwForm(false); setNewPw(''); setCurrentPw(''); setPwError(''); setCurrentPwError(''); }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 rounded-sm"
                          loading={pwLoading}
                          onClick={async () => {
                            setCurrentPwError('');
                            setPwError('');
                            if (!currentPw.trim()) { setCurrentPwError('Current password is required'); return; }
                            if (newPw.length < 8) { setPwError('Min. 8 characters'); return; }
                            setPwLoading(true);
                            const result = await changePassword(currentPw, newPw);
                            setPwLoading(false);
                            if (result.success) {
                              setShowPwForm(false); setNewPw(''); setCurrentPw(''); setPwError(''); setCurrentPwError('');
                              showToast({ type: 'success', title: 'Password Changed', message: 'Your password has been updated.' });
                            } else {
                              const message = result.error || 'Failed to change password.';
                              if (/current password/i.test(message)) setCurrentPwError(message);
                              else setPwError(message);
                            }
                          }}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-bg">
                    <button
                      onClick={logout}
                      className="w-full text-left font-semibold text-[12px] text-destructive hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                    >
                      Sign out of this device →
                    </button>
                  </div>
                </div>
              </div>

              {/* Danger zone */}
              <div className="bg-surface border border-error-border rounded-md overflow-hidden">
                <div className="px-5 py-4 border-b border-error-border">
                  <h2 className="font-bold text-[14px] text-error">Danger Zone</h2>
                </div>
                <div className="p-5">
                  <p className="text-[12px] text-muted mb-3">
                    Deleting your account is permanent. End any active auctions and settle unpaid
                    sales first — the request is refused while either is outstanding.
                  </p>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="w-full border border-error text-error font-semibold text-[13px] py-2.5 rounded-sm hover:bg-error-bg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showDeleteModal && (
        <DeleteAccountModal
          onClose={() => setShowDeleteModal(false)}
          onDeleted={() => {
            showToast({ type: 'success', title: 'Account Deleted', message: 'Your account has been deleted.' });
            navigate('/', { replace: true });
          }}
        />
      )}
    </div>
  );
}
