import { useState } from 'react';
import { AdminSidebarContent } from './AdminSidebar';

const COLLAPSE_KEY = 'bidvault_admin_sidebar_collapsed';

export interface AdminLayoutRenderProps {
  /** Opens the mobile sidebar drawer — wire this to the screen's own inline hamburger button. */
  openMobileMenu: () => void;
}

interface AdminLayoutProps {
  /** Label of the active sidebar item — see navItems in AdminSidebar.tsx. */
  active: string;
  /**
   * Render-prop so each screen keeps its own header/hamburger/notification-bell
   * placement instead of a separate shared strip — a shared strip read as an
   * empty bar with one orphaned icon, especially on mobile.
   */
  children: (props: AdminLayoutRenderProps) => React.ReactNode;
}

/**
 * Shared chrome for every admin screen: sidebar (desktop, collapsible +
 * persisted; mobile, drawer). Everything else — header, mobile menu trigger,
 * notification bell — stays with each screen so it renders inline with that
 * screen's own title/actions, not as a disconnected strip above them.
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

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children({ openMobileMenu: () => setMobileOpen(true) })}
      </main>
    </div>
  );
}
