import { describe, expect, it } from 'vitest';
import { fail, mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer, signedInViewer } from '@/test/problem-routes';

const START = '/blog/new';
const site = (officialMode: boolean) => ({
  'GET /site': ok({ config: {}, officialMode }),
});
const officialBanner = () =>
  document.body.querySelector<HTMLElement>('[data-testid="official-banner"]');
const pill = () => document.body.querySelector<HTMLElement>('[data-testid="official-pill"]');

describe('official mode in the shell', () => {
  it('trusts officialMode false over an end time that is still in the future', async () => {
    mockApi({
      ...signedInViewer(),
      'GET /site': ok({
        navigation: [],
        config: {},
        officialMode: false,
        officialModeEndsAt: '2099-01-01T00:00:00Z',
      }),
    });
    await mountApp(START);
    expect(pill()).toBeNull();
    expect(officialBanner()).toBeNull();
  });

  it('asks nothing for an anonymous viewer', async () => {
    const calls = mockApi({
      ...anonymousViewer,
      'GET /pages/no-such-page': fail(404, 'not_found'),
      ...site(true),
    });
    await mountApp('/no-such-page');
    expect(calls.some((call) => call.path === '/site')).toBe(false);
    expect(officialBanner()).toBeNull();
  });
});
