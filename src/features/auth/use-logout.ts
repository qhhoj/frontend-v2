import { useQueryClient } from '@tanstack/vue-query';
import { useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/session.store';

/** Ends the session, drops every cached query and leaves pages that need an account. */
export function useLogout() {
  const session = useSessionStore();
  const queryClient = useQueryClient();
  const router = useRouter();
  return async () => {
    await session.logout();
    queryClient.clear();
    const { meta } = router.currentRoute.value;
    if (meta.requiresAuth || meta.staffOnly) await router.push({ name: 'home' });
  };
}
