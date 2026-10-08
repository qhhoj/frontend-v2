import { describe, expect, it } from 'vitest';
import { submissionCase, submissionDetail } from '@/test/fixtures';
import { provisionalPoints, ringFraction, ringProgress } from './grading';

describe('provisionalPoints', () => {
  it('scales problem points by the share of case points earned so far', () => {
    expect(provisionalPoints(1600, { casePoints: 7, caseTotal: 20 })).toBe(560);
  });
  it('is 0 before grading reports a total', () => {
    expect(provisionalPoints(1600, { casePoints: 0, caseTotal: 0 })).toBe(0);
  });
});
describe('ringFraction', () => {
  it('is clamped to 0..1 and 0 without a total', () => {
    expect(ringFraction({ casePoints: 7, caseTotal: 20 })).toBeCloseTo(0.35);
    expect(ringFraction({ casePoints: 30, caseTotal: 20 })).toBe(1);
    expect(ringFraction({ casePoints: 1, caseTotal: 0 })).toBe(0);
  });
});
describe('ringProgress', () => {
  it('counts graded tests of the total when the viewer sees the cases and the test count (B21)', () => {
    const row = submissionDetail({
      cases: [submissionCase(), submissionCase(), submissionCase()],
      totalCases: 10,
    });
    expect(ringProgress(row)).toEqual({ mode: 'cases', graded: 3, total: 10, fraction: 0.3 });
  });
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
  it('never leaves 0..1 and treats a test count of 0 as unknown', () => {
    const over = submissionDetail({
      cases: Array.from({ length: 12 }, () => submissionCase()),
      totalCases: 10,
    });
    expect(ringProgress(over).fraction).toBe(1);
    expect(
      ringProgress(submissionDetail({ cases: [], totalCases: 0, casePoints: 0, caseTotal: 0 }))
        .mode,
    ).toBe('points');
  });
});
