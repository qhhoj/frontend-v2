import { i18n } from '@/i18n';
import type { Locale } from '@/i18n';

/**
 * The one format of what the judge measures and of the limits it enforces, site-wide: a number, a no-break space, the unit.
 * The decimal mark follows the locale: a comma in Vietnamese ("1,05 s", "3,5 MB"), a point in English ("1.05 s"). No digit
 * grouping, so a 1024 MB limit never reads as "1.024 MB". Each function takes the site's current locale unless one is passed.
 *
 * - measured (`formatCaseTime`, `formatCaseMemory`): fixed decimals, so a column of them lines up; memory is cut, not rounded,
 *   so a run just under its limit never prints as the limit.
 * - limits (`formatTimeLimit`, `formatMemoryLimit`): as set, without padding beyond one decimal of a second ("1,0 s", "256 MB").
 * - file sizes (`formatFileSize`): megabytes cut to one decimal, whole kilobytes below one megabyte.
 */
const UNIT_GAP = ' ';
export const KIB_PER_MIB = 1024;
const BYTES_PER_KILOBYTE = 1024;
const BYTES_PER_MEGABYTE = 1024 * 1024;

const currentLocale = (): Locale => i18n.global.locale.value;

function decimal(value: number, locale: Locale, minDigits: number, maxDigits: number): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: minDigits,
    maximumFractionDigits: maxDigits,
    useGrouping: false,
  }).format(value);
}
const withUnit = (text: string, unit: string) => `${text}${UNIT_GAP}${unit}`;
/** Cut to one decimal: 3.59 reads 3.5. */
const cutToTenth = (value: number) => Math.floor(value * 10) / 10;

/** A run's time in seconds, two decimals: `1.05` reads "1,05 s". */
export const formatCaseTime = (seconds: number, locale: Locale = currentLocale()) =>
  withUnit(decimal(seconds, locale, 2, 2), 's');

/** A run's memory (KiB) in MB, cut to one decimal: `3686` reads "3,5 MB". */
export const formatCaseMemory = (kib: number, locale: Locale = currentLocale()) =>
  withUnit(decimal(cutToTenth(kib / KIB_PER_MIB), locale, 1, 1), 'MB');

/** A time limit in seconds, one decimal, two when the limit has them: `1` reads "1,0 s", `0.25` reads "0,25 s". */
export const formatTimeLimit = (seconds: number, locale: Locale = currentLocale()) =>
  withUnit(decimal(seconds, locale, 1, 2), 's');

/** A memory limit (KiB) in MB, a decimal only when the limit has one: `262144` reads "256 MB", `1536` reads "1,5 MB". */
export const formatMemoryLimit = (kib: number, locale: Locale = currentLocale()) =>
  withUnit(decimal(kib / KIB_PER_MIB, locale, 0, 1), 'MB');

/** A file's size: `1887437` reads "1,8 MB" (cut like a run's memory), below 1 MB whole kilobytes ("64 KB"). */
export const formatFileSize = (bytes: number, locale: Locale = currentLocale()) =>
  bytes >= BYTES_PER_MEGABYTE
    ? withUnit(decimal(cutToTenth(bytes / BYTES_PER_MEGABYTE), locale, 1, 1), 'MB')
    : withUnit(decimal(Math.round(bytes / BYTES_PER_KILOBYTE), locale, 0, 0), 'KB');
