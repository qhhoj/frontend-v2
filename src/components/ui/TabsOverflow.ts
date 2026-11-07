import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { Ref, WatchSource } from 'vue';

/** Sub-pixel rounding leaves up to a pixel of false overflow. */
const SLACK_PX = 1;
const CURRENT_TAB = '[aria-current="page"], [aria-selected="true"]';

function isClipped(tab: HTMLElement, left: number, right: number): boolean {
  return tab.offsetLeft < left - SLACK_PX || tab.offsetLeft + tab.offsetWidth > right + SLACK_PX;
}

/**
 * Scrolls `strip` so `tab` sits fully in view, never scrolling the page. Scrolling right stops on a tab's left edge, so
 * the tabs that stay visible are whole and packed from the left (a hidden tab leaves no gap before them).
 */
function scrollIntoStrip(strip: HTMLElement, tab: HTMLElement) {
  const end = tab.offsetLeft + tab.offsetWidth;
  if (tab.offsetLeft < strip.scrollLeft) strip.scrollLeft = tab.offsetLeft;
  else if (end > strip.scrollLeft + strip.clientWidth) {
    const tabs = [...strip.querySelectorAll<HTMLElement>('[data-tab-key]')];
    const first = tabs.find((other) => end - other.offsetLeft <= strip.clientWidth) ?? tab;
    strip.scrollLeft = first.offsetLeft;
  }
}

/**
 * The tab strip's overflow: which tabs (`data-tab-key`) are clipped (the strip hides them whole and lists them in its
 * menu), and the current tab kept in view. The strip or its tabs changing size (a drawer finishing its layout, a font loading, a count appearing)
 * re-fits the current tab. Inactive when `enabled` is false: the strip just scrolls.
 */
export function useTabsOverflow(
  scroller: Ref<HTMLElement | null>,
  enabled: boolean,
  changes: WatchSource[],
) {
  const hiddenKeys = ref<string[]>([]);

  function measure() {
    const strip = scroller.value;
    if (!strip || !enabled) return;
    const left = strip.scrollLeft;
    const right = left + strip.clientWidth;
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

  return { hiddenKeys, measure };
}
