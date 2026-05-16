import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAuction } from '../../context/AuctionContext';
import { useToast } from '../../context/ToastContext';
import {
  IconBidVaultLogo, IconDashboard, IconList, IconUsers, IconAlert,
  IconAnalytics, IconSettings, IconChevronLeft, IconChevronRight,
  IconExport, IconStar,
} from '../../components/Icons';

const sidebarItems = [
  { icon: <IconDashboard />, label: 'Dashboard', active: false, badge: '' },
  { icon: <IconList />, label: 'Live Auctions', badge: '3' },
  { icon: <IconList />, label: 'Listing Review', badge: '', active: true },
  { icon: <IconUsers />, label: 'Seller Verification', badge: '' },
  { icon: <IconAlert />, label: 'Fraud Alerts', badge: '3' },
  { icon: <IconUsers />, label: 'Users', badge: '' },
  { icon: <IconAnalytics />, label: 'Analytics', badge: '' },
  { icon: <IconList />, label: 'Reports', badge: '' },
  { icon: <IconSettings />, label: 'Settings', badge: '' },
];

export default function AdminListingReview() {
  const { listingId } = useParams<{ listingId: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { pendingListings, approveListing, rejectListing } = useAuction();
  const { showToast } = useToast();

  const [notes, setNotes] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(4);

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
    navigate('/admin/dashboard');
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
    navigate('/admin/dashboard');
  };

  const conditionLabel: Record<string, string> = { NEW: 'New', LIKE_NEW: 'Like New', USED: 'Used' };

  if (!listing) {
    return (
      <div className="flex min-h-screen bg-[#f8f9fa] items-center justify-center">
        <div className="text-center">
          <p className="font-bold text-[18px] text-[#343a40] mb-4">Listing not found or already reviewed.</p>
          <button onClick={() => navigate('/admin/dashboard')} className="bg-[#d0021b] font-bold text-[14px] text-white px-6 py-3 rounded-[8px] hover:bg-[#a80016]">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8f9fa] font-[Plus_Jakarta_Sans,sans-serif]">

      {/* SIDEBAR */}
      <aside className="bg-[#0b1f3a] flex flex-col w-[200px] shrink-0 min-h-screen">
        <div className="flex gap-[10px] items-center px-5 py-5 border-b border-[rgba(255,255,255,0.08)]">
          <div className="bg-[#d0021b] flex items-center justify-center rounded-[8px] size-[32px]">
            <IconBidVaultLogo className="size-[16px]" />
          </div>
          <span className="font-extrabold text-[18px] text-white tracking-[-0.3px]">
            Bid<span className="text-[#d0021b]">Vault</span>
          </span>
        </div>
        <nav className="flex flex-col gap-[2px] p-3 flex-1">
          {sidebarItems.map(item => (
            <div
              key={item.label}
              onClick={() => item.label === 'Dashboard' && navigate('/admin/dashboard')}
              className={`flex items-center gap-[10px] px-3 py-[9px] rounded-[8px] cursor-pointer ${item.active ? 'bg-[rgba(208,2,27,0.15)] text-[#ff6b7a]' : 'text-[rgba(255,255,255,0.55)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white'}`}
            >
              <span className={item.active ? 'text-[#ff6b7a]' : ''}>{item.icon}</span>
              <span className="font-semibold text-[12.5px] flex-1">{item.label}</span>
              {item.badge && <span className={`font-bold text-[10px] px-[6px] py-[2px] rounded-[99px] ${item.active ? 'bg-[#d0021b] text-white' : 'bg-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.7)]'}`}>{item.badge}</span>}
            </div>
          ))}
        </nav>
        <div className="flex items-center gap-[10px] px-4 py-4 border-t border-[rgba(255,255,255,0.08)]">
          <div className="bg-[#d0021b] flex items-center justify-center rounded-full size-[32px] shrink-0">
            <span className="font-bold text-[13px] text-white">{user?.name?.[0] ?? 'A'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[12px] text-white leading-tight truncate">{user?.name ?? 'Admin'}</p>
            <p className="text-[10px] text-[rgba(255,255,255,0.45)]">Admin</p>
          </div>
          <button onClick={logout} className="text-[10px] text-[rgba(255,255,255,0.4)] hover:text-white shrink-0">Out</button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="bg-white border-b border-[#e9ecef] flex items-center justify-between px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/admin/dashboard')} className="text-[12px] text-[#6c757d] hover:text-[#d0021b]">Listing Review</button>
              <IconChevronRight className="size-[10px]" />
              <span className="font-semibold text-[12px] text-[#343a40] max-w-[280px] truncate">{listing.title}</span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="bg-[#fff3cd] border border-[#fde68a] font-bold text-[11px] text-[#d97706] px-2 py-[2px] rounded-[99px]">Pending Review</span>
              <span className="text-[11px] text-[#6c757d]">#{listing.listingId} · Submitted {new Date(listing.submittedAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              <span className="text-[11px] text-[#adb5bd]">{currentIndex + 1} of {pendingListings.length}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="border border-[#dee2e6] flex gap-2 items-center px-4 py-2 rounded-[8px] text-[13px] text-[#495057] hover:bg-[#f8f9fa]">
              <IconExport /> Export
            </button>
            <button
              onClick={() => prevListing && navigate(`/admin/listing-review/${prevListing.listingId}`)}
              disabled={!prevListing}
              className="border border-[#dee2e6] flex gap-2 items-center px-4 py-2 rounded-[8px] text-[13px] text-[#495057] hover:bg-[#f8f9fa] disabled:opacity-40"
            >
              <IconChevronLeft /> Previous
            </button>
            <button
              onClick={() => nextListing && navigate(`/admin/listing-review/${nextListing.listingId}`)}
              disabled={!nextListing}
              className="border border-[#dee2e6] flex gap-2 items-center px-4 py-2 rounded-[8px] text-[13px] text-[#495057] hover:bg-[#f8f9fa] disabled:opacity-40"
            >
              Next <IconChevronRight />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 grid grid-cols-[1fr_380px] gap-5">

          {/* LEFT */}
          <div className="flex flex-col gap-5">
            {/* Listing Details */}
            <div className="bg-white border border-[#e9ecef] rounded-[12px] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#e9ecef]">
                <h3 className="font-bold text-[14px] text-[#0b1f3a]">Listing Details</h3>
                <span className="bg-[#fff3cd] border border-[#fde68a] font-bold text-[11px] text-[#d97706] px-2 py-[2px] rounded-[99px]">Pending Review</span>
              </div>
              <div className="p-5 flex gap-5">
                <div className="bg-[#0b1f3a] rounded-[10px] w-[180px] h-[160px] shrink-0 overflow-hidden">
                  {listing.imageUrl
                    ? <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    : <span className="flex items-center justify-center w-full h-full text-[60px]">{listing.emoji}</span>
                  }
                </div>
                <div className="flex-1 grid grid-cols-2 gap-4">
                  {[
                    { label: 'TITLE', value: listing.title },
                    { label: 'CATEGORY', value: listing.category },
                    { label: 'CONDITION', value: conditionLabel[listing.condition] ?? listing.condition },
                    { label: 'STARTING PRICE', value: `PKR ${listing.startPrice.toLocaleString()}` },
                  ].map(d => (
                    <div key={d.label}>
                      <p className="text-[10px] text-[#adb5bd] font-bold tracking-[0.5px] uppercase">{d.label}</p>
                      <p className="font-semibold text-[13px] text-[#343a40] mt-[2px]">{d.value}</p>
                    </div>
                  ))}
                  <div className="col-span-2">
                    <p className="text-[10px] text-[#adb5bd] font-bold tracking-[0.5px] uppercase">DESCRIPTION</p>
                    <p className="text-[12px] text-[#495057] leading-[18px] mt-[2px]">{listing.description || 'No description provided.'}</p>
                  </div>
                  {listing.reservePrice && (
                    <div>
                      <p className="text-[10px] text-[#adb5bd] font-bold tracking-[0.5px] uppercase">RESERVE PRICE</p>
                      <p className="font-semibold text-[13px] text-[#343a40] mt-[2px]">PKR {listing.reservePrice.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Seller info + Price Analysis */}
            <div className="grid grid-cols-2 gap-5">
              <div className="bg-white border border-[#e9ecef] rounded-[12px] p-5">
                <h3 className="font-bold text-[14px] text-[#0b1f3a] mb-3">Seller Information</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-[#d0021b] flex items-center justify-center rounded-full size-[40px] shrink-0">
                    <span className="font-bold text-[16px] text-white">{listing.sellerName[0]}</span>
                  </div>
                  <div>
                    <p className="font-bold text-[13px] text-[#343a40]">{listing.sellerName}</p>
                    <p className="text-[11px] text-[#6c757d]">Seller ID: {listing.sellerId.slice(0, 12)}…</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {[
                    { label: 'Listing ID', value: listing.listingId },
                    { label: 'Status', value: listing.status },
                    { label: 'Submitted', value: new Date(listing.submittedAt).toLocaleDateString('en-PK') },
                  ].map(d => (
                    <div key={d.label} className="flex justify-between">
                      <span className="text-[12px] text-[#6c757d]">{d.label}</span>
                      <span className="font-semibold text-[12px] text-[#343a40]">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-[#e9ecef] rounded-[12px] p-5">
                <h3 className="font-bold text-[14px] text-[#0b1f3a] mb-3">AI Price Analysis</h3>
                <div className="flex items-end gap-2 mb-3">
                  <span className="font-extrabold text-[28px] text-[#1a7a4a]">PKR {(listing.startPrice * 0.9).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  <span className="text-[12px] text-[#adb5bd] mb-1">— PKR {(listing.startPrice * 1.25).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-[#f0faf4] border border-[rgba(26,122,74,0.2)] font-bold text-[11px] text-[#1a7a4a] px-2 py-1 rounded-[6px]">92%</span>
                  <span className="text-[12px] text-[#6c757d]">Market confidence</span>
                </div>
                <div className="bg-[#f8f9fa] border border-[#e9ecef] rounded-[8px] px-3 py-2">
                  <span className="text-[11px] text-[#6c757d]">→ Seller price is within the recommended range</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Admin Decision */}
          <div className="flex flex-col gap-5">
            <div className="bg-white border border-[#e9ecef] rounded-[12px] p-5">
              <h3 className="font-bold text-[14px] text-[#0b1f3a] mb-4">Admin Decision</h3>

              {!rejecting ? (
                <div className="flex gap-3 mb-4">
                  <button
                    onClick={handleApprove}
                    disabled={loading}
                    className="flex-1 bg-[#1a7a4a] font-bold text-[13px] text-white py-2.5 rounded-[8px] hover:bg-[#15643d] disabled:opacity-60"
                  >
                    {loading ? '...' : '✓ Approve & Publish'}
                  </button>
                  <button
                    onClick={() => setRejecting(true)}
                    disabled={loading}
                    className="flex-1 bg-[#ef4444] font-bold text-[13px] text-white py-2.5 rounded-[8px] hover:bg-[#dc2626] disabled:opacity-60"
                  >
                    ✕ Reject Listing
                  </button>
                </div>
              ) : (
                <div className="mb-4">
                  <label className="font-bold text-[12px] text-[#343a40] block mb-2">Rejection Reason (required)</label>
                  <textarea
                    className="bg-[#f8f9fa] border border-[#e9ecef] rounded-[8px] p-3 text-[12px] text-[#495057] w-full h-[80px] resize-none outline-none focus:border-[#ef4444] mb-3"
                    placeholder="Explain why this listing is being rejected..."
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => setRejecting(false)}
                      className="flex-1 border border-[#dee2e6] font-semibold text-[13px] text-[#495057] py-2.5 rounded-[8px] hover:bg-[#f8f9fa]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={loading}
                      className="flex-1 bg-[#ef4444] font-bold text-[13px] text-white py-2.5 rounded-[8px] hover:bg-[#dc2626] disabled:opacity-60"
                    >
                      {loading ? '...' : 'Confirm Reject'}
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-[#fff0f2] border border-[rgba(208,2,27,0.18)] rounded-[8px] p-3 mb-3">
                <p className="font-bold text-[12px] text-[#d0021b]">☰ Request More Info from Seller</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-bold text-[12px] text-[#343a40]">Review notes (internal)</label>
                <textarea
                  className="bg-[#f8f9fa] border border-[#e9ecef] rounded-[8px] p-3 text-[12px] text-[#495057] w-full h-[80px] resize-none outline-none focus:border-[#d0021b]"
                  placeholder="Add internal notes about this listing decision..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Similar Listings (static comparable context) */}
            <div className="bg-white border border-[#e9ecef] rounded-[12px] p-5 flex-1">
              <h3 className="font-bold text-[14px] text-[#0b1f3a] mb-4">Other Pending Listings</h3>
              {pendingListings.filter(l => l.listingId !== listingId).length === 0 ? (
                <p className="text-[12px] text-[#6c757d] text-center py-4">No other pending listings.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {pendingListings.filter(l => l.listingId !== listingId).slice(0, 6).map(l => (
                    <div
                      key={l.listingId}
                      onClick={() => navigate(`/admin/listing-review/${l.listingId}`)}
                      className="flex items-center gap-3 bg-[#f8f9fa] rounded-[8px] px-3 py-2 cursor-pointer hover:bg-[#f0f0f0]"
                    >
                      <div className="bg-[#e9ecef] rounded-[6px] size-[32px] overflow-hidden shrink-0">
                        {l.imageUrl
                          ? <img src={l.imageUrl} alt={l.title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          : <span className="flex items-center justify-center w-full h-full text-[16px]">{l.emoji}</span>
                        }
                      </div>
                      <p className="font-medium text-[11px] text-[#343a40] flex-1 truncate">{l.title}</p>
                      <span className="font-bold text-[12px] text-[#0b1f3a] shrink-0">{(l.startPrice / 1000).toFixed(0)}K</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Star rating */}
            <div className="bg-white border border-[#e9ecef] rounded-[12px] p-4 flex items-center gap-3">
              <div>
                <p className="font-bold text-[12px] text-[#343a40] mb-1">Rate this listing quality</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setRating(n)}>
                      <IconStar filled={n <= rating} />
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
