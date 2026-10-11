import { describe, expect, it } from 'vitest';
import { advancedChangeCount, viewOfQuery, viewsWithErrors, viewToReveal } from './editor-view';

const BASIC = ['name', 'startTime'];

describe('editor views', () => {
  it('reads the view from the query: only "advanced" opens Advanced', () => {
    expect(viewOfQuery('advanced')).toBe('advanced');
    expect(viewOfQuery(undefined)).toBe('basic');
    expect(viewOfQuery(['advanced'])).toBe('basic');
    expect(viewOfQuery('junk')).toBe('basic');
  });

  it('places an error by the first segment of its key', () => {
    expect(viewsWithErrors({ startTime: 'x' }, BASIC)).toEqual(['basic']);
    expect(viewsWithErrors({ 'formatConfig.penalty': 'x' }, BASIC)).toEqual(['advanced']);
    expect(viewsWithErrors({ name: 'x', 'cases.3.input': 'x' }, BASIC)).toEqual([
      'basic',
      'advanced',
    ]);
    expect(viewsWithErrors({}, BASIC)).toEqual([]);
  });

  it('reveals the other view only when the current one holds no error', () => {
    expect(viewToReveal('basic', ['advanced'])).toBe('advanced');
    expect(viewToReveal('advanced', ['basic'])).toBe('basic');
    expect(viewToReveal('basic', ['basic', 'advanced'])).toBe('basic');
    expect(viewToReveal('advanced', [])).toBe('advanced');
  });

  it('counts each value that is off its default or not saved, once', () => {
    const defaults = { a: 0, b: [], c: false };
    expect(advancedChangeCount({ a: 0, b: [], c: false }, defaults, defaults)).toBe(0);
    // Saved off-default values still count: nothing in the hidden view goes unnoticed.
    expect(
      advancedChangeCount({ a: 5, b: [], c: false }, { a: 5, b: [], c: false }, defaults),
    ).toBe(1);
    // An unsaved edit back to the default counts too.
    expect(
      advancedChangeCount({ a: 0, b: [], c: false }, { a: 5, b: [], c: false }, defaults),
    ).toBe(1);
    expect(
      advancedChangeCount({ a: 5, b: ['x'], c: true }, { a: 1, b: [], c: false }, defaults),
    ).toBe(3);
  });
});
