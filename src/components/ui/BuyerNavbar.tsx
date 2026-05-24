import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import BidVaultLogo from './BidVaultLogo';

interface NavLink {
  label: string;
  to: string;
}

interface BuyerNavbarProps {
  links?: NavLink[];
  userName?: string;
  avatarUrl?: string;
  onLogout?: () => void;
}

const defaultLinks: NavLink[] = [
  { label: 'Browse Auctions', to: '/buyer/browse' },
  { label: 'My Bids', to: '/buyer/my-bids' },
  { label: 'Watchlist', to: '/buyer/watchlist' },
];

export default function BuyerNavbar({ links = defaultLinks, userName = 'Buyer', avatarUrl, onLogout }: BuyerNavbarProps) {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => setMobileOpen(false), 0);
    return () => clearTimeout(timeoutId);
  }, [pathname]);

  return (
    <nav aria-label="Buyer navigation" className="sticky top-0 z-20 h-14 bg-navy flex items-center px-6 gap-8 relative">
      <BidVaultLogo size="sm" to="/buyer/browse" />
      <ul className="hidden md:flex items-center gap-6 flex-1 list-none m-0 p-0">
        {links.map(link => {
          const isActive = pathname === link.to || pathname.startsWith(link.to + '/');
          return (
            <li key={link.to}>
              <Link
                to={link.to}
                className={`text-sm font-medium transition-colors duration-150 pb-px no-underline
                  ${isActive
                    ? 'text-white border-b-2 border-primary'
                    : 'text-white/60 hover:text-white border-b-2 border-transparent'
                  }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="hidden md:flex items-center gap-3 ml-auto">
        {avatarUrl ? (
          <img src={avatarUrl} alt={userName} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-navy-mid flex items-center justify-center text-white text-sm font-semibold">
            {userName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-sm text-white/80 font-medium hidden sm:block">{userName}</span>
        {onLogout && (
          <button onClick={onLogout} className="text-sm text-white/60 hover:text-white transition-colors cursor-pointer ml-1">Logout</button>
        )}
      </div>
      <button
        className="md:hidden p-2 rounded-sm text-white/80 hover:text-white hover:bg-navy-mid transition-colors ml-auto"
        onClick={() => setMobileOpen(v => !v)}
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      {mobileOpen && (
        <div className="md:hidden absolute top-14 left-0 right-0 z-20 bg-navy border-t border-white/10 animate-slide-down">
          <nav aria-label="Buyer mobile navigation">
            <ul className="flex flex-col py-2 list-none m-0 p-0">
              {links.map(link => {
                const isActive = pathname === link.to || pathname.startsWith(link.to + '/');
                return (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors
                        ${isActive ? 'text-white bg-white/10' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-white/10 px-6 py-3 flex items-center justify-between gap-3">
              <span className="text-sm text-white/70 truncate">{userName}</span>
              {onLogout && (
                <button onClick={onLogout} className="text-sm text-white/60 hover:text-white transition-colors">
                  Logout
                </button>
              )}
            </div>
          </nav>
        </div>
      )}
    </nav>
  );
}
