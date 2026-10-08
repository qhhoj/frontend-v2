import { onScopeDispose, ref, watch } from 'vue';

export const LOADING_TIMING = {
  showAfterMs: 600,
  settleMs: 100,
  holdMs: 1500,
  fadeMs: 300,
} as const;
export type LoadingPhase = 'hidden' | 'walking' | 'stopped' | 'fading';

/**
 * hidden -> walking after `showAfterMs` of continuous waiting; walking -> stopped once waiting has been over for `settleMs`
 * (a navigation ends a tick before the page's queries start); stopped -> fading after `holdMs`; fading -> hidden after `fadeMs`.
 * A new wait while stopped or fading walks again.
 */
export function useLoadingPhase(waiting: () => boolean, timing = LOADING_TIMING) {
  const phase = ref<LoadingPhase>('hidden');
  let showTimer: ReturnType<typeof setTimeout> | undefined;
  let endTimer: ReturnType<typeof setTimeout> | undefined;
  let afterTimer: ReturnType<typeof setTimeout> | undefined;

  const fade = () => {
    phase.value = 'fading';
    afterTimer = setTimeout(() => (phase.value = 'hidden'), timing.fadeMs);
  };
  const stop = () => {
    phase.value = 'stopped';
    afterTimer = setTimeout(fade, timing.holdMs);
  };

  watch(
    waiting,
    (isWaiting) => {
      clearTimeout(endTimer);
      if (isWaiting) {
        if (phase.value === 'hidden') {
          showTimer ??= setTimeout(() => {
            showTimer = undefined;
            // A wait that ended in the last settleMs is already over: showing now would flash Bits for a fast load.
            if (waiting()) phase.value = 'walking';
          }, timing.showAfterMs);
        } else if (phase.value !== 'walking') {
          clearTimeout(afterTimer);
          phase.value = 'walking';
        }
        return;
      }
      endTimer = setTimeout(() => {
        clearTimeout(showTimer);
        showTimer = undefined;
        if (phase.value === 'walking') stop();
      }, timing.settleMs);
    },
    { immediate: true, flush: 'sync' },
  );
  onScopeDispose(() => [showTimer, endTimer, afterTimer].forEach((timer) => clearTimeout(timer)));
  return { phase };
}
