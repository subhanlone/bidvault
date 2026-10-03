import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, CheckCircle2, XCircle, AlertCircle, Ban, Pencil } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { fetchAllMyListings } from '../../services/myListings';
import { SellerNavbar, Badge, Button, ErrorState, ReasonModal } from '../../components/ui';
import type { Listing, ListingStatus } from '../../types/api';
import { conditionLabel, dateMedium, pkr } from '../../utils/format';
import { listingBadge as badgeFor } from '../../utils/listingStatus';
import LoadingStatus from '../../components/ui/LoadingStatus';

type Tab = 'ALL' | ListingStatus;

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'ALL',      label: 'All',      icon: null },
  { key: 'PENDING',  label: 'Pending',  icon: <Clock size={12} /> },
  { key: 'APPROVED', label: 'Approved', icon: <CheckCircle2 size={12} /> },
  { key: 'REJECTED', label: 'Rejected', icon: <XCircle size={12} /> },
  // C3, Phase 7.
  { key: 'REMOVED',  label: 'Removed',  icon: <AlertCircle size={12} /> },
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
    REMOVED:  { icon: <AlertCircle size={40} strokeWidth={1.3} className="text-error" />,          heading: 'No removed listings',       sub: 'Listings taken down by an admin for cause will appear here.',    showCreate: false },
  };
  const m = messages[tab];
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="bg-surface-raised rounded-full p-4 mb-4">{m.icon}</div>
      <h3 className="font-bold text-[16px] text-navy mb-1">{m.heading}</h3>
      <p className="text-[13px] text-muted mb-5 max-w-xs">{m.sub}</p>
      {m.showCreate && (
        <Button variant="primary" onClick={onCreateListing}>
         Create Listing
        </Button>
      )}
    </div>
  );
}

export default function SellerMyListings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [tab, setTab]           = useState<Tab>('ALL');
  const [withdrawing, setWithdrawing] = useState<Listing | null>(null);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [cancelling, setCancelling] = useState<Listing | null>(null);

  const userId = user?.userId;
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchAllMyListings()
      .then(all => { if (!cancelled) setListings(all); })
      .catch(() => { if (!cancelled) setError('Could not load listings. Please try again.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId]);

  // "Try again": back to the loading state, then the same request the first load makes.
  function retryLoad() {
    setError(null);
    setLoading(true);
    fetchAllMyListings()
      .then(setListings)
      .catch(() => setError('Could not load listings. Please try again.'))
      .finally(() => setLoading(false));
  }

  async function handleWithdraw() {
    if (!withdrawing) return;
    setWithdrawLoading(true);
    try {
      await api.del(`/listings/${withdrawing.listingId}`);
      showToast({ type: 'success', title: 'Listing Withdrawn', message: `"${withdrawing.title}" has been withdrawn.` });
      setWithdrawing(null);
      setListings(await fetchAllMyListings());
    } catch (err: unknown) {
      showToast({ type: 'error', title: 'Could Not Withdraw', message: err instanceof Error ? err.message : 'Please try again.' });
    } finally {
      setWithdrawLoading(false);
    }
  }

  async function handleCancelAuction(reason: string) {
    if (!cancelling?.auctionId) return;
    await api.post(`/auctions/${cancelling.auctionId}/cancel`, { reason });
    showToast({ type: 'success', title: 'Auction Cancelled', message: `"${cancelling.title}" has been cancelled.` });
    setCancelling(null);
    setListings(await fetchAllMyListings());
  }

  const counts: Record<Tab, number> = {
    ALL:      listings.length,
    PENDING:  listings.filter(l => l.status === 'PENDING').length,
    APPROVED: listings.filter(l => l.status === 'APPROVED').length,
    REJECTED: listings.filter(l => l.status === 'REJECTED').length,
    DRAFT:    listings.filter(l => l.status === 'DRAFT').length,
    REMOVED:  listings.filter(l => l.status === 'REMOVED').length,
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
              {loading ? 'Loading…' : error ? 'Could not load your listings' : `${counts.ALL} listing${counts.ALL !== 1 ? 's' : ''} total`}
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => navigate('/seller/create-listing/step-1')}>
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
              {!loading && !error && (
                <span className={`ml-1 text-[11px] font-bold px-1.5 py-px rounded-full ${
                  tab === key ? 'bg-primary text-white' : 'bg-surface-raised text-placeholder'
                }`}>
                  {counts[key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Listings table */}
        {error && !loading ? (
          <ErrorState title="Could not load your listings" onRetry={retryLoad} />
        ) : (
        <div className="bg-surface border border-border-light rounded-md overflow-hidden">
          {loading ? (
            <div className="divide-y divide-bg">
              <LoadingStatus label="Loading your listings" />
              {Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)}
            </div>
          ) : visible.length === 0 ? (
            <EmptyTab tab={tab} onCreateListing={() => navigate('/seller/create-listing/step-1')} />
          ) : (
            <>
              {/* Desktop column headers */}
              <div className="hidden sm:grid grid-cols-[44px_1fr_140px_120px_130px_100px_140px] gap-4 px-5 py-2.5 text-[11px] font-bold text-placeholder uppercase tracking-wide border-b border-bg">
                <span /><span>Item</span><span>Category</span><span>Start Price</span><span>Status</span><span>Submitted</span><span>Actions</span>
              </div>

              <div className="divide-y divide-bg">
                {visible.map(l => {
                  const cfg = badgeFor(l);
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
                      <div className="hidden sm:grid grid-cols-[44px_1fr_140px_120px_130px_100px_140px] gap-4 items-center px-5 py-4 hover:bg-bg transition-colors">
                        <div className="w-9 h-9 bg-bg rounded-md overflow-hidden shrink-0 flex items-center justify-center border border-border-light">
                          {l.imageUrl
                            ? <img src={l.imageUrl} alt={l.title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            : <span className="text-base">{l.emoji}</span>
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-secondary truncate">{l.title}</p>
                          <p className="text-[11px] text-placeholder">{conditionLabel(l.condition)}</p>
                        </div>
                        <p className="text-[12px] text-tertiary truncate">{l.category}</p>
                        <p className="text-[13px] font-bold text-navy">{pkr(l.startPrice)}</p>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        <p className="text-[11px] text-placeholder">
                          {dateMedium(l.submittedAt)}
                        </p>
                        <div className="flex items-center gap-1.5">
                          {l.status === 'PENDING' && (
                            <button
                              onClick={() => setWithdrawing(l)}
                              className="border border-border-medium text-tertiary text-[11px] font-bold px-2.5 py-[5px] rounded-sm hover:bg-bg whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                              Withdraw
                            </button>
                          )}
                          {l.status === 'REJECTED' && (
                            <button
                              onClick={() => navigate(`/seller/listings/${l.listingId}/edit`)}
                              className="border border-border-medium text-primary text-[11px] font-bold px-2.5 py-[5px] rounded-sm hover:bg-bg whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary flex items-center gap-1"
                            >
                              <Pencil size={11} /> Edit &amp; Resubmit
                            </button>
                          )}
                          {l.isLive && l.auctionId && (
                            <button
                              onClick={() => setCancelling(l)}
                              aria-label="Cancel this auction"
                              title="Cancel this auction"
                              className="border border-border-medium text-destructive p-[5px] rounded-sm hover:bg-error-bg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                              <Ban size={13} />
                            </button>
                          )}
                        </div>
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
                            {l.category} · {pkr(l.startPrice)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                          {l.status === 'PENDING' && (
                            <button onClick={() => setWithdrawing(l)} className="text-[10px] font-bold text-tertiary underline cursor-pointer">
                              Withdraw
                            </button>
                          )}
                          {l.status === 'REJECTED' && (
                            <button onClick={() => navigate(`/seller/listings/${l.listingId}/edit`)} className="text-[10px] font-bold text-primary underline cursor-pointer">
                              Edit &amp; Resubmit
                            </button>
                          )}
                          {l.isLive && l.auctionId && (
                            <button onClick={() => setCancelling(l)} className="text-[10px] font-bold text-destructive underline cursor-pointer">
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
        )}
      </main>

      {withdrawing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50" onClick={() => setWithdrawing(null)}>
          <div
            role="dialog"
            aria-modal="true"
            className="bg-surface rounded-xl shadow-xl w-full max-w-[420px] p-6"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="font-bold text-[16px] text-navy mb-1">Withdraw Listing?</h2>
            <p className="text-[13px] text-muted mb-5">
              "{withdrawing.title}" will be removed from review. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setWithdrawing(null)}>Cancel</Button>
              <Button variant="primary" className="flex-1" loading={withdrawLoading} onClick={handleWithdraw}>Withdraw</Button>
            </div>
          </div>
        </div>
      )}

      {cancelling && (
        <ReasonModal
          title="Cancel Auction"
          subject={cancelling.title}
          description="This stops the auction immediately. No sale or charge will result, and it can't be undone."
          submitLabel="Cancel Auction"
          fieldLabel="Reason"
          placeholder="e.g. Changed my mind about selling this"
          onSubmit={handleCancelAuction}
          onClose={() => setCancelling(null)}
        />
      )}
    </div>
  );
}
