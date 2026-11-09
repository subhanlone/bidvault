import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { PaginatedAdminReports, PaginatedAdminUsers, ReportStatus } from '../types/api';
import { keys } from './keys';

/**
 * The admin User Management directory (GET /admin/users): cursor-paginated, same shape as
 * useActiveAuctions. `search` is a server-side filter (name or email) and part of the query key, so
 * changing it starts a fresh paginated query.
 */
export function useAdminUsers(search: string) {
  return useInfiniteQuery({
    queryKey: keys.admin.users(search),
    queryFn: ({ pageParam }) => {
      const qs = new URLSearchParams();
      if (search) qs.set('search', search);
      if (pageParam) qs.set('cursor', pageParam);
      return api.get(`/admin/users?${qs.toString()}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: PaginatedAdminUsers) => lastPage.nextCursor ?? undefined,
  });
}

/**
 * The listing reports queue (G5): one status at a time, oldest first, cursor-paginated. Keyed per
 * status so each tab keeps its own pages.
 */
export function useAdminReports(status: ReportStatus) {
  return useInfiniteQuery({
    queryKey: keys.admin.reports(status),
    queryFn: ({ pageParam }) => {
      const qs = new URLSearchParams({ status });
      if (pageParam) qs.set('cursor', pageParam);
      return api.get(`/admin/reports?${qs.toString()}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: PaginatedAdminReports) => lastPage.nextCursor ?? undefined,
  });
}

/** How many reports wait for a decision, for the sidebar badge: the first page of OPEN ones,
 * shown as "50+" when there are more. Shares nothing with the Reports tabs' pages. */
export function useOpenReportCount(enabled: boolean) {
  return useQuery({
    queryKey: [...keys.admin.reports('OPEN'), 'badge'] as const,
    queryFn: (): Promise<PaginatedAdminReports> => api.get('/admin/reports?status=OPEN&limit=50'),
    enabled,
    select: (page) => (page.nextCursor ? '50+' : page.items.length > 0 ? String(page.items.length) : undefined),
  });
}

/** Mark a report ACTIONED or DISMISSED; every Reports tab and the badge refresh afterwards. */
export function useResolveReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, status }: { reportId: string; status: 'ACTIONED' | 'DISMISSED' }) =>
      api.patch(`/admin/reports/${reportId}`, { status }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] }),
  });
}

