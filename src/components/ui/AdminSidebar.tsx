import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, BarChart2, Radio, Settings, type LucideIcon } from 'lucide-react';
import BidVaultLogo from './BidVaultLogo';

interface SidebarItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

const navItems: SidebarItem[] = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Listing Reviews', to: '/admin/listing-reviews', icon: ClipboardList },
  { label: 'Live Auctions', to: '/admin/live-auctions', icon: Radio },
  { label: 'Analytics', to: '/admin/analytics', icon: BarChart2 },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
];

interface AdminSidebarProps {
  userName?: string;
}

export default function AdminSidebar({ userName = 'Admin' }: AdminSidebarProps) {
  const { pathname } = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-[#0b1f3a] flex flex-col z-20">
      <div className="h-14 flex items-center px-5 border-b border-white/10">
        <BidVaultLogo size="sm" to="/admin/dashboard" />
      </div>

      <div className="px-3 pt-4 flex-1 overflow-y-auto">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 px-3 mb-2">Main Menu</p>
        <nav className="flex flex-col gap-0.5">
          {navItems.map(({ label, to, icon: Icon }) => {
            const isActive = pathname === to || pathname.startsWith(to + '/');
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 no-underline
                  ${isActive
                    ? 'bg-white/10 text-white border-l-[3px] border-[#d0021b] pl-[9px]'
                    : 'text-white/50 hover:text-white hover:bg-white/5 border-l-[3px] border-transparent'
                  }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="px-5 py-4 border-t border-white/10 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#1a3356] flex items-center justify-center text-white text-sm font-semibold">
          {userName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-white leading-none">{userName}</p>
          <p className="text-[11px] text-white/40 mt-0.5">Administrator</p>
        </div>
      </div>
    </aside>
  );
}
