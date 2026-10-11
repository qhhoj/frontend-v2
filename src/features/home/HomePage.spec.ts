import { flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  contestItem,
  leaderboardEntry,
  profile,
  ratingHistory,
  signedIn,
  signedOut,
  submissionItem,
  userPage,
} from '@/test/fixtures';
import { homeResponse } from '@/test/community-fixtures';
import { installFakeEventSource } from '@/test/fake-event-source';
import { fail, mockApi, ok, page } from '@/test/mock-api';
import type { MockHandler } from '@/test/mock-api';
import { mountApp } from '@/test/mount';

const publicRoutes: Record<string, MockHandler> = {
  'GET /home': ok(homeResponse()),
  'GET /posts': page([]),
  'GET /contests': page([contestItem()]),
  'GET /users': page([
    leaderboardEntry(1, 'user_07', 2788),
    leaderboardEntry(2, 'user_12', 2431),
    leaderboardEntry(3, 'user_03', 2207),
  ]),
};
const signedInRoutes = (
  overrides: Record<string, MockHandler> = {},
): Record<string, MockHandler> => ({
  ...publicRoutes,
  'GET /auth/me': signedIn(),
  'GET /profile': ok(profile()),
  'GET /users/user_01': ok(userPage()),
  'GET /users/user_01/ratings': ok(ratingHistory()),
  'GET /submissions': page([
    submissionItem(),
    submissionItem({
      id: 'sub-2',
      problem: { code: 'sp', name: 'Đường đi ngắn nhất', isDeleted: false, points: 100 },
      result: 'TLE',
      time: null,
    }),
  ]),
  ...overrides,
});

describe('home', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-10-08T10:00:00Z'));
    installFakeEventSource();
  });
  afterEach(() => vi.useRealTimers());

  it('says so when the rating history cannot be loaded', async () => {
    mockApi(signedInRoutes({ 'GET /users/user_01/ratings': fail(500, 'internal') }));
    const { wrapper } = await mountApp('/');
    await flushPromises();
    expect(wrapper.get('[data-testid="rating-hero"] [role="alert"] button').text()).toBe('Thử lại');
  });

  it('shows anonymous viewers the public cards only', async () => {
    mockApi({ ...publicRoutes, 'GET /auth/me': signedOut });
    const { wrapper } = await mountApp('/');
    expect(wrapper.get('h1').text()).toBe('Quốc Học Huế Online Judge');
    expect(wrapper.find('[data-testid="rating-hero"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="top-users"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="running-contests"]').exists()).toBe(true);
  });
});
