import { onBeforeUnmount, watch } from 'vue';
import type { Ref } from 'vue';

/** Room left above a pinned bar, so a focused field is not flush with its edge. */
const GAP_PX = 16;

/**
 * Keeps the page's `scroll-padding-bottom` at the height of a bar pinned to the bottom of the screen, so the browser
 * never scrolls a focused field under it. The bar may mount later than the component (behind a `v-if` waiting for
 * data) or be replaced: the size watch follows whichever element the ref holds. `isPinned` is asked on every resize: a
 * bar that is sticky only from some width (a reply box) leaves the padding alone below it. `onFollow` runs after each
 * pinned measure (the save bar keeps the focused field above itself). The page's own padding comes back on unmount.
 */
export function useBottomScrollPadding(
  bar: Readonly<Ref<HTMLElement | null>>,
  isPinned: (bar: HTMLElement) => boolean = () => true,
  onFollow: () => void = () => {},
): void {
  const root = document.documentElement;
  const previousPadding = root.style.scrollPaddingBottom;
  let observer: ResizeObserver | undefined;
  const follow = () => {
    const element = bar.value;
    if (!element || !isPinned(element)) {
      root.style.scrollPaddingBottom = previousPadding;
      return;
    }
    root.style.scrollPaddingBottom = `${element.offsetHeight + GAP_PX}px`;
    onFollow();
  };
  watch(
    bar,
    (element) => {
      observer?.disconnect();
      observer = undefined;
      follow();
      if (element && typeof ResizeObserver === 'function') {
        observer = new ResizeObserver(follow);
        observer.observe(element);
      }
    },
    { immediate: true, flush: 'post' },
  );
  onBeforeUnmount(() => {
    observer?.disconnect();
    root.style.scrollPaddingBottom = previousPadding;
  });
}
