import { Link, useLocation } from 'react-router-dom';
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

  return (
    <nav className="sticky top-0 z-20 h-14 bg-[#0b1f3a] flex items-center px-6 gap-8">
      <BidVaultLogo size="sm" to="/seller/dashboard" />
      <div className="flex items-center gap-6 flex-1">
        {links.map(link => {
          const isActive = pathname === link.to || pathname.startsWith(link.to + '/');
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium transition-colors duration-150 pb-px no-underline
                ${isActive
                  ? 'text-white border-b-2 border-[#d0021b]'
                  : 'text-white/60 hover:text-white border-b-2 border-transparent'
                }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
      <div className="flex items-center gap-3">
        {statusBadge[verificationStatus]}
        <div className="w-8 h-8 rounded-full bg-[#1a3356] flex items-center justify-center text-white text-sm font-semibold">
          {userName.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm text-white/80 font-medium hidden sm:block">{userName}</span>
        {onLogout && (
          <button onClick={onLogout} className="text-xs text-white/40 hover:text-white/80 transition-colors cursor-pointer ml-1">Logout</button>
        )}
      </div>
    </nav>
  );
}
