import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePendingListings } from '../../hooks/usePendingListings';
import { useAuction } from '../../context/AuctionContext';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';
import { useToast } from '../../context/ToastContext';
import { CheckCircle2, Menu, Bell, BarChart3, Gavel, Banknote, Clock, ChevronRight } from 'lucide-react';
import { AdminSidebarContent } from '../../components/ui/AdminSidebar';
import StatCard from '../../components/ui/StatCard';

interface PlatformStats {
  userCount: number;
  activeAuctionCount: number;
  transactionTotal: number;
}

function StatCardSkeleton() {
  return (
    <div className="bg-surface border border-border-light rounded-md p-4 sm:p-5">
      <div className="h-3 w-24 bg-border-light rounded-md animate-pulse mb-3" />
      <div className="h-8 w-16 bg-border-light rounded-md animate-pulse" />
    </div>
  );
}

const CATEGORY_COLORS = [
  'var(--color-primary)',
  'var(--color-navy)',
  'var(--color-gold)',
  'var(--color-success-dark)',
];

export default function AdminDashboardOverview() {
  const navigate = useNavigate();
  const { pendingListings, refreshListings } = usePendingListings();
  const { auctions } = useAuction();
  const { showToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    Promise.allSettled([
      refreshListings(),
      api.get<PlatformStats>('/stats').then(d => setPlatformStats(d)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [refreshListings]);

  // AD-07: live-update the pending queue when a seller submits a new listing
  useEffect(() => {
    const socket = getSocket();
    const onSubmitted = (data: { listingId: string; title: string }) => {
      void refreshListings();
      showToast({ type: 'info', title: 'New listing submitted', message: data.title });
    };
    socket.on('listing:submitted', onSubmitted);
    return () => { socket.off('listing:submitted', onSubmitted); };
  }, [refreshListings, showToast]);

  const pendingCount = pendingListings.length;
  const active = auctions.filter(a => a.status === 'ACTIVE');
  const totalBids = auctions.reduce((s, a) => s + a.bidCount, 0);

  // Top auctions by current bid for "Top Auctions" panel
  const topAuctions = [...auctions].sort((a, b) => b.currentBid - a.currentBid).slice(0, 5);

  // Bar chart: bid counts per active auction (up to 28 bars)
  const chartBars = active.slice(0, 28).map(a => a.bidCount);
  const chartMax = Math.max(1, ...chartBars);

  // Category breakdown from auctions context
  const categoryMap: Record<string, number> = {};
  auctions.forEach(a => { categoryMap[a.category] = (categoryMap[a.category] ?? 0) + 1; });
  const totalAuctions = auctions.length;
  const categoryStats = Object.entries(categoryMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([label, count], i) => ({
      label: label.split('&')[0].trim(),
      pct: totalAuctions > 0 ? Math.round((count / totalAuctions) * 100) : 0,
      color: CATEGORY_COLORS[i] ?? 'var(--color-muted)',
    }));

  const fmtRevenue = (n: number) => {
    if (n >= 1_000_000) return `PKR ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `PKR ${(n / 1_000).toFixed(0)}K`;
    return `PKR ${n.toLocaleString()}`;
  };

  return (
    <div className="flex min-h-screen bg-bg">

      {/* Desktop sidebar */}
      <div className="hidden md:block md:w-[200px] md:shrink-0">
        <AdminSidebarContent active="Dashboard" />
      </div>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <AdminSidebarContent active="Dashboard" onClose={() => setSidebarOpen(false)} />
          <button className="flex-1 bg-[rgba(0,0,0,0.4)] border-0 cursor-pointer" onClick={() => setSidebarOpen(false)} aria-label="Close navigation menu" />
        </div>
      )}

      {/* MAIN */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="bg-surface border-b border-border-light flex items-center justify-between px-4 sm:px-6 py-4 gap-3">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-sm border border-border-light hover:bg-bg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={18} className="text-muted" />
            </button>
            <div>
              <h1 className="font-extrabold text-[18px] sm:text-[20px] text-navy">Dashboard Overview</h1>
              <p className="text-[12px] text-muted">{new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · BidVault Admin</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate('/admin/analytics')}
              className="hidden sm:flex border border-border-medium gap-2 items-center px-4 py-2 rounded-sm text-[13px] text-tertiary hover:bg-bg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <BarChart3 size={14} strokeWidth={2} /> Analytics
            </button>
            <button
              type="button"
              aria-label="Notifications"
              className="relative cursor-pointer p-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Bell size={20} strokeWidth={1.8} className="text-muted" />
              <span className="absolute top-0 right-0 bg-primary rounded-full size-[8px]" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-6 flex flex-col gap-4 sm:gap-5">

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
            ) : (
              <>
                <StatCard label="Active Auctions"  value={platformStats?.activeAuctionCount ?? '—'}           icon={<Gavel size={18} />}    iconColor="info"    padding="sm" />
                <StatCard label="Total Bids"        value={totalBids.toLocaleString()}                         icon={<BarChart3 size={18} />} iconColor="success" padding="sm" />
                <StatCard label="Platform Revenue"  value={fmtRevenue(platformStats?.transactionTotal ?? 0)}   icon={<Banknote size={18} />}  iconColor="success" padding="sm" />
                <StatCard label="Pending Listings"  value={String(pendingCount)} trendLabel="Awaiting review"  icon={<Clock size={18} />}     iconColor="warning" padding="sm" />
              </>
            )}
          </div>

          {/* Charts + Top Auctions */}
          <div className="flex flex-col lg:grid lg:grid-cols-[1fr_1fr_300px] gap-4">

            {/* Bid Activity chart */}
            <div className="bg-surface border border-border-light rounded-md p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[13px] sm:text-[14px] text-navy">Bid Activity — Active Auctions</h3>
                <div className="flex items-center gap-2">
                  <span className="size-[8px] rounded-full bg-success-dark inline-block animate-pulse" />
                  <span className="text-[11px] text-muted">Live</span>
                </div>
              </div>
              <div className="flex items-end gap-[3px] h-[100px]">
                {chartBars.length > 0 ? chartBars.map((count, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end">
                    <div
                      className="rounded-t-xs bg-primary"
                      style={{ height: `${Math.max(4, (count / chartMax) * 100)}%` }}
                    />
                  </div>
                )) : (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-[11px] text-placeholder">No active auctions</p>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-placeholder mt-2">Each bar = 1 active auction · height = bid count</p>
            </div>

            {/* By Category */}
            <div className="bg-surface border border-border-light rounded-md p-5">
              <h3 className="font-bold text-[13px] sm:text-[14px] text-navy mb-4">By Category</h3>
              {categoryStats.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {categoryStats.map(c => (
                    <div key={c.label} className="flex items-center gap-3">
                      <span className="font-medium text-[12px] text-tertiary w-[72px] sm:w-[80px] truncate">{c.label}</span>
                      <div className="flex-1 bg-bg rounded-full h-[6px]">
                        <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: c.color }} />
                      </div>
                      <span className="font-bold text-[12px] text-secondary w-[35px] text-right">{c.pct}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-placeholder py-4 text-center">No auction data yet</p>
              )}
            </div>

            {/* Top Auctions */}
            <div className="bg-surface border border-border-light rounded-md p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[13px] sm:text-[14px] text-navy">Top Auctions</h3>
                <span className="text-[12px] text-success-dark font-bold">
                  {active.length > 0 ? `${active.length} Active` : 'None Active'}
                </span>
              </div>
              {topAuctions.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {topAuctions.map((a, i) => (
                    <div key={a.auctionId} className="flex items-center gap-3">
                      <div className="bg-bg rounded-sm size-[32px] flex items-center justify-center shrink-0 overflow-hidden">
                        {a.imageUrl
                          ? <img src={a.imageUrl} alt={a.title} className="w-full h-full object-cover" />
                          : <span className="text-[14px]">{a.emoji}</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[11px] text-secondary truncate">{a.title}</p>
                        <p className="font-bold text-[12px] text-navy">PKR {a.currentBid.toLocaleString()}</p>
                      </div>
                      {i === 0 && <span className="bg-primary font-bold text-[9px] text-white px-2 py-[2px] rounded-full">Highest</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-placeholder py-4 text-center">No auctions yet</p>
              )}
            </div>
          </div>

          {/* Pending listings */}
          <div className="bg-surface border border-border-light rounded-md p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="font-bold text-[13px] sm:text-[14px] text-navy">Pending Listings — Review Queue</h3>
                <span className="bg-gold font-bold text-[10px] text-white px-2 py-[2px] rounded-full">{pendingCount} Pending</span>
              </div>
            </div>

            {pendingCount === 0 ? (
              <div className="flex items-center justify-center gap-2 py-8">
                <CheckCircle2 size={16} strokeWidth={2} className="text-success-dark" />
                <p className="text-[13px] text-muted">No pending listings. All caught up!</p>
              </div>
            ) : (
              <>
                <div className="hidden sm:grid sm:grid-cols-[1fr_120px_100px_80px_100px] gap-3 text-[11px] text-muted font-bold uppercase tracking-[0.5px] mb-2 px-2">
                  <span>Item</span><span>Seller</span><span>Category</span><span>Price</span><span>Action</span>
                </div>
                <div className="flex flex-col gap-2">
                  {pendingListings.map(l => (
                    <div key={l.listingId}>
                      <div className="hidden sm:grid sm:grid-cols-[1fr_120px_100px_80px_100px] gap-3 items-center bg-bg rounded-sm px-3 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="bg-border-light rounded-sm size-[36px] overflow-hidden shrink-0">
                            {l.imageUrl
                              ? <img src={l.imageUrl} alt={l.title} className="w-full h-full object-cover" />
                              : <span className="flex items-center justify-center w-full h-full text-[16px]">{l.emoji}</span>
                            }
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[12px] text-secondary truncate">{l.title}</p>
                            <p className="text-[10px] text-placeholder">{new Date(l.submittedAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })}</p>
                          </div>
                        </div>
                        <p className="text-[12px] text-tertiary truncate">{l.sellerName}</p>
                        <p className="text-[12px] text-tertiary">{l.category}</p>
                        <p className="font-bold text-[12px] text-navy">{(l.startPrice / 1000).toFixed(0)}K</p>
                        <button
                          onClick={() => navigate(`/admin/listing-review/${l.listingId}`)}
                          className="bg-primary font-bold text-[11px] text-white px-3 py-[5px] rounded-sm hover:bg-primary-dark cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                        >
                          Review
                        </button>
                      </div>
                      <div className="sm:hidden bg-bg rounded-sm px-3 py-3 flex items-center gap-3">
                        <div className="bg-border-light rounded-sm size-[40px] overflow-hidden shrink-0">
                          {l.imageUrl
                            ? <img src={l.imageUrl} alt={l.title} className="w-full h-full object-cover" />
                            : <span className="flex items-center justify-center w-full h-full text-[16px]">{l.emoji}</span>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[12px] text-secondary truncate">{l.title}</p>
                          <p className="text-[10px] text-placeholder">{l.sellerName} · PKR {(l.startPrice / 1000).toFixed(0)}K</p>
                        </div>
                        <button
                          onClick={() => navigate(`/admin/listing-review/${l.listingId}`)}
                          className="bg-primary font-bold text-[11px] text-white px-3 py-[5px] rounded-sm hover:bg-primary-dark shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Reports quick access */}
          <div className="bg-surface border border-border-light rounded-md p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-[13px] sm:text-[14px] text-navy">Reports — Quick Access</h3>
              <button
                onClick={() => navigate('/admin/analytics')}
                className="text-[12px] text-primary font-bold flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xs"
              >
                View All <ChevronRight size={12} />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Revenue Report',  to: '/admin/analytics' },
                { label: 'Bid Analytics',   to: '/admin/analytics' },
                { label: 'Live Auctions',   to: '/admin/live-auctions' },
                { label: 'Review Queue',    to: '/admin/listing-reviews' },
              ].map(r => (
                <button
                  key={r.label}
                  onClick={() => navigate(r.to)}
                  className="bg-bg border border-border-light rounded-sm px-3 sm:px-4 py-3 flex items-center justify-between hover:border-primary cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary text-left"
                >
                  <span className="font-semibold text-[12px] text-tertiary group-hover:text-primary">{r.label}</span>
                  <ChevronRight size={12} className="text-primary" />
                </button>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
