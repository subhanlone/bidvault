import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAuction } from '../../context/AuctionContext';
import { useTimer } from '../../hooks/useTimer';
import {
  IconBidVaultLogo, IconDashboard, IconList, IconUsers, IconAlert,
  IconAnalytics, IconSettings,
} from '../../components/Icons';
import type { Auction } from '../../types';

function AdminSidebar({ active }: { active: string }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { pendingListings } = useAuction();
  const pendingCount = pendingListings.length;

  const items = [
    { label: 'Dashboard', icon: <IconDashboard />, path: '/admin/dashboard' },
    { label: 'Live Auctions', icon: <IconList />, badge: '6', path: '/admin/live-auctions' },
    { label: 'Listing Review', icon: <IconList />, badge: String(pendingCount), path: '' },
    { label: 'Seller Verification', icon: <IconUsers />, path: '/admin/seller-verification' },
    { label: 'Fraud Alerts', icon: <IconAlert />, badge: '3', path: '' },
    { label: 'Analytics', icon: <IconAnalytics />, path: '' },
    { label: 'Settings', icon: <IconSettings />, path: '' },
  ];

  return (
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
        {items.map(item => (
          <div
            key={item.label}
            onClick={() => item.path && navigate(item.path)}
            className={`flex items-center gap-[10px] px-3 py-[9px] rounded-[8px] cursor-pointer ${
              item.label === active
                ? 'bg-[rgba(208,2,27,0.15)] text-[#ff6b7a]'
                : 'text-[rgba(255,255,255,0.55)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white'
            }`}
          >
            <span>{item.icon}</span>
            <span className="font-semibold text-[12.5px] flex-1">{item.label}</span>
            {item.badge && (
              <span className={`font-bold text-[10px] px-[6px] py-[2px] rounded-[99px] ${item.label === active ? 'bg-[#d0021b] text-white' : 'bg-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.7)]'}`}>
                {item.badge}
              </span>
            )}
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
  );
}

function AuctionRow({ auction }: { auction: Auction }) {
  const timer = useTimer(auction.endTime);
  const navigate = useNavigate();
  const urgent = timer.totalSeconds < 3600 && !timer.isExpired;

  return (
    <div className="grid grid-cols-[44px_1fr_130px_120px_110px_70px_80px] gap-4 items-center px-5 py-4 hover:bg-[#f8f9fa] transition-colors border-b border-[#f8f9fa] last:border-0">
      <div className="bg-[#f8f9fa] rounded-[8px] size-[36px] overflow-hidden shrink-0">
        <img src={auction.imageUrl} alt={auction.title} className="w-full h-full object-cover" />
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-[13px] text-[#343a40] truncate">{auction.title}</p>
        <span className="text-[10px] text-[#adb5bd]">{auction.category} · {auction.condition}</span>
      </div>
      <p className="text-[12px] text-[#495057] truncate">{auction.sellerName}</p>
      <p className="font-bold text-[13px] text-[#d0021b]">PKR {auction.currentBid.toLocaleString()}</p>
      <p className={`font-bold text-[13px] ${urgent ? 'text-[#d0021b]' : timer.isExpired ? 'text-[#6c757d]' : 'text-[#343a40]'}`}>
        {timer.isExpired ? 'Ended' : timer.display}
      </p>
      <p className="font-semibold text-[12px] text-[#495057]">{auction.bidCount}</p>
      <button
        onClick={() => navigate(`/buyer/live-bidding/${auction.auctionId}`)}
        className="bg-[#0b1f3a] font-bold text-[11px] text-white px-3 py-[5px] rounded-[6px] hover:bg-[#1a3356] whitespace-nowrap"
      >
        View →
      </button>
    </div>
  );
}

export default function AdminLiveAuctions() {
  const { auctions } = useAuction();

  const active = auctions.filter(a => a.status === 'ACTIVE');
  const endingSoon = active.filter(a => {
    const secs = Math.max(0, (new Date(a.endTime).getTime() - Date.now()) / 1000);
    return secs < 3600;
  });
  const totalBids = auctions.reduce((s, a) => s + a.bidCount, 0);
  const highestBid = auctions.reduce((m, a) => Math.max(m, a.currentBid), 0);

  return (
    <div className="flex min-h-screen bg-[#f8f9fa]">
      <AdminSidebar active="Live Auctions" />

      <main className="flex-1 flex flex-col">
        <header className="bg-white border-b border-[#e9ecef] flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="font-extrabold text-[20px] text-[#0b1f3a]">Live Auctions</h1>
            <p className="text-[12px] text-[#6c757d]">Real-time view of all active auctions</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[12px] text-[#1a7a4a] font-bold">
              <span className="size-[8px] rounded-full bg-[#1a7a4a] inline-block animate-pulse" />
              Live
            </span>
          </div>
        </header>

        <div className="flex-1 p-6 flex flex-col gap-5">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Active', value: String(active.length), color: 'text-[#0b1f3a]' },
              { label: 'Ending in <1hr', value: String(endingSoon.length), color: 'text-[#ef4444]' },
              { label: 'Total Bids', value: totalBids.toLocaleString(), color: 'text-[#1a7a4a]' },
              { label: 'Highest Bid', value: `PKR ${(highestBid / 1000).toFixed(0)}K`, color: 'text-[#d0021b]' },
            ].map(s => (
              <div key={s.label} className="bg-white border border-[#e9ecef] rounded-[12px] p-5">
                <p className="font-medium text-[12px] text-[#6c757d] mb-2">{s.label}</p>
                <p className={`font-extrabold text-[28px] ${s.color} leading-none`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Auctions table */}
          <div className="bg-white border border-[#e9ecef] rounded-[12px]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e9ecef]">
              <h2 className="font-bold text-[14px] text-[#0b1f3a]">Active Auctions ({auctions.length})</h2>
              <span className="font-bold text-[11px] text-[#6c757d]">Auto-refreshing live data</span>
            </div>

            <div className="grid grid-cols-[44px_1fr_130px_120px_110px_70px_80px] gap-4 px-5 py-3 text-[11px] text-[#adb5bd] font-bold uppercase tracking-[0.5px] border-b border-[#f8f9fa]">
              <span />
              <span>Item</span>
              <span>Seller</span>
              <span>Current Bid</span>
              <span>Time Left</span>
              <span>Bids</span>
              <span>Action</span>
            </div>

            <div className="flex flex-col">
              {auctions.map(auction => (
                <AuctionRow key={auction.auctionId} auction={auction} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
