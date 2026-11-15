import { describe, expect, it } from 'vitest';
import { isHistoryMove, parseListSetup, restoredQuery } from './problem-list-setup';

const saved = (value: unknown) => JSON.stringify(value);

describe('the remembered problem list setup', () => {
  it('belongs to one account and drops values the list would refuse', () => {
    const mine = saved({ user: 'bitcoder', solved: 'unsolved', sort: '-points' });
    expect(parseListSetup(mine, 'bitcoder')).toEqual({ solved: 'unsolved', sort: '-points' });
    expect(parseListSetup(mine, 'someone')).toBeNull();
    expect(
      parseListSetup(saved({ user: 'bitcoder', solved: 'yes', sort: null }), 'bitcoder'),
    ).toBeNull();
    expect(
      parseListSetup(saved({ user: 'bitcoder', solved: 'any', sort: 'bogus' }), 'bitcoder'),
    ).toBeNull();
    expect(parseListSetup('{not json', 'bitcoder')).toBeNull();
    expect(parseListSetup(null, 'bitcoder')).toBeNull();
  });

  it('opens a bare list with the setup, and leaves any list whose URL says something alone', () => {
    const setup = { solved: 'unsolved' as const, sort: '-points' as const };
    expect(restoredQuery({}, setup)).toMatchObject({ unsolved: '1', sort: '-points' });
    expect(restoredQuery({ search: 'dp' }, setup)).toBeNull();
    expect(restoredQuery({ page: '2' }, setup)).toBeNull();
    expect(restoredQuery({}, { solved: 'any', sort: null })).toBeNull();
    expect(restoredQuery({}, null)).toBeNull();
  });

  it('leaves Back and Forward alone, but restores on a push or the first load', () => {
    expect(isHistoryMove(false, '/problems', '/problems')).toBe(true);
    expect(isHistoryMove(false, '/', '/problems')).toBe(false);
    expect(isHistoryMove(true, '/problems', '/problems')).toBe(false);
  });
});
