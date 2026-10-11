import { describe, expect, it } from 'vitest';
import { polygonPackage, polygonLinkState } from '@/test/admin-fixtures/polygon';
import { canSyncNow, linkStatusOf } from './polygon-link';

describe('linkStatusOf', () => {
  it('says a newer READY revision is waiting', () => {
    expect(linkStatusOf(polygonLinkState({ revision: 12 }))).toBe('newer');
  });

  it('says up to date when the newest READY package is the one in use', () => {
    expect(
      linkStatusOf(
        polygonLinkState(
          { revision: 14 },
          polygonPackage({ id: 11, revision: 14, state: 'READY' }),
        ),
      ),
    ).toBe('upToDate');
  });

  it('puts a failed last sync before anything Polygon says', () => {
    expect(linkStatusOf(polygonLinkState({ lastSyncResult: 'failed' }))).toBe('syncFailed');
  });

  it('cannot tell when Polygon could not be asked, and waits on a package still building', () => {
    expect(linkStatusOf(polygonLinkState({}, null))).toBe('unknown');
    expect(
      linkStatusOf(
        polygonLinkState({}, polygonPackage({ id: 12, revision: 15, state: 'RUNNING' })),
      ),
    ).toBe('notReady');
  });
});

describe('canSyncNow', () => {
  it('needs a READY newest package, even the one already synced', () => {
    expect(canSyncNow(polygonLinkState({ revision: 14 }))).toBe(true);
    expect(
      canSyncNow(polygonLinkState({}, polygonPackage({ id: 1, revision: 2, state: 'FAILED' }))),
    ).toBe(false);
    expect(canSyncNow(polygonLinkState({}, null))).toBe(false);
  });
});
