import { describe, expect, it } from 'vitest';
import { knownSocialProviders, socialStartUrl } from './social-providers';

describe('knownSocialProviders', () => {
  it('keeps the providers the backend lists, in its order, without duplicates', () => {
    expect(knownSocialProviders(['github', 'google', 'github'])).toEqual(['github', 'google']);
    expect(knownSocialProviders(['facebook'])).toEqual(['facebook']);
  });

  it('drops a provider this build has no button for, including prototype names', () => {
    expect(knownSocialProviders(['google', 'twitter', '__proto__', 'toString'])).toEqual([
      'google',
    ]);
  });

  it('is empty when the backend enables none', () => {
    expect(knownSocialProviders([])).toEqual([]);
  });
});

describe('socialStartUrl', () => {
  it('points at the backend redirect endpoint', () => {
    expect(socialStartUrl('github')).toBe('/api/internal/auth/social/github/start');
  });
});
