import { describe, expect, it } from 'vitest';
import { PROBLEM_CODE_PATTERN } from './problem-code';

describe('problem code pattern', () => {
  it.each(['hcmus41c', 'a', 'x_1', 'a'.repeat(32)])('accepts %s', (code) => {
    expect(PROBLEM_CODE_PATTERN.test(code)).toBe(true);
  });

  it.each(['', 'Bad Code', 'a'.repeat(33), 'hcmus-41c', 'ĐỀ'])('refuses %s', (code) => {
    expect(PROBLEM_CODE_PATTERN.test(code)).toBe(false);
  });
});
