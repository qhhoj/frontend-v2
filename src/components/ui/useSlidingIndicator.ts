import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { Ref, WatchSource } from 'vue';

/** The marked item of a segmented control or a tab row. */
const CURRENT_ITEM = '[aria-current="page"], [aria-selected="true"], [aria-pressed="true"]';
/** Thickness of the underline bar. */
const BAR_PX = 2;

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * One indicator that slides from the old current item to the new one. It is measured from the current item
 * (`offsetLeft`/`offsetWidth`, so `host` must be the items' offset parent: `relative`) and moved with `transform` and
 * `width`. It never animates on the first placement, nor when only the size changed (a resize, a font loading): only a
 * change of the current item slides, with the `SLIDE` classes the component adds while `animate` is true.
 * Under reduced motion `--qh-duration` is 0, so the slide ends at once. `bar` makes it a 2 px line under the item.
 */
export function useSlidingIndicator(
  host: Ref<HTMLElement | null>,
  itemSelector: string,
  changes: WatchSource[],
  bar: () => boolean = () => false,
) {
  const box = ref<Box | null>(null);
  const animate = ref(false);
  let lastItem: HTMLElement | null = null;

  function measure() {
    const element = host.value;
    const item = element?.querySelector<HTMLElement>(CURRENT_ITEM) ?? null;
    animate.value = lastItem !== null && item !== null && item !== lastItem;
    lastItem = item;
    if (!item) {
      box.value = null;
      return;
    }
    const isBar = bar();
    box.value = {
      x: item.offsetLeft,
      y: isBar ? item.offsetTop + item.offsetHeight - BAR_PX : item.offsetTop,
      width: item.offsetWidth,
      height: isBar ? BAR_PX : item.offsetHeight,
    };
  }

  let observer: ResizeObserver | undefined;
  function observeItems() {
    observer?.disconnect();
    const element = host.value;
    if (!element) return;
    observer?.observe(element);
    element.querySelectorAll(itemSelector).forEach((item) => observer?.observe(item));
  }
  const refresh = () => {
    measure();
    observeItems();
  };

  onMounted(() => {
    measure();
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(measure);
      observeItems();
    }
  });
  onBeforeUnmount(() => observer?.disconnect());
  watch(changes, () => void nextTick(refresh));

  const style = computed(() =>
    box.value
      ? {
          transform: `translate(${box.value.x}px, ${box.value.y}px)`,
          width: `${box.value.width}px`,
          height: `${box.value.height}px`,
        }
      : undefined,
  );
  return { style, animate, visible: computed(() => box.value !== null) };
}

/** Added to the indicator while it slides: the move easing and the duration token. */
export const SLIDE = 'transition-[transform,width,height] duration-(--qh-duration) ease-move';
