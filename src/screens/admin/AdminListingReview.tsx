import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuction } from '../../context/AuctionContext';
import { useToast } from '../../context/ToastContext';
import { Menu, ChevronLeft, ChevronRight, Download, Star } from 'lucide-react';
import { AdminSidebarContent } from '../../components/ui/AdminSidebar';
import { Button } from '../../components/ui';

export default function AdminListingReview() {
  const { listingId } = useParams<{ listingId: string }>();
  const navigate = useNavigate();
  const { pendingListings, approveListing, rejectListing } = useAuction();
  const { showToast } = useToast();

  const [notes, setNotes] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(4);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const listing = pendingListings.find(l => l.listingId === listingId);
  const currentIndex = pendingListings.findIndex(l => l.listingId === listingId);
  const prevListing = currentIndex > 0 ? pendingListings[currentIndex - 1] : null;
  const nextListing = currentIndex < pendingListings.length - 1 ? pendingListings[currentIndex + 1] : null;

  const handleApprove = async () => {
    if (!listing) return;
    setLoading(true);
    await approveListing(listing.listingId);
    setLoading(false);
    showToast({ type: 'success', title: 'Listing Approved', message: `"${listing.title}" is now published.` });
    navigate('/admin/listing-reviews');
  };

  const handleReject = async () => {
    if (!listing) return;
    if (!rejectReason.trim()) {
      showToast({ type: 'error', title: 'Reason Required', message: 'Please provide a rejection reason.' });
      return;
    }
    setLoading(true);
    await rejectListing(listing.listingId, rejectReason);
    setLoading(false);
    showToast({ type: 'info', title: 'Listing Rejected', message: `"${listing.title}" has been rejected.` });
    navigate('/admin/listing-reviews');
  };

  const conditionLabel: Record<string, string> = { NEW: 'New', LIKE_NEW: 'Like New', USED: 'Used' };

  if (!listing) {
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
    <div className="flex min-h-screen bg-bg">

      {/* Desktop sidebar */}
      <div className="hidden md:block md:w-[200px] md:shrink-0">
        <AdminSidebarContent active="Listing Review" />
      </div>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <AdminSidebarContent active="Listing Review" onClose={() => setSidebarOpen(false)} />
          <button className="flex-1 bg-[rgba(0,0,0,0.4)] border-0" onClick={() => setSidebarOpen(false)} aria-label="Close navigation menu" />
        </div>
      )}

      {/* MAIN */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top bar */}
        <header className="bg-surface border-b border-border-light flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="md:hidden p-2 rounded-[6px] border border-border-light hover:bg-bg shrink-0"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={18} className="text-tertiary" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <button onClick={() => navigate('/admin/listing-reviews')} className="text-[12px] text-muted hover:text-primary whitespace-nowrap cursor-pointer">Listing Review</button>
                <ChevronRight size={10} className="shrink-0 text-placeholder" />
                <span className="font-semibold text-[12px] text-secondary truncate">{listing.title}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="bg-[#fff3cd] border border-warning-border font-bold text-[11px] text-warning px-2 py-[2px] rounded-[99px]">Pending Review</span>
                <span className="hidden sm:inline text-[11px] text-muted">#{listing.listingId} · Submitted {new Date(listing.submittedAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })}</span>
                <span className="text-[11px] text-placeholder">{currentIndex + 1} of {pendingListings.length}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className="hidden sm:flex border border-[#dee2e6] gap-2 items-center px-3 py-2 rounded-sm text-[13px] text-tertiary hover:bg-bg cursor-pointer">
              <Download size={14} strokeWidth={2} /> Export
            </button>
            <button
              onClick={() => prevListing && navigate(`/admin/listing-review/${prevListing.listingId}`)}
              disabled={!prevListing}
              className="border border-[#dee2e6] flex gap-1 items-center px-3 py-2 rounded-sm text-[13px] text-tertiary hover:bg-bg disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft size={14} /><span className="hidden sm:inline">Previous</span>
            </button>
            <button
              onClick={() => nextListing && navigate(`/admin/listing-review/${nextListing.listingId}`)}
              disabled={!nextListing}
              className="border border-[#dee2e6] flex gap-1 items-center px-3 py-2 rounded-sm text-[13px] text-tertiary hover:bg-bg disabled:opacity-40 cursor-pointer"
            >
              <span className="hidden sm:inline">Next</span><ChevronRight size={14} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-6 flex flex-col md:grid md:grid-cols-[1fr_360px] gap-4 sm:gap-5">

          {/* LEFT */}
          <div className="flex flex-col gap-4 sm:gap-5">
            {/* Listing Details */}
            <div className="bg-surface border border-border-light rounded-md overflow-hidden">
              <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-border-light">
                <h3 className="font-bold text-[14px] text-navy">Listing Details</h3>
                <span className="bg-[#fff3cd] border border-warning-border font-bold text-[11px] text-warning px-2 py-[2px] rounded-[99px]">Pending Review</span>
              </div>
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-5">
                <div className="bg-navy rounded-md w-full sm:w-[160px] h-[160px] shrink-0 overflow-hidden">
                  {listing.imageUrl
                    ? <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    : <span className="flex items-center justify-center w-full h-full text-[60px]">{listing.emoji}</span>
                  }
                </div>
                <div className="flex-1 grid grid-cols-2 gap-3 sm:gap-4">
                  {[
                    { label: 'TITLE', value: listing.title },
                    { label: 'CATEGORY', value: listing.category },
                    { label: 'CONDITION', value: conditionLabel[listing.condition] ?? listing.condition },
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
                  {listing.reservePrice && (
                    <div>
                      <p className="text-[10px] text-placeholder font-bold tracking-[0.5px] uppercase">RESERVE PRICE</p>
                      <p className="font-semibold text-[13px] text-secondary mt-[2px]">PKR {listing.reservePrice.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Seller info + Price Analysis */}
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
                    { label: 'Status', value: listing.status },
                    { label: 'Submitted', value: new Date(listing.submittedAt).toLocaleDateString('en-PK') },
                  ].map(d => (
                    <div key={d.label} className="flex justify-between">
                      <span className="text-[12px] text-muted">{d.label}</span>
                      <span className="font-semibold text-[12px] text-secondary">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-surface border border-border-light rounded-md p-4 sm:p-5">
                <h3 className="font-bold text-[14px] text-navy mb-3">Price Assessment</h3>
                <div className="flex items-end gap-2 mb-3">
                  <span className="font-extrabold text-[24px] sm:text-[28px] text-success-dark">PKR {(listing.startPrice * 0.9).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  <span className="text-[12px] text-placeholder mb-1">— PKR {(listing.startPrice * 1.25).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-success-bg border border-[rgba(26,122,74,0.2)] font-bold text-[11px] text-success-dark px-2 py-1 rounded-[6px]">92%</span>
                  <span className="text-[12px] text-muted">Market confidence</span>
                </div>
                <div className="bg-bg border border-border-light rounded-sm px-3 py-2">
                  <span className="text-[11px] text-muted">→ Seller price is within the recommended range</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Admin Decision */}
          <div className="flex flex-col gap-4 sm:gap-5">
            <div className="bg-surface border border-border-light rounded-md p-4 sm:p-5">
              <h3 className="font-bold text-[14px] text-navy mb-4">Admin Decision</h3>

              {!rejecting ? (
                <div className="flex gap-3 mb-4">
                  <Button
                    variant="success"
                    onClick={handleApprove}
                    loading={loading}
                    className="flex-1"
                  >
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
                  <label className="font-bold text-[12px] text-secondary block mb-2">Rejection Reason (required)</label>
                  <textarea
                    className="bg-bg border border-border-light rounded-sm p-3 text-[12px] text-tertiary w-full h-[80px] resize-none outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(208,2,27,0.08)] mb-3"
                    placeholder="Explain why this listing is being rejected..."
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => setRejecting(false)}
                      className="flex-1 border border-[#dee2e6] font-semibold text-[13px] text-tertiary py-2.5 rounded-sm hover:bg-bg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={loading}
                      className="flex-1 bg-[#ef4444] font-bold text-[13px] text-white py-2.5 rounded-sm hover:bg-[#dc2626] disabled:opacity-60"
                    >
                      {loading ? '...' : 'Confirm Reject'}
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-primary-surface border border-[rgba(208,2,27,0.18)] rounded-sm p-3 mb-3">
                <p className="font-bold text-[12px] text-primary">☰ Request More Info from Seller</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-bold text-[12px] text-secondary">Review notes (internal)</label>
                <textarea
                  className="bg-bg border border-border-light rounded-sm p-3 text-[12px] text-tertiary w-full h-[80px] resize-none outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(208,2,27,0.08)] transition-shadow"
                  placeholder="Add internal notes about this listing decision..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Other Pending Listings */}
            <div className="bg-surface border border-border-light rounded-md p-4 sm:p-5 flex-1">
              <h3 className="font-bold text-[14px] text-navy mb-4">Other Pending Listings</h3>
              {pendingListings.filter(l => l.listingId !== listingId).length === 0 ? (
                <p className="text-[12px] text-muted text-center py-4">No other pending listings.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {pendingListings.filter(l => l.listingId !== listingId).slice(0, 6).map(l => (
                    <div
                      key={l.listingId}
                      onClick={() => navigate(`/admin/listing-review/${l.listingId}`)}
                      className="flex items-center gap-3 bg-bg rounded-sm px-3 py-2 cursor-pointer hover:bg-[#f0f0f0]"
                    >
                      <div className="bg-[#e9ecef] rounded-[6px] size-[32px] overflow-hidden shrink-0">
                        {l.imageUrl
                          ? <img src={l.imageUrl} alt={l.title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          : <span className="flex items-center justify-center w-full h-full text-[16px]">{l.emoji}</span>
                        }
                      </div>
                      <p className="font-medium text-[11px] text-secondary flex-1 truncate">{l.title}</p>
                      <span className="font-bold text-[12px] text-navy shrink-0">{(l.startPrice / 1000).toFixed(0)}K</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Star rating */}
            <div className="bg-surface border border-border-light rounded-md p-4 flex items-center gap-3">
              <div>
                <p className="font-bold text-[12px] text-secondary mb-1">Rate this listing quality</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setRating(n)} className="cursor-pointer">
                      <Star size={18} className={n <= rating ? 'text-gold' : 'text-[#dee2e6]'} fill={n <= rating ? '#f59e0b' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
