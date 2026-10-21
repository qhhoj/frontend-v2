import { describe, expect, it } from 'vitest';
import { polygonPackage, polygonLinkState } from '@/test/admin-fixtures/polygon';
import { bannerActionOf, bannerKindOf, canSyncNow } from './polygon-link';

const idle = { isRunning: false, isSaved: false };
const failed = polygonLinkState({
  lastSyncResult: 'failed',
  lastSyncErrorCode: 'checker_unsupported',
});

describe('bannerKindOf', () => {
  it('says a newer READY revision is waiting, or that the newest one is in use', () => {
    expect(bannerKindOf(polygonLinkState({ revision: 12 }), idle)).toBe('newer');
    const current = polygonLinkState({ revision: 14 }, polygonPackage({ id: 11, revision: 14 }));
    expect(bannerKindOf(current, idle)).toBe('upToDate');
  });

  it('cannot tell when Polygon could not be asked, and waits on a package still building', () => {
    expect(bannerKindOf(polygonLinkState({}, null), idle)).toBe('unknown');
    const building = polygonPackage({ id: 12, revision: 15, state: 'RUNNING' });
    expect(bannerKindOf(polygonLinkState({}, building), idle)).toBe('notReady');
  });

  it('puts a failed last sync before the package, and tells a repairable import apart', () => {
    expect(bannerKindOf(failed, idle)).toBe('failed');
    const attention = polygonLinkState({
      lastSyncResult: 'failed',
      lastSyncErrorCode: 'imported_needs_attention',
    });
    expect(bannerKindOf(attention, idle)).toBe('attention');
  });

  it('puts a running sync first, then options saved since the last sync', () => {
    expect(bannerKindOf(failed, { isRunning: true, isSaved: true })).toBe('running');
    expect(bannerKindOf(failed, { isRunning: false, isSaved: true })).toBe('saved');
  });
});

describe('bannerActionOf', () => {
  it('fixes a failure the options caused with the options, never a blind sync', () => {
    expect(bannerActionOf('failed', failed, true)).toBe('editOptions');
    expect(bannerActionOf('failed', failed, false)).toBe('sync');
  });

  it('syncs a newer package, saved options and a repairable import; nothing while running or current', () => {
    const state = polygonLinkState();
    expect(
      ['newer', 'saved', 'attention'].map((kind) => bannerActionOf(kind as never, state, false)),
    ).toEqual(['sync', 'sync', 'sync']);
    expect(bannerActionOf('running', state, false)).toBeNull();
    expect(bannerActionOf('upToDate', state, false)).toBeNull();
  });

  it('offers no sync without a READY package', () => {
    const building = polygonLinkState({}, polygonPackage({ state: 'RUNNING' }));
    expect(bannerActionOf('saved', building, false)).toBeNull();
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
