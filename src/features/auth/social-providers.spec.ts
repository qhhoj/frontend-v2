import { describe, expect, it } from 'vitest';
import { API_BASE } from '@/api/client';
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
  it('is a same-origin API path, one per provider, with nothing but the provider in it', () => {
    const urls = (['google', 'github', 'facebook'] as const).map(socialStartUrl);
    expect(new Set(urls).size).toBe(urls.length);
    for (const url of urls) {
      expect(url.startsWith(`${API_BASE}/`)).toBe(true);
      expect(new URL(url, 'https://qhhoj.test').origin).toBe('https://qhhoj.test');
      expect(url).not.toMatch(/[?#]/);
    }
    expect(socialStartUrl('github')).toContain('/github/');
  });
});
