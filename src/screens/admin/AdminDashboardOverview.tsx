import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuction } from '../../context/AuctionContext';
import { CheckCircle2, Smartphone, Car, Laptop, Gamepad2, Menu } from 'lucide-react';
import {
  IconBell, IconExport, IconPlus,
  IconChevronRight,
} from '../../components/Icons';
import { AdminSidebarContent } from '../../components/AdminSidebar';

const recentBids = [
  { icon: <Smartphone size={16} strokeWidth={1.5} className="text-[#6c757d]" />, title: 'iPhone 15 Pro Max', amount: 'PKR 312,000', tag: 'Highest' },
  { icon: <Car size={16} strokeWidth={1.5} className="text-[#6c757d]" />, title: 'Toyota Corolla 2023', amount: 'PKR 185,000', tag: '' },
  { icon: <Laptop size={16} strokeWidth={1.5} className="text-[#6c757d]" />, title: 'MacBook Pro M2', amount: 'PKR 422,000', tag: '' },
  { icon: <Smartphone size={16} strokeWidth={1.5} className="text-[#6c757d]" />, title: 'Samsung Galaxy S24 Ultra', amount: 'PKR 195,000', tag: '' },
  { icon: <Gamepad2 size={16} strokeWidth={1.5} className="text-[#6c757d]" />, title: 'Xbox Series X', amount: 'PKR 85,000', tag: '' },
];

const barData = [22, 35, 18, 42, 38, 55, 30, 48, 22, 60, 45, 38, 52, 40, 25, 65, 42, 58, 35, 70, 48, 55, 38, 42, 60, 52, 45, 38];

export default function AdminDashboardOverview() {
  const navigate = useNavigate();
  const { pendingListings } = useAuction();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pendingCount = pendingListings.length;

  return (
    <div className="flex min-h-screen bg-[#f8f9fa]">

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-col md:w-[200px] md:shrink-0 md:min-h-screen">
        <AdminSidebarContent active="Dashboard" />
      </div>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <AdminSidebarContent active="Dashboard" onClose={() => setSidebarOpen(false)} />
          <button className="flex-1 bg-[rgba(0,0,0,0.4)] border-0" onClick={() => setSidebarOpen(false)} aria-label="Close navigation menu" />
        </div>
      )}

      {/* MAIN */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="bg-white border-b border-[#e9ecef] flex items-center justify-between px-4 sm:px-6 py-4 gap-3">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-[6px] border border-[#e9ecef] hover:bg-[#f8f9fa]"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={18} className="text-[#6c757d]" />
            </button>
            <div>
              <h1 className="font-extrabold text-[18px] sm:text-[20px] text-[#0b1f3a]">Dashboard Overview</h1>
              <p className="text-[12px] text-[#6c757d]">Friday, 16 May 2026 · BidVault Admin</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button className="hidden sm:flex border border-[#dee2e6] gap-2 items-center px-4 py-2 rounded-[8px] text-[13px] text-[#495057] hover:bg-[#f8f9fa]">
              <IconExport /> Export
            </button>
            <button className="bg-[#d0021b] flex gap-2 items-center px-3 sm:px-4 py-2 rounded-[8px] text-[12px] sm:text-[13px] text-white hover:bg-[#a80016]">
              <IconPlus /> <span className="hidden sm:inline">New Auction</span><span className="sm:hidden">New</span>
            </button>
            <div className="relative cursor-pointer">
              <IconBell />
              <span className="absolute -top-1 -right-1 bg-[#d0021b] rounded-full size-[8px]" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-6 flex flex-col gap-4 sm:gap-5">

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: 'Active Auctions', value: '24', sub: '+3 Today', color: 'text-[#0b1f3a]' },
              { label: 'Total Bids Today', value: '1,847', sub: '+10% vs last week', color: 'text-[#1a7a4a]' },
              { label: 'Pending Verifications', value: '5', sub: 'Sellers awaiting review', color: 'text-[#ef4444]' },
              { label: 'Pending Listings', value: String(pendingCount), sub: 'Awaiting review', color: 'text-[#f59e0b]' },
            ].map(s => (
              <div key={s.label} className="bg-white border border-[#e9ecef] rounded-[12px] p-4 sm:p-5">
                <p className="font-medium text-[11px] sm:text-[12px] text-[#6c757d] mb-2">{s.label}</p>
                <p className={`font-extrabold text-[26px] sm:text-[32px] ${s.color} leading-none`}>{s.value}</p>
                <p className="text-[10px] sm:text-[11px] text-[#6c757d] mt-1">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Charts + Recent Bids */}
          <div className="flex flex-col lg:grid lg:grid-cols-[1fr_1fr_300px] gap-4">
            {/* Bids over time */}
            <div className="bg-white border border-[#e9ecef] rounded-[12px] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[13px] sm:text-[14px] text-[#0b1f3a]">Bids Over Time — Today</h3>
                <div className="flex items-center gap-2">
                  <span className="size-[8px] rounded-full bg-[#d0021b] inline-block" />
                  <span className="text-[11px] text-[#6c757d]">Live</span>
                </div>
              </div>
              <div className="flex items-end gap-[3px] h-[100px]">
                {barData.map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end">
                    <div
                      className={`rounded-t-[2px] ${i === 15 || i === 16 ? 'bg-[#d0021b]' : 'bg-[#e9ecef]'}`}
                      style={{ height: `${h}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-[#adb5bd]">12 AM</span>
                <span className="text-[10px] text-[#adb5bd]">12 PM</span>
                <span className="text-[10px] text-[#adb5bd]">Now</span>
              </div>
            </div>

            {/* By Category */}
            <div className="bg-white border border-[#e9ecef] rounded-[12px] p-5">
              <h3 className="font-bold text-[13px] sm:text-[14px] text-[#0b1f3a] mb-4">By Category</h3>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Electronics', pct: 45, color: '#d0021b' },
                  { label: 'Vehicles', pct: 28, color: '#f59e0b' },
                  { label: 'Clothing', pct: 15, color: '#3b82f6' },
                  { label: 'Other', pct: 12, color: '#6c757d' },
                ].map(c => (
                  <div key={c.label} className="flex items-center gap-3">
                    <span className="font-medium text-[12px] text-[#495057] w-[72px] sm:w-[80px]">{c.label}</span>
                    <div className="flex-1 bg-[#f8f9fa] rounded-full h-[6px]">
                      <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: c.color }} />
                    </div>
                    <span className="font-bold text-[12px] text-[#343a40] w-[35px] text-right">{c.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Bids */}
            <div className="bg-white border border-[#e9ecef] rounded-[12px] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[13px] sm:text-[14px] text-[#0b1f3a]">Recent Bids</h3>
                <span className="text-[12px] text-[#d0021b] font-bold">Live</span>
              </div>
              <div className="flex flex-col gap-3">
                {recentBids.map((b, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="bg-[#f8f9fa] rounded-[8px] size-[32px] flex items-center justify-center shrink-0">{b.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[11px] text-[#343a40] truncate">{b.title}</p>
                      <p className="font-bold text-[12px] text-[#0b1f3a]">{b.amount}</p>
                    </div>
                    {b.tag && <span className="bg-[#d0021b] font-bold text-[9px] text-white px-2 py-[2px] rounded-[99px]">{b.tag}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pending listings */}
          <div className="bg-white border border-[#e9ecef] rounded-[12px] p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="font-bold text-[13px] sm:text-[14px] text-[#0b1f3a]">Pending Listings — Review Queue</h3>
                <span className="bg-[#f59e0b] font-bold text-[10px] text-white px-2 py-[2px] rounded-[99px]">{pendingCount} Pending</span>
              </div>
            </div>

            {pendingCount === 0 ? (
              <div className="flex items-center justify-center gap-2 py-8">
                <CheckCircle2 size={16} strokeWidth={2} className="text-[#1a7a4a]" />
                <p className="text-[13px] text-[#6c757d]">No pending listings. All caught up!</p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden sm:grid sm:grid-cols-[1fr_120px_100px_80px_100px] gap-3 text-[11px] text-[#6c757d] font-bold uppercase tracking-[0.5px] mb-2 px-2">
                  <span>Item</span><span>Seller</span><span>Category</span><span>Price</span><span>Action</span>
                </div>
                <div className="flex flex-col gap-2">
                  {pendingListings.map(l => (
                    <div key={l.listingId}>
                      {/* Desktop row */}
                      <div className="hidden sm:grid sm:grid-cols-[1fr_120px_100px_80px_100px] gap-3 items-center bg-[#f8f9fa] rounded-[8px] px-3 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="bg-[#e9ecef] rounded-[8px] size-[36px] overflow-hidden shrink-0">
                            {l.imageUrl
                              ? <img src={l.imageUrl} alt={l.title} className="w-full h-full object-cover" />
                              : <span className="flex items-center justify-center w-full h-full text-[16px]">{l.emoji}</span>
                            }
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[12px] text-[#343a40] truncate">{l.title}</p>
                            <p className="text-[10px] text-[#adb5bd]">{new Date(l.submittedAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })}</p>
                          </div>
                        </div>
                        <p className="text-[12px] text-[#495057] truncate">{l.sellerName}</p>
                        <p className="text-[12px] text-[#495057]">{l.category}</p>
                        <p className="font-bold text-[12px] text-[#0b1f3a]">{(l.startPrice / 1000).toFixed(0)}K</p>
                        <button
                          onClick={() => navigate(`/admin/listing-review/${l.listingId}`)}
                          className="bg-[#d0021b] font-bold text-[11px] text-white px-3 py-[5px] rounded-[6px] hover:bg-[#a80016]"
                        >
                          Review
                        </button>
                      </div>
                      {/* Mobile card */}
                      <div className="sm:hidden bg-[#f8f9fa] rounded-[8px] px-3 py-3 flex items-center gap-3">
                        <div className="bg-[#e9ecef] rounded-[8px] size-[40px] overflow-hidden shrink-0">
                          {l.imageUrl
                            ? <img src={l.imageUrl} alt={l.title} className="w-full h-full object-cover" />
                            : <span className="flex items-center justify-center w-full h-full text-[16px]">{l.emoji}</span>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[12px] text-[#343a40] truncate">{l.title}</p>
                          <p className="text-[10px] text-[#adb5bd]">{l.sellerName} · PKR {(l.startPrice / 1000).toFixed(0)}K</p>
                        </div>
                        <button
                          onClick={() => navigate(`/admin/listing-review/${l.listingId}`)}
                          className="bg-[#d0021b] font-bold text-[11px] text-white px-3 py-[5px] rounded-[6px] hover:bg-[#a80016] shrink-0"
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
          <div className="bg-white border border-[#e9ecef] rounded-[12px] p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-[13px] sm:text-[14px] text-[#0b1f3a]">Reports — Quick Access</h3>
              <button className="text-[12px] text-[#d0021b] font-bold flex items-center gap-1">View All <IconChevronRight /></button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['Revenue Report', 'Bid Analytics', 'User Activity', 'Seller Reports'].map(r => (
                <div key={r} className="bg-[#f8f9fa] border border-[#e9ecef] rounded-[8px] px-3 sm:px-4 py-3 flex items-center justify-between hover:border-[#d0021b] cursor-pointer group">
                  <span className="font-semibold text-[12px] text-[#495057] group-hover:text-[#d0021b]">{r}</span>
                  <IconChevronRight color="#d0021b" />
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
