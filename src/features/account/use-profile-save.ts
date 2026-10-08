import { useQueryClient } from '@tanstack/vue-query';
import { updateProfile } from '@/api/profile.api';
import type { Profile, ProfilePatch } from '@/api/types/profile';
import { useSessionStore } from '@/stores/session.store';
import { profileKey } from './profile.queries';

/**
 * Shared by every saver (theme, look, profile form): each answer carries the whole profile, so an answer to an older
 * save, whoever sent it, would put back the fields a newer save changed.
 */
let latestRequest = 0;

/** Saves part of the signed-in viewer's profile, caches the answer unless a newer save or another account moved on, and returns it. Throws the failure. */
export function useProfileUpdate() {
  const session = useSessionStore();
  const queryClient = useQueryClient();
  return async (patch: ProfilePatch): Promise<Profile> => {
    const userId = session.user?.id;
    const request = ++latestRequest;
    try {
      const saved = await updateProfile(patch);
      // A newer save, or a different account, already moved on: this answer is stale.
      if (request === latestRequest && session.user?.id === userId)
        queryClient.setQueryData(profileKey(userId), saved);
      return saved;
    } catch (error) {
      // An older answer may have been dropped above while this save failed: the server is the source, so refetch.
      void queryClient.invalidateQueries({ queryKey: profileKey(userId) });
      throw error;
    }
  };
}

/** The theme and look savers: anonymous visitors send nothing, and a failure is swallowed (this browser keeps the choice). */
export function useProfileSave() {
  const session = useSessionStore();
  const update = useProfileUpdate();
  return async (patch: ProfilePatch) => {
    // A required password change blocks the API for this account, so nothing is sent.
    if (session.status !== 'authenticated' || session.passwordChangeRequired) return;
    // The account keeps its old values; this browser keeps the new ones.
    await update(patch).catch(() => undefined);
  };
}
