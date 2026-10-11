import { flushPromises } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { contestDetail } from '@/test/fixtures';
import { contestPageRoutes } from '@/test/contest-routes';
import { fail, issue, mockApi, ok, sequence } from '@/test/mock-api';
import type { MockHandler } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';
import { endedContest, replayChunk } from '@/test/replay-fixtures';
import { replayPageRoutes } from '@/test/replay-routes';

type Wrapper = Awaited<ReturnType<typeof mountApp>>['wrapper'];
const REPLAY = 'GET /contests/r41/replay';
const rowIds = (wrapper: Wrapper) =>
  wrapper.findAll('tbody tr').map((row) => row.attributes('data-row-id'));
const clock = (wrapper: Wrapper) => wrapper.get('[data-replay-part="player"] p').text();
const panel = (wrapper: Wrapper) => wrapper.find('[data-testid="replay-state"]');
const replayCalls = (calls: { path: string }[]) =>
  calls.filter((call) => call.path.endsWith('/replay')).length;
const routes = (overrides: Record<string, MockHandler> = {}) => ({
  ...anonymousViewer,
  ...replayPageRoutes(),
  ...overrides,
});

describe('contest replay page', () => {
  afterEach(() => vi.useRealTimers());

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

  it.each([
    ['board_hidden', 'forbidden'],
    ['board_frozen', 'frozen'],
  ] as const)(
    'drops a loaded board at once when a later read is refused with %s',
    async (reason, state) => {
      const refused = fail(403, 'forbidden', undefined, [issue('board', reason, 'x')]);
      mockApi(routes({ [REPLAY]: sequence(ok(replayChunk()), refused) }));
      const { wrapper, queryClient } = await mountApp('/contests/r41/replay?t=600');
      expect(rowIds(wrapper)).toHaveLength(6);
      await queryClient.refetchQueries({ queryKey: ['contests', 'replay'] });
      await flushPromises();
      expect(panel(wrapper).attributes('data-state')).toBe(state);
      expect(wrapper.find('tbody').exists()).toBe(false);
      expect(wrapper.find('input[type="range"]').exists()).toBe(false);
    },
  );

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
});
