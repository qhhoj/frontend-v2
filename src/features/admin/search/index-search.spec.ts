import { describe, expect, it } from 'vitest';
import { highlightParts, phaseFromQuery, searchQueryOf } from './index-search';

describe('highlightParts', () => {
  it('marks every hit, ignoring case, and keeps the original text', () => {
    expect(highlightParts('HCMUS Open hcmus', 'hcmus')).toEqual([
      { text: 'HCMUS', isHit: true },
      { text: ' Open ', isHit: false },
      { text: 'hcmus', isHit: true },
    ]);
  });

  it('reads the query literally, not as a pattern', () => {
    expect(highlightParts('c++ and c', 'c++')).toEqual([
      { text: 'c++', isHit: true },
      { text: ' and c', isHit: false },
    ]);
  });

  it('marks nothing for an empty query or a text without the query', () => {
    expect(highlightParts('hcmus', '')).toEqual([{ text: 'hcmus', isHit: false }]);
    expect(highlightParts('hcmus', 'xyz')).toEqual([{ text: 'hcmus', isHit: false }]);
  });
});

describe('phaseFromQuery', () => {
  it('accepts the three phases and reads anything else as no filter', () => {
    expect(phaseFromQuery('running')).toBe('running');
    expect(phaseFromQuery('all')).toBeNull();
    expect(phaseFromQuery('later')).toBeNull();
    expect(phaseFromQuery(undefined)).toBeNull();
  });
});

describe('searchQueryOf', () => {
  it('sets the text, keeps the phase and sends the list back to page 1', () => {
    expect(searchQueryOf({ phase: 'ended', page: '3' }, { q: 'hcmus' })).toEqual({
      phase: 'ended',
      q: 'hcmus',
      page: undefined,
    });
  });

  it('drops an empty text and the "all" phase', () => {
    expect(searchQueryOf({ q: 'hcmus', phase: 'ended' }, { q: '', phase: null })).toEqual({
      q: undefined,
      phase: undefined,
      page: undefined,
    });
  });
});
