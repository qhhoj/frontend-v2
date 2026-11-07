import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { Ref, WatchSource } from 'vue';

/** Sub-pixel rounding leaves up to a pixel of false overflow. */
const SLACK_PX = 1;
/** The gap between the strip's last visible tab and the "⋯" button. */
const TRIGGER_GAP_PX = 4;
const CURRENT_TAB = '[aria-current="page"], [aria-selected="true"]';

/** Where the tabs end: the right edge of the last one (the list's end padding, kept for the "⋯" button, excluded). */
function tabsEnd(tabs: HTMLElement[]): number {
  const last = tabs.at(-1);
  return last ? last.offsetLeft + last.offsetWidth : 0;
}

/**
 * The part of the strip that shows whole tabs: all of it when every tab fits, else all but the room of the "⋯" button,
 * which sits over the strip's right end. A pure function of the measured widths, so a width always gives one split.
 */
function tabWindow(strip: HTMLElement, tabs: HTMLElement[], trigger: HTMLElement | null) {
  const fits = tabsEnd(tabs) <= strip.clientWidth + SLACK_PX;
  const reserve = fits || !trigger ? 0 : trigger.offsetWidth + TRIGGER_GAP_PX;
  return { fits, width: strip.clientWidth - reserve };
}

const isClipped = (tab: HTMLElement, left: number, right: number) =>
  tab.offsetLeft < left - SLACK_PX || tab.offsetLeft + tab.offsetWidth > right + SLACK_PX;

/**
 * Scrolls `strip` so `tab` sits whole in a window `width` wide, never scrolling the page. Scrolling right stops on a
 * tab's left edge, so the tabs that stay visible are whole and packed from the left.
 */
function scrollIntoStrip(strip: HTMLElement, tabs: HTMLElement[], tab: HTMLElement, width: number) {
  const end = tab.offsetLeft + tab.offsetWidth;
  if (tab.offsetLeft < strip.scrollLeft) strip.scrollLeft = tab.offsetLeft;
  else if (end > strip.scrollLeft + width) {
    const first = tabs.find((other) => end - other.offsetLeft <= width) ?? tab;
    strip.scrollLeft = first.offsetLeft;
  }
}

/**
 * The tab strip's overflow: which tabs (`data-tab-key`) do not fit whole (the strip hides them and lists them behind
 * the "⋯" `trigger`), and the current tab kept in view. The trigger sits over the strip and the list keeps room for it,
 * so neither its showing nor the hiding changes a measured size: a resize never loops. The strip or its tabs changing
 * size (a drawer finishing its layout, a font loading, a count appearing) re-fits the current tab. Inactive when
 * `enabled` is false: the strip just scrolls.
 */
export function useTabsOverflow(
  scroller: Ref<HTMLElement | null>,
  trigger: Ref<HTMLElement | null>,
  enabled: boolean,
  changes: WatchSource[],
) {
  const hiddenKeys = ref<string[]>([]);
  const tabsOf = (strip: HTMLElement) => [...strip.querySelectorAll<HTMLElement>('[data-tab-key]')];

  function measure() {
    const strip = scroller.value;
    if (!strip || !enabled) return;
    const tabs = tabsOf(strip);
    const { width } = tabWindow(strip, tabs, trigger.value);
    const left = strip.scrollLeft;
    hiddenKeys.value = tabs
      .filter((tab) => isClipped(tab, left, left + width))
      .map((tab) => tab.dataset.tabKey ?? '');
  }

  function revealCurrent() {
    const strip = scroller.value;
    if (!strip || !enabled) return;
    const tabs = tabsOf(strip);
    const { fits, width } = tabWindow(strip, tabs, trigger.value);
    const tab = strip.querySelector<HTMLElement>(CURRENT_TAB);
    if (fits) strip.scrollLeft = 0;
    else if (tab) scrollIntoStrip(strip, tabs, tab, width);
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
