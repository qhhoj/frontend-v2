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

describe('highlightParts on Unicode', () => {
  it('keeps every position when a case fold would change the length of a character', () => {
    expect(highlightParts('İx İx', 'x')).toEqual([
      { text: 'İ', isHit: false },
      { text: 'x', isHit: true },
      { text: ' İ', isHit: false },
      { text: 'x', isHit: true },
    ]);
  });

  it('returns composed text, so the parts add up to the NFC text', () => {
    const parts = highlightParts('Việt'.normalize('NFD'), 'vi');
    expect(parts.map((part) => part.text).join('')).toBe('Việt');
    expect(parts[0]).toEqual({ text: 'Vi', isHit: true });
  });
});
