import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { BuyerNavbar } from '../../components/ui';

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
    color: 'bg-primary',
  },
  {
    type: 'info' as const,
    title: 'Auction Ending Soon!',
    message: 'Only 2 minutes left on iPhone 15 Pro Max.',
    label: 'Info Toast',
    color: 'bg-[#d97706]',
  },
  {
    type: 'info' as const,
    title: 'New Competing Bid',
    message: 'Ali placed a bid of PKR 310,000 on MacBook Pro.',
    label: 'Info Toast',
    color: 'bg-navy',
  },
];

export default function BuyerToastNotifications() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  return (
    <div className="min-h-screen bg-bg">
      <BuyerNavbar userName={user?.name} onLogout={logout} />

      <main className="max-w-[700px] mx-auto px-6 py-10">
        <h1 className="font-extrabold text-[24px] text-navy mb-1">Toast Notification Demo</h1>
        <p className="text-[13px] text-muted mb-8">Click each button to trigger a notification. These appear in the top-right corner.</p>

        <div className="grid grid-cols-2 gap-4">
          {DEMO_TOASTS.map((t, i) => (
            <button
              key={i}
              onClick={() => showToast({ type: t.type, title: t.title, message: t.message })}
              className={`${t.color} text-white rounded-md p-5 text-left hover:opacity-90 transition-opacity cursor-pointer`}
            >
              <p className="font-bold text-[14px] mb-1">{t.label}</p>
              <p className="font-semibold text-[13px] opacity-90 mb-1">{t.title}</p>
              <p className="text-[12px] opacity-75">{t.message}</p>
            </button>
          ))}
        </div>

        <div className="mt-8 bg-surface border border-border-light rounded-md p-6">
          <h2 className="font-bold text-[14px] text-navy mb-4">Trigger All at Once</h2>
          <button
            onClick={() => DEMO_TOASTS.forEach((t, i) => setTimeout(() => showToast({ type: t.type, title: t.title, message: t.message }), i * 600))}
            className="bg-navy font-bold text-[14px] text-white px-6 py-3 rounded-sm hover:bg-navy-mid transition-colors cursor-pointer"
          >
            Fire All 4 Notifications
          </button>
        </div>
      </main>
    </div>
  );
}
