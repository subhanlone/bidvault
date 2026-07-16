import { useState } from 'react';
import { Menu } from 'lucide-react';
import { AdminSidebarContent } from './AdminSidebar';
import NotificationBell from './NotificationBell';

const COLLAPSE_KEY = 'bidvault_admin_sidebar_collapsed';

interface AdminLayoutProps {
  /** Label of the active sidebar item — see navItems in AdminSidebar.tsx. */
  active: string;
  children: React.ReactNode;
}

/**
 * Shared chrome for every admin screen: sidebar (desktop, collapsible +
 * persisted; mobile, drawer) plus a slim top strip carrying the mobile menu
 * trigger and the notification bell. `children` renders as this screen's own
 * header + content inside the remaining flex column.
 */
export default function AdminLayout({ active, children }: AdminLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; }
  });

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0'); } catch { /* quota */ }
      return next;
    });
  };

  return (
    <div className="flex min-h-screen bg-bg">
      <div className={`hidden md:block md:shrink-0 transition-[width] duration-200 ${collapsed ? 'md:w-[76px]' : 'md:w-[220px]'}`}>
        <AdminSidebarContent active={active} collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <AdminSidebarContent active={active} onClose={() => setMobileOpen(false)} />
          <button
            className="flex-1 bg-[rgba(0,0,0,0.4)] border-0 cursor-pointer"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
          />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-12 shrink-0 flex items-center justify-between px-4 border-b border-border-light bg-surface">
          <button
            className="md:hidden -ml-2 p-2 rounded-sm hover:bg-bg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu size={18} className="text-tertiary" />
          </button>
          <div className="flex-1" />
          <NotificationBell iconClass="text-tertiary hover:text-navy" align="right" />
        </div>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
