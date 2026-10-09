import { flushPromises } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { contestDetail } from '@/test/fixtures';
import { contestPageRoutes } from '@/test/contest-routes';
import { fail, mockApi, ok, sequence } from '@/test/mock-api';
import type { MockHandler } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer, signedInViewer } from '@/test/problem-routes';
import { buildingChunk, endedContest, replayChunk } from '@/test/replay-fixtures';
import { replayPageRoutes } from '@/test/replay-routes';
import { REPLAY_POLL_MS } from './replay.queries';

type Wrapper = Awaited<ReturnType<typeof mountApp>>['wrapper'];
const REPLAY = 'GET /contests/r41/replay';
const rowIds = (wrapper: Wrapper) =>
  wrapper.findAll('tbody tr').map((row) => row.attributes('data-row-id'));
const clock = (wrapper: Wrapper) => wrapper.get('[data-replay-part="player"] p').text();
const panel = (wrapper: Wrapper) => wrapper.find('[data-testid="replay-state"]');
const replayCalls = (calls: { path: string }[]) =>
  calls.filter((call) => call.path.endsWith('/replay')).length;
const buttonNamed = (wrapper: Wrapper, name: string) =>
  wrapper.findAll('button').find((button) => button.text() === name)!;
const routes = (overrides: Record<string, MockHandler> = {}) => ({
  ...anonymousViewer,
  ...replayPageRoutes(),
  ...overrides,
});

describe('contest replay page', () => {
  afterEach(() => vi.useRealTimers());

  it('opens on the shared second with the board, the feed, the dots and the open tab', async () => {
    mockApi(routes());
    const { wrapper } = await mountApp('/contests/r41/replay?t=600');
    expect(wrapper.get('h1').text()).toBe('QHH Round #41');
    expect(wrapper.get('nav[aria-label="Mục kỳ thi"] [aria-current="page"]').text()).toBe(
      'Phát lại',
    );
    expect(clock(wrapper)).toBe('00:10:00 / 03:00:00');
    expect(rowIds(wrapper)).toEqual([
      'ghost-0',
      'part-07',
      'part-12',
      'part-01',
      'part-03',
      'ghost-1',
    ]);
    expect(wrapper.findAll('[data-testid="solve-mark"]')).toHaveLength(2);
    expect(wrapper.get('[data-replay-part="feed"]').findAll('li')).toHaveLength(3);
    expect(wrapper.get('[data-testid="replay-announcement"]').text()).toBe('');
  });

  it('moves the board when scrubbed and writes the second into the link', async () => {
    mockApi(routes());
    const { wrapper, router } = await mountApp('/contests/r41/replay');
    await wrapper.get('input[type="range"]').setValue('1080');
    await flushPromises();
    expect(router.currentRoute.value.query.t).toBe('1080');
    expect(rowIds(wrapper).slice(0, 3)).toEqual(['ghost-0', 'part-07', 'part-01']);
  });

  it('reads an unreadable ?t= as the start and a too-large one as the end, with Bit crowned there', async () => {
    mockApi(routes());
    const start = await mountApp('/contests/r41/replay?t=abc');
    expect(clock(start.wrapper)).toBe('00:00:00 / 03:00:00');
    mockApi(routes());
    const end = await mountApp('/contests/r41/replay?t=999999');
    expect(clock(end.wrapper)).toBe('03:00:00 / 03:00:00');
    expect(end.wrapper.get('[data-testid="replay-announcement"]').text()).toBe('Đã phát đến cuối.');
    expect(end.wrapper.find('[data-testid="inline-bit"]').exists()).toBe(true);
  });

  it('plays at the chosen speed and writes the second when paused', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    mockApi(routes());
    const { wrapper, router } = await mountApp('/contests/r41/replay');
    await buttonNamed(wrapper, 'x60').trigger('click');
    await buttonNamed(wrapper, 'Phát').trigger('click');
    vi.advanceTimersByTime(1000);
    await flushPromises();
    expect(clock(wrapper)).toBe('00:01:00 / 03:00:00');
    await buttonNamed(wrapper, 'Tạm dừng').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.query.t).toBe('60');
  });

  it('takes a signed-in viewer to their own row, and offers nothing to a visitor without one', async () => {
    mockApi({ ...routes(), ...signedInViewer() });
    const { wrapper } = await mountApp('/contests/r41/replay?t=600');
    await buttonNamed(wrapper, 'Về hàng của tôi').trigger('click');
    expect(document.activeElement?.closest('tr')?.getAttribute('data-row-id')).toBe('part-01');
    mockApi(routes());
    const visitor = await mountApp('/contests/r41/replay');
    expect(visitor.wrapper.text()).not.toContain('Về hàng của tôi');
  });

  it('polls a building replay and announces once when it is ready', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    mockApi(
      routes({
        [REPLAY]: sequence({ status: 202, body: { data: buildingChunk() } }, ok(replayChunk())),
      }),
    );
    const { wrapper } = await mountApp('/contests/r41/replay');
    expect(panel(wrapper).attributes('data-state')).toBe('building');
    expect(panel(wrapper).attributes('role')).toBe('status');
    vi.advanceTimersByTime(REPLAY_POLL_MS);
    await flushPromises();
    expect(panel(wrapper).exists()).toBe(false);
    expect(rowIds(wrapper)).toHaveLength(6);
    expect(wrapper.get('[data-testid="replay-announcement"]').text()).toBe(
      'Bản phát lại đã sẵn sàng.',
    );
  });

  it('shows the frozen state for an ended board still frozen, asks once, and draws no board', async () => {
    const calls = mockApi({
      ...anonymousViewer,
      ...replayPageRoutes(endedContest({ frozenLastMinutes: 60 })),
      [REPLAY]: fail(403, 'forbidden'),
    });
    const { wrapper } = await mountApp('/contests/r41/replay');
    expect(panel(wrapper).attributes('data-state')).toBe('frozen');
    expect(wrapper.get('[data-testid="replay-state"] h2').text()).toBe('Bảng đang đóng băng');
    expect(wrapper.find('tbody').exists()).toBe(false);
    expect(replayCalls(calls)).toBe(1);
  });

  it('shows the contest-not-found state, not a retry panel, when the contest is missing', async () => {
    mockApi({ ...anonymousViewer, 'GET /contests/r41': fail(404, 'not_found') });
    const { wrapper } = await mountApp('/contests/r41/replay');
    expect(wrapper.find('[data-testid="contest-not-found"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="replay-state"]').exists()).toBe(false);
  });

  it('never asks for the replay of a final-submission contest or of a running one', async () => {
    const fso = mockApi({
      ...anonymousViewer,
      ...contestPageRoutes(endedContest({ formatName: 'final_submission' })),
    });
    const unsupported = await mountApp('/contests/r41/replay');
    expect(panel(unsupported.wrapper).attributes('data-state')).toBe('unsupported');
    expect(replayCalls(fso)).toBe(0);
    const running = mockApi({ ...anonymousViewer, ...contestPageRoutes(contestDetail()) });
    const live = await mountApp('/contests/r42/replay');
    expect(panel(live.wrapper).attributes('data-state')).toBe('notEnded');
    expect(replayCalls(running)).toBe(0);
  });

  it.each([
    ['empty', ok(replayChunk({ participants: [], ghosts: [], events: [] }))],
    ['notReady', fail(404, 'replay_not_ready')],
    ['error', fail(409, 'replay_changed')],
  ] as const)('shows the %s state', async (state, reply) => {
    mockApi(routes({ [REPLAY]: reply }));
    const { wrapper } = await mountApp('/contests/r41/replay');
    expect(panel(wrapper).attributes('data-state')).toBe(state);
  });
});
