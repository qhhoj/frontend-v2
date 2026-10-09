import { computed } from 'vue';
import type { ComputedRef } from 'vue';
import { useLowPowerPainted } from './use-low-power-painted';
import { useReducedMotion } from './use-reduced-motion';

/** True under `prefers-reduced-motion` or in low-power mode: Bit stands still (frame 0, no blink, no walk). */
export function useMotionOff(): ComputedRef<boolean> {
  const reducedMotion = useReducedMotion();
  const lowPower = useLowPowerPainted();
  return computed(() => reducedMotion.value || lowPower.value);
}
