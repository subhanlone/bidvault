import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePendingListings } from '../../hooks/usePendingListings';
import { CheckCircle2, ClipboardList, Menu } from 'lucide-react';
import { AdminSidebarContent } from '../../components/ui/AdminSidebar';

export default function AdminListingReviews() {
  const navigate = useNavigate();
  const { pendingListings, refreshListings } = usePendingListings();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { refreshListings(); }, [refreshListings]);

  const pendingCount = pendingListings.length;

  return (
    <div className="flex min-h-screen bg-bg">
      <div className="hidden md:block md:w-[200px] md:shrink-0">
        <AdminSidebarContent active="Listing Review" />
      </div>
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <AdminSidebarContent active="Listing Review" onClose={() => setSidebarOpen(false)} />
          <button className="flex-1 bg-[rgba(0,0,0,0.4)] border-0" onClick={() => setSidebarOpen(false)} aria-label="Close navigation menu" />
        </div>
      )}

      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-surface border-b border-border-light flex items-center justify-between px-4 sm:px-6 py-4 gap-3">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-sm border border-border-light hover:bg-bg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
            <span className="bg-warning-badge-bg border border-warning-border font-bold text-[12px] text-warning px-3 py-1 rounded-full">
              {pendingCount} Pending
            </span>
          )}
        </header>

        <div className="flex-1 p-4 sm:p-6">
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
                          <p className="text-[10px] text-placeholder">{new Date(l.submittedAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
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
      </main>
    </div>
  );
}
