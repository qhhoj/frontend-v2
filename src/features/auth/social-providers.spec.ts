import { describe, expect, it } from 'vitest';
import { knownSocialProviders } from './social-providers';

describe('knownSocialProviders', () => {
  it('keeps the providers the backend lists, in its order, without duplicates', () => {
    expect(knownSocialProviders(['github', 'google', 'github'])).toEqual(['github', 'google']);
  });

  it('drops a provider this build has no button for, including prototype names', () => {
    expect(knownSocialProviders(['google', 'twitter', '__proto__', 'toString'])).toEqual([
      'google',
    ]);
  });
});
