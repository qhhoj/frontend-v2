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
      problem: { code: 'sp', name: 'Đường đi ngắn nhất', isDeleted: false },
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

  it("shows the viewer's rating, stats and history", async () => {
    mockApi(signedInRoutes());
    const { wrapper } = await mountApp('/');
    const hero = wrapper.get('[data-testid="rating-hero"]');
    expect(hero.text()).toContain('Chào buổi sáng, user_01');
    expect(hero.text()).toContain('2104');
    expect(hero.text()).toContain('+86 sau kỳ thi gần nhất');
    expect(hero.text()).toContain('Rating · Candidate Master');
    expect(hero.text()).toContain('412');
    expect(hero.text()).toContain('386,4');
    expect(hero.text()).toContain('#27');
    expect(hero.get('svg[role="img"]').attributes('aria-label')).toBe(
      'Rating qua 3 kỳ thi, từ 1950 đến 2104',
    );
  });

  it('lists recent submissions with verdict names', async () => {
    const calls = mockApi(signedInRoutes());
    const { wrapper } = await mountApp('/');
    const recent = wrapper.get('[data-testid="recent-submissions"]');
    expect(recent.text()).toContain('Tổng hai số');
    expect(recent.text()).toContain('Chấp nhận · C++17');
    expect(recent.text()).toContain('0.04s · 2 phút trước');
    expect(recent.text()).toContain('Quá thời gian · C++17');
    const listCall = calls.find((call) => call.path === '/submissions')!;
    expect(listCall.query.get('user')).toBe('user_01');
    expect(listCall.query.get('pageSize')).toBe('4');
  });

  it('shows the running contest with a countdown and the top rated users', async () => {
    mockApi(signedInRoutes());
    const { wrapper } = await mountApp('/');
    const contest = wrapper.get('[data-testid="live-contest"]');
    expect(contest.text()).toContain('QHH Round #42 (Div. 2)');
    expect(contest.get('[role="timer"]').text()).toBe('01:24:37');
    expect(contest.get('a[href="/contests/r42"]').text()).toBe('Vào thi');
    const top = wrapper.get('[data-testid="top-users"]');
    expect(top.findAll('li a').map((link) => link.text())).toEqual([
      'user_07',
      'user_12',
      'user_03',
    ]);
    expect(top.findAll('li .font-mono').map((cell) => cell.text())).toEqual([
      '2788',
      '2431',
      '2207',
    ]);
    expect(top.get('a[href="/users/user_07"]').classes()).toContain('text-tier-grandmaster');
  });

  it('seats a decorative Bit in a graduation cap in the greeting card', async () => {
    mockApi(signedInRoutes());
    const { wrapper } = await mountApp('/');
    const bit = wrapper.get('[data-testid="rating-hero"] [data-testid="home-bit"]');
    expect(bit.attributes('aria-hidden')).toBe('true');
  });

  it('seats a labelled Bit in a graduation cap in the hero of an anonymous viewer', async () => {
    mockApi({ ...publicRoutes, 'GET /auth/me': signedOut });
    const { wrapper } = await mountApp('/');
    expect(wrapper.get('h1').text()).toBe('Luyện thuật toán mỗi ngày, thi đấu cùng cả nước');
    expect(wrapper.get('[data-testid="home-bit"]').attributes('aria-label')).toBe(
      'Bit đội mũ tốt nghiệp',
    );
  });

  it('says so when no contest is running', async () => {
    mockApi(signedInRoutes({ 'GET /contests': page([]) }));
    const { wrapper } = await mountApp('/');
    expect(wrapper.get('[data-testid="live-contest"]').text()).toContain(
      'Không có kỳ thi đang diễn ra.',
    );
  });

  it('says so when the rating history cannot be loaded', async () => {
    mockApi(signedInRoutes({ 'GET /users/user_01/ratings': fail(500, 'internal') }));
    const { wrapper } = await mountApp('/');
    await flushPromises();
    expect(wrapper.get('[data-testid="rating-hero"] [role="alert"] button').text()).toBe('Thử lại');
  });

  it('says so when nobody is rated', async () => {
    mockApi(signedInRoutes({ 'GET /users': page([]) }));
    const { wrapper } = await mountApp('/');
    expect(wrapper.get('[data-testid="top-users"]').text()).toContain(
      'Chưa có người dùng nào có rating.',
    );
  });

  it('puts a small decorative sleeping Bit in each card whose list is empty, beside the words that say so', async () => {
    mockApi(
      signedInRoutes({
        'GET /contests': page([]),
        'GET /users': page([]),
        'GET /submissions': page([]),
      }),
    );
    const { wrapper } = await mountApp('/');
    await flushPromises();
    for (const card of ['live-contest', 'recent-submissions', 'top-users']) {
      const cardBit = wrapper.get(`[data-testid="${card}"]`).get('[data-testid="inline-bit"]');
      expect(cardBit.attributes('aria-hidden')).toBe('true');
      expect(cardBit.attributes('role')).toBeUndefined();
    }
  });

  it('draws no Bit in the cards while they have rows', async () => {
    mockApi(signedInRoutes());
    const { wrapper } = await mountApp('/');
    await flushPromises();
    for (const card of ['top-users', 'recent-submissions'])
      expect(
        wrapper.get(`[data-testid="${card}"]`).find('[data-testid="inline-bit"]').exists(),
      ).toBe(false);
  });

  it('shows anonymous viewers the public cards only', async () => {
    mockApi({ ...publicRoutes, 'GET /auth/me': signedOut });
    const { wrapper } = await mountApp('/');
    expect(wrapper.get('h1').text()).toBe('Luyện thuật toán mỗi ngày, thi đấu cùng cả nước');
    expect(wrapper.find('[data-testid="rating-hero"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="top-users"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="running-contests"]').exists()).toBe(true);
  });
});
