import { onScopeDispose, ref, watch } from 'vue';

export const LOADING_TIMING = {
  showAfterMs: 600,
  settleMs: 100,
  fadeMs: 300,
} as const;
export type LoadingPhase = 'hidden' | 'walking' | 'fading';

/**
 * hidden -> walking after `showAfterMs` of continuous waiting; walking -> fading once waiting has been over for `settleMs`
 * (a navigation ends a tick before the page's queries start). The content has painted by then, so the Bits stop where they
 * stand and fade out over `fadeMs` (fading -> hidden); none walks across it. A new wait while fading walks again.
 */
export function useLoadingPhase(waiting: () => boolean, timing = LOADING_TIMING) {
  const phase = ref<LoadingPhase>('hidden');
  let showTimer: ReturnType<typeof setTimeout> | undefined;
  let endTimer: ReturnType<typeof setTimeout> | undefined;
  let fadeTimer: ReturnType<typeof setTimeout> | undefined;

  const fade = () => {
    phase.value = 'fading';
    fadeTimer = setTimeout(() => (phase.value = 'hidden'), timing.fadeMs);
  };
  const walk = () => {
    if (phase.value === 'fading') {
      clearTimeout(fadeTimer);
      phase.value = 'walking';
      return;
    }
    if (phase.value !== 'hidden') return;
    showTimer ??= setTimeout(() => {
      showTimer = undefined;
      // A wait that ended in the last settleMs is already over: showing now would flash Bits for a fast load.
      if (waiting()) phase.value = 'walking';
    }, timing.showAfterMs);
  };

  watch(
    waiting,
    (isWaiting) => {
      clearTimeout(endTimer);
      if (isWaiting) return walk();
      endTimer = setTimeout(() => {
        clearTimeout(showTimer);
        showTimer = undefined;
        if (phase.value === 'walking') fade();
      }, timing.settleMs);
    },
    { immediate: true, flush: 'sync' },
  );
  onScopeDispose(() => [showTimer, endTimer, fadeTimer].forEach((timer) => clearTimeout(timer)));
  return { phase };
}
