import { computed, ref } from 'vue';
import type { Ref } from 'vue';
import type { DataForm } from './test-cases';
import { testNumbersOf } from './test-table';

/** Keys of the test rows whose args box holds text that is not a JSON object, and the test numbers the table shows for them. */
export function useInvalidArgs(form: Ref<DataForm | null>) {
  const invalidKeys = ref<number[]>([]);
  const badRowNumbers = computed(() =>
    form.value ? testNumbersOf(form.value.cases, invalidKeys.value) : [],
  );

  function markInvalid(key: number, isInvalid: boolean) {
    invalidKeys.value = isInvalid
      ? [...new Set([...invalidKeys.value, key])]
      : invalidKeys.value.filter((existing) => existing !== key);
  }

  return { badRowNumbers, markInvalid };
}
