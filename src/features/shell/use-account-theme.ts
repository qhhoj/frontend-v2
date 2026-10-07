import { watch } from 'vue';
import { useProfileQuery } from '@/features/account/profile.queries';
import { useSessionStore } from '@/stores/session.store';
import { useThemeStore } from '@/theme/theme.store';

/**
 * A signed-in viewer's `siteTheme` outranks this browser's preference; signing out hands the theme back.
 * Call once, in the shell.
 */
export function useAccountThemeSync() {
  const theme = useThemeStore();
  const session = useSessionStore();
  const { data } = useProfileQuery();
  watch(
    () => [session.status, session.passwordChangeRequired, data.value?.siteTheme] as const,
    ([status, passwordChangeRequired, siteTheme]) => {
      if (status === 'unknown') return;
      const signedIn = status === 'authenticated';
      // Signed in without a profile yet (loading, or blocked by a password change): keep what is painted.
      if (signedIn && !siteTheme && !passwordChangeRequired) return;
      theme.adopt(signedIn ? (siteTheme ?? null) : null);
    },
    { immediate: true },
  );
}
