import { useQueryClient } from '@tanstack/vue-query';
import type { QueryClient } from '@tanstack/vue-query';
import { watch } from 'vue';
import { forgetAllRecentScreens } from '@/features/admin/shell/recent/recent-screens';
import { useSessionStore } from '@/stores/session.store';
import { useViewerId } from '@/stores/use-viewer-id';

/**
 * Drops every answer of the previous account and tells the mounted queries: `clear()` alone empties the cache
 * without notifying their observers, which keep showing what they hold. Unmounted entries go. A mounted query keyed
 * on the new viewer is already fetching its own answer; every other mounted one (a key with no viewer) restarts
 * empty and fetches again as the new viewer.
 */
function dropAccountData(queryClient: QueryClient, viewerId: string) {
  queryClient.getMutationCache().clear();
  queryClient.removeQueries({ type: 'inactive' });
  void queryClient.resetQueries({
    type: 'active',
    predicate: (query) => !query.queryKey.includes(viewerId),
  });
}

/**
 * The single place that drops account-owned data: whenever the signed-in user changes (login, logout, expiry,
 * impersonation, or another tab signing in as someone else) the cache is reset, so a viewer never sees the previous
 * account's data. The first answer out of `unknown` is skipped: it is the initial `/auth/me`, not a change of account.
 * It runs after the render (`flush: 'post'`), once the queries keyed on the viewer have moved to the new viewer's key,
 * so the previous viewer's entries are no longer mounted and nothing refetches into them. Call once, in the shell.
 */
export function useAccountCacheSync() {
  const session = useSessionStore();
  const queryClient = useQueryClient();
  const viewerId = useViewerId();
  watch(
    () => [session.status, session.user?.id] as const,
    ([status, userId], [previousStatus, previousUserId]) => {
      if (status === 'anonymous') forgetAllRecentScreens();
      if (previousStatus === 'unknown' || userId === previousUserId) return;
      dropAccountData(queryClient, viewerId.value);
    },
    { flush: 'post' },
  );
}
