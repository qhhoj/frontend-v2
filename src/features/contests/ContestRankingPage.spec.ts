import { flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  contestDetail,
  participationSummary,
  ranking,
  rankingRow,
  RANKING_PROBLEM_IDS,
  signedOut,
} from '@/test/fixtures';
import { contestPageRoutes } from '@/test/contest-routes';
import { fail, mockApi, ok } from '@/test/mock-api';
import type { MockHandler } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { signedInViewer } from '@/test/problem-routes';
import { endedContest, r41Ranking, VIRTUAL_PARTICIPATION_ID } from '@/test/replay-fixtures';
import { replayRoute } from '@/test/replay-routes';

const routes = (overrides: Record<string, MockHandler> = {}): Record<string, MockHandler> => ({
  'GET /auth/me': signedOut,
  ...contestPageRoutes(),
  'GET /contests/r42/ranking': ok(ranking()),
  'GET /contests/current': ok(null),
  ...overrides,
});
const rowOf = (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper'], username: string) =>
  wrapper.findAll('tbody tr').find((row) => row.text().includes(username))!;
const cellTexts = (row: ReturnType<typeof rowOf>) =>
  row.findAll('td span[aria-hidden="true"]').map((cell) => cell.text());

describe('contest ranking', () => {
  afterEach(() => vi.useRealTimers());

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
    expect(cellTexts(row)).toEqual(['+10:09', '?2']);
    expect(
      row
        .findAll('td')
        .slice(0, 3)
        .map((cell) => cell.text()),
    ).toEqual(['1', '1', '0:59']);
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

  it('groups tied ranks into one podium cell and keeps rank order', async () => {
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
    // One cell per rank in rank order: the tie at 1 shares a cell, and no rank 2 cell is invented.
    const cells = podium.findAll('[data-podium-rank]');
    expect(cells.map((cell) => cell.findAll('a').map((link) => link.text()))).toEqual([
      ['user_07', 'user_12'],
      ['user_03'],
    ]);
    expect(cells.map((cell) => cell.find('span[aria-hidden="true"]').text())).toEqual(['1', '3']);
  });
  describe("the viewer's row", () => {
    const signedIn = () => routes({ ...signedInViewer() });
    const myRowButton = (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper']) =>
      wrapper.get('[data-testid="my-row"]');

    it('names the live rank and focuses the row, clearing a search that hides it', async () => {
      mockApi(signedIn());
      const { wrapper } = await mountApp('/contests/r42/ranking');
      expect(myRowButton(wrapper).text()).toBe('Về hàng của tôi · #4');
      await wrapper.get('input[type="search"]').setValue('user_07');
      await myRowButton(wrapper).trigger('click');
      await flushPromises();
      expect((wrapper.get('input[type="search"]').element as HTMLInputElement).value).toBe('');
      expect(document.activeElement?.closest('tr')?.dataset.rowId).toBe('part-01');
    });

    it('is not offered to a signed-out viewer', async () => {
      mockApi(routes());
      const { wrapper } = await mountApp('/contests/r42/ranking');
      expect(wrapper.find('[data-testid="my-row"]').exists()).toBe(false);
    });
  });

  describe('during a virtual run of an ended contest', () => {
    const currentRun = ok({
      contest: {
        key: 'r41',
        name: 'QHH Round #41',
        startTime: '2026-10-01T08:00:00Z',
        endTime: '2026-10-01T11:00:00Z',
      },
      participation: participationSummary({
        id: VIRTUAL_PARTICIPATION_ID,
        virtual: 1,
        realStart: '2026-10-09T10:00:00Z',
        endTime: '2026-10-09T13:00:00Z',
      }),
    });
    const virtualRoutes = (run: MockHandler = currentRun) => ({
      ...signedInViewer(),
      ...contestPageRoutes(endedContest()),
      ...replayRoute('r41'),
      'GET /contests/r41/ranking': ok(r41Ranking()),
      'GET /contests/current': run,
    });
    const lastVirtualFlag = (calls: Array<{ path: string; query: URLSearchParams }>) =>
      calls
        .filter((call) => call.path === '/contests/r41/ranking')
        .at(-1)!
        .query.get('virtual');

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
      vi.setSystemTime(new Date('2026-10-09T10:25:00Z'));
    });

    it('opens on the board with virtual rows, marks the virtual row and aims the jump at it', async () => {
      const calls = mockApi(virtualRoutes());
      const { wrapper } = await mountApp('/contests/r41/ranking');
      expect(lastVirtualFlag(calls)).toBe('true');
      const pressed = wrapper.findAll('[role="group"] button[aria-pressed="true"]');
      expect(pressed.map((button) => button.text())).toEqual(['Gồm thi ảo']);
      const virtualRow = wrapper.get(`tr[data-row-id="${VIRTUAL_PARTICIPATION_ID}"]`);
      expect(virtualRow.text()).toContain('ảo');
      expect(wrapper.get('[data-testid="my-row"]').text()).toBe('Về hàng của tôi · #2');
    });

    it('keeps the official board when asked for it, and offers the comparison as a third mode', async () => {
      const calls = mockApi(virtualRoutes());
      const { wrapper, router } = await mountApp('/contests/r41/ranking?virtual=0');
      expect(lastVirtualFlag(calls)).toBe('false');
      const modes = wrapper.findAll('[role="group"] button');
      expect(modes.map((button) => button.text())).toEqual([
        'Chính thức',
        'Gồm thi ảo',
        'So với bảng thật',
      ]);
      await modes[2]!.trigger('click');
      await flushPromises();
      expect(router.currentRoute.value.query).toMatchObject({ virtual: '1', compare: '1' });
      expect(wrapper.find('[data-testid="virtual-overlay"]').exists()).toBe(true);
    });

    it('opens on the official board once no virtual run is live', async () => {
      const calls = mockApi(virtualRoutes(ok(null)));
      await mountApp('/contests/r41/ranking');
      expect(lastVirtualFlag(calls)).toBe('false');
    });
  });
});
