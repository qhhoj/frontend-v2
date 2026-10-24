import type { Locale } from '@/i18n';

export const INTL_LOCALES: Record<Locale, string> = { vi: 'vi-VN', en: 'en-US' };
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

/**
 * The score to print with at most `fractionDigits` decimals out of `max`: a score short of `max` stays short of it once
 * rounded (99.995 of 100 prints 99.99, never 100). Without a known `max` it is the score itself.
 */
export const scoreBelowFull = (
  points: number,
  max: number | null | undefined,
  fractionDigits: number,
): number =>
  max === null || max === undefined || points >= max
    ? points
    : Math.min(points, max - 10 ** -fractionDigits);

/** A problem's points as the old site showed them: `1500p` when tests score partially, else `1500`. */
export const formatProblemPoints = (points: number, partial: boolean, locale: Locale) =>
  `${formatNumber(points, locale, 2, false)}${partial ? 'p' : ''}`;

/** A number with exactly `digits` decimals: `100` reads `100,0` at one, so weights and counted points line up. */
export const formatFixed = (value: number, locale: Locale, digits: number) =>
  new Intl.NumberFormat(INTL_LOCALES[locale], {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);

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

/** `H:MM:SS` since the contest start: the time line of a points cell. */
export function formatElapsedSeconds(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(seconds / 3600)}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`;
}

/** A vote score with its sign (`+4`, `−3`, `0`); the minus is U+2212 so it reads as a minus, not a hyphen. */
export const signedScore = (score: number) =>
  score > 0 ? `+${score}` : score < 0 ? `−${-score}` : '0';
