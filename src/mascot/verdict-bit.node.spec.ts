import { describe, expect, it } from 'vitest';
import type { SubmissionResult } from '@/api/types/submissions';
import { verdictOf } from '@/lib/verdicts';
import { verdictBitMood } from './verdict-bit';

const mood = (result: SubmissionResult) => verdictBitMood(verdictOf({ status: 'D', result }));

describe('verdictBitMood', () => {
  it('crowns a full AC only', () => {
    expect(mood('AC')).toBe('crown');
  });

  it('sweats on a rejected program and on a compile error', () => {
    for (const result of ['WA', 'TLE', 'RTE'] as const) expect(mood(result)).toBe('sweat');
    expect(verdictBitMood(verdictOf({ status: 'CE', result: null }))).toBe('sweat');
  });

  it('stays out of system outcomes', () => {
    expect(mood('RJ')).toBeNull();
    expect(verdictBitMood(verdictOf({ status: 'IE', result: null }))).toBeNull();
  });
});
