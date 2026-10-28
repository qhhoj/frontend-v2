import { describe, expect, it } from 'vitest';
import { submissionItem } from '@/test/fixtures';
import { continueProblem } from './continue-target';

const attempt = (code: string, result: 'AC' | 'WA' | 'TLE') =>
  submissionItem({ problem: { code, name: code, isDeleted: false, points: 100 }, result });

describe('continueProblem', () => {
  it('offers an unsolved problem, not the one just solved after failed attempts', () => {
    // Newest first: Y solved after a TLE and a WA; X is still unsolved.
    const recent = [
      attempt('Y', 'AC'),
      attempt('Y', 'TLE'),
      attempt('Y', 'WA'),
      attempt('X', 'WA'),
    ];
    expect(continueProblem(recent)?.code).toBe('X');
  });
});
