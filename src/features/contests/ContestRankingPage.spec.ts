import { flushPromises } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  contestDetail,
  profile,
  ranking,
  rankingRow,
  RANKING_PROBLEM_IDS,
  signedIn,
  signedOut,
} from '@/test/fixtures';
import { contestPageRoutes } from '@/test/contest-routes';
import { fail, mockApi, ok } from '@/test/mock-api';
import type { MockHandler } from '@/test/mock-api';
import { mountApp } from '@/test/mount';

const routes = (overrides: Record<string, MockHandler> = {}): Record<string, MockHandler> => ({
  'GET /auth/me': signedOut,
  ...contestPageRoutes(),
  'GET /contests/r42/ranking': ok(ranking()),
  ...overrides,
});
const rowOf = (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper'], username: string) =>
  wrapper.findAll('tbody tr').find((row) => row.text().includes(username))!;
const cellTexts = (row: ReturnType<typeof rowOf>) =>
  row.findAll('td span[aria-hidden="true"]').map((cell) => cell.text());

describe('contest ranking', () => {
  afterEach(() => vi.useRealTimers());

  it('shows the contest, its podium in rank order and the board', async () => {
    mockApi(routes());
    const { wrapper } = await mountApp('/contests/r42/ranking');
    expect(wrapper.get('h1').text()).toBe('QHH Round #42 (Div. 2)');
    expect(wrapper.text()).toContain('ICPC · 3 bài · 318 thí sinh');
    const podium = wrapper.get('section[aria-label="Top 3"]');
    expect(podium.findAll('a').map((link) => link.text())).toEqual([
      'user_07',
      'user_12',
      'user_03',
    ]);
    expect(podium.text()).toContain('2 bài · 41');
    expect(wrapper.findAll('thead th abbr').map((label) => label.text())).toEqual(['A', 'B', 'C']);
  });

  it('renders solved, first-solve, failed and frozen cells with spoken labels', async () => {
    mockApi(routes());
    const { wrapper } = await mountApp('/contests/r42/ranking');
    const leader = rowOf(wrapper, 'user_07');
    expect(cellTexts(leader)).toEqual(['+ 0:09', '+1 0:31', '?2']);
    expect(leader.findAll('td .sr-only').map((label) => label.text())).toEqual([
      'Giải đầu tiên, sau 0 lần sai, lúc 0:09',
      'Giải sau 1 lần sai, lúc 0:31',
      '2 lần nộp chờ công bố',
    ]);
    expect(cellTexts(rowOf(wrapper, 'user_12'))).toContain('−4');
  });

  it('explains the first-solve marker by a swatch and a star, never by a colour name', async () => {
    mockApi(routes());
    const { wrapper } = await mountApp('/contests/r42/ranking');
    const legend = wrapper.get('ul.border-t');
    const firstSolve = legend.findAll('li')[0]!;
    expect(firstSolve.text()).toBe('giải đầu tiên');
    expect(firstSolve.get('[data-testid="first-solve-swatch"]').classes()).toContain(
      'bg-first-solve',
    );
    expect(firstSolve.find('svg').exists()).toBe(true);
    expect(legend.text()).not.toMatch(/hồng|tím|pink|violet|đỏ|vàng/i);
  });

  it('renders frozen cells and the banner', async () => {
    mockApi(routes());
    const { wrapper } = await mountApp('/contests/r42/ranking');
    const banner = wrapper.get('p[role="status"]:not(.sr-only)');
    expect(banner.text()).toContain('Bảng đang đóng băng');
    expect(banner.text()).toContain('60 phút cuối');
  });

  it("marks the viewer's row", async () => {
    mockApi(routes({ 'GET /auth/me': signedIn(), 'GET /profile': ok(profile()) }));
    const { wrapper } = await mountApp('/contests/r42/ranking');
    const own = rowOf(wrapper, 'user_01');
    expect(own.text()).toContain('Bạn');
    expect(own.classes()).toContain('bg-surface-hover');
    expect(rowOf(wrapper, 'user_07').text()).not.toContain('Bạn');
  });

  it('switches to the board with virtual participants through the URL', async () => {
    const calls = mockApi(routes());
    const { wrapper, router } = await mountApp('/contests/r42/ranking');
    const virtualButton = () =>
      wrapper.findAll('[role="group"] button').find((button) => button.text() === 'Gồm thi ảo')!;
    await virtualButton().trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.query.virtual).toBe('1');
    expect(
      calls
        .filter((call) => call.path === '/contests/r42/ranking')
        .at(-1)!
        .query.get('virtual'),
    ).toBe('true');
    expect(virtualButton().attributes('aria-pressed')).toBe('true');
  });

  it('filters rows by name and keeps their ranks', async () => {
    mockApi(routes());
    const { wrapper } = await mountApp('/contests/r42/ranking');
    await wrapper.get('input[type="search"]').setValue('user_1');
    const rows = wrapper.findAll('tbody tr');
    expect(rows).toHaveLength(1);
    expect(rows[0]!.find('td').text()).toBe('2');
  });

  it('shows the empty state', async () => {
    mockApi(routes({ 'GET /contests/r42/ranking': ok(ranking({ rows: [], frozen: false })) }));
    const { wrapper } = await mountApp('/contests/r42/ranking');
    expect(wrapper.text()).toContain('Chưa có thí sinh.');
    expect(wrapper.find('section[aria-label="Top 3"]').exists()).toBe(false);
  });

  it('shows points cells for points formats', async () => {
    const [problemA] = RANKING_PROBLEM_IDS;
    mockApi(
      routes({
        'GET /contests/r42': ok(contestDetail({ formatName: 'ioi' })),
        'GET /contests/r42/ranking': ok(
          ranking({
            frozen: false,
            problems: [
              {
                problemId: problemA,
                code: 'r42a',
                label: 'A',
                points: 100,
                firstSolve: null,
                acceptedCount: 0,
              },
            ],
            rows: [
              rankingRow(1, 'part-07', 'user_07', 50, 600, {
                [problemA]: { points: 50, time: 600 },
              }),
            ],
          }),
        ),
      }),
    );
    const { wrapper } = await mountApp('/contests/r42/ranking');
    expect(wrapper.findAll('thead th').map((cell) => cell.text())).toContain('Điểm');
    expect(cellTexts(rowOf(wrapper, 'user_07'))).toEqual(['50']);
  });

  it('shows points and time in one chip and one "score · time" column on a timed points board', async () => {
    const [problemA] = RANKING_PROBLEM_IDS;
    mockApi(
      routes({
        'GET /contests/r42': ok(contestDetail({ formatName: 'default' })),
        'GET /contests/r42/ranking': ok(
          ranking({
            frozen: false,
            problems: [
              {
                problemId: problemA,
                code: 'r42a',
                label: 'A',
                points: 100,
                firstSolve: 'part-07',
                acceptedCount: 1,
              },
            ],
            rows: [
              rankingRow(1, 'part-07', 'user_07', 100, 492, {
                [problemA]: { points: 100, time: 492 },
              }),
            ],
          }),
        ),
      }),
    );
    const { wrapper } = await mountApp('/contests/r42/ranking');
    const headers = wrapper.findAll('thead th').map((cell) => cell.text());
    expect(headers).toContain('Điểm · giờ');
    expect(headers).not.toContain('Thời gian');
    const row = rowOf(wrapper, 'user_07');
    expect(row.get('[data-testid="cell-time"]').text()).toBe('0:08:12');
    expect(row.text()).toContain('Giải đầu tiên: 100 điểm, lúc 0:08:12');
    expect(wrapper.text()).toContain('Một phần điểm, nền đậm dần theo ba mức');
  });

  it('marks the podium Bit on first place only', async () => {
    const [problemA] = RANKING_PROBLEM_IDS;
    const cell = { [problemA]: { time: 60, points: 1, tries: 1 } };
    mockApi(
      routes({
        'GET /contests/r42/ranking': ok(
          ranking({
            rows: [
              rankingRow(1, 'part-07', 'user_07', 1, 10, cell),
              rankingRow(1, 'part-12', 'user_12', 1, 10, cell),
              rankingRow(3, 'part-03', 'user_03', 1, 20, cell),
            ],
          }),
        ),
      }),
    );
    const { wrapper } = await mountApp('/contests/r42/ranking');
    expect(wrapper.findAll('[data-testid="podium-bit"]')).toHaveLength(2);
  });

  it('refreshes the board every 30 s while the contest runs', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-10-08T10:00:00Z'));
    const calls = mockApi(routes());
    await mountApp('/contests/r42/ranking');
    await vi.advanceTimersByTimeAsync(30_000);
    await flushPromises();
    expect(calls.filter((call) => call.path === '/contests/r42/ranking')).toHaveLength(2);
  });

  it('keeps the board and shows a sweating Bit beside the notice when a refresh fails', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-10-08T10:00:00Z'));
    let answers = 0;
    mockApi(
      routes({
        'GET /contests/r42/ranking': () =>
          answers++ === 0 ? ok(ranking()) : fail(500, 'internal'),
      }),
    );
    const { wrapper } = await mountApp('/contests/r42/ranking');
    expect(wrapper.find('[data-testid="inline-bit"]').exists()).toBe(false);
    await vi.advanceTimersByTimeAsync(30_000);
    await flushPromises();
    const notice = wrapper
      .findAll('[role="status"]')
      .find((status) => status.text().includes('Không cập nhật được bảng'))!;
    expect(notice.text()).toBe('Không cập nhật được bảng, đang thử lại.');
    expect(notice.get('[data-testid="inline-bit"]').attributes('aria-hidden')).toBe('true');
    expect(rowOf(wrapper, 'user_07').exists()).toBe(true);
  });

  it('does not poll an ended contest', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const calls = mockApi(routes({ 'GET /contests/r42': ok(contestDetail({ phase: 'ended' })) }));
    await mountApp('/contests/r42/ranking');
    await vi.advanceTimersByTimeAsync(30_000);
    await flushPromises();
    expect(calls.filter((call) => call.path === '/contests/r42/ranking')).toHaveLength(1);
  });

  it('reads vnoj cells with their own keys and cumulative seconds', async () => {
    const [problemA, problemB] = RANKING_PROBLEM_IDS;
    mockApi(
      routes({
        'GET /contests/r42': ok(contestDetail({ formatName: 'vnoj' })),
        'GET /contests/r42/ranking': ok(
          ranking({
            rows: [
              rankingRow(1, 'part-07', 'user_07', 1, 3_540, {
                [problemA]: { time: 540, points: 1, penalty: 1, pending: 0 },
                [problemB]: { time: 0, points: 0, penalty: 0, pending: 2 },
              }),
            ],
          }),
        ),
      }),
    );
    const { wrapper } = await mountApp('/contests/r42/ranking');
    const row = rowOf(wrapper, 'user_07');
    expect(cellTexts(row)).toEqual(['+1 0:09', '?2']);
    expect(
      row
        .findAll('td')
        .slice(0, 3)
        .map((cell) => cell.text()),
    ).toEqual(['1', '1', '0:59']);
  });

  it('keeps the board on screen while the virtual toggle loads', async () => {
    mockApi(routes());
    const answer = fetch;
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => (release = resolve));
    vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
      input.includes('virtual=true') ? gate.then(() => answer(input, init)) : answer(input, init),
    );
    const { wrapper } = await mountApp('/contests/r42/ranking');
    await wrapper
      .findAll('[role="group"] button')
      .find((button) => button.text() === 'Gồm thi ảo')!
      .trigger('click');
    await flushPromises();
    expect(wrapper.findAll('tbody tr')).toHaveLength(4);
    expect(wrapper.text()).not.toContain('Đang tải');
    expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true);
    release();
    await flushPromises();
    expect(wrapper.find('[aria-busy="true"]').exists()).toBe(false);
    expect(wrapper.findAll('tbody tr')).toHaveLength(4);
  });

  it('scrolls the wide board inside a focusable, named region', async () => {
    mockApi(routes());
    const { wrapper } = await mountApp('/contests/r42/ranking');
    const region = wrapper.get('[role="region"]');
    expect(region.attributes('tabindex')).toBe('0');
    expect(region.attributes('aria-label')).toBe('Vùng cuộn bảng xếp hạng');
    expect(region.find('table').exists()).toBe(true);
  });

  it('does not poll while the tab is hidden', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-10-08T10:00:00Z'));
    const calls = mockApi(routes());
    await mountApp('/contests/r42/ranking');
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(90_000);
    await flushPromises();
    expect(calls.filter((call) => call.path === '/contests/r42/ranking')).toHaveLength(1);
    visibility.mockRestore();
  });

  it('keeps the last board and says so when a poll fails', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-10-08T10:00:00Z'));
    let polls = 0;
    mockApi(
      routes({
        'GET /contests/r42/ranking': () => (polls++ === 0 ? ok(ranking()) : fail(500, 'internal')),
      }),
    );
    const { wrapper } = await mountApp('/contests/r42/ranking');
    await vi.advanceTimersByTimeAsync(30_000);
    await flushPromises();
    expect(wrapper.findAll('tbody tr')).toHaveLength(4);
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('Không cập nhật được bảng');
  });

  it('shows the error when there is no board yet', async () => {
    mockApi(routes({ 'GET /contests/r42/ranking': fail(500, 'internal') }));
    const { wrapper } = await mountApp('/contests/r42/ranking');
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
  });

  it('starts polling when an upcoming contest begins while the page is open', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-10-08T10:00:00Z'));
    const calls = mockApi(
      routes({
        'GET /contests/r42': ok(
          contestDetail({ phase: 'upcoming', startTime: '2026-10-08T10:00:20Z' }),
        ),
      }),
    );
    await mountApp('/contests/r42/ranking');
    await vi.advanceTimersByTimeAsync(10_000);
    expect(calls.filter((call) => call.path === '/contests/r42/ranking')).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(60_000);
    await flushPromises();
    expect(
      calls.filter((call) => call.path === '/contests/r42/ranking').length,
    ).toBeGreaterThanOrEqual(2);
  });

  it('shares medals between tied ranks and keeps a tied first place', async () => {
    const [problemA] = RANKING_PROBLEM_IDS;
    const cell = { [problemA]: { time: 60, points: 1, tries: 1 } };
    mockApi(
      routes({
        'GET /contests/r42/ranking': ok(
          ranking({
            rows: [
              rankingRow(1, 'part-07', 'user_07', 1, 10, cell),
              rankingRow(1, 'part-12', 'user_12', 1, 10, cell),
              rankingRow(3, 'part-03', 'user_03', 1, 20, cell),
              rankingRow(4, 'part-01', 'user_01', 1, 30, cell),
            ],
          }),
        ),
      }),
    );
    const { wrapper } = await mountApp('/contests/r42/ranking');
    const podium = wrapper.get('section[aria-label="Top 3"]');
    expect(podium.findAll('a').map((link) => link.text())).toEqual([
      'user_07',
      'user_12',
      'user_03',
    ]);
    const [first, tiedFirst, third] = podium.findAll('span[aria-hidden="true"]');
    expect(first!.classes()).toEqual(tiedFirst!.classes());
    expect(third!.classes()).not.toEqual(first!.classes());
  });

  it('drops the time column for formats without cumulative time', async () => {
    const [problemA] = RANKING_PROBLEM_IDS;
    mockApi(
      routes({
        'GET /contests/r42': ok(contestDetail({ formatName: 'ioi16' })),
        'GET /contests/r42/ranking': ok(
          ranking({
            frozen: false,
            problems: [
              {
                problemId: problemA,
                code: 'r42a',
                label: 'A',
                points: 100,
                firstSolve: null,
                acceptedCount: 0,
              },
            ],
            rows: [
              rankingRow(1, 'part-07', 'user_07', 50, 0, { [problemA]: { points: 50, time: 0 } }),
            ],
          }),
        ),
      }),
    );
    const { wrapper } = await mountApp('/contests/r42/ranking');
    const headings = wrapper.findAll('thead th').map((cell) => cell.text());
    expect(headings).toContain('Điểm');
    expect(headings).not.toContain('Thời gian');
    expect(rowOf(wrapper, 'user_07').findAll('td')).toHaveLength(3);
  });

  it('prints cell points at the contest precision', async () => {
    const [problemA] = RANKING_PROBLEM_IDS;
    mockApi(
      routes({
        'GET /contests/r42': ok(contestDetail({ formatName: 'ioi', pointsPrecision: 1 })),
        'GET /contests/r42/ranking': ok(
          ranking({
            frozen: false,
            problems: [
              {
                problemId: problemA,
                code: 'r42a',
                label: 'A',
                points: 100,
                firstSolve: null,
                acceptedCount: 0,
              },
            ],
            rows: [
              rankingRow(1, 'part-07', 'user_07', 99.5, 600, {
                [problemA]: { points: 99.5, time: 600 },
              }),
            ],
          }),
        ),
      }),
    );
    const { wrapper } = await mountApp('/contests/r42/ranking');
    expect(cellTexts(rowOf(wrapper, 'user_07'))).toEqual(['99,5']);
    expect(rowOf(wrapper, 'user_07').findAll('td')[1]!.text()).toBe('99,5');
  });

  it('hints that the board scrolls sideways', async () => {
    mockApi(routes());
    const { wrapper } = await mountApp('/contests/r42/ranking');
    expect(wrapper.text()).toContain('Vuốt ngang');
  });

  it('reports an unknown contest', async () => {
    mockApi(
      routes({
        'GET /contests/r42': fail(404, 'not_found'),
        'GET /contests/r42/ranking': fail(404, 'not_found'),
      }),
    );
    const { wrapper } = await mountApp('/contests/r42/ranking');
    expect(wrapper.get('[role="alert"]').text()).toContain('Không tìm thấy.');
  });
});
