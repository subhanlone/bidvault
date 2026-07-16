import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePendingListings } from '../../hooks/usePendingListings';
import { useToast } from '../../context/ToastContext';
import { ChevronLeft, ChevronRight, Menu, Package, MessageSquare } from 'lucide-react';
import AdminLayout from '../../components/ui/AdminLayout';
import NotificationBell from '../../components/ui/NotificationBell';
import { Button } from '../../components/ui';
import Textarea from '../../components/ui/Textarea';
import { getCategoryFields } from '../../config/categoryFields';

const NOTES_KEY = (id: string) => `admin_review_notes_${id}`;

export default function AdminListingReview() {
  const { listingId } = useParams<{ listingId: string }>();
  const navigate = useNavigate();
  const { pendingListings, refreshListings, approveListing, rejectListing } = usePendingListings();

  useEffect(() => { refreshListings(); }, [refreshListings]);
  const { showToast } = useToast();

  const [notes, setNotes] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [navigating, setNavigating] = useState(false);

  const listing = pendingListings.find(l => l.listingId === listingId);
  const currentIndex = pendingListings.findIndex(l => l.listingId === listingId);
  const prevListing = currentIndex > 0 ? pendingListings[currentIndex - 1] : null;
  const nextListing = currentIndex < pendingListings.length - 1 ? pendingListings[currentIndex + 1] : null;

  // AR-03: Load persisted notes for this listing
  useEffect(() => {
    if (!listingId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    try { setNotes(localStorage.getItem(NOTES_KEY(listingId)) ?? ''); } catch { setNotes(''); }
  }, [listingId]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNotes(val);
    if (listingId) {
      try { localStorage.setItem(NOTES_KEY(listingId), val); } catch { /* noop */ }
    }
  };

  // AR-04: only removes from UI on success (hook throws on API failure)
  // AR-05: delay navigate 800ms so toast is visible
  const handleApprove = async () => {
    if (!listing) return;
    setLoading(true);
    try {
      const result = await approveListing(listing.listingId);
      setLoading(false);
      setNavigating(true);
      if (result.warning === 'scheduling-failed') {
        showToast({ type: 'warning', title: 'Listing Approved', message: `"${listing.title}" approved — auction scheduling may need attention.` });
      } else {
        showToast({ type: 'success', title: 'Listing Approved', message: `"${listing.title}" is now published.` });
      }
      setTimeout(() => navigate('/admin/listing-reviews'), 800);
    } catch {
      setLoading(false);
      showToast({ type: 'error', title: 'Approval Failed', message: 'Could not approve listing. Please try again.' });
    }
  };

  const handleReject = async () => {
    if (!listing) return;
    const reason = rejectReason.trim();
    if (reason.length < 3) {
      showToast({ type: 'error', title: 'Reason Required', message: 'Please provide a rejection reason (at least 3 characters).' });
      return;
    }
    setLoading(true);
    try {
      await rejectListing(listing.listingId, reason);
      setLoading(false);
      setNavigating(true);
      showToast({ type: 'info', title: 'Listing Rejected', message: `"${listing.title}" has been rejected.` });
      setTimeout(() => navigate('/admin/listing-reviews'), 800);
    } catch {
      setLoading(false);
      showToast({ type: 'error', title: 'Rejection Failed', message: 'Could not reject listing. Please try again.' });
    }
  };

  const conditionLabel: Record<string, string> = { NEW: 'New', LIKE_NEW: 'Like New', USED: 'Used' };

  if (!listing) {
    // suppress "not found" flash during the 800ms navigate delay after approve/reject
    if (navigating) return null;
    return (
      <div className="flex min-h-screen bg-bg items-center justify-center">
        <div className="text-center">
          <p className="font-bold text-[18px] text-secondary mb-4">Listing not found or already reviewed.</p>
          <Button variant="primary" onClick={() => navigate('/admin/listing-reviews')}>
            Back to Review Queue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout active="Listing Review">
      {({ openMobileMenu }) => (
        <>

      <header className="bg-surface border-b border-border-light flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 gap-3">
        <div className="flex items-center gap-3 min-w-0">
            <button
              className="md:hidden p-2 rounded-sm border border-border-light hover:bg-bg shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={openMobileMenu}
              aria-label="Open navigation menu"
            >
              <Menu size={18} className="text-tertiary" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <button onClick={() => navigate('/admin/listing-reviews')} className="text-[12px] text-muted hover:text-primary whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm">Listing Review</button>
                <ChevronRight size={10} className="shrink-0 text-placeholder" />
                <span className="font-semibold text-[12px] text-secondary truncate">{listing.title}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="bg-warning-badge-bg border border-warning-border font-bold text-[11px] text-warning px-2 py-[2px] rounded-full">Pending Review</span>
                <span className="hidden sm:inline text-[11px] text-muted">#{listing.listingId} · Submitted {new Date(listing.submittedAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })}</span>
                <span className="text-[11px] text-placeholder">{currentIndex + 1} of {pendingListings.length}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <NotificationBell iconClass="text-tertiary hover:text-navy" align="right" />
            <button
              onClick={() => prevListing && navigate(`/admin/listing-review/${prevListing.listingId}`)}
              disabled={!prevListing}
              className="border border-border-medium flex gap-1 items-center px-3 py-2 rounded-sm text-[13px] text-tertiary hover:bg-bg disabled:opacity-40 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ChevronLeft size={14} /><span className="hidden sm:inline">Previous</span>
            </button>
            <button
              onClick={() => nextListing && navigate(`/admin/listing-review/${nextListing.listingId}`)}
              disabled={!nextListing}
              className="border border-border-medium flex gap-1 items-center px-3 py-2 rounded-sm text-[13px] text-tertiary hover:bg-bg disabled:opacity-40 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="hidden sm:inline">Next</span><ChevronRight size={14} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-6 flex flex-col md:grid md:grid-cols-[1fr_360px] gap-4 sm:gap-5">

          {/* LEFT */}
          <div className="flex flex-col gap-4 sm:gap-5">
            <div className="bg-surface border border-border-light rounded-md overflow-hidden">
              <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-border-light">
                <h3 className="font-bold text-[14px] text-navy">Listing Details</h3>
                <span className="bg-warning-badge-bg border border-warning-border font-bold text-[11px] text-warning px-2 py-[2px] rounded-full">Pending Review</span>
              </div>
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-5">
                <div className="bg-navy rounded-md w-full sm:w-[160px] h-[160px] shrink-0 overflow-hidden flex items-center justify-center">
                  {listing.imageUrl
                    ? <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    : <Package size={48} strokeWidth={1.3} className="text-white/40" />
                  }
                </div>
                <div className="flex-1 grid grid-cols-2 gap-3 sm:gap-4">
                  {[
                    { label: 'TITLE',       value: listing.title },
                    { label: 'CATEGORY',    value: listing.category },
                    { label: 'CONDITION',   value: conditionLabel[listing.condition] ?? listing.condition },
                    { label: 'STARTING PRICE', value: `PKR ${listing.startPrice.toLocaleString()}` },
                  ].map(d => (
                    <div key={d.label}>
                      <p className="text-[10px] text-placeholder font-bold tracking-[0.5px] uppercase">{d.label}</p>
                      <p className="font-semibold text-[13px] text-secondary mt-[2px]">{d.value}</p>
                    </div>
                  ))}
                  <div className="col-span-2">
                    <p className="text-[10px] text-placeholder font-bold tracking-[0.5px] uppercase">DESCRIPTION</p>
                    <p className="text-[12px] text-tertiary leading-[18px] mt-[2px]">{listing.description || 'No description provided.'}</p>
                  </div>
                  {listing.attributes && Object.keys(listing.attributes).length > 0 && (
                    <div className="col-span-2">
                      <p className="text-[10px] text-placeholder font-bold tracking-[0.5px] uppercase mb-2">Category Details</p>
                      <div className="grid grid-cols-2 gap-3">
                        {getCategoryFields(listing.category).map(field => {
                          const value = listing.attributes?.[field.key];
                          if (value === undefined || value === '') return null;
                          return (
                            <div key={field.key}>
                              <p className="text-[10px] text-placeholder font-bold tracking-[0.5px] uppercase">{field.label}</p>
                              <p className="font-semibold text-[13px] text-secondary mt-[2px]">{String(value)}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="bg-surface border border-border-light rounded-md p-4 sm:p-5">
                <h3 className="font-bold text-[14px] text-navy mb-3">Seller Information</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-primary flex items-center justify-center rounded-full size-[40px] shrink-0">
                    <span className="font-bold text-[16px] text-white">{listing.sellerName[0]}</span>
                  </div>
                  <div>
                    <p className="font-bold text-[13px] text-secondary">{listing.sellerName}</p>
                    <p className="text-[11px] text-muted">Seller ID: {listing.sellerId.slice(0, 12)}…</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {[
                    { label: 'Listing ID', value: listing.listingId },
                    { label: 'Status',     value: listing.status },
                    { label: 'Submitted',  value: new Date(listing.submittedAt).toLocaleDateString('en-PK') },
                  ].map(d => (
                    <div key={d.label} className="flex justify-between">
                      <span className="text-[12px] text-muted">{d.label}</span>
                      <span className="font-semibold text-[12px] text-secondary">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AR-01: Honest price summary — no fake confidence */}
              <div className="bg-surface border border-border-light rounded-md p-4 sm:p-5">
                <h3 className="font-bold text-[14px] text-navy mb-3">Price Summary</h3>
                <div className="flex items-end gap-2 mb-3">
                  <span className="font-extrabold text-[24px] sm:text-[28px] text-navy">PKR {listing.startPrice.toLocaleString()}</span>
                  <span className="text-[12px] text-placeholder mb-1">starting price</span>
                </div>
                <div className="bg-bg border border-border-light rounded-sm px-3 py-2">
                  <span className="text-[11px] text-muted">No automated market data available for this item.</span>
                </div>
                {listing.reservePrice && (
                  <div className="mt-3 bg-bg border border-border-light rounded-sm px-3 py-2">
                    <p className="text-[10px] text-placeholder font-bold uppercase tracking-wide">Reserve Price</p>
                    <p className="font-bold text-[13px] text-secondary mt-0.5">PKR {listing.reservePrice.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT — Admin Decision */}
          <div className="flex flex-col gap-4 sm:gap-5">
            <div className="bg-surface border border-border-light rounded-md p-4 sm:p-5">
              <h3 className="font-bold text-[14px] text-navy mb-4">Admin Decision</h3>

              {!rejecting ? (
                <div className="flex gap-3 mb-4">
                  <Button variant="success" onClick={handleApprove} loading={loading} className="flex-1">
                    Approve &amp; Publish
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setRejecting(true)}
                    disabled={loading}
                    className="flex-1 text-error border-error hover:border-error hover:text-error"
                  >
                    Reject Listing
                  </Button>
                </div>
              ) : (
                <div className="mb-4">
                  <Textarea
                    label="Rejection Reason (required)"
                    placeholder="Explain why this listing is being rejected..."
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    rows={3}
                    maxLength={500}
                    className="mb-3 text-[12px]"
                  />
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setRejecting(false)}>
                      Cancel
                    </Button>
                    <Button className="flex-1 bg-destructive hover:bg-destructive-hover border-destructive" onClick={handleReject} loading={loading}>
                      Confirm Reject
                    </Button>
                  </div>
                </div>
              )}

              {/* AR-02: Real mailto button */}
              <button
                type="button"
                onClick={() => {
                  if (!listing.sellerEmail) return;
                  const subject = encodeURIComponent(`BidVault: More info needed for "${listing.title}"`);
                  const body = encodeURIComponent(`Hello ${listing.sellerName},\n\nWe need additional information about your listing "${listing.title}" before we can proceed with the review.\n\nPlease provide:\n\n\nThank you,\nBidVault Admin`);
                  window.open(`mailto:${listing.sellerEmail}?subject=${subject}&body=${body}`, '_blank');
                }}
                disabled={!listing.sellerEmail}
                className="w-full bg-primary-surface border border-[rgba(208,2,27,0.18)] rounded-sm p-3 mb-3 flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary text-left disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <MessageSquare size={13} className="text-primary shrink-0" />
                <p className="font-bold text-[12px] text-primary">Request More Info from Seller</p>
              </button>

              {/* AR-03: Notes saved to localStorage */}
              <Textarea
                label="Review notes (internal)"
                placeholder="Add internal notes about this listing decision..."
                value={notes}
                onChange={handleNotesChange}
                rows={3}
                maxLength={2000}
                className="text-[12px]"
              />
            </div>

            {/* Other Pending Listings */}
            <div className="bg-surface border border-border-light rounded-md p-4 sm:p-5 flex-1">
              <h3 className="font-bold text-[14px] text-navy mb-4">Other Pending Listings</h3>
              {pendingListings.filter(l => l.listingId !== listingId).length === 0 ? (
                <p className="text-[12px] text-muted text-center py-4">No other pending listings.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {pendingListings.filter(l => l.listingId !== listingId).slice(0, 6).map(l => (
                    <button
                      key={l.listingId}
                      onClick={() => navigate(`/admin/listing-review/${l.listingId}`)}
                      className="flex items-center gap-3 bg-bg rounded-sm px-3 py-2 cursor-pointer hover:bg-surface-subtle transition-colors text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <div className="bg-border-light rounded-sm size-[32px] overflow-hidden shrink-0 flex items-center justify-center">
                        {l.imageUrl
                          ? <img src={l.imageUrl} alt={l.title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          : <Package size={16} strokeWidth={1.5} className="text-muted" />
                        }
                      </div>
                      <p className="font-medium text-[11px] text-secondary flex-1 truncate">{l.title}</p>
                      <span className="font-bold text-[12px] text-navy shrink-0">{(l.startPrice / 1000).toFixed(0)}K</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        </>
      )}
    </AdminLayout>
  );
}
