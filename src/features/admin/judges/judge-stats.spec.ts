import { describe, expect, it } from 'vitest';
import { JUDGE_FLEET, judge } from '@/test/admin-fixtures/judges';
import { JUDGE_NAME_PATTERN, judgeStats, judgeStatus, pingMs } from './judge-stats';

describe('judge stats', () => {
  it('counts online, blocked and disabled judges and averages the load of the online ones', () => {
    expect(judgeStats(JUDGE_FLEET)).toEqual({
      online: 3,
      total: 5,
      meanLoad: 0.28,
      blocked: 1,
      disabled: 1,
    });
  });

  it('has no mean load when no online judge reports one', () => {
    expect(judgeStats([judge({ online: false, load: null })]).meanLoad).toBeNull();
  });

  it('turns the API’s seconds into whole milliseconds', () => {
    expect(pingMs(0.0114)).toBe(11);
    expect(pingMs(null)).toBeNull();
  });

  it('names blocked before disabled before online', () => {
    expect(judgeStatus(judge({ isBlocked: true, isDisabled: true, online: true }))).toBe('blocked');
    expect(judgeStatus(judge({ isDisabled: true, online: false }))).toBe('disabled');
    expect(judgeStatus(judge({ online: true }))).toBe('online');
    expect(judgeStatus(judge({ online: false }))).toBe('offline');
  });

  it('accepts hostname-style names only', () => {
    expect(JUDGE_NAME_PATTERN.test('qhh-judge-06')).toBe(true);
    expect(JUDGE_NAME_PATTERN.test('bad name')).toBe(false);
    expect(JUDGE_NAME_PATTERN.test('x'.repeat(51))).toBe(false);
  });
});
