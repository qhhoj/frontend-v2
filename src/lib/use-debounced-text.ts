import { onBeforeUnmount, ref, watch } from 'vue';

export const TEXT_DEBOUNCE_MS = 300;

/**
 * A text box that reports its trimmed value `TEXT_DEBOUNCE_MS` after the last key and follows `source`
 * (the URL) when that changes from outside. The timer dies with the component.
 */
export function useDebouncedText(source: () => string, commit: (text: string) => void) {
  const text = ref(source());
  let timer: ReturnType<typeof setTimeout> | undefined;
  watch(text, (value) => {
    clearTimeout(timer);
    if (value.trim() === source()) return;
    timer = setTimeout(() => commit(value.trim()), TEXT_DEBOUNCE_MS);
  });
  watch(source, (value) => {
    if (value !== text.value.trim()) text.value = value;
  });
  onBeforeUnmount(() => clearTimeout(timer));
  return text;
}
