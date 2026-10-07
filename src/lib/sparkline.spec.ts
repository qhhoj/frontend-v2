import { describe, expect, it } from 'vitest';
import { sparklinePath } from './sparkline';

describe('sparklinePath', () => {
  it('spans the box from the lowest to the highest value', () => {
    expect(sparklinePath([1500, 2000], 640, 110)).toBe('M4.0 106.0 L636.0 4.0');
  });

  it('draws a flat line for one value and nothing for none', () => {
    expect(sparklinePath([1500], 640, 110)).toBe('M4.0 106.0 L636.0 106.0');
    expect(sparklinePath([], 640, 110)).toBe('');
  });
});
