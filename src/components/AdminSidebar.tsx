import { Link } from 'react-router-dom';
import { X, Gavel, LayoutDashboard, List, BarChart2, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAuction } from '../context/AuctionContext';

export function AdminSidebarContent({ active, onClose }: { active: string; onClose?: () => void }) {
  const { user, logout } = useAuth();
  const { pendingListings } = useAuction();
  const pendingCount = pendingListings.length;

  const items = [
    { icon: <LayoutDashboard size={15} strokeWidth={2} />, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: <List size={15} strokeWidth={2} />, label: 'Live Auctions', badge: '6', path: '/admin/live-auctions' },
    { icon: <List size={15} strokeWidth={2} />, label: 'Listing Review', badge: String(pendingCount), path: '/admin/listing-reviews' },
    { icon: <BarChart2 size={15} strokeWidth={2} />, label: 'Analytics', path: '/admin/analytics' },
    { icon: <Settings size={15} strokeWidth={2} />, label: 'Settings', path: '/admin/settings' },
  ];

  return (
    <aside className="bg-[#0b1f3a] flex flex-col w-[200px] shrink-0 h-screen sticky top-0 overflow-y-auto">
      <div className="flex gap-[10px] items-center px-5 py-5 border-b border-[rgba(255,255,255,0.08)]">
        <div className="bg-[#d0021b] flex items-center justify-center rounded-[8px] size-[32px]">
          <Gavel size={16} strokeWidth={2} className="text-white" />
        </div>
        <span className="font-extrabold text-[18px] text-white tracking-[-0.3px]">
          Bid<span className="text-[#d0021b]">Vault</span>
        </span>
        {onClose && (
          <button onClick={onClose} className="ml-auto text-[rgba(255,255,255,0.5)] hover:text-white cursor-pointer">
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex flex-col gap-[2px] p-3 flex-1">
        {items.map(item => (
          <Link
            key={item.label}
            to={item.path}
            onClick={() => onClose?.()}
            className={`flex items-center gap-[10px] px-3 py-[9px] rounded-[8px] ${
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
          </Link>
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
        <button onClick={logout} className="text-[10px] text-[rgba(255,255,255,0.4)] hover:text-white shrink-0 cursor-pointer">Logout</button>
      </div>
    </aside>
  );
}
