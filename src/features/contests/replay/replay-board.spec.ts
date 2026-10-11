import { describe, expect, it } from 'vitest';
import type { ProblemCell } from '@/api/types/contests';
import type { LoadedReplay, ReplayEvent } from '@/api/types/replay';
import type { RankingContext } from '@/lib/ranking-cells';
import { rankingRow } from '@/test/fixtures';
import {
  icpcCell,
  loadedReplay,
  R41_FINAL_STANDINGS,
  REPLAY_DURATION_SECONDS,
  REPLAY_PARTICIPANTS,
  REPLAY_PROBLEMS,
} from '@/test/replay-fixtures';
import { boardAt, indexReplay, virtualRowOf } from './replay-board';
import type { BoardRow } from './replay-board';

const ICPC: RankingContext = {
  formatName: 'icpc',
  pointsPrecision: 0,
  locale: 'vi',
  showsTime: true,
};
const IOI: RankingContext = {
  formatName: 'ioi',
  pointsPrecision: 0,
  locale: 'vi',
  showsTime: false,
};
const places = (rows: BoardRow[]) => rows.map((row) => `${row.rank ?? '—'}:${row.name}`);
const r41 = indexReplay(loadedReplay());

describe('boardAt on r41 (icpc, two ghosts)', () => {
  it('reproduces the stored final standings for the real rows', () => {
    const real = boardAt(
      indexReplay(loadedReplay({ ghosts: [] })),
      REPLAY_DURATION_SECONDS,
      ICPC,
    ).rows;
    expect(
      real.map(({ rank, name, score, cumtime }) => ({ rank, username: name, score, cumtime })),
    ).toEqual(R41_FINAL_STANDINGS);
  });

  it.each([
    [
      0,
      [
        '1:user_07',
        '1:user_12',
        '1:user_01',
        '1:user_03',
        '1:Ghost · HSG 2024 #1',
        '—:Ghost · HSG 2024 #9',
      ],
    ],
    [
      600,
      [
        '1:Ghost · HSG 2024 #1',
        '2:user_07',
        '3:user_12',
        '3:user_01',
        '3:user_03',
        '—:Ghost · HSG 2024 #9',
      ],
    ],
    [
      REPLAY_DURATION_SECONDS,
      [
        '1:Ghost · HSG 2024 #1',
        '2:user_07',
        '3:user_01',
        '4:user_12',
        '5:user_03',
        '—:Ghost · HSG 2024 #9',
      ],
    ],
  ])(
    'at %i s ranks rows by the format, shares tied ranks, puts real before ghost and unranked last',
    (seconds, expected) => {
      expect(places(boardAt(r41, seconds, ICPC).rows)).toEqual(expected);
    },
  );

  it('shows each row the cells and totals of its latest event at or before the clock', () => {
    const user12 = boardAt(r41, 600, ICPC).rows.find((row) => row.name === 'user_12')!;
    expect(user12).toMatchObject({
      score: 0,
      cumtime: 0,
      cells: { [REPLAY_PROBLEMS[0]!.problemId]: icpcCell(300, 0, 1) },
    });
    const later = boardAt(r41, 720, ICPC).rows.find((row) => row.name === 'user_12')!;
    expect(later).toMatchObject({ score: 1, cumtime: 32 });
  });

  it('keeps a registered row that never submitted, with zeros and no cells', () => {
    const user03 = boardAt(r41, REPLAY_DURATION_SECONDS, ICPC).rows.find(
      (row) => row.name === 'user_03',
    )!;
    expect(user03).toMatchObject({ score: 0, cumtime: 0, tiebreaker: 0, cells: {} });
  });

  it('credits the first solve and counts accepted rows among real rows only', () => {
    const [problemA, problemB] = boardAt(r41, 800, ICPC).problems;
    expect(problemA).toMatchObject({ label: 'A', firstSolve: 'part-07', acceptedCount: 2 });
    expect(problemB).toMatchObject({ label: 'B', firstSolve: null, acceptedCount: 0 });
  });
});

const onePerson = (events: ReplayEvent[], overrides: Partial<LoadedReplay> = {}) =>
  indexReplay(
    loadedReplay({
      participants: REPLAY_PARTICIPANTS.slice(0, 2),
      ghosts: [],
      events,
      ...overrides,
    }),
  );

describe('boardAt edge rules', () => {
  it('lets the last event of an instant win', () => {
    const index = onePerson([
      [100, 0, 0, icpcCell(100, 0, 1), 0, 0, 0],
      [100, 0, 0, icpcCell(100, 1, 2), 1, 22, 0],
    ]);
    expect(boardAt(index, 100, ICPC).rows[0]).toMatchObject({
      name: 'user_07',
      score: 1,
      cumtime: 22,
    });
  });

  it('orders a tie as real, then the virtual row, then the ghost, all sharing the rank', () => {
    const cell: ProblemCell = icpcCell(600, 1, 1);
    const index = onePerson([[600, 0, 0, cell, 1, 10, 0]], {
      ghosts: [
        {
          label: 'G',
          caption: '',
          isUnranked: false,
          gap: null,
          events: [[600, 0, 0, cell, 1, 10, 0]],
        },
      ],
    });
    const virtual = virtualRowOf({ ...rankingRow(1, 'part-v', 'user_01', 1, 10, {}), virtual: 1 });
    expect(
      boardAt(index, 900, ICPC, [virtual]).rows.map((row) => [row.rank, row.kind, row.name]),
    ).toEqual([
      [1, 'real', 'user_07'],
      [1, 'virtual', 'user_01'],
      [1, 'ghost', 'G'],
      [4, 'real', 'user_12'],
    ]);
  });

  it('reproduces stored ioi standings, where points beat time', () => {
    const points = (time: number, earned: number): ProblemCell => ({ time, points: earned });
    const index = onePerson(
      [
        [60, 0, 0, points(60, 40), 40, 60, 0],
        [120, 1, 0, points(120, 100), 100, 120, 0],
        [200, 0, 0, points(200, 100), 100, 200, 0],
        [300, 0, 1, points(300, 30), 130, 300, 0],
      ],
      { problems: REPLAY_PROBLEMS.map((problem) => ({ ...problem, points: 100 })) },
    );
    const final = boardAt(index, 18_000, IOI).rows.map(({ rank, name, score, cumtime }) => [
      rank,
      name,
      score,
      cumtime,
    ]);
    expect(final).toEqual([
      [1, 'user_07', 130, 300],
      [2, 'user_12', 100, 120],
    ]);
    expect(places(boardAt(index, 150, IOI).rows)).toEqual(['1:user_12', '2:user_07']);
  });

  it('breaks an equal score and time by the tiebreaker before the row class', () => {
    const cell = icpcCell(60, 1, 1);
    const index = onePerson([
      [60, 0, 0, cell, 1, 1, 5],
      [60, 1, 0, cell, 1, 1, 2],
    ]);
    expect(places(boardAt(index, 60, ICPC).rows)).toEqual(['1:user_12', '2:user_07']);
  });
});
