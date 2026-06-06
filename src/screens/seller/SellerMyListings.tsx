import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Package, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { SellerNavbar, Badge, Button } from '../../components/ui';
import type { Listing, ListingStatus } from '../../types';

const STATUS_CONFIG: Record<ListingStatus, { label: string; variant: 'warning' | 'success' | 'error' | 'tag' }> = {
  PENDING:  { label: 'Pending Review',  variant: 'warning' },
  APPROVED: { label: 'Live / Approved', variant: 'success' },
  REJECTED: { label: 'Rejected',        variant: 'error'   },
  DRAFT:    { label: 'Draft',           variant: 'tag'     },
};

type Tab = 'ALL' | ListingStatus;

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'ALL',      label: 'All',      icon: null },
  { key: 'PENDING',  label: 'Pending',  icon: <Clock size={12} /> },
  { key: 'APPROVED', label: 'Approved', icon: <CheckCircle2 size={12} /> },
  { key: 'REJECTED', label: 'Rejected', icon: <XCircle size={12} /> },
];

function RowSkeleton() {
  return (
    <div className="border-b border-bg last:border-0">
      <div className="hidden sm:grid grid-cols-[44px_1fr_140px_120px_130px_100px] gap-4 items-center px-5 py-4">
        <div className="w-9 h-9 bg-border-light rounded-md animate-pulse" />
        <div>
          <div className="h-4 w-3/4 bg-border-light rounded-md animate-pulse mb-1.5" />
          <div className="h-3 w-1/3 bg-border-light rounded-md animate-pulse" />
        </div>
        {[140, 100, 110, 80].map(w => (
          <div key={w} className={`h-4 w-[${w}px] bg-border-light rounded-md animate-pulse`} />
        ))}
      </div>
      <div className="sm:hidden flex items-center gap-3 px-4 py-3">
        <div className="w-11 h-11 bg-border-light rounded-md animate-pulse shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="h-4 w-3/4 bg-border-light rounded-md animate-pulse mb-1.5" />
          <div className="h-3 w-1/2 bg-border-light rounded-md animate-pulse" />
        </div>
        <div className="h-5 w-20 bg-border-light rounded-full animate-pulse" />
      </div>
    </div>
  );
}

function EmptyTab({ tab, onCreateListing }: { tab: Tab; onCreateListing: () => void }) {
  const messages: Record<Tab, { icon: React.ReactNode; heading: string; sub: string; showCreate: boolean }> = {
    ALL:      { icon: <Package size={40} strokeWidth={1.3} className="text-placeholder" />,        heading: 'No listings yet',           sub: 'Create your first listing to start selling.',                     showCreate: true  },
    PENDING:  { icon: <Clock size={40} strokeWidth={1.3} className="text-warning" />,              heading: 'No listings under review',  sub: 'Submitted listings awaiting admin approval will appear here.',   showCreate: false },
    APPROVED: { icon: <CheckCircle2 size={40} strokeWidth={1.3} className="text-success-dark" />, heading: 'No approved listings',      sub: 'Listings that have been approved and are live will appear here.', showCreate: false },
    REJECTED: { icon: <XCircle size={40} strokeWidth={1.3} className="text-error" />,             heading: 'No rejected listings',      sub: 'Great news — none of your listings have been rejected.',         showCreate: false },
    DRAFT:    { icon: <Package size={40} strokeWidth={1.3} className="text-placeholder" />,        heading: 'No drafts',                 sub: 'Unfinished listings will appear here.',                          showCreate: true  },
  };
  const m = messages[tab];
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="bg-surface-raised rounded-full p-4 mb-4">{m.icon}</div>
      <h3 className="font-bold text-[16px] text-navy mb-1">{m.heading}</h3>
      <p className="text-[13px] text-muted mb-5 max-w-xs">{m.sub}</p>
      {m.showCreate && (
        <Button variant="primary" onClick={onCreateListing}>
          <Plus size={14} strokeWidth={2.5} /> Create Listing
        </Button>
      )}
    </div>
  );
}

export default function SellerMyListings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [tab, setTab]           = useState<Tab>('ALL');

  useEffect(() => {
    if (!user) return;
    api.get<Listing[]>('/listings/mine')
      .then(data => setListings(data))
      .catch(() => setError('Could not load listings. Please try again.'))
      .finally(() => setLoading(false));
  }, [user?.userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const counts: Record<Tab, number> = {
    ALL:      listings.length,
    PENDING:  listings.filter(l => l.status === 'PENDING').length,
    APPROVED: listings.filter(l => l.status === 'APPROVED').length,
    REJECTED: listings.filter(l => l.status === 'REJECTED').length,
    DRAFT:    listings.filter(l => l.status === 'DRAFT').length,
  };

  const visible = tab === 'ALL' ? listings : listings.filter(l => l.status === tab);

  return (
    <div className="min-h-screen bg-bg">
      <SellerNavbar userName={user?.name} onLogout={logout} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-extrabold text-navy">My Listings</h1>
            <p className="text-sm text-muted mt-0.5">
              {loading ? 'Loading…' : `${counts.ALL} listing${counts.ALL !== 1 ? 's' : ''} total`}
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => navigate('/seller/create-listing/step-1')}>
            <Plus size={15} strokeWidth={2.5} />
            <span className="hidden sm:inline">Create New Listing</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 mb-4 border-b border-border-light overflow-x-auto">
          {TABS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer focus-visible:outline-none
                ${tab === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:text-secondary'
                }`}
            >
              {icon}
              {label}
              {!loading && (
                <span className={`ml-1 text-[11px] font-bold px-1.5 py-px rounded-full ${
                  tab === key ? 'bg-primary text-white' : 'bg-surface-raised text-placeholder'
                }`}>
                  {counts[key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-error-bg border border-error-border rounded-md flex items-center gap-3 px-4 py-3 mb-4">
            <XCircle size={16} className="text-error shrink-0" />
            <p className="text-[13px] text-error font-medium">{error}</p>
          </div>
        )}

        {/* Listings table */}
        <div className="bg-surface border border-border-light rounded-md overflow-hidden">
          {loading ? (
            <div className="divide-y divide-bg">
              {Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)}
            </div>
          ) : visible.length === 0 ? (
            <EmptyTab tab={tab} onCreateListing={() => navigate('/seller/create-listing/step-1')} />
          ) : (
            <>
              {/* Desktop column headers */}
              <div className="hidden sm:grid grid-cols-[44px_1fr_140px_120px_130px_100px] gap-4 px-5 py-2.5 text-[11px] font-bold text-placeholder uppercase tracking-wide border-b border-bg">
                <span /><span>Item</span><span>Category</span><span>Start Price</span><span>Status</span><span>Submitted</span>
              </div>

              <div className="divide-y divide-bg">
                {visible.map(l => {
                  const cfg = STATUS_CONFIG[l.status] ?? STATUS_CONFIG.DRAFT;
                  return (
                    <div key={l.listingId}>
                      {/* Rejection reason banner */}
                      {l.status === 'REJECTED' && l.rejectionReason && (
                        <div className="flex items-start gap-2 px-5 pt-3 pb-1">
                          <AlertCircle size={13} className="text-error shrink-0 mt-[2px]" />
                          <p className="text-[12px] text-error"><span className="font-bold">Rejection reason:</span> {l.rejectionReason}</p>
                        </div>
                      )}
                      {/* Desktop row */}
                      <div className="hidden sm:grid grid-cols-[44px_1fr_140px_120px_130px_100px] gap-4 items-center px-5 py-4 hover:bg-bg transition-colors">
                        <div className="w-9 h-9 bg-bg rounded-md overflow-hidden shrink-0 flex items-center justify-center border border-border-light">
                          {l.imageUrl
                            ? <img src={l.imageUrl} alt={l.title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            : <span className="text-base">{l.emoji}</span>
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-secondary truncate">{l.title}</p>
                          <p className="text-[11px] text-placeholder capitalize">{l.condition.replace('_', ' ').toLowerCase()}</p>
                        </div>
                        <p className="text-[12px] text-tertiary truncate">{l.category.split('&')[0].trim()}</p>
                        <p className="text-[13px] font-bold text-navy">PKR {l.startPrice.toLocaleString()}</p>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        <p className="text-[11px] text-placeholder">
                          {new Date(l.submittedAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: '2-digit' })}
                        </p>
                      </div>

                      {/* Mobile row */}
                      <div className="sm:hidden flex items-center gap-3 px-4 py-3 hover:bg-bg transition-colors">
                        <div className="w-11 h-11 bg-bg rounded-md overflow-hidden shrink-0 flex items-center justify-center border border-border-light">
                          {l.imageUrl
                            ? <img src={l.imageUrl} alt={l.title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            : <span className="text-lg">{l.emoji}</span>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-secondary truncate">{l.title}</p>
                          <p className="text-[11px] text-placeholder">
                            {l.category.split('&')[0].trim()} · PKR {l.startPrice.toLocaleString()}
                          </p>
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
