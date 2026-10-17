import { useI18n } from 'vue-i18n';
import { countdownView } from './contest-time';

/**
 * Time left in words, one way everywhere (P-18): `13 ngày 21 giờ` from 48 hours, `HH:MM:SS` below; `short` gives
 * `13 ng 21 g` for a bar without room. A whole number of days drops the hours.
 */
export function useCountdownText() {
  const { t } = useI18n();
  return (seconds: number, short = false): string => {
    const view = countdownView(seconds);
    if (view.kind === 'clock') return view.text;
    const { days, hours } = view;
    if (hours === 0)
      return short
        ? t('contests.span.daysShort', { days })
        : t('contests.span.days', { count: days }, days);
    return t(short ? 'contests.span.daysHoursShort' : 'contests.span.daysHours', { days, hours });
  };
}
