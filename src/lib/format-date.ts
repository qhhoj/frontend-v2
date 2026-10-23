import type { Locale } from '@/i18n';
import { INTL_LOCALES } from '@/lib/format';

/*
 * The one module that turns an instant into text (scripts/date-format-calls.mjs bans `toLocale*String` and `Intl.DateTimeFormat` elsewhere).
 * Pick the preset by what the reader needs, never by what looks tidy:
 *   short            08/10      the day in a compact spot; the year comes back (08/10/2025) once it is not the current one
 *   date             08/10/2026 a record's calendar day: lists, profiles, posts
 *   datetime         08/10/2026 20:12     an event: logs, tickets, queues, contest schedules, dashboards
 *   datetimeSeconds  08/10/2026 20:12:09  audit and activity logs only, where the order inside a minute matters
 * The day and month follow the locale (vi day first, en month first); the clock is 24-hour in both. Everything shows in the
 * viewer's own time zone unless `options.timeZone` names another (the admin site zone). Kept apart from the presets, each below:
 * relative times (`formatRelative`, `formatAgo*`), the contest list's day tile (`formatDayTile`), a month's name (`formatMonthName`), the hero's
 * weekday line (`formatWeekdayDate`) and the rating chart's `mm/yy` ticks (`formatMonthYear`).
 */
export type DatePreset = 'short' | 'date' | 'datetime' | 'datetimeSeconds';
export type DateInput = string | number | Date;
export interface DateOptions {
  /** An IANA zone; the viewer's own by default. */
  timeZone?: string;
  /** What `short` takes as the current year's instant; default `Date.now()`. */
  now?: number;
}

/** The calendar and clock fields of an instant in one zone. */
export interface WallClock {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

/** The wall clock at `date` in `timeZone` (the viewer's by default). */
export function wallClockIn(date: DateInput, timeZone?: string): WallClock {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(new Date(date));
  const field = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return {
    year: field('year'),
    month: field('month'),
    day: field('day'),
    hour: field('hour'),
    minute: field('minute'),
    second: field('second'),
  };
}

/** `YYYY-MM-DD` of the calendar day `date` falls on in `timeZone` (the viewer's by default): a key to compare, not a text to show. */
export function formatDayKey(date: DateInput, timeZone?: string): string {
  const { year, month, day } = wallClockIn(date, timeZone);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** The IANA name of the viewer's zone (`Asia/Ho_Chi_Minh`). */
export const viewerTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

const IS_DAY_FIRST: Record<Locale, boolean> = { vi: true, en: false };
const pad = (value: number) => String(value).padStart(2, '0');

const dayMonth = (clock: WallClock, locale: Locale) =>
  IS_DAY_FIRST[locale]
    ? `${pad(clock.day)}/${pad(clock.month)}`
    : `${pad(clock.month)}/${pad(clock.day)}`;
const numericDate = (clock: WallClock, locale: Locale) =>
  `${dayMonth(clock, locale)}/${clock.year}`;
const minuteClock = (clock: WallClock) => `${pad(clock.hour)}:${pad(clock.minute)}`;
/** Whether `year` is the calendar year of `now` (the current instant by default) in the zone. */
const isCurrentYear = (year: number, now: number | undefined, timeZone?: string) =>
  year === wallClockIn(now ?? Date.now(), timeZone).year;

/** Formats `date` as one of the presets, in the locale's order of day and month. */
export function formatDate(
  date: DateInput,
  preset: DatePreset,
  locale: Locale,
  options: DateOptions = {},
): string {
  const clock = wallClockIn(date, options.timeZone);
  switch (preset) {
    case 'short':
      return isCurrentYear(clock.year, options.now, options.timeZone)
        ? dayMonth(clock, locale)
        : numericDate(clock, locale);
    case 'date':
      return numericDate(clock, locale);
    case 'datetime':
      return `${numericDate(clock, locale)} ${minuteClock(clock)}`;
    case 'datetimeSeconds':
      return `${numericDate(clock, locale)} ${minuteClock(clock)}:${pad(clock.second)}`;
  }
}

/** `20:12`, or `20:12:09` with `seconds`: the 24-hour time of day, for a time the reader already places on a day. */
export function formatClock(
  date: DateInput,
  options: { seconds?: boolean; timeZone?: string } = {},
): string {
  const clock = wallClockIn(date, options.timeZone);
  return options.seconds ? `${minuteClock(clock)}:${pad(clock.second)}` : minuteClock(clock);
}

/** The text of the contest list's day tile: the day number, the short month (`thg 10`) and the year once it is not the current one. */
export interface DayTile {
  day: string;
  month: string;
  year: string | null;
}

/** The day tile of an instant, in the viewer's zone; `now` is the current instant, default `Date.now()`. */
export function formatDayTile(date: string, locale: Locale, now?: number): DayTile {
  // One formatter for both parts: the combined pattern gives the short month its tile form (`thg 10`).
  const parts = new Intl.DateTimeFormat(INTL_LOCALES[locale], {
    day: 'numeric',
    month: 'short',
  }).formatToParts(new Date(date));
  const valueOf = (type: 'day' | 'month') => parts.find((part) => part.type === type)?.value ?? '';
  const { year } = wallClockIn(date);
  return {
    day: valueOf('day'),
    month: valueOf('month'),
    year: isCurrentYear(year, now) ? null : String(year),
  };
}

/**
 * `Thứ Năm, 08/10/2026`: the weekday and the date. The contest hero is the only place that spells the weekday (it says which
 * day of the week a one-day contest falls on); every other date stays a plain preset.
 */
export const formatWeekdayDate = (date: string, locale: Locale) =>
  `${new Intl.DateTimeFormat(INTL_LOCALES[locale], { weekday: 'long' }).format(new Date(date))}, ${formatDate(date, 'date', locale)}`;

/** The month and two-digit year as `09/25` in both locales, for the tick labels of a chart axis that has 44 px a tick. */
export const formatMonthYear = (date: string) => {
  const clock = wallClockIn(date);
  return `${pad(clock.month)}/${pad(clock.year % 100)}`;
};

/** The name of a calendar month without the year ("Tháng 10", "October"), built in UTC so no zone shifts it. */
export const formatMonthName = (year: number, month: number, locale: Locale) =>
  new Intl.DateTimeFormat(INTL_LOCALES[locale], { month: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  );

const WEEK_MS = 7 * 86_400_000;
const COMPACT_UNITS = [
  { unit: 'second', seconds: 1 },
  { unit: 'minute', seconds: 60 },
  { unit: 'hour', seconds: 3600 },
  { unit: 'day', seconds: 86_400 },
] as const;

/** A time this far ahead of the clock is skew between the server and the browser (a fresh item), not a future moment. */
const CLOCK_SKEW_SECONDS = 30;

export function formatRelative(date: string, now: number, locale: Locale): string {
  const offset = Math.round((Date.parse(date) - now) / 1000);
  const seconds = offset > 0 && offset <= CLOCK_SKEW_SECONDS ? 0 : offset;
  const magnitude = Math.abs(seconds);
  const [value, unit]: [number, Intl.RelativeTimeFormatUnit] =
    magnitude < 60
      ? [seconds, 'second']
      : magnitude < 3600
        ? [Math.round(seconds / 60), 'minute']
        : magnitude < 86_400
          ? [Math.round(seconds / 3600), 'hour']
          : [Math.round(seconds / 86_400), 'day'];
  return new Intl.RelativeTimeFormat(INTL_LOCALES[locale], { numeric: 'auto' }).format(value, unit);
}

/** "5 phút" / "5m", "3 giờ" / "3h" within a week (a table cell under a "when" heading needs no "ago"), the `short` date after. */
export function formatAgoCompact(date: string, now: number, locale: Locale): string {
  const elapsed = Math.max(0, now - Date.parse(date));
  if (elapsed > WEEK_MS) return formatDate(date, 'short', locale, { now });
  const seconds = Math.floor(elapsed / 1000);
  const { unit, seconds: size } =
    COMPACT_UNITS.filter((entry) => seconds >= entry.seconds).pop() ?? COMPACT_UNITS[0];
  return new Intl.NumberFormat(INTL_LOCALES[locale], {
    style: 'unit',
    unit,
    unitDisplay: 'narrow',
  }).format(Math.floor(seconds / size));
}

/** "2 giờ trước" within a week, the `date` after. */
export const formatAgo = (date: string, now: number, locale: Locale) =>
  now - Date.parse(date) <= WEEK_MS
    ? formatRelative(date, now, locale)
    : formatDate(date, 'date', locale);
