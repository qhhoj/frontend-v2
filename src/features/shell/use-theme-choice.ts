import { useQueryClient } from '@tanstack/vue-query';
import { updateProfile } from '@/api/profile.api';
import { profileKey } from '@/features/account/profile.queries';
import { useSessionStore } from '@/stores/session.store';
import { useThemeStore } from '@/theme/theme.store';

/** Applies a theme at once and, when signed in, saves it as the account's `siteTheme` (`preference` is a registry `storedAs` or `auto`). */
export function useThemeChoice() {
  const theme = useThemeStore();
  const session = useSessionStore();
  const queryClient = useQueryClient();
  let latestRequest = 0;
  return async (preference: string) => {
    theme.choose(preference);
    const userId = session.user?.id;
    if (session.status !== 'authenticated') return;
    const request = ++latestRequest;
    try {
      const saved = await updateProfile({ siteTheme: preference });
      // A newer pick, or a different account, already moved on: this answer is stale.
      if (request === latestRequest && session.user?.id === userId)
        queryClient.setQueryData(profileKey(userId), saved);
    } catch {
      // The account keeps its old value; this browser keeps the new one.
    }
  };
}
