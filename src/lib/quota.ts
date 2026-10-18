import type { Locale } from '@/i18n';
import { formatNumber } from './format';
import { formatMonthName } from './format-date';

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

/** The usage month `YYYY-MM` (site time zone, from the server) as a month name without the year ("tháng 10", board M7A); no zone shifts it. */
export function monthLabel(month: string, locale: Locale): string {
  const [year, monthNumber] = month.split('-').map(Number);
  return formatMonthName(year ?? 1970, monthNumber ?? 1, locale);
}

/** `dd/MM` of the day the quota resets: the first of the month after `month` (`YYYY-MM`), as board M7A's "cho đến 01/11". */
export function nextMonthStart(month: string): string {
  const monthNumber = Number(month.split('-')[1] ?? 1);
  return `01/${String((monthNumber % 12) + 1).padStart(2, '0')}`;
}
