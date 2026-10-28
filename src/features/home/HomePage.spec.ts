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
import { communityId, homeResponse, postItem } from '@/test/community-fixtures';
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

  it('puts the newest posts, pinned first, between the running contests and the leaderboard', async () => {
    const posts = [
      postItem({ id: communityId(1), title: 'Nội quy thi', sticky: true }),
      postItem({ id: communityId(2), title: 'Lịch luyện tập', sticky: false }),
      postItem({ id: communityId(3), title: 'Tổng kết', sticky: false }),
      postItem({ id: communityId(4), title: 'Bài cũ', sticky: false }),
    ];
    mockApi(signedInRoutes({ 'GET /posts': page(posts) }));
    const { wrapper } = await mountApp('/');
    await flushPromises();
    const card = wrapper.get('[data-testid="new-posts"]');
    expect(
      card.findAll('li a[href^="/blog/"]').map((link) => [link.text(), link.attributes('href')]),
    ).toEqual([
      ['Nội quy thi', `/blog/${communityId(1)}`],
      ['Lịch luyện tập', `/blog/${communityId(2)}`],
      ['Tổng kết', `/blog/${communityId(3)}`],
    ]);
    expect(card.get('li').text()).toContain('Ghim');
    const order = wrapper
      .findAll(
        '[data-testid="new-posts"], [data-testid="top-performers"], [data-testid="running-contests"]',
      )
      .map((node) => node.attributes('data-testid'));
    expect(order).toEqual(['running-contests', 'new-posts', 'top-performers']);
  });

  it('continues with the newest problem that is not accepted, inside the personal card', async () => {
    mockApi(signedInRoutes());
    const { wrapper } = await mountApp('/');
    await flushPromises();
    const button = wrapper.get('[data-testid="rating-hero"] [data-testid="continue-problem"]');
    expect(button.attributes('href')).toBe('/problems/sp');
    expect(button.text()).toBe('Tiếp tục: Đường đi ngắn nhất');
    expect(
      wrapper.get('[data-testid="rating-hero"] [data-testid="recent-submissions"]').text(),
    ).toContain('Đường đi ngắn nhất');
  });

  it('leads with the rating, or with the problems solved before the first rating', async () => {
    mockApi(signedInRoutes());
    const rated = await mountApp('/');
    await flushPromises();
    expect(rated.wrapper.get('[data-testid="hero-figure"]').text()).toBe('2104');
    expect(rated.wrapper.get('[data-testid="rating-hero"] dl').text()).toContain('Đã giải');
    rated.wrapper.unmount();

    mockApi(
      signedInRoutes({
        // A reset rating keeps its history: no delta or chart may sit beside the solved count.
        'GET /users/user_01': ok(userPage({ rating: null, problemCount: 1234 })),
      }),
    );
    const { wrapper } = await mountApp('/');
    await flushPromises();
    expect(wrapper.get('[data-testid="hero-figure"]').text()).toBe('1.234');
    expect(wrapper.get('[data-testid="hero-caption"]').text()).toBe('Bài đã giải · chưa có rating');
    expect(wrapper.get('[data-testid="rating-hero"] dl').text()).not.toContain('Đã giải');
    expect(wrapper.get('[data-testid="rating-row"]').text()).not.toContain('sau kỳ thi');
    expect(wrapper.find('[data-testid="rating-hero"] svg[role="img"]').exists()).toBe(false);
  });

  it('draws the rating chart as an area over a baseline from three ratings, never from two', async () => {
    mockApi(signedInRoutes());
    const three = await mountApp('/');
    await flushPromises();
    const chart = three.wrapper.get('[data-testid="rating-chart"]');
    expect(chart.find('[data-testid="rating-chart-area"]').attributes('d')).toMatch(/Z$/);
    expect(chart.find('[data-testid="rating-chart-baseline"]').exists()).toBe(true);
    three.wrapper.unmount();
    mockApi(
      signedInRoutes({
        'GET /users/user_01/ratings': ok(ratingHistory().filter((entry) => entry.rating !== 2018)),
      }),
    );
    const { wrapper } = await mountApp('/');
    await flushPromises();
    expect(wrapper.get('[data-testid="hero-figure"]').text()).toBe('2104');
    expect(wrapper.find('[data-testid="rating-chart"]').exists()).toBe(false);
  });

  it('shows anonymous viewers the sign-up card above the same cards', async () => {
    mockApi({ ...publicRoutes, 'GET /auth/me': signedOut });
    const { wrapper } = await mountApp('/');
    expect(wrapper.get('h1').text()).toBe('Quốc Học Huế Online Judge');
    expect(wrapper.find('[data-testid="rating-hero"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="running-contests"]').exists()).toBe(true);
  });
});
