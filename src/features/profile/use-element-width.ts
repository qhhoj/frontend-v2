import { onBeforeUnmount, onMounted, ref } from 'vue';

/** The width of an element in px, kept current while it resizes; `fallback` until it is measured and where ResizeObserver does not exist. */
export function useElementWidth(target: () => HTMLElement | null, fallback: number) {
  const width = ref(fallback);
  let observer: ResizeObserver | undefined;
  const measure = (measured: number) => {
    if (measured > 0) width.value = Math.floor(measured);
  };
  onMounted(() => {
    const element = target();
    if (!element) return;
    measure(element.getBoundingClientRect().width);
    if (typeof ResizeObserver !== 'function') return;
    observer = new ResizeObserver(([entry]) => entry && measure(entry.contentRect.width));
    observer.observe(element);
  });
  onBeforeUnmount(() => observer?.disconnect());
  return width;
}
