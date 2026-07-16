import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, BarChart2, Radio, Settings, X, ChevronLeft, ChevronRight, LogOut, type LucideIcon } from 'lucide-react';
import BidVaultLogo from './BidVaultLogo';
import { useAuth } from '../../context/AuthContext';
import { useAuction } from '../../context/AuctionContext';
import { usePendingListings } from '../../hooks/usePendingListings';

interface SidebarItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

const navItems: SidebarItem[] = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Live Auctions', to: '/admin/live-auctions', icon: Radio },
  { label: 'Listing Review', to: '/admin/listing-reviews', icon: ClipboardList },
  { label: 'Analytics', to: '/admin/analytics', icon: BarChart2 },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
];

interface AdminSidebarContentProps {
  /** Label of the active item; if omitted, active state is inferred from current pathname. */
  active?: string;
  onClose?: () => void;
  /** Icon-only rendering (desktop only — the mobile drawer is never collapsed). */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function AdminSidebarContent({ active, onClose, collapsed = false, onToggleCollapse }: AdminSidebarContentProps) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const { pendingListings, refreshListings } = usePendingListings();
  const { auctions } = useAuction();
  useEffect(() => { void refreshListings(); }, [refreshListings]);
  const pendingCount = pendingListings.length;
  const activeCount = auctions.length; // AuctionContext holds only ACTIVE auctions

  const badgeFor = (label: string): string | undefined => {
    if (label === 'Listing Review') return pendingCount > 0 ? String(pendingCount) : undefined;
    if (label === 'Live Auctions') return activeCount > 0 ? String(activeCount) : undefined;
    return undefined;
  };

  return (
    <aside className={`bg-navy flex flex-col shrink-0 h-screen sticky top-0 overflow-y-auto transition-[width] duration-200 ${collapsed ? 'w-[76px]' : 'w-[220px]'}`}>
      <div className={`h-14 flex items-center border-b border-white/10 gap-2 ${collapsed ? 'justify-center px-2' : 'px-5'}`}>
        {collapsed ? (
          <Link to="/admin/dashboard" aria-label="BidVault — Dashboard" className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
              <path d="M5 17L12 5l7 12H5z" fill="white" />
            </svg>
          </Link>
        ) : (
          <BidVaultLogo size="sm" to="/admin/dashboard" />
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto text-white/50 hover:text-white cursor-pointer"
            aria-label="Close navigation menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className={`pt-4 flex-1 ${collapsed ? 'px-2' : 'px-3'}`}>
        {!collapsed && <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 px-3 mb-2">Main Menu</p>}
        <nav className="flex flex-col gap-0.5">
          {navItems.map(({ label, to, icon: Icon }) => {
            const isActive = active != null
              ? label === active
              : pathname === to || pathname.startsWith(to + '/');
            const badge = badgeFor(label);
            return (
              <Link
                key={to}
                to={to}
                onClick={() => onClose?.()}
                aria-current={isActive ? 'page' : undefined}
                title={collapsed ? `${label}${badge ? ` (${badge})` : ''}` : undefined}
                className={`relative flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 no-underline
                  ${collapsed ? 'justify-center px-0' : 'px-3'}
                  ${isActive
                    ? `bg-white/10 text-white ${collapsed ? '' : 'border-l-[3px] border-primary pl-[9px]'}`
                    : `text-white/55 hover:text-white hover:bg-white/5 ${collapsed ? '' : 'border-l-[3px] border-transparent'}`
                  }`}
              >
                <Icon size={16} strokeWidth={2} />
                {!collapsed && <span className="flex-1">{label}</span>}
                {!collapsed && badge && (
                  <span className={`font-bold text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-primary text-white' : 'bg-white/12 text-white/70'}`}>
                    {badge}
                  </span>
                )}
                {collapsed && badge && (
                  <span className="absolute top-1.5 right-1.5 size-[6px] rounded-full bg-primary" aria-hidden="true" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {onToggleCollapse && (
        <div className="hidden md:flex px-3 py-2 border-t border-white/10">
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`flex items-center gap-2 text-white/50 hover:text-white cursor-pointer text-[12px] font-semibold rounded-lg py-2 transition-colors ${collapsed ? 'justify-center w-full' : 'px-2'}`}
          >
            {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /> Collapse</>}
          </button>
        </div>
      )}

      <div className={`py-4 border-t border-white/10 flex items-center gap-3 ${collapsed ? 'px-2 justify-center' : 'px-4'}`}>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
          {user?.name?.[0]?.toUpperCase() ?? 'A'}
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white leading-tight truncate">{user?.name ?? 'Admin'}</p>
            <p className="text-[10px] text-white/45">Admin</p>
          </div>
        )}
        <button
          onClick={logout}
          aria-label="Logout"
          title={collapsed ? 'Logout' : undefined}
          className={`text-white/50 hover:text-white shrink-0 cursor-pointer transition-colors ${collapsed ? '' : 'text-[11px]'}`}
        >
          {collapsed ? <LogOut size={16} /> : 'Logout'}
        </button>
      </div>
    </aside>
  );
}
