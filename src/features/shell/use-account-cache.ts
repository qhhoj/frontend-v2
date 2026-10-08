import { useQueryClient } from '@tanstack/vue-query';
import { watch } from 'vue';
import { useSessionStore } from '@/stores/session.store';

/**
 * The single place that drops account-owned data: whenever the signed-in user changes (login, logout, expiry or
 * another account taking over the session) the cache is cleared, so a viewer never sees the previous account's data.
 * The first answer out of `unknown` is skipped: it is the initial `/auth/me`, not a change of account.
 * Call once, in the shell.
 */
export function useAccountCacheSync() {
  const session = useSessionStore();
  const queryClient = useQueryClient();
  watch(
    () => [session.status, session.user?.id] as const,
    ([, userId], [previousStatus, previousUserId]) => {
      if (previousStatus !== 'unknown' && userId !== previousUserId) queryClient.clear();
    },
  );
}
