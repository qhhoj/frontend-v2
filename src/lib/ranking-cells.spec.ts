import { describe, expect, it } from 'vitest';
import type { RankingContext } from './ranking-cells';
import type { ContestFormatName, RankingProblem } from '@/api/types/contests';
import {
  formatCumtime,
  isPenaltyFormat,
  rankingCell,
  showsCellTime,
  showsCumtime,
  solvedCount,
} from './ranking-cells';

const problem = (overrides: Partial<RankingProblem> = {}): RankingProblem => ({
  problemId: 'p1',
  code: 'a',
  label: 'A',
  points: 100,
  firstSolve: 'someone-else',
  acceptedCount: 1,
  ...overrides,
});

const context = (
  formatName: ContestFormatName,
  pointsPrecision = 2,
  formatConfig: Record<string, number | boolean> = {},
): RankingContext => ({
  formatName,
  pointsPrecision,
  locale: 'en',
  showsTime: showsCellTime(formatName, formatConfig),
});
const icpc = context('icpc');
const vnoj = context('vnoj');
const timedDefault = context('default');

describe('ranking cells, icpc', () => {
  it('shows a first-try solve with its time', () => {
    expect(rankingCell({ time: 540, points: 1, tries: 1 }, problem(), 'me', icpc)).toEqual({
      kind: 'solved',
      text: '+ 0:09',
      labelKey: 'ranking.cell.solved',
      labelParams: { tries: 0, time: '0:09' },
    });
  });

  it('counts wrong tries before the solve', () => {
    expect(rankingCell({ time: 1860, points: 1, tries: 2 }, problem(), 'me', icpc).text).toBe(
      '+1 0:31',
    );
  });

  it('marks the first solve of the problem', () => {
    expect(
      rankingCell({ time: 540, points: 1, tries: 1 }, problem({ firstSolve: 'me' }), 'me', icpc),
    ).toMatchObject({
      kind: 'first-solve',
      labelKey: 'ranking.cell.firstSolve',
    });
  });

  it('shows failed tries', () => {
    expect(rankingCell({ time: null, points: 0, tries: 4 }, problem(), 'me', icpc)).toMatchObject({
      kind: 'failed',
      text: '−4',
    });
  });

  it('hides frozen results behind ?n', () => {
    expect(
      rankingCell({ time: null, points: 0, tries: 2, pending: true }, problem(), 'me', icpc),
    ).toMatchObject({
      kind: 'pending',
      text: '?2',
      labelParams: { tries: 2 },
    });
  });

  it('leaves untouched problems empty', () => {
    expect(rankingCell(undefined, problem(), 'me', icpc).kind).toBe('empty');
    expect(rankingCell({ time: null, points: 0, tries: 0 }, problem(), 'me', icpc).kind).toBe(
      'empty',
    );
  });
});

describe('ranking cells, vnoj', () => {
  it('counts the stored penalty as wrong tries and keeps the time in seconds', () => {
    expect(
      rankingCell(
        { time: 540, points: 1, penalty: 1, pending: 0 },
        problem({ points: 1 }),
        'me',
        vnoj,
      ),
    ).toMatchObject({
      kind: 'solved',
      text: '+1 0:09',
      labelParams: { tries: 1, time: '0:09' },
    });
    expect(
      rankingCell(
        { time: 540, points: 1, penalty: 0, pending: 0 },
        problem({ points: 1 }),
        'me',
        vnoj,
      ).text,
    ).toBe('+ 0:09');
  });

  it('marks the first solve', () => {
    expect(
      rankingCell(
        { time: 60, points: 1, penalty: 0 },
        problem({ points: 1, firstSolve: 'me' }),
        'me',
        vnoj,
      ).kind,
    ).toBe('first-solve');
  });

  it('shows pending submissions by their count and failed tries by the penalty', () => {
    expect(
      rankingCell(
        { time: 0, points: 0, penalty: 0, pending: 2 },
        problem({ points: 1 }),
        'me',
        vnoj,
      ),
    ).toMatchObject({
      kind: 'pending',
      text: '?2',
      labelParams: { tries: 2 },
    });
    expect(
      rankingCell(
        { time: 0, points: 0, penalty: 3, pending: 0 },
        problem({ points: 1 }),
        'me',
        vnoj,
      ),
    ).toMatchObject({ kind: 'failed', text: '−3' });
  });

  it('leaves untouched problems empty and keeps a solve visible when later tries are pending', () => {
    expect(
      rankingCell(
        { time: 0, points: 0, penalty: 0, pending: 0 },
        problem({ points: 1 }),
        'me',
        vnoj,
      ).kind,
    ).toBe('empty');
    expect(
      rankingCell(
        { time: 600, points: 1, penalty: 0, pending: 3 },
        problem({ points: 1 }),
        'me',
        vnoj,
      ).kind,
    ).toBe('solved');
  });
});

describe('ranking cells, points formats (Cells A)', () => {
  it('puts the time under full points and marks the first full solve with a star', () => {
    expect(rankingCell({ points: 100, time: 492 }, problem(), 'me', timedDefault)).toEqual({
      kind: 'solved',
      text: '100',
      time: '0:08:12',
      labelKey: 'ranking.cell.pointsAt',
      labelParams: { points: '100', time: '0:08:12' },
    });
    expect(
      rankingCell({ points: 100, time: 492 }, problem({ firstSolve: 'me' }), 'me', timedDefault),
    ).toMatchObject({
      kind: 'first-solve',
      labelKey: 'ranking.cell.firstPointsAt',
    });
  });

  it('keeps the time on partial points and grades them in three steps', () => {
    expect(rankingCell({ points: 20, time: 600 }, problem(), 'me', timedDefault)).toMatchObject({
      kind: 'partial',
      partialStep: 1,
      text: '20',
      time: '0:10:00',
    });
    expect(rankingCell({ points: 50, time: 0 }, problem(), 'me', timedDefault).partialStep).toBe(2);
    expect(rankingCell({ points: 99.5, time: 0 }, problem(), 'me', timedDefault).partialStep).toBe(
      3,
    );
  });

  it('shows zero points as failed without a time', () => {
    const zero = rankingCell({ points: 0, time: 300 }, problem(), 'me', timedDefault);
    expect(zero).toMatchObject({ kind: 'failed', text: '0' });
    expect(zero.time).toBeUndefined();
  });

  it.each([
    ['ioi16', {}],
    ['final_submission', {}],
    ['ioi', {}],
  ] as const)(
    'shows neither a time nor a star for %s %o, even when the backend names a first solve',
    (format, config) => {
      const view = rankingCell(
        { points: 100, time: 0 },
        problem({ firstSolve: 'me' }),
        'me',
        context(format, 2, config),
      );
      expect(view.kind).toBe('solved');
      expect(view.time).toBeUndefined();
      expect(view.labelKey).toBe('ranking.cell.points');
    },
  );

  it.each([
    ['ioi', { cumtime: true }],
    ['ioi', { lastScoreAltering: true }],
    ['ultimate', {}],
  ] as const)('shows the time and the star for %s %o', (format, config) => {
    const view = rankingCell(
      { points: 100, time: 75 },
      problem({ firstSolve: 'me' }),
      'me',
      context(format, 2, config),
    );
    expect(view).toMatchObject({ kind: 'first-solve', time: '0:01:15' });
  });

  it('keeps ioi16 timeless even with cumtime (its cells always store time 0)', () => {
    expect(showsCellTime('ioi16', { cumtime: true })).toBe(false);
  });
});

describe('ranking helpers', () => {
  it('prints cumulative time in the unit its format stores', () => {
    expect(formatCumtime('icpc', 512)).toBe('512');
    expect(formatCumtime('vnoj', 3_540)).toBe('0:59');
    expect(formatCumtime('ioi', 7_260)).toBe('2:01');
  });

  it('knows which formats count penalties', () => {
    expect((['icpc', 'vnoj'] as const).every(isPenaltyFormat)).toBe(true);
    expect(
      (['default', 'ioi', 'ioi16', 'ultimate', 'final_submission'] as const).some(isPenaltyFormat),
    ).toBe(false);
  });

  it('counts solved problems from the cells, frozen and partial ones excluded', () => {
    const cells = {
      p1: { points: 1, tries: 1, time: 60 },
      p2: { points: 0, tries: 2, time: null, pending: true },
      p3: { points: 0, tries: 1, time: null },
    };
    const problems = ['p1', 'p2', 'p3'].map((problemId) => problem({ problemId, points: 1 }));
    expect(solvedCount({ cells, participationId: 'me' }, problems, icpc)).toBe(1);
    const vnojCells = {
      p1: { points: 1, penalty: 0, time: 60, pending: 0 },
      p2: { points: 0.5, penalty: 0, time: 60, pending: 0 },
    };
    expect(solvedCount({ cells: vnojCells, participationId: 'me' }, problems, vnoj)).toBe(1);
  });

  it('hides the time column only for formats that never accumulate time', () => {
    expect((['ioi16', 'final_submission'] as const).some(showsCumtime)).toBe(false);
    expect((['icpc', 'vnoj', 'ioi', 'default', 'ultimate'] as const).every(showsCumtime)).toBe(
      true,
    );
  });
});

describe('ranking cells, vnoj partial points', () => {
  it('shows partial points, not a solve, below the full score', () => {
    expect(
      rankingCell(
        { time: 540, points: 0.5, penalty: 1, pending: 0 },
        problem({ points: 1 }),
        'me',
        vnoj,
      ),
    ).toMatchObject({
      kind: 'partial',
      text: '0.5',
      partialStep: 2,
    });
  });

  it('keeps a withheld partial result pending', () => {
    expect(
      rankingCell(
        { time: 540, points: 0.5, penalty: 0, pending: 1 },
        problem({ points: 1 }),
        'me',
        vnoj,
      ).kind,
    ).toBe('pending');
  });
});

describe('points precision and locale', () => {
  it('prints cell points like the score column: contest precision and locale', () => {
    const vietnamese = { ...context('ioi', 1), locale: 'vi' } as const;
    expect(rankingCell({ points: 99.5, time: 0 }, problem(), 'me', vietnamese).text).toBe('99,5');
    expect(rankingCell({ points: 99.5, time: 0 }, problem(), 'me', context('ioi', 3)).text).toBe(
      '99.5',
    );
  });

  it('counts a float sum that rounds to the full score as solved', () => {
    expect(
      rankingCell({ points: 99.999999, time: 0 }, problem(), 'me', context('ioi', 2)),
    ).toMatchObject({ kind: 'solved', text: '100' });
    expect(
      rankingCell({ points: 99.999999, time: 0 }, problem(), 'me', context('ioi', 8)).kind,
    ).toBe('partial');
  });
});

describe('ranking cells, zero-point problem', () => {
  const free = problem({ points: 0 });

  it('does not count a 0-point problem as solved on a points board', () => {
    const view = rankingCell({ points: 0, time: 10 }, free, 'me', timedDefault);
    expect(view.kind).toBe('failed');
  });

  it('does not count a 0-point problem as solved on a vnoj board', () => {
    const view = rankingCell({ points: 0, time: 10, penalty: 0 }, free, 'me', vnoj);
    expect(view.kind).not.toBe('solved');
    expect(view.kind).not.toBe('first-solve');
  });
});
