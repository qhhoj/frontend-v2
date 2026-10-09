import { flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { participationSummary } from '@/test/fixtures';
import { contestPageRoutes } from '@/test/contest-routes';
import { fail, mockApi, ok } from '@/test/mock-api';
import type { MockHandler } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { signedInViewer } from '@/test/problem-routes';
import { endedContest, r41Ranking, VIRTUAL_PARTICIPATION_ID } from '@/test/replay-fixtures';
import { replayRoute } from '@/test/replay-routes';

type Wrapper = Awaited<ReturnType<typeof mountApp>>['wrapper'];
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
const routes = (overrides: Record<string, MockHandler> = {}) => ({
  ...signedInViewer(),
  ...contestPageRoutes(endedContest()),
  ...replayRoute('r41'),
  'GET /contests/r41/ranking': ok(r41Ranking()),
  'GET /contests/current': currentRun,
  ...overrides,
});
const panelRows = (wrapper: Wrapper, index: number) =>
  wrapper
    .findAll('[data-overlay-part="panels"] tbody')
    [index]!.findAll('tr')
    .map((row) => [row.find('td').text(), row.attributes('data-row-id')]);
const toggle = (wrapper: Wrapper) =>
  wrapper.findAll('button').find((button) => button.text() === 'So với bảng thật');

describe('virtual overlay on the ranking page', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    vi.setSystemTime(new Date('2026-10-09T10:25:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('merges the live virtual row into the replay at the elapsed time, real rows left, yours and ghosts right', async () => {
    mockApi(routes());
    const { wrapper } = await mountApp('/contests/r41/ranking?compare=1');
    expect(wrapper.get('[data-overlay-part="summary"]').text()).toBe(
      'Bạn xếp thứ 4 · bảng thật xếp thứ 3',
    );
    expect(
      wrapper.get('[data-overlay-part="summary"] [data-bit-kind]').attributes('data-bit-kind'),
    ).toBe('rankUp');
    expect(panelRows(wrapper, 0)).toEqual([
      ['2', 'part-07'],
      ['3', 'part-01'],
      ['5', 'part-12'],
      ['6', 'part-03'],
    ]);
    expect(panelRows(wrapper, 1)).toEqual([
      ['1', 'ghost-0'],
      ['4', VIRTUAL_PARTICIPATION_ID],
      ['—', 'ghost-1'],
    ]);
    expect(wrapper.text()).toContain('Bảng thật · 00:25:00');
    expect(wrapper.text()).toContain('Lượt ảo của bạn · 00:25:00');
  });

  it('follows the clock: a minute later the elapsed time moves on', async () => {
    mockApi(routes());
    const { wrapper } = await mountApp('/contests/r41/ranking?compare=1');
    vi.advanceTimersByTime(60_000);
    await flushPromises();
    expect(wrapper.text()).toContain('Bảng thật · 00:26:00');
  });

  it('toggles with the button, keeps the choice in the link, and is pressed while on', async () => {
    mockApi(routes());
    const { wrapper, router } = await mountApp('/contests/r41/ranking');
    expect(toggle(wrapper)!.attributes('aria-pressed')).toBe('false');
    expect(wrapper.find('[data-testid="virtual-overlay"]').exists()).toBe(false);
    await toggle(wrapper)!.trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.query.compare).toBe('1');
    expect(toggle(wrapper)!.attributes('aria-pressed')).toBe('true');
    expect(wrapper.find('[data-testid="virtual-overlay"]').exists()).toBe(true);
  });

  it('offers no toggle without a current virtual run of this contest', async () => {
    mockApi(routes({ 'GET /contests/current': ok(null) }));
    const { wrapper } = await mountApp('/contests/r41/ranking?compare=1');
    expect(toggle(wrapper)).toBeUndefined();
    expect(wrapper.find('[data-testid="virtual-overlay"]').exists()).toBe(false);
    expect(wrapper.findAll('tbody tr').length).toBeGreaterThan(0);
  });

  it('shows the frozen state instead of a board when the replay is refused', async () => {
    mockApi(
      routes({
        ...contestPageRoutes(endedContest({ frozenLastMinutes: 60 })),
        'GET /contests/r41/replay': fail(403, 'forbidden'),
      }),
    );
    const { wrapper } = await mountApp('/contests/r41/ranking?compare=1');
    expect(wrapper.get('[data-testid="replay-state"]').attributes('data-state')).toBe('frozen');
    expect(wrapper.find('[data-overlay-part="panels"]').exists()).toBe(false);
  });
});
