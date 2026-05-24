import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuction } from '../../context/AuctionContext';
import { CheckCircle2, ClipboardList, Menu } from 'lucide-react';
import { AdminSidebarContent } from '../../components/ui/AdminSidebar';

export default function AdminListingReviews() {
  const navigate = useNavigate();
  const { pendingListings, refreshListings } = useAuction();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { refreshListings(); }, [refreshListings]);

  const pendingCount = pendingListings.length;

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

      <main className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="bg-surface border-b border-border-light flex items-center justify-between px-4 sm:px-6 py-4 gap-3">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-[6px] border border-border-light hover:bg-bg"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={18} className="text-muted" />
            </button>
            <div>
              <h1 className="font-extrabold text-[18px] sm:text-[20px] text-navy">Listing Review</h1>
              <p className="text-[12px] text-muted">
                {pendingCount > 0 ? `${pendingCount} listing${pendingCount !== 1 ? 's' : ''} awaiting review` : 'All listings reviewed'}
              </p>
            </div>
          </div>
          {pendingCount > 0 && (
            <span className="bg-[#fff3cd] border border-warning-border font-bold text-[12px] text-warning px-3 py-1 rounded-[99px]">
              {pendingCount} Pending
            </span>
          )}
        </header>

        <div className="flex-1 p-4 sm:p-6">

          {pendingCount === 0 ? (
            <div className="bg-surface border border-border-light rounded-md flex flex-col items-center justify-center py-20 px-6 text-center">
              <CheckCircle2 size={48} strokeWidth={1.3} className="text-success-dark mb-4" />
              <h2 className="font-bold text-[17px] text-navy mb-2">All caught up!</h2>
              <p className="text-[13px] text-muted">No pending listings to review right now.</p>
            </div>
          ) : (
            <div className="bg-surface border border-border-light rounded-md overflow-hidden">
              {/* Table header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
                <div className="flex items-center gap-3">
                  <div className="bg-[#fff3cd] flex items-center justify-center rounded-sm size-[36px]">
                    <ClipboardList size={18} strokeWidth={1.8} className="text-warning" />
                  </div>
                  <div>
                    <h2 className="font-bold text-[14px] text-navy">Pending Listings Queue</h2>
                    <p className="text-[11px] text-muted">Click Review to inspect and approve or reject</p>
                  </div>
                </div>
              </div>

              {/* Desktop column headers */}
              <div className="hidden sm:grid sm:grid-cols-[40px_1fr_130px_110px_80px_110px] gap-3 px-5 py-3 text-[11px] text-placeholder font-bold uppercase tracking-[0.5px] border-b border-[#f8f9fa]">
                <span />
                <span>Item</span>
                <span>Seller</span>
                <span>Category</span>
                <span>Price</span>
                <span>Action</span>
              </div>

              <div className="flex flex-col divide-y divide-[#f8f9fa]">
                {pendingListings.map((l, idx) => (
                  <div key={l.listingId}>
                    {/* Desktop row */}
                    <div className="hidden sm:grid sm:grid-cols-[40px_1fr_130px_110px_80px_110px] gap-3 items-center px-5 py-4 hover:bg-[#fafafa] transition-colors">
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
                          <p className="text-[10px] text-placeholder">{new Date(l.submittedAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                      </div>
                      <p className="text-[12px] text-tertiary truncate">{l.sellerName}</p>
                      <p className="text-[12px] text-tertiary">{l.category.split('&')[0].trim()}</p>
                      <p className="font-bold text-[13px] text-navy">PKR {(l.startPrice / 1000).toFixed(0)}K</p>
                      <button
                        onClick={() => navigate(`/admin/listing-review/${l.listingId}`)}
                        className="bg-primary font-bold text-[11px] text-white px-3 py-[6px] rounded-[6px] hover:bg-primary-dark transition-colors w-fit"
                      >
                        Review →
                      </button>
                    </div>

                    {/* Mobile card */}
                    <div
                      className="sm:hidden flex items-center gap-3 px-4 py-3 hover:bg-[#fafafa] transition-colors cursor-pointer"
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
      </main>
    </div>
  );
}
