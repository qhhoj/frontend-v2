import { useQuery } from '@tanstack/vue-query';
import { fetchSocialProviders } from '@/api/auth.api';
import { knownSocialProviders } from './social-providers';

const FIVE_MINUTES = 5 * 60_000;

/** Shared by the login and register screens; an admin who enables a provider is seen within minutes. */
export const useSocialProvidersQuery = () =>
  useQuery({
    queryKey: ['auth', 'social-providers'],
    queryFn: fetchSocialProviders,
    staleTime: FIVE_MINUTES,
    select: (result) => knownSocialProviders(result.providers),
  });
