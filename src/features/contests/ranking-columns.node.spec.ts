import { describe, expect, it } from 'vitest';
import type { RankingCellView } from '@/lib/ranking-cells';
import {
  PROBLEM_COLUMN_REM,
  SCORE_COLUMN_REM,
  problemColumnRem,
  scoreColumnRem,
} from './ranking-columns';

const cell = (text: string, time?: string): RankingCellView =>
  ({ kind: 'solved', text, time }) as RankingCellView;

describe('ranking column widths', () => {
  it('keeps the minimum for short texts', () => {
    expect(problemColumnRem([cell('+1', '1:32')])).toBe(PROBLEM_COLUMN_REM);
    expect(scoreColumnRem([{ total: '3' }])).toBe(SCORE_COLUMN_REM);
  });

  it('widens the problem column for a solve time of 100 hours or more', () => {
    expect(problemColumnRem([cell('+12', '12 ng 17 g')])).toBeGreaterThan(PROBLEM_COLUMN_REM);
  });

  it('widens the score column for a long total beside a days-and-hours time', () => {
    const rem = scoreColumnRem([{ total: '5.020,67', time: '58 ng 4 g' }]);
    expect(rem).toBeGreaterThan(SCORE_COLUMN_REM);
    // 8 + 9 chars at 0.6 em: the text must fit the column.
    expect(rem * 16).toBeGreaterThan(8 * 0.6 * 14 + 9 * 0.6 * 11 + 12);
  });
});
