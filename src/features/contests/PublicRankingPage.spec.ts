import { describe, expect, it } from 'vitest';
import { ranking, signedOut } from '@/test/fixtures';
import { fail, mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';

const publicBoard = () => ({
  contest: {
    key: 'r42',
    name: 'Round 42',
    startTime: '2026-10-01T10:00:00Z',
    endTime: '2026-10-01T13:00:00Z',
    formatName: 'default',
    formatConfig: {},
    pointsPrecision: 0,
  },
  ranking: ranking(),
});

describe('public ranking page', () => {
  it('shows the contest name and the board to a signed-out visitor', async () => {
    mockApi({ 'GET /auth/me': signedOut, 'GET /public-rankings/tok123': ok(publicBoard()) });
    const { wrapper, router } = await mountApp('/public-rankings/tok123');
    expect(router.currentRoute.value.name).toBe('public-ranking');
    expect(wrapper.get('h1').text()).toBe('Round 42');
    expect(wrapper.findAll('tbody tr').length).toBe(ranking().rows.length);
    expect(wrapper.text()).toContain(ranking().rows[0]!.user.username);
  });

  it('says the link is wrong when the token is unknown', async () => {
    mockApi({
      'GET /auth/me': signedOut,
      'GET /public-rankings/nope': fail(404, 'not_found'),
    });
    const { wrapper } = await mountApp('/public-rankings/nope');
    expect(wrapper.find('[data-testid="public-ranking-missing"]').exists()).toBe(true);
    expect(wrapper.find('table').exists()).toBe(false);
  });

  it.each([
    ['/public-ranking/tok123', 'public-ranking'],
    ['/public-ranking/tok123/', 'public-ranking'],
    ['/contest/r42/ranking/', 'contest-ranking'],
  ])('redirects the old link %s to %s', async (path, name) => {
    mockApi({
      'GET /auth/me': signedOut,
      'GET /public-rankings/tok123': ok(publicBoard()),
      'GET /contests/r42': fail(404, 'not_found'),
      'GET /contests/r42/ranking': fail(404, 'not_found'),
    });
    const { router } = await mountApp(path);
    expect(router.currentRoute.value.name).toBe(name);
  });
});
