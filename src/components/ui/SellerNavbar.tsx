import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import BidVaultLogo from './BidVaultLogo';
import Badge from './Badge';

interface NavLink {
  label: string;
  to: string;
}

interface SellerNavbarProps {
  links?: NavLink[];
  userName?: string;
  verificationStatus?: 'verified' | 'review' | 'unverified';
  onLogout?: () => void;
}

const defaultLinks: NavLink[] = [
  { label: 'Dashboard', to: '/seller/dashboard' },
  { label: 'My Listings', to: '/seller/listings' },
  { label: 'Create Listing', to: '/seller/create-listing' },
];

const statusBadge = {
  verified: <Badge variant="verified">Verified Seller</Badge>,
  review: <Badge variant="review">Under Review</Badge>,
  unverified: <Badge variant="unverified">Unverified Seller</Badge>,
};

export default function SellerNavbar({ links = defaultLinks, userName = 'Seller', verificationStatus = 'verified', onLogout }: SellerNavbarProps) {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <nav aria-label="Seller navigation" className="sticky top-0 z-20 h-14 bg-navy flex items-center px-6 gap-8 relative">
      <BidVaultLogo size="sm" to="/seller/dashboard" />
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
        {statusBadge[verificationStatus]}
        <div className="w-8 h-8 rounded-full bg-navy-mid flex items-center justify-center text-white text-sm font-semibold">
          {userName.charAt(0).toUpperCase()}
        </div>
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
          <nav aria-label="Seller mobile navigation">
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
              <div className="flex items-center gap-2 min-w-0">
                {statusBadge[verificationStatus]}
                <span className="text-sm text-white/70 truncate">{userName}</span>
              </div>
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
