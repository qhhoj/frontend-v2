import { computed, ref, watch } from 'vue';
import type { Ref } from 'vue';

/** The bulk routes take at most this many ids or keys per run. */
export const MAX_BULK_ROWS = 100;

/** Whether a checkbox `change` event left the box ticked. */
export const checked = (event: Event) => (event.target as HTMLInputElement).checked;

/**
 * Row selection on the current page of a list, capped at what one bulk run takes; `pageIds` are the rows
 * shown now. A row that leaves the page (a refetch, a filter) leaves the selection too, so nothing unseen is sent.
 */
export function useRowSelection(pageIds: Ref<string[]>) {
  const selected = ref<string[]>([]);
  watch(pageIds, (ids) => {
    const kept = selected.value.filter((id) => ids.includes(id));
    if (kept.length !== selected.value.length) selected.value = kept;
  });
  const isSelected = (id: string) => selected.value.includes(id);
  const isAllSelected = computed(() => pageIds.value.length > 0 && pageIds.value.every(isSelected));
  const isSomeSelected = computed(() => !isAllSelected.value && selected.value.length > 0);

  function toggle(id: string, isOn: boolean) {
    const others = selected.value.filter((item) => item !== id);
    selected.value = isOn ? [...others, id].slice(0, MAX_BULK_ROWS) : others;
  }
  function toggleAll(isOn: boolean) {
    selected.value = isOn ? pageIds.value.slice(0, MAX_BULK_ROWS) : [];
  }
  const clear = () => (selected.value = []);
  return { selected, isSelected, isAllSelected, isSomeSelected, toggle, toggleAll, clear };
}
