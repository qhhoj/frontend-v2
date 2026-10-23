import { onMounted } from 'vue';
import type { ComponentPublicInstance, Ref } from 'vue';

/** A panel whose top starts below this share of the viewport is out of the reader's sight. */
const OUT_OF_SIGHT_SHARE = 0.6;

/**
 * A detail panel opened from a list scrolls into view when it mounts if the layout stacked it far below the list (a
 * phone); beside the list it is already in sight and the page stays put.
 */
export function useRevealOnMount(panel: Ref<HTMLElement | ComponentPublicInstance | null>) {
  onMounted(() => {
    const target = panel.value;
    const element = target instanceof HTMLElement ? target : target?.$el;
    if (!(element instanceof HTMLElement)) return;
    if (element.getBoundingClientRect().top < window.innerHeight * OUT_OF_SIGHT_SHARE) return;
    element.scrollIntoView?.({ block: 'start' });
  });
}
