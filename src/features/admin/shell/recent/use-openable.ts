import { useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/session.store';
import { canUseAdmin } from '../../admin-access';

/** Whether this viewer may open an admin path: a remembered page whose rights were taken away is left out, never a dead end. */
export function useIsOpenable() {
  const router = useRouter();
  const session = useSessionStore();
  return (path: string) => {
    const target = router.resolve(path);
    return (
      target.name !== 'admin-unknown' &&
      canUseAdmin(session.user, {
        permission: target.meta.permission ?? null,
        capability: target.meta.capability,
      })
    );
  };
}
