import { describe, expect, it } from 'vitest';
import type { SubmissionCase } from '@/api/types/submissions';
import { firstFailedTest } from './submit-result';

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
