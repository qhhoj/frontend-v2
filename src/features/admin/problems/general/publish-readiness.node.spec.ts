import { describe, expect, it } from 'vitest';
import type { TestCase } from '@/api/types/problem-data';
import { publishIssues, scoredCasePoints } from './publish-readiness';

const row = (type: TestCase['type'], points: number | null = null): TestCase =>
  ({ type, points, input: 'a.in', output: 'a.out' }) as TestCase;

describe('scoredCasePoints', () => {
  it('counts a batch by its start row and ignores the points of the cases inside it', () => {
    const cases = [row('C', 10), row('S', 30), row('C', 99), row('C', 99), row('E'), row('C', 5)];
    expect(scoredCasePoints(cases)).toBe(45);
  });

  it('treats unscored rows as zero', () => {
    expect(scoredCasePoints([row('C'), row('C', null)])).toBe(0);
  });
});

describe('publishIssues', () => {
  it('says nothing for scored cases and a problem worth points', () => {
    expect(publishIssues([row('C', 1)], 100)).toEqual([]);
  });

  it('flags a problem without cases, batch markers alone included', () => {
    expect(publishIssues([], 100)).toEqual(['noCases']);
    expect(publishIssues([row('S', 10), row('E')], 100)).toEqual(['noCases']);
  });

  it('flags cases worth nothing when only cases inside a batch carry points', () => {
    expect(publishIssues([row('S'), row('C', 50), row('E')], 100)).toEqual(['noCasePoints']);
  });

  it('flags a problem worth zero points alongside the case issues', () => {
    expect(publishIssues([], 0)).toEqual(['noCases', 'noProblemPoints']);
  });
});
