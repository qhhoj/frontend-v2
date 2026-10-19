import type { Locale } from '@/i18n';
import { formatNumber } from './format';
import { formatDate, formatMonthName } from './format-date';

export const MEBIBYTE = 1024 * 1024;
const FULL_PERCENT = 100;

/** Storage in the unit the quota is set in: `410 MiB`, one decimal at most. */
export const formatMebibytes = (bytes: number, locale: Locale): string =>
  `${formatNumber(bytes / MEBIBYTE, locale, 1)} MiB`;

/** `percent` is the honest share (may pass 100); `barPercent` is the bar's width (0..100). */
export function meterPercent(meter: { used: number; limit: number }): {
  percent: number;
  barPercent: number;
} {
  if (meter.limit <= 0) {
    const full = meter.used > 0 ? FULL_PERCENT : 0;
    return { percent: full, barPercent: full };
  }
  const percent = Math.floor((meter.used * FULL_PERCENT) / meter.limit);
  return { percent, barPercent: Math.min(FULL_PERCENT, percent) };
}

/** The year and month number of a usage month `YYYY-MM`. */
const parseUsageMonth = (month: string): [year: number, monthNumber: number] => {
  const [year, monthNumber] = month.split('-').map(Number);
  return [year ?? 1970, monthNumber ?? 1];
};

/** The usage month `YYYY-MM` (site time zone, from the server) as a month name without the year ("tháng 10", board M7A); the one place besides the contest day tile that spells a month, and no zone shifts it. */
export function monthLabel(month: string, locale: Locale): string {
  const [year, monthNumber] = parseUsageMonth(month);
  return formatMonthName(year, monthNumber, locale);
}

/**
 * The day the quota resets, the first of the month after `month`, as a `short` date ("01/11", "11/01" in English; December's
 * reset reads "01/01/2027" once the year is not the current one), built in UTC so no zone shifts it (board M7A's "cho đến 01/11").
 */
export function nextMonthStart(month: string, locale: Locale): string {
  const [year, monthNumber] = parseUsageMonth(month);
  return formatDate(Date.UTC(year, monthNumber, 1), 'short', locale, { timeZone: 'UTC' });
}
