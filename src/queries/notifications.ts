import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { AppNotification } from '../types/api';
import { useAuth } from '../context/AuthContext';
import { keys } from './keys';

/** How often to re-check while a tab is open. Unchanged from the hand-rolled setInterval. */
const POLL_MS = 45_000;

/**
 * Notifications, replacing NotificationProvider.
 *
 * The provider held a `setInterval`, a manual `active` flag to avoid setting state after
 * unmount, a microtask to clear on logout without a synchronous setState in the effect body,
 * and two optimistic updaters — 70 lines of bookkeeping around one polled GET. `refetchInterval`
 * and two mutations cover all of it, and the awkward parts stop existing: a query that is
 * `enabled: false` returns no data, so logging out clears the list with nothing to schedule.
 */
export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const signedIn = Boolean(user);

  const { data: notifications = [] } = useQuery({
    queryKey: keys.notifications,
    queryFn: () => api.get('/notifications'),
    enabled: signedIn,
    refetchInterval: POLL_MS,
  });

  /** Flip rows to read in the cache straight away; the request is best-effort behind it. */
  const optimistic = (predicate: (n: AppNotification) => boolean) =>
    queryClient.setQueryData<AppNotification[]>(keys.notifications, (old) =>
      old?.map((n) => (predicate(n) ? { ...n, isRead: true } : n)),
    );

  const markRead = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onMutate: (id) => optimistic((n) => n.id === id),
  });

  const markAllRead = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onMutate: () => optimistic(() => true),
  });

  return {
    notifications,
    unreadCount: notifications.reduce((n, x) => n + (x.isRead ? 0 : 1), 0),
    refresh: () => queryClient.invalidateQueries({ queryKey: keys.notifications }),
    markRead: (id: string) => markRead.mutate(id),
    markAllRead: () => markAllRead.mutate(),
  };
}
