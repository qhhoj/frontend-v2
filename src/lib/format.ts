import type { Locale } from '@/i18n';

const INTL_LOCALES: Record<Locale, string> = { vi: 'vi-VN', en: 'en-US' };
const pad = (value: number) => String(value).padStart(2, '0');

/** `HH:MM:SS`; hours are not wrapped into days (a 14-day contest shows 335:59:59). */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`;
}

/** `H:MM` since the contest start, as ranking cells show it. */
export function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  return `${Math.floor(minutes / 60)}:${pad(minutes % 60)}`;
}

export const formatNumber = (
  value: number,
  locale: Locale,
  fractionDigits = 0,
  useGrouping = true,
) =>
  new Intl.NumberFormat(INTL_LOCALES[locale], {
    maximumFractionDigits: fractionDigits,
    useGrouping,
  }).format(value);

export function formatRelative(date: string, now: number, locale: Locale): string {
  const seconds = Math.round((Date.parse(date) - now) / 1000);
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

export const greetingKey = (hour: number) =>
  hour >= 5 && hour < 11
    ? 'home.greeting.morning'
    : hour >= 11 && hour < 18
      ? 'home.greeting.afternoon'
      : 'home.greeting.evening';

export const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => Array.from(word)[0] ?? '')
    .join('')
    .toLocaleUpperCase();

/** Stable 0..5 pick of a token-pill gradient for a code or username. */
export const coinIndex = (seed: string) =>
  Array.from(seed).reduce((hash, symbol) => (hash * 31 + symbol.codePointAt(0)!) % 9973, 7) % 6;

/** `seconds` with one decimal, two when needed: 1 -> `1.0s`, 0.25 -> `0.25s`. */
export const formatTimeLimit = (seconds: number) =>
  `${Number.isInteger(seconds * 10) ? seconds.toFixed(1) : seconds.toFixed(2)}s`;
/** Problem and case memory are KiB (legacy `memory_limit`). */
export const formatMemoryLimit = (kib: number) => `${Number((kib / 1024).toFixed(1))}MB`;
export const formatCaseTime = (seconds: number) => `${seconds.toFixed(2)}s`;
export const formatCaseMemory = (kib: number) =>
  `${(Math.floor((kib / 1024) * 10) / 10).toFixed(1)} MB`;

const BYTES_PER_MEGABYTE = 1024 * 1024;
/** `1887437` -> `1.8 MB` (floored like `formatCaseMemory`), below 1 MB in whole KB. */
export const formatFileSize = (bytes: number) =>
  bytes >= BYTES_PER_MEGABYTE
    ? `${(Math.floor((bytes / BYTES_PER_MEGABYTE) * 10) / 10).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;

/** An instant in the viewer's own time zone (a contestant must see 14:05 for 14:05), e.g. `Oct 8, 2026, 10:00 AM`. */
export const formatDateTime = (date: string, locale: Locale) =>
  new Intl.DateTimeFormat(INTL_LOCALES[locale], { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(date),
  );

/** The UTC calendar date of a timestamp (the site time zone is not known to the SPA), e.g. `Oct 8, 2026`. */
export const formatDate = (date: string, locale: Locale) =>
  new Intl.DateTimeFormat(INTL_LOCALES[locale], { dateStyle: 'medium', timeZone: 'UTC' }).format(
    new Date(date),
  );

/** Contest start and end are instants: they show in the viewer's own zone (decisions.md, "Dates from the API"). */
export const formatClock = (date: string, locale: Locale) =>
  new Intl.DateTimeFormat(INTL_LOCALES[locale], {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(date));

/** The list's date chip: day number and short month (`11` / `thg 10`). */
export function formatDayMonth(date: string, locale: Locale): { day: string; month: string } {
  const instant = new Date(date);
  return {
    day: new Intl.DateTimeFormat(INTL_LOCALES[locale], { day: 'numeric' }).format(instant),
    month: new Intl.DateTimeFormat(INTL_LOCALES[locale], { month: 'short' }).format(instant),
  };
}

/** `04/10` (vi) or `10/04` (en): the day and month parts joined with a slash, whatever separator ICU picks. */
export const formatShortDate = (date: string, locale: Locale) =>
  new Intl.DateTimeFormat(INTL_LOCALES[locale], { day: '2-digit', month: '2-digit' })
    .formatToParts(new Date(date))
    .filter((part) => part.type === 'day' || part.type === 'month')
    .map((part) => part.value)
    .join('/');

/** `Thứ Năm, 08/10/2026`: the detail's date line. */
export const formatWeekdayDate = (date: string, locale: Locale) =>
  new Intl.DateTimeFormat(INTL_LOCALES[locale], {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));

/** `H:MM:SS` since the contest start: the time line of a points cell (Cells A). */
export function formatElapsedSeconds(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(seconds / 3600)}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`;
}
