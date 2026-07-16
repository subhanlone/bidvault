import { useState, useEffect } from 'react';
import { Star, TrendingUp } from 'lucide-react';
import AdminLayout from '../../components/ui/AdminLayout';
import { api } from '../../services/api';

interface AnalyticsData {
  totalRevenue:         number;
  totalBids:            number;
  avgBidValue:          number;
  sellerConversionRate: number;
  monthlyRevenue:       { month: string; value: number; bids: number }[];
  categoryBreakdown:    { name: string; count: number; pct: number }[];
  topSellers:           { sellerId: string; sellerName: string; sales: number; revenue: number }[];
}

type Period = '3m' | '6m' | '12m';

const CHART_COLORS = [
  'bg-primary', 'bg-navy', 'bg-gold', 'bg-success-dark', 'bg-[#3b82f6]', 'bg-[#adb5bd]',
];

function fmtRevenue(n: number): string {
  if (n >= 1_000_000) return `PKR ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `PKR ${(n / 1_000).toFixed(0)}K`;
  if (n === 0)        return 'PKR 0';
  return `PKR ${n.toLocaleString()}`;
}

function KpiSkeleton() {
  return (
    <div className="bg-surface border border-border-light rounded-md p-4 sm:p-5">
      <div className="h-3 w-28 bg-border-light rounded-md animate-pulse mb-4" />
      <div className="h-7 w-20 bg-border-light rounded-md animate-pulse" />
    </div>
  );
}

export default function AdminAnalytics() {
  const [period, setPeriod] = useState<Period>('12m');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<AnalyticsData>('/admin/analytics')
      .then(d => setAnalyticsData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const allMonths = analyticsData?.monthlyRevenue ?? [];
  const periodData = period === '3m' ? allMonths.slice(-3) : period === '6m' ? allMonths.slice(-6) : allMonths;
  const periodMax  = Math.max(1, ...periodData.map(d => d.value));
  const bidsMax    = Math.max(1, ...periodData.map(d => d.bids));

  const kpis = analyticsData ? [
    { label: 'Total Revenue',       value: fmtRevenue(analyticsData.totalRevenue),                       sub: 'All completed transactions' },
    { label: 'Total Bids',          value: analyticsData.totalBids.toLocaleString(),                     sub: 'Across all auctions' },
    { label: 'Avg Bid Value',       value: analyticsData.avgBidValue > 0 ? fmtRevenue(analyticsData.avgBidValue) : '—', sub: 'Per bid placed' },
    { label: 'Seller Conversion',   value: `${analyticsData.sellerConversionRate}%`,                      sub: 'Listings approved' },
  ] : [];

  return (
    <AdminLayout active="Analytics">
      <header className="bg-surface border-b border-border-light flex items-center justify-between px-4 sm:px-6 py-4">
        <div>
          <h1 className="font-extrabold text-[18px] sm:text-[20px] text-navy">Analytics</h1>
          <p className="text-[12px] text-muted">Platform performance and revenue insights</p>
        </div>
        <div className="flex items-center gap-1 bg-bg border border-border-light rounded-sm p-1">
          {(['3m', '6m', '12m'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`font-bold text-[11px] px-3 py-1.5 rounded-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${period === p ? 'bg-navy text-white' : 'text-muted hover:text-secondary'}`}
            >
              {p === '3m' ? '3 Months' : p === '6m' ? '6 Months' : '12 Months'}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 sm:p-6 flex flex-col gap-5">

          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
              : kpis.length > 0
              ? kpis.map(k => (
                  <div key={k.label} className="bg-surface border border-border-light rounded-md p-4 sm:p-5">
                    <div className="flex items-start justify-between mb-3">
                      <p className="font-medium text-[11px] sm:text-[12px] text-muted">{k.label}</p>
                      <span className="flex items-center gap-[2px] font-bold text-[10px] px-1.5 py-[2px] rounded-xs bg-success-bg text-success-dark">
                        <TrendingUp size={9} /> Live
                      </span>
                    </div>
                    <p className="font-extrabold text-[18px] sm:text-[22px] text-navy leading-none">{k.value}</p>
                    <p className="text-[10px] text-placeholder mt-1">{k.sub}</p>
                  </div>
                ))
              : <div className="col-span-2 md:col-span-4 bg-surface border border-border-light rounded-md py-6 text-center">
                  <p className="text-[13px] text-placeholder">Analytics data could not be loaded. Please try refreshing.</p>
                </div>
            }
          </div>

          {/* Revenue bar chart */}
          <div className="bg-surface border border-border-light rounded-md p-4 sm:p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-[14px] text-navy">Revenue Overview</h2>
                <p className="text-[12px] text-muted">Gross Merchandise Value (GMV)</p>
              </div>
              <span className="font-extrabold text-[16px] sm:text-[20px] text-navy">
                {fmtRevenue(periodData.reduce((s, d) => s + d.value, 0))}
              </span>
            </div>
            {periodData.length > 0 ? (
              <div className="flex items-end gap-1 sm:gap-2 h-[140px] sm:h-[180px]">
                {periodData.map(d => (
                  <div key={d.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <div
                      className="w-full bg-primary rounded-t-[4px] transition-all duration-300 hover:bg-primary-dark group relative min-w-[8px]"
                      style={{ height: `${Math.max(4, (d.value / periodMax) * 100)}%` }}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-navy text-white text-[10px] font-bold px-2 py-1 rounded-xs whitespace-nowrap z-10">
                        {fmtRevenue(d.value)}
                      </div>
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-placeholder font-medium">{d.month}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[140px] flex items-center justify-center">
                <p className="text-[13px] text-placeholder">No transaction data yet</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-5">

            {/* Category breakdown */}
            <div className="bg-surface border border-border-light rounded-md p-4 sm:p-5">
              <h2 className="font-bold text-[14px] text-navy mb-4">Listings by Category</h2>
              {analyticsData && analyticsData.categoryBreakdown.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {analyticsData.categoryBreakdown.map((c, i) => (
                    <div key={c.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`size-[8px] rounded-full ${CHART_COLORS[i] ?? 'bg-muted'}`} />
                          <span className="font-semibold text-[12px] text-secondary">{c.name.split('&')[0].trim()}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-placeholder">{c.count.toLocaleString()} listings</span>
                          <span className="font-bold text-[12px] text-navy w-[36px] text-right">{c.pct}%</span>
                        </div>
                      </div>
                      <div className="bg-bg rounded-full h-[6px] overflow-hidden">
                        <div className={`${CHART_COLORS[i] ?? 'bg-muted'} h-full rounded-full transition-all duration-500`} style={{ width: `${c.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-[13px] text-placeholder">{loading ? 'Loading…' : 'No listing data yet'}</p>
                </div>
              )}
            </div>

            {/* Top sellers */}
            <div className="bg-surface border border-border-light rounded-md p-4 sm:p-5">
              <h2 className="font-bold text-[14px] text-navy mb-4">Top Sellers</h2>
              {analyticsData && analyticsData.topSellers.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {analyticsData.topSellers.map((s, i) => (
                    <div key={s.sellerId} className="flex items-center gap-3">
                      <div className={`size-[28px] rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${i === 0 ? 'bg-warning-bg text-warning' : i === 1 ? 'bg-surface-raised text-muted' : 'bg-bg text-placeholder'}`}>
                        #{i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[12px] text-secondary truncate">{s.sellerName}</p>
                        <p className="text-[10px] text-placeholder flex items-center gap-1">
                          {s.sales} sale{s.sales !== 1 ? 's' : ''}
                          <Star size={9} strokeWidth={2} className="inline text-gold fill-gold" />
                        </p>
                      </div>
                      <p className="font-bold text-[12px] text-primary shrink-0">
                        {fmtRevenue(s.revenue)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-[13px] text-placeholder">{loading ? 'Loading…' : 'No completed sales yet'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Bid Volume chart */}
          <div className="bg-surface border border-border-light rounded-md p-4 sm:p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-[14px] text-navy">Bid Volume</h2>
                <p className="text-[12px] text-muted">Number of bids placed per month</p>
              </div>
              <span className="font-extrabold text-[16px] sm:text-[20px] text-navy">
                {periodData.reduce((s, d) => s + d.bids, 0).toLocaleString()} bids
              </span>
            </div>
            {periodData.length > 0 ? (
              <div className="flex items-end gap-1 sm:gap-2 h-[100px] sm:h-[120px]">
                {periodData.map(d => (
                  <div key={`bids-${d.month}`} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <div
                      className="w-full bg-navy rounded-t-[4px] hover:bg-navy-mid group relative min-w-[8px] transition-all duration-300"
                      style={{ height: `${Math.max(4, (d.bids / bidsMax) * 100)}%` }}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-navy text-white text-[10px] font-bold px-2 py-1 rounded-xs whitespace-nowrap z-10">
                        {d.bids} bids
                      </div>
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-placeholder font-medium">{d.month}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[100px] flex items-center justify-center">
                <p className="text-[13px] text-placeholder">No bid data yet</p>
              </div>
            )}
          </div>

        </div>
    </AdminLayout>
  );
}
