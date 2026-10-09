import { onBeforeUnmount, ref, watch } from 'vue';
import type { Ref } from 'vue';

export const TEXT_DEBOUNCE_MS = 300;

/** The box's text, plus `commitNow`: commit this text at once and drop any pause still pending. */
export type DebouncedText = Ref<string> & { commitNow: (text: string) => void };

/**
 * A text box that reports its trimmed value `TEXT_DEBOUNCE_MS` after the last key and follows `source`
 * (the URL) when that changes from outside. The timer dies with the component.
 */
export function useDebouncedText(
  source: () => string,
  commit: (text: string) => void,
): DebouncedText {
  const text = ref(source());
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cancelPause = () => clearTimeout(timer);
  // Sync, so a write made by `commitNow` cancels the pause it would otherwise arm in a later tick.
  watch(
    text,
    (value) => {
      cancelPause();
      if (value.trim() === source()) return;
      timer = setTimeout(() => commit(value.trim()), TEXT_DEBOUNCE_MS);
    },
    { flush: 'sync' },
  );
  watch(source, (value) => {
    if (value !== text.value.trim()) text.value = value;
  });
  onBeforeUnmount(cancelPause);
  return Object.assign(text, {
    commitNow(value: string) {
      text.value = value;
      cancelPause();
      commit(value);
    },
  });
}
