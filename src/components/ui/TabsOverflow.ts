import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { Ref, WatchSource } from 'vue';

/** Sub-pixel rounding leaves up to a pixel of false overflow. */
const SLACK_PX = 1;
/** Width of the edge fade: a tab behind it is as good as clipped. */
const FADE_PX = 32;
const CURRENT_TAB = '[aria-current="page"], [aria-selected="true"]';

function isClipped(tab: HTMLElement, left: number, right: number): boolean {
  return tab.offsetLeft < left - SLACK_PX || tab.offsetLeft + tab.offsetWidth > right + SLACK_PX;
}

/** Scrolls `strip` so `tab` sits fully in view, clear of the edge fades, never scrolling the page. */
function scrollIntoStrip(strip: HTMLElement, tab: HTMLElement) {
  const start = tab.offsetLeft;
  const end = start + tab.offsetWidth;
  const hasLeftFade = strip.scrollLeft > SLACK_PX;
  const hasRightFade = strip.scrollWidth - (strip.scrollLeft + strip.clientWidth) > SLACK_PX;
  if (start < strip.scrollLeft + (hasLeftFade ? FADE_PX : 0)) strip.scrollLeft = start - FADE_PX;
  else if (end > strip.scrollLeft + strip.clientWidth - (hasRightFade ? FADE_PX : 0))
    strip.scrollLeft = end - strip.clientWidth + FADE_PX;
}

/**
 * The tab strip's overflow: which tabs (`data-tab-key`) are clipped, whether each edge hides more, and the current tab
 * kept in view. The strip or its tabs changing size (a drawer finishing its layout, a font loading, a count appearing)
 * re-fits the current tab. Inactive when `enabled` is false: the strip just scrolls.
 */
export function useTabsOverflow(
  scroller: Ref<HTMLElement | null>,
  enabled: boolean,
  changes: WatchSource[],
) {
  const hiddenKeys = ref<string[]>([]);
  const hasMoreLeft = ref(false);
  const hasMoreRight = ref(false);

  function measure() {
    const strip = scroller.value;
    if (!strip || !enabled) return;
    const left = strip.scrollLeft;
    const right = left + strip.clientWidth;
    hasMoreLeft.value = left > SLACK_PX;
    hasMoreRight.value = strip.scrollWidth - right > SLACK_PX;
    hiddenKeys.value = [...strip.querySelectorAll<HTMLElement>('[data-tab-key]')]
      .filter((tab) => isClipped(tab, left, right))
      .map((tab) => tab.dataset.tabKey ?? '');
  }

  function revealCurrent() {
    const strip = scroller.value;
    const tab = strip?.querySelector<HTMLElement>(CURRENT_TAB);
    if (!strip || !tab || !enabled) return;
    scrollIntoStrip(strip, tab);
    measure();
  }

  let observer: ResizeObserver | undefined;
  onMounted(() => {
    revealCurrent();
    if (!enabled || typeof ResizeObserver === 'undefined' || !scroller.value) return;
    observer = new ResizeObserver(revealCurrent);
    observer.observe(scroller.value);
    if (scroller.value.firstElementChild) observer.observe(scroller.value.firstElementChild);
  });
  onBeforeUnmount(() => observer?.disconnect());
  watch(changes, () => nextTick(revealCurrent));

  return { hiddenKeys, hasMoreLeft, hasMoreRight, measure };
}
