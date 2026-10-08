import { describe, expect, it } from 'vitest';
import type { RouteLocationNormalized } from 'vue-router';
import { scrollOnNavigation } from './index';

const at = (path: string) => ({ path }) as RouteLocationNormalized;

describe('scroll position on navigation', () => {
  it('keeps the position when only the query changes', () => {
    expect(scrollOnNavigation(at('/problems/a'), at('/problems/a'), null)).toBe(false);
  });
  it('lets the saved position win on back and forward, even on the same path', () => {
    const saved = { left: 0, top: 420 };
    expect(scrollOnNavigation(at('/problems/a'), at('/problems/a'), saved)).toBe(saved);
    expect(scrollOnNavigation(at('/problems/a'), at('/blog'), saved)).toBe(saved);
  });
  it('goes to the top on another path', () => {
    expect(scrollOnNavigation(at('/problems/b'), at('/problems/a'), null)).toEqual({ top: 0 });
  });
});
