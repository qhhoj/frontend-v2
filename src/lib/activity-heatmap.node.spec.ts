import { afterEach, describe, expect, it, vi } from 'vitest';
import { heatmapWeeks } from './activity-heatmap';
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
