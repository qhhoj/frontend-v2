import { describe, expect, it } from 'vitest';
import { commentRevision } from '@/test/community-fixtures';
import { unifiedDiff, versionsOf } from './revision-versions';

describe('versionsOf', () => {
  it('turns newest-first revisions into every version, the original last', () => {
    const second = commentRevision({ at: '2026-10-10T08:21:00Z', before: 'B', after: 'C' });
    const first = commentRevision({ at: '2026-10-10T07:52:00Z', before: 'A', after: 'B' });
    expect(
      versionsOf([second, first]).map(({ edit, text, previous, at }) => [edit, text, previous, at]),
    ).toEqual([
      [2, 'C', 'B', '2026-10-10T08:21:00Z'],
      [1, 'B', 'A', '2026-10-10T07:52:00Z'],
      [0, 'A', null, null],
    ]);
  });
  it('is empty for a comment never edited', () => {
    expect(versionsOf([])).toEqual([]);
  });
});

describe('unifiedDiff', () => {
  it('marks removed and added lines and keeps the rest', () => {
    expect(unifiedDiff('a\nb\nc', 'a\nB\nc\nd')).toEqual([
      { kind: 'same', text: 'a' },
      { kind: 'removed', text: 'b' },
      { kind: 'added', text: 'B' },
      { kind: 'same', text: 'c' },
      { kind: 'added', text: 'd' },
    ]);
  });
});
