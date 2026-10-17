import { onBeforeUnmount, watch } from 'vue';
import type { Ref } from 'vue';

const DOCK_HEIGHT_PROPERTY = '--dock-height';

/**
 * Publishes the height of the element the page must leave room for as `--dock-height` on the page root, so
 * the footer (`AppFooter`) can clear it. Follows the element as it comes and goes: while there is none the last height
 * stays (the phone sheet is open and overlays the page), unless `clearWhenGone()` (the desktop dock, closed away).
 */
export const useDockHeight = (dock: Ref<HTMLElement | null>, clearWhenGone = () => false) =>
  usePublishedHeight(dock, DOCK_HEIGHT_PROPERTY, clearWhenGone);

/**
 * Publishes `element`'s height as the CSS custom property `property` on the page root, removed on unmount, and when the
 * element goes away while `clearWhenGone()` holds.
 */
export function usePublishedHeight(
  element: Ref<HTMLElement | null>,
  property: string,
  clearWhenGone = () => false,
) {
  const clear = () => document.documentElement.style.removeProperty(property);
  watch(
    element,
    (current, _previous, onCleanup) => {
      if (!current) {
        if (clearWhenGone()) clear();
        return;
      }
      const observer = new ResizeObserver(([entry]) => {
        if (!entry) return;
        // The border box includes the top border and the safe-area padding; `contentRect` is the fallback.
        const height = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
        document.documentElement.style.setProperty(property, `${height}px`);
      });
      observer.observe(current);
      onCleanup(() => observer.disconnect());
    },
    { flush: 'post' },
  );
  onBeforeUnmount(clear);
}
