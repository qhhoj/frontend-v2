import { describe, expect, it } from 'vitest';
import { contestProblem, viewerResult } from '@/test/fixtures';
import type { RankingContext } from '@/lib/ranking-cells';
import { attemptsLeftUnderCap, ownResultView, solvedSummary } from './own-result';

const icpc: RankingContext = {
  formatName: 'icpc',
  pointsPrecision: 0,
  locale: 'vi',
  showsTime: true,
};

describe('own result', () => {
  it('draws a solved cell like the ranking does, without a first-solve star', () => {
    const view = ownResultView(
      contestProblem(0, {
        viewerResult: viewerResult({
          cell: { time: 1450, points: 100, tries: 1 },
          isSolved: true,
          attempts: 1,
        }),
      }),
      icpc,
    );
    expect(view).toMatchObject({ kind: 'cell', cell: { kind: 'solved', text: '+ 0:24' } });
  });

  it('says "being judged" while a submission waits and there is no cell yet', () => {
    const pending = contestProblem(0, {
      viewerResult: viewerResult({ hasPendingSubmission: true, attempts: 1 }),
    });
    expect(ownResultView(pending, icpc)).toEqual({ kind: 'pending' });
  });

  it('keeps the cell when a later submission is still being judged', () => {
    const judgingAgain = contestProblem(0, {
      viewerResult: viewerResult({
        cell: { time: 1450, points: 100, tries: 1 },
        isSolved: true,
        attempts: 2,
        hasPendingSubmission: true,
      }),
    });
    expect(ownResultView(judgingAgain, icpc)).toMatchObject({
      kind: 'cell',
      cell: { kind: 'solved' },
    });
  });

  it('counts attempts that left no cell (compile errors) and nothing for an untouched problem', () => {
    expect(
      ownResultView(contestProblem(0, { viewerResult: viewerResult({ attempts: 2 }) }), icpc),
    ).toEqual({
      kind: 'attempted',
      attempts: 2,
    });
    expect(ownResultView(contestProblem(0, { viewerResult: viewerResult() }), icpc)).toEqual({
      kind: 'untouched',
    });
  });

  it('reads a problem with no result entry as untouched', () => {
    expect(ownResultView(contestProblem(0), icpc)).toEqual({ kind: 'untouched' });
  });

  it('knows the attempts left under a cap, never below zero', () => {
    expect(attemptsLeftUnderCap(20, 3)).toBe(17);
    expect(attemptsLeftUnderCap(2, 5)).toBe(0);
  });

  it('sums the solved problems', () => {
    const problems = [
      contestProblem(0, { viewerResult: viewerResult({ isSolved: true }) }),
      contestProblem(1),
    ];
    expect(solvedSummary(problems)).toEqual({ solved: 1, total: 2 });
  });
});
