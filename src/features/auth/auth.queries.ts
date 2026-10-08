import { useQuery } from '@tanstack/vue-query';
import { fetchSocialProviders } from '@/api/auth.api';
import { fetchHomeCounts } from '@/api/home.api';
import { fetchOpenOrganizations } from '@/api/organizations.api';
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

/** The login screen's one counts line; decorative, so it is cached like the other reference data. */
export const useSiteCountsQuery = () =>
  useQuery({ queryKey: ['home', 'counts'], queryFn: fetchHomeCounts, staleTime: FIVE_MINUTES });

/** Schools change rarely; the school picker reads the list once per visit. */
export const useOpenOrganizationsQuery = () =>
  useQuery({
    queryKey: ['organizations', 'open'],
    queryFn: fetchOpenOrganizations,
    staleTime: 10 * 60_000,
  });
