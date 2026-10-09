import { ref } from 'vue';
import { toggleDiffPick } from './diff-picks';

/** The list page's picks: kept while the viewer pages and filters, dropped when the page unmounts. */
export function useDiffPicks() {
  const picked = ref<string[]>([]);
  const toggle = (id: string) => (picked.value = toggleDiffPick(picked.value, id));
  const clear = () => (picked.value = []);
  return { picked, toggle, clear };
}
