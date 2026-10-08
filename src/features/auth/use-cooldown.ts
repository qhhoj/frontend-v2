import { computed, onScopeDispose, ref } from 'vue';

/** Between two sends of the same mail. The backend allows 3 per hour per address; this only stops double clicks. */
export const RESEND_COOLDOWN_SECONDS = 60;
const SECONDS_PER_MINUTE = 60;
const TICK_MS = 1000;

/** A countdown that restarts with `start()`; its ticker stops when the owning scope ends. */
export function useCooldown(seconds = RESEND_COOLDOWN_SECONDS) {
  const remaining = ref(0);
  let ticker: ReturnType<typeof setInterval> | undefined;
  const stop = () => clearInterval(ticker);

  function start() {
    stop();
    remaining.value = seconds;
    ticker = setInterval(() => {
      remaining.value -= 1;
      if (remaining.value <= 0) stop();
    }, TICK_MS);
  }

  const coolingDown = computed(() => remaining.value > 0);
  /** `0:42`, as on the boards. */
  const remainingText = computed(() => {
    const minutes = Math.floor(remaining.value / SECONDS_PER_MINUTE);
    const secondsPart = String(remaining.value % SECONDS_PER_MINUTE).padStart(2, '0');
    return `${minutes}:${secondsPart}`;
  });
  onScopeDispose(stop);
  return { remaining, coolingDown, remainingText, start };
}
