import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import { fetchScratchCodesRemaining, fetchSecurityKeys, fetchSocialLinks } from '@/api/account.api';
import { useSessionStore } from '@/stores/session.store';

export const SCRATCH_CODES_REMAINING_KEY = ['account', 'scratch-codes-remaining'] as const;
export const SECURITY_KEYS_KEY = ['account', 'security-keys'] as const;

/** Asked only when the app is on and the viewer is the account owner (the backend answers 403 while viewing as someone). */
export function useScratchCodesRemainingQuery() {
  const session = useSessionStore();
  return useQuery({
    queryKey: computed(() => [...SCRATCH_CODES_REMAINING_KEY, session.user?.id] as const),
    queryFn: fetchScratchCodesRemaining,
    enabled: computed(() => Boolean(session.user?.isTotpEnabled) && !session.impersonatorId),
  });
}

/** The viewer's own keys; never asked while viewing as someone else (403). */
export function useSecurityKeysQuery() {
  const session = useSessionStore();
  return useQuery({
    queryKey: computed(() => [...SECURITY_KEYS_KEY, session.user?.id] as const),
    queryFn: fetchSecurityKeys,
    enabled: computed(() => session.status === 'authenticated' && !session.impersonatorId),
  });
}

export const SOCIAL_LINKS_KEY = ['account', 'social-links'] as const;

/** The viewer's own social links; never asked while viewing as someone else (403). */
export function useSocialLinksQuery() {
  const session = useSessionStore();
  return useQuery({
    queryKey: computed(() => [...SOCIAL_LINKS_KEY, session.user?.id] as const),
    queryFn: fetchSocialLinks,
    enabled: computed(() => session.status === 'authenticated' && !session.impersonatorId),
  });
}
