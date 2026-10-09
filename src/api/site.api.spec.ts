import { describe, expect, it } from 'vitest';
import { mockApi, ok } from '@/test/mock-api';
import { fetchSite } from './site.api';

describe('site api', () => {
  it('reads the official-mode flag and its end from GET /site', async () => {
    const calls = mockApi({
      'GET /site': ok({
        navigation: [],
        config: {},
        officialMode: true,
        officialModeEndsAt: '2026-10-09T12:00:00Z',
      }),
    });
    const site = await fetchSite();
    expect(site.officialMode).toBe(true);
    expect(site.officialModeEndsAt).toBe('2026-10-09T12:00:00Z');
    expect(calls[0]!.method).toBe('GET');
  });
});
