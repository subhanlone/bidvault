import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { mockApi } from '../../services/mockApi';
import { IconBidVaultLogo, IconDashboard, IconList, IconUsers } from '../../components/Icons';
import type { Listing } from '../../types';

function SellerSidebar({ active }: { active: string }) {
  const { user, logout } = useAuth();
  const status = user?.verificationStatus ?? 'UNVERIFIED';
  const badgeText = status === 'VERIFIED' ? 'Verified Seller' : status === 'PENDING' ? 'Under Review' : 'Unverified Seller';
  const badgeClass = status === 'VERIFIED' ? 'border-[#1a7a4a] text-[#1a7a4a]' : status === 'PENDING' ? 'border-[#f59e0b] text-[#f59e0b]' : 'border-[#d0021b] text-[#d0021b]';

  const items = [
    { label: 'Dashboard', icon: <IconDashboard />, path: '/seller/dashboard' },
    { label: 'Identity Verification', icon: <IconUsers />, path: '/seller/verification-status' },
    { label: 'My Listings', icon: <IconList />, path: '/seller/dashboard' },
  ];

  return (
    <aside className="bg-white border-r border-[#e9ecef] w-[200px] shrink-0 min-h-screen flex flex-col">
      <div className="flex gap-[10px] items-center px-5 py-5 border-b border-[#e9ecef]">
        <div className="bg-[#d0021b] flex items-center justify-center rounded-[8px] size-[32px]">
          <IconBidVaultLogo className="size-[16px]" />
        </div>
        <span className="font-extrabold text-[18px] text-[#0b1f3a] tracking-[-0.3px]">
          Bid<span className="text-[#d0021b]">Vault</span>
        </span>
      </div>

      <p className="font-bold text-[10px] text-[#adb5bd] tracking-[0.8px] uppercase px-5 pt-5 pb-2">Seller Account</p>
      <nav className="flex flex-col gap-1 px-3">
        {items.map(item => (
          <Link
            key={item.label}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-[9px] rounded-[8px] ${item.label === active ? 'bg-[#fff0f2] text-[#d0021b]' : 'text-[#6c757d] hover:bg-[#f8f9fa]'}`}
          >
            <span className={item.label === active ? 'text-[#d0021b]' : ''}>{item.icon}</span>
            <span className={`font-semibold text-[13px] ${item.label === active ? 'text-[#d0021b]' : ''}`}>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-2 px-5 py-5 border-t border-[#e9ecef]">
        <div className="flex items-center gap-2">
          <div className="bg-[#0b1f3a] size-[32px] rounded-full flex items-center justify-center text-white font-bold text-[13px] shrink-0">
            {user?.name?.[0] ?? 'S'}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-[12px] text-[#0b1f3a] truncate">{user?.name}</p>
            <span className={`border font-bold text-[10px] px-2 py-[1px] rounded-[99px] ${badgeClass}`}>{badgeText}</span>
          </div>
        </div>
        <button onClick={logout} className="text-[12px] text-[#6c757d] hover:text-[#d0021b] font-semibold text-left">Logout</button>
      </div>
    </aside>
  );
}

const STATUS_CONFIG = {
  PENDING: { label: 'Pending Review', bg: 'bg-[#fffbeb]', text: 'text-[#d97706]', border: 'border-[#fde68a]' },
  APPROVED: { label: 'Live / Approved', bg: 'bg-[#f0faf4]', text: 'text-[#1a7a4a]', border: 'border-[rgba(26,122,74,0.3)]' },
  REJECTED: { label: 'Rejected', bg: 'bg-[#fff5f5]', text: 'text-[#ef4444]', border: 'border-[#fecaca]' },
  DRAFT: { label: 'Draft', bg: 'bg-[#f8f9fa]', text: 'text-[#6c757d]', border: 'border-[#e9ecef]' },
};

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    mockApi.getSellerListings(user.userId).then(res => {
      if (res.success && res.data) setListings(res.data);
      setLoading(false);
    });
  }, [user]);

  const total = listings.length;
  const pending = listings.filter(l => l.status === 'PENDING').length;
  const approved = listings.filter(l => l.status === 'APPROVED').length;
  const rejected = listings.filter(l => l.status === 'REJECTED').length;

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex">
      <SellerSidebar active="Dashboard" />

      <main className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="bg-white border-b border-[#e9ecef] flex items-center justify-between px-8 py-4">
          <div>
            <h1 className="font-extrabold text-[20px] text-[#0b1f3a]">Seller Dashboard</h1>
            <p className="text-[12px] text-[#6c757d]">Manage your listings and track auction performance</p>
          </div>
          <button
            onClick={() => navigate('/seller/create-listing/step-1')}
            className="bg-[#d0021b] font-bold text-[13px] text-white px-5 py-[10px] rounded-[8px] hover:bg-[#a80016] transition-colors flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            Create New Listing
          </button>
        </header>

        <div className="flex-1 p-8">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Listings', value: total, color: 'text-[#0b1f3a]' },
              { label: 'Pending Review', value: pending, color: 'text-[#d97706]' },
              { label: 'Live / Approved', value: approved, color: 'text-[#1a7a4a]' },
              { label: 'Rejected', value: rejected, color: 'text-[#ef4444]' },
            ].map(s => (
              <div key={s.label} className="bg-white border border-[#e9ecef] rounded-[12px] p-5">
                <p className="font-medium text-[12px] text-[#6c757d] mb-2">{s.label}</p>
                <p className={`font-extrabold text-[32px] ${s.color} leading-none`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Listings table */}
          <div className="bg-white border border-[#e9ecef] rounded-[12px]">
            <div className="flex items-center justify-between p-5 border-b border-[#e9ecef]">
              <h2 className="font-bold text-[15px] text-[#0b1f3a]">My Listings</h2>
              {listings.length > 0 && (
                <span className="text-[12px] text-[#6c757d]">{total} listing{total !== 1 ? 's' : ''} total</span>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="size-8 border-[3px] border-[#d0021b] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : listings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="text-[48px] mb-4">📦</div>
                <h3 className="font-bold text-[16px] text-[#0b1f3a] mb-2">No listings yet</h3>
                <p className="text-[13px] text-[#6c757d] mb-5 max-w-[300px]">
                  Create your first auction listing to start selling on BidVault.
                </p>
                <button
                  onClick={() => navigate('/seller/create-listing/step-1')}
                  className="bg-[#d0021b] font-bold text-[13px] text-white px-5 py-3 rounded-[8px] hover:bg-[#a80016]"
                >
                  Create Your First Listing →
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-[40px_1fr_130px_100px_110px_90px] gap-4 px-5 py-3 text-[11px] text-[#adb5bd] font-bold uppercase tracking-[0.5px] border-b border-[#f8f9fa]">
                  <span />
                  <span>Item</span>
                  <span>Category</span>
                  <span>Start Price</span>
                  <span>Status</span>
                  <span>Submitted</span>
                </div>
                <div className="flex flex-col divide-y divide-[#f8f9fa]">
                  {listings.map(l => {
                    const cfg = STATUS_CONFIG[l.status] ?? STATUS_CONFIG.DRAFT;
                    return (
                      <div key={l.listingId} className="grid grid-cols-[40px_1fr_130px_100px_110px_90px] gap-4 items-center px-5 py-4 hover:bg-[#f8f9fa] transition-colors">
                        <div className="bg-[#f8f9fa] rounded-[8px] size-[36px] overflow-hidden shrink-0">
                          {l.imageUrl
                            ? <img src={l.imageUrl} alt={l.title} className="w-full h-full object-cover" />
                            : <span className="flex items-center justify-center w-full h-full text-[16px]">{l.emoji}</span>
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[13px] text-[#343a40] truncate">{l.title}</p>
                          <p className="text-[11px] text-[#adb5bd]">{l.condition}</p>
                        </div>
                        <p className="text-[12px] text-[#495057]">{l.category}</p>
                        <p className="font-bold text-[13px] text-[#0b1f3a]">PKR {l.startPrice.toLocaleString()}</p>
                        <span className={`inline-flex items-center font-bold text-[11px] px-2 py-1 rounded-[6px] border ${cfg.bg} ${cfg.text} ${cfg.border} w-fit`}>
                          {cfg.label}
                        </span>
                        <p className="text-[11px] text-[#adb5bd]">
                          {new Date(l.submittedAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Quick actions */}
          {listings.length > 0 && (
            <div className="mt-4 bg-white border border-[#e9ecef] rounded-[12px] p-5">
              <h3 className="font-bold text-[13px] text-[#0b1f3a] mb-3">Quick Actions</h3>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/seller/create-listing/step-1')}
                  className="border border-[#dee2e6] font-semibold text-[13px] text-[#495057] px-4 py-2 rounded-[8px] hover:bg-[#f8f9fa] hover:border-[#d0021b] hover:text-[#d0021b] transition-colors"
                >
                  + Create New Listing
                </button>
                <Link
                  to="/seller/verification-status"
                  className="border border-[#dee2e6] font-semibold text-[13px] text-[#495057] px-4 py-2 rounded-[8px] hover:bg-[#f8f9fa] transition-colors"
                >
                  View Verification Status
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
