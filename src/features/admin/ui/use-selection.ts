import { computed, ref, toValue, watch } from 'vue';
import type { MaybeRefOrGetter } from 'vue';

/**
 * Row selection for a list's bulk bar: the selectable ids of the shown page, at most `max` picked by "select page".
 * A new page of rows starts with nothing selected.
 */
export function useSelection(ids: MaybeRefOrGetter<readonly string[]>, max: number) {
  const selected = ref(new Set<string>());
  watch(
    () => toValue(ids),
    () => (selected.value = new Set()),
  );
  const allSelected = computed(
    () => toValue(ids).length > 0 && selected.value.size === Math.min(toValue(ids).length, max),
  );
  function toggleAll() {
    selected.value = allSelected.value ? new Set() : new Set(toValue(ids).slice(0, max));
  }
  function setSelected(id: string, isOn: boolean) {
    const next = new Set(selected.value);
    if (isOn) next.add(id);
    else next.delete(id);
    selected.value = next;
  }
  const clear = () => (selected.value = new Set());
  return { selected, allSelected, toggleAll, setSelected, clear };
}
