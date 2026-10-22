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
    expect(
      scoreOnScale({ points: 400, contest: null }, { problemPoints: 1600, contest: null }),
    ).toEqual({
      score: 400,
      max: 1600,
    });
  });

  it("carries the share of the problem's points over to the contest's", () => {
    const contest = { key: 'r42', points: 100, partial: true, precision: 0 };
    expect(scoreOnScale({ points: 400, contest: null }, { problemPoints: 1600, contest })).toEqual({
      score: 25,
      max: 100,
    });
  });

  it('pays a contest problem without partial scores only for a full score', () => {
    const contest = { key: 'r42', points: 100, partial: false, precision: 0 };
    expect(scoreOnScale({ points: 400, contest: null }, { problemPoints: 1600, contest })).toEqual({
      score: 0,
      max: 100,
    });
    expect(scoreOnScale({ points: 1600, contest: null }, { problemPoints: 1600, contest })).toEqual(
      { score: 100, max: 100 },
    );
  });

  it("takes the contest's own points for a submission made in it, as the scoreboard counts them", () => {
    const contest = { key: 'r42', points: 250, partial: false, precision: 0 };
    const inContest = { key: 'r42', points: 75 };
    expect(
      scoreOnScale({ points: 0, contest: inContest }, { problemPoints: 100, contest }),
    ).toEqual({
      score: 75,
      max: 250,
    });
  });

  it("falls back to the problem's share when the row's contest is another one or holds no points", () => {
    const contest = { key: 'r42', points: 100, partial: true, precision: 0 };
    const scale = { problemPoints: 1600, contest };
    const other = { key: 'r7', points: 9 };
    expect(scoreOnScale({ points: 400, contest: other }, scale)).toEqual({ score: 25, max: 100 });
    const left = { key: 'r42', points: null };
    expect(scoreOnScale({ points: 400, contest: left }, scale)).toEqual({ score: 25, max: 100 });
  });
});
