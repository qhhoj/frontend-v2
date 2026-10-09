import { describe, expect, it } from 'vitest';
import { tagColorAt } from './tag-colors';

describe('tag colours', () => {
  it('cycles through the eight colours by index, never out of range', () => {
    expect([0, 1, 7, 8, 9, 15, 16].map(tagColorAt)).toEqual([
      'tag-1',
      'tag-2',
      'tag-8',
      'tag-1',
      'tag-2',
      'tag-8',
      'tag-1',
    ]);
    expect(tagColorAt(-1)).toBe('tag-8');
  });
});
