import { describe, expect, it } from 'vitest';
import { pageFromQuery, pageWindow } from './paging';

describe('pageWindow', () => {
  it('shows the first, the last and the neighbours of the current page with gaps between', () => {
    expect(pageWindow(12, 46)).toEqual([1, 'gap', 11, 12, 13, 'gap', 46]);
    expect(pageWindow(1, 10)).toEqual([1, 2, 'gap', 10]);
  });
  it('writes a single missing page out instead of a gap, and never repeats a page', () => {
    expect(pageWindow(4, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(2, 2)).toEqual([1, 2]);
  });
});

describe('pageFromQuery', () => {
  it('reads a whole page number between 1 and 10000 and falls back to 1 otherwise', () => {
    expect(pageFromQuery('12')).toBe(12);
    expect(pageFromQuery(['3', '4'])).toBe(3);
    for (const bad of [undefined, '', '0', '-2', '1.5', 'abc', '10001']) {
      expect(pageFromQuery(bad), String(bad)).toBe(1);
    }
  });
});
