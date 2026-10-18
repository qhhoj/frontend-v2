import { describe, expect, it } from 'vitest';
import { sparklineAreaPath, sparklinePath } from './sparkline';

describe('sparklineAreaPath', () => {
  it('follows the line, then closes along the bottom edge', () => {
    const line = sparklinePath([1, 3, 2], 100, 40);
    expect(sparklineAreaPath([1, 3, 2], 100, 40)).toBe(`${line} L96.0 40 L4.0 40 Z`);
  });

  it('is empty without values', () => {
    expect(sparklineAreaPath([], 100, 40)).toBe('');
  });
});
