import { createContext, useContext } from 'react';
import type { Toast } from '../types';

// Apart from the provider component for the same reason as auth.ts (react-refresh).
export interface ToastContextType {
  toasts: Toast[];
  showToast: (t: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
