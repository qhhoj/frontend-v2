import { describe, expect, it } from 'vitest';
import { tierOf } from './problem-tier';

describe('problem difficulty tier', () => {
  it.each([
    [800, 1],
    [999, 1],
    [1000, 2],
    [1599, 2],
    [1600, 3],
    [2499, 3],
    [2500, 4],
    [4000, 4],
  ])('%i points is tier %i', (points, tier) => {
    expect(tierOf(points)).toBe(tier);
  });

  it('is defined as a colour in every theme', () => {
    const themes = Object.entries(
      import.meta.glob<string>('../../theme/themes/*.css', {
        query: '?raw',
        import: 'default',
        eager: true,
      }),
    );
    expect(themes.length).toBeGreaterThan(0);
    for (const [name, css] of themes)
      for (const tier of [1, 2, 3, 4]) expect(css, name).toContain(`--qh-diff-${tier}:`);
  });
});
