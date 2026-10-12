import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { readStorage, writeStorage } from '@/lib/storage';

export const FULLSCREEN_STORAGE_KEY = 'qhhoj.submit.fullscreen';
/** The button that enters full screen, on the dock and on the phone sheet; focus returns to it on exit. */
export const FULLSCREEN_TOGGLE_ID = 'submit-fullscreen-toggle';

/** Whether the viewer wants the submit panel full screen; remembered in this browser, docked by default. */
export function useSubmitFullscreenPreference() {
  const wanted = ref(readStorage(FULLSCREEN_STORAGE_KEY) === '1');
  watch(wanted, (value) => writeStorage(FULLSCREEN_STORAGE_KEY, value ? '1' : '0'));
  return wanted;
}

/**
 * While `active`: the page behind does not scroll (the root element: it owns the viewport scrollbar). Entering moves focus to `panel`; leaving returns it to the
 * expand button (not on first render, where the panel was never entered by the viewer).
 */
export function useFullscreenEffects(active: Ref<boolean>, panel: Ref<HTMLElement | null>) {
  const root = document.documentElement.style;
  const restoreScroll = () => {
    root.removeProperty('overflow');
    root.removeProperty('scrollbar-gutter');
  };
  watch(
    active,
    async (isActive, wasActive) => {
      if (isActive) {
        root.overflow = 'hidden';
        root.scrollbarGutter = 'auto'; // the panel covers the whole viewport, gutter included
      } else restoreScroll();
      if (wasActive === undefined) return;
      await nextTick();
      if (isActive) panel.value?.focus();
      else document.getElementById(FULLSCREEN_TOGGLE_ID)?.focus();
    },
    { immediate: true },
  );
  onBeforeUnmount(restoreScroll);
}
