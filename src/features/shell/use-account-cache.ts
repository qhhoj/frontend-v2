import { useQueryClient } from '@tanstack/vue-query';
import { watch } from 'vue';
import { useSessionStore } from '@/stores/session.store';

/**
 * A session that ends without a logout (expiry flips it to anonymous) must not leave that account's cached
 * queries for the next viewer. Logout clears explicitly; login resets. Call once, in the shell.
 */
export function useAccountCacheSync() {
  const session = useSessionStore();
  const queryClient = useQueryClient();
  watch(
    () => session.status,
    (status, previous) => {
      if (status === 'anonymous' && (previous === 'authenticated' || previous === 'partial'))
        queryClient.clear();
    },
  );
}
