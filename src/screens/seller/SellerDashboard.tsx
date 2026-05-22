import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Package } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { mockApi } from '../../services/mockApi';
import { SellerNavbar, Badge, Button } from '../../components/ui';
import type { Listing } from '../../types';

const STATUS_CONFIG = {
  PENDING:  { label: 'Pending Review', variant: 'warning'     as const },
  APPROVED: { label: 'Live / Approved', variant: 'success'    as const },
  REJECTED: { label: 'Rejected',        variant: 'error'      as const },
  DRAFT:    { label: 'Draft',           variant: 'tag'        as const },
};

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!user) return;
    mockApi.getSellerListings(user.userId).then(res => {
      if (res.success && res.data) setListings(res.data);
      setLoading(false);
    });
  }, [user]);

  const total    = listings.length;
  const pending  = listings.filter(l => l.status === 'PENDING').length;
  const approved = listings.filter(l => l.status === 'APPROVED').length;
  const rejected = listings.filter(l => l.status === 'REJECTED').length;

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <SellerNavbar userName={user?.name} onLogout={logout} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-extrabold text-[#0b1f3a]">Seller Dashboard</h1>
            <p className="text-sm text-[#6c757d] mt-0.5">Manage your listings and track auction performance</p>
          </div>
          <Button variant="primary" size="sm" onClick={() => navigate('/seller/create-listing/step-1')}>
            <Plus size={15} strokeWidth={2.5} />
            <span className="hidden sm:inline">Create New Listing</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[
            { label: 'Total Listings', value: total,    color: 'text-[#0b1f3a]' },
            { label: 'Pending Review', value: pending,  color: 'text-[#d97706]' },
            { label: 'Live / Approved', value: approved, color: 'text-[#16a34a]' },
            { label: 'Rejected',       value: rejected, color: 'text-[#d0021b]' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-[#e9ecef] rounded-xl p-4 sm:p-5">
              <p className="text-[11px] font-medium text-[#6c757d] mb-1.5">{s.label}</p>
              <p className={`text-3xl font-extrabold leading-none ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Listings table */}
        <div className="bg-white border border-[#e9ecef] rounded-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#e9ecef]">
            <h2 className="text-sm font-bold text-[#0b1f3a]">My Listings</h2>
            {total > 0 && <span className="text-xs text-[#6c757d]">{total} listing{total !== 1 ? 's' : ''}</span>}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-[3px] border-[#d0021b] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : total === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <Package size={44} strokeWidth={1.3} className="text-[#adb5bd] mb-4" />
              <h3 className="text-base font-bold text-[#0b1f3a] mb-2">No listings yet</h3>
              <p className="text-sm text-[#6c757d] mb-5 max-w-xs">Create your first auction listing to start selling on BidVault.</p>
              <Button variant="primary" onClick={() => navigate('/seller/create-listing/step-1')}>
                Create Your First Listing
              </Button>
            </div>
          ) : (
            <>
              <div className="hidden sm:grid grid-cols-[40px_1fr_140px_110px_120px_90px] gap-4 px-5 py-2.5 text-[11px] font-bold text-[#adb5bd] uppercase tracking-wide border-b border-[#f8f9fa]">
                <span />
                <span>Item</span>
                <span>Category</span>
                <span>Start Price</span>
                <span>Status</span>
                <span>Submitted</span>
              </div>

              <div className="divide-y divide-[#f8f9fa]">
                {listings.map(l => {
                  const cfg = STATUS_CONFIG[l.status] ?? STATUS_CONFIG.DRAFT;
                  return (
                    <div key={l.listingId}>
                      {/* Desktop row */}
                      <div className="hidden sm:grid grid-cols-[40px_1fr_140px_110px_120px_90px] gap-4 items-center px-5 py-3.5 hover:bg-[#f8f9fa] transition-colors">
                        <div className="w-9 h-9 bg-[#f8f9fa] rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {l.imageUrl
                            ? <img src={l.imageUrl} alt={l.title} className="w-full h-full object-cover" />
                            : <span className="text-base">{l.emoji}</span>
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#343a40] truncate">{l.title}</p>
                          <p className="text-[11px] text-[#adb5bd]">{l.condition}</p>
                        </div>
                        <p className="text-xs text-[#495057]">{l.category}</p>
                        <p className="text-sm font-bold text-[#0b1f3a]">PKR {l.startPrice.toLocaleString()}</p>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        <p className="text-[11px] text-[#adb5bd]">
                          {new Date(l.submittedAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>

                      {/* Mobile card */}
                      <div className="sm:hidden flex items-center gap-3 px-4 py-3 hover:bg-[#f8f9fa] transition-colors">
                        <div className="w-11 h-11 bg-[#f8f9fa] rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {l.imageUrl
                            ? <img src={l.imageUrl} alt={l.title} className="w-full h-full object-cover" />
                            : <span className="text-lg">{l.emoji}</span>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#343a40] truncate">{l.title}</p>
                          <p className="text-[11px] text-[#adb5bd]">{l.category} · PKR {l.startPrice.toLocaleString()}</p>
                        </div>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {total > 0 && (
          <div className="mt-4 bg-white border border-[#e9ecef] rounded-xl px-5 py-4">
            <h3 className="text-sm font-bold text-[#0b1f3a] mb-3">Quick Actions</h3>
            <Button variant="outline" size="sm" onClick={() => navigate('/seller/create-listing/step-1')}>
              + Create New Listing
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
