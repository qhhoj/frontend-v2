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

export const formatNumber = (value: number, locale: Locale, fractionDigits = 0) =>
  new Intl.NumberFormat(INTL_LOCALES[locale], { maximumFractionDigits: fractionDigits }).format(
    value,
  );

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
