import type { Locale } from '@/i18n';

export const INTL_LOCALES: Record<Locale, string> = { vi: 'vi-VN', en: 'en-US' };
/** The one text for a missing value in a cell or fact (an em dash). */
export const NO_VALUE = '—';
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

/** Problem points and scores: Vietnamese grouping ("2.600"), at most two decimals. The one format for points everywhere. */
export const formatPoints = (value: number, locale: Locale, fractionDigits = 2) =>
  formatNumber(value, locale, fractionDigits);

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

/**
 * A score known to fall short of a maximum the caller does not have (its cases did): cut, not rounded, to `fractionDigits`,
 * so it never prints as that maximum (999.999 prints 999.9 at one decimal). The `toFixed` drops float noise first.
 */
export const scoreCut = (points: number, fractionDigits: number): number => {
  const scale = 10 ** fractionDigits;
  return Math.floor(Number((points * scale).toFixed(6))) / scale;
};

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

/** Time, memory, limits and file sizes have one format site-wide; it lives in `measure.ts` and is imported from here. */
export {
  formatCaseMemory,
  formatCaseTime,
  formatFileSize,
  formatMemoryLimit,
  formatTimeLimit,
} from './measure';

/** `H:MM:SS` since the contest start: the time line of a points cell. */
export function formatElapsedSeconds(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(seconds / 3600)}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`;
}

/** A vote score with its sign (`+4`, `−3`, `0`); the minus is U+2212 so it reads as a minus, not a hyphen. */
export const signedScore = (score: number) =>
  score > 0 ? `+${score}` : score < 0 ? `−${-score}` : '0';
