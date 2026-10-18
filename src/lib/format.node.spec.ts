import { describe, expect, it } from 'vitest';
import { formatDuration, formatProblemPoints } from './format';

describe('format helpers', () => {
  it('formats a countdown with unbounded hours and never below zero', () => {
    expect(formatDuration(5077)).toBe('01:24:37');
    expect(formatDuration(14 * 86_400 - 1)).toBe('335:59:59');
    expect(formatDuration(-5)).toBe('00:00:00');
  });

  it('marks partially scored problems with a p suffix, as 1500p', () => {
    expect(formatProblemPoints(1500, true, 'vi')).toBe('1500p');
    expect(formatProblemPoints(1500, false, 'vi')).toBe('1500');
    expect(formatProblemPoints(12.5, true, 'vi')).toBe('12,5p');
    expect(formatProblemPoints(12.5, true, 'en')).toBe('12.5p');
  });
});
