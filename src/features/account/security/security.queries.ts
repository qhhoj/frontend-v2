import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import { fetchScratchCodesRemaining } from '@/api/account.api';
import { useSessionStore } from '@/stores/session.store';

export const SCRATCH_CODES_REMAINING_KEY = ['account', 'scratch-codes-remaining'] as const;

/** Asked only when the app is on and the viewer is the account owner (the backend answers 403 while viewing as someone). */
export function useScratchCodesRemainingQuery() {
  const session = useSessionStore();
  return useQuery({
    queryKey: computed(() => [...SCRATCH_CODES_REMAINING_KEY, session.user?.id] as const),
    queryFn: fetchScratchCodesRemaining,
    enabled: computed(() => Boolean(session.user?.isTotpEnabled) && !session.impersonatorId),
  });
}
