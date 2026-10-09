import { describe, expect, it } from 'vitest';
import { bulkResult } from '@/test/f4-fixtures';
import { isFullSuccess, remainingSelection, rowTextKey } from './bulk-outcome';

describe('bulk outcome', () => {
  const partial = bulkResult([
    ['lhp_tree', 'done'],
    ['lhp_sp', 'done'],
    ['lhp_old', 'skipped'],
  ]);

  it('keeps only the codes that were not done selected', () => {
    expect(remainingSelection(['lhp_tree', 'lhp_sp', 'lhp_old'], partial)).toEqual(['lhp_old']);
  });

  it('is a full success only when nothing was skipped', () => {
    expect(isFullSuccess(partial)).toBe(false);
    expect(isFullSuccess(bulkResult([['lhp_tree', 'done']]))).toBe(true);
  });

  it('names each row by its outcome', () => {
    expect(partial.results.map(rowTextKey)).toEqual([
      'orgProblems.bulk.rowDone',
      'orgProblems.bulk.rowDone',
      'orgProblems.bulk.rowNotFound',
    ]);
  });
});
