import { useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/session.store';

/** Ends the session (the shell drops the account's cached queries) and leaves pages that need an account. */
export function useLogout() {
  const session = useSessionStore();
  const router = useRouter();
  return async () => {
    await session.logout();
    const { meta } = router.currentRoute.value;
    if (meta.requiresAuth || meta.adminArea || meta.notFoundWithout)
      await router.push({ name: 'home' });
  };
}
