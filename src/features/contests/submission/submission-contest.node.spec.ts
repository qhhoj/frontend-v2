import { describe, expect, it } from 'vitest';
import { contestProblem } from '@/test/fixtures';
import { contestPointsOf, isDuringRun, nextProblem } from './submission-contest';

const run = { realStart: '2026-10-08T08:00:00Z', endTime: '2026-10-08T11:00:00Z' };

describe("a submission in the viewer's contest run", () => {
  it('belongs to the run only between its start and its end', () => {
    expect(isDuringRun('2026-10-08T08:00:00Z', run)).toBe(true);
    expect(isDuringRun('2026-10-08T10:59:59Z', run)).toBe(true);
    expect(isDuringRun('2026-10-08T07:59:59Z', run)).toBe(false);
    expect(isDuringRun('2026-10-08T11:00:01Z', run)).toBe(false);
  });

  it('names the next problem in the contest order, none after the last', () => {
    const problems = [contestProblem(0), contestProblem(1), contestProblem(2)];
    expect(nextProblem(problems, 'r42a')?.label).toBe('B');
    expect(nextProblem(problems, 'r42c')).toBeNull();
    expect(nextProblem(problems, 'other')).toBeNull();
  });
});

describe('contest points of a submission (backend contestSubmissionPoints)', () => {
  const partial = { points: 100, partial: true };
  const whole = { points: 100, partial: false };

  it("scales the case ratio to the contest problem's points, rounded to 3 places", () => {
    expect(contestPointsOf({ casePoints: 1000, caseTotal: 1000 }, whole, 'icpc', false)).toBe(100);
    expect(contestPointsOf({ casePoints: 1, caseTotal: 3 }, partial, 'ioi', true)).toBe(33.333);
  });

  it('rounds an exact tie to the even neighbour, as the stored points are', () => {
    const one = { points: 1, partial: true };
    expect(contestPointsOf({ casePoints: 1, caseTotal: 16 }, one, 'ioi', true)).toBe(0.062);
  });

  it('scores 0 short of full unless both the contest problem and the problem are partial', () => {
    expect(contestPointsOf({ casePoints: 1, caseTotal: 2 }, whole, 'ioi', true)).toBe(0);
    expect(contestPointsOf({ casePoints: 1, caseTotal: 2 }, partial, 'ioi', false)).toBe(0);
    expect(contestPointsOf({ casePoints: 1, caseTotal: 2 }, partial, 'ioi', true)).toBe(50);
  });

  it('always counts partial points on final_submission, and 0 with no cases', () => {
    expect(contestPointsOf({ casePoints: 1, caseTotal: 2 }, whole, 'final_submission', false)).toBe(
      50,
    );
    expect(contestPointsOf({ casePoints: 0, caseTotal: 0 }, partial, 'ioi', true)).toBe(0);
  });
});
