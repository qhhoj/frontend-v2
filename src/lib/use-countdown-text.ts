import { useI18n } from 'vue-i18n';
import { countdownView } from './contest-time';

/** A message lookup with a plural count, as vue-i18n's `t(key, named, plural)`. */
export type Translate = (key: string, named: Record<string, number>, plural: number) => string;

/**
 * Days and hours in words, the one wording of P-18: `13 ngày 21 giờ`, or `13 ng 21 g` (`short`) in a ranking cell,
 * where there is no room. A whole number of days drops the hours.
 */
export function daysHoursText(
  tr: Translate,
  { days, hours }: { days: number; hours: number },
  short: boolean,
): string {
  if (hours === 0)
    return short
      ? tr('contests.span.daysShort', { days }, days)
      : tr('contests.span.days', { count: days }, days);
  return tr(
    short ? 'contests.span.daysHoursShort' : 'contests.span.daysHours',
    { days, hours },
    days,
  );
}

/**
 * Time left, one way for every countdown (P-18): days and hours from 48 hours, `HH:MM:SS` below. Ranking cells use
 * the same wording from 100 hours instead (ranking-cells.ts): their `H:MM:SS` fits the cell up to 99:59:59.
 */
export function useCountdownText() {
  const { t } = useI18n();
  return (seconds: number): string => {
    const view = countdownView(seconds);
    return view.kind === 'clock' ? view.text : daysHoursText(t, view, false);
  };
}
