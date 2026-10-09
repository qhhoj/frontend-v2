import { afterAll, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import * as rankingCells from '@/lib/ranking-cells';
import type { RankingContext } from '@/lib/ranking-cells';
import { stubMatchMedia } from '@/test/match-media';
import { mountComponent } from '@/test/mount';
import { LARGE_REPLAY, largeReplay } from '@/test/replay-fixtures';
import ReplayTable from './ReplayTable.vue';
import { boardAt, indexReplay } from './replay-board';
import type { ReplayBoard } from './replay-board';

vi.mock('@/lib/ranking-cells', async (importOriginal) => {
  const original = await importOriginal<typeof rankingCells>();
  return { ...original, rankingCell: vi.fn(original.rankingCell) };
});

const ICPC: RankingContext = {
  formatName: 'icpc',
  pointsPrecision: 0,
  locale: 'vi',
  showsTime: true,
};
/** One player tick at x300 (250 ms of wall time). */
const TICK_SECONDS = 75;
const START = 5400;
const TICKS = 8;
const replay = largeReplay();
const index = indexReplay(replay);
const cellCalls = () => vi.mocked(rankingCells.rankingCell).mock.calls.length;
const timings: number[] = [];

/** Rows that gain an event in (from, to], plus every row that may gain or lose a first-solve star. */
const touchedRows = (from: number, to: number) =>
  new Set(
    replay.events.filter((event) => event[0] > from && event[0] <= to).map((event) => event[1]),
  ).size + LARGE_REPLAY.problems;

function mountBoard(seconds: number) {
  stubMatchMedia();
  const wrapper = mountComponent(ReplayTable, {
    props: { board: boardAt(index, seconds, ICPC), context: ICPC, viewerId: null, label: 'Bảng' },
  });
  return { setBoard: (board: ReplayBoard) => wrapper.setProps({ board } as never), wrapper };
}

describe(`ReplayTable at ${LARGE_REPLAY.rows} rows × ${LARGE_REPLAY.problems} problems × ${LARGE_REPLAY.events} events`, () => {
  afterAll(() => {
    const sorted = [...timings].sort((left, right) => left - right);
    console.info(
      `[replay-perf] jsdom ms per x300 tick: median ${sorted[Math.floor(sorted.length / 2)]?.toFixed(1)}, max ${sorted.at(-1)?.toFixed(1)}`,
    );
  });

  it('draws every row, and does not slide rows on a board this big even with motion allowed', () => {
    const { wrapper } = mountBoard(START);
    expect(wrapper.findAll('tbody tr')).toHaveLength(LARGE_REPLAY.rows);
    expect(wrapper.get('tbody').attributes('data-motion')).toBe('off');
  });

  it('rebuilds the cells of the rows that changed only, tick after tick', async () => {
    const { setBoard } = mountBoard(START);
    for (let tick = 1; tick <= TICKS; tick += 1) {
      const from = START + (tick - 1) * TICK_SECONDS;
      const board = boardAt(index, from + TICK_SECONDS, ICPC);
      const before = cellCalls();
      const startedAt = performance.now();
      await setBoard(board);
      await nextTick();
      timings.push(performance.now() - startedAt);
      expect(cellCalls() - before).toBeLessThanOrEqual(
        touchedRows(from, from + TICK_SECONDS) * LARGE_REPLAY.problems,
      );
    }
  });

  it('rebuilds no cell when a refetched contest brings an equal context', async () => {
    stubMatchMedia();
    const wrapper = mountComponent(ReplayTable, {
      props: { board: boardAt(index, START, ICPC), context: ICPC, viewerId: null, label: 'Bảng' },
    });
    const before = cellCalls();
    await wrapper.setProps({ context: { ...ICPC } } as never);
    expect(cellCalls() - before).toBe(0);
  });

  it('rebuilds no cell when the same second is drawn again', async () => {
    const { setBoard } = mountBoard(START);
    const board = boardAt(index, START, ICPC);
    const before = cellCalls();
    await setBoard(board);
    expect(cellCalls() - before).toBe(0);
  });
});
