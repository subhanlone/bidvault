import { useToast } from '../context/ToastContext';
import { IconX } from './Icons';

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
            ${t.type === 'success' ? 'bg-[#1a7a4a]'
              : t.type === 'error' ? 'bg-primary'
              : t.type === 'warning' ? 'bg-[#d97706]'
              : 'bg-navy'}
          `}
        >
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[13px] text-white leading-tight">{t.title}</p>
            <p className="text-[12px] text-[rgba(255,255,255,0.85)] mt-0.5 leading-snug">{t.message}</p>
          </div>
          <button
            onClick={() => removeToast(t.id)}
            aria-label="Dismiss notification"
            className="shrink-0 text-white opacity-60 hover:opacity-100 transition-opacity mt-0.5"
          >
            <IconX className="size-[14px]" />
          </button>
        </li>
      ))}
    </ul>
  );
}
