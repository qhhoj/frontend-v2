import { onBeforeUnmount, shallowReadonly, shallowRef, watchEffect } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

export interface PageBack {
  to: RouteLocationRaw;
  label: string;
}

const published = shallowRef<PageBack | null>(null);

/** The back link the page on screen shows in its header, or null. The phone top bar reads it to hide its own arrow. */
export const pageBack = shallowReadonly(published);

/** Called by `PageHeader`: publishes its `back` while it lives and clears it on unmount (only if still its own). */
export function usePublishBack(back: () => PageBack | null | undefined) {
  let own: PageBack | null = null;
  watchEffect(() => {
    own = back() ?? null;
    published.value = own;
  });
  onBeforeUnmount(() => {
    if (published.value === own) published.value = null;
  });
}
