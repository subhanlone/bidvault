import { Link, useLocation } from 'react-router-dom';
import BidVaultLogo from './BidVaultLogo';

interface NavLink {
  label: string;
  to: string;
}

interface BuyerNavbarProps {
  links?: NavLink[];
  userName?: string;
  avatarUrl?: string;
}

const defaultLinks: NavLink[] = [
  { label: 'Browse Auctions', to: '/buyer/browse' },
  { label: 'Live Bidding', to: '/buyer/live' },
  { label: 'My Bids', to: '/buyer/my-bids' },
  { label: 'Watchlist', to: '/buyer/watchlist' },
];

export default function BuyerNavbar({ links = defaultLinks, userName = 'Buyer', avatarUrl }: BuyerNavbarProps) {
  const { pathname } = useLocation();

  return (
    <nav className="sticky top-0 z-20 h-14 bg-[#0b1f3a] flex items-center px-6 gap-8">
      <BidVaultLogo size="sm" to="/buyer/browse" />
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
        {avatarUrl ? (
          <img src={avatarUrl} alt={userName} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#1a3356] flex items-center justify-center text-white text-sm font-semibold">
            {userName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-sm text-white/80 font-medium">{userName}</span>
      </div>
    </nav>
  );
}
