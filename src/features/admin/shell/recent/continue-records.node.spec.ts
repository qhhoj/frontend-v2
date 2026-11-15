import { describe, expect, it } from 'vitest';
import { continueRecords, recordOf } from './continue-records';
import type { RecentScreen } from './recent-screens';

const visit = (path: string, titleKey = 'admin.shell.screens.x'): RecentScreen => ({
  path,
  titleKey,
  detail: null,
  visits: 1,
});

describe('recordOf', () => {
  it('reads the record of an editor tab and nothing else', () => {
    expect(recordOf('/admin/problems/aplusb/data')).toEqual({ kind: 'problem', id: 'aplusb' });
    expect(recordOf('/admin/contests/final/ranking')).toEqual({ kind: 'contest', id: 'final' });
    for (const path of [
      '/admin/problems',
      '/admin/problems/new',
      '/admin/contests/new',
      '/admin/users',
    ]) {
      expect(recordOf(path)).toBeNull();
    }
  });
});

describe('continueRecords', () => {
  it('keeps the newest tab of each record, in order, up to the limit', () => {
    const recent = [
      visit('/admin/problems/a/data', 'data'),
      visit('/admin/users'),
      visit('/admin/problems/a/general', 'general'),
      visit('/admin/contests/c/general'),
    ];
    expect(continueRecords(recent).map((row) => [row.kind, row.id, row.path])).toEqual([
      ['problem', 'a', '/admin/problems/a/data'],
      ['contest', 'c', '/admin/contests/c/general'],
    ]);
    expect(continueRecords(recent, 1)).toHaveLength(1);
  });
});
