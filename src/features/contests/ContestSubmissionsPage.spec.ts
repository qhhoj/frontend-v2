import { nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  contestDetail,
  contestProblem,
  contestViewer,
  sessionUser,
  submissionItem,
} from '@/test/fixtures';
import { contestPageRoutes } from '@/test/contest-routes';
import { mockApi, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer, signedInViewer, submissionListRoutes } from '@/test/problem-routes';

const RUNNING = Date.parse('2026-10-08T09:00:00Z');
const open = contestDetail({ phase: 'ended', frozenLastMinutes: 0, problems: [contestProblem(0)] });
const listCalls = (calls: ReturnType<typeof mockApi>) =>
  calls.filter((call) => call.path === '/contests/r42/submissions');

describe('contest submissions tab', () => {
  afterEach(() => vi.useRealTimers());

  it('asks the contest list with the URL filters, the status groups included', async () => {
    const calls = mockApi({
      ...anonymousViewer,
      ...contestPageRoutes(open),
      'GET /contests/r42/submissions': page([submissionItem()]),
      ...submissionListRoutes,
    });
    await mountApp('/contests/r42/submissions?result=WA&waiting=grading&waiting=final');
    const query = listCalls(calls)[0]!.query;
    expect(query.getAll('result')).toEqual(['WA']);
    expect(query.getAll('status')).toEqual(['QU', 'P', 'G', 'PD']);
    expect(query.get('user')).toBeNull();
  });

  it('says a signed-in contestant only sees their own rows during the contest, and asks only for those', async () => {
    vi.useFakeTimers({ now: RUNNING, toFake: ['Date'] });
    const calls = mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(contestDetail()),
      'GET /contests/r42/submissions': page([]),
      ...submissionListRoutes,
    });
    const { wrapper } = await mountApp('/contests/r42/submissions?user=other');
    expect(wrapper.get('[data-testid="own-only"]').text()).toContain('chỉ bạn thấy');
    expect(listCalls(calls)[0]!.query.get('user')).toBe(sessionUser().username);
    await wrapper.get('[data-testid="advanced-filters"]').trigger('click');
    expect(wrapper.find('#submission-advanced-filters').exists()).toBe(true);
    expect(wrapper.find('input[placeholder="tên đăng nhập"]').exists()).toBe(false);
  });

  it('asks a visitor to sign in instead of sending a request the backend refuses', async () => {
    vi.useFakeTimers({ now: RUNNING, toFake: ['Date'] });
    const calls = mockApi({
      ...anonymousViewer,
      ...contestPageRoutes(contestDetail()),
      ...submissionListRoutes,
    });
    const { wrapper } = await mountApp('/contests/r42/submissions');
    expect(listCalls(calls)).toHaveLength(0);
    expect(wrapper.get('[data-testid="own-only"] a').attributes('href')).toBe(
      '/login?redirect=/contests/r42/submissions',
    );
  });
  it('shows no all-users rows while the own-only list replaces a public one', async () => {
    vi.useFakeTimers({
      now: Date.parse('2026-10-08T10:00:00Z'),
      toFake: ['Date', 'setInterval', 'clearInterval'],
    });
    const everyone = submissionItem({
      id: 'sub-everyone',
      user: { id: 'u-2', username: 'other_user', rating: null },
    });
    const mine = submissionItem({ id: 'sub-mine' });
    mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(contestDetail({ showSubmissionList: true })),
      'GET /contests/r42/submissions': (call) => page(call.query.get('user') ? [mine] : [everyone]),
      ...submissionListRoutes,
    });
    const { wrapper } = await mountApp('/contests/r42/submissions');
    expect(wrapper.find('[data-id="sub-everyone"]').exists()).toBe(true);
    vi.setSystemTime(Date.parse('2026-10-08T10:30:00Z'));
    vi.advanceTimersByTime(30_000);
    await nextTick();
    expect(wrapper.find('[data-id="sub-everyone"]').exists()).toBe(false);
  });

  it('shows the full list to an editor without the banner', async () => {
    vi.useFakeTimers({ now: RUNNING, toFake: ['Date'] });
    mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(contestDetail({ viewer: contestViewer({ canEdit: true }) })),
      'GET /contests/r42/submissions': page([submissionItem()]),
      ...submissionListRoutes,
    });
    const { wrapper } = await mountApp('/contests/r42/submissions');
    expect(wrapper.find('[data-testid="own-only"]').exists()).toBe(false);
  });

  it('lists the site rows with the contest letter and contest score, without the site-wide stats', async () => {
    vi.useFakeTimers({ now: RUNNING, toFake: ['Date'] });
    const twoProblems = contestDetail({ problems: [contestProblem(0), contestProblem(1)] });
    const row = submissionItem({
      id: 'sub-b',
      problem: { code: 'r42b', name: 'Bài B', isDeleted: false, points: 100 },
      result: 'WA',
      points: 65,
      contest: { key: 'r42', name: 'r42', minute: 30, points: 0 },
    });
    const calls = mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(twoProblems),
      'GET /contests/r42/submissions': page([row]),
      ...submissionListRoutes,
    });
    const { wrapper } = await mountApp('/contests/r42/submissions');
    expect(calls.some((call) => call.path === '/submissions/stats')).toBe(false);
    const card = wrapper.get('[data-testid="submission-card-list"] [data-id="sub-b"]');
    expect(card.text()).toContain('B');
    expect(card.text()).toContain('WA');
    expect(card.get('[role="img"]').attributes('aria-label')).toBe('Điểm 0%');
  });

  it.each([
    ['the first problem', '/contests/r42/submissions', 'Mở đề bài A', '/problems/r42a'],
    [
      'the filtered problem',
      '/contests/r42/submissions?problem=r42b',
      'Mở đề bài B',
      '/problems/r42b',
    ],
  ])('offers %s from an empty list (M-20)', async (_case, path, label, href) => {
    vi.useFakeTimers({ now: RUNNING, toFake: ['Date'] });
    mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(contestDetail({ problems: [contestProblem(0), contestProblem(1)] })),
      'GET /contests/r42/submissions': page([]),
      ...submissionListRoutes,
    });
    const { wrapper } = await mountApp(path);
    const link = await vi.waitFor(() => {
      const found = wrapper.findAll('a').find((anchor) => anchor.text() === label);
      expect(found).toBeDefined();
      return found!;
    });
    expect(link.attributes('href')).toBe(href);
  });

  it('keeps the live switch and opens the filters on the problem of a problem link', async () => {
    vi.useFakeTimers({ now: RUNNING, toFake: ['Date'] });
    const twoProblems = contestDetail({ problems: [contestProblem(0), contestProblem(1)] });
    const calls = mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(twoProblems),
      'GET /contests/r42/submissions': page([]),
      ...submissionListRoutes,
    });
    const { wrapper } = await mountApp('/contests/r42/submissions?problem=r42b&live=0');
    expect(wrapper.get('[data-testid="live-toggle"]').attributes('aria-pressed')).toBe('false');
    expect(wrapper.find('#submission-advanced-filters').exists()).toBe(true);
    expect(listCalls(calls)[0]!.query.get('problem')).toBe('r42b');
  });
});
