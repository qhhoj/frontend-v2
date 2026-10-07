import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import { fetchProfile } from '@/api/profile.api';
import { useSessionStore } from '@/stores/session.store';

export const PROFILE_KEY = ['account', 'profile'] as const;
/** Scoped to the account, so a session that expires and a different user signing in never read the previous profile. */
export const profileKey = (userId: string | undefined) => [...PROFILE_KEY, userId] as const;

/** The signed-in viewer's settings; idle while anonymous or while a password change blocks the API. */
export function useProfileQuery() {
  const session = useSessionStore();
  return useQuery({
    queryKey: computed(() => profileKey(session.user?.id)),
    queryFn: fetchProfile,
    enabled: computed(() => session.status === 'authenticated' && !session.passwordChangeRequired),
    staleTime: 5 * 60_000,
  });
}
