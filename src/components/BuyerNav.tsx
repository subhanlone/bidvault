import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { IconBidVaultLogo } from './Icons';

const NAV_ITEMS = [
  { label: 'Browse', mobileLabel: 'Browse Auctions', path: '/buyer/browse' },
  { label: 'My Bids', mobileLabel: 'My Bids', path: '/buyer/my-bids' },
  { label: 'Watchlist', mobileLabel: 'Watchlist', path: '/buyer/watchlist' },
];

const activeClass = 'font-semibold text-[13px] px-4 py-[18px] border-b-2 text-white border-[#d0021b]';
const inactiveClass = 'font-semibold text-[13px] px-4 py-[18px] border-b-2 text-[rgba(255,255,255,0.55)] border-transparent hover:text-white transition-colors';

export function BuyerNav({ active = '' }: { active?: string }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-[#0b1f3a] sticky top-0 z-40 shadow-[0_2px_12px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between px-4 sm:px-8 h-[60px]">
        <div className="flex items-center gap-6">
          <Link to="/buyer/browse" className="flex gap-[10px] items-center shrink-0">
            <div className="bg-[#d0021b] flex items-center justify-center rounded-[8px] size-[34px]">
              <IconBidVaultLogo className="size-[18px]" />
            </div>
            <span className="font-extrabold text-[20px] text-white tracking-[-0.3px]">
              Bid<span className="text-[#d0021b]">Vault</span>
            </span>
          </Link>
          <nav className="hidden md:flex">
            {NAV_ITEMS.map(item =>
              item.label === active
                ? <span key={item.label} className={activeClass}>{item.label}</span>
                : <Link key={item.label} to={item.path} className={inactiveClass}>{item.label}</Link>
            )}
            {active === 'Live Bidding' && (
              <span className={activeClass}>Live Bidding</span>
            )}
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/buyer/profile" className="bg-[rgba(255,255,255,0.1)] rounded-full size-[34px] flex items-center justify-center hover:bg-[rgba(255,255,255,0.18)] transition-colors">
            <span className="font-bold text-[13px] text-white">{user?.name?.[0] ?? 'B'}</span>
          </Link>
          <span className="font-semibold text-[13px] text-white">{user?.name?.split(' ')[0] ?? 'Buyer'}</span>
          <button onClick={logout} className="font-semibold text-[12px] text-[rgba(255,255,255,0.45)] hover:text-white ml-1 transition-colors">Logout</button>
        </div>

        <button className="md:hidden p-2 rounded-[6px] hover:bg-[rgba(255,255,255,0.08)]" onClick={() => setMenuOpen(o => !o)}>
          {menuOpen ? <X size={20} className="text-white" /> : <Menu size={20} className="text-white" />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-[#0d2545] border-t border-[rgba(255,255,255,0.08)] px-4 py-4 flex flex-col gap-1">
          {NAV_ITEMS.map(item =>
            item.label === active
              ? <span key={item.label} className="font-semibold text-[14px] text-white py-2">{item.mobileLabel}</span>
              : <Link key={item.label} to={item.path} onClick={() => setMenuOpen(false)} className="font-semibold text-[14px] text-[rgba(255,255,255,0.7)] py-2 hover:text-white">{item.mobileLabel}</Link>
          )}
          <Link to="/buyer/profile" onClick={() => setMenuOpen(false)} className="font-semibold text-[14px] text-[#d0021b] py-2">My Profile</Link>
          <div className="flex items-center justify-between pt-3 mt-1 border-t border-[rgba(255,255,255,0.08)]">
            <div className="flex items-center gap-2">
              <div className="bg-[rgba(255,255,255,0.1)] rounded-full size-[30px] flex items-center justify-center">
                <span className="font-bold text-[12px] text-white">{user?.name?.[0] ?? 'B'}</span>
              </div>
              <span className="font-semibold text-[13px] text-white">{user?.name?.split(' ')[0] ?? 'Buyer'}</span>
            </div>
            <button onClick={logout} className="font-semibold text-[12px] text-[#d0021b]">Logout</button>
          </div>
        </div>
      )}
    </header>
  );
}
