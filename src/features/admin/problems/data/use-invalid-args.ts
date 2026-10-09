import { computed, ref } from 'vue';
import type { Ref } from 'vue';
import type { DataForm } from './test-cases';

/** Keys of the test rows whose args box holds text that is not a JSON object, and the row numbers they show as. */
export function useInvalidArgs(form: Ref<DataForm | null>) {
  const invalidKeys = ref<number[]>([]);
  const badRowNumbers = computed(
    () =>
      form.value?.cases.flatMap((row, index) =>
        invalidKeys.value.includes(row.key) ? [index + 1] : [],
      ) ?? [],
  );

  function markInvalid(key: number, isInvalid: boolean) {
    invalidKeys.value = isInvalid
      ? [...new Set([...invalidKeys.value, key])]
      : invalidKeys.value.filter((existing) => existing !== key);
  }

  return { badRowNumbers, markInvalid };
}
