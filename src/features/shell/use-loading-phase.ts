import { onScopeDispose, ref, watch } from 'vue';

export const LOADING_TIMING = {
  showAfterMs: 600,
  settleMs: 100,
  leaveMs: 3000,
  fadeMs: 300,
} as const;
export type LoadingPhase = 'hidden' | 'walking' | 'leaving' | 'fading';

/**
 * hidden -> walking after `showAfterMs` of continuous waiting; walking -> leaving once waiting has been over for `settleMs`
 * (a navigation ends a tick before the page's queries start). While leaving the Bits walk off-screen; `gone()` (every Bit is out
 * of sight) hides the layer. Bits still on screen after `leaveMs` fade out over `fadeMs` (leaving -> fading -> hidden), walking on.
 * A new wait while leaving or fading walks again.
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
  const leave = () => {
    phase.value = 'leaving';
    afterTimer = setTimeout(fade, timing.leaveMs);
  };
  /** Every Bit has left the viewport: nothing is left to fade. */
  const gone = () => {
    if (phase.value !== 'leaving' && phase.value !== 'fading') return;
    clearTimeout(afterTimer);
    phase.value = 'hidden';
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
        if (phase.value === 'walking') leave();
      }, timing.settleMs);
    },
    { immediate: true, flush: 'sync' },
  );
  onScopeDispose(() => [showTimer, endTimer, afterTimer].forEach((timer) => clearTimeout(timer)));
  return { phase, gone };
}
