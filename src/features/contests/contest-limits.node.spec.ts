import { describe, expect, it } from 'vitest';
import { limitsText } from './contest-limits';

describe('contest problem limits', () => {
  it('joins time and memory in one cell, in the contest-page spelling (space before the unit, decimal comma in vi)', () => {
    expect(limitsText({ timeLimit: 1, memoryLimit: 262_144 })).toBe('1 s · 256 MB');
    expect(limitsText({ timeLimit: 0.5, memoryLimit: 131_072 })).toBe('0,5 s · 128 MB');
    expect(limitsText({ timeLimit: 3, memoryLimit: 1_048_576 })).toBe('3 s · 1024 MB');
  });

  it('shows a dash when the viewer may not see the problem', () => {
    expect(limitsText({ timeLimit: null, memoryLimit: null })).toBe('—');
    expect(limitsText({ timeLimit: 1, memoryLimit: null })).toBe('—');
  });
});
