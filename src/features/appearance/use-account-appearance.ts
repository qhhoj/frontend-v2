import { watch } from 'vue';
import { useProfileQuery } from '@/features/account/profile.queries';
import { useSessionStore } from '@/stores/session.store';
import { parseAppearance } from '@/theme/appearance';
import { useAppearanceStore } from '@/theme/appearance.store';
import { forgetSentLook, isSupersededAnswer } from './use-appearance-choice';

/**
 * A signed-in viewer's saved look outranks this browser's (and `null` there means the site look); signing out, or a
 * required password change (the profile is not read then), hands the browser's own look back. A profile that is
 * loading or failed keeps the look already painted. Call once, in the shell.
 */
export function useAccountAppearanceSync() {
  const appearance = useAppearanceStore();
  const session = useSessionStore();
  const { data } = useProfileQuery();
  watch(
    // A string, so a background refetch with the same value does not undo a slider being dragged.
    () =>
      [
        session.status,
        session.passwordChangeRequired,
        data.value ? JSON.stringify(data.value.appearance) : undefined,
      ] as const,
    ([status, passwordChangeRequired, saved]) => {
      if (status === 'unknown') return;
      if (status !== 'authenticated' || passwordChangeRequired) {
        forgetSentLook();
        return appearance.adopt(undefined);
      }
      if (saved === undefined) return; // loading or failed: keep what is painted
      const answer = parseAppearance(JSON.parse(saved));
      if (isSupersededAnswer(answer, appearance.look)) return;
      appearance.adopt(answer);
    },
    { immediate: true },
  );
}
