import { describe, expect, it } from 'vitest';
import type { TestCase } from '@/api/types/problem-data';
import { scoredCasePoints } from './publish-readiness';

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
