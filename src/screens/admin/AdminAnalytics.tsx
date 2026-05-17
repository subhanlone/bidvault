import { useState } from 'react';
import { useAuction } from '../../context/AuctionContext';
import { Star, TrendingUp, TrendingDown, Menu } from 'lucide-react';
import { AdminSidebarContent } from '../../components/AdminSidebar';

const MONTHLY_REVENUE = [
  { month: 'Jan', value: 3_200_000, bids: 210 },
  { month: 'Feb', value: 4_800_000, bids: 318 },
  { month: 'Mar', value: 3_900_000, bids: 274 },
  { month: 'Apr', value: 6_100_000, bids: 412 },
  { month: 'May', value: 5_400_000, bids: 365 },
  { month: 'Jun', value: 7_200_000, bids: 480 },
  { month: 'Jul', value: 6_800_000, bids: 453 },
  { month: 'Aug', value: 8_500_000, bids: 567 },
  { month: 'Sep', value: 7_900_000, bids: 521 },
  { month: 'Oct', value: 9_400_000, bids: 628 },
  { month: 'Nov', value: 11_200_000, bids: 740 },
  { month: 'Dec', value: 10_800_000, bids: 718 },
];

const CATEGORY_STATS = [
  { name: 'Electronics', pct: 58, count: 1392, color: 'bg-[#d0021b]' },
  { name: 'Vehicles', pct: 19, count: 456, color: 'bg-[#0b1f3a]' },
  { name: 'Fashion', pct: 12, count: 288, color: 'bg-[#f59e0b]' },
  { name: 'Sports & Fitness', pct: 7, count: 168, color: 'bg-[#1a7a4a]' },
  { name: 'Other', pct: 4, count: 96, color: 'bg-[#adb5bd]' },
];

const TOP_SELLERS = [
  { name: 'Ahmed Raza', sales: 33, revenue: 4_820_000, rating: 4.8 },
  { name: 'Fatima Khan', sales: 21, revenue: 2_960_000, rating: 4.7 },
  { name: 'Kamran Ali', sales: 18, revenue: 2_150_000, rating: 4.5 },
  { name: 'Sara Ahmed', sales: 14, revenue: 1_680_000, rating: 4.6 },
  { name: 'Omar Sheikh', sales: 11, revenue: 1_240_000, rating: 4.3 },
];

export default function AdminAnalytics() {
  const { auctions } = useAuction();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [period, setPeriod] = useState<'7d' | '30d' | '12m'>('12m');

  const totalRevenue = MONTHLY_REVENUE.reduce((s, m) => s + m.value, 0);
  const totalBids = MONTHLY_REVENUE.reduce((s, m) => s + m.bids, 0);
  const avgBid = auctions.length > 0 ? auctions.reduce((s, a) => s + a.currentBid, 0) / auctions.length : 0;
  const periodData = period === '7d'
    ? MONTHLY_REVENUE.slice(-2).map((m, i) => ({ ...m, value: Math.round(m.value / (i === 0 ? 4.3 : 4.3)), bids: Math.round(m.bids / 4.3) }))
    : period === '30d'
    ? MONTHLY_REVENUE.slice(-3)
    : MONTHLY_REVENUE;

  const periodMax = Math.max(...periodData.map(m => m.value));

  const kpis = [
    { label: 'Total GMV', value: `PKR ${(totalRevenue / 1_000_000).toFixed(1)}M`, change: '+18.4%', up: true, sub: 'Last 12 months' },
    { label: 'Total Bids', value: totalBids.toLocaleString(), change: '+12.1%', up: true, sub: 'Across all auctions' },
    { label: 'Avg Bid Value', value: `PKR ${(avgBid / 1000).toFixed(0)}K`, change: '+4.7%', up: true, sub: 'Per auction' },
    { label: 'Seller Conversion', value: '73.2%', change: '-2.1%', up: false, sub: 'Listings → Active' },
  ];

  return (
    <div className="flex min-h-screen bg-[#f8f9fa]">
      <div className="hidden md:flex md:flex-col md:w-[200px] md:shrink-0 md:min-h-screen">
        <AdminSidebarContent active="Analytics" />
      </div>
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <AdminSidebarContent active="Analytics" onClose={() => setSidebarOpen(false)} />
          <button className="flex-1 bg-[rgba(0,0,0,0.4)] border-0" onClick={() => setSidebarOpen(false)} aria-label="Close navigation menu" />
        </div>
      )}

      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#e9ecef] flex items-center justify-between px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 rounded-[6px] border border-[#e9ecef] hover:bg-[#f8f9fa]" onClick={() => setSidebarOpen(true)}>
              <Menu size={18} className="text-[#495057]" />
            </button>
            <div>
              <h1 className="font-extrabold text-[18px] sm:text-[20px] text-[#0b1f3a]">Analytics</h1>
              <p className="text-[12px] text-[#6c757d]">Platform performance and revenue insights</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-[#f8f9fa] border border-[#e9ecef] rounded-[8px] p-1">
            {(['7d', '30d', '12m'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`font-bold text-[11px] px-3 py-1.5 rounded-[6px] transition-colors ${period === p ? 'bg-[#0b1f3a] text-white' : 'text-[#6c757d] hover:text-[#343a40]'}`}
              >
                {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '12 Months'}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6 flex flex-col gap-5">

          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {kpis.map(k => (
              <div key={k.label} className="bg-white border border-[#e9ecef] rounded-[12px] p-4 sm:p-5">
                <div className="flex items-start justify-between mb-3">
                  <p className="font-medium text-[11px] sm:text-[12px] text-[#6c757d]">{k.label}</p>
                  <span className={`flex items-center gap-[2px] font-bold text-[10px] px-1.5 py-[2px] rounded-[4px] ${k.up ? 'bg-[#f0faf4] text-[#1a7a4a]' : 'bg-[#fff5f5] text-[#ef4444]'}`}>
                    {k.up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                    {k.change}
                  </span>
                </div>
                <p className="font-extrabold text-[18px] sm:text-[22px] text-[#0b1f3a] leading-none">{k.value}</p>
                <p className="text-[10px] text-[#adb5bd] mt-1">{k.sub}</p>
              </div>
            ))}
          </div>

          {/* Revenue bar chart */}
          <div className="bg-white border border-[#e9ecef] rounded-[12px] p-4 sm:p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-[14px] text-[#0b1f3a]">Revenue Overview</h2>
                <p className="text-[12px] text-[#6c757d]">Gross Merchandise Value (GMV)</p>
              </div>
              <span className="font-extrabold text-[16px] sm:text-[20px] text-[#0b1f3a]">
                PKR {(periodData.reduce((s, d) => s + d.value, 0) / 1_000_000).toFixed(1)}M
              </span>
            </div>
            <div className="flex items-end gap-1 sm:gap-2 h-[140px] sm:h-[180px]">
              {periodData.map(d => (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div
                    className="w-full bg-[#d0021b] rounded-t-[4px] transition-all duration-300 hover:bg-[#a80016] group relative min-w-[8px]"
                    style={{ height: `${Math.max(4, (d.value / periodMax) * 100)}%` }}
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-[#0b1f3a] text-white text-[10px] font-bold px-2 py-1 rounded-[4px] whitespace-nowrap z-10">
                      PKR {(d.value / 1_000_000).toFixed(2)}M
                    </div>
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-[#adb5bd] font-medium">{d.month}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-5">

            {/* Category breakdown */}
            <div className="bg-white border border-[#e9ecef] rounded-[12px] p-4 sm:p-5">
              <h2 className="font-bold text-[14px] text-[#0b1f3a] mb-4">Sales by Category</h2>
              <div className="flex flex-col gap-4">
                {CATEGORY_STATS.map(c => (
                  <div key={c.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`size-[8px] rounded-full ${c.color}`} />
                        <span className="font-semibold text-[12px] text-[#343a40]">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-[#adb5bd]">{c.count.toLocaleString()} listings</span>
                        <span className="font-bold text-[12px] text-[#0b1f3a] w-[36px] text-right">{c.pct}%</span>
                      </div>
                    </div>
                    <div className="bg-[#f8f9fa] rounded-full h-[6px] overflow-hidden">
                      <div className={`${c.color} h-full rounded-full transition-all duration-500`} style={{ width: `${c.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top sellers */}
            <div className="bg-white border border-[#e9ecef] rounded-[12px] p-4 sm:p-5">
              <h2 className="font-bold text-[14px] text-[#0b1f3a] mb-4">Top Sellers</h2>
              <div className="flex flex-col gap-3">
                {TOP_SELLERS.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-3">
                    <div className={`size-[28px] rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${i === 0 ? 'bg-[#fef3c7] text-[#d97706]' : i === 1 ? 'bg-[#f1f3f5] text-[#6c757d]' : 'bg-[#f8f9fa] text-[#adb5bd]'}`}>
                      #{i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[12px] text-[#343a40] truncate">{s.name}</p>
                      <p className="text-[10px] text-[#adb5bd] flex items-center gap-1">{s.sales} sales · <Star size={9} strokeWidth={2} className="inline text-[#f59e0b] fill-[#f59e0b]" /> {s.rating}</p>
                    </div>
                    <p className="font-bold text-[12px] text-[#d0021b] shrink-0">
                      {(s.revenue / 1_000_000).toFixed(1)}M
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bid volume chart */}
          <div className="bg-white border border-[#e9ecef] rounded-[12px] p-4 sm:p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-[14px] text-[#0b1f3a]">Bid Volume</h2>
                <p className="text-[12px] text-[#6c757d]">Number of bids placed per period</p>
              </div>
              <span className="font-extrabold text-[16px] sm:text-[20px] text-[#0b1f3a]">
                {periodData.reduce((s, d) => s + d.bids, 0).toLocaleString()} bids
              </span>
            </div>
            <div className="flex items-end gap-1 sm:gap-2 h-[100px] sm:h-[120px]">
              {periodData.map(d => {
                const periodBidsMax = Math.max(...periodData.map(x => x.bids));
                return (
                  <div key={`bids-${d.month}`} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <div
                      className="w-full bg-[#0b1f3a] rounded-t-[4px] hover:bg-[#1a3356] group relative min-w-[8px] transition-all duration-300"
                      style={{ height: `${Math.max(4, (d.bids / periodBidsMax) * 100)}%` }}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-[#0b1f3a] text-white text-[10px] font-bold px-2 py-1 rounded-[4px] whitespace-nowrap z-10">
                        {d.bids} bids
                      </div>
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-[#adb5bd] font-medium">{d.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
