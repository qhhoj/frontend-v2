import { computed, shallowRef } from 'vue';
import { translate } from '@/i18n';

/** A translatable message: the key and the placeholders it needs. */
export interface SubmitMessage {
  key: string;
  params?: Record<string, unknown>;
}

/** The one error line of the form: whoever refuses something reports it, the form shows `errorText`. */
export function useSubmitMessage() {
  const message = shallowRef<SubmitMessage | null>(null);
  const report = (next: SubmitMessage | null) => {
    message.value = next;
  };
  const errorText = computed(() =>
    message.value ? translate(message.value.key, message.value.params ?? {}) : null,
  );
  return { errorText, report };
}
