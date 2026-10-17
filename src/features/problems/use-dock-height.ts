import { onBeforeUnmount, watch } from 'vue';
import type { Ref } from 'vue';

const DOCK_HEIGHT_PROPERTY = '--dock-height';

/**
 * Publishes the height of the element the page must leave room for as `--dock-height` on the page root, so
 * the footer (`AppFooter`) can clear it. Follows the element as it comes and goes: while there is none (the phone sheet is
 * open and overlays the page), the last height stays.
 */
export const useDockHeight = (dock: Ref<HTMLElement | null>) =>
  usePublishedHeight(dock, DOCK_HEIGHT_PROPERTY);

/** Publishes `element`'s height as the CSS custom property `property` on the page root, removed on unmount. */
export function usePublishedHeight(dock: Ref<HTMLElement | null>, property: string) {
  watch(
    dock,
    (element, _previous, onCleanup) => {
      if (!element) return;
      const observer = new ResizeObserver(([entry]) => {
        if (!entry) return;
        // The border box includes the top border and the safe-area padding; `contentRect` is the fallback.
        const height = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
        document.documentElement.style.setProperty(property, `${height}px`);
      });
      observer.observe(element);
      onCleanup(() => observer.disconnect());
    },
    { flush: 'post' },
  );
  onBeforeUnmount(() => document.documentElement.style.removeProperty(property));
}
