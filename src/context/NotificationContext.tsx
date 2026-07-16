import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { AppNotification } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);
const POLL_MS = 45_000;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<AppNotification[]>('/notifications');
      setNotifications(data);
    } catch {
      // non-critical — leave existing list in place
    }
  }, []);

  // Fetch on login, then poll while authenticated. Clear on logout.
  useEffect(() => {
    if (!user) {
      // clear via microtask to avoid a synchronous setState in the effect body
      Promise.resolve().then(() => setNotifications([]));
      return;
    }
    let active = true;
    api.get<AppNotification[]>('/notifications')
      .then(data => { if (active) setNotifications(data); })
      .catch(() => { /* non-critical */ });
    const interval = setInterval(() => { void refresh(); }, POLL_MS);
    return () => { active = false; clearInterval(interval); };
  }, [user?.userId, refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  const markRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
    try { await api.post(`/notifications/${id}/read`); } catch { /* optimistic; non-critical */ }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try { await api.post('/notifications/read-all'); } catch { /* optimistic; non-critical */ }
  }, []);

  const unreadCount = notifications.reduce((n, x) => n + (x.isRead ? 0 : 1), 0);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, refresh, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
