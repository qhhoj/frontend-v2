import { flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RULES_HTML, RULES_MARKDOWN } from '@/test/contest-extras-fixtures';
import {
  contestDetail,
  contestProblem,
  contestViewer,
  participationSummary,
  viewerResult,
} from '@/test/fixtures';
import { contestPageRoutes } from '@/test/contest-routes';
import { fail, mockApi, ok, sequence } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer, signedInViewer } from '@/test/problem-routes';

/** 08:00Z to 11:24:37Z, frozen for the last 60 minutes (from 10:24:37Z). */
const running = contestDetail();
const RUNNING_NOW = Date.parse('2026-10-08T09:37:07Z');
const BEFORE_START = Date.parse('2026-10-08T07:59:58Z');
const UPCOMING = contestDetail({ phase: 'upcoming' });

describe('contest detail header', () => {
  beforeEach(() => vi.stubEnv('TZ', 'UTC'));
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('hatches the frozen stretch from the freeze point to the bar end', async () => {
    vi.useFakeTimers({ now: RUNNING_NOW, toFake: ['Date'] });
    /** 08:00 to 12:00 frozen for 60 minutes: the freeze sits at 75% of the bar. */
    const frozenLastHour = contestDetail({
      endTime: '2026-10-08T12:00:00Z',
      frozenLastMinutes: 60,
    });
    mockApi({ ...anonymousViewer, ...contestPageRoutes(frozenLastHour) });
    const { wrapper } = await mountApp('/contests/r42');
    const hatchStyle = wrapper.get('[data-testid="freeze-hatch"]').attributes('style') ?? '';
    expect(hatchStyle).toContain('left: 75%');
    expect(hatchStyle).toContain('width: 25%');
  });

  it("shows the viewer's rating change once the contest's ratings are applied", async () => {
    vi.useFakeTimers({ now: RUNNING_NOW, toFake: ['Date'] });
    const chipOf = async (ratingChange: { rating: number; delta: number | null } | null) => {
      const contest = contestDetail({ viewer: contestViewer({ ratingChange }) });
      mockApi({ ...signedInViewer(), ...contestPageRoutes(contest) });
      const { wrapper } = await mountApp('/contests/r42');
      return wrapper.find('[data-testid="viewer-rating-change"]');
    };
    expect((await chipOf({ rating: 1843, delta: 42 })).text()).toBe('Rating của bạn +42 → 1843');
    expect((await chipOf({ rating: 1189, delta: -7 })).text()).toBe('Rating của bạn -7 → 1189');
    expect((await chipOf({ rating: 1500, delta: null })).text()).toBe('Rating đầu tiên: 1500');
    expect((await chipOf(null)).exists()).toBe(false);
  });

  it('counts to the start of an upcoming contest and says the problems come with it', async () => {
    vi.useFakeTimers({ now: Date.parse('2026-10-08T07:17:45Z'), toFake: ['Date'] });
    mockApi({ ...anonymousViewer, ...contestPageRoutes(UPCOMING) });
    const { wrapper } = await mountApp('/contests/r42');
    const header = wrapper.get('[data-testid="contest-header"]');
    expect(header.text()).toContain('Kỳ thi chưa bắt đầu');
    expect(header.get('[role="timer"]').text()).toBe('00:42:15');
    expect(header.text()).toContain('Bắt đầu lúc 08:00');
  });

  it('refetches once when the countdown elapses, and follows the new phase', async () => {
    vi.useFakeTimers({ now: BEFORE_START, toFake: ['Date', 'setInterval', 'clearInterval'] });
    const calls = mockApi({
      ...anonymousViewer,
      ...contestPageRoutes(running),
      'GET /contests/r42': sequence(ok(UPCOMING), ok(running)),
    });
    const { wrapper } = await mountApp('/contests/r42');
    vi.advanceTimersByTime(3000);
    await flushPromises();
    expect(calls.filter((call) => call.path === '/contests/r42')).toHaveLength(2);
    expect(wrapper.get('[data-testid="contest-header"]').text()).toContain('Đang diễn ra');
    expect(wrapper.get('[role="timer"]').text()).toMatch(/^03:24:3\d$/);
  });

  it('asks once more after 1.5 s when the server still reports the old phase', async () => {
    vi.useFakeTimers({
      now: BEFORE_START,
      toFake: ['Date', 'setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'],
    });
    const calls = mockApi({
      ...anonymousViewer,
      ...contestPageRoutes(running),
      'GET /contests/r42': sequence(ok(UPCOMING), ok(UPCOMING), ok(running)),
    });
    await mountApp('/contests/r42');
    const detailCalls = () => calls.filter((call) => call.path === '/contests/r42').length;
    vi.advanceTimersByTime(3000);
    await flushPromises();
    expect(detailCalls()).toBe(2);
    vi.advanceTimersByTime(1500);
    await flushPromises();
    expect(detailCalls()).toBe(3);
    vi.advanceTimersByTime(60_000);
    await flushPromises();
    expect(detailCalls()).toBe(3);
  });

  it('shows a missing contest with the crying Bit and a way back to the list, without a retry', async () => {
    mockApi({ ...anonymousViewer, 'GET /contests/nope': fail(404, 'not_found') });
    const { wrapper } = await mountApp('/contests/nope');
    const missing = wrapper.get('[data-testid="contest-not-found"]');
    expect(missing.get('h1').text()).toBe('Không tìm thấy kỳ thi');
    expect(missing.find('[data-testid="crying-bit"]').exists()).toBe(true);
    expect(missing.find('a[href="/contests"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="contest-header"]').exists()).toBe(false);
  });
});

describe('contest detail problems and rules', () => {
  it.each([
    ['upcoming', 'Đề bài sẽ hiện khi kỳ thi bắt đầu và bạn vào thi.'],
    ['running', 'Đề bài sẽ hiện ngay khi bạn vào thi.'],
    ['ended', 'Đề bài chưa được công khai.'],
  ] as const)(
    'says when the problems show for a %s contest, instead of an empty table',
    async (phase, message) => {
      mockApi({
        ...anonymousViewer,
        ...contestPageRoutes(contestDetail({ phase, problems: null })),
      });
      const { wrapper } = await mountApp('/contests/r42');
      expect(wrapper.find('[data-testid="contest-problems"] table').exists()).toBe(false);
      expect(wrapper.get('[data-testid="contest-problems"]').text()).toContain(message);
    },
  );
});

describe('contest problems with the viewer’s results (backend 4c)', () => {
  const graded = contestDetail({
    phase: 'ended',
    problems: [
      contestProblem(0, {
        solverCount: 188,
        viewerResult: viewerResult({
          cell: { time: 1450, points: 100, tries: 1 },
          isSolved: true,
          attempts: 1,
        }),
      }),
      contestProblem(1, {
        solverCount: 143,
        viewerResult: viewerResult({ cell: { time: null, points: 0, tries: 3 }, attempts: 3 }),
      }),
      contestProblem(2, { solverCount: 6, viewerResult: viewerResult() }),
    ],
  });

  it('crowns the viewer’s solved count once the contest is over', async () => {
    mockApi({ ...signedInViewer(), ...contestPageRoutes(graded) });
    const { wrapper } = await mountApp('/contests/r42');
    const summary = wrapper.get('[data-testid="solved-summary"]');
    expect(summary.text()).toBe('Bạn đã giải 1/3 bài');
    expect(summary.find('[aria-hidden="true"]').exists()).toBe(true);
  });

  it('does not crown a solved count while the contest still runs', async () => {
    const solvedWhileRunning = contestDetail({
      phase: 'running',
      problems: [
        contestProblem(0, { viewerResult: viewerResult({ isSolved: true, attempts: 1 }) }),
      ],
    });
    mockApi({ ...signedInViewer(), ...contestPageRoutes(solvedWhileRunning) });
    const { wrapper } = await mountApp('/contests/r42');
    expect(wrapper.find('[data-testid="solved-summary"]').exists()).toBe(false);
  });

  it('shows no own-result column when the backend sends no results (hidden board or no participation)', async () => {
    const noResults = contestDetail({
      problems: [
        contestProblem(0, { solverCount: null, viewerResult: null }),
        contestProblem(1, { solverCount: null, viewerResult: null }),
      ],
    });
    mockApi({ ...signedInViewer(), ...contestPageRoutes(noResults) });
    const { wrapper } = await mountApp('/contests/r42');
    const table = wrapper.get('[data-testid="contest-problems"]');
    expect(table.findAll('tbody tr')).toHaveLength(2);
    expect(table.text()).not.toContain('Của bạn');
    expect(table.text()).not.toContain('Chưa nộp');
  });

  it('shows the submission cap with the attempts left, or ∞ when uncapped', async () => {
    const mixed = contestDetail({
      problems: [
        contestProblem(0, { maxSubmissions: 3, viewerResult: viewerResult({ attempts: 2 }) }),
        contestProblem(1, { maxSubmissions: null, viewerResult: viewerResult() }),
      ],
    });
    mockApi({ ...signedInViewer(), ...contestPageRoutes(mixed) });
    const { wrapper } = await mountApp('/contests/r42');
    const rows = wrapper.findAll('[data-testid="contest-problems"] tbody tr');
    // Cells: name, limits, points, max submissions, own result, open.
    const CAP_CELL = 3;
    expect(rows[0]!.findAll('td')[CAP_CELL]!.text()).toContain('3 (còn 1)');
    expect(rows[1]!.findAll('td')[CAP_CELL]!.text()).toContain('∞');
    expect(rows[1]!.findAll('td')[CAP_CELL]!.text()).toContain('Không giới hạn');
  });
});

describe('contest page rules card', () => {
  const ruled = (overrides: Parameters<typeof contestDetail>[0] = {}) =>
    contestDetail({ rules: RULES_MARKDOWN, rulesHtml: RULES_HTML, rulesRevision: 2, ...overrides });

  it('shows the "Quy định" card in the aside only for a contest with rules', async () => {
    mockApi({ ...anonymousViewer, ...contestPageRoutes(ruled()) });
    const { wrapper } = await mountApp('/contests/r42');
    expect(wrapper.get('aside [data-testid="join-rules-card"]').text()).toContain('bản 2');
    wrapper.unmount();
    mockApi({ ...anonymousViewer, ...contestPageRoutes(contestDetail()) });
    const second = await mountApp('/contests/r42');
    expect(second.wrapper.find('[data-testid="join-rules-card"]').exists()).toBe(false);
  });

  it('says which revision the live participation accepted', async () => {
    const viewer = contestViewer({
      liveStatus: 'participating',
      liveParticipation: participationSummary({
        rulesAcceptedAt: '2026-10-08T05:58:00.000Z',
        rulesAcceptedRevision: 1,
      }),
    });
    mockApi({ ...signedInViewer(), ...contestPageRoutes(ruled({ viewer })) });
    const { wrapper } = await mountApp('/contests/r42');
    expect(wrapper.get('[data-testid="join-rules-card"]').text()).toContain('Đã đồng ý bản 1 lúc');
  });
});
