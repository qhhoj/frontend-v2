import { flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  contestItem,
  CPP17_ID,
  leaderboardEntry,
  problemMeta,
  profile,
  ratingHistory,
  signedIn,
  signedOut,
  submissionItem,
  userPage,
} from '@/test/fixtures';
import { installFakeEventSource, latestEventSource } from '@/test/fake-event-source';
import { fail, mockApi, ok, page } from '@/test/mock-api';
import type { MockHandler } from '@/test/mock-api';
import { mountApp } from '@/test/mount';

const publicRoutes: Record<string, MockHandler> = {
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
      problem: { code: 'sp', name: 'Đường đi ngắn nhất' },
      result: 'TLE',
      time: null,
    }),
  ]),
  'GET /problems/meta': ok(problemMeta()),
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

  it('says so when no contest is running', async () => {
    mockApi(signedInRoutes({ 'GET /contests': page([]) }));
    const { wrapper } = await mountApp('/');
    expect(wrapper.get('[data-testid="live-contest"]').text()).toContain(
      'Không có kỳ thi đang diễn ra.',
    );
  });

  it('submits from the quick panel and follows the verdict live', async () => {
    const calls = mockApi(
      signedInRoutes({
        'POST /problems/aplusb/submit': ok({ id: 'sub-9' }),
        'GET /submissions/sub-9': ok(submissionItem({ id: 'sub-9', status: 'D', result: 'AC' })),
      }),
    );
    const { wrapper } = await mountApp('/');
    await wrapper.get('#quick-submit-code').setValue('aplusb');
    await wrapper.get('#quick-submit-source').setValue('int main() {}');
    await wrapper.get('[data-testid="quick-submit"] form').trigger('submit');
    await flushPromises();
    expect(calls.find((call) => call.method === 'POST')?.body).toEqual({
      language: CPP17_ID,
      source: 'int main() {}',
    });
    expect(latestEventSource().url).toBe('/api/internal/events/submissions/sub-9');
    latestEventSource().emit('test-case', {
      submissionId: 'sub-9',
      type: 'test-case',
      status: 'G',
      currentTestcase: 3,
    });
    await flushPromises();
    const status = wrapper.get('[data-testid="quick-submit"] [role="status"]');
    expect(status.text()).toContain('Đang chấm test 3');
    latestEventSource().emit('done', { submissionId: 'sub-9', type: 'done', status: 'D' });
    await flushPromises();
    expect(status.text()).toContain('Chấp nhận');
    expect(calls.filter((call) => call.path === '/submissions')).toHaveLength(2);
  });

  it('asks to reload when the live stream is lost and the verdict is unconfirmed', async () => {
    mockApi(
      signedInRoutes({
        'POST /problems/aplusb/submit': ok({ id: 'sub-9' }),
        'GET /submissions/sub-9': ok(submissionItem({ id: 'sub-9', status: 'P', result: null })),
      }),
    );
    const { wrapper } = await mountApp('/');
    await wrapper.get('#quick-submit-code').setValue('aplusb');
    await wrapper.get('#quick-submit-source').setValue('int main() {}');
    await wrapper.get('[data-testid="quick-submit"] form').trigger('submit');
    await flushPromises();
    latestEventSource().fail();
    await flushPromises();
    expect(wrapper.get('[data-testid="quick-submit"]').text()).toContain('Tải lại trang');
  });

  it('names an unknown problem code', async () => {
    mockApi(signedInRoutes({ 'POST /problems/nope/submit': fail(404, 'not_found') }));
    const { wrapper } = await mountApp('/');
    await wrapper.get('#quick-submit-code').setValue('nope');
    await wrapper.get('#quick-submit-source').setValue('x');
    await wrapper.get('[data-testid="quick-submit"] form').trigger('submit');
    await flushPromises();
    expect(wrapper.get('[data-testid="quick-submit"] [role="alert"]').text()).toBe(
      'Không tìm thấy bài nope.',
    );
  });

  it('shows anonymous viewers the public cards only', async () => {
    mockApi({ ...publicRoutes, 'GET /auth/me': signedOut });
    const { wrapper } = await mountApp('/');
    expect(wrapper.get('h1').text()).toBe('Luyện thuật toán, thi đấu trực tuyến');
    expect(wrapper.find('[data-testid="rating-hero"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="quick-submit"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="live-contest"]').exists()).toBe(true);
  });
});
