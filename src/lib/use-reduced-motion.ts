import { onScopeDispose, ref } from 'vue';

const QUERY = '(prefers-reduced-motion: reduce)';

/** Follows `prefers-reduced-motion: reduce`; false where `matchMedia` does not exist. */
export function useReducedMotion() {
  const reduced = ref(false);
  if (typeof matchMedia !== 'function') return reduced;
  const media = matchMedia(QUERY);
  reduced.value = media.matches;
  const update = () => (reduced.value = matchMedia(QUERY).matches);
  media.addEventListener('change', update);
  onScopeDispose(() => media.removeEventListener('change', update));
  return reduced;
}
