import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { keys } from './keys';
import type { AiValuation } from '../types/api';

/** While a run is queued, running or refreshing, how often to look again. */
const WORKING_POLL_MS = 4_000;

/**
 * The AI price comparison for an auction (GET /ai/valuations/{auctionId}). Reading it is cheap and
 * may ask the server's background job for a run; while one is in progress the hook looks again every
 * few seconds and stops once there is an outcome.
 */
export function useAiValuation(auctionId: string | undefined, enabled = true) {
  return useQuery<AiValuation>({
    queryKey: keys.aiValuation(auctionId ?? ''),
    queryFn: () => api.get(`/ai/valuations/${auctionId}`),
    enabled: Boolean(auctionId) && enabled,
    refetchInterval: (query) => {
      const v = query.state.data;
      return v && (v.status === 'QUEUED' || v.status === 'RUNNING' || v.refreshing) ? WORKING_POLL_MS : false;
    },
  });
}
