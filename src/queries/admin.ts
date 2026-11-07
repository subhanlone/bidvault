import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { PaginatedAdminUsers } from '../types/api';
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
