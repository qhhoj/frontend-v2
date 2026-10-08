import { afterEach, describe, expect, it, vi } from 'vitest';
import { heatmapWeeks, monthStarts, todayIn, totalSubmissions } from './activity-heatmap';
import type { HeatmapCell } from './activity-heatmap';

/** Machine zones the spec runs under; the offset is January's (standard time), so the zone really changed. */
const ZONE_OFFSET_MINUTES: Record<string, number> = {
  'Asia/Ho_Chi_Minh': -420,
  'America/Los_Angeles': 480,
  UTC: 0,
};
afterEach(() => vi.unstubAllEnvs());
const cellOn = (weeks: HeatmapCell[][], date: string) =>
  weeks.flat().find((cell) => cell?.date === date);

describe('todayIn', () => {
  it('is the calendar day in the activity’s zone, not the machine’s', () => {
    const halfPastMidnightInHanoi = Date.parse('2026-10-07T17:30:00Z');
    expect(todayIn('Asia/Ho_Chi_Minh', halfPastMidnightInHanoi)).toBe('2026-10-08');
    expect(todayIn('UTC', halfPastMidnightInHanoi)).toBe('2026-10-07');
  });
});

describe('heatmapWeeks', () => {
  it('draws 53 Monday-first weeks that end on today, with nothing after today', () => {
    const weeks = heatmapWeeks({}, '2026-10-08'); // a Thursday
    expect(weeks).toHaveLength(53);
    expect(weeks[0]![0]!.date).toBe('2025-10-06'); // a Monday, 52 weeks before this week's Monday
    const lastWeek = weeks.at(-1)!;
    expect(lastWeek.map((cell) => cell?.date ?? null)).toEqual([
      '2026-10-05',
      '2026-10-06',
      '2026-10-07',
      '2026-10-08',
      null,
      null,
      null,
    ]);
  });
  it('places every day on its own calendar cell whatever the machine zone is', () => {
    for (const [zone, offset] of Object.entries(ZONE_OFFSET_MINUTES)) {
      vi.stubEnv('TZ', zone);
      expect(new Date(2026, 0, 1).getTimezoneOffset(), zone).toBe(offset);
      const weeks = heatmapWeeks({ '2026-10-07': 3 }, '2026-10-08');
      expect(weeks[0]![0]!.date, zone).toBe('2025-10-06');
      expect(
        weeks.at(-1)!.map((cell) => cell?.date ?? null),
        zone,
      ).toEqual(['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', null, null, null]);
      expect(cellOn(weeks, '2026-10-07')?.count, zone).toBe(3);
    }
  });
  it('grades the counts in quarters of the busiest day, an empty day at 0', () => {
    const cells = heatmapWeeks(
      { '2026-10-01': 1, '2026-10-02': 4, '2026-10-03': 8, '2026-10-04': 3 },
      '2026-10-08',
    ).flat();
    const levelOf = (date: string) => cells.find((cell) => cell?.date === date)?.level;
    expect(
      ['2026-09-30', '2026-10-01', '2026-10-04', '2026-10-02', '2026-10-03'].map(levelOf),
    ).toEqual([0, 1, 2, 2, 4]);
  });
});

describe('month labels and total', () => {
  it('labels the first week of each month and sums every day', () => {
    const weeks = heatmapWeeks({ '2026-10-01': 2, '2026-01-02': 5 }, '2026-10-08');
    const starts = monthStarts(weeks);
    expect(starts[0]).toEqual({ column: 0, month: 10 });
    expect(starts.map((start) => start.month)).toEqual([10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(totalSubmissions({ '2026-10-01': 2, '2026-01-02': 5 })).toBe(7);
  });
});
