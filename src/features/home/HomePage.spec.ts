import { flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  contestItem,
  CPP17_ID,
  PY3_ID,
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

  const submitQuick = async (
    wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper'],
    code = 'aplusb',
    source = 'x',
  ) => {
    await wrapper.get('#quick-submit-code').setValue(code);
    await wrapper.get('#quick-submit-source').setValue(source);
    await wrapper.get('[data-testid="quick-submit"] form').trigger('submit');
    await flushPromises();
  };

  it("submits in the account's preferred language, whichever answer arrives first", async () => {
    const calls = mockApi(
      signedInRoutes({
        'GET /profile': ok(profile({ languageId: PY3_ID })),
        'POST /problems/aplusb/submit': ok({ id: 'sub-9' }),
        'GET /submissions/sub-9': ok(submissionItem({ id: 'sub-9' })),
      }),
    );
    const { wrapper } = await mountApp('/');
    await flushPromises();
    await submitQuick(wrapper);
    expect(calls.find((call) => call.method === 'POST')?.body).toMatchObject({ language: PY3_ID });
  });

  it('does not offer file-only languages', async () => {
    mockApi(signedInRoutes());
    const { wrapper } = await mountApp('/');
    await wrapper.get('[data-testid="quick-submit"] [role="combobox"]').trigger('click');
    await flushPromises();
    const options = [...document.body.querySelectorAll('[role="option"]')].map((option) =>
      option.textContent?.trim(),
    );
    expect(options).toEqual(['C++17', 'Python 3']);
  });

  it('keeps a language the viewer picked when the profile arrives later', async () => {
    const calls = mockApi(
      signedInRoutes({
        'POST /problems/aplusb/submit': ok({ id: 'sub-9' }),
        'GET /submissions/sub-9': ok(submissionItem()),
      }),
    );
    const { wrapper } = await mountApp('/');
    await flushPromises();
    wrapper.getComponent({ name: 'Select' }).vm.$emit('update:modelValue', PY3_ID);
    await submitQuick(wrapper);
    expect(calls.find((call) => call.method === 'POST')?.body).toMatchObject({ language: PY3_ID });
  });

  it('names a language the problem does not allow', async () => {
    mockApi(
      signedInRoutes({
        'POST /problems/aplusb/submit': fail(400, 'validation_failed', {
          language: ['not allowed'],
        }),
      }),
    );
    const { wrapper } = await mountApp('/');
    await submitQuick(wrapper);
    expect(wrapper.get('[data-testid="quick-submit"] [role="alert"]').text()).toBe(
      'Ngôn ngữ này không được dùng cho bài aplusb.',
    );
  });

  it('names a source the server finds too long', async () => {
    mockApi(
      signedInRoutes({
        'POST /problems/aplusb/submit': fail(400, 'validation_failed', { source: ['too long'] }),
      }),
    );
    const { wrapper } = await mountApp('/');
    await submitQuick(wrapper);
    expect(wrapper.get('[data-testid="quick-submit"] [role="alert"]').text()).toBe(
      'Mã nguồn vượt quá 65536 ký tự.',
    );
  });

  it('refuses a source over 65536 code points without calling the server', async () => {
    const calls = mockApi(signedInRoutes());
    const { wrapper } = await mountApp('/');
    await submitQuick(wrapper, 'aplusb', '😀'.repeat(65_537));
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
    expect(wrapper.get('[data-testid="quick-submit"] [role="alert"]').text()).toBe(
      'Mã nguồn vượt quá 65536 ký tự.',
    );
  });

  it('allows exactly 65536 code points', async () => {
    const calls = mockApi(
      signedInRoutes({
        'POST /problems/aplusb/submit': ok({ id: 'sub-9' }),
        'GET /submissions/sub-9': ok(submissionItem()),
      }),
    );
    const { wrapper } = await mountApp('/');
    await submitQuick(wrapper, 'aplusb', '😀'.repeat(65_536));
    expect(calls.filter((call) => call.method === 'POST')).toHaveLength(1);
  });

  it('posts once when the form is submitted twice in a row', async () => {
    const calls = mockApi(
      signedInRoutes({
        'POST /problems/aplusb/submit': ok({ id: 'sub-9' }),
        'GET /submissions/sub-9': ok(submissionItem()),
      }),
    );
    const { wrapper } = await mountApp('/');
    await wrapper.get('#quick-submit-code').setValue('aplusb');
    await wrapper.get('#quick-submit-source').setValue('x');
    const form = wrapper.get('[data-testid="quick-submit"] form');
    await form.trigger('submit');
    await form.trigger('submit');
    await flushPromises();
    expect(calls.filter((call) => call.method === 'POST')).toHaveLength(1);
  });

  it('clears the previous status when a resubmit fails', async () => {
    let attempt = 0;
    mockApi(
      signedInRoutes({
        'POST /problems/aplusb/submit': () =>
          attempt++ ? fail(429, 'rate_limited') : ok({ id: 'sub-9' }),
        'GET /submissions/sub-9': ok(submissionItem({ id: 'sub-9', status: 'D', result: 'AC' })),
      }),
    );
    const { wrapper } = await mountApp('/');
    await submitQuick(wrapper);
    latestEventSource().emit('done', { submissionId: 'sub-9', type: 'done', status: 'D' });
    await flushPromises();
    expect(wrapper.get('[data-testid="quick-submit"] [role="status"]').text()).toContain(
      'Chấp nhận',
    );
    await submitQuick(wrapper);
    expect(wrapper.get('[data-testid="quick-submit"] [role="status"]').text()).not.toContain(
      'Chấp nhận',
    );
    expect(wrapper.get('[data-testid="quick-submit"] [role="alert"]').text()).toBe(
      'Bạn thao tác quá nhanh. Hãy thử lại sau.',
    );
  });

  it('offers a retry when the language list fails to load', async () => {
    mockApi(signedInRoutes({ 'GET /problems/meta': fail(500, 'internal') }));
    const { wrapper } = await mountApp('/');
    await flushPromises();
    const alert = wrapper.get('[data-testid="quick-submit"] [role="alert"]');
    expect(alert.find('button').text()).toBe('Thử lại');
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

  it('shows anonymous viewers the public cards only', async () => {
    mockApi({ ...publicRoutes, 'GET /auth/me': signedOut });
    const { wrapper } = await mountApp('/');
    expect(wrapper.get('h1').text()).toBe('Luyện thuật toán, thi đấu trực tuyến');
    expect(wrapper.find('[data-testid="rating-hero"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="quick-submit"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="live-contest"]').exists()).toBe(true);
  });
});
