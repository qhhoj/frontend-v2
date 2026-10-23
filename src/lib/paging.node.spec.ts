import { describe, expect, it } from 'vitest';
import { fallbackPageOf, pageFromQuery, pageWindow, queryWithPage } from './paging';

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

describe('fallbackPageOf', () => {
  const totalMeta = (page: number, total: number) => ({ page, pageSize: 50, total });

  it('sends a reader past the end to the last page when the total is known', () => {
    expect(fallbackPageOf(totalMeta(9999, 51), 0)).toBe(2);
    expect(fallbackPageOf(totalMeta(3, 0), 0)).toBe(1);
  });
  it('sends a reader of a list without a total to the first page', () => {
    expect(fallbackPageOf({ page: 999, pageSize: 50, hasMore: false }, 0)).toBe(1);
  });
  it('is null on the first page and on any page that has rows', () => {
    expect(fallbackPageOf(totalMeta(1, 0), 0)).toBeNull();
    expect(fallbackPageOf(totalMeta(2, 80), 30)).toBeNull();
  });
});

describe('queryWithPage', () => {
  it('sets the page, keeps every other key and leaves no page key on page 1', () => {
    expect(queryWithPage({ q: 'a', page: '5' }, 'page', 3)).toEqual({ q: 'a', page: '3' });
    expect(queryWithPage({ q: 'a', page: '5' }, 'page', 1)).toEqual({ q: 'a' });
    expect(queryWithPage({ page: '2' }, 'tab', 4)).toEqual({ page: '2', tab: '4' });
  });
});
