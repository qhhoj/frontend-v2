import { API_BASE } from '@/api/client';

/** The providers this build has a button for (backend `social/*.oauth-provider.ts`), by URL slug. */
export const SOCIAL_PROVIDER_LABELS = {
  google: 'Google',
  github: 'GitHub',
  facebook: 'Facebook',
} as const;
export type SocialProvider = keyof typeof SOCIAL_PROVIDER_LABELS;

/** The backend lists the providers it has enabled; a slug without a label here is dropped, duplicates collapse, its order stays. */
export const knownSocialProviders = (slugs: readonly string[]): SocialProvider[] =>
  [...new Set(slugs)].filter((slug): slug is SocialProvider =>
    Object.hasOwn(SOCIAL_PROVIDER_LABELS, slug),
  );

/** `start` is a GET that answers a 302 to the provider, so it is a page navigation, not a fetch. */
export const socialStartUrl = (provider: SocialProvider) =>
  `${API_BASE}/auth/social/${provider}/start`;
