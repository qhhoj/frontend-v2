import { onBeforeUnmount, watch } from 'vue';
import type { Ref } from 'vue';

const DOCK_HEIGHT_PROPERTY = '--dock-height';

/**
 * Publishes the height of the element the page must leave room for as `--dock-height` on the page root, so
 * the footer (`AppFooter`) can clear it. Follows the element as it comes and goes: while there is none (the phone sheet is
 * open and overlays the page), the last height stays.
 */
export function useDockHeight(dock: Ref<HTMLElement | null>) {
  watch(
    dock,
    (element, _previous, onCleanup) => {
      if (!element) return;
      const observer = new ResizeObserver(([entry]) => {
        if (!entry) return;
        // The border box includes the top border and the safe-area padding; `contentRect` is the fallback.
        const height = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
        document.documentElement.style.setProperty(DOCK_HEIGHT_PROPERTY, `${height}px`);
      });
      observer.observe(element);
      onCleanup(() => observer.disconnect());
    },
    { flush: 'post' },
  );
  onBeforeUnmount(() => document.documentElement.style.removeProperty(DOCK_HEIGHT_PROPERTY));
}
