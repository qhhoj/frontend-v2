import { onScopeDispose, ref } from 'vue';
import { serverNow } from './server-clock';

/** The server's time (`serverNow()`) refreshed every `intervalMs` while the calling component lives; it stands still while the tab is hidden. */
export function useNow(intervalMs = 1000) {
  const now = ref(serverNow());
  let timer: ReturnType<typeof setInterval> | undefined;
  const stop = () => {
    clearInterval(timer);
    timer = undefined;
  };
  const sync = () => {
    stop();
    if (document.hidden) return;
    now.value = serverNow();
    timer = setInterval(() => (now.value = serverNow()), intervalMs);
  };
  sync();
  document.addEventListener('visibilitychange', sync);
  onScopeDispose(() => {
    stop();
    document.removeEventListener('visibilitychange', sync);
  });
  return now;
}
