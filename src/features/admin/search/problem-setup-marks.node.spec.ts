import { describe, expect, it } from 'vitest';
import { setupGapsOf } from './problem-setup-marks';

describe('setupGapsOf', () => {
  it('lists the missing parts in setup order', () => {
    expect(setupGapsOf({ hasStatement: false, hasTests: true, hasPoints: false })).toEqual([
      'statement',
      'points',
    ]);
    expect(setupGapsOf({ hasStatement: true, hasTests: true, hasPoints: true })).toEqual([]);
  });

  it('gives nothing for a row without readiness', () => {
    expect(setupGapsOf(undefined)).toBeNull();
  });
});
