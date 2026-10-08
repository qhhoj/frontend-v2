import { onScopeDispose, ref } from 'vue';

/** Whether the device asks for less transparency; the token layer already makes surfaces solid, this lets the UI say so. */
export function useReducedTransparency() {
  const query = matchMedia('(prefers-reduced-transparency: reduce)');
  const reduced = ref(query.matches);
  const onChange = (event: { matches: boolean }) => (reduced.value = event.matches);
  query.addEventListener('change', onChange);
  onScopeDispose(() => query.removeEventListener('change', onChange));
  return reduced;
}
