import { describe, expect, it } from 'vitest';
import { submissionDetail } from '@/test/fixtures';
import { ringProgress } from './grading';

describe('ringProgress', () => {
  it('falls back to the share of points when the cases or their count are hidden', () => {
    const hidden = submissionDetail({
      cases: null,
      totalCases: null,
      casePoints: 7,
      caseTotal: 20,
    });
    expect(ringProgress(hidden)).toEqual({ mode: 'points', fraction: 0.35 });
    const batches = submissionDetail({ cases: null, totalCases: 10, casePoints: 7, caseTotal: 20 });
    expect(ringProgress(batches).mode).toBe('points');
  });
});
