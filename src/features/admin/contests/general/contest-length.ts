import { computed } from 'vue';
import type { Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDateReset, useHasUnreadableDate } from '@/components/ui/date-validity';
import { spanMessage } from '@/lib/contest-time';
import type { ContestForm } from '../contest-form';

/** The quick lengths offered beside the end time, in minutes. */
export const QUICK_MINUTES = [15, 45, 90, 120] as const;
const MS_PER_MINUTE = 60_000;

/** The contest's length as the form holds it: quick lengths that set the end from the start, and the length in words. */
export function useContestLength(form: Ref<ContestForm>) {
  const { t } = useI18n();
  const resetDates = useDateReset();
  const hasUnreadableDate = useHasUnreadableDate();
  /** Does nothing while a box holds text that does not read: it stays as typed, with its error, and the save stays refused. */
  function lastFor(minutes: number) {
    if (hasUnreadableDate.value) return;
    const startMs = Date.parse(form.value.startTime);
    if (Number.isFinite(startMs))
      form.value.endTime = new Date(startMs + minutes * MS_PER_MINUTE).toISOString();
    resetDates();
  }
  /** "45 phút", once the window reads; undefined before. */
  const lengthText = computed(() => {
    const seconds = (Date.parse(form.value.endTime) - Date.parse(form.value.startTime)) / 1000;
    if (!(seconds > 0)) return undefined;
    const span = spanMessage(seconds);
    return span.count === undefined
      ? t(span.key, span.params)
      : t(span.key, span.params, span.count);
  });
  /** "Kéo dài 45 phút." under the end. */
  const lengthHint = computed(() =>
    lengthText.value
      ? t('admin.contests.general.hints.length', { span: lengthText.value })
      : undefined,
  );
  return { lastFor, lengthText, lengthHint };
}
