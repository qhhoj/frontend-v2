import { describe, expect, it } from 'vitest';
import { commentIdFromHash, pageToOpen } from './comment-jump';

describe('commentIdFromHash', () => {
  it('ignores other hashes and an empty id', () => {
    expect(commentIdFromHash('#comments')).toBeNull();
    expect(commentIdFromHash('#comment-')).toBeNull();
    expect(commentIdFromHash('')).toBeNull();
  });
});

describe('pageToOpen', () => {
  const location = (pageNumber: number, key = 'aplusb') => ({
    page: { type: 'problem' as const, key, title: 'A + B' },
    pageNumber,
  });
  const shown = { type: 'problem' as const, key: 'aplusb', page: 1 };
  it('opens the listing page that holds the comment', () => {
    expect(pageToOpen(location(3), shown)).toBe(3);
  });
  it('stays when the comment is on the page shown', () => {
    expect(pageToOpen(location(1), shown)).toBeNull();
  });
  it('stays when the comment belongs to another commented page', () => {
    expect(pageToOpen(location(2, 'other'), shown)).toBeNull();
  });
});
