import { onBeforeUnmount, onMounted, ref } from 'vue';

/** True while the element is narrower than `minWidthPx`: a card too narrow for the full table (a phone, a tablet beside the filter rail). False until measured and where ResizeObserver does not exist. */
export function useIsNarrow(target: () => HTMLElement | null, minWidthPx: number) {
  const isNarrow = ref(false);
  let observer: ResizeObserver | undefined;
  const measure = (width: number) => (isNarrow.value = width > 0 && width < minWidthPx);
  onMounted(() => {
    const element = target();
    if (!element) return;
    measure(element.getBoundingClientRect().width);
    if (typeof ResizeObserver !== 'function') return;
    observer = new ResizeObserver(([entry]) => entry && measure(entry.contentRect.width));
    observer.observe(element);
  });
  onBeforeUnmount(() => observer?.disconnect());
  return isNarrow;
}
