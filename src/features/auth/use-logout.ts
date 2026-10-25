import { useRouter } from 'vue-router';
import { forgetAllRecentScreens } from '@/features/admin/shell/recent/recent-screens';
import { useAdminToast } from '@/features/admin/ui/feedback/use-admin-toast';
import { translate } from '@/i18n';
import { useSessionStore } from '@/stores/session.store';

/**
 * Ends the session (the shell drops the account's cached queries), then runs `afterSignOut`: by default it leaves pages
 * that need an account. This browser's own traces (recent admin screens) go at once. A sign-out the server did not
 * confirm keeps the viewer signed in and says so in a toast with "Thử lại". Call in `setup`.
 */
export function useLogout(afterSignOut?: () => Promise<unknown>) {
  const session = useSessionStore();
  const router = useRouter();
  const toast = useAdminToast({ lazy: true });
  const leaveAccountPages = async () => {
    const { meta } = router.currentRoute.value;
    if (meta.requiresAuth || meta.adminArea || meta.notFoundWithout)
      await router.push({ name: 'home' });
  };
  async function signOut() {
    forgetAllRecentScreens();
    try {
      await session.logout();
    } catch {
      toast.show({
        text: translate('account.logoutFailed'),
        tone: 'error',
        undo: () => void signOut(),
        undoLabel: translate('common.retry'),
      });
      return;
    }
    await (afterSignOut ?? leaveAccountPages)();
  }
  return signOut;
}
