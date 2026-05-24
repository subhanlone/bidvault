import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  action?: { label: string; onClick: () => void };
}

interface ToastProps {
  toast: ToastItem;
  onClose: (id: string) => void;
}

const config = {
  success: { border: 'border-l-[#16a34a]', icon: <CheckCircle size={18} className="text-[#16a34a]" /> },
  error:   { border: 'border-l-[#d0021b]',  icon: <AlertTriangle size={18} className="text-[#d0021b]" /> },
  info:    { border: 'border-l-[#1e40af]',  icon: <Info size={18} className="text-[#1e40af]" /> },
};

export function Toast({ toast, onClose }: ToastProps) {
  const { border, icon } = config[toast.type];
  return (
    <div role="alert" aria-live="assertive" aria-atomic="true" className={`animate-toast-in bg-white rounded-xl shadow-[0_10px_15px_rgba(0,0,0,0.1)] border border-[#e5e7eb] border-l-4 ${border} p-4 flex gap-3 w-80 max-w-full`}>
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#0b1f3a]">{toast.title}</p>
        {toast.message && <p className="text-xs text-[#6c757d] mt-0.5 leading-relaxed">{toast.message}</p>}
        {toast.action && (
          <button onClick={toast.action.onClick} className="text-xs font-semibold text-[#d0021b] mt-1.5 cursor-pointer hover:underline">
            {toast.action.label} →
          </button>
        )}
      </div>
      <button onClick={() => onClose(toast.id)} aria-label="Close notification" className="flex-shrink-0 text-[#9ca3af] hover:text-[#374151] transition-colors cursor-pointer">
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => <Toast key={t.id} toast={t} onClose={onClose} />)}
    </div>
  );
}
