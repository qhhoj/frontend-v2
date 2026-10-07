import { useQueryClient } from '@tanstack/vue-query';
import { updateProfile } from '@/api/profile.api';
import { PROFILE_KEY } from '@/features/account/profile.queries';
import { useSessionStore } from '@/stores/session.store';
import { useThemeStore } from '@/theme/theme.store';

/** Applies a theme at once and, when signed in, saves it as the account's `siteTheme` (`preference` is a registry `storedAs` or `auto`). */
export function useThemeChoice() {
  const theme = useThemeStore();
  const session = useSessionStore();
  const queryClient = useQueryClient();
  return async (preference: string) => {
    theme.choose(preference);
    if (session.status !== 'authenticated') return;
    try {
      queryClient.setQueryData(PROFILE_KEY, await updateProfile({ siteTheme: preference }));
    } catch {
      // The account keeps its old value; this browser keeps the new one.
    }
  };
}
