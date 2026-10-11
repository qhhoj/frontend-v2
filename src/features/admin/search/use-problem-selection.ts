import { computed, ref } from 'vue';
import type { Ref } from 'vue';
import { MAX_BULK_CODES } from './problem-list-filters';

/** Row selection on the current page of the staff list (the bulk route takes at most 100 codes). */
export function useProblemSelection(pageCodes: Ref<string[]>) {
  const selected = ref<string[]>([]);
  const isSelected = (code: string) => selected.value.includes(code);
  const isAllSelected = computed(
    () => pageCodes.value.length > 0 && pageCodes.value.every(isSelected),
  );
  const isSomeSelected = computed(() => !isAllSelected.value && selected.value.length > 0);

  function toggle(code: string, isOn: boolean) {
    const others = selected.value.filter((item) => item !== code);
    selected.value = isOn ? [...others, code].slice(0, MAX_BULK_CODES) : others;
  }
  function toggleAll(isOn: boolean) {
    selected.value = isOn ? pageCodes.value.slice(0, MAX_BULK_CODES) : [];
  }
  const clear = () => (selected.value = []);
  return { selected, isSelected, isAllSelected, isSomeSelected, toggle, toggleAll, clear };
}
