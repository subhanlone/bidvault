import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePendingListings } from '../../hooks/usePendingListings';
import { useToast } from '../../context/ToastContext';
import { CheckCircle2, ClipboardList, Menu, X } from 'lucide-react';
import AdminLayout from '../../components/ui/AdminLayout';
import NotificationBell from '../../components/ui/NotificationBell';
import { api } from '../../services/api';

export default function AdminListingReviews() {
  const navigate = useNavigate();
  const { pendingListings, refreshListings, approveAll } = usePendingListings();
  const { showToast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [approving, setApproving] = useState(false);
  const [reviewTimeoutHours, setReviewTimeoutHours] = useState<number | null>(null);

  useEffect(() => { refreshListings(); }, [refreshListings]);

  useEffect(() => {
    api.get<{ reviewTimeoutHours: number }>('/settings')
      .then(s => setReviewTimeoutHours(s.reviewTimeoutHours))
      .catch(() => {});
  }, []);

  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const isOverdue = (submittedAt: string) =>
    reviewTimeoutHours != null &&
    now - new Date(submittedAt).getTime() > reviewTimeoutHours * 3_600_000;

  const pendingCount = pendingListings.length;

  const handleApproveAll = async () => {
    setApproving(true);
    try {
      const result = await approveAll();
      if (result.failed === 0) {
        showToast({ type: 'success', title: 'Listings Approved', message: `${result.approved} listing${result.approved !== 1 ? 's' : ''} approved.` });
      } else {
        showToast({ type: 'warning', title: 'Partially Approved', message: `${result.approved} approved, ${result.failed} failed.` });
      }
    } catch {
      showToast({ type: 'error', title: 'Approval Failed', message: 'Could not approve listings.' });
    } finally {
      setApproving(false);
      setConfirmOpen(false);
    }
  };

  return (
    <AdminLayout active="Listing Review">
      {({ openMobileMenu }) => (
        <>
      <header className="bg-surface border-b border-border-light flex items-center justify-between px-4 sm:px-6 py-4 gap-3">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-2 rounded-sm border border-border-light hover:bg-bg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={openMobileMenu}
            aria-label="Open navigation menu"
          >
            <Menu size={18} className="text-tertiary" />
          </button>
          <div>
            <h1 className="font-extrabold text-[18px] sm:text-[20px] text-navy">Listing Review</h1>
            <p className="text-[12px] text-muted">
              {pendingCount > 0 ? `${pendingCount} listing${pendingCount !== 1 ? 's' : ''} awaiting review` : 'All listings reviewed'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="bg-warning-badge-bg border border-warning-border font-bold text-[12px] text-warning px-3 py-1 rounded-full">
              {pendingCount} Pending
            </span>
          )}
          <NotificationBell iconClass="text-tertiary hover:text-navy" align="right" />
          <button
            type="button"
            disabled={pendingCount === 0}
            onClick={() => setConfirmOpen(true)}
            className="bg-primary font-bold text-[12px] text-white px-3 py-[7px] rounded-sm hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
          >
            Approve All Pending
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 sm:p-6">
          {pendingCount === 0 ? (
            <div className="bg-surface border border-border-light rounded-md flex flex-col items-center justify-center py-16 px-6 text-center">
              <CheckCircle2 size={48} strokeWidth={1.3} className="text-success-dark mb-4" />
              <h2 className="font-bold text-[17px] text-navy mb-2">All caught up!</h2>
              <p className="text-[13px] text-muted">No pending listings to review right now.</p>
            </div>
          ) : (
            <div className="bg-surface border border-border-light rounded-md overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
                <div className="flex items-center gap-3">
                  <div className="bg-warning-badge-bg flex items-center justify-center rounded-sm size-[36px]">
                    <ClipboardList size={18} strokeWidth={1.8} className="text-warning" />
                  </div>
                  <div>
                    <h2 className="font-bold text-[14px] text-navy">Pending Listings Queue</h2>
                    <p className="text-[11px] text-muted">Click Review to inspect and approve or reject</p>
                  </div>
                </div>
              </div>

              <div className="hidden sm:grid sm:grid-cols-[40px_1fr_130px_110px_80px_110px] gap-3 px-5 py-3 text-[11px] text-placeholder font-bold uppercase tracking-[0.5px] border-b border-bg">
                <span /><span>Item</span><span>Seller</span><span>Category</span><span>Price</span><span>Action</span>
              </div>

              <div className="flex flex-col divide-y divide-bg">
                {pendingListings.map((l, idx) => (
                  <div key={l.listingId}>
                    <div className="hidden sm:grid sm:grid-cols-[40px_1fr_130px_110px_80px_110px] gap-3 items-center px-5 py-4 hover:bg-surface-hover transition-colors">
                      <span className="text-[12px] text-placeholder font-bold">{idx + 1}</span>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="bg-bg rounded-sm size-[38px] overflow-hidden shrink-0">
                          {l.imageUrl
                            ? <img src={l.imageUrl} alt={l.title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            : <span className="flex items-center justify-center w-full h-full text-[16px]">{l.emoji}</span>
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[13px] text-secondary truncate">{l.title}</p>
                          <p className="text-[10px] text-placeholder">
                            {new Date(l.submittedAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {isOverdue(l.submittedAt) && <span className="ml-2 text-destructive font-bold">· Overdue</span>}
                          </p>
                        </div>
                      </div>
                      <p className="text-[12px] text-tertiary truncate">{l.sellerName}</p>
                      <p className="text-[12px] text-tertiary">{l.category.split('&')[0].trim()}</p>
                      <p className="font-bold text-[13px] text-navy">PKR {(l.startPrice / 1000).toFixed(0)}K</p>
                      <button
                        onClick={() => navigate(`/admin/listing-review/${l.listingId}`)}
                        className="bg-primary font-bold text-[11px] text-white px-3 py-[6px] rounded-sm hover:bg-primary-dark transition-colors w-fit cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                      >
                        Review →
                      </button>
                    </div>

                    <div
                      className="sm:hidden flex items-center gap-3 px-4 py-3 hover:bg-surface-hover transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/listing-review/${l.listingId}`)}
                    >
                      <span className="text-[11px] text-placeholder font-bold w-5 shrink-0">{idx + 1}</span>
                      <div className="bg-bg rounded-sm size-[42px] overflow-hidden shrink-0">
                        {l.imageUrl
                          ? <img src={l.imageUrl} alt={l.title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          : <span className="flex items-center justify-center w-full h-full text-[16px]">{l.emoji}</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[13px] text-secondary truncate">{l.title}</p>
                        <p className="text-[11px] text-placeholder">{l.sellerName} · PKR {(l.startPrice / 1000).toFixed(0)}K</p>
                      </div>
                      <span className="text-[11px] font-bold text-primary shrink-0">Review →</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      {confirmOpen && (
        <div className="fixed inset-0 bg-[rgba(11,31,58,0.45)] flex items-center justify-center p-4 z-50">
          <div role="dialog" aria-modal="true" aria-labelledby="approve-all-title" className="bg-surface rounded-lg shadow-[0px_20px_60px_rgba(11,31,58,0.2)] w-full max-w-[420px] overflow-hidden">
            <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-0 flex items-center justify-between">
              <div className="bg-warning-badge-bg flex items-center justify-center rounded-full size-[44px]">
                <ClipboardList size={20} strokeWidth={2} className="text-warning" aria-hidden="true" />
              </div>
              <button
                onClick={() => setConfirmOpen(false)}
                aria-label="Close"
                className="bg-bg flex items-center justify-center rounded-full size-[32px] hover:bg-border-light transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
              >
                <X size={16} className="text-muted" aria-hidden="true" />
              </button>
            </div>
            <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-4">
              <h3 id="approve-all-title" className="font-extrabold text-[18px] text-navy mb-1">Approve all {pendingCount} listings?</h3>
              <p className="text-[13px] text-muted mb-5 leading-[20px]">This cannot be undone. Each listing will go live as an auction immediately.</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                  className="flex-1 border border-border-medium rounded-sm py-3 font-bold text-[13px] text-secondary hover:bg-bg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApproveAll}
                  disabled={approving}
                  className="flex-1 bg-primary rounded-sm py-3 font-bold text-[13px] text-white hover:bg-primary-dark disabled:opacity-60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                >
                  {approving ? 'Approving…' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </AdminLayout>
  );
}
