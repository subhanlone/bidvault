import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import type { AppNotification } from '../../types';

// Best-effort landing page when a notification is clicked.
function targetFor(n: AppNotification): string | null {
  switch (n.type) {
    case 'BID_OUTBID':
      return '/buyer/my-bids';
    case 'AUCTION_WON':
      return '/buyer/my-wins';
    case 'LISTING_APPROVED':
    case 'LISTING_REJECTED':
      return '/seller/listings';
    default:
      return null;
  }
}

function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface Props {
  /** Icon color classes — varies with the surrounding surface. */
  iconClass?: string;
  /** Which edge the dropdown aligns to. Use 'left' when the bell sits on the left (e.g. admin sidebar). */
  align?: 'left' | 'right';
}

export default function NotificationBell({ iconClass = 'text-white/70 hover:text-white', align = 'right' }: Props) {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const handleClick = (n: AppNotification) => {
    if (!n.isRead) void markRead(n.id);
    const to = targetFor(n);
    setOpen(false);
    if (to) navigate(to);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={open}
        className={`relative p-1.5 rounded-sm cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${iconClass}`}
      >
        <Bell size={19} strokeWidth={1.9} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-[320px] max-w-[calc(100vw-24px)] bg-surface border border-border-light rounded-md shadow-[0_12px_40px_rgba(11,31,58,0.18)] z-50 overflow-hidden`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
            <p className="font-bold text-[13px] text-navy">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="text-[11px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
              >
                <Check size={11} /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell size={28} strokeWidth={1.3} className="text-placeholder mx-auto mb-2" />
                <p className="text-[12px] text-muted">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-bg last:border-0 hover:bg-bg transition-colors cursor-pointer flex gap-3 ${n.isRead ? '' : 'bg-primary-surface/40'}`}
                >
                  <span className={`mt-1.5 size-2 rounded-full shrink-0 ${n.isRead ? 'bg-transparent' : 'bg-primary'}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-[12px] text-secondary truncate">{n.title}</span>
                    <span className="block text-[11px] text-muted leading-snug">{n.message}</span>
                    <span className="block text-[10px] text-placeholder mt-0.5">{timeAgo(n.createdAt)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
