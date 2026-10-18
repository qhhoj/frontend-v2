import { describe, expect, it } from 'vitest';
import type { SubmissionCase } from '@/api/types/submissions';
import { firstFailedTest, scoreOnScale } from './submit-result';

const testCase = (position: number, status: SubmissionCase['status']): SubmissionCase => ({
  batch: null,
  memory: 1024,
  points: status === 'AC' ? 1 : 0,
  position,
  status,
  time: 0.01,
  total: 1,
});

describe('firstFailedTest', () => {
  it('names the lowest failing position, whatever order the tests come in', () => {
    expect(firstFailedTest([testCase(1, 'AC'), testCase(4, 'TLE'), testCase(3, 'WA')])).toBe(3);
  });

  it('does not count passed or skipped tests as failures', () => {
    expect(firstFailedTest([testCase(1, 'AC'), testCase(2, 'SC')])).toBeNull();
  });

  it('has nothing to name when the tests are hidden', () => {
    expect(firstFailedTest(null)).toBeNull();
  });
});

describe('scoreOnScale', () => {
  it('keeps the problem scale outside a contest', () => {
    expect(scoreOnScale(400, { problemPoints: 1600, contest: null })).toEqual({
      score: 400,
      max: 1600,
    });
  });

  it("carries the share of the problem's points over to the contest's", () => {
    const contest = { points: 100, partial: true, precision: 0 };
    expect(scoreOnScale(400, { problemPoints: 1600, contest })).toEqual({ score: 25, max: 100 });
  });

  it('pays a contest problem without partial scores only for a full score', () => {
    const contest = { points: 100, partial: false, precision: 0 };
    expect(scoreOnScale(400, { problemPoints: 1600, contest })).toEqual({ score: 0, max: 100 });
    expect(scoreOnScale(1600, { problemPoints: 1600, contest })).toEqual({ score: 100, max: 100 });
  });
});
