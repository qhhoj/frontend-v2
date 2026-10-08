import { describe, expect, it } from 'vitest';
import type { RouteLocationNormalized } from 'vue-router';
import { scrollOnNavigation } from './index';

const at = (path: string, hash = '') => ({ path, hash }) as RouteLocationNormalized;

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
  it('scrolls to the element a hash names, on the same path and on another path', () => {
    expect(scrollOnNavigation(at('/blog/p1', '#comments'), at('/blog/p1'), null)).toEqual({
      el: '#comments',
    });
    expect(scrollOnNavigation(at('/blog/p1', '#comments'), at('/blog'), null)).toEqual({
      el: '#comments',
    });
  });
  it('lets the saved position win over a hash on back and forward', () => {
    const saved = { left: 0, top: 420 };
    expect(scrollOnNavigation(at('/blog/p1', '#comments'), at('/blog/p1'), saved)).toBe(saved);
  });
});
