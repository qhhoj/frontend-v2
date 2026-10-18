import { describe, expect, it } from 'vitest';
import { contestProblem } from '@/test/fixtures';
import { isDuringRun, nextProblem } from './submission-contest';

const run = { realStart: '2026-10-08T08:30:00Z', endTime: '2026-10-08T11:00:00Z' };

describe("a submission in the viewer's contest run", () => {
  it('belongs to the run only between its start and its end', () => {
    expect(isDuringRun('2026-10-08T08:30:00Z', run)).toBe(true);
    expect(isDuringRun('2026-10-08T10:59:59Z', run)).toBe(true);
    expect(isDuringRun('2026-10-08T08:29:59Z', run)).toBe(false);
    expect(isDuringRun('2026-10-08T11:00:01Z', run)).toBe(false);
  });

  it('names the next problem in the contest order, none after the last', () => {
    const problems = [contestProblem(0), contestProblem(1), contestProblem(2)];
    expect(nextProblem(problems, 'r42a')?.label).toBe('B');
    expect(nextProblem(problems, 'r42c')).toBeNull();
    expect(nextProblem(problems, 'other')).toBeNull();
  });
});
