import { ref, watch } from 'vue';
import { readStorage, writeStorage } from '@/lib/storage';

/** "Gọn": the one-line 42px table rows, for scanning many rows; "Rộng": the cards with score ring and per-test strip. */
export type ListDensity = 'compact' | 'comfortable';

export const DENSITY_STORAGE_KEY = 'qhhoj.submissions.density';
const DENSITIES: readonly ListDensity[] = ['compact', 'comfortable'];
const DEFAULT_DENSITY: ListDensity = 'comfortable';

const isDensity = (value: string | null): value is ListDensity =>
  DENSITIES.includes(value as ListDensity);

/** The viewer's row density for the submission list, remembered in this browser. */
export function useListDensity() {
  const stored = readStorage(DENSITY_STORAGE_KEY);
  const density = ref<ListDensity>(isDensity(stored) ? stored : DEFAULT_DENSITY);
  watch(density, (value) => writeStorage(DENSITY_STORAGE_KEY, value));
  return density;
}
