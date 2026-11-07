import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { keys } from './keys';

/**
 * The settings anyone may read (GET /settings/public): the buying-rule windows the auction page
 * quotes, and the seller terms version. They change rarely, so they are kept for five minutes.
 */
export function usePublicSettings() {
  return useQuery({
    queryKey: keys.publicSettings,
    queryFn: () => api.get('/settings/public'),
    staleTime: 5 * 60_000,
  });
}
