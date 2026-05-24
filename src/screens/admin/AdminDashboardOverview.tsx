import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuction } from '../../context/AuctionContext';
import { CheckCircle2, Smartphone, Car, Laptop, Gamepad2, Menu, Bell, Download, Plus, ChevronRight } from 'lucide-react';
import { AdminSidebarContent } from '../../components/ui/AdminSidebar';

const recentBids = [
  { icon: <Smartphone size={16} strokeWidth={1.5} className="text-muted" />, title: 'iPhone 15 Pro Max', amount: 'PKR 312,000', tag: 'Highest' },
  { icon: <Car size={16} strokeWidth={1.5} className="text-muted" />, title: 'Toyota Corolla 2023', amount: 'PKR 185,000', tag: '' },
  { icon: <Laptop size={16} strokeWidth={1.5} className="text-muted" />, title: 'MacBook Pro M2', amount: 'PKR 422,000', tag: '' },
  { icon: <Smartphone size={16} strokeWidth={1.5} className="text-muted" />, title: 'Samsung Galaxy S24 Ultra', amount: 'PKR 195,000', tag: '' },
  { icon: <Gamepad2 size={16} strokeWidth={1.5} className="text-muted" />, title: 'Xbox Series X', amount: 'PKR 85,000', tag: '' },
];

const barData = [22, 35, 18, 42, 38, 55, 30, 48, 22, 60, 45, 38, 52, 40, 25, 65, 42, 58, 35, 70, 48, 55, 38, 42, 60, 52, 45, 38];

export default function AdminDashboardOverview() {
  const navigate = useNavigate();
  const { pendingListings } = useAuction();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pendingCount = pendingListings.length;

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
              className="md:hidden p-2 rounded-[6px] border border-border-light hover:bg-bg cursor-pointer"
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
            <button className="hidden sm:flex border border-[#dee2e6] gap-2 items-center px-4 py-2 rounded-sm text-[13px] text-tertiary hover:bg-bg cursor-pointer">
              <Download size={14} strokeWidth={2} /> Export
            </button>
            <button className="bg-primary flex gap-2 items-center px-3 sm:px-4 py-2 rounded-sm text-[12px] sm:text-[13px] text-white hover:bg-primary-dark cursor-pointer">
              <Plus size={14} strokeWidth={2.5} /> <span className="hidden sm:inline">New Auction</span><span className="sm:hidden">New</span>
            </button>
            <div className="relative cursor-pointer">
              <Bell size={20} strokeWidth={1.8} className="text-muted" />
              <span className="absolute -top-1 -right-1 bg-primary rounded-full size-[8px]" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-6 flex flex-col gap-4 sm:gap-5">

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: 'Active Auctions', value: '24', sub: '+3 Today', color: 'text-navy' },
              { label: 'Total Bids Today', value: '1,847', sub: '+10% vs last week', color: 'text-success-dark' },
              { label: 'Revenue Today', value: 'PKR 2.4M', sub: '+8% vs yesterday', color: 'text-[#3b82f6]' },
              { label: 'Pending Listings', value: String(pendingCount), sub: 'Awaiting review', color: 'text-gold' },
            ].map(s => (
              <div key={s.label} className="bg-surface border border-border-light rounded-md p-4 sm:p-5">
                <p className="font-medium text-[11px] sm:text-[12px] text-muted mb-2">{s.label}</p>
                <p className={`font-extrabold text-[26px] sm:text-[32px] ${s.color} leading-none`}>{s.value}</p>
                <p className="text-[10px] sm:text-[11px] text-muted mt-1">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Charts + Recent Bids */}
          <div className="flex flex-col lg:grid lg:grid-cols-[1fr_1fr_300px] gap-4">
            {/* Bids over time */}
            <div className="bg-surface border border-border-light rounded-md p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[13px] sm:text-[14px] text-navy">Bids Over Time — Today</h3>
                <div className="flex items-center gap-2">
                  <span className="size-[8px] rounded-full bg-primary inline-block" />
                  <span className="text-[11px] text-muted">Live</span>
                </div>
              </div>
              <div className="flex items-end gap-[3px] h-[100px]">
                {barData.map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end">
                    <div
                      className={`rounded-t-[2px] ${i === 15 || i === 16 ? 'bg-primary' : 'bg-[#e9ecef]'}`}
                      style={{ height: `${h}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-placeholder">12 AM</span>
                <span className="text-[10px] text-placeholder">12 PM</span>
                <span className="text-[10px] text-placeholder">Now</span>
              </div>
            </div>

            {/* By Category */}
            <div className="bg-surface border border-border-light rounded-md p-5">
              <h3 className="font-bold text-[13px] sm:text-[14px] text-navy mb-4">By Category</h3>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Electronics', pct: 45, color: '#d0021b' },
                  { label: 'Vehicles', pct: 28, color: '#f59e0b' },
                  { label: 'Clothing', pct: 15, color: '#3b82f6' },
                  { label: 'Other', pct: 12, color: '#6c757d' },
                ].map(c => (
                  <div key={c.label} className="flex items-center gap-3">
                    <span className="font-medium text-[12px] text-tertiary w-[72px] sm:w-[80px]">{c.label}</span>
                    <div className="flex-1 bg-bg rounded-full h-[6px]">
                      <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: c.color }} />
                    </div>
                    <span className="font-bold text-[12px] text-secondary w-[35px] text-right">{c.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Bids */}
            <div className="bg-surface border border-border-light rounded-md p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[13px] sm:text-[14px] text-navy">Recent Bids</h3>
                <span className="text-[12px] text-primary font-bold">Live</span>
              </div>
              <div className="flex flex-col gap-3">
                {recentBids.map((b, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="bg-bg rounded-sm size-[32px] flex items-center justify-center shrink-0">{b.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[11px] text-secondary truncate">{b.title}</p>
                      <p className="font-bold text-[12px] text-navy">{b.amount}</p>
                    </div>
                    {b.tag && <span className="bg-primary font-bold text-[9px] text-white px-2 py-[2px] rounded-[99px]">{b.tag}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pending listings */}
          <div className="bg-surface border border-border-light rounded-md p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="font-bold text-[13px] sm:text-[14px] text-navy">Pending Listings — Review Queue</h3>
                <span className="bg-[#f59e0b] font-bold text-[10px] text-white px-2 py-[2px] rounded-[99px]">{pendingCount} Pending</span>
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
                          <div className="bg-[#e9ecef] rounded-sm size-[36px] overflow-hidden shrink-0">
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
                          className="bg-primary font-bold text-[11px] text-white px-3 py-[5px] rounded-[6px] hover:bg-primary-dark cursor-pointer"
                        >
                          Review
                        </button>
                      </div>
                      <div className="sm:hidden bg-bg rounded-sm px-3 py-3 flex items-center gap-3">
                        <div className="bg-[#e9ecef] rounded-sm size-[40px] overflow-hidden shrink-0">
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
                          className="bg-primary font-bold text-[11px] text-white px-3 py-[5px] rounded-[6px] hover:bg-primary-dark shrink-0 cursor-pointer"
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
              <button className="text-[12px] text-primary font-bold flex items-center gap-1 cursor-pointer">View All <ChevronRight size={12} /></button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['Revenue Report', 'Bid Analytics', 'User Activity', 'Seller Reports'].map(r => (
                <div key={r} className="bg-bg border border-border-light rounded-sm px-3 sm:px-4 py-3 flex items-center justify-between hover:border-primary cursor-pointer group">
                  <span className="font-semibold text-[12px] text-tertiary group-hover:text-primary">{r}</span>
                  <ChevronRight size={12} className="text-primary" />
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
