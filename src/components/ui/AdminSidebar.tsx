import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, BarChart2, Radio, Settings, Menu, X, type LucideIcon } from 'lucide-react';
import BidVaultLogo from './BidVaultLogo';
import { useAuth } from '../../context/AuthContext';
import { useAuction } from '../../context/AuctionContext';

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
}

export function AdminSidebarContent({ active, onClose }: AdminSidebarContentProps) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const { pendingListings } = useAuction();
  const pendingCount = pendingListings.length;

  const badgeFor = (label: string): string | undefined => {
    if (label === 'Listing Review') return String(pendingCount);
    if (label === 'Live Auctions') return '6';
    return undefined;
  };

  return (
    <aside className="bg-navy flex flex-col w-[220px] shrink-0 h-screen sticky top-0 overflow-y-auto">
      <div className="h-14 flex items-center px-5 border-b border-white/10 gap-2">
        <BidVaultLogo size="sm" to="/admin/dashboard" />
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

      <div className="px-3 pt-4 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 px-3 mb-2">Main Menu</p>
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 no-underline
                  ${isActive
                    ? 'bg-white/10 text-white border-l-[3px] border-primary pl-[9px]'
                    : 'text-white/55 hover:text-white hover:bg-white/5 border-l-[3px] border-transparent'
                  }`}
              >
                <Icon size={16} strokeWidth={2} />
                <span className="flex-1">{label}</span>
                {badge && (
                  <span className={`font-bold text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-primary text-white' : 'bg-white/12 text-white/70'}`}>
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="px-4 py-4 border-t border-white/10 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
          {user?.name?.[0]?.toUpperCase() ?? 'A'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-tight truncate">{user?.name ?? 'Admin'}</p>
          <p className="text-[10px] text-white/45">Admin</p>
        </div>
        <button
          onClick={logout}
          className="text-[11px] text-white/50 hover:text-white shrink-0 cursor-pointer transition-colors"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}

/**
 * Self-contained AdminSidebar: renders desktop sidebar plus a mobile drawer
 * with backdrop and hamburger trigger. The trigger button is rendered inline
 * by this component (md:hidden) and is fixed top-left so it floats above the
 * page header. Drawer uses z-40 and backdrop z-30; ToastContainer (z-50)
 * correctly stacks above both.
 */
export default function AdminSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Hamburger trigger (mobile only) */}
      <button
        className="md:hidden fixed top-3 left-3 z-30 p-2 rounded-sm bg-surface border border-border-light hover:bg-bg cursor-pointer"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={open}
      >
        <Menu size={18} className="text-muted" />
      </button>

      {/* Desktop sidebar */}
      <div className="hidden md:block md:w-[220px] md:shrink-0">
        <AdminSidebarContent />
      </div>

      {/* Mobile drawer + backdrop */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <AdminSidebarContent onClose={() => setOpen(false)} />
          <button
            className="flex-1 bg-black/40 border-0 cursor-pointer z-30"
            onClick={() => setOpen(false)}
            aria-label="Close navigation menu"
          />
        </div>
      )}
    </>
  );
}
