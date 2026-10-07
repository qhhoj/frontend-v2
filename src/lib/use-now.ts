import { onScopeDispose, ref } from 'vue';

/** `Date.now()` refreshed every `intervalMs` while the calling component lives. */
export function useNow(intervalMs = 1000) {
  const now = ref(Date.now());
  const timer = setInterval(() => (now.value = Date.now()), intervalMs);
  onScopeDispose(() => clearInterval(timer));
  return now;
}
