import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { endClockLabel, timelineLabels } from './contest-clock';

describe('contest clock labels', () => {
  beforeEach(() => vi.stubEnv('TZ', 'Asia/Ho_Chi_Minh'));
  afterEach(() => vi.unstubAllEnvs());

  it('shows bare clocks on a timeline that starts and ends on one day', () => {
    const times = { startTime: '2026-10-15T01:00:00Z', endTime: '2026-10-15T04:00:00Z' };
    expect(timelineLabels(times, 'vi')).toEqual({ start: '08:00', end: '11:00' });
  });

  it('shows the full datetime of both ends once the days differ, in any year', () => {
    const sameYear = { startTime: '2026-10-15T04:27:00Z', endTime: '2026-11-15T04:27:00Z' };
    expect(timelineLabels(sameYear, 'vi')).toEqual({
      start: '15/10/2026 11:27',
      end: '15/11/2026 11:27',
    });
    const nextYear = { startTime: '2026-10-15T04:27:00Z', endTime: '2027-10-15T04:27:00Z' };
    expect(timelineLabels(nextYear, 'vi')).toEqual({
      start: '15/10/2026 11:27',
      end: '15/10/2027 11:27',
    });
  });

  it('counts the day offset of the end clock', () => {
    const times = { startTime: '2026-10-15T15:00:00Z', endTime: '2026-10-15T18:00:00Z' };
    expect(endClockLabel(times)).toBe('01:00 (+1)');
  });
});
