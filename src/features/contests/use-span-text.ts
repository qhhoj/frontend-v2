import { useI18n } from 'vue-i18n';
import type { MessageRef } from '@/lib/contest-time';

/** Turns a length from `spanMessage` into its words, in the current locale. */
export function useSpanText() {
  const { t } = useI18n();
  return (span: MessageRef) => t(span.key, span.params, span.count ?? 1);
}
