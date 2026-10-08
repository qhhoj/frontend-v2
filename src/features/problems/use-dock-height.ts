import { onBeforeUnmount, onMounted } from 'vue';
import type { Ref } from 'vue';

const DOCK_HEIGHT_PROPERTY = '--dock-height';

/** Publishes the dock's height as `--dock-height` on the page root, so `ProblemPage` can leave room for it. */
export function useDockHeight(dock: Ref<HTMLElement | null>) {
  let observer: ResizeObserver | undefined;
  onMounted(() => {
    if (!dock.value) return;
    observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      // The border box includes the top border and the safe-area padding; `contentRect` is the fallback.
      const height = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
      document.documentElement.style.setProperty(DOCK_HEIGHT_PROPERTY, `${height}px`);
    });
    observer.observe(dock.value);
  });
  onBeforeUnmount(() => {
    observer?.disconnect();
    document.documentElement.style.removeProperty(DOCK_HEIGHT_PROPERTY);
  });
}
