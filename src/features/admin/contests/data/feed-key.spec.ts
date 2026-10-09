import { describe, expect, it } from 'vitest';
import { feedKeyStatus } from '@/test/contest-extras-fixtures';
import { absoluteUrl, canRelease, isValidKeyDays } from './feed-key';

/** icpc, 06:00Z to 10:00Z, frozen for the last 60 minutes: the freeze starts at 09:00Z. */
const contest = {
  startTime: '2026-10-08T06:00:00.000Z',
  endTime: '2026-10-08T10:00:00.000Z',
  formatName: 'icpc' as const,
  frozenLastMinutes: 60,
};
const DURING_FREEZE = Date.parse('2026-10-08T09:30:00.000Z');
const BEFORE_FREEZE = Date.parse('2026-10-08T08:00:00.000Z');

describe('feed key rules', () => {
  it('offers the release only for an unreleased frozen-until-release key during the freeze', () => {
    expect(canRelease(feedKeyStatus(), contest, DURING_FREEZE)).toBe(true);
    expect(canRelease(feedKeyStatus(), contest, BEFORE_FREEZE)).toBe(false);
    expect(canRelease(feedKeyStatus({ mode: 'live' }), contest, DURING_FREEZE)).toBe(false);
    expect(canRelease(feedKeyStatus({ isActive: false }), contest, DURING_FREEZE)).toBe(false);
    expect(canRelease(feedKeyStatus(), { ...contest, frozenLastMinutes: 0 }, DURING_FREEZE)).toBe(
      false,
    );
  });

  it('counts a release only for the freeze in progress', () => {
    const releasedNow = feedKeyStatus({ releasedAt: '2026-10-08T09:10:00.000Z' });
    const releasedEarlier = feedKeyStatus({ releasedAt: '2026-10-08T08:30:00.000Z' });
    expect(canRelease(releasedNow, contest, DURING_FREEZE)).toBe(false);
    expect(canRelease(releasedEarlier, contest, DURING_FREEZE)).toBe(true);
  });

  it('accepts 1 to 30 whole days', () => {
    expect([1, 14, 30].map(isValidKeyDays)).toEqual([true, true, true]);
    expect([0, 31, 2.5, Number.NaN].map(isValidKeyDays)).toEqual([false, false, false, false]);
  });

  it('turns an API path into the full address a resolver needs', () => {
    expect(absoluteUrl('/api/internal/contests/r42/feed', 'https://oj.example')).toBe(
      'https://oj.example/api/internal/contests/r42/feed',
    );
  });
});
