import { nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  contestDetail,
  contestProblem,
  contestViewer,
  problemMeta,
  sessionUser,
  submissionItem,
} from '@/test/fixtures';
import { contestPageRoutes } from '@/test/contest-routes';
import { mockApi, ok, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer, signedInViewer } from '@/test/problem-routes';

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
      'GET /problems/meta': ok(problemMeta()),
    });
    await mountApp('/contests/r42/submissions?result=WA&waiting=grading&waiting=final');
    const query = listCalls(calls)[0]!.query;
    expect(query.getAll('result')).toEqual(['WA']);
    expect(query.getAll('status')).toEqual(['QU', 'P', 'G', 'PD']);
    expect(query.get('user')).toBeNull();
  });

  it('labels rows with the contest letter and offers no live toggle', async () => {
    mockApi({
      ...anonymousViewer,
      ...contestPageRoutes(open),
      'GET /contests/r42/submissions': page([
        submissionItem({ problem: { code: 'r42a', name: 'Dãy số đẹp' } }),
      ]),
      'GET /problems/meta': ok(problemMeta()),
    });
    const { wrapper } = await mountApp('/contests/r42/submissions');
    expect(wrapper.get('tbody tr').text()).toMatch(/A\s*Dãy số đẹp/);
    expect(wrapper.text()).not.toContain('Cập nhật trực tiếp');
    expect(wrapper.text()).toContain('Đang chờ / đang chấm');
  });

  it('says a signed-in contestant only sees their own rows during the contest, and asks only for those', async () => {
    vi.useFakeTimers({ now: RUNNING, toFake: ['Date'] });
    const calls = mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(contestDetail()),
      'GET /contests/r42/submissions': page([]),
      'GET /problems/meta': ok(problemMeta()),
    });
    const { wrapper } = await mountApp('/contests/r42/submissions');
    expect(wrapper.get('[data-testid="own-only"]').text()).toContain('Chỉ hiện bài nộp của bạn');
    expect(listCalls(calls)[0]!.query.get('user')).toBe(sessionUser().username);
    expect(wrapper.find('input[placeholder="tên đăng nhập"]').exists()).toBe(false);
  });

  it('asks a visitor to sign in instead of sending a request the backend refuses', async () => {
    vi.useFakeTimers({ now: RUNNING, toFake: ['Date'] });
    const calls = mockApi({
      ...anonymousViewer,
      ...contestPageRoutes(contestDetail()),
      'GET /problems/meta': ok(problemMeta()),
    });
    const { wrapper } = await mountApp('/contests/r42/submissions');
    expect(listCalls(calls)).toHaveLength(0);
    expect(wrapper.get('[data-testid="own-only"] a').attributes('href')).toBe(
      '/login?redirect=/contests/r42/submissions',
    );
  });

  it('shows the four-column table in the own-only state and the full table otherwise', async () => {
    vi.useFakeTimers({ now: RUNNING, toFake: ['Date'] });
    mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(contestDetail()),
      'GET /contests/r42/submissions': page([submissionItem()]),
      'GET /problems/meta': ok(problemMeta()),
    });
    const { wrapper } = await mountApp('/contests/r42/submissions');
    expect(wrapper.findAll('thead th').map((header) => header.text())).toEqual([
      'Kết quả',
      'Bài',
      'Điểm',
      'Lúc',
    ]);
    expect(wrapper.findAll('tbody tr td')).toHaveLength(4);
  });
  it('keeps all eight columns once the list is public', async () => {
    mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(open),
      'GET /contests/r42/submissions': page([submissionItem()]),
      'GET /problems/meta': ok(problemMeta()),
    });
    const { wrapper } = await mountApp('/contests/r42/submissions');
    expect(wrapper.findAll('thead th')).toHaveLength(8);
    expect(wrapper.findAll('tbody tr td')).toHaveLength(8);
  });

  it('ignores a ?user= filter in the own-only state: the list still asks only for the viewer', async () => {
    vi.useFakeTimers({ now: RUNNING, toFake: ['Date'] });
    const calls = mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(contestDetail()),
      'GET /contests/r42/submissions': page([]),
      'GET /problems/meta': ok(problemMeta()),
    });
    await mountApp('/contests/r42/submissions?user=other');
    expect(listCalls(calls)[0]!.query.get('user')).toBe(sessionUser().username);
  });

  it('drops the 900 px table minimum in the four-column state only', async () => {
    vi.useFakeTimers({ now: RUNNING, toFake: ['Date'] });
    mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(contestDetail()),
      'GET /contests/r42/submissions': page([submissionItem()]),
      'GET /problems/meta': ok(problemMeta()),
    });
    const { wrapper } = await mountApp('/contests/r42/submissions');
    expect(wrapper.get('table').classes()).not.toContain('min-w-[900px]');
  });

  it('shows no all-users rows while the own-only list replaces a public one', async () => {
    vi.useFakeTimers({
      now: Date.parse('2026-10-08T10:00:00Z'),
      toFake: ['Date', 'setInterval', 'clearInterval'],
    });
    const everyone = submissionItem({
      id: 'sub-everyone',
      user: { id: 'u-2', username: 'other_user' },
    });
    const mine = submissionItem({ id: 'sub-mine' });
    mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(contestDetail({ showSubmissionList: true })),
      'GET /contests/r42/submissions': (call) => page(call.query.get('user') ? [mine] : [everyone]),
      'GET /problems/meta': ok(problemMeta()),
    });
    const { wrapper } = await mountApp('/contests/r42/submissions');
    expect(wrapper.find('tr[data-id="sub-everyone"]').exists()).toBe(true);
    vi.setSystemTime(Date.parse('2026-10-08T10:30:00Z'));
    vi.advanceTimersByTime(30_000);
    await nextTick();
    expect(wrapper.find('tr[data-id="sub-everyone"]').exists()).toBe(false);
  });

  it('shows the full list to an editor without the banner', async () => {
    vi.useFakeTimers({ now: RUNNING, toFake: ['Date'] });
    mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(contestDetail({ viewer: contestViewer({ canEdit: true }) })),
      'GET /contests/r42/submissions': page([submissionItem()]),
      'GET /problems/meta': ok(problemMeta()),
    });
    const { wrapper } = await mountApp('/contests/r42/submissions');
    expect(wrapper.find('[data-testid="own-only"]').exists()).toBe(false);
  });
});
