import { useI18n } from 'vue-i18n';
import type { MessageRef } from '@/lib/contest-time';

/** Turns a length from `spanMessage` into its words, in the current locale. */
export function useSpanText() {
  const { t } = useI18n();
  return (span: MessageRef) => t(span.key, span.params, span.count ?? 1);
}

const SECONDS_PER_DAY = 86_400;

/**
 * The one length format of the contest lists: under a day `h:mm` (`5:00`, `4:58`), from a day on whole days (`125 ngày`).
 * Documented in docs/decisions.md.
 */
export function useLengthText() {
  const { t } = useI18n();
  return (seconds: number): string => {
    if (seconds >= SECONDS_PER_DAY) {
      const days = Math.floor(seconds / SECONDS_PER_DAY);
      return t('contests.span.days', { count: days }, days);
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}:${String(minutes).padStart(2, '0')}`;
  };
}
