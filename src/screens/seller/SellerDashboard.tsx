import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Package, Banknote, Gavel, PackageCheck, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { SellerNavbar, Badge, Button, StatCard } from '../../components/ui';
import type { Listing } from '../../types';

function StatCardSkeleton() {
  return (
    <div className="bg-surface border border-border-light rounded-md p-4 sm:p-5">
      <div className="h-3 w-24 bg-border-light rounded-md animate-pulse mb-3" />
      <div className="h-8 w-12 bg-border-light rounded-md animate-pulse" />
    </div>
  );
}

function ListingRowSkeleton() {
  return (
    <div className="border-b border-bg last:border-0">
      <div className="hidden sm:grid grid-cols-[40px_1fr_140px_110px_120px_90px] gap-4 items-center px-5 py-3.5">
        <div className="w-9 h-9 bg-border-light rounded-md animate-pulse" />
        <div>
          <div className="h-4 w-3/4 bg-border-light rounded-md animate-pulse mb-1.5" />
          <div className="h-3 w-1/3 bg-border-light rounded-md animate-pulse" />
        </div>
        <div className="h-4 w-20 bg-border-light rounded-md animate-pulse" />
        <div className="h-4 w-16 bg-border-light rounded-md animate-pulse" />
        <div className="h-5 w-24 bg-border-light rounded-full animate-pulse" />
        <div className="h-3 w-12 bg-border-light rounded-md animate-pulse" />
      </div>
      <div className="sm:hidden flex items-center gap-3 px-4 py-3">
        <div className="w-11 h-11 bg-border-light rounded-md animate-pulse flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="h-4 w-3/4 bg-border-light rounded-md animate-pulse mb-1.5" />
          <div className="h-3 w-1/2 bg-border-light rounded-md animate-pulse" />
        </div>
        <div className="h-5 w-16 bg-border-light rounded-full animate-pulse" />
      </div>
    </div>
  );
}

const STATUS_CONFIG = {
  PENDING:  { label: 'Pending Review',  variant: 'warning' as const },
  APPROVED: { label: 'Live / Approved', variant: 'success' as const },
  REJECTED: { label: 'Rejected',        variant: 'error'   as const },
  DRAFT:    { label: 'Draft',           variant: 'tag'     as const },
};

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.get<Listing[]>('/listings/mine').then(data => {
      setListings(data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user?.userId]);

  const total    = listings.length;
  const pending  = listings.filter(l => l.status === 'PENDING').length;
  const approved = listings.filter(l => l.status === 'APPROVED').length;
  const revenue  = listings.filter(l => l.status === 'APPROVED').reduce((sum, l) => sum + l.startPrice, 0);
  const itemsSold = Math.max(0, total - pending);

  return (
    <div className="min-h-screen bg-bg">
      <SellerNavbar userName={user?.name} onLogout={logout} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-extrabold text-navy">Seller Dashboard</h1>
            <p className="text-sm text-muted mt-0.5">Manage your listings and track auction performance</p>
          </div>
          <Button variant="primary" size="sm" onClick={() => navigate('/seller/create-listing/step-1')}>
            <Plus size={15} strokeWidth={2.5} />
            <span className="hidden sm:inline">Create New Listing</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          ) : (
            <>
              <StatCard label="Revenue"         value={`PKR ${revenue.toLocaleString()}`} icon={<Banknote size={18} />}    iconColor="success" padding="sm" />
              <StatCard label="Active Auctions" value={approved}                           icon={<Gavel size={18} />}       iconColor="info"    padding="sm" />
              <StatCard label="Items Sold"      value={itemsSold}                          icon={<PackageCheck size={18} />} iconColor="success" padding="sm" />
              <StatCard label="Pending Review"  value={pending}                            icon={<Clock size={18} />}       iconColor="warning" padding="sm" />
            </>
          )}
        </div>

        <div className="bg-surface border border-border-light rounded-md">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
            <h2 className="text-sm font-bold text-navy">My Listings</h2>
            {!loading && total > 0 && <span className="text-xs text-muted">{total} listing{total !== 1 ? 's' : ''}</span>}
          </div>

          {loading ? (
            <div className="divide-y divide-bg">
              {Array.from({ length: 4 }).map((_, i) => <ListingRowSkeleton key={i} />)}
            </div>
          ) : total === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <Package size={44} strokeWidth={1.3} className="text-placeholder mb-4" />
              <h3 className="text-base font-bold text-navy mb-2">No listings yet</h3>
              <p className="text-sm text-muted mb-5 max-w-xs">Create your first auction listing to start selling on BidVault.</p>
              <Button variant="primary" onClick={() => navigate('/seller/create-listing/step-1')}>
                Create Your First Listing
              </Button>
            </div>
          ) : (
            <>
              <div className="hidden sm:grid grid-cols-[40px_1fr_140px_110px_120px_90px] gap-4 px-5 py-2.5 text-[11px] font-bold text-placeholder uppercase tracking-wide border-b border-bg">
                <span /><span>Item</span><span>Category</span><span>Start Price</span><span>Status</span><span>Submitted</span>
              </div>
              <div className="divide-y divide-bg">
                {listings.map(l => {
                  const cfg = STATUS_CONFIG[l.status] ?? STATUS_CONFIG.DRAFT;
                  return (
                    <div key={l.listingId}>
                      <div className="hidden sm:grid grid-cols-[40px_1fr_140px_110px_120px_90px] gap-4 items-center px-5 py-3.5 hover:bg-bg transition-colors">
                        <div className="w-9 h-9 bg-bg rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {l.imageUrl
                            ? <img src={l.imageUrl} alt={l.title} className="w-full h-full object-cover" />
                            : <span className="text-base">{l.emoji}</span>
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-secondary truncate">{l.title}</p>
                          <p className="text-[11px] text-placeholder">{l.condition}</p>
                        </div>
                        <p className="text-xs text-tertiary">{l.category}</p>
                        <p className="text-sm font-bold text-navy">PKR {l.startPrice.toLocaleString()}</p>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        <p className="text-[11px] text-placeholder">
                          {new Date(l.submittedAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <div className="sm:hidden flex items-center gap-3 px-4 py-3 hover:bg-bg transition-colors">
                        <div className="w-11 h-11 bg-bg rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {l.imageUrl
                            ? <img src={l.imageUrl} alt={l.title} className="w-full h-full object-cover" />
                            : <span className="text-lg">{l.emoji}</span>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-secondary truncate">{l.title}</p>
                          <p className="text-[11px] text-placeholder">{l.category} · PKR {l.startPrice.toLocaleString()}</p>
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
      </main>
    </div>
  );
}
