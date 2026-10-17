import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { endClockLabel, timelineLabels } from './contest-clock';

describe('contest clock labels', () => {
  beforeEach(() => vi.stubEnv('TZ', 'Asia/Ho_Chi_Minh'));
  afterEach(() => vi.unstubAllEnvs());

  it('shows bare clocks on a timeline that starts and ends on one day', () => {
    const times = { startTime: '2026-10-15T01:00:00Z', endTime: '2026-10-15T04:00:00Z' };
    expect(timelineLabels(times, 'vi')).toEqual({ start: '08:00', end: '11:00' });
  });

  it('puts the date before both clocks once the days differ', () => {
    const times = { startTime: '2026-10-15T04:27:00Z', endTime: '2026-11-15T04:27:00Z' };
    expect(timelineLabels(times, 'vi')).toEqual({ start: '15/10 11:27', end: '15/11 11:27' });
  });

  it('adds the year once the years differ', () => {
    const times = { startTime: '2026-10-15T04:27:00Z', endTime: '2027-10-15T04:27:00Z' };
    expect(timelineLabels(times, 'vi')).toEqual({
      start: '15/10/2026 11:27',
      end: '15/10/2027 11:27',
    });
  });

  it('counts the day offset of the end clock', () => {
    const times = { startTime: '2026-10-15T15:00:00Z', endTime: '2026-10-15T18:00:00Z' };
    expect(endClockLabel(times, 'vi')).toBe('01:00 (+1)');
  });
});
