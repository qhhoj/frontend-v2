import { describe, expect, it } from 'vitest';
import { submissionItem } from '@/test/fixtures';
import { isProblemDeleted } from './deleted-problem';

describe('isProblemDeleted', () => {
  it('is true only for a row whose problem the server flags as deleted', () => {
    const gone = submissionItem({ problem: { code: 'x', name: 'X', isDeleted: true } });
    expect(isProblemDeleted(gone)).toBe(true);
    expect(isProblemDeleted(submissionItem())).toBe(false);
    expect(isProblemDeleted(submissionItem({ problem: null }))).toBe(false);
    expect(isProblemDeleted(undefined)).toBe(false);
  });
});
