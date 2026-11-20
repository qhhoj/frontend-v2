import { computed, ref } from 'vue';
import type { Ref } from 'vue';
import type { DataForm } from './test-cases';
import { shownRowsOf } from './test-table';

/** Keys of the table rows (tests and groups) whose args box holds text that is not a JSON object, and those rows as the table shows them. */
export function useInvalidArgs(form: Ref<DataForm | null>) {
  const invalidKeys = ref<number[]>([]);
  const badRows = computed(() =>
    form.value ? shownRowsOf(form.value.cases, invalidKeys.value) : [],
  );
  /** One number per row to fix: tests and groups each count on their own, so use `badRows` to name them. */
  const badRowNumbers = computed(() => badRows.value.map((shown) => shown.number));

  function markInvalid(key: number, isInvalid: boolean) {
    invalidKeys.value = isInvalid
      ? [...new Set([...invalidKeys.value, key])]
      : invalidKeys.value.filter((existing) => existing !== key);
  }

  return { badRows, badRowNumbers, markInvalid };
}
