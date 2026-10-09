import { computed } from 'vue';
import { useLowPowerPainted } from './use-low-power-painted';
import { useReducedMotion } from './use-reduced-motion';

/** True while decorative motion (list moves, scrolling) may run: no `prefers-reduced-motion: reduce` and no low-power. */
export function useMotionAllowed() {
  const reduced = useReducedMotion();
  const lowPower = useLowPowerPainted();
  return computed(() => !reduced.value && !lowPower.value);
}
