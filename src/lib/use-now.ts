import { onScopeDispose, ref } from 'vue';

/** `Date.now()` refreshed every `intervalMs` while the calling component lives; it stands still while the tab is hidden. */
export function useNow(intervalMs = 1000) {
  const now = ref(Date.now());
  let timer: ReturnType<typeof setInterval> | undefined;
  const stop = () => {
    clearInterval(timer);
    timer = undefined;
  };
  const sync = () => {
    stop();
    if (document.hidden) return;
    now.value = Date.now();
    timer = setInterval(() => (now.value = Date.now()), intervalMs);
  };
  sync();
  document.addEventListener('visibilitychange', sync);
  onScopeDispose(() => {
    stop();
    document.removeEventListener('visibilitychange', sync);
  });
  return now;
}
