import { computed } from 'vue';
import { useReducedMotion } from './use-reduced-motion';

// TODO(F5 Task 9): also return false while `useLowPowerPainted()` is on; vnoi/f5-b has not reached main yet.
/** True while decorative motion (list moves, scrolling) may run: no `prefers-reduced-motion: reduce`. */
export function useMotionAllowed() {
  const reduced = useReducedMotion();
  return computed(() => !reduced.value);
}
