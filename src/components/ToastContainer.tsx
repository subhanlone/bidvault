import { useToast } from '../context/ToastContext';
import { X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <ul
      role="list"
      aria-live="assertive"
      aria-atomic="false"
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none list-none m-0 p-0"
    >
      {toasts.map(t => (
        <li
          key={t.id}
          className={`
            pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-md
            shadow-[0px_8px_24px_rgba(0,0,0,0.25)] min-w-[300px] max-w-[370px]
            animate-toast-in
            ${t.type === 'success' ? 'bg-success-dark'
              : t.type === 'error' ? 'bg-primary'
              : t.type === 'warning' ? 'bg-gold'
              : 'bg-navy'}
          `}
        >
          {/* Gold is a light background — white on it measures 2.15:1, well under AA. The other
              three are dark enough for white. Everything inside inherits from here, including
              the dismiss icon. */}
          <div className={`flex-1 min-w-0 ${t.type === 'warning' ? 'text-navy' : 'text-white'}`}>
            <p className="font-bold text-[13px] leading-tight">{t.title}</p>
            <p className={`text-[12px] mt-0.5 leading-snug ${t.type === 'warning' ? 'text-navy/80' : 'text-[rgba(255,255,255,0.85)]'}`}>{t.message}</p>
          </div>
          <button
            onClick={() => removeToast(t.id)}
            aria-label="Dismiss notification"
            className={`shrink-0 opacity-70 hover:opacity-100 transition-opacity mt-0.5 ${t.type === 'warning' ? 'text-navy' : 'text-white'}`}
          >
            <X className="size-[14px]" strokeWidth={1.8} />
          </button>
        </li>
      ))}
    </ul>
  );
}
