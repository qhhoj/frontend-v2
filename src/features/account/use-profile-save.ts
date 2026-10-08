import { useQueryClient } from '@tanstack/vue-query';
import { updateProfile } from '@/api/profile.api';
import type { ProfilePatch } from '@/api/types/profile';
import { useSessionStore } from '@/stores/session.store';
import { profileKey } from './profile.queries';

/**
 * Shared by every saver (theme, look): each answer carries the whole profile, so an answer to an older save, whoever
 * sent it, would put back the fields a newer save changed.
 */
let latestRequest = 0;

/** Saves part of the signed-in viewer's profile and refreshes the profile cache with the answer; anonymous visitors send nothing. */
export function useProfileSave() {
  const session = useSessionStore();
  const queryClient = useQueryClient();
  return async (patch: ProfilePatch) => {
    // A required password change blocks the API for this account, so nothing is sent.
    if (session.status !== 'authenticated' || session.passwordChangeRequired) return;
    const userId = session.user?.id;
    const request = ++latestRequest;
    try {
      const saved = await updateProfile(patch);
      // A newer save, or a different account, already moved on: this answer is stale.
      if (request === latestRequest && session.user?.id === userId)
        queryClient.setQueryData(profileKey(userId), saved);
    } catch {
      // The account keeps its old values; this browser keeps the new ones.
    }
  };
}
