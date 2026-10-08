import { describe, expect, it } from 'vitest';
import type { RankingProblem } from '@/api/types/contests';
import { formatCumtime, isPenaltyFormat, rankingCell, solvedCount } from './ranking-cells';

const problem = (overrides: Partial<RankingProblem> = {}): RankingProblem => ({
  problemId: 'p1',
  code: 'a',
  label: 'A',
  points: 100,
  firstSolve: 'someone-else',
  acceptedCount: 1,
  ...overrides,
});

describe('ranking cells, icpc', () => {
  it('shows a first-try solve with its time', () => {
    expect(rankingCell({ time: 540, points: 1, tries: 1 }, problem(), 'me', 'icpc')).toEqual({
      kind: 'solved',
      text: '+ 0:09',
      labelKey: 'ranking.cell.solved',
      labelParams: { tries: 0, time: '0:09' },
    });
  });

  it('counts wrong tries before the solve', () => {
    expect(rankingCell({ time: 1860, points: 1, tries: 2 }, problem(), 'me', 'icpc').text).toBe(
      '+1 0:31',
    );
  });

  it('marks the first solve of the problem', () => {
    expect(
      rankingCell({ time: 540, points: 1, tries: 1 }, problem({ firstSolve: 'me' }), 'me', 'icpc'),
    ).toMatchObject({
      kind: 'first-solve',
      labelKey: 'ranking.cell.firstSolve',
    });
  });

  it('shows failed tries', () => {
    expect(rankingCell({ time: null, points: 0, tries: 4 }, problem(), 'me', 'icpc')).toMatchObject(
      { kind: 'failed', text: '−4' },
    );
  });

  it('hides frozen results behind ?n', () => {
    expect(
      rankingCell({ time: null, points: 0, tries: 2, pending: true }, problem(), 'me', 'icpc'),
    ).toMatchObject({
      kind: 'pending',
      text: '?2',
      labelParams: { tries: 2 },
    });
  });

  it('leaves untouched problems empty', () => {
    expect(rankingCell(undefined, problem(), 'me', 'icpc').kind).toBe('empty');
    expect(rankingCell({ time: null, points: 0, tries: 0 }, problem(), 'me', 'icpc').kind).toBe(
      'empty',
    );
  });
});

describe('ranking cells, vnoj', () => {
  it('counts the stored penalty as wrong tries and keeps the time in seconds', () => {
    expect(
      rankingCell({ time: 540, points: 1, penalty: 1, pending: 0 }, problem(), 'me', 'vnoj'),
    ).toMatchObject({
      kind: 'solved',
      text: '+1 0:09',
      labelParams: { tries: 1, time: '0:09' },
    });
    expect(
      rankingCell({ time: 540, points: 1, penalty: 0, pending: 0 }, problem(), 'me', 'vnoj').text,
    ).toBe('+ 0:09');
  });

  it('marks the first solve', () => {
    expect(
      rankingCell({ time: 60, points: 1, penalty: 0 }, problem({ firstSolve: 'me' }), 'me', 'vnoj')
        .kind,
    ).toBe('first-solve');
  });

  it('shows pending submissions by their count and failed tries by the penalty', () => {
    expect(
      rankingCell({ time: 0, points: 0, penalty: 0, pending: 2 }, problem(), 'me', 'vnoj'),
    ).toMatchObject({
      kind: 'pending',
      text: '?2',
      labelParams: { tries: 2 },
    });
    expect(
      rankingCell({ time: 0, points: 0, penalty: 3, pending: 0 }, problem(), 'me', 'vnoj'),
    ).toMatchObject({ kind: 'failed', text: '−3' });
  });

  it('leaves untouched problems empty and keeps a solve visible when later tries are pending', () => {
    expect(
      rankingCell({ time: 0, points: 0, penalty: 0, pending: 0 }, problem(), 'me', 'vnoj').kind,
    ).toBe('empty');
    expect(
      rankingCell({ time: 600, points: 1, penalty: 0, pending: 3 }, problem(), 'me', 'vnoj').kind,
    ).toBe('solved');
  });
});

describe('ranking cells, points formats', () => {
  it('shows full points as solved and the first full solve as first', () => {
    expect(rankingCell({ points: 100, time: 600 }, problem(), 'me', 'ioi')).toMatchObject({
      kind: 'solved',
      text: '100',
    });
    expect(
      rankingCell({ points: 100, time: 600 }, problem({ firstSolve: 'me' }), 'me', 'ioi').kind,
    ).toBe('first-solve');
  });

  it('grades partial points in three steps', () => {
    expect(rankingCell({ points: 20, time: 0 }, problem(), 'me', 'ioi')).toMatchObject({
      kind: 'partial',
      partialStep: 1,
      text: '20',
    });
    expect(rankingCell({ points: 50, time: 0 }, problem(), 'me', 'ioi').partialStep).toBe(2);
    expect(rankingCell({ points: 99.5, time: 0 }, problem(), 'me', 'ioi').partialStep).toBe(3);
  });

  it('shows zero points as failed and survives a zero-point problem', () => {
    expect(rankingCell({ points: 0, time: 0 }, problem(), 'me', 'ioi')).toMatchObject({
      kind: 'failed',
      text: '0',
    });
    expect(rankingCell({ points: 0, time: 0 }, problem({ points: 0 }), 'me', 'ioi').kind).toBe(
      'solved',
    );
  });
});

describe('ranking helpers', () => {
  it('prints cumulative time in the unit its format stores', () => {
    expect(formatCumtime('icpc', 512)).toBe('512');
    expect(formatCumtime('vnoj', 3_540)).toBe('0:59');
    expect(formatCumtime('ioi', 7_260)).toBe('2:01');
  });

  it('knows which formats count penalties', () => {
    expect(['icpc', 'vnoj'].every(isPenaltyFormat)).toBe(true);
    expect(['default', 'ioi', 'ioi16', 'ultimate', 'final_submission'].some(isPenaltyFormat)).toBe(
      false,
    );
  });

  it('counts solved problems from the cells, frozen ones excluded', () => {
    const cells = {
      p1: { points: 1, tries: 1, time: 60 },
      p2: { points: 0, tries: 2, time: null, pending: true },
      p3: { points: 0, tries: 1, time: null },
    };
    expect(solvedCount({ cells })).toBe(1);
  });
});
