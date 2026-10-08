export type HeatmapLevel = 0 | 1 | 2 | 3 | 4;
export type HeatmapCell = { date: string; count: number; level: HeatmapLevel } | null;
const DAY_MS = 86_400_000;
const WEEKS = 53;
const DAYS_PER_WEEK = 7;

/** `YYYY-MM-DD` of `now` in `timezone` (`en-CA` formats dates that way). */
export const todayIn = (timezone: string, now: number) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

/*
 * Day keys are calendar dates. All arithmetic is in UTC milliseconds of each day's midnight: `new Date('YYYY-MM-DD')` is UTC, but
 * local getters or a local constructor would shift the grid by one day in any zone east or west of UTC.
 */
const keyToUtc = (key: string) =>
  Date.UTC(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, Number(key.slice(8, 10)));
const utcToKey = (time: number) => new Date(time).toISOString().slice(0, 10);
/** Monday = 0 … Sunday = 6. */
const weekdayOf = (time: number) => (new Date(time).getUTCDay() + 6) % 7;

/** Quarters of the busiest day; any submission shows at least level 1. */
export const levelOf = (count: number, busiest: number): HeatmapLevel =>
  count === 0 ? 0 : (Math.min(4, Math.ceil((count / busiest) * 4)) as HeatmapLevel);

/** 53 Monday-first weeks ending in the week of `today`; days after `today` are null. */
export function heatmapWeeks(days: Record<string, number>, today: string): HeatmapCell[][] {
  const todayTime = keyToUtc(today);
  const thisMonday = todayTime - weekdayOf(todayTime) * DAY_MS;
  const firstMonday = thisMonday - (WEEKS - 1) * DAYS_PER_WEEK * DAY_MS;
  const busiest = Math.max(1, ...Object.values(days));
  return Array.from({ length: WEEKS }, (_week, column) =>
    Array.from({ length: DAYS_PER_WEEK }, (_day, row): HeatmapCell => {
      const time = firstMonday + (column * DAYS_PER_WEEK + row) * DAY_MS;
      if (time > todayTime) return null;
      const date = utcToKey(time);
      const count = days[date] ?? 0;
      return { date, count, level: levelOf(count, busiest) };
    }),
  );
}

/** The column where each month first appears (by the week's Monday), month 1..12. */
export function monthStarts(weeks: HeatmapCell[][]): { column: number; month: number }[] {
  const starts: { column: number; month: number }[] = [];
  let previousMonth = 0;
  weeks.forEach((week, column) => {
    const month = Number(week[0]?.date.slice(5, 7));
    if (month !== previousMonth) starts.push({ column, month });
    previousMonth = month;
  });
  return starts;
}

export const totalSubmissions = (days: Record<string, number>) =>
  Object.values(days).reduce((sum, count) => sum + count, 0);
