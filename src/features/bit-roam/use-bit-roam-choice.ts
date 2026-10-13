import { watch } from 'vue';
import { useProfileQuery } from '@/features/account/profile.queries';
import { useProfileSave } from '@/features/account/use-profile-save';
import { useSessionStore } from '@/stores/session.store';
import { parseBitRoam, useBitRoamStore } from './bit-roam.store';
import type { BitRoamChoice } from './bit-roam.store';

/** The one way the UI changes the roaming Bits: `apply` shows a change at once, `save` sends what is shown to the account. */
export function useBitRoamChoice() {
  const store = useBitRoamStore();
  const saveProfile = useProfileSave();
  const save = () => saveProfile({ bitRoam: { ...store.choice } });
  const apply = (patch: Partial<BitRoamChoice>) => store.choose(patch);
  const update = (patch: Partial<BitRoamChoice>) => {
    apply(patch);
    return save();
  };
  return { apply, save, update };
}

/**
 * A signed-in viewer's saved choice outranks this browser's; signing out, or a required password change, hands this browser's
 * choice back. A profile that is loading or failed keeps what is shown. Call once, in the shell.
 */
export function useAccountBitRoamSync() {
  const store = useBitRoamStore();
  const session = useSessionStore();
  const { data } = useProfileQuery();
  watch(
    // A string, so a background refetch with the same value does not undo a slider being dragged.
    () =>
      [
        session.status,
        session.passwordChangeRequired,
        data.value ? JSON.stringify(data.value.bitRoam) : undefined,
      ] as const,
    ([status, passwordChangeRequired, saved]) => {
      if (status === 'unknown') return;
      if (status !== 'authenticated' || passwordChangeRequired) return store.adopt(undefined);
      if (saved !== undefined) store.adopt(parseBitRoam(JSON.parse(saved)));
    },
    { immediate: true },
  );
}
