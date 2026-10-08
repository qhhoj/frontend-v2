import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useReducedMotion } from '@/lib/use-reduced-motion';

export const BLINK_EVERY_MS = 4000;
export const BLINK_LENGTH_MS = 160;

/** True for a moment every few seconds, so a still Bit looks alive. Never true under `prefers-reduced-motion`. */
export function usePeriodicBlink() {
  const isBlinking = ref(false);
  const reducedMotion = useReducedMotion();
  let intervalId: ReturnType<typeof setInterval> | undefined;
  let reopenId: ReturnType<typeof setTimeout> | undefined;

  const blinkOnce = () => {
    if (reducedMotion.value) return;
    isBlinking.value = true;
    reopenId = setTimeout(() => (isBlinking.value = false), BLINK_LENGTH_MS);
  };
  onMounted(() => (intervalId = setInterval(blinkOnce, BLINK_EVERY_MS)));
  onBeforeUnmount(() => {
    clearInterval(intervalId);
    clearTimeout(reopenId);
  });
  return isBlinking;
}
