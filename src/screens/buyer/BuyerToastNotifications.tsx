import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { IconBidVaultLogo } from '../../components/Icons';

const DEMO_TOASTS = [
  {
    type: 'success' as const,
    title: 'Bid Placed Successfully!',
    message: 'Your bid of PKR 312,000 is now the highest bid.',
    label: 'Success Toast',
    color: 'bg-[#1a7a4a]',
  },
  {
    type: 'error' as const,
    title: 'Outbid!',
    message: 'Someone placed a higher bid. Current: PKR 315,000',
    label: 'Error Toast',
    color: 'bg-[#d0021b]',
  },
  {
    type: 'warning' as const,
    title: 'Auction Ending Soon!',
    message: 'Only 2 minutes left on iPhone 15 Pro Max.',
    label: 'Warning Toast',
    color: 'bg-[#d97706]',
  },
  {
    type: 'info' as const,
    title: 'New Competing Bid',
    message: 'Ali placed a bid of PKR 310,000 on MacBook Pro.',
    label: 'Info Toast',
    color: 'bg-[#0b1f3a]',
  },
];

export default function BuyerToastNotifications() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <header className="bg-[#0b1f3a] flex items-center justify-between px-8 py-0">
        <div className="flex items-center gap-8">
          <div className="flex gap-[10px] items-center py-4">
            <div className="bg-[#d0021b] flex items-center justify-center rounded-[8px] size-[34px]">
              <IconBidVaultLogo className="size-[18px]" />
            </div>
            <span className="font-extrabold text-[20px] text-white tracking-[-0.3px]">
              Bid<span className="text-[#d0021b]">Vault</span>
            </span>
          </div>
          <nav className="flex">
            <Link to="/buyer/browse" className="font-semibold text-[13px] px-4 py-5 border-b-2 text-[rgba(255,255,255,0.55)] border-transparent hover:text-white">Browse Auctions</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[rgba(255,255,255,0.1)] rounded-full size-[34px] flex items-center justify-center">
            <span className="font-bold text-[13px] text-white">{user?.name?.[0] ?? 'B'}</span>
          </div>
          <span className="font-semibold text-[13px] text-white">{user?.name?.split(' ')[0]}</span>
          <button onClick={logout} className="font-semibold text-[12px] text-[rgba(255,255,255,0.55)] hover:text-white ml-2">Logout</button>
        </div>
      </header>

      <div className="max-w-[700px] mx-auto px-6 py-10">
        <h1 className="font-extrabold text-[24px] text-[#0b1f3a] mb-1">Toast Notification Demo</h1>
        <p className="text-[13px] text-[#6c757d] mb-8">Click each button to trigger a notification. These appear in the top-right corner.</p>

        <div className="grid grid-cols-2 gap-4">
          {DEMO_TOASTS.map(t => (
            <button
              key={t.type}
              onClick={() => showToast({ type: t.type, title: t.title, message: t.message })}
              className={`${t.color} text-white rounded-[12px] p-5 text-left hover:opacity-90 transition-opacity`}
            >
              <p className="font-bold text-[14px] mb-1">{t.label}</p>
              <p className="font-semibold text-[13px] opacity-90 mb-1">{t.title}</p>
              <p className="text-[12px] opacity-75">{t.message}</p>
            </button>
          ))}
        </div>

        <div className="mt-8 bg-white border border-[#e9ecef] rounded-[12px] p-6">
          <h2 className="font-bold text-[14px] text-[#0b1f3a] mb-4">Trigger All at Once</h2>
          <button
            onClick={() => DEMO_TOASTS.forEach((t, i) => setTimeout(() => showToast({ type: t.type, title: t.title, message: t.message }), i * 600))}
            className="bg-[#0b1f3a] font-bold text-[14px] text-white px-6 py-3 rounded-[8px] hover:bg-[#1a3356] transition-colors"
          >
            Fire All 4 Notifications
          </button>
        </div>
      </div>
    </div>
  );
}
