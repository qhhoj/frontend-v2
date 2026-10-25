import { describe, expect, it } from 'vitest';
import type { RankingContext } from './ranking-cells';
import type { ContestFormatName, RankingProblem } from '@/api/types/contests';
import { formatCumtime, rankingCell, showsCellTime, totalScoreText } from './ranking-cells';

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
  it('counts wrong tries before the solve', () => {
    expect(rankingCell({ time: 1860, points: 100, tries: 2 }, problem(), 'me', icpc)).toMatchObject(
      {
        kind: 'solved',
        text: '+1',
        time: '0:31',
      },
    );
  });

  it('shows partial points of a partial contest problem, not a solve', () => {
    expect(rankingCell({ time: 60, points: 30, tries: 1 }, problem(), 'me', icpc)).toMatchObject({
      kind: 'partial',
      text: '30',
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

  it('hides a frozen try behind ?1 when penalty 0 stores no tries', () => {
    expect(
      rankingCell({ time: null, points: 0, tries: 0, pending: true }, problem(), 'me', icpc),
    ).toMatchObject({ kind: 'pending', text: '?1', labelParams: { tries: 1 } });
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
      text: '+1',
      time: '0:09',
      labelParams: { tries: 1, time: '0:09' },
    });
    expect(
      rankingCell(
        { time: 540, points: 1, penalty: 0, pending: 0 },
        problem({ points: 1 }),
        'me',
        vnoj,
      ),
    ).toMatchObject({ text: '+', time: '0:09' });
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

describe('ranking cells, points formats', () => {
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
});

describe('ranking helpers', () => {
  it('prints cumulative time in the unit its format stores', () => {
    expect(formatCumtime('icpc', 512, 'en')).toBe('512');
    expect(formatCumtime('vnoj', 3_540, 'en')).toBe('0:59');
    expect(formatCumtime('ioi', 7_260, 'en')).toBe('2:01');
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
  it('counts a float sum off the full score by float noise only as solved', () => {
    expect(
      rankingCell({ points: 99.99999999999999, time: 0 }, problem(), 'me', context('ioi', 2)),
    ).toMatchObject({ kind: 'solved', text: '100' });
  });

  it('keeps a score that only rounds to the full score partial', () => {
    expect(
      rankingCell({ points: 99.5, time: 0 }, problem(), 'me', context('ioi', 0)),
    ).toMatchObject({ kind: 'partial', text: '99' });
    expect(rankingCell({ points: 99.96, time: 0 }, problem(), 'me', context('ioi', 1)).kind).toBe(
      'partial',
    );
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

describe('ranking cells past 99 hours', () => {
  const LONG = 113 * 86_400 + 23 * 3600 + 36 * 60;
  const vi = { ...timedDefault, locale: 'vi' as const };
  const timeOf = (time: number, board: RankingContext = timedDefault) =>
    rankingCell({ points: 100, time }, problem(), 'me', board).time;

  it('shows a long solve time as short days and hours, and says it in full words', () => {
    const cell = rankingCell({ points: 100, time: LONG }, problem(), 'me', vi);
    expect(cell.time).toBe('113 ng 23 g');
    expect(cell.labelParams.time).toBe('113 ngày 23 giờ');
    expect(timeOf(LONG)).toBe('113d 23h');
    expect(rankingCell({ time: LONG, points: 100, tries: 1 }, problem(), 'me', icpc).time).toBe(
      '113d 23h',
    );
  });

  it('says a total time of 100 hours or more in days and hours; icpc minutes stay a number', () => {
    expect(formatCumtime('ioi', 100 * 3600 - 60, 'en')).toBe('99:59');
    expect(formatCumtime('ioi', LONG, 'vi')).toBe('113 ng 23 g');
    expect(formatCumtime('vnoj', LONG, 'en')).toBe('113d 23h');
    expect(formatCumtime('icpc', 9_000, 'en')).toBe('9000');
  });

  it('switches at exactly 100 hours and drops zero hours', () => {
    expect(timeOf(100 * 3600 - 1)).toBe('99:59:59');
    expect(timeOf(100 * 3600, vi)).toBe('4 ng 4 g');
    expect(timeOf(5 * 86_400, vi)).toBe('5 ng');
    expect(
      rankingCell({ time: 100 * 3600 - 60, points: 100, tries: 1 }, problem(), 'me', icpc).time,
    ).toBe('99:59');
  });
});

describe('row total', () => {
  const problems = [problem({ points: 60 }), problem({ problemId: 'p2', points: 40 })];

  it('stays short of the full total once rounded, and rounds an ordinary total as before', () => {
    expect(totalScoreText(99.999, problems, context('default', 0))).toBe('99');
    expect(totalScoreText(100, problems, context('default', 0))).toBe('100');
    const tenths = [problem({ points: 0.1 }), problem({ problemId: 'p2', points: 0.2 })];
    expect(totalScoreText(0.3, tenths, context('default', 1))).toBe('0.3');
    expect(totalScoreText(54.6, problems, context('default', 0))).toBe('55');
  });
});
