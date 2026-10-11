import { describe, expect, it } from 'vitest';
import { JUDGE_FLEET, judge } from '@/test/admin-fixtures/judges';
import { judgeStats, judgeStatus, matchesJudge } from './judge-stats';

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

  it('names blocked before disabled before online', () => {
    expect(judgeStatus(judge({ isBlocked: true, isDisabled: true, online: true }))).toBe('blocked');
    expect(judgeStatus(judge({ isDisabled: true, online: false }))).toBe('disabled');
    expect(judgeStatus(judge({ online: true }))).toBe('online');
    expect(judgeStatus(judge({ online: false }))).toBe('offline');
  });

  it('filters each tile by the flag it counts, so a tile lists as many judges as its number', () => {
    const stats = judgeStats(JUDGE_FLEET);
    for (const status of ['online', 'blocked', 'disabled'] as const) {
      const listed = JUDGE_FLEET.filter((each) => matchesJudge(each, { status, search: '' }));
      expect(listed).toHaveLength(stats[status]);
    }
  });
});
